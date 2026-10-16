import type { AcademyArticleSource } from '../academy.types.js';

export const FINANZAS: AcademyArticleSource[] = [
  {
    slug: 'finanzas',
    title: 'Finanzas: qué es y quién tiene acceso',
    category: 'finanzas',
    summary:
      'Las cuatro páginas de Finanzas, qué permiso necesita cada una y cómo se conectan con Brilo.',
    tags: [
      'finanzas',
      'contabilidad',
      'bancos',
      'cuentas por cobrar',
      'facturación',
      'permisos',
      'subrol',
      'brilo',
    ],
    related: [
      'contabilidad',
      'bancos',
      'cuentas-por-cobrar',
      'facturacion',
    ],
    body: `El menú **Finanzas** reúne el trabajo del área financiera sin tener que entrar a Brilo. Todo lo que ves y registras aquí **se lee y se guarda directamente en Brilo**: VEO Services no guarda una copia aparte.

## Las cuatro páginas

| Página | Para qué sirve | Guía |
| --- | --- | --- |
| **Contabilidad** | Partidas contables, catálogo de cuentas y centros de costo. | [Contabilidad](academy:contabilidad) |
| **Bancos** | Abonos y cargos bancarios, y cuentas bancarias. | [Bancos](academy:bancos) |
| **Cuentas por cobrar** | Saldos de clientes, pagos, anticipos y límites de crédito. | [Cuentas por cobrar](academy:cuentas-por-cobrar) |
| **Facturación** | Facturas de venta y órdenes de facturación: PDF, envío por correo y finalizar. | [Facturación](academy:facturacion) |

## Quién tiene acceso

Cada página se habilita con un **subrol** que asigna un administrador en **Usuarios**:

| Subrol | Páginas |
| --- | --- |
| **Contabilidad** | Contabilidad |
| **Finanzas** | Bancos y Cuentas por cobrar |
| **Facturación** | Facturación |

> Ser administrador **no** da acceso a Finanzas por sí solo: también se necesita el subrol. Si no ves el menú, pide el subrol que corresponde a tu trabajo.

## Antes de registrar algo

- Lo que crees, edites o elimines en Finanzas **cambia Brilo de inmediato**. Revisa montos, fechas y cuentas antes de confirmar.
- Los filtros de fecha empiezan en el **mes actual**. Cámbialos arriba de cada tabla.
- Los estados que verás son los de Brilo: **Abierto**, **Finalizado**, **Posteado** y **Anulado**.`,
  },
  {
    slug: 'contabilidad',
    title: 'Contabilidad: partidas, cuentas y centros de costo',
    category: 'finanzas',
    summary:
      'Crea partidas contables, agrega sus movimientos y consulta el catálogo de cuentas y los centros de costo de Brilo.',
    tags: [
      'contabilidad',
      'partida',
      'partida contable',
      'movimientos',
      'debe',
      'haber',
      'catálogo de cuentas',
      'centro de costo',
    ],
    modules: [
      { label: 'Abrir Contabilidad', href: '/dashboard/finanzas/contabilidad' },
    ],
    related: ['finanzas', 'bancos'],
    body: `En **Finanzas → Contabilidad** trabajas las partidas contables de Brilo. Requiere el subrol **Contabilidad**. Tiene tres pestañas: **Partidas**, **Catálogo de cuentas** y **Centros de costo**.

[Abrir Contabilidad](app:/dashboard/finanzas/contabilidad)

## Partidas

La lista muestra el **Número**, la **Fecha**, el **Tipo**, la **Descripción** y el **Estado** de cada partida. Puedes buscar por número de partida, filtrar por tipo y por rango de fechas.

### Crear una partida

1. Haz clic en **Nueva partida**.
2. Llena la **Fecha**, el **Tipo de partida** y la **Descripción**. El **Número** es opcional: si lo dejas vacío, Brilo lo asigna.
3. Haz clic en **Crear partida**.

### Agregar movimientos

1. Haz clic en la partida para abrir su detalle.
2. En **Movimientos**, haz clic en **Agregar movimiento**.
3. Elige la **Cuenta contable** y, si la cuenta lo pide, el **Centro de costo**. Escribe el **Concepto** y el monto en **Debe** o en **Haber**. También puedes llenar el tipo y número de documento, la referencia y el sujeto.
4. Haz clic en **Agregar**.

Abajo verás el **Total debe**, el **Total haber** y la **Diferencia**. Una partida cuadrada tiene diferencia cero.

Con los íconos de cada movimiento lo puedes **editar** o **eliminar**. Si Brilo ya no permite modificar la partida, verás la etiqueta **Solo lectura**.

## Catálogo de cuentas

Consulta las cuentas de Brilo con su **Código**, **Nombre**, **Cuenta padre** y **Saldo**. Las etiquetas indican si es de **Detalle**, si **requiere centro de costo**, o si está **Bloqueada** o **Inactiva**. Esta pestaña es solo de consulta.

## Centros de costo

Lista de centros de costo con su código, nombre, centro padre y si está **Activo** o **Inactivo**. También es solo de consulta.`,
  },
  {
    slug: 'bancos',
    title: 'Bancos: abonos y cargos bancarios',
    category: 'finanzas',
    summary:
      'Registra abonos y cargos en las cuentas bancarias de Brilo y consulta las cuentas configuradas.',
    tags: [
      'bancos',
      'abono bancario',
      'cargo bancario',
      'cheque',
      'cuenta bancaria',
      'movimientos bancarios',
    ],
    modules: [{ label: 'Abrir Bancos', href: '/dashboard/finanzas/bancos' }],
    related: ['finanzas', 'cuentas-por-cobrar', 'contabilidad'],
    body: `En **Finanzas → Bancos** registras los movimientos de las cuentas bancarias en Brilo. Requiere el subrol **Finanzas**. Tiene tres pestañas: **Abonos**, **Cargos** y **Cuentas bancarias**.

[Abrir Bancos](app:/dashboard/finanzas/bancos)

## Registrar un abono

1. En la pestaña **Abonos**, haz clic en **Nuevo abono**.
2. Elige la **Cuenta bancaria** y el **Tipo**, y escribe el **Monto**.
3. Si aplica, llena el **Número**, la **Fecha**, la **Fecha aplica banco**, el **Centro de costo** y el **Motivo**.
4. Haz clic en **Registrar**.

## Registrar un cargo

Igual que un abono, desde la pestaña **Cargos** con **Nuevo cargo**. Además puedes indicar el **Acreedor / beneficiario** y marcar **Cheque entregado**.

## Eliminar un movimiento

Un abono o cargo se puede eliminar mientras no esté **Posteado** ni **Anulado**. Se borra también en Brilo.

## Cuentas bancarias

Consulta las cuentas configuradas en Brilo: banco, número de cuenta, cuenta contable, moneda, sucursal y si está **Activa** (y cuál es la **Preferida**). Es solo de consulta.`,
  },
  {
    slug: 'cuentas-por-cobrar',
    title: 'Cuentas por cobrar: saldos, pagos y anticipos',
    category: 'finanzas',
    summary:
      'Revisa lo que debe cada cliente y registra pagos a factura, abonos a cliente y anticipos en Brilo.',
    tags: [
      'cuentas por cobrar',
      'cxc',
      'cobros',
      'saldo',
      'vencido',
      'registrar pago',
      'abono',
      'anticipo',
      'límite de crédito',
    ],
    modules: [
      {
        label: 'Abrir Cuentas por cobrar',
        href: '/dashboard/finanzas/cuentas-por-cobrar',
      },
    ],
    related: ['finanzas', 'facturacion', 'bancos', 'facturacion-y-cxc'],
    body: `En **Finanzas → Cuentas por cobrar** ves lo que deben los clientes y registras sus pagos en Brilo. Requiere el subrol **Finanzas**. Tiene tres pestañas: **Saldos**, **Abonos a facturas** y **Límites de crédito**.

[Abrir Cuentas por cobrar](app:/dashboard/finanzas/cuentas-por-cobrar)

## Saldos

Cada cliente aparece con sus **Documentos**, lo **Vencido** y su **Saldo**. Filtra por cliente para encontrarlo rápido.

Haz clic en un cliente para ver su **Saldo total**, lo vencido y sus **Documentos pendientes** con fecha de emisión, vencimiento y saldo. Desde ahí puedes:

- **Abonar** a un documento específico.
- **Abonar a cliente**, sin elegir factura.
- **Registrar anticipo**.

## Registrar un pago

Haz clic en **Registrar pago** (o en las acciones del cliente) y elige el tipo:

| Tipo | Cuándo usarlo | Qué pide |
| --- | --- | --- |
| **A factura** | El cliente paga una factura concreta. | Tipo de documento, número de factura y fecha del pago. |
| **A cliente** | El pago se aplica al saldo del cliente. | Cliente, fecha del pago y, si sobra dinero, a qué anticipo va el excedente. |
| **Anticipo** | El cliente paga por adelantado. | Cliente, tipo de anticipo y, opcional, el documento de venta. |

En todos indicas el **Monto**, la **Forma de pago**, el **Banco**, el número de cheque o transferencia y notas. Haz clic en **Registrar pago** para guardarlo en Brilo.

> Los pagos registrados no se pueden anular desde aquí. Si te equivocaste, corrígelo en Brilo.

## Abonos a facturas

Historial de los abonos aplicados a facturas, con fecha, cliente, factura, concepto y valor. Busca por número de factura, cliente o fechas.

## Límites de crédito

Consulta el **límite de crédito** y el **plazo** en días de cada cliente.

## Carga masiva desde Excel

La carga de abonos desde un archivo de Excel sigue en **Herramientas → CxC** y es solo para administradores. Ver [Mis facturas y cuentas por cobrar](academy:facturacion-y-cxc#carga-masiva-de-abonos-solo-administradores).`,
  },
  {
    slug: 'facturacion',
    title: 'Facturación: facturas y órdenes de facturación',
    category: 'finanzas',
    summary:
      'Consulta facturas de venta y gestiona las órdenes de facturación de Brilo: PDF, envío por correo y finalizar.',
    tags: [
      'facturación',
      'facturas',
      'factura de venta',
      'orden de facturación',
      'odf',
      'enviar factura',
      'pdf',
      'finalizar',
    ],
    modules: [
      { label: 'Abrir Facturación', href: '/dashboard/finanzas/facturacion' },
    ],
    related: ['finanzas', 'cuentas-por-cobrar', 'facturacion-y-cxc'],
    body: `En **Finanzas → Facturación** consultas las facturas de venta y trabajas las órdenes de facturación de Brilo. Requiere el subrol **Facturación**. Tiene dos pestañas: **Facturas** y **Órdenes de facturación**.

[Abrir Facturación](app:/dashboard/finanzas/facturacion)

## Facturas

Lista de facturas con su **Documento**, **Fecha**, **Cliente**, **Total**, **Saldo** (o **Pagada**) y **Estado**. Busca por número de documento, cliente o fechas.

Haz clic en una factura para ver su vencimiento, NIT, forma de pago, plazo y vendedor; el **Detalle** de lo facturado; y los **Abonos** que ya recibió. Las facturas son solo de consulta.

## Órdenes de facturación

Arriba verás cuántas órdenes están **Abiertas**, **Finalizadas**, **Posteadas** y **Anuladas**. Puedes filtrar por tipo de documento (**Órdenes de facturación** o **Cotizaciones**), por estado y por fechas, o buscar por número, cliente o título.

Haz clic en una orden para abrir su detalle. Desde ahí puedes:

- **Ver PDF** del documento.
- **Enviar por correo**: agrega destinatarios en Para, CC o CCO, usa **Copiar al vendedor** o **Copiarme**, y haz clic en **Enviar**. En **Envíos anteriores** ves a quién ya se le mandó.
- **Finalizar** una orden abierta. Pide confirmación porque cambia el estado en Brilo.

> Las órdenes no se anulan desde aquí. Si ves una **Anulada**, se anuló en Brilo.`,
  },
];
