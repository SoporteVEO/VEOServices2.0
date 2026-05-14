"use client";

import type { MeProfile, MeTeamMember } from "@/api/me/me.types";
import { ProfileActivityPanel } from "./profile-activity-panel";
import { ProfileForm } from "./profile-form";
import { ProfileHeader } from "./profile-header";
import { ProfileKpis } from "./profile-kpis";
import { MeTeamMemberBankCard } from "./me-team-member-bank-card";
import { MeTeamMemberBusinessReadonly } from "./me-team-member-business-readonly";
import { MeTeamMemberVisibleCommentsCard } from "./me-team-member-visible-comments-card";
import { MeTeamMemberEmergencyCard } from "./me-team-member-emergency-card";
import { MeTeamMemberPersonalCard } from "./me-team-member-personal-card";

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

      <div className="flex min-w-0 flex-col gap-4">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {teamMember ? (
            <>
              <ProfileKpis />
              <MeTeamMemberBusinessReadonly teamMember={teamMember} />
              <div className="min-w-0 lg:col-span-2">
                <MeTeamMemberVisibleCommentsCard teamMember={teamMember} />
              </div>
              <div className="min-w-0 lg:col-span-2">
                <MeTeamMemberPersonalCard teamMember={teamMember} />
              </div>
              <div className="min-w-0 lg:col-span-2">
                <MeTeamMemberEmergencyCard teamMember={teamMember} />
              </div>
              <div className="min-w-0 lg:col-span-2">
                <MeTeamMemberBankCard teamMember={teamMember} />
              </div>
            </>
          ) : null}
          <div className="min-w-0 lg:col-span-2">
            <ProfileForm profile={profile} />
          </div>
        </div>
      </div>
    </div>
  );
}
