import type { AcademyArticleSource } from '../academy.types.js';

export const CRM: AcademyArticleSource[] = [
  {
    slug: 'crm-introduccion',
    title: 'Introducción al CRM',
    category: 'crm',
    summary:
      'Qué es el CRM de Ventas, para qué sirve, cómo entrar y las palabras que vas a ver.',
    tags: ['crm', 'ventas', 'oportunidades', 'qué es el crm', 'acceso al crm'],
    modules: [{ label: 'Abrir CRM', href: '/dashboard/crm' }],
    related: ['crm-conectar-gmail-whatsapp', 'crm-pipeline', 'crm-dia-tipico'],
    body: `El CRM es el lugar donde llevas el control de **todas tus oportunidades de venta**, desde que un cliente te pide una propuesta hasta que firma la orden y su campaña sale al aire.

## Para qué sirve

- Ver todos tus negocios en un tablero y en qué etapa va cada uno.
- Saber **qué vallas y pantallas están libres** en las fechas que pide el cliente.
- **Reservar** sitios mientras el cliente decide, para que nadie más los venda.
- Enviar correos desde tu Gmail de VEO y mensajes de WhatsApp sin salir del sistema.
- Recordar tus pendientes con tareas.
- Enterarte a tiempo de los **contratos que están por vencer** para ofrecer la renovación.
- Revisar si la campaña ya se instaló y si tiene fotos de evidencia.

## Cómo entrar

En el menú de la izquierda, busca la sección **Ventas** y haz clic en **CRM**. Verás estas opciones:

| Opción | Para qué sirve |
| --- | --- |
| **Resumen** | Tu tablero con números, gráficas y pendientes. |
| **Pipeline** | Tus negocios organizados por etapa. Ver [Pipeline](academy:crm-pipeline). |
| **Disponibilidad** | Buscar vallas y pantallas libres. Ver [Disponibilidad](academy:crm-disponibilidad). |
| **Renovaciones** | Contratos y campañas por terminar. Ver [Renovaciones](academy:crm-renovaciones). |
| **Clientes** y **Contactos** | Empresas y personas con su historial. |
| **Tareas** | Tus pendientes. |
| **Plantillas** | Correos prediseñados. |
| **Ajustes** | Conectar Gmail y WhatsApp, y configurar pipelines. |

[Abrir CRM](app:/dashboard/crm)

> **¿No ves el CRM?** Solo aparece para usuarios del área de **Ventas**. Pide a tu administrador que te asigne ese permiso.

## Palabras que vas a ver

| Palabra | Qué significa |
| --- | --- |
| **Negocio** | Una oportunidad de venta. Ejemplo: "Campaña Navidad Pilsener – 10 vallas". |
| **Pipeline** | El camino que sigue un negocio, dividido en etapas. |
| **Etapa** | El paso en el que está el negocio (por ejemplo, "Reserva activa"). |
| **Sitio** | Una valla (cara estática) o una pantalla digital. |
| **Spots por día** | Cuántas veces al día aparece el anuncio en una pantalla. |
| **Periodo / Flight** | Las fechas en las que la campaña estará exhibida. |
| **Propuesta** | El sitio está en el negocio, pero **no está apartado**. |
| **Reserva (hold)** | El sitio está **apartado** para tu cliente durante unos días. Ver [Sitios y reservas](academy:crm-sitios-y-reservas). |
| **1ª / 2ª opción** | Si dos vendedores reservan el mismo sitio, el primero es la 1ª opción; el segundo queda en espera. |
| **Vendida** | El negocio se ganó y el sitio quedó asignado. |
| **Contratada** | La valla ya tiene contrato en Brilo para esas fechas. |
| **Competencia** | Otro negocio de la **misma categoría** (por ejemplo, otra cerveza) tiene el sitio en esas fechas. |
| **Foto testigo** | La foto que toma el instalador para demostrar que el anuncio se colocó. |

## Tu tablero (Resumen)

Es la primera pantalla del CRM. Arriba eliges **Mis datos** o **Equipo**, el pipeline y el rango de fechas. Encuentras:

- **Números principales**: negocios abiertos, valor en pipeline, lo ganado, tasa de cierre, ticket promedio, tareas vencidas, correos y WhatsApp enviados.
- **Ocupación por mes de exhibición**: cuánto tienes **vendido** y **reservado** en los próximos 6 meses.
- **Reservas por vencer**: haz clic en una para abrir su negocio.
- **Mezcla de medios**: cuánto de tu pipeline es de vallas, de pantallas o mixto.
- **Renovaciones**: contratos que terminan en los próximos 60 días y cuántos no tienen negocio.
- **Próximas tareas** y **Cotizaciones sin negocio** (con el botón **Crear negocio**).
- **Ranking** (solo en vista Equipo).`,
  },
  {
    slug: 'crm-conectar-gmail-whatsapp',
    title: 'Conectar Gmail y WhatsApp',
    category: 'crm',
    summary:
      'Configura una sola vez tu correo de VEO y tu WhatsApp Business para escribir a clientes desde el CRM.',
    tags: ['gmail', 'whatsapp', 'conectar', 'correo', 'firma', 'configuración'],
    modules: [
      { label: 'Abrir Ajustes del CRM', href: '/dashboard/crm/ajustes' },
    ],
    related: ['crm-mensajes-y-plantillas', 'crm-ajustes'],
    body: `Hazlo una sola vez. Ve a **CRM → Ajustes**.

[Abrir Ajustes del CRM](app:/dashboard/crm/ajustes)

## Conectar Gmail

1. En la tarjeta **Gmail**, haz clic en **Conectar con Google**.
2. Elige tu cuenta **@veo.com.sv** (no se aceptan cuentas personales).
3. Acepta los permisos que pide Google.
4. Volverás al CRM y verás la etiqueta verde **Conectado**.
5. Opcional: escribe tu **Firma de correo** y haz clic en **Guardar firma**.

Los correos que envíes desde el CRM salen de tu buzón y aparecen en tu carpeta "Enviados" de Gmail.

## Conectar WhatsApp

La conexión necesita datos técnicos de Meta (**Phone Number ID** y **Token de acceso**). **Pídelos a tu administrador o al área de sistemas.** Luego:

1. En la tarjeta **WhatsApp Business**, pega el **Phone Number ID** y el **Token de acceso**.
2. Haz clic en **Conectar WhatsApp**.
3. Verás tu número con la etiqueta **Conectado**.

> Si todavía no tienes WhatsApp conectado, puedes usar **Abrir en WhatsApp**, que abre la conversación en tu WhatsApp normal con el mensaje ya escrito.

## Si Gmail dice "Requiere atención"

Haz clic en **Reconectar** en la tarjeta de Gmail y vuelve a aceptar los permisos.`,
  },
  {
    slug: 'crm-pipeline',
    title: 'Pipeline: crear y mover negocios',
    category: 'crm',
    summary:
      'Las etapas del pipeline, cómo crear un negocio con su brief y qué significa cada señal de la tarjeta.',
    tags: [
      'pipeline',
      'negocio',
      'nuevo negocio',
      'etapas',
      'tablero',
      'kanban',
    ],
    modules: [{ label: 'Abrir Pipeline', href: '/dashboard/crm/pipeline' }],
    related: ['crm-negocios', 'crm-sitios-y-reservas', 'proceso-de-venta'],
    body: `El Pipeline muestra tus negocios como tarjetas, en columnas por etapa.

[Abrir Pipeline](app:/dashboard/crm/pipeline)

## Etapas

| Etapa | Qué quiere decir |
| --- | --- |
| **Brief recibido** | El cliente pidió una campaña. Ya sabes qué quiere, para qué marca y en qué fechas. |
| **Propuesta y disponibilidad** | Estás armando la propuesta y revisando qué sitios están libres. |
| **Reserva activa** | Ya apartaste sitios mientras el cliente decide. |
| **Negociación** | Están ajustando precios, fechas o sitios. |
| **Orden firmada** | El cliente aceptó. Negocio **ganado**. |
| **Perdido** | El cliente no compró. |

## Crear un negocio

1. Haz clic en **Nuevo negocio** (o en el **+** de una columna).
2. Escribe el **nombre del negocio**. Ejemplo: *"Lanzamiento Navidad – 10 vallas + 3 pantallas"*.
3. Elige el **cliente** y, si quieres, el **contacto**.
4. Llena el [Brief de campaña](academy:crm-negocios#brief-de-campana).
5. Completa el **valor estimado**, la **fecha de cierre estimada**, la **prioridad** y el **origen**.
6. Haz clic en **Crear negocio**.

## Mover un negocio de etapa

Arrastra la tarjeta a otra columna. También puedes hacerlo desde la barra de etapas dentro del negocio.

## Qué te dice cada tarjeta

- **Barra de color a la izquierda**: la prioridad (gris = baja, amarillo = media, rojo = alta).
- **Etiqueta de medio**: Estática, Digital o Mixta.
- **Fechas** de la campaña.
- **Renovación**: si el negocio es la renovación de un contrato.
- **Número de sitios** y de cotizaciones vinculadas.
- **Recuadro morado "X reservas · vencen en…"**: tienes sitios apartados. Si está **rojo**, la reserva vence pronto.
- **Triángulo amarillo**: el negocio lleva varios días sin actividad.
- **"Sin próxima tarea"**: crea una tarea con el siguiente paso.

## Filtros

Filtra por pipeline, por vendedor ("Mis negocios" o "Todo el equipo"), por medio (Estática, Digital o Mixta) y busca por nombre, cliente o marca.`,
  },
  {
    slug: 'crm-negocios',
    title: 'Dentro de un negocio',
    category: 'crm',
    summary:
      'Brief de campaña, pestañas del negocio, ganar o perder, notas y vincular cotizaciones.',
    tags: [
      'negocio',
      'brief',
      'ganado',
      'perdido',
      'actividad',
      'nota',
      'vincular cotización',
      'ejecución',
    ],
    modules: [{ label: 'Abrir Pipeline', href: '/dashboard/crm/pipeline' }],
    related: ['crm-sitios-y-reservas', 'crm-pipeline', 'aceptar-cotizacion'],
    body: `Haz clic en una tarjeta del [Pipeline](academy:crm-pipeline) para abrir el negocio. Arriba verás el nombre, el valor, el cliente, la etapa y los botones:

- **Ganado**: el cliente aceptó. Los sitios reservados pasan a **Vendida**.
- **Perdido**: el cliente no compró. Te pedirá el motivo y los sitios se **liberan**.
- **Reabrir**: si un negocio cerrado vuelve a moverse.
- Menú **⋯**: **Editar** o **Eliminar**.

## Brief de campaña

Son los datos de la campaña que pide el cliente:

- **Medio**: Estática, Digital o Mixta.
- **Marca anunciante**: por ejemplo, *Pilsener*.
- **Categoría (competencia)**: el rubro de la marca (por ejemplo, *Bebidas alcohólicas*). Sirve para avisarte si otra marca del mismo rubro ya tiene un sitio en esas fechas.
- **Inicio y Fin de campaña**: las fechas de exhibición.
- **Zonas objetivo**: los departamentos donde el cliente quiere estar.
- **Comisión agencia %**: solo si vendes a través de una [agencia](academy:crear-cliente#cliente-directo-o-agencia).

## Pestañas

| Pestaña | Qué tiene |
| --- | --- |
| **Resumen** | Valor, probabilidad, brief de campaña, cliente, contacto y detalles. |
| **Sitios** | Las vallas y pantallas del negocio con sus reservas. Ver [Sitios y reservas](academy:crm-sitios-y-reservas). |
| **Actividad** | Historial y registro de notas, llamadas y reuniones. |
| **Tareas** | Pendientes de este negocio. |
| **Mensajes** | Correos y WhatsApp con el cliente. Ver [Correos y WhatsApp](academy:crm-mensajes-y-plantillas). |
| **Cotizaciones** | Cotizaciones vinculadas al negocio. |
| **Ejecución** | Aparece cuando hay cotizaciones vinculadas: producción, instalación, fotos y pantallas. |

## Registrar una nota, llamada o reunión

1. Ve a la pestaña **Actividad**.
2. Elige **Nota**, **Llamada** o **Reunión**.
3. Escribe lo que pasó (en llamadas y reuniones puedes poner el asunto y los minutos).
4. Haz clic en **Registrar** (o presiona **Ctrl + Enter**).

## Vincular una cotización

1. Ve a la pestaña **Cotizaciones**.
2. Haz clic en **Vincular cotización**.
3. Busca por número, cliente o empresa y haz clic en **Vincular**.

Si el negocio todavía no tenía valor, toma el total de la cotización. Para crear la cotización, ver [Crear una cotización de vallas](academy:crear-cotizacion-vallas).

## Ver la ejecución de la campaña

En la pestaña **Ejecución** revisas, sin preguntar a operaciones:

- **Vallas**: si la orden de producción está recibida, en producción o completada, cuándo se instaló, quién instaló y cuántas **fotos testigo** hay. Si a una valla aún no se le carga el arte, verás **Sin arte**. Si una valla se instaló pero no tiene fotos, se marca en amarillo.
- **Pantallas**: si la campaña está **Al aire**, **Programada** o **Pausada**, y si el **arte** ya se recibió.`,
  },
  {
    slug: 'crm-sitios-y-reservas',
    title: 'Sitios: buscar y reservar vallas y pantallas',
    category: 'crm',
    summary:
      'Agrega sitios a un negocio, entiende cada estado de disponibilidad y maneja tus reservas.',
    tags: [
      'reservar',
      'reserva',
      'hold',
      'sitios',
      'disponible',
      'apartar valla',
      'segunda opción',
      'competencia',
      'liberar',
    ],
    modules: [{ label: 'Abrir Pipeline', href: '/dashboard/crm/pipeline' }],
    related: ['crm-disponibilidad', 'crm-negocios', 'crear-cotizacion-vallas'],
    body: `Esta es la parte más importante para vender [OOH](academy:glosario#ooh) y [DOOH](academy:glosario#dooh). Abre un negocio y ve a la pestaña **Sitios**.

## Agregar sitios al negocio

1. Haz clic en **Agregar sitios**.
2. Se abre el buscador con las fechas de la campaña ya puestas. Puedes cambiarlas.
3. Usa los filtros: **Inicio y Fin de exhibición**, **Departamento**, **Buscar** (código, dirección o ciudad), **Todo / Vallas / Pantallas** y **Solo disponibles**.
4. Revisa el [estado de cada sitio](#estados-de-disponibilidad).
5. Marca los sitios que quieres. En las **pantallas**, indica los **Spots/día**.
6. Abajo verás cuántos seleccionaste y el **valor aproximado del periodo**.
7. Haz clic en **Agregar a propuesta**. Los sitios entran al negocio como **Propuesta**, todavía sin apartar.
8. Para apartarlos, [resérvalos](#reservar-sitios) desde la lista de sitios del negocio.

En el mapa, haz clic en una valla estática para ver sus **fotos** más recientes (mensuales, de instalación o de mantenimiento) con su fecha. Si tiene varias, cambia de foto con las miniaturas. Al hacer clic en un sitio de la lista, el mapa te lleva a su ubicación.

## Reservar sitios

Una reserva **aparta** el sitio para tu cliente durante unos días para que nadie más lo venda.

1. En la pestaña **Sitios** del negocio, marca los sitios que quieres apartar.
2. Haz clic en **Reservar (N)** y elige los días: **3, 7, 14 o 30**.

También puedes reservar un solo sitio desde su menú **⋯** con **Reservar**. Un sitio contratado o una pantalla sin cupo no se puede reservar: se queda como **Propuesta**.

## Estados de disponibilidad

| Estado | Qué significa | ¿Lo puedo ofrecer? |
| --- | --- | --- |
| **Disponible** | Libre en esas fechas. | Sí. |
| **Con reserva** | Otro negocio lo apartó. | Puedes reservarlo como **2ª opción**. |
| **Vendida (CRM)** | Otro negocio ya lo ganó. | No, busca otro. |
| **Contratada** | Ya tiene contrato en Brilo. | No, prueba otras fechas. |
| **Sin cupo** | La pantalla no tiene spots libres. | No, o baja los spots. |

Si ves la etiqueta amarilla **Competencia**, otra marca del mismo rubro tiene ese sitio en las mismas fechas.

## Manejar los sitios del negocio

En cada sitio, el menú **⋯** te permite:

- **Reservar** o **Extender reserva**: aparta el sitio o le da más días sin perder tu lugar de 1ª opción.
- **Volver a propuesta**: lo deja en el negocio sin apartarlo.
- **Liberar**: lo suelta para otros vendedores.
- **Editar fechas y tarifa**: cambia fechas, tarifa mensual o spots por día.
- **Quitar del negocio**.

También puedes marcar varios sitios y usar **Reservar (N)**, **Liberar** o **Quitar** para todos a la vez.

## Avisos en cada sitio

- **"Reservada hasta…"**: hasta cuándo está apartado.
- Texto amarillo: la reserva **vence pronto** o hay **otros negocios** sobre el mismo sitio.
- **"Reserva vencida"**: ya no está apartado. Extiende la reserva si el cliente sigue interesado.
- **"Cara contratada en Brilo"**: esa valla ya está contratada en esas fechas.

## Cómo se calcula el valor

Las tarifas son **mensuales** y se prorratean a meses de 30 días. Ejemplo: una valla de $1,000 al mes por 15 días = **$500**. Si el total de sitios no coincide con el valor del negocio, usa **Usar total como valor**.

## Qué pasa con las reservas al cerrar el negocio

- **Ganado**: los sitios reservados pasan a **Vendida**.
- **Perdido**: todos los sitios se **liberan** automáticamente.
- **Reabrir**: los sitios vuelven a quedar **reservados**.

> Las reservas del CRM **no bloquean** el sitio en Brilo. Son internas del equipo de Ventas. El contrato en Brilo se crea al aceptar la cotización. Ver [El contrato en Brilo](academy:contrato-en-brilo).`,
  },
  {
    slug: 'crm-disponibilidad',
    title: 'Disponibilidad: consultar inventario libre',
    category: 'crm',
    summary:
      'Busca vallas y pantallas libres en unas fechas sin abrir un negocio, mira sus fotos y agrégalas a uno.',
    tags: [
      'disponibilidad',
      'inventario',
      'qué hay libre',
      'vallas libres',
      'pantallas libres',
      'fotos de la valla',
      'mapa',
    ],
    modules: [
      { label: 'Abrir Disponibilidad', href: '/dashboard/crm/disponibilidad' },
    ],
    related: ['crm-sitios-y-reservas', 'crear-cotizacion-vallas', 'pantallas'],
    body: `**CRM → Disponibilidad** es el mismo buscador de [sitios](academy:crm-sitios-y-reservas), pero sin tener que abrir un negocio. Es útil cuando un cliente pregunta por teléfono: *"¿Qué tienen libre en San Salvador en diciembre?"*

[Abrir Disponibilidad](app:/dashboard/crm/disponibilidad)

## Paso a paso

1. Pon las fechas y los filtros.
2. Revisa los [estados de cada sitio](academy:crm-sitios-y-reservas#estados-de-disponibilidad).
3. Haz clic en una valla del mapa para ver sus fotos más recientes.
4. Si te interesa algo, elige el negocio en **Agregar al negocio**, marca los sitios y haz clic en **Agregar a propuesta**.
5. Con **Abrir negocio** vas al negocio elegido. Desde su pestaña **Sitios** puedes [reservar los sitios](academy:crm-sitios-y-reservas#reservar-sitios).`,
  },
  {
    slug: 'crm-renovaciones',
    title: 'Renovaciones',
    category: 'crm',
    summary:
      'Detecta contratos y campañas por terminar y crea el negocio de renovación con un clic.',
    tags: [
      'renovación',
      'renovar',
      'vencimiento',
      'contratos por terminar',
      'retener cliente',
    ],
    modules: [
      { label: 'Abrir Renovaciones', href: '/dashboard/crm/renovaciones' },
    ],
    related: ['contratos-por-vencer', 'crm-sitios-y-reservas', 'crm-pipeline'],
    body: `**CRM → Renovaciones** muestra los **contratos de vallas** y las **campañas digitales** que están por terminar, para ofrecer la renovación **antes** de que el espacio se libere.

[Abrir Renovaciones](app:/dashboard/crm/renovaciones)

## Cómo usarla

1. Elige la ventana: **Próximos 30, 60, 90 o 180 días**.
2. Elige **Mis cuentas** o **Todo VEO**.
3. Filtra por vallas o pantallas, o busca por cliente, marca o contrato.

Arriba verás **Por vencer**, **Sin gestionar** (¡empieza por estos!), **En negociación** y **Renovados**. Cada fila muestra una etiqueta como **"Vence en 12 d"** (roja si falta poco).

## Crear una renovación

Haz clic en **Crear renovación**. El sistema:

1. Crea un negocio nuevo con origen **Renovación**.
2. Pone como fechas el periodo siguiente (empieza el día después de que termina el actual y dura lo mismo).
3. Agrega las **mismas vallas o pantallas** como propuesta, con las tarifas de lista.
4. Abre el negocio para que revises, [reserves](academy:crm-sitios-y-reservas) y envíes la propuesta.

Si la renovación ya tiene negocio, en lugar del botón verás su estado.

## Preguntas comunes

- **"Cliente no vinculado"**: el contrato de Brilo no coincide con ningún cliente de VEO Services. Puedes crear la renovación igual y asignar el cliente después.
- **Valor de la renovación de vallas**: Brilo no guarda el precio por cara, así que se usa la **tarifa de lista**. Ajusta el valor si el cliente tenía un precio especial.`,
  },
  {
    slug: 'crm-clientes-contactos-tareas',
    title: 'Clientes, contactos y tareas en el CRM',
    category: 'crm',
    summary:
      'Historial por cliente, registrar contactos y organizar tus pendientes con tareas.',
    tags: [
      'clientes',
      'contactos',
      'tareas',
      'pendientes',
      'recordatorio',
      'seguimiento',
    ],
    modules: [
      { label: 'Abrir Tareas', href: '/dashboard/crm/tareas' },
      { label: 'Abrir Contactos', href: '/dashboard/crm/contactos' },
    ],
    related: ['crear-cliente', 'crm-negocios', 'crm-dia-tipico'],
    body: `## Clientes

En **CRM → Clientes** ves todas las empresas con sus negocios abiertos, lo ganado, sus cotizaciones y su última actividad. Haz clic en un cliente para ver sus pestañas: **Negocios**, **Contactos**, **Actividad**, **Mensajes**, **Cotizaciones**, **Contratos** (historial en Brilo) e **Información** (datos editables del cliente).

Puedes filtrar por tipo (**Directo** o **Agencia**) o ver solo los que tienen negocios abiertos. Para registrar un cliente nuevo usa el botón **Nuevo cliente**; ver [Registrar un cliente](academy:crear-cliente).

[Abrir Clientes del CRM](app:/dashboard/crm/clientes)

## Contactos

Los contactos son **las personas** con las que hablas (gerente de marketing, comprador, etc.).

1. Ve a **CRM → Contactos** y haz clic en **Nuevo contacto**.
2. Elige el **Cliente** al que pertenece.
3. Llena nombre, apellido, cargo, correo, teléfono y WhatsApp. Si dejas el WhatsApp vacío, se usa el teléfono.
4. Haz clic en **Crear contacto**.

La estrella indica el **contacto principal** del cliente.

## Tareas

Las tareas son tus recordatorios: llamar, enviar una propuesta, confirmar artes, etc.

1. Haz clic en **Nueva tarea** (desde **CRM → Tareas** o desde la pestaña **Tareas** de un negocio).
2. Escribe el **título**. Ejemplo: *"Llamar para confirmar artes"*.
3. Elige el **tipo** (Llamada, Correo, WhatsApp, Reunión, Seguimiento u Otro), la **prioridad**, la **fecha** y la **hora**.
4. Elige a quién se le **asigna**.
5. Haz clic en **Crear tarea**.

En **CRM → Tareas** hay cuatro pestañas: **Vencidas**, **Hoy**, **Próximas** y **Completadas**. Marca la casilla de una tarea cuando la termines.

[Abrir Tareas](app:/dashboard/crm/tareas)

> **Buena práctica:** todo negocio abierto debería tener siempre una próxima tarea.`,
  },
  {
    slug: 'crm-mensajes-y-plantillas',
    title: 'Correos, WhatsApp y plantillas',
    category: 'crm',
    summary:
      'Envía correos y WhatsApp desde el CRM y crea plantillas con variables que se llenan solas.',
    tags: [
      'correo',
      'email',
      'whatsapp',
      'plantillas',
      'variables',
      'enviar correo',
      'sincronizar respuestas',
    ],
    modules: [{ label: 'Abrir Plantillas', href: '/dashboard/crm/plantillas' }],
    related: [
      'crm-conectar-gmail-whatsapp',
      'enviar-contrato-firma',
      'crm-negocios',
    ],
    body: `Desde la pestaña **Mensajes** de un negocio, cliente o contacto. Antes, [conecta tu Gmail y WhatsApp](academy:crm-conectar-gmail-whatsapp).

## Enviar un correo

1. Haz clic en **Enviar correo**.
2. Revisa el destinatario (**Para**). Puedes agregar varios separados por coma.
3. Elige una **Plantilla** (opcional). El asunto y el mensaje se llenan solos con los datos del cliente y del negocio.
4. Ajusta el texto si quieres y envía.

Para traer las respuestas del cliente, haz clic en **Sincronizar respuestas**. Para contestar, usa **Responder** debajo del mensaje.

## Enviar un WhatsApp

1. Haz clic en **WhatsApp**.
2. Revisa el número (puedes escribirlo como *7777 7777* o *503 7777 7777*).
3. Escribe el mensaje o elige una plantilla.
4. Envía, o usa **Abrir en WhatsApp** para mandarlo desde tu teléfono o WhatsApp Web.

> **Regla de WhatsApp:** solo puedes escribir mensajes libres si el cliente te escribió en las **últimas 24 horas**. Para iniciar una conversación nueva necesitas una **plantilla aprobada por Meta**.

Debajo de cada mensaje verás su estado: enviado, entregado o leído.

## Crear una plantilla de correo

1. Ve a **CRM → Plantillas** y haz clic en **Nueva plantilla**.
2. Escribe el **Nombre**, el **Asunto** y una **Categoría**.
3. Escribe el mensaje en el editor (negritas, cursivas, listas y enlaces).
4. Inserta [variables](#variables-disponibles).
5. Revisa cómo se verá en la pestaña **Vista de correo**.
6. Activa **Compartir con el equipo de Ventas** si quieres que tus compañeros la usen.
7. Haz clic en **Crear plantilla**.

[Abrir Plantillas](app:/dashboard/crm/plantillas)

## Variables disponibles

Son palabras entre llaves dobles que se reemplazan con los datos reales al enviar.

| Variable | Se reemplaza por |
| --- | --- |
| \`{{contacto.nombre}}\` | Nombre del contacto |
| \`{{contacto.nombre_completo}}\` | Nombre y apellido |
| \`{{contacto.cargo}}\` | Cargo |
| \`{{cliente.empresa}}\` | Empresa del cliente |
| \`{{negocio.titulo}}\` | Nombre del negocio |
| \`{{negocio.valor}}\` | Valor del negocio |
| \`{{negocio.etapa}}\` | Etapa actual |
| \`{{campana.marca}}\` | Marca de la campaña |
| \`{{campana.medio}}\` | Tipo de medio |
| \`{{campana.inicio}}\` / \`{{campana.fin}}\` | Fechas de la campaña |
| \`{{campana.total_sitios}}\` | Cantidad de sitios |
| \`{{campana.sitios}}\` | Lista de los sitios con código y ubicación |
| \`{{asesor.nombre_completo}}\` | Tu nombre |
| \`{{asesor.correo}}\` | Tu correo |
| \`{{fecha.hoy}}\` | Fecha de hoy |

## Ejemplo de plantilla de propuesta

\`\`\`
Hola {{contacto.nombre}},

Te comparto la propuesta para la campaña de {{campana.marca}},
del {{campana.inicio}} al {{campana.fin}}.

Estos son los {{campana.total_sitios}} espacios reservados para ti:

{{campana.sitios}}

La reserva se mantiene por pocos días. ¿Lo confirmamos esta semana?

Saludos,
{{asesor.nombre_completo}}
\`\`\``,
  },
  {
    slug: 'crm-ajustes',
    title: 'Ajustes del CRM y pipelines',
    category: 'crm',
    summary:
      'Conexiones de correo y WhatsApp, y cómo configurar pipelines, etapas, probabilidades y alertas.',
    tags: [
      'ajustes',
      'configuración',
      'pipelines',
      'etapas',
      'probabilidad',
      'alertas',
    ],
    modules: [
      { label: 'Abrir Ajustes del CRM', href: '/dashboard/crm/ajustes' },
    ],
    related: ['crm-conectar-gmail-whatsapp', 'crm-pipeline'],
    body: `En **CRM → Ajustes** puedes:

- **Conectar o desconectar Gmail** y editar tu firma. Ver [Conectar Gmail y WhatsApp](academy:crm-conectar-gmail-whatsapp).
- **Conectar o desconectar WhatsApp**.
- **Configurar pipelines**.

[Abrir Ajustes del CRM](app:/dashboard/crm/ajustes)

## Configurar pipelines

Puedes crear pipelines nuevos (por ejemplo, uno solo para pantallas LED) y, por cada etapa, cambiar:

- El **nombre** y el **orden**.
- El **color**.
- La **probabilidad de cierre (%)**, que se usa para calcular el valor ponderado del pipeline.
- Los **días de alerta**: después de cuántos días sin actividad una tarjeta muestra el triángulo amarillo.

> Si eliminas un pipeline que ya tiene negocios, no se borra: se **archiva**.`,
  },
  {
    slug: 'crm-dia-tipico',
    title: 'Un día típico usando el CRM',
    category: 'crm',
    summary:
      'La rutina recomendada para un ejecutivo de ventas: qué revisar cada mañana y cada semana.',
    tags: [
      'rutina',
      'buenas prácticas',
      'día a día',
      'consejos',
      'productividad',
    ],
    modules: [{ label: 'Abrir CRM', href: '/dashboard/crm' }],
    related: ['proceso-de-venta', 'crm-sitios-y-reservas', 'crm-renovaciones'],
    body: `## Cada mañana

Abre el **Resumen** del CRM:

- Revisa las **tareas vencidas y de hoy**.
- Revisa las **reservas por vencer**: ¿extiendes, cierras o liberas?
- Revisa las **cotizaciones sin negocio** y crea los negocios que falten.

[Abrir CRM](app:/dashboard/crm)

## Cuando llega un brief nuevo

1. Crea el negocio y llena el [brief de campaña](academy:crm-negocios#brief-de-campana).
2. En la pestaña **Sitios**, busca lo disponible, [reserva](academy:crm-sitios-y-reservas) los mejores sitios y usa **Usar total como valor**.
3. Genera la [cotización](academy:crear-cotizacion-vallas) y envíala por correo con una plantilla que use la variable de sitios. Ver [plantillas](academy:crm-mensajes-y-plantillas#variables-disponibles).
4. Crea una **tarea** de seguimiento para dentro de 2 o 3 días.

## Cuando el cliente responde

- **Si acepta**: [acepta la cotización](academy:proceso-de-venta#paso-3-acepta-la-cotizacion) (el contrato en Brilo se crea solo) y marca **Ganado**. Luego sigue la instalación en **Ejecución**.
- **Si no acepta**: marca **Perdido** con el motivo. Los sitios se liberan solos.

## Una vez por semana

Revisa [Renovaciones](academy:crm-renovaciones) y crea los negocios de los contratos **sin gestionar**.`,
  },
];
