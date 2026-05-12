"use client";

import type { MeProfile, MeTeamMember } from "@/api/me/me.types";
import { ProfileActivityPanel } from "./profile-activity-panel";
import { ProfileForm } from "./profile-form";
import { ProfileHeader } from "./profile-header";
import { ProfileKpis } from "./profile-kpis";
import { TeamMemberInfo } from "./team-member-info";

export function ProfileSummary({
  profile,
  teamMember,
}: {
  profile: MeProfile;
  teamMember: MeTeamMember | null;
}) {
  return (
    <div className="flex flex-col gap-4">
      <ProfileHeader profile={profile} teamMember={teamMember} />

      <ProfileActivityPanel />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {teamMember ? <TeamMemberInfo teamMember={teamMember} /> : null}
        <ProfileKpis />
      </div>

      <ProfileForm profile={profile} />
    </div>
  );
}
