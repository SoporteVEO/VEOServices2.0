"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { useS3Images } from "@/api/s3-images/s3-images.get";
import { Button } from "@/components/ui/button";
import {
  DEFAULT_IMAGES_FILTERS,
  ImagesFilters,
  ImagesGrid,
  UploadImageDialog,
  type ImagesFiltersState,
} from "@/components/pages/images";
import { useDebouncedValue } from "@/hooks/use-debounced-value";

export default function ImagesPage() {
  const [uploadOpen, setUploadOpen] = useState(false);
  const [filters, setFilters] = useState<ImagesFiltersState>(
    DEFAULT_IMAGES_FILTERS,
  );

  const debouncedCode = useDebouncedValue(filters.code.trim(), 300);

  const query = useS3Images({
    code: debouncedCode || undefined,
    uploadedUserId: filters.uploadedUserId ?? undefined,
    type: filters.s3ImageType ?? undefined,
    dateFrom: filters.dateFrom ?? undefined,
    dateTo: filters.dateTo ?? undefined,
    sortOrder: filters.sortOrder,
  });

  const images = useMemo(
    () => query.data?.pages.flatMap((page) => page.data) ?? [],
    [query.data],
  );

  const uploadButton = (
    <Button
      icon={Plus}
      onClick={() => setUploadOpen(true)}
      aria-label="Subir imagen"
    >
      <span className="hidden sm:inline">Subir imagen</span>
    </Button>
  );

  return (
    <div className="flex flex-1 flex-col gap-4 lg:gap-6">
      <ImagesFilters
        value={filters}
        onChange={setFilters}
        actions={uploadButton}
      />

      <ImagesGrid
        images={images}
        isLoading={query.isLoading}
        isFetchingNextPage={query.isFetchingNextPage}
        hasNextPage={query.hasNextPage}
        onLoadMore={query.fetchNextPage}
      />

      <UploadImageDialog open={uploadOpen} onOpenChange={setUploadOpen} />
    </div>
  );
}
