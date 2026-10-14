import { IMAGES_MODULE_ROLES } from '../auth/field-roles.js';

/**
 * What the assistant may reach on behalf of a user. Mirrors the module access
 * rules of the dashboard (apps/web/src/lib/routes.ts) so the agent never sees
 * more than the sidebar would show. API paths not claimed by any scope are
 * denied, so a new controller stays invisible to the agent until listed here.
 */
export interface AgentScope {
  key: AgentScopeKey;
  label: string;
  description: string;
  allowedRoles?: string[];
  requiredSubRoles?: string[];
  pathPrefixes: string[];
}

export type AgentScopeKey =
  | 'account'
  | 'dashboard'
  | 'analytics'
  | 'my_space'
  | 'contracts'
  | 'pantallas'
  | 'static_billboards'
  | 'images'
  | 'clients'
  | 'hr'
  | 'production'
  | 'maintenance'
  | 'shop'
  | 'recovery'
  | 'users'
  | 'email'
  | 'erp_sql'
  | 'development';

export interface AgentUser {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  role: string;
  subRoles: string[];
}

const DEFAULT_ALLOWED_ROLES = ['ADMIN', 'USER'];
const EVERYONE = [
  'ADMIN',
  'USER',
  'LIMITED',
  'INSTALLER',
  'WORKER',
  'MANTENIMIENTO',
  'INSTALLER_MANTENIMIENTO',
];

export const AGENT_SCOPES: AgentScope[] = [
  {
    key: 'account',
    label: 'Mi cuenta',
    description: 'Own profile and notifications.',
    allowedRoles: EVERYONE,
    pathPrefixes: ['/me', '/notifications'],
  },
  {
    key: 'dashboard',
    label: 'Dashboard',
    description:
      'Billboard analytics: estimated revenue, top billboards and clients, occupancy by department.',
    allowedRoles: ['ADMIN'],
    pathPrefixes: ['/billboards/dashboard'],
  },
  {
    key: 'analytics',
    label: 'Analíticas',
    description:
      'App usage per user, sales by cost center, offers, reports and printing.',
    allowedRoles: ['ADMIN'],
    pathPrefixes: ['/analytics'],
  },
  {
    key: 'my_space',
    label: 'Mi Espacio',
    description: "The user's own offers and own sales by cost center.",
    allowedRoles: ['ADMIN', 'USER'],
    pathPrefixes: ['/offers', '/analytics/sales-by-cost-center/mine'],
  },
  {
    key: 'contracts',
    label: 'Contratos y Reportes',
    description:
      'Active contracts, expiring contracts and sent maintenance reports.',
    pathPrefixes: ['/contracts'],
  },
  {
    key: 'pantallas',
    label: 'Pantallas',
    description: 'Digital screens (DOOH), campaigns, playlists and capacity.',
    allowedRoles: [],
    requiredSubRoles: ['PANTALLAS_PRODUCCION', 'PANTALLAS_COMERCIAL'],
    pathPrefixes: ['/pantallas', '/digital-billboards'],
  },
  {
    key: 'static_billboards',
    label: 'Vallas estáticas',
    description:
      'Static billboard inventory and availability, contract history per billboard and the availability report.',
    pathPrefixes: ['/billboards'],
  },
  {
    key: 'images',
    label: 'Imágenes',
    description:
      'Billboard photos (monthly, installation and maintenance) and billboard codes.',
    allowedRoles: ['ADMIN', 'USER', 'LIMITED', ...IMAGES_MODULE_ROLES],
    pathPrefixes: ['/s3-images', '/static-billboard-codes'],
  },
  {
    key: 'clients',
    label: 'Clientes',
    description: 'Registered clients.',
    allowedRoles: ['ADMIN', 'USER'],
    pathPrefixes: ['/clients'],
  },
  {
    key: 'hr',
    label: 'Recursos Humanos',
    description: 'Team members and medical leaves.',
    allowedRoles: [],
    requiredSubRoles: ['HR'],
    pathPrefixes: ['/team-members', '/absences'],
  },
  {
    key: 'production',
    label: 'Producción',
    description: 'Production orders, printing and installations.',
    allowedRoles: [],
    requiredSubRoles: ['PRODUCTION'],
    pathPrefixes: ['/production-orders', '/printing', '/installations'],
  },
  {
    key: 'maintenance',
    label: 'Mantenimiento',
    description: 'Billboard and vehicle fleet maintenance.',
    allowedRoles: [],
    requiredSubRoles: ['MANTENIMIENTO'],
    pathPrefixes: ['/maintenance', '/fleet'],
  },
  {
    key: 'shop',
    label: 'Tienda y Órdenes',
    description: 'E-commerce and purchase orders.',
    pathPrefixes: ['/shop', '/purchases'],
  },
  {
    key: 'recovery',
    label: 'CxC',
    description: 'Accounts receivable collections and catalogs (Brilo WebAPI).',
    allowedRoles: ['ADMIN'],
    pathPrefixes: ['/brilo-webapi'],
  },
  {
    key: 'users',
    label: 'Usuarios',
    description: 'System user administration.',
    allowedRoles: [],
    requiredSubRoles: ['USERS_MANAGEMENT'],
    pathPrefixes: ['/users'],
  },
  {
    key: 'email',
    label: 'Envío de correos',
    description: 'Send emails from the VEO system.',
    allowedRoles: ['ADMIN', 'USER'],
    pathPrefixes: [],
  },
  {
    key: 'erp_sql',
    label: 'Consultas al ERP Brilo',
    description:
      'Read-only queries on the Brilo ERP database (sales, invoices, contracts).',
    allowedRoles: ['ADMIN', 'USER'],
    pathPrefixes: [],
  },
  {
    key: 'development',
    label: 'Desarrollo',
    description:
      'Bug tickets Nexo filed for the dev team (list, details, status updates), and Nexo lessons and answer ratings to review.',
    allowedRoles: [],
    requiredSubRoles: ['DESARROLLADOR'],
    pathPrefixes: ['/development'],
  },
];

