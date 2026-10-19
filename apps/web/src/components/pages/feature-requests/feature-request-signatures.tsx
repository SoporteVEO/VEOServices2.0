import type { FeatureRequestSignature } from "@/api/feature-requests/feature-requests.types";
import { Badge } from "@/components/primitives/ui/badge";
import { formatDateTime } from "./const";

type Props = {
  signatures: FeatureRequestSignature[];
  currentRound: number;
};

export function FeatureRequestSignatures({ signatures, currentRound }: Props) {
  if (signatures.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        Aún no hay firmas. Se solicitarán cuando desarrollo marque la
        funcionalidad como completada.
      </p>
    );
  }

  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {signatures.map((signature) => (
        <li
          key={signature.id}
          className="flex flex-col gap-2 border border-border bg-card p-3"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">
                {signature.signerName}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {signature.signerEmail}
              </p>
            </div>
            <Badge variant="outline" className="shrink-0">
              Entrega {signature.round}
              {signature.round === currentRound ? " · actual" : ""}
            </Badge>
          </div>
          <img
            src={signature.imageUrl}
            alt={`Firma de ${signature.signerName}`}
            className="aspect-[3/1] w-full border border-border bg-white object-contain"
          />
          <p className="text-xs text-muted-foreground tabular-nums">
            Firmado el {formatDateTime(signature.signedAt)}
          </p>
        </li>
      ))}
    </ul>
  );
}
