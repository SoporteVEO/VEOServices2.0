import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

let _auth: any;

export async function createAuth(): Promise<any> {
  if (_auth) return _auth;

  const [{ betterAuth }, { APIError }, { prismaAdapter }, { bearer }] =
    await Promise.all([
      import('better-auth'),
      import('better-auth/api'),
      import('better-auth/adapters/prisma'),
      import('better-auth/plugins'),
    ]);

  const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL,
  });
  const prisma = new PrismaClient({ adapter });

  _auth = betterAuth({
    database: prismaAdapter(prisma, { provider: 'postgresql' }),
    basePath: '/api/auth',
    trustedOrigins: (
      process.env.TRUSTED_ORIGINS ??
      'http://localhost:3000,https://app.veo.com.sv'
    ).split(','),
    emailAndPassword: {
      enabled: true,
    },
    user: {
      fields: {
        name: 'firstName',
      },
      additionalFields: {
        lastName: {
          type: 'string' as const,
          required: false,
        },
        role: {
          type: 'string' as const,
          required: false,
          input: false,
        },
        subRoles: {
          type: 'string[]' as const,
          required: false,
          input: false,
        },
        disabled: {
          type: 'boolean' as const,
          required: false,
          input: false,
          defaultValue: false,
        },
        lastLoginAt: {
          type: 'date' as const,
          required: false,
          input: false,
        },
      },
    },
    databaseHooks: {
      session: {
        create: {
          before: async (session: Record<string, unknown>) => {
            const userId = session.userId as string;
            const user = await prisma.user.findUnique({
              where: { id: userId },
              select: { disabled: true },
            });
            if (user?.disabled) {
              throw new APIError('FORBIDDEN', {
                message: 'La cuenta está deshabilitada',
              });
            }
          },
          after: async (session: Record<string, unknown>) => {
            const userId = session.userId as string;
            await prisma.user.update({
              where: { id: userId },
              data: { lastLoginAt: new Date() },
            });
          },
        },
      },
    },
    plugins: [bearer()],
  });

  return _auth;
}
