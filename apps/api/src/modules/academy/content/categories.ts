import type { AcademyCategory } from '../academy.types.js';

export const ACADEMY_CATEGORIES: AcademyCategory[] = [
  {
    id: 'primeros-pasos',
    title: 'Primeros pasos',
    description: 'Conoce la plataforma, tu espacio personal y a Nexo.',
    icon: 'rocket',
  },
  {
    id: 'proceso-de-venta',
    title: 'Proceso de venta',
    description:
      'De la cotización al contrato firmado: cada paso para cerrar una venta.',
    icon: 'handshake',
  },
  {
    id: 'reportes',
    title: 'Reportes a clientes',
    description:
      'Fotos de vallas y reportes mensuales, de instalación y de mantenimiento.',
    icon: 'file-image',
  },
  {
    id: 'operacion',
    title: 'Operación',
    description:
      'Producción, instalación, pantallas digitales, mantenimiento de vallas y pantallas, y tienda.',
    icon: 'factory',
  },
  {
    id: 'finanzas',
    title: 'Finanzas',
    description:
      'Contabilidad, bancos, cuentas por cobrar y facturación conectados a Brilo.',
    icon: 'landmark',
  },
  {
    id: 'crm',
    title: 'CRM de Ventas',
    description:
      'Pipeline, reservas de sitios, renovaciones, correos y WhatsApp.',
    icon: 'kanban',
  },
  {
    id: 'referencia',
    title: 'Referencia',
    description: 'Glosario de términos y preguntas frecuentes.',
    icon: 'book',
  },
];
