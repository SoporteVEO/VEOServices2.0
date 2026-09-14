import type { OfferContractData } from "@/api/offers/offers.types";

/**
 * Verbatim content of the lease contract template (CONTRATO INBAKCAR.pdf).
 *
 * The wording, the bold runs and the ARRENDANTE details below are the signed
 * legal text: they are transcribed from the template and must not be reworded,
 * reordered or "cleaned up". Only the values that depend on the client and the
 * billboards are interpolated.
 */

/** A stretch of contract text; `bold` marks the runs the template emphasises. */
export interface ContractRun {
  text: string;
  bold?: boolean;
}

export interface ContractClause {
  /** Bold lead-in, e.g. "I) INSTALACIÓN Y CONTENIDO: ". */
  label: string;
  body: ContractRun[];
}

/** VEO's side of the contract, fixed by the template. */
export const LESSOR = {
  companyName: "ARHEDES S.A. DE C.V.",
  legalRepName: "JOSE RICARDO GARCIA PRIETO",
  legalRepDui: "03756374-6",
  city: "San Salvador",
  bankName: "Banco Cuscatlán de El Salvador",
  bankAccount: "001301-000053975",
  noticeAddress:
    "Avenida Víctor Manuel Mejía Lara, Casa 8, Colonia Campestre, San Salvador, El Salvador",
  noticePhone: "2528-7400",
} as const;

/** Blank the template prints when a DUI is unknown at signing time. */
export const DUI_PLACEHOLDER = "__________________";

const MONTHS_ES = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
];

