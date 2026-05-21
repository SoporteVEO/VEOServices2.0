"use client";

interface NumericCellInputProps {
  value: number;
  min?: number;
  step?: number;
  className?: string;
  onChange: (value: number) => void;
}

export function NumericCellInput({
  value,
  min,
  step,
  className,
  onChange,
}: NumericCellInputProps) {
  return (
    <input
      inputMode="decimal"
      className={
        className ??
        "h-7 w-24 rounded-md text-right text-sm tabular-nums outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40 bg-input px-3 py-1.5 border border-border shadow-sm"
      }
      value={Number.isFinite(value) ? value : 0}
      min={min}
      step={step}
      onChange={(e) => {
        const next = Number(e.target.value);
        onChange(Number.isFinite(next) ? next : 0);
      }}
    />
  );
}
