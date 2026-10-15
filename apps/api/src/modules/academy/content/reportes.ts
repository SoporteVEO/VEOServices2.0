import type { AcademyArticleSource } from '../academy.types.js';

export const REPORTES: AcademyArticleSource[] = [
  {
    slug: 'subir-fotos',
    title: 'Subir fotos de vallas: mensual, instalación y mantenimiento',
    category: 'reportes',
    summary:
      'Cómo subir las fotos de evidencia de cada valla y qué tipo de foto elegir.',
    tags: [
      'fotos',
      'imágenes',
      'subir imagen',
      'foto mensual',
      'foto de instalación',
      'foto de mantenimiento',
      'evidencia',
      'foto testigo',
    ],
    modules: [{ label: 'Abrir Imágenes', href: '/dashboard/images' }],
    related: ['enviar-reporte', 'produccion', 'mantenimiento'],
    body: `Los reportes que recibe el cliente se arman con las fotos de sus vallas. Por eso cada foto debe subirse con el **tipo** correcto y el **código de la valla**.

## Los tres tipos de foto

| Tipo de imagen | Cuándo se usa | Reporte que genera |
| --- | --- | --- |
| **Imagen de valla mensual** | Foto de control que se toma cada mes durante la campaña. | Reporte **mensual** |
| **Imagen de instalacion de valla** | Foto que comprueba que la lona se instaló. | Reporte de **instalación** |
| **Imagen de mantenimiento de valla** | Foto después de una reparación o limpieza. | Reporte de **mantenimiento** |

> Cuando alguien habla de "enviar el mensual, el de instalación o el de mantenimiento", se refiere a estos **reportes de fotos**, no a contratos distintos. El contrato es siempre el mismo; lo que cambia es el tipo de reporte.

## Subir una foto

1. Abre **Imágenes** y haz clic en **Subir imagen**.
2. En la ventana **Subir nueva imagen**, elige el archivo.
3. Elige el **Tipo de imagen**.
4. Escribe el **Código de valla estática** (por ejemplo, *SS-0142*).
5. Haz clic en **Subir imagen**.

[Abrir Imágenes](app:/dashboard/images)

> **Fotos de instalación:** normalmente las sube el **instalador** desde su portal (escaneando el código QR de la orden de producción). Ver [Órdenes de producción e instalación](academy:produccion#instalacion-en-sitio).

## Si el código quedó mal

Si subiste una foto con el código equivocado, búscala en Imágenes y corrige el código. Si no, la foto no aparecerá en el reporte del contrato correcto.

## Siguiente paso

Con las fotos listas, [envía el reporte al cliente](academy:enviar-reporte).`,
  },
  {
    slug: 'enviar-reporte',
    title: 'Enviar reportes a clientes',
    category: 'reportes',
    summary:
      'Genera el reporte en PDF con las fotos de un contrato y envíalo por correo al cliente.',
    tags: [
      'reporte',
      'reporte mensual',
      'reporte de instalación',
      'reporte de mantenimiento',
      'enviar reporte',
      'pdf',
      'enviar mensual',
    ],
    modules: [
      { label: 'Abrir Testigos', href: '/dashboard/reports' },
      { label: 'Abrir Mis contratos', href: '/dashboard/my-space/contracts' },
    ],
    related: ['subir-fotos', 'contratos-por-vencer', 'despues-de-la-venta'],
    body: `Cada mes (y cuando se instala o se repara una valla) el cliente debe recibir un reporte con las fotos de sus vallas. El reporte se genera en **PDF** y se envía por correo desde la plataforma.

## Antes de empezar

Las fotos del mes ya deben estar subidas con el código de valla correcto. Ver [Subir fotos de vallas](academy:subir-fotos).

## Paso a paso

1. Abre **Testigos**.
2. En **Mes del reporte**, elige el mes.
3. Busca el contrato en la tabla. Verás el **Contrato**, la persona de **Atención**, el **Cliente**, las **Vallas**, cuántas **Imágenes** hay, los **Reportes enviados** y el **Vencimiento**.
4. Haz clic en la fila del contrato. Se abre el panel con sus vallas y fotos.
5. **Toca una imagen para incluirla en el reporte**. Elige las fotos que quieres mostrar.
6. Haz clic en **Generar reporte**.
7. En la ventana **Enviar reporte por email**, revisa el **Correo del destinatario**.
8. Haz clic en **Enviar reporte**.

[Abrir Testigos](app:/dashboard/reports)

## Qué recibe el cliente

Un correo con el asunto *Reporte de Vallas - Contrato CON… (periodo)* y el archivo **PDF** adjunto: portada, resumen, una página por valla con su foto, dirección y ubicación en mapa, y las páginas sobre VEO.

## Mensual, instalación o mantenimiento

No hay que elegir el tipo de reporte: **depende de las fotos que selecciones**. Si eliges fotos mensuales, sale un reporte mensual; si eliges fotos de instalación, sale el de instalación, y lo mismo con mantenimiento.

## Desde Mis contratos

Si eres el ejecutivo del contrato, también puedes hacerlo desde **Mi Espacio → Mis contratos**: haz clic en el contrato y se abre el mismo panel.

[Abrir Mis contratos](app:/dashboard/my-space/contracts)

> **¿No aparece el contrato?** En Brilo debe estar **posteado** y no anulado. Ver [El contrato en Brilo](academy:contrato-en-brilo).`,
  },
  {
    slug: 'contratos-por-vencer',
    title: 'Contratos por vencer y avisos automáticos',
    category: 'reportes',
    summary:
      'Qué contratos terminan pronto, qué aviso recibe el cliente y cómo revisarlo.',
    tags: [
      'contratos',
      'vencimiento',
      'por vencer',
      'notificados',
      'aviso',
      'renovación',
      'contrato vence',
    ],
    modules: [{ label: 'Abrir Contratos', href: '/dashboard/contracts' }],
    related: ['crm-renovaciones', 'enviar-reporte', 'proceso-de-venta'],
    body: `El módulo **Contratos** te ayuda a no dejar pasar el final de un contrato.

## Contratos por vencer

La pestaña **Contratos por vencer** muestra los contratos que terminan en los **próximos 15 días**, con su cliente, vallas y fecha de vencimiento.

[Abrir Contratos](app:/dashboard/contracts)

## Avisos automáticos al cliente

La plataforma envía sola al cliente un correo de **Contrato por vencer** cuando su contrato está por terminar. En la pestaña **Notificados** ves a quién se le avisó y el estado del envío:

| Estado | Significado |
| --- | --- |
| **Enviado** | El correo salió correctamente. |
| **Fallido** | No se pudo enviar. Revisa el correo del cliente. |
| **Pendiente** | Está en cola para enviarse. |

## Ofrece la renovación

El aviso automático no reemplaza tu seguimiento. Usa [Renovaciones en el CRM](academy:crm-renovaciones) para crear el negocio de renovación con las mismas vallas y fechas siguientes, y contacta al cliente antes de que el espacio se libere.

[Abrir Renovaciones](app:/dashboard/crm/renovaciones)`,
  },
];
