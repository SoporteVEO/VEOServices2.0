import type { AcademyArticleSource } from '../academy.types.js';

export const PROCESO_DE_VENTA: AcademyArticleSource[] = [
  {
    slug: 'proceso-de-venta',
    title: 'El proceso de venta paso a paso',
    category: 'proceso-de-venta',
    summary:
      'La ruta completa de una venta en VEO: del primer contacto al reporte mensual al cliente.',
    tags: [
      'vender',
      'venta',
      'cerrar venta',
      'pasos',
      'flujo',
      'proceso comercial',
      'cómo hacer una venta',
    ],
    modules: [
      { label: 'Abrir Mis cotizaciones', href: '/dashboard/my-space/offers' },
      { label: 'Abrir CRM', href: '/dashboard/crm/pipeline' },
    ],
    related: [
      'crear-cotizacion-vallas',
      'contrato-en-brilo',
      'aceptar-cotizacion',
    ],
    body: `Esta es la ruta que sigue toda venta en VEO. Cada paso tiene su propia guía: haz clic en el título para ver el detalle.

## Resumen rápido

1. **Registra el negocio** en el CRM y revisa la disponibilidad.
2. **Crea la cotización** en VEO Services y envíala al cliente.
3. **Acepta la cotización** cuando el cliente confirma. VEO Services crea solo la cotización y el contrato en Brilo para la facturación.
4. **Envía el contrato al cliente** para que lo firme.
5. **Producción e instalación** (vallas) o **programación de la campaña** (pantallas).
6. **Reporta al cliente**: fotos de instalación y reporte mensual.
7. **Renueva** antes de que termine el contrato.

## Paso 1: Registra el negocio y revisa disponibilidad

Cuando un cliente te pide una campaña, crea un **negocio** en el [CRM](academy:crm-introduccion) con su [brief de campaña](academy:crm-negocios#brief-de-campana): marca, categoría, fechas y zonas. Desde la pestaña Sitios puedes ver qué vallas y pantallas están libres y **reservarlas** mientras el cliente decide. Ver [Sitios y reservas](academy:crm-sitios-y-reservas).

[Abrir Pipeline](app:/dashboard/crm/pipeline)

> Si el cliente es nuevo, primero [regístralo como cliente](academy:crear-cliente) (directo o agencia).

## Paso 2: Crea la cotización

Genera la [cotización](academy:glosario#cotizacion) en PDF con los precios de impresión y arrendamiento:

- Solo vallas: [Crear una cotización de vallas estáticas](academy:crear-cotizacion-vallas).
- Pantallas, mixtas o con conceptos adicionales: [Cotizar pantallas y conceptos adicionales](academy:crear-cotizacion-mixta).

La cotización queda **Pendiente** con un número como **COT0001/26**. Descarga el PDF y envíaselo al cliente (por correo desde el [CRM](academy:crm-mensajes-y-plantillas) o como prefieras). Vincúlala al negocio del CRM en su pestaña Cotizaciones.

## Paso 3: Acepta la cotización

Puedes enviarle al cliente varias cotizaciones hasta que acepte una. Cuando confirme, en **Mis cotizaciones** marca **esa** cotización como **Aceptada**, revisa el **Cliente Brilo** y el **Ejecutivo Brilo** que la plataforma te propone y confirma. Al confirmar:

- Si la cotización tiene **vallas estáticas**, VEO Services crea en Brilo la **cotización** y el **contrato posteado** con esas vallas, y los vincula solo. Ya no tienes que crearlos a mano. Ver [El contrato en Brilo](academy:contrato-en-brilo).
- Se descarga el **contrato de arrendamiento** en PDF.
- Si hay vallas, se crea la [orden de producción](academy:glosario#orden-de-produccion) y se avisa a Producción.
- Si hay pantallas, se registran las campañas digitales.

Ver [Aceptar la cotización](academy:aceptar-cotizacion).

## Paso 4: Envía el contrato para firma

Envía el PDF del contrato al cliente para que lo firme y guarda la copia firmada. Ver [Enviar el contrato al cliente para firma](academy:enviar-contrato-firma).

En el CRM, marca el negocio como **Ganado** (etapa *Orden firmada*): los sitios reservados pasan a **Vendida**.

## Paso 5: Producción, instalación y campaña

Carga el **arte** de cada valla en [Mis órdenes](app:/dashboard/my-space/production-orders); con eso Producción imprime las lonas, se programa la instalación y el instalador sube las fotos de evidencia. En pantallas, se confirma el arte y la campaña sale al aire. Puedes seguir todo desde [Mis órdenes](app:/dashboard/my-space/production-orders) o en la pestaña Ejecución del negocio. Ver [Después de la venta](academy:despues-de-la-venta).

## Paso 6: Reporta al cliente

Envía el reporte de instalación cuando la valla esté colocada y luego el **reporte mensual** con fotos durante toda la campaña. Ver [Enviar reportes a clientes](academy:enviar-reporte).

## Paso 7: Renueva

Revisa con tiempo los contratos que están por terminar y ofrece la renovación antes de que otro cliente tome el espacio. Ver [Renovaciones](academy:crm-renovaciones) y [Contratos por vencer](academy:contratos-por-vencer).`,
  },
  {
    slug: 'crear-cliente',
    title: 'Registrar un cliente (directo o agencia)',
    category: 'proceso-de-venta',
    summary:
      'Cómo crear un cliente para cotizar y qué diferencia hay entre cliente directo y agencia.',
    tags: [
      'cliente',
      'nuevo cliente',
      'agencia',
      'directo',
      'registrar cliente',
    ],
    modules: [{ label: 'Abrir Clientes', href: '/dashboard/crm/clientes' }],
    related: [
      'crear-cotizacion-vallas',
      'contrato-en-brilo',
      'crm-clientes-contactos-tareas',
    ],
    body: `Toda [cotización](academy:glosario#cotizacion) necesita un cliente. Puedes registrarlo desde **CRM → Clientes** o directamente mientras cotizas.

## Cliente directo o agencia

| Tipo | Cuándo usarlo |
| --- | --- |
| **Directo** | La marca nos compra directamente (por ejemplo, un supermercado). |
| **Agencia** | Una agencia de publicidad compra en nombre de una o varias marcas. |

El tipo se define en el cliente, no en la cotización. En los buscadores de clientes, las agencias se muestran como *Nombre (Empresa) · Agencia*.

## Crear un cliente

1. Ve a **CRM → Clientes** y haz clic en **Nuevo cliente**.
2. Elige el **Tipo de cliente**: **Directo** o **Agencia**.
3. Llena el nombre (o nombre de la agencia), la **empresa o razón social**, el **correo principal**, el **correo de facturación** y el **teléfono**.
4. Haz clic en **Registrar**. Se abre la ficha del cliente para que agregues contactos o un negocio.

[Abrir Clientes](app:/dashboard/crm/clientes)

## Editar un cliente

Abre el cliente en **CRM → Clientes** y entra a la pestaña **Información**. Haz clic en cualquier campo (tipo, nombre, empresa, teléfono, correos) para editarlo. En la pestaña **Contratos** ves su historial de contratos en Brilo.

> **Atajo:** mientras generas una cotización, en el campo Cliente elige **+ Crear nuevo cliente** y se abre el mismo formulario.

## Ver el historial de un cliente

Haz clic en un cliente para ver su historial de contratos, marcados como **Vigente**, **Próximo** o **Finalizado**. Puedes filtrar la lista por tipo (Todos, Directo o Agencia) y buscar por nombre, empresa o correo.

## El cliente también debe existir en Brilo

El [contrato en Brilo](academy:contrato-en-brilo) se crea a nombre de un cliente que ya existe en Brilo, con sus datos legales completos (representante legal, DUI, dirección y correos), porque el contrato en PDF los toma de ahí.

> **Usa el mismo correo en los dos sistemas.** Al aceptar una cotización, VEO Services busca al cliente en Brilo por su correo. Si coinciden, lo propone solo; si no, tendrás que buscarlo a mano.`,
  },
  {
    slug: 'crear-cotizacion-vallas',
    title: 'Crear una cotización de vallas estáticas',
    category: 'proceso-de-venta',
    summary:
      'Selecciona vallas disponibles, ajusta precios y duración, y descarga la cotización en PDF.',
    tags: [
      'cotización',
      'cotizar',
      'oferta',
      'propuesta',
      'vallas',
      'pdf',
      'generar cotización',
      'crear oferta',
      'precio',
      'cuánto cuesta',
      'impresión',
      'arrendamiento',
      'iva',
      'descuento',
      'precio recomendado',
      'precio de lista',
    ],
    modules: [
      { label: 'Abrir Vallas estáticas', href: '/dashboard/static-billboards' },
    ],
    related: ['crear-cotizacion-mixta', 'aceptar-cotizacion', 'crear-cliente'],
    body: `La forma más rápida de cotizar vallas es desde el inventario de **Vallas estáticas**, porque ahí ves la disponibilidad real en las fechas que pide el cliente.

## Paso a paso

1. Abre **Vallas estáticas**.
2. Elige el **rango de fechas** de la campaña. Activa **Mostrar ocupadas** si también quieres ver las vallas no disponibles.
3. Usa **Buscar vallas...** para filtrar por código o ubicación.
4. **Selecciona** las vallas que quieres cotizar (marca su casilla).
5. Haz clic en **Generar Cotización (N)**, donde N es el número de vallas seleccionadas.
6. En la ventana **Generar Cotización**:
   - **Cliente** (obligatorio): búscalo o elige **+ Crear nuevo cliente**. Ver [Registrar un cliente](academy:crear-cliente).
   - **Vigencia oferta** (obligatoria): por defecto, 15 días a partir de hoy.
   - **Condiciones especiales**: términos, descuentos u observaciones que quieras que aparezcan en la cotización.
7. Revisa la tabla **Vallas seleccionadas** y ajusta por cada valla la **Impresión**, el **Arrendamiento** y la **Duración**.
8. Haz clic en **Descargar**.

[Abrir Vallas estáticas](app:/dashboard/static-billboards)

## Cómo se calculan los precios

- **Impresión**: por defecto, el área de la valla (ancho × alto) por **$13 el metro cuadrado**. Puedes cambiarlo.
- **Arrendamiento**: el precio mensual de lista multiplicado por los meses de la duración, contados por calendario como en Brilo (del 16 de octubre al 15 de noviembre es 1 mes). Unos días extra no suman otro mes; más de medio mes, sí. Puedes cambiarlo.
- A ambos se les suma el **IVA (13%)**. Abajo verás el **Subtotal**, el **IVA** y el **Total**.

> **Descuentos:** no hay un campo de porcentaje. Baja el precio directamente en la tabla o escribe el descuento en **Condiciones especiales**. Si quieres que la cotización y el PDF muestren el descuento sobre el precio recomendado, créala desde **Mis cotizaciones**. Ver [Descuentos](academy:crear-cotizacion-mixta#descuentos).

> **Fechas ocupadas:** si las fechas de una valla chocan con un contrato existente, la plataforma te avisa. Cambia las fechas o elige otra valla.

## Qué pasa al descargar

- Se crea la cotización con un número como **COT0001/26** y queda en estado **Pendiente**.
- Se descarga el PDF y queda guardado en la plataforma; lo puedes volver a descargar desde [Mis cotizaciones](app:/dashboard/my-space/offers).
- **No se envía automáticamente al cliente.** Envíaselo por correo, idealmente desde el [CRM](academy:crm-mensajes-y-plantillas) para que quede registrado.

## Siguiente paso

Cuando el cliente acepte, [acepta la cotización](academy:aceptar-cotizacion). La cotización y el contrato en Brilo se crean solos.`,
  },
  {
    slug: 'crear-cotizacion-mixta',
    title: 'Cotizar pantallas digitales y conceptos adicionales',
    category: 'proceso-de-venta',
    summary:
      'Cómo armar desde Mi Espacio una cotización con pantallas, vallas y conceptos extra.',
    tags: [
      'cotización',
      'pantallas',
      'digital',
      'dooh',
      'spots',
      'conceptos adicionales',
      'cotización mixta',
      'editar cotización',
      'motivo del cambio',
      'historial',
    ],
    modules: [
      { label: 'Abrir Mis cotizaciones', href: '/dashboard/my-space/offers' },
    ],
    related: ['crear-cotizacion-vallas', 'aceptar-cotizacion', 'pantallas'],
    body: `Las cotizaciones de **pantallas digitales** (y las que combinan pantallas, vallas y otros conceptos) se crean desde **Mi Espacio → Mis cotizaciones**. El módulo Pantallas es para operar las campañas, no para cotizar.

## Paso a paso

1. Abre **Mis cotizaciones** y haz clic en **Generar Cotización**.
2. Llena el **Cliente**, la **Vigencia oferta** y las **Condiciones especiales**, igual que en la [cotización de vallas](academy:crear-cotizacion-vallas#paso-a-paso).
3. Agrega lo que vas a cotizar:
   - **Pantallas**: usa **Agregar pantalla...**. Por cada pantalla elige los **Spots/día**, el **Arrendamiento** y la **Duración**.
   - **Vallas estáticas**: usa **Agregar valla estática...**.
   - **Conceptos adicionales**: usa **Agregar concepto** para cobrar cosas como diseño, producción especial o transporte.
4. Revisa los totales de **Impresión**, **Arrendamiento** y **Total general**.
5. Haz clic en **Descargar**.

[Abrir Mis cotizaciones](app:/dashboard/my-space/offers)

## Spots por día

Los [spots por día](academy:glosario#spots-por-dia) son las veces que el anuncio aparece cada día en la pantalla. Puedes elegir **300, 450, 600 o 900**; por defecto es **600**.

El arrendamiento de pantallas se calcula **por día**: precio diario de la pantalla por el número de días de la campaña.

> **Capacidad:** al cotizar no se revisa si la pantalla tiene cupo. Eso se valida al **aceptar** la cotización, cuando la campaña se programa. Revisa antes la ocupación en el [CRM](academy:crm-disponibilidad) o en [Pantallas](academy:pantallas).

## Editar una cotización

Mientras la cotización esté **Pendiente**, haz clic en ella en Mis cotizaciones y usa **Editar**. Al terminar, haz clic en **Guardar cambios**. Una cotización aceptada ya no se puede editar.

### Motivo del cambio

Si **agregas o quitas vallas o pantallas**, la plataforma te pide el **Motivo del cambio** antes de guardar:

- Presupuesto del cliente
- Cambio en el alcance de la campaña
- Disponibilidad de vallas
- Ubicación o cobertura
- Negociación de precio
- Cambio de fechas
- Corrección de un error
- Otro (en este caso, describe el motivo en **Detalle**)

Si solo cambias precios, fechas o datos del cliente, el motivo es opcional. Queda registrado en el **Historial** de la cotización junto con el cambio de vallas (por ejemplo, *Vallas: 5 → 3*), y los administradores lo ven en **Analytics → Ediciones de cotizaciones** para entender por qué cambian las propuestas.

## Siguiente paso

Cuando el cliente acepte, [acepta la cotización](academy:aceptar-cotizacion). Si incluye vallas estáticas, se crean solos la cotización y el contrato en Brilo. Las pantallas y los conceptos adicionales no se envían a Brilo.`,
  },
  {
    slug: 'contrato-en-brilo',
    title: 'El contrato en Brilo',
    category: 'proceso-de-venta',
    summary:
      'Cómo VEO Services crea solo la cotización y el contrato en Brilo al aceptar una cotización, y qué hacer si falla.',
    tags: [
      'contrato',
      'brilo',
      'erp',
      'crear contrato',
      'contrato automático',
      'facturación',
      'posteado',
      'CON',
      'reintentar brilo',
    ],
    related: ['aceptar-cotizacion', 'enviar-contrato-firma', 'crear-cliente'],
    body: `El **contrato oficial** de VEO vive en **Brilo**, el ERP de la empresa. Brilo le asigna su número (por ejemplo, **CON0613-26**) y desde ahí se factura y se cobra. Para facturar, Brilo necesita una **cotización** y un **contrato** propios.

**Ya no tienes que crearlos a mano.** Al [aceptar una cotización](academy:aceptar-cotizacion) con vallas estáticas, VEO Services crea en Brilo la cotización y el contrato con los mismos datos, y vincula el contrato a tu cotización.

> Los documentos de Brilo son **solo para facturación**. Al cliente se le envían la cotización y el contrato en PDF de VEO Services.

## Qué se crea en Brilo

- Una **cotización** en estado *Aceptada* (número **COT…**).
- Un **contrato posteado** (número **CON…**) vinculado a esa cotización, con cuotas mensuales.
- En ambos, cada **valla estática** de la cotización con sus fechas, el **arrendamiento mensual** (sin IVA) y la **impresión**.

> **Solo vallas estáticas.** Las **pantallas digitales** y los **conceptos adicionales** no se envían a Brilo. Si una cotización solo tiene pantallas o conceptos, al aceptarla eliges a mano un contrato de Brilo existente, como antes.

## Qué datos necesita

Al aceptar, la plataforma te pide confirmar dos datos de Brilo:

- **Cliente Brilo**: se busca por el **correo** del cliente de la cotización. Si hay una sola coincidencia, se propone sola. Si no hay ninguna o hay varias, búscalo por nombre, código, NIT o correo.
- **Ejecutivo Brilo**: se busca por el **nombre del asesor** de la cotización. Si hay una sola coincidencia, se propone solo; si no, elígelo de la lista. Así el contrato aparece en [Mis contratos](app:/dashboard/my-space/contracts) y en tus reportes.

El cliente tiene que existir en Brilo con sus **datos legales completos**: el PDF del contrato toma de Brilo el **nombre o razón social**, el **representante legal**, su **DUI**, el **municipio, departamento y dirección**, y los **correos**. Si el cliente no existe en Brilo, pide que lo registren antes de aceptar.

## Qué datos salen de la cotización

El monto, las vallas y las fechas del contrato en Brilo y del contrato en PDF salen de **la cotización aceptada**. Por eso es importante que la cotización esté correcta antes de aceptarla: una vez aceptada ya no se puede editar.

## Si Brilo no responde

La cotización **queda aceptada** aunque Brilo falle: la orden de producción y las campañas de pantallas se crean igual. En ese caso:

1. Verás un aviso con el error de Brilo en la cotización.
2. Haz clic en **Reintentar Brilo** (en la fila de la cotización o en su detalle). Si la cotización de Brilo ya se había creado, no se duplica: solo se crea lo que faltó.
3. Si el problema sigue, en el detalle de la cotización puedes vincular a mano un contrato de Brilo existente.

El botón **Contrato** aparece cuando la cotización ya tiene un contrato de Brilo vinculado.

## Si el cliente se echa para atrás

Si rechazas una cotización ya aceptada, VEO Services **desvincula** el contrato, pero el contrato **sigue posteado en Brilo**. Pide que lo **anulen en Brilo** para que no se siga facturando.

## Siguiente paso

[Acepta la cotización](academy:aceptar-cotizacion).`,
  },
  {
    slug: 'aceptar-cotizacion',
    title: 'Aceptar la cotización',
    category: 'proceso-de-venta',
    summary:
      'Marca la cotización como aceptada, genera la cotización y el contrato en Brilo y descarga el contrato de arrendamiento.',
    tags: [
      'aceptar cotización',
      'aceptada',
      'rechazada',
      'vincular contrato',
      'contrato brilo',
      'reintentar brilo',
      'contrato pdf',
      'descargar contrato',
      'estado cotización',
    ],
    modules: [
      { label: 'Abrir Mis cotizaciones', href: '/dashboard/my-space/offers' },
    ],
    related: [
      'contrato-en-brilo',
      'enviar-contrato-firma',
      'despues-de-la-venta',
    ],
    body: `Aceptar la cotización es el paso que **registra la venta** en VEO Services y pone en marcha la producción.

## Estados de una cotización

| Estado | Significado |
| --- | --- |
| **Pendiente** | Enviada al cliente, esperando respuesta. Se puede editar. |
| **Aceptada** | El cliente aceptó y está vinculada a un contrato de Brilo. |
| **Rechazada** | El cliente no aceptó. |

Puedes crear varias cotizaciones para el mismo cliente mientras negocian. Acepta **solo la que el cliente eligió**: es la única que genera documentos en Brilo.

## Aceptar una cotización con vallas estáticas

Ya **no** tienes que crear el contrato en Brilo antes: se crea al confirmar.

1. Abre **Mis cotizaciones**.
2. En la cotización, haz clic en **Aceptada** (o elige **Aceptada** en el estado de su detalle).
3. En la ventana **Aceptar cotización**, revisa:
   - **Cliente Brilo**: propuesto por el correo del cliente. Si no aparece, búscalo por nombre, código, NIT o correo.
   - **Ejecutivo Brilo**: propuesto por el nombre del asesor. Si hay varias coincidencias o ninguna, elígelo de la lista.
4. Haz clic en **Confirmar aceptación** y espera mientras se crea en Brilo.

[Abrir Mis cotizaciones](app:/dashboard/my-space/offers)

Ver [El contrato en Brilo](academy:contrato-en-brilo) para saber qué se crea y qué hacer si Brilo falla.

## Aceptar una cotización sin vallas estáticas

Si la cotización solo tiene **pantallas** o **conceptos adicionales**, no se crea nada en Brilo. En la ventana **Aceptar cotización** busca un **Contrato Brilo** existente por su código (CON...) o por el nombre del ejecutivo y confirma.

## Qué pasa al aceptar

- Si hay vallas estáticas, se crean en Brilo la **cotización** y el **contrato posteado**, y el contrato queda vinculado solo.
- Se descarga automáticamente el **contrato de arrendamiento** en PDF (archivo *Contrato CON….pdf*). Lo puedes volver a descargar con el botón **Contrato**.
- Si la cotización tiene **vallas**, se crea la [orden de producción](academy:glosario#orden-de-produccion) con el mismo número de la cotización y Producción recibe un aviso. Después carga el [arte de cada valla](academy:produccion#arte-de-cada-valla) en **Mis órdenes**.
- Si tiene **pantallas**, se programan las campañas digitales en el módulo Pantallas.

> **Si Brilo falla**, la cotización sí queda aceptada y verás el error. Usa **Reintentar Brilo** en la fila o en el detalle de la cotización. Ver [Si Brilo no responde](academy:contrato-en-brilo#si-brilo-no-responde).

> Si el PDF del contrato no se pudo generar, verás un aviso. Descárgalo después con el botón **Contrato**.

## Rechazar una cotización

- Si está **Pendiente**, haz clic en **Rechazada**.
- Si ya estaba **Aceptada**, al rechazarla se te pedirá confirmar. Esto **desvincula el contrato de Brilo**, elimina la orden de producción y libera el espacio reservado en las pantallas. El contrato **sigue posteado en Brilo**: pide que lo anulen allí para detener la facturación.

## Siguiente paso

[Envía el contrato al cliente para que lo firme](academy:enviar-contrato-firma).`,
  },
  {
    slug: 'enviar-contrato-firma',
    title: 'Enviar el contrato al cliente para firma',
    category: 'proceso-de-venta',
    summary:
      'Qué contiene el contrato de arrendamiento, cómo enviarlo al cliente y qué hacer con la copia firmada.',
    tags: [
      'firma',
      'firmar contrato',
      'enviar contrato',
      'contrato de arrendamiento',
      'pdf',
    ],
    modules: [
      { label: 'Abrir Mis cotizaciones', href: '/dashboard/my-space/offers' },
    ],
    related: [
      'aceptar-cotizacion',
      'crm-mensajes-y-plantillas',
      'despues-de-la-venta',
    ],
    body: `Al [aceptar la cotización](academy:aceptar-cotizacion) obtienes el **contrato de arrendamiento** en PDF, listo para que el cliente lo firme.

## Qué contiene el contrato

- Los datos de VEO y del cliente (tomados de Brilo): razón social, representante legal, DUI, dirección y correo de notificaciones.
- Las vallas o pantallas, fechas y montos de la cotización aceptada.
- Las cláusulas de instalación y contenido, precio y mantenimiento, facturación, renovación y jurisdicción.
- Los espacios de firma de VEO (arrendante) y del cliente.

## Cómo enviarlo

1. Descarga el contrato desde **Mis cotizaciones** con el botón **Contrato**.
2. Revisa que los datos del cliente estén completos. Si falta algo (por ejemplo, el representante legal), corrígelo en Brilo y vuelve a descargarlo.
3. Envíalo al cliente por correo. Te recomendamos hacerlo desde el negocio en el CRM (**Mensajes → Enviar correo**, con el PDF adjunto desde tu Gmail), para que quede en el historial del cliente. Ver [Correos y WhatsApp](academy:crm-mensajes-y-plantillas).
4. Pide al cliente que lo devuelva **firmado** (escaneado o en físico).

> **Importante:** VEO Services no tiene firma electrónica ni marca el contrato como "firmado". Guarda la copia firmada según el procedimiento del área comercial.

## Cuando el cliente firma

- En el CRM, mueve el negocio a **Orden firmada** o márcalo como **Ganado**. Los sitios reservados pasan a **Vendida**. Ver [Dentro de un negocio](academy:crm-negocios).
- Da seguimiento a la producción e instalación. Ver [Después de la venta](academy:despues-de-la-venta).`,
  },
  {
    slug: 'despues-de-la-venta',
    title: 'Después de la venta: producción, instalación y campaña',
    category: 'proceso-de-venta',
    summary:
      'Qué pasa cuando se acepta una cotización y cómo dar seguimiento hasta que la campaña está al aire.',
    tags: [
      'después de la venta',
      'seguimiento',
      'instalación',
      'producción',
      'campaña al aire',
    ],
    modules: [
      {
        label: 'Abrir Mis órdenes',
        href: '/dashboard/my-space/production-orders',
      },
    ],
    related: ['produccion', 'pantallas', 'enviar-reporte'],
    body: `Una vez [aceptada la cotización](academy:aceptar-cotizacion), el trabajo pasa a operación. Como vendedor, tu papel es dar seguimiento y mantener informado al cliente.

## Vallas estáticas

1. **Orden de producción**: se crea sola con el número de la cotización. Producción recibe un aviso. Ver [Órdenes de producción e instalación](academy:produccion).
2. **Arte e impresión**: abre la orden en [Mis órdenes](app:/dashboard/my-space/production-orders) y carga el **arte** de cada valla (JPG, PNG, WEBP, TIFF o PDF). Producción lo descarga e imprime la lona según su calendario. Ver [Arte de cada valla](academy:produccion#arte-de-cada-valla).
3. **Instalación**: se asigna instalador y fecha. El instalador sube las **fotos de instalación** desde su portal.
4. **Reporte de instalación**: con las fotos listas, envía el reporte al cliente. Ver [Enviar reportes a clientes](academy:enviar-reporte).

Sigue el avance en [Mis órdenes](app:/dashboard/my-space/production-orders) o en la pestaña **Ejecución** del negocio en el CRM.

## Pantallas digitales

1. Las campañas se registran solas en **Pantallas** con las fechas y spots por día de la cotización.
2. El equipo de pantallas confirma el **arte**: Arte recibido, Arte en aprobación o Sin arte.
3. La campaña sale **al aire** en las fechas contratadas. Ver [Pantallas digitales](academy:pantallas).

## Durante la campaña

- Envía el **reporte mensual** con fotos cada mes. Ver [Enviar reportes a clientes](academy:enviar-reporte).
- Si una valla necesita reparación, se gestiona en [Mantenimiento](academy:mantenimiento) y puedes enviar al cliente un reporte con las fotos de mantenimiento.
- Antes de que termine, prepara la [renovación](academy:crm-renovaciones).`,
  },
];
