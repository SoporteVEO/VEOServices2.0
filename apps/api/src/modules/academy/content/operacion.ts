import type { AcademyArticleSource } from '../academy.types.js';

export const OPERACION: AcademyArticleSource[] = [
  {
    slug: 'produccion',
    title: 'Órdenes de producción e instalación',
    category: 'operacion',
    summary:
      'Cómo se imprime e instala una valla vendida: órdenes, arte de cada valla, calendario de impresión e instalación en sitio.',
    tags: [
      'producción',
      'orden de producción',
      'arte',
      'cargar arte',
      'diseño',
      'impresión',
      'lona',
      'instalación',
      'instalador',
      'calendario',
      'qr',
    ],
    modules: [
      { label: 'Abrir Producción', href: '/dashboard/production' },
      {
        label: 'Abrir Mis órdenes',
        href: '/dashboard/my-space/production-orders',
      },
    ],
    related: ['despues-de-la-venta', 'subir-fotos', 'aceptar-cotizacion'],
    body: `Cada venta de vallas termina en una [orden de producción](academy:glosario#orden-de-produccion): imprimir la lona e instalarla en la valla.

## Cómo nace una orden

- **Automática**: al [aceptar una cotización](academy:aceptar-cotizacion) con vallas, se crea la orden con el mismo número de la cotización y Producción recibe una notificación.
- **Manual**: en **Producción**, con el botón **Nueva orden** (por ejemplo, para un cambio de arte). Agrega las vallas y, si ya lo tienes, carga el **arte** de cada una en el mismo formulario.

[Abrir Producción](app:/dashboard/production)

## Arte de cada valla

Cada valla de la orden lleva **un solo archivo: su arte**, que es lo que Producción imprime.

- **Quién lo carga**: el vendedor, desde **Mi Espacio → Mis órdenes**. En las órdenes manuales lo carga Producción.
- **Cómo**: abre la orden, busca la valla y arrastra el archivo al recuadro **Cargar arte** (o haz clic para elegirlo). Con **Reemplazar** subes una versión nueva y con **Eliminar** lo quitas.
- **Formatos**: JPG, PNG, WEBP, TIFF o PDF, de hasta 100 MB.

Producción ve el arte de cada valla en el detalle de la orden: una miniatura, el botón **Ver** para abrirlo en grande y **Descargar** para obtener el archivo original con su nombre.

> Antes se pedían una *orden de producción* y una *orden de diseño* en PDF por valla. Ya no se usan: ahora solo se carga el arte. En órdenes antiguas, esos PDF siguen disponibles en **Documentos anteriores**.

## Pestaña Órdenes

Lista todas las órdenes con su cliente y sus vallas. Cada valla de la orden tiene su estado:

| Estado | Significado |
| --- | --- |
| **Recibida** | La orden llegó a Producción. |
| **En producción** | Se está diseñando o imprimiendo. |
| **Completada** | Lista e instalada. |
| **Cancelada** | Ya no se hará. |

## Instalación en sitio

Dentro de la orden, en la sección **Instalación en sitio**, se asigna el **instalador**, el **vulcanizador** y la **fecha programada**.

El instalador abre su portal escaneando el **código QR** de la orden y desde ahí sube las **fotos de instalación**. Esas fotos son las que luego se usan para el [reporte de instalación](academy:enviar-reporte).

## Pestaña Calendario

Muestra los trabajos de impresión agendados por día. Cada trabajo pasa por estos estados: **Agendado**, **En set up**, **Imprimiendo**, **En cooldown**, **Finalizado** o **Cancelado**.

## Para vendedores

No necesitas entrar a Producción. En **Mi Espacio → Mis órdenes** carga el [arte de cada valla](#arte-de-cada-valla) y revisa el avance de tus ventas; también lo ves en la pestaña **Ejecución** del negocio en el [CRM](academy:crm-negocios#ver-la-ejecucion-de-la-campana).

[Abrir Mis órdenes](app:/dashboard/my-space/production-orders)`,
  },
  {
    slug: 'pantallas',
    title: 'Pantallas digitales: campañas y ocupación',
    category: 'operacion',
    summary:
      'Cómo se registran y controlan las campañas en las pantallas LED y cómo leer su ocupación.',
    tags: [
      'pantallas',
      'digital',
      'dooh',
      'led',
      'campaña',
      'spots',
      'ocupación',
      'arte',
      'OP',
    ],
    modules: [{ label: 'Abrir Pantallas', href: '/dashboard/pantallas' }],
    related: [
      'crear-cotizacion-mixta',
      'crm-disponibilidad',
      'despues-de-la-venta',
    ],
    body: `El módulo **Pantallas** controla qué campañas están al aire en cada pantalla LED ([DOOH](academy:glosario#dooh)) y cuánto espacio queda libre.

## Cómo está organizado

- **Resumen**: la ocupación general de todas las pantallas.
- **Una pestaña por pantalla**: sus campañas, fechas y spots.
- **Buscar**: encuentra campañas por cliente o nombre.

Arriba están los botones **Ingresar OP**, **Reporte OP**, **Exportar Excel** y **Nueva pantalla**.

[Abrir Pantallas](app:/dashboard/pantallas)

## Cómo llegan las campañas

- **Automáticas**: al [aceptar una cotización](academy:aceptar-cotizacion) que incluye pantallas, cada pantalla queda con su campaña programada.
- **Manuales**: con el formulario de campaña, llenando **Cliente**, **Campaña**, fechas, **Sublista**, **Spots por día (frecuencia)**, **Estado del arte** y los valores.

## Spots y capacidad

Cada pantalla tiene un número máximo de [spots por día](academy:glosario#spots-por-dia). Una campaña nueva solo cabe si quedan spots libres en sus fechas. Si no hay cupo, baja los spots o cambia las fechas.

> Para vender, consulta la disponibilidad en el [CRM](academy:crm-disponibilidad), que suma las campañas existentes y las reservas de otros vendedores.

## Estado del arte

Indica en qué punto está el arte del cliente: **Arte recibido**, **Arte en aprobación** o **Sin arte**. Una campaña no debería salir al aire sin arte aprobado.

## Cotizar pantallas

Las cotizaciones de pantallas se hacen desde **Mis cotizaciones**, no desde este módulo. Ver [Cotizar pantallas digitales](academy:crear-cotizacion-mixta).`,
  },
  {
    slug: 'mantenimiento',
    title: 'Mantenimiento de vallas y flota',
    category: 'operacion',
    summary:
      'Órdenes de mantenimiento para las vallas y control de servicios de los vehículos.',
    tags: [
      'mantenimiento',
      'reparación',
      'orden de mantenimiento',
      'flota',
      'vehículos',
      'preventivo',
      'correctivo',
    ],
    modules: [
      { label: 'Abrir Mantenimiento', href: '/dashboard/mantenimiento' },
      { label: 'Abrir Flota', href: '/dashboard/mantenimiento/flota' },
    ],
    related: ['subir-fotos', 'enviar-reporte', 'produccion'],
    body: `## Mantenimiento de vallas

En **Mantenimiento** se asignan y siguen los trabajos de reparación y limpieza de las estructuras. Tiene tres pestañas: **Órdenes**, **Categorías** y **Resumen**.

Para crear un trabajo, haz clic en **Nueva orden de mantenimiento**. Cada orden pasa por estos estados:

| Estado | Significado |
| --- | --- |
| **Pendiente** | Asignada, aún no inicia. |
| **En proceso** | El equipo está trabajando. |
| **Finalizada** | Trabajo terminado. |
| **Cancelada** | Ya no se hará. |

[Abrir Mantenimiento](app:/dashboard/mantenimiento)

> Cuando se termina un mantenimiento en una valla con cliente, sube la foto como **Imagen de mantenimiento de valla** y envía el reporte. Ver [Subir fotos](academy:subir-fotos) y [Enviar reportes](academy:enviar-reporte).

## Flota

En **Flota** se registran los vehículos de la empresa (botón **Nuevo vehículo**) y sus servicios. Los tipos de servicio son **Preventivo**, **Correctivo**, **Inspección** y **Otro**.

[Abrir Flota](app:/dashboard/mantenimiento/flota)`,
  },
  {
    slug: 'tienda-en-linea',
    title: 'Tienda en línea y órdenes de compra',
    category: 'operacion',
    summary:
      'La tienda pública donde los clientes compran espacios con PayPal y dónde ver esas compras.',
    tags: ['tienda', 'shop', 'paypal', 'compras', 'órdenes', 'ecommerce'],
    modules: [
      { label: 'Abrir Órdenes de compra', href: '/dashboard/purchases' },
    ],
    related: ['conoce-veo-services', 'proceso-de-venta'],
    body: `VEO tiene una **tienda en línea** pública donde un cliente puede elegir espacios y pagar con **PayPal**, sin pasar por un vendedor.

## Ver las compras

Las compras realizadas en la tienda aparecen en el módulo **Ordenes** del menú. Ahí ves quién compró, qué compró y el estado del pago.

[Abrir Órdenes de compra](app:/dashboard/purchases)

## Qué hacer con una compra

Una compra en línea sigue el mismo camino operativo que una venta normal: contrato en Brilo, producción, instalación y reportes. Ver [El proceso de venta paso a paso](academy:proceso-de-venta#paso-3-crea-el-contrato-en-brilo).`,
  },
  {
    slug: 'facturacion-y-cxc',
    title: 'Mis facturas y cuentas por cobrar',
    category: 'operacion',
    summary:
      'Consulta tu facturación como vendedor y cómo se registran los abonos de clientes en Brilo.',
    tags: [
      'facturas',
      'facturación',
      'ventas',
      'centro de costo',
      'cxc',
      'cuentas por cobrar',
      'abonos',
      'cobros',
    ],
    modules: [
      { label: 'Abrir Mis facturas', href: '/dashboard/my-space/invoices' },
    ],
    related: ['mi-espacio', 'contrato-en-brilo'],
    body: `La facturación y los cobros viven en **Brilo**. VEO Services te permite consultarlos y, en el caso de cuentas por cobrar, cargar los abonos de forma masiva.

## Mis facturas

En **Mi Espacio → Mis facturas** ves la facturación generada bajo tu nombre como vendedor, agrupada por **centro de costo**, con los totales del periodo. Puedes exportarla a PDF.

[Abrir Mis facturas](app:/dashboard/my-space/invoices)

> Si una factura no aparece, revisa en Brilo que el contrato tenga tu nombre como **ejecutivo**. Ver [Crear el contrato en Brilo](academy:contrato-en-brilo#que-datos-necesita).

## Cuentas por cobrar (solo administradores)

En **Cuentas por cobrar → Brilo** se sube el archivo de Excel con el detalle de los cobros:

1. Haz clic en **Subir archivo de Excel**.
2. Elige la **hoja** que quieres procesar.
3. Revisa cada fila: fecha del abono, monto, tipo de abono, factura y banco. Las filas con error se marcan y se pueden corregir u omitir.
4. Haz clic en **Subir N a Brilo**.

Al terminar verás cuántos abonos se crearon y cuáles tuvieron error.`,
  },
];
