import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

let _auth: any;

export async function createAuth(): Promise<any> {
  if (_auth) return _auth;

  const [{ betterAuth }, { prismaAdapter }, { bearer }] = await Promise.all([
    import('better-auth'),
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
      process.env.TRUSTED_ORIGINS ?? 'http://localhost:3000'
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
      },
    },
    plugins: [bearer()],
  });

  return _auth;
}
