"use client";

import { useEffect } from "react";

interface GlobalErrorProps {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}

export default function GlobalError({
  error,
  unstable_retry,
}: GlobalErrorProps) {
  useEffect(() => {
    console.error("[GlobalError]", error);
  }, [error]);

  return (
    <html lang="es">
      <body
        style={{
          margin: 0,
          minHeight: "100dvh",
          fontFamily:
            "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
          background: "#0a0a0a",
          color: "#fafafa",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px",
        }}
      >
        <div
          style={{
            maxWidth: "440px",
            width: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "16px",
            textAlign: "center",
          }}
        >
          <div
            aria-hidden
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "9999px",
              background: "rgba(239, 68, 68, 0.15)",
              color: "#f87171",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "24px",
              fontWeight: 700,
            }}
          >
            !
          </div>
          <h1 style={{ margin: 0, fontSize: "18px", fontWeight: 600 }}>
            Error inesperado
          </h1>
          <p
            style={{
              margin: 0,
              fontSize: "14px",
              lineHeight: 1.5,
              color: "#a3a3a3",
            }}
          >
            Ocurrió un error crítico. Intenta recargar la página. Si el problema
            persiste, contacta a soporte.
          </p>
          {error.digest ? (
            <p
              style={{
                margin: 0,
                fontSize: "11px",
                color: "#737373",
                fontFamily: "ui-monospace, monospace",
              }}
            >
              {error.digest}
            </p>
          ) : null}
          <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
            <button
              type="button"
              onClick={unstable_retry}
              style={{
                padding: "8px 16px",
                fontSize: "14px",
                fontWeight: 500,
                borderRadius: "8px",
                background: "#fafafa",
                color: "#0a0a0a",
                border: "none",
                cursor: "pointer",
              }}
            >
              Reintentar
            </button>
            <button
              type="button"
              onClick={() => {
                window.location.href = "/";
              }}
              style={{
                padding: "8px 16px",
                fontSize: "14px",
                fontWeight: 500,
                borderRadius: "8px",
                background: "transparent",
                color: "#fafafa",
                border: "1px solid rgba(255,255,255,0.2)",
                cursor: "pointer",
              }}
            >
              Ir al inicio
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
