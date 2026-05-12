"use client";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/primitives/ui/avatar";
import { Badge } from "@/components/primitives/ui/badge";
import {
  Card,
  CardContent,
} from "@/components/primitives/ui/card";
import type { MeProfile, MeTeamMember } from "@/api/me/me.types";
import { roleBadge, subRoleBadge } from "@/components/pages/users/const";
import { cn } from "@/lib/utils";

function getInitials(firstName: string, lastName: string | null) {
  return [firstName, lastName ?? ""]
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function ProfileHeader({
  profile,
  teamMember,
}: {
  profile: MeProfile;
  teamMember: MeTeamMember | null;
}) {
  const fullName = [profile.firstName, profile.lastName]
    .filter(Boolean)
    .join(" ");
  const fallback = getInitials(profile.firstName, profile.lastName);
  const role = roleBadge[profile.role];

  return (
    <Card>
      <CardContent>
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
          <Avatar size="lg" className="size-16">
            {profile.image ? (
              <AvatarImage alt={fullName} src={profile.image} />
            ) : null}
            <AvatarFallback className="text-lg font-semibold">
              {fallback}
            </AvatarFallback>
          </Avatar>

          <div className="min-w-0 flex-1">
            <h2 className="truncate text-lg font-semibold tracking-tight">
              {fullName || "Usuario"}
            </h2>
            <p className="truncate text-sm text-muted-foreground">
              {profile.email}
            </p>
            {teamMember?.position ? (
              <p className="mt-0.5 truncate text-sm text-muted-foreground">
                {teamMember.position}
              </p>
            ) : null}

            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              <Badge variant={role.variant} className={cn(role.className)}>
                {role.label}
              </Badge>
              {profile.subRoles.map((sr) => {
                const badge = subRoleBadge[sr];
                return (
                  <Badge
                    key={sr}
                    variant={badge.variant}
                    className={cn(badge.className)}
                  >
                    {badge.label}
                  </Badge>
                );
              })}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
