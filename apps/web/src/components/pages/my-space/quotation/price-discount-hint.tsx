import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";
import { formatDiscountPercent, type PriceDiscount } from "./offer-discounts";

/** Recommended price struck through, then the % and amount taken off it. */
export function PriceDiscountHint({
  discount,
  className,
}: {
  discount: PriceDiscount | null;
  className?: string;
}) {
  if (!discount) return null;
  return (
    <p
      className={cn(
        "flex flex-wrap items-baseline justify-end gap-x-1 whitespace-nowrap text-[11px] tabular-nums",
        className,
      )}
      title={`Precio recomendado ${formatMoney(discount.list)}`}
    >
      <span className="text-muted-foreground line-through">
        {formatMoney(discount.list)}
      </span>
      <span className="font-medium text-destructive">
        -{formatDiscountPercent(discount.percent)} (
        {formatMoney(discount.amount)})
      </span>
    </p>
  );
}
