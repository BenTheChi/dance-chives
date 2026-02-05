"use client";

import { useCallback, useEffect, useMemo } from "react";
import useSWRInfinite from "swr/infinite";
import { WATCH_SECTIONS_FETCH_LIMIT } from "@/constants/watch-sections";
import { buildFilterParams } from "@/lib/utils/video-filters";
import { VideoFilters } from "@/types/video-filter";
import { CombinedSectionPayload } from "@/types/event";

type UseWatchSectionsOptions = {
  initialSections?: CombinedSectionPayload[];
  useInitialData?: boolean;
  disabled?: boolean;
};

const fetchSectionsPage = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Failed to load sections");
  }
  return (await response.json()) as CombinedSectionPayload[];
};

export const useWatchSections = (
  filters: VideoFilters,
  options: UseWatchSectionsOptions = {}
) => {
  const {
    initialSections = [],
    useInitialData = false,
    disabled = false,
  } = options;
  const serializedFilters = JSON.stringify(filters);
  const initialOffset = useInitialData ? initialSections.length : 0;

  const getKey = useCallback(
    (pageIndex: number, previousPageData: CombinedSectionPayload[] | null) => {
      if (disabled) return null;
      if (
        previousPageData &&
        previousPageData.length < WATCH_SECTIONS_FETCH_LIMIT
      ) {
        return null;
      }
      const offset =
        pageIndex === 0
          ? 0
          : initialOffset + (pageIndex - 1) * WATCH_SECTIONS_FETCH_LIMIT;
      const params = buildFilterParams(filters);
      params.set("offset", offset.toString());
      return `/api/watch/sections?${params.toString()}`;
    },
    [filters, initialOffset]
  );

  const { data, error, isValidating, size, setSize } = useSWRInfinite(
    getKey,
    fetchSectionsPage,
    {
      keepPreviousData: true,
      fallbackData:
        !disabled && useInitialData && initialSections.length > 0
          ? [initialSections]
          : undefined,
    }
  );

  useEffect(() => {
    if (disabled) return;
    setSize(1);
  }, [disabled, serializedFilters, setSize]);

  const sections = useMemo(
    () =>
      disabled
        ? initialSections
        : data
          ? data.flat()
          : useInitialData
            ? initialSections
            : [],
    [data, disabled, initialSections, useInitialData]
  );
  const lastPage = data?.[data.length - 1];
  const hasMore = disabled
    ? false
    : (lastPage?.length ?? (useInitialData ? initialSections.length : 0)) >=
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
