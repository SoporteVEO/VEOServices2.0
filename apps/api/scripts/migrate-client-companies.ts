/**
 * One-off: clients that have an "Empresa" become agencies named after that
 * company, and the person they were registered under becomes a contact that
 * keeps the client's old email and phone. Clients sharing a company are merged
 * into the oldest one (offers, deals, activities, tasks, messages and contacts
 * move to it) so each company ends up as a single agency.
 *
 *   npx tsx scripts/migrate-client-companies.ts            (dry run)
 *   npx tsx scripts/migrate-client-companies.ts --apply
 *
 * Safe to re-run: `company` is cleared once a client is migrated.
 */
import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, type Prisma } from '@prisma/client';

function clean(value: string | null | undefined): string | null {
  return value?.trim() || null;
}

function companyKey(company: string): string {
  return company.trim().replace(/\s+/g, ' ').toLowerCase();
}

type ClientWithContacts = Prisma.ClientGetPayload<{
  include: { crmContacts: { select: { id: true; email: true; isPrimary: true } } };
}>;

async function main() {
  const apply = process.argv.includes('--apply');
  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
  });

  const clients = await prisma.client.findMany({
    where: { company: { not: null } },
    include: { crmContacts: { select: { id: true, email: true, isPrimary: true } } },
    orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
  });

  const groups = new Map<string, ClientWithContacts[]>();
  for (const client of clients) {
    const company = clean(client.company);
    if (!company) continue;
    const key = companyKey(company);
    groups.set(key, [...(groups.get(key) ?? []), client]);
  }

  console.log(`${clients.length} cliente(s) con empresa en ${groups.size} empresa(s).\n`);

  let contactsCreated = 0;
  let clientsMerged = 0;

  for (const members of groups.values()) {
    const [survivor, ...others] = members;
    const company = clean(survivor.company)!;
    const knownEmails = new Set(
      members.flatMap((m) =>
        m.crmContacts.map((c) => c.email?.toLowerCase()).filter(Boolean),
      ),
    );
    let hasPrimary = survivor.crmContacts.some((c) => c.isPrimary);

    const newContacts = members.flatMap((member) => {
      const firstName = member.name.trim() || company;
      const email = clean(member.email);
      const phone = clean(member.contact);
      if (email && knownEmails.has(email.toLowerCase())) return [];
      if (email) knownEmails.add(email.toLowerCase());
      const isPrimary = !hasPrimary;
      hasPrimary = true;
      return [{ firstName, email, phone, isPrimary }];
    });

    console.log(
      `AGENCY "${company}"${others.length > 0 ? ` (unifica ${members.length} clientes)` : ''}`,
    );
    for (const contact of newContacts) {
      console.log(
        `  contacto: ${contact.firstName}${contact.email ? ` <${contact.email}>` : ''}${contact.phone ? ` ${contact.phone}` : ''}${contact.isPrimary ? ' (principal)' : ''}`,
      );
    }

    if (!apply) continue;

    await prisma.$transaction(async (tx) => {
      const briloCliId =
        survivor.briloCliId ?? others.find((o) => o.briloCliId)?.briloCliId ?? null;

      for (const other of others) {
        const where = { clientId: other.id };
        const data = { clientId: survivor.id };
        await tx.crmContact.updateMany({
          where: { ...where, isPrimary: true },
          data: { isPrimary: false },
        });
        await tx.crmContact.updateMany({ where, data });
        await tx.offerCreated.updateMany({ where, data });
        await tx.crmDeal.updateMany({ where, data });
        await tx.crmActivity.updateMany({ where, data });
        await tx.crmTask.updateMany({ where, data });
        await tx.crmMessage.updateMany({ where, data });
        await tx.client.delete({ where: { id: other.id } });
      }

      await tx.client.update({
        where: { id: survivor.id },
        data: { type: 'AGENCY', name: company, company: null, briloCliId },
      });
      if (newContacts.length > 0) {
        await tx.crmContact.createMany({
          data: newContacts.map((contact) => ({ ...contact, clientId: survivor.id })),
        });
      }
    });
    contactsCreated += newContacts.length;
    clientsMerged += others.length;
  }

  if (!apply) {
    console.log('\nSimulación. Vuelve a correrlo con --apply para escribir en la base.');
  } else {
    console.log(
      `\nListo: ${groups.size} agencia(s), ${contactsCreated} contacto(s) creados, ${clientsMerged} cliente(s) duplicados unificados.`,
    );
  }
  await prisma.$disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
