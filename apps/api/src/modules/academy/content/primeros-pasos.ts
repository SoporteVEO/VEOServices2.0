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
| Quieres pedir una mejora a la plataforma | [Solicitar una nueva funcionalidad](academy:solicitar-funcionalidad). |

## Pregúntale a Nexo

Si no encuentras algo, abre a **Nexo**, el asistente de la plataforma (botón arriba a la derecha o **Ctrl + I**) y pregúntale con tus palabras, por ejemplo: *"¿Cómo envío el reporte mensual de un contrato?"*. Nexo lee esta misma academia para responderte y te comparte el enlace a la guía. Más detalles en [Nexo, tu asistente](academy:nexo).

> **Consejo:** usa el buscador de la página principal de la Academy. Busca por lo que quieres hacer ("enviar reporte", "reservar valla", "aceptar cotización").
>
> Para ir rápido a un módulo de la plataforma, usa el **buscador de módulos** (la lupa de arriba o **Ctrl + K**). Ver [Conoce VEO Services](academy:conoce-veo-services#buscar-un-modulo).`,
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

## Buscar un módulo

Arriba a la derecha está la **lupa**. Haz clic en ella o presiona **Ctrl + K**, escribe el nombre del módulo (por ejemplo, *testigos* o *pantallas*) y selecciona el resultado para ir directo. Solo aparecen los módulos a los que tienes acceso.

## Notificaciones

La **campana** de arriba reúne tus avisos: cotizaciones, órdenes, solicitudes y actualizaciones. Haz clic en uno para abrir el módulo correspondiente.

También puedes recibirlos como **aviso del navegador**, aunque estés en otra pestaña. La primera vez verás un mensaje para **Activar** las notificaciones; si lo cierras, actívalas desde la campana. Si tu navegador las tiene bloqueadas, permítelas desde el candado de la barra de direcciones. Al **cerrar sesión**, se desactivan en ese equipo.

## Los módulos

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

### Producción Pantallas
Las órdenes de pauta (**OP**) de pantallas: Soporte Comercial las crea y Producción las revisa e ingresa a las listas. Ver [Órdenes de pauta (OP)](academy:pantallas#ordenes-de-pauta-op).

[Abrir Producción Pantallas](app:/dashboard/produccion-pantallas)

### Vallas
Inventario de vallas estáticas con su disponibilidad por fechas. Desde aquí se genera la [cotización de vallas](academy:crear-cotizacion-vallas).

[Abrir Vallas](app:/dashboard/static-billboards)

### Imágenes
Galería de fotos de vallas (mensuales, de instalación y de mantenimiento). Ver [Subir fotos de vallas](academy:subir-fotos).

[Abrir Imágenes](app:/dashboard/images)

### Clientes (dentro del CRM)
Registro de clientes **directos** y **agencias** usados en las cotizaciones, con sus contactos, contratos en Brilo, negocios y actividad. Está en **CRM → Clientes**. Ver [Registrar un cliente](academy:crear-cliente).

[Abrir Clientes](app:/dashboard/crm/clientes)

### Producción y Mantenimiento
Órdenes de producción, calendario de impresión e instalación; órdenes de mantenimiento de vallas y la flota de vehículos. Ver [Producción](academy:produccion) y [Mantenimiento](academy:mantenimiento).

### CRM (Ventas)
El seguimiento comercial: pipeline de negocios, reservas de sitios, renovaciones, correos y WhatsApp. Ver [CRM de Ventas](academy:crm-introduccion).

### Tienda
La tienda en línea pública y las órdenes recibidas. Ver [Tienda en línea](academy:tienda-en-linea).

### Actualizaciones y Solicitar funcionalidad
Al final del menú. **Actualizaciones** muestra las novedades de cada versión de la plataforma. **Solicitar funcionalidad** te permite pedir una mejora al equipo de desarrollo y seguir su avance. Ver [Solicitar una nueva funcionalidad](academy:solicitar-funcionalidad).

[Abrir Solicitar funcionalidad](app:/dashboard/solicitudes)

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
      'producción vallas',
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

Puedes buscar por número, cliente o correo. Las cotizaciones **rechazadas** no aparecen en la lista.

[Abrir Mis cotizaciones](app:/dashboard/my-space/offers)

## Mis contratos

Tus contratos vigentes en Brilo con las fotos de cada valla. Haz clic en uno para abrir el panel de reporte y enviarlo al cliente. Ver [Enviar reportes a clientes](academy:enviar-reporte).

[Abrir Mis contratos](app:/dashboard/my-space/contracts)

## Producción Vallas

Las [órdenes de producción](academy:glosario#orden-de-produccion) que nacieron de tus cotizaciones aceptadas. Ábrelas para cargar el **arte** de cada valla (como archivo o como enlace) y ver en qué estado va la impresión y la instalación. Ver [Arte de cada valla](academy:produccion#arte-de-cada-valla).

[Abrir Producción Vallas](app:/dashboard/my-space/production-orders)

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
    tags: ['nexo', 'asistente', 'ia', 'chat', 'ayuda', 'preguntar', 'brilo'],
    related: ['bienvenida', 'enviar-reporte', 'proceso-de-venta'],
    body: `**Nexo** es el asistente inteligente de VEO Services. Lo abres con el botón de Nexo arriba a la derecha o con **Ctrl + I**.

## Qué puede hacer

- **Responder cómo se hace algo** en la plataforma. Para eso lee VEO Academy y te deja el enlace a la guía para que la consultes completa.
- **Buscar datos reales**: ventas del mes, cotizaciones, contratos, clientes, disponibilidad de vallas, fotos.
- **Generar reportes y archivos**: reporte de disponibilidad, reporte mensual de un contrato, Excel o PDF.
- **Enviar correos** y hacer acciones, siempre pidiéndote aprobación antes.
- **Consultar Brilo** directamente: clientes, cotizaciones y contratos de vallas, facturas, cuentas por cobrar, contabilidad e inventario.
- **Mostrar los contratos por vencer** de un periodo o de un vendedor, con la tabla completa, por ejemplo: *"¿Qué contratos vencen en noviembre?"*.

Nexo solo te muestra información de los módulos a los que tienes acceso.

## Cambios en Brilo

Los administradores también pueden pedirle a Nexo que **cree, modifique o elimine** registros en Brilo, por ejemplo: *"Corrige el correo de facturación del cliente X en Brilo"*. Antes de enviar nada, Nexo muestra una tarjeta **Cambio en Brilo** con la explicación y la lista exacta de cambios. Revísala y haz clic en **Aplicar en Brilo** (o **Eliminar en Brilo**) para confirmar. Si no apruebas, no se cambia nada.

> Brilo es el sistema oficial de facturación. Revisa bien cada cambio antes de aprobarlo.

## Si necesitas algo que la plataforma no hace

Nexo no crea funcionalidades nuevas. Para pedirlas al equipo de desarrollo usa el módulo **Solicitar funcionalidad**. Ver [Solicitar una nueva funcionalidad](academy:solicitar-funcionalidad).

## Cómo preguntarle

Escribe como le hablarías a un compañero:

- *"¿Cuáles son los pasos para cerrar una venta?"*
- *"¿Cómo envío el reporte de instalación al cliente?"*
- *"¿Qué vallas tengo disponibles en San Salvador en diciembre?"*
- *"¿Cuánto vendí este mes?"*

Si la respuesta no es lo que buscabas, dile qué entendió mal. Nexo aprende de tus correcciones.

> **Importante:** Nexo nunca inventa datos. Si no encuentra la información, te lo dirá.`,
  },
  {
    slug: 'solicitar-funcionalidad',
    title: 'Solicitar una nueva funcionalidad',
    category: 'primeros-pasos',
    summary:
      'Cómo pedir una mejora al equipo de desarrollo: llenar el formato, subirlo en PDF, agregar colaboradores, seguir el estado y aprobar con tu firma.',
    tags: [
      'solicitar funcionalidad',
      'nueva funcionalidad',
      'solicitud',
      'ticket',
      'mejora',
      'desarrollo',
      'formato',
      'pdf',
      'firma',
      'aprobar',
      'colaboradores',
    ],
    modules: [
      {
        label: 'Abrir Solicitar funcionalidad',
        href: '/dashboard/solicitudes',
      },
    ],
    related: ['nexo', 'preguntas-frecuentes', 'bienvenida'],
    body: `Si hay algo que la plataforma no hace, o que podría hacerse mejor, puedes pedirlo al equipo de desarrollo desde **Solicitar funcionalidad**, al final del menú de la izquierda (debajo de **Actualizaciones**). Cada solicitud funciona como un ticket: queda registrada, puedes ver en qué estado va y te avisamos de cada avance.

[Abrir Solicitar funcionalidad](app:/dashboard/solicitudes)

## Antes de empezar: el formato

Toda solicitud lleva el formato **Solicitud de nueva funcionalidad** llenado y guardado como **PDF**. Sirve para que el equipo entienda bien qué necesitas. El formato te pide:

- **Información general:** nombre de la solicitud, área, quién la pide y quién usará la función.
- **Necesidad del negocio:** qué problema existe hoy, qué necesitas que el sistema permita y un ejemplo real.
- **Importancia:** prioridad sugerida y qué pasa si no se implementa.
- **Cómo debería funcionar:** paso a paso, datos que se necesitan y reglas o permisos.
- **Diagrama del proceso:** un dibujo sencillo, por ejemplo en Excalidraw, con el enlace compartido.
- **Cómo sabremos que funciona:** dos o tres resultados que se puedan comprobar.

Escribe con tus propias palabras. No necesitas saber de programación. Si algo no aplica, escribe "No aplica".

## Crear una solicitud

1. Entra a **Solicitar funcionalidad** y haz clic en **Nueva solicitud**.
2. Haz clic en **Descargar formato** y llena el documento de Word.
3. Guárdalo o expórtalo como **PDF** (Archivo → Guardar como → PDF).
4. En la ventana, escribe el **Título** y un **Resumen** corto de lo que necesitas.
5. Elige la **Prioridad sugerida**: alta si te impide trabajar, media si ahorra tiempo o evita errores, baja si es una mejora opcional.
6. Sube el PDF en **Formato llenado en PDF**. Debe pesar menos de 25 MB.
7. Si otras personas trabajan contigo en esto, agrégalas en **Colaboradores** (ver más abajo).
8. Haz clic en **Enviar solicitud**.

> **Importante:** sin el PDF no se puede enviar la solicitud. Si el botón está apagado, revisa que el título tenga al menos 3 letras, el resumen al menos 10 y que el archivo sea un PDF.

Al enviarla recibes un número de ticket como **SF-0001** y el equipo de desarrollo recibe un aviso.

## Colaboradores

Un colaborador es alguien que también necesita esta mejora. Los colaboradores:

- Ven la solicitud y su avance.
- Reciben los mismos avisos que tú.
- **Firman la aprobación final**, igual que quien creó la solicitud.

Puedes agregarlos al crear la solicitud o después, desde la pestaña **Resumen** de la solicitud, en **Participantes**. Solo quien creó la solicitud puede agregar o quitar colaboradores, y solo mientras no esté cerrada (aprobada o rechazada).

## Seguir el estado

Abre cualquier solicitud para ver el resumen, el PDF, los participantes y la pestaña **Actividad** con todo lo que ha pasado. Los estados son:

| Estado | Qué significa |
| --- | --- |
| **Enviada** | Llegó al equipo de desarrollo y espera revisión. |
| **En revisión** | Están evaluando la solicitud. |
| **En desarrollo** | Se está construyendo. |
| **Por aprobar** | Desarrollo la terminó y espera la firma de los participantes. |
| **Aprobada** | Todos los participantes firmaron. |
| **Rechazada** | No se hará; el equipo explica el motivo en la actividad. |

Cada vez que cambia el estado o el equipo deja una nota, te llega una notificación que abre la solicitud directamente.

## Aprobar con tu firma

Cuando desarrollo marca la solicitud como completada, quien la creó y todos los colaboradores reciben una notificación para revisarla. En **Solicitar funcionalidad** verás un aviso arriba y la etiqueta **Requiere tu firma** en esa solicitud.

1. Prueba la funcionalidad en la plataforma.
2. Abre la solicitud y haz clic en **Firmar aprobación**.
3. Dibuja tu firma con el mouse o con el dedo. Puedes usar **Borrar firma** para repetirla.
4. Marca la casilla que confirma que la funcionalidad funciona como esperabas, sin problemas, y te resulta útil.
5. Haz clic en **Firmar y aprobar**.

Tu firma queda guardada como evidencia, junto con tu nombre, correo y la fecha y hora. Cuando **todos** los participantes firman, la solicitud pasa a **Aprobada**. Puedes ver las firmas en la pestaña **Firmas**.

### Si algo no funciona

Si al probarla encuentras un problema, **no firmes**. Haz clic en **Reportar problema**, cuenta qué hiciste y qué pasó, y envíalo. La solicitud vuelve a **En desarrollo** y se avisa al equipo y a los demás participantes. Cuando desarrollo la complete de nuevo, volverán a pedir las firmas.

## Para el equipo de desarrollo

Quienes tienen el permiso de **Desarrollador** ven en el menú, dentro de **Desarrollo**, la opción **Solicitudes de funcionalidad**.

- La tabla se organiza por estado y se puede filtrar por prioridad y buscar por ticket (**SF-0001**), título o solicitante.
- Al abrir una solicitud pueden **ver o descargar el PDF** del formato.
- Desde la parte inferior eligen el nuevo **Estado** y escriben una nota para los participantes. Al **rechazar** es obligatorio explicar el motivo.
- Al marcarla **Completada (pedir firma)** se notifica a todos los participantes para que firmen.
- Una solicitud **Aprobada** queda cerrada y ya no se puede modificar.

[Abrir Solicitudes de funcionalidad](app:/dashboard/desarrollo/solicitudes)`,
  },
];
