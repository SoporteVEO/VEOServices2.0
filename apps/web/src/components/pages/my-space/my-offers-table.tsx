"use client";

import { useState } from "react";
import type { OfferListItem } from "@/api/offers/offers.types";
import { DataTable } from "@/components/ui/data-table";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useMyOffers } from "@/api/offers/offers.get";
import { MyOfferDetailDrawer } from "./my-offer-detail-drawer";
import { MY_OFFERS_COLUMNS } from "./my-offers-columns";
import {
  MY_OFFERS_DEFAULT_PAGE_SIZE,
  MY_OFFERS_EMPTY_MESSAGE,
  MY_OFFERS_SEARCH_PLACEHOLDER,
} from "./const";
import { useMySpaceViewAs } from "./my-space-view-as-context";

export function MyOffersTable() {
  const { viewAsUserId } = useMySpaceViewAs();
  const [search, setSearch] = useState("");
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(MY_OFFERS_DEFAULT_PAGE_SIZE);
  const [selectedOffer, setSelectedOffer] = useState<OfferListItem | null>(
    null,
  );

  const debouncedSearch = useDebouncedValue(search.trim(), 300);

  const { data, isLoading } = useMyOffers({
    page: pageIndex + 1,
    pageSize,
    search: debouncedSearch || undefined,
    viewAsUserId,
  });

  function handleSearchChange(value: string) {
    setSearch(value);
    setPageIndex(0);
  }

  function handlePageSizeChange(size: number) {
    setPageSize(size);
    setPageIndex(0);
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <DataTable
        columns={MY_OFFERS_COLUMNS}
        data={data?.data ?? []}
        isLoading={isLoading}
        searchValue={search}
        onSearchChange={handleSearchChange}
        searchPlaceholder={MY_OFFERS_SEARCH_PLACEHOLDER}
        emptyMessage={MY_OFFERS_EMPTY_MESSAGE}
        onRowClick={setSelectedOffer}
        manualPagination={{
          pageIndex,
          pageSize,
          total: data?.total ?? 0,
          onPageIndexChange: setPageIndex,
          onPageSizeChange: handlePageSizeChange,
        }}
      />

      <MyOfferDetailDrawer
        offerId={selectedOffer?.id ?? null}
        open={!!selectedOffer}
        onOpenChange={(open) => {
          if (!open) setSelectedOffer(null);
        }}
      />
    </div>
  );
}