export function canAccessScope(scope: AgentScope, user: AgentUser): boolean {
  const allowedRoles = scope.allowedRoles ?? DEFAULT_ALLOWED_ROLES;
  if (allowedRoles.includes(user.role)) return true;
  return (
    scope.requiredSubRoles?.some((sr) => user.subRoles.includes(sr)) ?? false
  );
}

export function hasScope(user: AgentUser, key: AgentScopeKey): boolean {
  const scope = AGENT_SCOPES.find((s) => s.key === key);
  return scope ? canAccessScope(scope, user) : false;
}

export function partitionScopes(user: AgentUser): {
  allowed: AgentScope[];
  denied: AgentScope[];
} {
  const allowed: AgentScope[] = [];
  const denied: AgentScope[] = [];
  for (const scope of AGENT_SCOPES) {
    (canAccessScope(scope, user) ? allowed : denied).push(scope);
  }
  return { allowed, denied };
}

/**
 * The longest matching prefix owns a path, so `/billboards/dashboard/*` belongs
 * to the admin dashboard even though `/billboards` is open to sales.
 */
export function findScopeForPath(path: string): AgentScope | undefined {
  let best: { scope: AgentScope; length: number } | undefined;
  for (const scope of AGENT_SCOPES) {
    for (const prefix of scope.pathPrefixes) {
      const matches = path === prefix || path.startsWith(`${prefix}/`);
      if (matches && (!best || prefix.length > best.length)) {
        best = { scope, length: prefix.length };
      }
    }
  }
  return best?.scope;
}

export function toAgentUser(raw: Record<string, unknown>): AgentUser {
  return {
    id: raw.id as string,
    email: (raw.email as string | undefined) ?? '',
    firstName: (raw.firstName as string | null | undefined) ?? null,
    lastName: (raw.lastName as string | null | undefined) ?? null,
    role: (raw.role as string | undefined) ?? 'USER',
    subRoles: Array.isArray(raw.subRoles) ? (raw.subRoles as string[]) : [],
  };
}
