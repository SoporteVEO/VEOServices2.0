import type { S3ImageType } from "@/api/s3-images/s3-images.get";

export type ReportType = "monthly" | "installation" | "maintenance";

export interface ReportTypeConfig {
  imageType: S3ImageType;
  shortLabel: string;
  fullTitle: string;
  coverTitle: string;
  fileNamePrefix: string;
  emptyImagesMessage: string;
}

export const REPORT_TYPE_CONFIG: Record<ReportType, ReportTypeConfig> = {
  monthly: {
    imageType: "STATIC_BILLBOARD_MONTHLY",
    shortLabel: "Mensual",
    fullTitle: "Reporte Mensual de Vallas",
    coverTitle: "REPORTE MENSUAL",
    fileNamePrefix: "Reporte Mensual",
    emptyImagesMessage:
      "Sin imágenes mensuales para este período. La diapositiva se incluirá sin imagen.",
  },
  installation: {
    imageType: "STATIC_BILLBOARD_INSTALLATION",
    shortLabel: "Instalación",
    fullTitle: "Reporte de Instalación de Vallas",
    coverTitle: "REPORTE DE INSTALACIÓN",
    fileNamePrefix: "Reporte de Instalación",
    emptyImagesMessage:
      "Sin imágenes de instalación para este período. La diapositiva se incluirá sin imagen.",
  },
  maintenance: {
    imageType: "STATIC_BILLBOARD_MAINTENANCE",
    shortLabel: "Mantenimiento",
    fullTitle: "Reporte de Mantenimiento de Vallas",
    coverTitle: "REPORTE DE MANTENIMIENTO",
    fileNamePrefix: "Reporte de Mantenimiento",
    emptyImagesMessage:
      "Sin imágenes de mantenimiento para este período. La diapositiva se incluirá sin imagen.",
  },
};
