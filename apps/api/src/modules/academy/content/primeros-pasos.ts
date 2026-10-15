import type { AcademyArticleSource } from '../academy.types.js';

export const PRIMEROS_PASOS: AcademyArticleSource[] = [
  {
    slug: 'bienvenida',
    title: 'Bienvenido a VEO Academy',
    category: 'primeros-pasos',
    summary:
      'Qué es VEO Academy, cómo leer las guías y por dónde empezar según tu puesto.',
    tags: ['inicio', 'academia', 'ayuda', 'guía', 'cómo empezar'],
    related: ['conoce-veo-services', 'proceso-de-venta', 'nexo'],
    body: `VEO Academy es el centro de aprendizaje de **VEO Services**. Aquí encontrarás guías cortas, paso a paso, para hacer tu trabajo diario en la plataforma: cotizar, cerrar ventas, enviar reportes a clientes y dar seguimiento a tus negocios.

## Cómo usar las guías

- Las **palabras subrayadas** son enlaces. Haz clic en ellas y te llevarán a la guía o a la sección que explica ese tema. Por ejemplo: [cotización](academy:glosario#cotizacion) o [contrato en Brilo](academy:contrato-en-brilo).
- Los **botones con flecha** te llevan directo al módulo de la plataforma donde se hace lo que estás leyendo. Pruébalo: [Abrir Mi Espacio](app:/dashboard/my-space).
- En pantallas grandes, a la derecha verás el **índice** de la guía para saltar a cualquier sección.
- Al final de cada guía hay **guías relacionadas** y botones para seguir con la siguiente.

## ¿Por dónde empiezo?

| Si eres… | Empieza por |
| --- | --- |
| Ejecutivo de ventas | [El proceso de venta paso a paso](academy:proceso-de-venta) y luego el [CRM](academy:crm-introduccion). |
| Encargado de reportes o fotos | [Subir fotos de vallas](academy:subir-fotos) y [Enviar reportes a clientes](academy:enviar-reporte). |
| Producción o instalación | [Órdenes de producción e instalación](academy:produccion). |
| Pantallas digitales | [Pantallas digitales: campañas y ocupación](academy:pantallas). |
| Mantenimiento | [Mantenimiento de vallas y flota](academy:mantenimiento). |
| Nuevo en VEO | [Conoce VEO Services](academy:conoce-veo-services) y el [glosario](academy:glosario). |

## Pregúntale a Nexo

Si no encuentras algo, abre a **Nexo**, el asistente de la plataforma (botón arriba a la derecha o **Ctrl + I**) y pregúntale con tus palabras, por ejemplo: *"¿Cómo envío el reporte mensual de un contrato?"*. Nexo lee esta misma academia para responderte y te comparte el enlace a la guía. Más detalles en [Nexo, tu asistente](academy:nexo).

> **Consejo:** usa el buscador de la página principal de la Academy. Busca por lo que quieres hacer ("enviar reporte", "reservar valla", "aceptar cotización").`,
  },
  {
    slug: 'conoce-veo-services',
    title: 'Conoce VEO Services: los módulos de la plataforma',
    category: 'primeros-pasos',
    summary:
      'Un recorrido por cada módulo del menú y para qué sirve, con acceso directo a cada uno.',
    tags: [
      'módulos',
      'menú',
      'plataforma',
      'navegación',
      'qué hace cada módulo',
    ],
    related: ['mi-espacio', 'proceso-de-venta', 'glosario'],
    body: `VEO es una empresa de publicidad exterior en El Salvador. Vendemos espacios en **vallas estáticas** ([OOH](academy:glosario#ooh)) y en **pantallas digitales LED** ([DOOH](academy:glosario#dooh)). VEO Services es la plataforma interna donde se cotiza, se da seguimiento a los contratos, se coordina la producción e instalación y se envían reportes a los clientes.

## Cómo está organizado el menú

El menú de la izquierda muestra solo los módulos a los que tienes permiso. Si necesitas uno que no ves, pide acceso a un administrador.

### Mi Espacio
Tu escritorio personal: tus cotizaciones, contratos, órdenes y facturas como vendedor. Ver [Mi Espacio](academy:mi-espacio).

[Abrir Mi Espacio](app:/dashboard/my-space)

### VEO Academy
Estas guías.

### Testigos
Contratos activos del mes, con las fotos de cada valla, para generar y enviar el reporte al cliente. Ver [Enviar reportes a clientes](academy:enviar-reporte).

[Abrir Testigos](app:/dashboard/reports)

### Contratos
Lista de contratos de Brilo que **vencen en los próximos 15 días** y el historial de avisos de vencimiento enviados. Ver [Contratos por vencer](academy:contratos-por-vencer).

[Abrir Contratos](app:/dashboard/contracts)

### Pantallas
Ocupación de las pantallas digitales, campañas, sublistas y órdenes de pauta. Ver [Pantallas digitales](academy:pantallas).

### Vallas estáticas
Inventario de vallas con su disponibilidad por fechas. Desde aquí se genera la [cotización de vallas](academy:crear-cotizacion-vallas).

[Abrir Vallas estáticas](app:/dashboard/static-billboards)

### Imágenes
Galería de fotos de vallas (mensuales, de instalación y de mantenimiento). Ver [Subir fotos de vallas](academy:subir-fotos).

[Abrir Imágenes](app:/dashboard/images)

### Clientes (dentro del CRM)
Registro de clientes **directos** y **agencias** usados en las cotizaciones, con su información, contratos en Brilo, negocios y actividad. Está en **CRM → Clientes**. Ver [Registrar un cliente](academy:crear-cliente).

[Abrir Clientes](app:/dashboard/crm/clientes)

### Producción y Mantenimiento
Órdenes de producción, calendario de impresión e instalación; órdenes de mantenimiento de vallas y la flota de vehículos. Ver [Producción](academy:produccion) y [Mantenimiento](academy:mantenimiento).

### CRM (Ventas)
El seguimiento comercial: pipeline de negocios, reservas de sitios, renovaciones, correos y WhatsApp. Ver [CRM de Ventas](academy:crm-introduccion).

### Tienda
La tienda en línea pública y las órdenes recibidas. Ver [Tienda en línea](academy:tienda-en-linea).

## Dos sistemas: VEO Services y Brilo

VEO trabaja con dos sistemas que se complementan:

- **VEO Services** (esta plataforma): cotizaciones, fotos, reportes, producción, CRM.
- **Brilo** (el ERP): clientes de facturación, **contratos oficiales**, facturas y cobros.

Al aceptar una cotización con vallas estáticas, VEO Services **crea sola** la cotización y el contrato en Brilo para la facturación. Trabajas en VEO Services y Brilo se mantiene al día. Ver [El contrato en Brilo](academy:contrato-en-brilo).`,
  },
  {
    slug: 'mi-espacio',
    title: 'Mi Espacio: tu escritorio personal',
    category: 'primeros-pasos',
    summary:
      'Tus números, cotizaciones, contratos, órdenes de producción y facturación en un solo lugar.',
    tags: [
      'mi espacio',
      'resumen',
      'mis cotizaciones',
      'mis contratos',
      'mis órdenes',
      'mis facturas',
    ],
    modules: [{ label: 'Abrir Mi Espacio', href: '/dashboard/my-space' }],
    related: ['crear-cotizacion-mixta', 'aceptar-cotizacion', 'enviar-reporte'],
    body: `**Mi Espacio** reúne todo lo que está a tu nombre como vendedor. Tiene cinco secciones:

## Mi Resumen

Tus indicadores: cotizaciones por estado (pendientes, aceptadas, rechazadas), tendencias y reportes enviados. Puedes cambiar el rango de fechas arriba a la derecha.

[Abrir Mi Resumen](app:/dashboard/my-space)

## Mis cotizaciones

La lista de tus [cotizaciones](academy:glosario#cotizacion). Desde aquí:

- **Generar Cotización** con vallas, pantallas y conceptos adicionales. Ver [Cotizar pantallas y conceptos adicionales](academy:crear-cotizacion-mixta).
- Marcar una cotización como **Aceptada** o **Rechazada**. Ver [Aceptar la cotización](academy:aceptar-cotizacion).
- **Descargar** el PDF de la cotización o el **Contrato** de una cotización aceptada.
- Hacer clic en una fila para ver el detalle, editarla (solo si sigue pendiente) y ver su historial.

Puedes buscar por número, cliente o correo.

[Abrir Mis cotizaciones](app:/dashboard/my-space/offers)

## Mis contratos

Tus contratos vigentes en Brilo con las fotos de cada valla. Haz clic en uno para abrir el panel de reporte y enviarlo al cliente. Ver [Enviar reportes a clientes](academy:enviar-reporte).

[Abrir Mis contratos](app:/dashboard/my-space/contracts)

## Mis órdenes

Las [órdenes de producción](academy:glosario#orden-de-produccion) que nacieron de tus cotizaciones aceptadas. Ábrelas para cargar el **arte** de cada valla y ver en qué estado va la impresión y la instalación. Ver [Arte de cada valla](academy:produccion#arte-de-cada-valla).

[Abrir Mis órdenes](app:/dashboard/my-space/production-orders)

## Mis facturas

La facturación registrada en Brilo bajo tu nombre como vendedor, por centro de costo, tipo de venta y cliente. Puedes exportarla o generar un reporte. Ver [Mis facturas y cuentas por cobrar](academy:facturacion-y-cxc).

[Abrir Mis facturas](app:/dashboard/my-space/invoices)

> **Para administradores:** pueden "ver como" otro usuario para revisar su Mi Espacio. En ese modo los botones que modifican datos se ocultan.`,
  },
  {
    slug: 'nexo',
    title: 'Nexo, tu asistente',
    category: 'primeros-pasos',
    summary:
      'Qué puede hacer Nexo, cómo preguntarle y cómo usa VEO Academy para responderte.',
    tags: ['nexo', 'asistente', 'ia', 'chat', 'ayuda', 'preguntar'],
    related: ['bienvenida', 'enviar-reporte', 'proceso-de-venta'],
    body: `**Nexo** es el asistente inteligente de VEO Services. Lo abres con el botón de Nexo arriba a la derecha o con **Ctrl + I**.

## Qué puede hacer

- **Responder cómo se hace algo** en la plataforma. Para eso lee VEO Academy y te deja el enlace a la guía para que la consultes completa.
- **Buscar datos reales**: ventas del mes, cotizaciones, contratos, clientes, disponibilidad de vallas, fotos.
- **Generar reportes y archivos**: reporte de disponibilidad, reporte mensual de un contrato, Excel o PDF.
- **Enviar correos** y hacer acciones, siempre pidiéndote aprobación antes.

Nexo solo te muestra información de los módulos a los que tienes acceso.

## Cómo preguntarle

Escribe como le hablarías a un compañero:

- *"¿Cuáles son los pasos para cerrar una venta?"*
- *"¿Cómo envío el reporte de instalación al cliente?"*
- *"¿Qué vallas tengo disponibles en San Salvador en diciembre?"*
- *"¿Cuánto vendí este mes?"*

Si la respuesta no es lo que buscabas, dile qué entendió mal. Nexo aprende de tus correcciones.

> **Importante:** Nexo nunca inventa datos. Si no encuentra la información, te lo dirá.`,
  },
];
