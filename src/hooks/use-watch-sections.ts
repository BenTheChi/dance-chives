"use client";

import { useCallback, useEffect, useMemo } from "react";
import useSWRInfinite from "swr/infinite";
import { WATCH_SECTIONS_FETCH_LIMIT } from "@/constants/watch-sections";
import { buildFilterParams } from "@/lib/utils/video-filters";
import { VideoFilters } from "@/types/video-filter";
import { CombinedSectionPayload } from "@/types/event";

type UseWatchSectionsOptions = {
  disabled?: boolean;
};

export const useWatchSections = (
  filters: VideoFilters,
  initialSections: CombinedSectionPayload[],
  options: UseWatchSectionsOptions = {}
) => {
  const { disabled = false } = options;

  const getKey = useCallback(
    (pageIndex: number, previousPageData: CombinedSectionPayload[] | null) => {
      if (disabled) return null;
      if (pageIndex === 0) return "initial";
      if (
        previousPageData &&
        previousPageData.length < WATCH_SECTIONS_FETCH_LIMIT
      ) {
        return null;
      }
      const offset =
        initialSections.length + (pageIndex - 1) * WATCH_SECTIONS_FETCH_LIMIT;
      const params = buildFilterParams(filters);
      params.set("offset", offset.toString());
      return `/api/watch/sections?${params.toString()}`;
    },
    [disabled, filters, initialSections.length]
  );

  const fetchSectionsPage = useCallback(
    async (key: string) => {
      if (key === "initial") {
        return initialSections;
      }
      const response = await fetch(key);
      if (!response.ok) {
        throw new Error("Failed to load sections");
      }
      return (await response.json()) as CombinedSectionPayload[];
    },
    [initialSections]
  );

  const { data, error, isValidating, size, setSize } = useSWRInfinite(
    getKey,
    fetchSectionsPage,
    {
      keepPreviousData: true,
    }
  );

  useEffect(() => {
    if (disabled) return;
    setSize(1);
  }, [disabled, filters, setSize]);

  const sections = useMemo(() => {
    if (disabled) return initialSections;
    if (!data) return initialSections;
    const flat = data.flat();
    const seen = new Set<string>();
    return flat.filter((item) => {
      const id = item.section?.id;
      if (!id) return true;
      if (seen.has(id)) return false;
      seen.add(id);
      return true;
    });
  }, [data, disabled, initialSections]);
  const lastPage = data?.[data.length - 1];
  const hasMore = disabled
    ? false
    : (lastPage?.length ?? initialSections.length) >=
      WATCH_SECTIONS_FETCH_LIMIT;
  const isLoading = disabled ? false : !data && !error;
  const isLoadingMore =
    disabled ? false : isValidating && size > (data?.length ?? 0);

  const loadMore = useCallback(() => {
    if (!hasMore || isLoadingMore) return;
    setSize(size + 1);
  }, [hasMore, isLoadingMore, setSize, size]);

  return {
    sections,
    hasMore,
    isLoading,
    isLoadingMore,
    isValidating,
    loadMore,
    error,
  };
};
