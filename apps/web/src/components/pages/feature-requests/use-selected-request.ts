"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

const PARAM = "request";

/** The open request lives in the URL so notifications can deep-link to it. */
export function useSelectedRequest() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const selectedId = searchParams.get(PARAM);

  function select(id: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (id) params.set(PARAM, id);
    else params.delete(PARAM);
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, {
      scroll: false,
    });
  }

  return { selectedId, select };
}
