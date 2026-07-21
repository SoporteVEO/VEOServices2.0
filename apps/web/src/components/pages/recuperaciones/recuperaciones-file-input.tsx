"use client";

import { useRef, useState } from "react";
import { FileSpreadsheet, Loader2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  parseRecuperacionesFile,
  type ParsedRecuperacionWorkbook,
} from "./parse-recuperaciones-excel";

interface RecuperacionesFileInputProps {
  fileName: string | null;
  onWorkbookParsed: (
    workbook: ParsedRecuperacionWorkbook,
    file: File,
  ) => void;
  onReset: () => void;
}

const ACCEPTED_EXTENSIONS = [".xlsx", ".xls", ".xlsm"];

export function RecuperacionesFileInput({
  fileName,
  onWorkbookParsed,
  onReset,
}: RecuperacionesFileInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isParsing, setIsParsing] = useState(false);

  async function handleFile(file: File) {
    const extension = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
    if (!ACCEPTED_EXTENSIONS.includes(extension)) {
      toast.error(
        `Formato no soportado. Usa un archivo ${ACCEPTED_EXTENSIONS.join(", ")}.`,
      );
      return;
    }

    setIsParsing(true);
    try {
      const parsed = await parseRecuperacionesFile(file);
      if (parsed.sheets.length === 0) {
        toast.error(
          "No se encontraron hojas con el formato esperado (CLIENTE, NUMERO DE FACTURA, $ RECUPERADO, etc.).",
        );
        return;
      }
      onWorkbookParsed(parsed, file);
      toast.success(
        `Se encontraron ${parsed.sheets.length} hoja${
          parsed.sheets.length === 1 ? "" : "s"
        } válida${parsed.sheets.length === 1 ? "" : "s"}.`,
      );
    } catch (err) {
      console.error(err);
      toast.error(
        err instanceof Error
          ? err.message
          : "No se pudo leer el archivo. Verifica que sea un Excel válido.",
      );
    } finally {
      setIsParsing(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) void handleFile(file);
  }

  function handleClickUpload() {
    inputRef.current?.click();
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_EXTENSIONS.join(",")}
        className="hidden"
        onChange={handleChange}
      />
      <Button
        type="button"
        onClick={handleClickUpload}
        disabled={isParsing}
        icon={isParsing ? Loader2 : Upload}
        iconClassName={isParsing ? "animate-spin" : undefined}
      >
        {fileName ? "Cargar otro archivo" : "Subir archivo de Excel"}
      </Button>
      {fileName ? (
        <div className="flex items-center gap-2 rounded-md border border-border bg-muted/40 px-3 py-1.5 text-sm">
          <FileSpreadsheet
            className="size-4 text-muted-foreground"
            aria-hidden
          />
          <span className="truncate font-medium">{fileName}</span>
          <Button
            type="button"
            variant="ghost"
            sizeVariant="sm"
            onClick={onReset}
            disabled={isParsing}
          >
            Quitar
          </Button>
        </div>
      ) : null}
    </div>
  );
}
