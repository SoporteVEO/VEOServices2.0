import { describeError } from './agent-diagnostics.js';
import type { AgentIssueReport } from './tools/index.js';

const TRANSIENT_STATUSES = new Set([429, 503, 529]);

interface ProviderFailure {
  statusCode?: number;
  lastError?: unknown;
}

function rootError(error: unknown): unknown {
  return (error as ProviderFailure | null)?.lastError ?? error;
}

function providerStatus(error: unknown): number | undefined {
  return (rootError(error) as ProviderFailure | null)?.statusCode;
}

export function toUserError(error: unknown): string {
  const status = providerStatus(error);
  if (status === 404) {
    return 'El modelo de IA configurado no existe para el proveedor activo. Revisa AGENT_MODEL.';
  }
  if (status === 400 || status === 401 || status === 403) {
    return 'La clave o configuración del proveedor de IA no es válida.';
  }
  if (status === 429) {
    return 'Se alcanzó el límite de solicitudes del proveedor de IA. Espera un minuto e intenta de nuevo.';
  }
  if (status === 529 || status === 503) {
    return 'El proveedor de IA no está disponible en este momento.';
  }
  return 'Ocurrió un error con Nexo. Intenta de nuevo.';
}

/**
 * A failed model call never reaches the model, so it cannot call
 * `report_issue` itself. Rate limits and outages are not filed.
 */
export function providerErrorReport(
  error: unknown,
  { question, threadId }: { question: string; threadId: string },
): AgentIssueReport | null {
  const status = providerStatus(error);
  if (status !== undefined && TRANSIENT_STATUSES.has(status)) return null;
  const details = describeError(rootError(error));
  return {
    title: `Error del proveedor de IA${status ? ` (${status})` : ''}`,
    severity: 'HIGH',
    summary: toUserError(error),
    userRequest: question || '(sin texto)',
    technicalDetails: JSON.stringify(details, null, 2),
    stepsToReproduce: [
      `Abrir la conversación ${threadId}.`,
      `Enviar: "${question}"`,
    ],
  };
}