/** "29 de agosto de 2026" — the dateline format used in the template. */
export function formatLongDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getUTCDate()} de ${MONTHS_ES[d.getUTCMonth()]} de ${d.getUTCFullYear()}`;
}

/** "01/09/2026" — zero-padded, as used in the summary table. */
export function formatPaddedDate(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const day = String(d.getUTCDate()).padStart(2, "0");
  const month = String(d.getUTCMonth() + 1).padStart(2, "0");
  return `${day}/${month}/${d.getUTCFullYear()}`;
}

/** "1/9/2026" — unpadded, as used in the "Vigencia" column. */
export function formatShortDate(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  return `${d.getUTCDate()}/${d.getUTCMonth() + 1}/${d.getUTCFullYear()}`;
}

export function formatMoney(value: number): string {
  return `$${value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Opening paragraph naming both parties. Reads as one justified block, so it is
 * built as runs rather than separate elements.
 */
export function buildPartiesParagraph(data: OfferContractData): ContractRun[] {
  const { client } = data;
  return [
    { text: LESSOR.companyName, bold: true },
    { text: ", de este domicilio, representada por " },
    { text: LESSOR.legalRepName, bold: true },
    {
      text: ", mayor de edad, de este domicilio, portador del Documento Único de Identidad No. ",
    },
    { text: LESSOR.legalRepDui, bold: true },
    { text: ", que en este contrato se llamará EL \u201cARRENDANTE\u201d; y por otra parte " },
    { text: client.legalRepName, bold: true },
    {
      text: `, del domicilio de ${client.domicile ?? LESSOR.city}, portador(a) del Documento Único de Identidad No. ${
        client.legalRepDui ?? DUI_PLACEHOLDER
      }, actuando en nombre y representación de `,
    },
    { text: client.companyName, bold: true },
    {
      text: ", que en este contrato se llamará EL \u201cCLIENTE\u201d, convenimos celebrar un contrato de arrendamiento de:",
    },
  ];
}

export const ACKNOWLEDGEMENT_PARAGRAPH =
  "Este Contrato está amparado por las cláusulas y condiciones que se detallan a continuación, por lo que \u201cEL CLIENTE\u201d certifica que ha leído y está de acuerdo con estas condiciones.";

export const IVA_NOTE =
  "Los precios detallados en este contrato no incluyen IVA.";

export function buildClauses(data: OfferContractData): ContractClause[] {
  return [
    {
      label: "I) INSTALACIÓN Y CONTENIDO: ",
      body: [
        {
          text: "EL ARRENDANTE instalará el material impreso en un máximo de 5 días hábiles, sujeto a condiciones climáticas, en las ubicaciones y condiciones aceptadas por EL CLIENTE. Toda reubicación o modificación posterior a la instalación será por cuenta de EL CLIENTE. El costo de producción del material (lona, vinil, papel o pintura) se cotiza por separado. EL CLIENTE deberá entregar el arte con 8 días de anticipación al inicio del contrato y será responsable del contenido publicitario; EL ARRENDANTE se reserva el derecho de admisión de mensajes ilícitos o contrarios a la industria publicitaria. EL CLIENTE no podrá ceder este contrato sin autorización previa y por escrito de EL ARRENDANTE. Si por causas ajenas a su control EL ARRENDANTE perdiera algún espacio contratado, podrá reponerlo en otra ubicación con el visto bueno de EL CLIENTE, o compensará proporcionalmente el tiempo de exposición perdido.",
        },
      ],
    },
    {
      label: "II) PRECIO Y MANTENIMIENTO: ",
      body: [
        {
          text: "El precio del contrato incluye el arrendamiento del espacio, impuestos y pagos a compañías eléctricas cuando aplique; no incluye producción de material ni instalación. EL ARRENDANTE mantendrá la estructura en buena presentación (poda, limpieza) y repondrá el material impreso dañado o perdido, salvo en casos de vandalismo por terceros.",
        },
      ],
    },
    {
      label: "III) FORMA DE PAGO E INCUMPLIMIENTO: ",
      body: [
        {
          text: "La facturación será mensual y EL CLIENTE pagará dentro de los 30 días siguientes a la emisión de la factura. Los pagos deberán realizarse mediante transferencia bancaria a nombre de ",
        },
        { text: LESSOR.companyName, bold: true },
        { text: `, ${LESSOR.bankName}, Cuenta Corriente No. ` },
        { text: LESSOR.bankAccount, bold: true },
        {
          text: ". EL CLIENTE deberá enviar el comprobante de transferencia a su asesor comercial como condición para la reservación y confirmación del espacio publicitario. En caso de mora, aplicará un recargo del 2.5% mensual sobre saldos vencidos, y EL ARRENDANTE podrá retirar los mensajes instalados y dar por terminado el contrato, exigiendo el pago total del alquiler pendiente. Los impuestos municipales y demás cargas fiscales sobre los anuncios corren por cuenta de EL CLIENTE.",
        },
      ],
    },
    {
      label: "IV) RESPONSABILIDAD DE AGENCIA Y CLIENTE: ",
      body: [
        {
          text: "Si el contrato se gestiona a través de una agencia publicitaria, ésta y EL CLIENTE serán responsables solidarios de las obligaciones aquí adquiridas. EL CLIENTE reconoce y se hace responsable de los actos de la persona que firma este contrato en su representación.",
        },
      ],
    },
    {
      label: "V) TERMINACIÓN Y RENOVACIÓN: ",
      body: [
        {
          text: "Cualquiera de las partes podrá dar por terminado este contrato mediante notificación escrita con al menos 60 días de anticipación a su vencimiento. Si ninguna de las partes notifica su intención de no renovar con al menos 30 días calendario de anticipación, el contrato se renovará automáticamente, ajustándose las tarifas de alquiler vigentes al nuevo período.",
        },
      ],
    },
    {
      label: "VI) NOTIFICACIONES: ",
      body: [
        {
          text: `Todo aviso entre las partes deberá realizarse por escrito. EL ARRENDANTE recibirá notificaciones en ${LESSOR.noticeAddress}, teléfono ${LESSOR.noticePhone}. A EL CLIENTE se le comunicará por escrito al correo electrónico `,
        },
        { text: data.client.notificationEmail ?? "", bold: true },
        {
          text: ", con al menos quince días de antelación. Cambios de domicilio o correo electrónico para notificaciones sólo surtirán efecto si se comunican conforme a esta cláusula.",
        },
      ],
    },
    {
      label: "VII) JURISDICCIÓN Y DISPOSICIONES GENERALES: ",
      body: [
        {
          text: "Las partes se someten a los Tribunales de la ciudad de San Salvador para cualquier controversia derivada de este contrato, renunciando al fuero de sus domicilios. Ninguna de las partes queda obligada por acuerdos o cláusulas no estipulados expresamente en este documento. Cualquier ajuste al canon mensual de las vallas contratadas requerirá el acuerdo escrito de ambas partes y sólo podrá aplicarse a partir de la renovación del contrato.",
        },
      ],
    },
  ];
}
