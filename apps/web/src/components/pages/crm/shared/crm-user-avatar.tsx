import type { CrmUserSummary } from "@/api/crm/crm.types";
import { Avatar, AvatarFallback } from "@/components/primitives/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/primitives/ui/tooltip";
import { personInitials, personName } from "../crm-format";

export function CrmUserAvatar({
  user,
  size = "sm",
}: {
  user: CrmUserSummary;
  size?: "sm" | "default" | "lg";
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Avatar size={size}>
          <AvatarFallback className="text-[10px] font-semibold">
            {personInitials(user)}
          </AvatarFallback>
        </Avatar>
      </TooltipTrigger>
      <TooltipContent side="top">{personName(user)}</TooltipContent>
    </Tooltip>
  );
}
