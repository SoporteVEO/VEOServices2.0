"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

export const MENTORSHIP_TABS = ["equipo", "mias", "panel"] as const;
export type MentorshipTab = (typeof MENTORSHIP_TABS)[number];

type Params = {
  tab?: MentorshipTab;
  session?: string | null;
  collaborator?: string | null;
};

/** Tab and open drawers live in the URL so notifications can deep-link to them. */
export function useMentorshipParams() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const tabParam = searchParams.get("tab");
  const tab = MENTORSHIP_TABS.find((value) => value === tabParam) ?? null;

  function update(next: Params) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(next)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, {
      scroll: false,
    });
  }

  return {
    tab,
    sessionId: searchParams.get("session"),
    collaboratorId: searchParams.get("collaborator"),
    setTab: (value: MentorshipTab) => update({ tab: value }),
    openSession: (id: string | null) =>
      update({ session: id, collaborator: null }),
    openCollaborator: (userId: string | null) =>
      update({ collaborator: userId, session: null }),
  };
}
