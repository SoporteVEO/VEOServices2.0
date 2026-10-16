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
      'fecha de impresión',
      'reprogramar',
      'reprogramación',
      'prioridad',
      'solicitudes',
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

En la lista de vallas por agendar, las que tienen una solicitud del vendedor llevan la etiqueta **Prioridad** o **Reprogramación** (con la fecha preferida, si la indicó) y aparecen primero.

## Pestaña Solicitudes

Aquí llegan las [solicitudes de reprogramación](#reprogramar-la-impresion) de los vendedores. La pestaña muestra cuántas hay pendientes; las urgentes se marcan en rojo. Cada solicitud indica la **Fecha actual de impresión**, la **Fecha preferida**, el motivo y si pidió **Prioridad**.

- **Marcar atendida**: después de mover la impresión en el calendario. Puedes dejar un comentario para el vendedor.
- **Rechazar**: debes escribir el motivo.

En ambos casos el vendedor recibe una notificación con la respuesta.

## Fecha de impresión

Cada valla de la orden muestra su tarjeta **Impresión** con la fecha, la máquina y el estado del trabajo (**Agendada**, **En set up**, **Imprimiendo**, **En cooldown** o **Impresa**). Si aún no tiene fecha, verás que Producción todavía la va a agendar.

En **Mis órdenes**, la columna **Fecha de impresión** muestra la próxima fecha agendada, cuántas vallas de la orden ya tienen fecha (por ejemplo, *2/3 agendadas*), **Impresión finalizada** o **Sin fecha asignada**.

## Reprogramar la impresión

Si el cliente necesita la lona antes o después, el vendedor dueño de la orden puede pedir otra fecha:

1. En **Mis órdenes**, abre la orden y busca la valla.
2. En la tarjeta **Impresión**, haz clic en **Solicitar reprogramación**.
3. Elige la **Fecha preferida de impresión** (o déjala en *Lo antes posible*) y escribe el **Motivo**.
4. Si es urgente, activa **Dar prioridad a esta valla**.
5. Haz clic en **Enviar solicitud**. Producción recibe una notificación.

Mientras esté pendiente verás **Reprogramación solicitada** y puedes **Retirar solicitud**. Solo se puede pedir mientras la impresión siga **Agendada** (o sin fecha) y no haya otra solicitud pendiente para esa valla.

## Para vendedores

No necesitas entrar a Producción. En **Mi Espacio → Mis órdenes** carga el [arte de cada valla](#arte-de-cada-valla), revisa la [fecha de impresión](#fecha-de-impresion) y el avance de tus ventas; también lo ves en la pestaña **Ejecución** del negocio en el [CRM](academy:crm-negocios#ver-la-ejecucion-de-la-campana).

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
      'mantenimiento',
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

Las cotizaciones de pantallas se hacen desde **Mis cotizaciones**, no desde este módulo. Ver [Cotizar pantallas digitales](academy:crear-cotizacion-mixta).

## Si una pantalla falla

Las reparaciones de pantallas (módulos LED, energía, conectividad) se asignan en **Mantenimiento → Pantallas** a los técnicos de pantallas. Ver [Mantenimiento de vallas, pantallas y flota](academy:mantenimiento#vallas-y-pantallas).`,
  },
  {
    slug: 'mantenimiento',
    title: 'Mantenimiento de vallas, pantallas y flota',
    category: 'operacion',
    summary:
      'Órdenes de mantenimiento para vallas estáticas y pantallas digitales, comentarios, evidencia y control de la flota.',
    tags: [
      'mantenimiento',
      'reparación',
      'orden de mantenimiento',
      'pantallas',
      'mantenimiento de pantallas',
      'led',
      'comentarios',
      'evidencia',
      'terminada',
      'flota',
      'vehículos',
      'preventivo',
      'correctivo',
    ],
    modules: [
      { label: 'Abrir Mantenimiento de vallas', href: '/dashboard/mantenimiento' },
      {
        label: 'Abrir Mantenimiento de pantallas',
        href: '/dashboard/mantenimiento/pantallas',
      },
      { label: 'Abrir Flota', href: '/dashboard/mantenimiento/flota' },
    ],
    related: ['subir-fotos', 'enviar-reporte', 'pantallas'],
    body: `En **Mantenimiento** se asignan y siguen los trabajos de reparación y limpieza. El menú tiene tres entradas: **Vallas**, **Pantallas** y **Flota**. Las ve quien tiene el subrol **Mantenimiento** (supervisores).

## Vallas y pantallas

**Vallas** es para las estructuras estáticas (órdenes con código **MNT…**) y **Pantallas** para las pantallas LED (código **MNP…**). Las dos funcionan igual y tienen cuatro pestañas:

- **Órdenes**: los trabajos abiertos. Filtra por estado y categoría, o busca por valla o pantalla.
- **Terminadas**: los trabajos que el supervisor ya cerró.
- **Categorías**: los tipos de trabajo. Cada módulo tiene las suyas (por ejemplo, *Iluminación* en vallas o *Módulos LED* en pantallas).
- **Resumen**: órdenes, fuera de fecha, tasa de cierre, tiempos y evidencias, por estado, categoría y usuario.

[Abrir Mantenimiento de vallas](app:/dashboard/mantenimiento)

[Abrir Mantenimiento de pantallas](app:/dashboard/mantenimiento/pantallas)

## Crear una orden

1. Haz clic en **Nueva orden**.
2. Elige la **Valla estática** o la **Pantalla**. Puedes buscar por código o dirección.
3. Elige el **Usuario de mantenimiento**. En vallas se asigna a técnicos con rol **Mantenimiento** o **Instalador y mantenimiento**; en pantallas, solo a técnicos con rol **Mantenimiento Pantallas**.
4. Elige la **Categoría** (opcional), la **Fecha programada** y la **Hora**.
5. Escribe la **Descripción del problema** y guarda.

El técnico recibe una notificación en su teléfono con la orden.

## Estados de una orden

| Estado | Quién lo marca | Significado |
| --- | --- | --- |
| **Pendiente** | — | Asignada, aún no inicia. |
| **En progreso** | Técnico | Inició el trabajo o subió la primera foto. |
| **Finalizada** | Técnico | El técnico terminó y la deja para revisión. |
| **Terminada** | Supervisor | El supervisor revisó y cerró la orden. Pasa a la pestaña **Terminadas**. |
| **Cancelada** | Supervisor | Ya no se hará. |

Cuando el técnico la marca **Finalizada**, revisa las fotos y los comentarios en el detalle y haz clic en **Marcar como terminada**. Una orden terminada ya no acepta fotos ni cambios.

¿Hay que corregir algo? Con **Devolver a finalizada** una orden terminada vuelve a revisión, y con **Reabrir** una orden finalizada o cancelada vuelve a trabajo.

## Comentarios

En el detalle de cada orden está la sección **Comentarios**. Supervisor y técnico pueden escribir ahí para coordinar el trabajo (**Comentar**); cada comentario queda en el historial. Los comentarios no envían notificación, así que revísalos al abrir la orden.

## Portal del técnico

Los técnicos trabajan desde su teléfono en **Mis órdenes**:

1. Abren la orden y hacen clic en **Iniciar trabajo**.
2. En **Evidencia del trabajo** toman o eligen **varias fotos** del antes y después (hasta 25 MB cada una) y pueden escribir un comentario en cada foto antes de subirla.
3. Al terminar, hacen clic en **Marcar como finalizada** y, si quieren, dejan **Notas de cierre**.

Las órdenes de pantallas se ven con la etiqueta **Mantenimiento pantalla**. Cuando el supervisor marca una orden como terminada, desaparece del portal del técnico.

## Fotos para el reporte al cliente

La evidencia de mantenimiento se queda en la orden. Si una **valla estática** tiene cliente y quieres enviarle el reporte, abre la foto en el detalle y haz clic en **Agregar a Imágenes**: se guarda como **Imagen de mantenimiento de valla** y la foto muestra la etiqueta **En Imágenes**. Después [envía el reporte](academy:enviar-reporte#mensual-instalacion-o-mantenimiento).

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

Una compra en línea sigue el mismo camino operativo que una venta normal: contrato en Brilo, producción, instalación y reportes. Ver [El proceso de venta paso a paso](academy:proceso-de-venta#paso-3-acepta-la-cotizacion).`,
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
    related: ['mi-espacio', 'contrato-en-brilo', 'cuentas-por-cobrar'],
    body: `La facturación y los cobros viven en **Brilo**. VEO Services te permite consultarlos y, en el caso de cuentas por cobrar, cargar los abonos de forma masiva.

## Mis facturas

En **Mi Espacio → Mis facturas** ves la facturación generada bajo tu nombre como vendedor, agrupada por **centro de costo**, con los totales del periodo. Puedes exportarla a PDF.

[Abrir Mis facturas](app:/dashboard/my-space/invoices)

> Si una factura no aparece, revisa en Brilo que el contrato tenga tu nombre como **ejecutivo**. Ver [El contrato en Brilo](academy:contrato-en-brilo#que-datos-necesita).

## Cuentas por cobrar

El equipo financiero consulta saldos y registra pagos uno por uno en **Finanzas → Cuentas por cobrar**. Ver [Cuentas por cobrar](academy:cuentas-por-cobrar).

## Carga masiva de abonos (solo administradores)

En **Herramientas → CxC** (página **Cuentas por cobrar → Brilo**) se sube el archivo de Excel con el detalle de los cobros:

1. Haz clic en **Subir archivo de Excel**.
2. Elige la **hoja** que quieres procesar.
3. Revisa cada fila: fecha del abono, monto, tipo de abono, factura y banco. Las filas con error se marcan y se pueden corregir u omitir.
4. Haz clic en **Subir N a Brilo**.

Al terminar verás cuántos abonos se crearon y cuáles tuvieron error.`,
  },
];
