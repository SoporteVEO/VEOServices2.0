"use client";

import { CalendarOff, LayoutGrid, Mail } from "lucide-react";
import { useMyProfile, useMyTeamMember } from "@/api/me/me.get";
import {
  IncapacidadesTab,
  ProfileSkeleton,
  ProfileSummary,
} from "@/components/pages/me";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function MePage() {
  const { data: profile, isLoading: isLoadingProfile } = useMyProfile();
  const { data: teamMember, isLoading: isLoadingTeamMember } =
    useMyTeamMember();

  const isLoading = isLoadingProfile || isLoadingTeamMember;

  return (
    <Tabs
      orientation="vertical"
      defaultValue="resumen"
      className="flex flex-1 gap-6"
    >
      <aside className="w-56 shrink-0">
        <TabsList className="w-full flex-col gap-1 bg-card p-2 ring-1 ring-foreground/10 hover:bg-card">
          <TabsTrigger
            value="resumen"
            className="w-full justify-start gap-2 px-3"
          >
            <LayoutGrid className="size-4" />
            Resumen
          </TabsTrigger>
          <TabsTrigger
            value="incapacidades"
            className="w-full justify-start gap-2 px-3"
          >
            <CalendarOff className="size-4" />
            Mis Incapacidades
          </TabsTrigger>
        </TabsList>
      </aside>

      <div className="min-w-0 flex-1">
        <TabsContent value="resumen" className="m-0 p-0">
          {isLoading || !profile ? (
            <ProfileSkeleton />
          ) : (
            <ProfileSummary profile={profile} teamMember={teamMember ?? null} />
          )}
        </TabsContent>

        <TabsContent value="incapacidades" className="m-0 p-0">
          <IncapacidadesTab />
        </TabsContent>
      </div>
    </Tabs>
  );
}
