export const requiredText = {
  validate: (value: string) =>
    value.trim().length > 0 || "Este campo es obligatorio",
};

export function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-xs text-destructive">{message}</p>;
}
