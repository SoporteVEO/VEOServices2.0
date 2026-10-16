import { Badge } from "@/components/primitives/ui/badge";

type Props = {
  annulled?: boolean;
  posted?: boolean;
  finalized?: boolean;
};

export function FinanceStatusBadge({ annulled, posted, finalized }: Props) {
  if (annulled) return <Badge variant="destructive">Anulado</Badge>;
  if (posted) return <Badge variant="success">Posteado</Badge>;
  if (finalized) return <Badge variant="info">Finalizado</Badge>;
  return <Badge variant="warning">Abierto</Badge>;
}
