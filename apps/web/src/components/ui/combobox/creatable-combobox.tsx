"use client";

import { useState } from "react";
import { Combobox, type ComboboxOption } from "./combobox";

export type CreatableComboboxProps = React.ComponentProps<typeof Combobox> & {
  /** Creates an option from the search text and resolves to its value. */
  onCreate?: (name: string) => Promise<string | number>;
  createLabel?: (name: string) => string;
};

function normalize(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function hasOption(options: ComboboxOption[], name: string) {
  return options.some(
    (option) =>
      typeof option.label === "string" &&
      option.label.localeCompare(name, undefined, { sensitivity: "base" }) ===
        0,
  );
}

/** A `Combobox` that offers to create the searched option when it is missing. */
export function CreatableCombobox({
  onCreate,
  createLabel = (name) => `Crear «${name}»`,
  options,
  onChange,
  onSearch,
  onOpenChange,
  addLabel,
  onAdd,
  disabled,
  ...props
}: CreatableComboboxProps) {
  const [search, setSearch] = useState("");
  const [creating, setCreating] = useState(false);

  const name = normalize(search);
  const canCreate =
    !!onCreate && name.length >= 2 && !creating && !hasOption(options, name);

  function handleCreate() {
    if (!onCreate) return;
    setCreating(true);
    onCreate(name)
      .then((value) => onChange(value))
      .catch(() => {})
      .finally(() => setCreating(false));
  }

  return (
    <Combobox
      {...props}
      options={options}
      onChange={onChange}
      disabled={disabled || creating}
      onSearch={(value) => {
        setSearch(value);
        onSearch?.(value);
      }}
      onOpenChange={(open) => {
        if (open) setSearch("");
        onOpenChange?.(open);
      }}
      addLabel={canCreate ? createLabel(name) : addLabel}
      onAdd={canCreate ? handleCreate : onAdd}
    />
  );
}
