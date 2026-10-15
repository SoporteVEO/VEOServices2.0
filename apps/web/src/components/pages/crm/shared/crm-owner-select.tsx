"use client";

import { useCrmTeam } from "@/api/crm/crm.get";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { personName } from "../crm-format";

interface CrmOwnerSelectProps {
  value: string;
  onChange: (userId: string) => void;
  label?: string;
  className?: string;
  /** Extra leading options, e.g. "Todos" / "Yo" filters. */
  extraOptions?: { value: string; label: string }[];
}

export function CrmOwnerSelect({
  value,
  onChange,
  label,
  className,
  extraOptions = [],
}: CrmOwnerSelectProps) {
  const { data: team = [] } = useCrmTeam();

  return (
    <Select label={label} value={value} onValueChange={onChange}>
      <SelectTrigger className={className}>
        <SelectValue placeholder="Responsable" />
      </SelectTrigger>
      <SelectContent>
        {extraOptions.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
        {team.map((user) => (
          <SelectItem key={user.id} value={user.id}>
            {personName(user)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
