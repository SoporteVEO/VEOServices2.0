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
El ERP de VEO. Ahí viven los clientes oficiales, los **contratos**, la facturación y los cobros. VEO Services lee esa información. Ver [Crear el contrato en Brilo](academy:contrato-en-brilo).

### Cara
Cada lado de una valla que se puede vender. Una valla de dos caras puede tener dos clientes distintos.

### Contrato
El acuerdo oficial con el cliente, creado en Brilo con un código como **CON0613-26**. Debe estar **posteado** para aparecer en VEO Services.

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

### No encuentro el contrato al aceptar la cotización
En Brilo, el contrato debe estar **posteado** y **no anulado**. Revísalo y vuelve a buscarlo por su código CON. Ver [Crear el contrato en Brilo](academy:contrato-en-brilo).

### El contrato en PDF sale sin representante legal o sin dirección
Esos datos salen del cliente en Brilo. Complétalos en Brilo y vuelve a descargar el contrato con el botón **Contrato** en [Mis cotizaciones](app:/dashboard/my-space/offers).

### ¿Puedo editar una cotización?
Sí, mientras esté **Pendiente**. Una vez aceptada, ya no. Ver [Editar una cotización](academy:crear-cotizacion-mixta#editar-una-cotizacion).

### ¿Cómo doy un descuento?
Baja el precio directamente en la tabla de la cotización o escríbelo en **Condiciones especiales**. Ver [Cómo se calculan los precios](academy:crear-cotizacion-vallas#como-se-calculan-los-precios).

### ¿La cotización se envía sola al cliente?
No. Se descarga en PDF y tú se la envías, idealmente desde el [CRM](academy:crm-mensajes-y-plantillas).

### ¿El cliente puede firmar el contrato en la plataforma?
No. Descarga el contrato y envíaselo para que lo firme. Ver [Enviar el contrato para firma](academy:enviar-contrato-firma).

### Acepté una cotización por error
Márcala como **Rechazada**. Se desvincula el contrato, se elimina la orden de producción y se libera el espacio en pantallas. Ver [Rechazar una cotización](academy:aceptar-cotizacion#rechazar-una-cotizacion).

## Reportes y fotos

### El contrato no aparece en Reportes
Revisa el **Mes del reporte** y que el contrato esté posteado en Brilo y vigente en ese mes.

### No aparecen las fotos de una valla en el reporte
Revisa que la foto se haya subido con el **código de valla** correcto. Ver [Subir fotos](academy:subir-fotos#si-el-codigo-quedo-mal).

### ¿Cómo envío el reporte de instalación en vez del mensual?
Selecciona solo las fotos de instalación en el panel del contrato. Ver [Mensual, instalación o mantenimiento](academy:enviar-reporte#mensual-instalacion-o-mantenimiento).

## CRM

### ¿Por qué no puedo reservar un sitio?
Puede estar **contratado** en Brilo, **vendido** en otro negocio, o la pantalla **sin cupo**. Ver [Estados de disponibilidad](academy:crm-sitios-y-reservas#estados-de-disponibilidad).

### Otro vendedor tiene el sitio reservado
Resérvalo igual: quedarás como **2ª opción**. Si el otro lo libera, pierde el negocio o su reserva vence, tú quedas primero.

### Mi reserva venció, ¿perdí el sitio?
La reserva ya no te protege, pero el sitio sigue en tu negocio. Usa **Extender reserva** lo antes posible.

### No me llegan las respuestas de los correos
Haz clic en **Sincronizar respuestas** en la pestaña **Mensajes**. Si Gmail dice "Requiere atención", ve a [Ajustes](academy:crm-conectar-gmail-whatsapp#si-gmail-dice-requiere-atencion) y reconecta.

### ¿Dónde quedó el módulo Clientes?
Ahora está dentro del CRM, en **CRM → Clientes**. Ahí puedes crear clientes con **Nuevo cliente**, editarlos en la pestaña **Información** y ver sus contratos de Brilo en la pestaña **Contratos**. Ver [Registrar un cliente](academy:crear-cliente).

[Abrir Clientes](app:/dashboard/crm/clientes)

## Acceso

### No veo un módulo en el menú
El menú solo muestra los módulos a los que tienes permiso. Pide acceso a un administrador.

### ¿A quién le pregunto si no encuentro la respuesta?
Pregúntale a [Nexo](academy:nexo) o escríbele al administrador del sistema.`,
  },
];
