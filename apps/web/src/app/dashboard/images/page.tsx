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

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <ImagesFilters value={filters} onChange={setFilters} />

        <Button
          icon={Plus}
          onClick={() => setUploadOpen(true)}
          className="self-start lg:self-auto"
        >
          Subir imagen
        </Button>
      </div>

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
