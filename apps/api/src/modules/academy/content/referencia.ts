import type { AcademyArticleSource } from '../academy.types.js';

export const REFERENCIA: AcademyArticleSource[] = [
  {
    slug: 'glosario',
    title: 'Glosario',
    category: 'referencia',
    summary:
      'Las palabras que usamos en VEO y en la plataforma, explicadas de forma sencilla.',
    tags: [
      'glosario',
      'definiciones',
      'qué significa',
      'términos',
      'vocabulario',
    ],
    related: ['preguntas-frecuentes', 'conoce-veo-services'],
    body: `Las palabras más comunes de VEO, en orden alfabético. Haz clic en los enlaces para ir a la guía donde se explica cada tema.

### Agencia
Empresa de publicidad que compra espacios en nombre de una o varias marcas. Se registra como tipo de cliente **Agencia**. Ver [Registrar un cliente](academy:crear-cliente).

### Brilo
El ERP de VEO. Ahí viven los clientes oficiales, los **contratos**, la facturación y los cobros. VEO Services lee esa información y, al aceptar una cotización con vallas estáticas, crea sola la cotización y el contrato en Brilo. Ver [El contrato en Brilo](academy:contrato-en-brilo).

### Cara
Cada lado de una valla que se puede vender. Una valla de dos caras puede tener dos clientes distintos.

### Contrato
El acuerdo oficial con el cliente en Brilo, con un código como **CON0613-26**. Para las vallas estáticas, VEO Services lo crea **posteado** al aceptar la cotización. Ver [El contrato en Brilo](academy:contrato-en-brilo).

### Contrato de arrendamiento
El PDF que se descarga al [aceptar una cotización](academy:aceptar-cotizacion). Es el documento que el cliente firma. Ver [Enviar el contrato para firma](academy:enviar-contrato-firma).

### Cotización
La propuesta económica que se envía al cliente, con número como **COT0001/26**. Puede estar **Pendiente**, **Aceptada** o **Rechazada**. Ver [Crear una cotización de vallas](academy:crear-cotizacion-vallas) y [Cotizar pantallas](academy:crear-cotizacion-mixta).

### DOOH
*Digital Out Of Home*: publicidad exterior en **pantallas digitales LED**. Se vende por [spots por día](#spots-por-dia) y por días. Ver [Pantallas digitales](academy:pantallas).

### Ejecutivo
El vendedor responsable de un contrato en Brilo. Define en qué **Mi Espacio** aparece el contrato y a quién se le atribuye la facturación.

### Negocio
Una oportunidad de venta dentro del [CRM](academy:crm-introduccion). Avanza por etapas hasta **Ganado** o **Perdido**.

### OOH
*Out Of Home*: publicidad exterior en **vallas estáticas** con lona impresa. Se cotiza con **impresión** (por metro cuadrado) y **arrendamiento** (mensual).

### OP (orden de pauta)
El pedido con el que Soporte Comercial solicita que una campaña entre a las pantallas digitales. Producción la revisa y la ingresa a las listas o la devuelve para corregir. Ver [Órdenes de pauta (OP)](academy:pantallas#ordenes-de-pauta-op).

### Orden de producción
La orden para imprimir e instalar las lonas de una venta. Se crea sola al aceptar una cotización con vallas. Por cada valla se carga un solo archivo: su **arte**. Ver [Órdenes de producción e instalación](academy:produccion).

### Posteado
Estado de un contrato en Brilo que indica que está confirmado. Solo los contratos posteados y no anulados aparecen en VEO Services.

### Reporte mensual
Documento PDF con las fotos del mes de las vallas de un contrato, enviada por correo al cliente. También existen el reporte de **instalación** y el de **mantenimiento**. Ver [Enviar reportes](academy:enviar-reporte).

### Reserva
Apartar un sitio en el CRM por unos días para que otro vendedor no lo venda. No bloquea el sitio en Brilo. Ver [Sitios y reservas](academy:crm-sitios-y-reservas).

### Spots por día
Cuántas veces al día aparece el anuncio en una pantalla digital. En las cotizaciones se elige entre 300, 450, 600 y 900.

### Valla
Estructura fija de publicidad exterior con una o más [caras](#cara). Se identifica con un código como **SS-0142**.

### Vigencia de la oferta
Fecha hasta la que es válida una cotización. Por defecto, 15 días después de crearla.`,
  },
  {
    slug: 'preguntas-frecuentes',
    title: 'Preguntas frecuentes',
    category: 'referencia',
    summary:
      'Respuestas rápidas a las dudas más comunes sobre cotizaciones, contratos, reportes y el CRM.',
    tags: ['preguntas', 'faq', 'dudas', 'ayuda', 'problemas', 'no aparece'],
    related: ['glosario', 'proceso-de-venta', 'nexo'],
    body: `## Cotizaciones y contratos

### ¿Tengo que crear el contrato en Brilo?
No, si la cotización tiene vallas estáticas: al aceptarla, VEO Services crea en Brilo la cotización y el contrato y los vincula solo. Ver [El contrato en Brilo](academy:contrato-en-brilo).

### Acepté la cotización pero Brilo dio error
La cotización sí quedó aceptada. Haz clic en **Reintentar Brilo** en la fila o en el detalle de la cotización. Ver [Si Brilo no responde](academy:contrato-en-brilo#si-brilo-no-responde).

### No aparece el cliente o el ejecutivo de Brilo al aceptar
Si el cliente de la cotización tiene un **Cliente Brilo** vinculado, se usa ese. Si no, se busca por el **correo** de la cotización, y el ejecutivo por el **nombre del asesor**. Si no coinciden, búscalos a mano en la ventana. Para que no vuelva a pasar, vincula el cliente en **CRM → Clientes → Información → Cliente en Brilo**. Si el cliente no existe en Brilo, pide que lo registren primero.

### No encuentro el contrato al aceptar una cotización de pantallas
Las cotizaciones sin vallas estáticas se vinculan a un contrato existente. En Brilo debe estar **posteado** y **no anulado**. Búscalo por su código CON.

### El contrato en PDF sale sin representante legal o sin dirección
Esos datos salen del cliente en Brilo. Complétalos en Brilo y vuelve a descargar el contrato con el botón **Contrato** en [Mis cotizaciones](app:/dashboard/my-space/offers).

### ¿Puedo editar una cotización?
Sí, mientras esté **Pendiente**. Una vez aceptada, ya no. Ver [Editar una cotización](academy:crear-cotizacion-mixta#editar-una-cotizacion).

### ¿Cómo doy un descuento?
Baja el precio directamente en la tabla de la cotización. Si la creas desde **Mis cotizaciones**, la plataforma muestra el descuento sobre el precio recomendado en la cotización y en el PDF. También puedes escribirlo en **Condiciones especiales**. Ver [Descuentos](academy:crear-cotizacion-mixta#descuentos).

### ¿La cotización se envía sola al cliente?
No. Se descarga en PDF y tú se la envías, idealmente desde el [CRM](academy:crm-mensajes-y-plantillas).

### ¿El cliente puede firmar el contrato en la plataforma?
No. Descarga el contrato y envíaselo para que lo firme. Ver [Enviar el contrato para firma](academy:enviar-contrato-firma).

### Acepté una cotización por error
Márcala como **Rechazada**. Se desvincula el contrato, se elimina la orden de producción y se libera el espacio en pantallas. El contrato sigue posteado en Brilo: pide que lo anulen allí. Ver [Rechazar una cotización](academy:aceptar-cotizacion#rechazar-una-cotizacion).

## Reportes y fotos

### El contrato no aparece en Testigos
Revisa el **Mes del reporte** y que el contrato esté posteado en Brilo y vigente en ese mes.

### No aparecen las fotos de una valla en el reporte
Revisa que la foto se haya subido con el **código de valla** correcto. Ver [Subir fotos](academy:subir-fotos#si-el-codigo-quedo-mal).

### ¿Cómo envío el reporte de instalación en vez del mensual?
Selecciona solo las fotos de instalación en el panel del contrato. Ver [Mensual, instalación o mantenimiento](academy:enviar-reporte#mensual-instalacion-o-mantenimiento).

## CRM

### ¿Por qué no puedo reservar un sitio?
Las reservas se hacen desde la pestaña **Sitios** del negocio, no desde el buscador. Si ahí tampoco puedes, el sitio puede estar **contratado** en Brilo, **vendido** en otro negocio, o la pantalla **sin cupo**. Ver [Reservar sitios](academy:crm-sitios-y-reservas#reservar-sitios) y [Estados de disponibilidad](academy:crm-sitios-y-reservas#estados-de-disponibilidad).

### Otro vendedor tiene el sitio reservado
Resérvalo igual: quedarás como **2ª opción**. Si el otro lo libera, pierde el negocio o su reserva vence, tú quedas primero.

### Mi reserva venció, ¿perdí el sitio?
La reserva ya no te protege, pero el sitio sigue en tu negocio. Usa **Extender reserva** lo antes posible.

### No me llegan las respuestas de los correos
Haz clic en **Sincronizar respuestas** en la pestaña **Mensajes**. Si Gmail dice "Requiere atención", ve a [Ajustes](academy:crm-conectar-gmail-whatsapp#si-gmail-dice-requiere-atencion) y reconecta.

### ¿Dónde quedó el módulo Clientes?
Ahora está dentro del CRM, en **CRM → Clientes**. Ahí puedes crear clientes con **Nuevo cliente**, editarlos en la pestaña **Información** y ver sus contratos de Brilo en la pestaña **Contratos**. Los correos y teléfonos se agregan como **contactos**. Ver [Registrar un cliente](academy:crear-cliente).

[Abrir Clientes](app:/dashboard/crm/clientes)

### ¿Dónde está la empresa o el correo del cliente?
El cliente solo lleva **nombre** y **tipo**. Los correos y teléfonos están en sus **contactos**, y el **principal** es el que se propone en cotizaciones, mensajes y reportes. Ver [Contactos](academy:crm-clientes-contactos-tareas#contactos).

## Plataforma

### ¿Cómo voy rápido a un módulo?
Usa el **buscador de módulos**: la lupa de arriba a la derecha o **Ctrl + K**. Ver [Buscar un módulo](academy:conoce-veo-services#buscar-un-modulo).

### No me llegan los avisos del navegador
Actívalos con el botón **Activar** del aviso superior o desde la **campana** de notificaciones. Si el navegador los tiene **bloqueados**, permítelos desde el candado de la barra de direcciones. Al cerrar sesión se desactivan en ese equipo, así que vuelve a activarlos si usas otro. Ver [Notificaciones](academy:conoce-veo-services#notificaciones).

### ¿Dónde quedó «Mis órdenes» en Mi Espacio?
Ahora se llama **Producción Vallas**. Sigue siendo ahí donde cargas el arte de tus vallas. Ver [Mi Espacio](academy:mi-espacio).

### No veo una cotización rechazada
**Mis cotizaciones** ya no muestra las rechazadas. Las aceptadas y pendientes siguen en la lista.

## Solicitudes de funcionalidad

### ¿Cómo pido una mejora a la plataforma?
Desde **Solicitar funcionalidad**, al final del menú. Descargas el formato, lo llenas, lo guardas en PDF y lo subes con un título y un resumen. Ver [Solicitar una nueva funcionalidad](academy:solicitar-funcionalidad#crear-una-solicitud).

[Abrir Solicitar funcionalidad](app:/dashboard/solicitudes)

### No puedo enviar la solicitud
Falta algo: el PDF es obligatorio (máximo 25 MB), el título debe tener al menos 3 letras y el resumen al menos 10.

### ¿Puedo pedir una funcionalidad entre varias personas?
Sí. Agrega **colaboradores** al crearla o después, en **Participantes**. Ellos ven el avance, reciben los avisos y también firman la aprobación. Ver [Colaboradores](academy:solicitar-funcionalidad#colaboradores).

### Desarrollo terminó mi solicitud, ¿qué hago?
Pruébala y, si funciona bien, abre la solicitud y haz clic en **Firmar aprobación**. Si encuentras un problema, usa **Reportar problema** en lugar de firmar. Ver [Aprobar con tu firma](academy:solicitar-funcionalidad#aprobar-con-tu-firma).

### La solicitud sigue en "Por aprobar"
Falta la firma de alguno de los participantes (quien la creó o algún colaborador). En **Participantes** ves quién ya firmó y quién está pendiente.

## Acceso

### No veo un módulo en el menú
El menú solo muestra los módulos a los que tienes permiso. Pide acceso a un administrador.

### ¿A quién le pregunto si no encuentro la respuesta?
Pregúntale a [Nexo](academy:nexo) o escríbele al administrador del sistema.`,
  },
];
