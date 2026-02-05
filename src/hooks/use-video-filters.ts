"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { DEFAULT_VIDEO_FILTERS, VideoFilters } from "@/types/video-filter";
import {
  buildFilterParams,
  parseFiltersFromSearchParams,
} from "@/lib/utils/video-filters";

const FILTER_PARAM_KEYS = [
  "yearFrom",
  "yearTo",
  "cities",
  "styles",
  "finalsOnly",
  "noPrelims",
  "sortOrder",
] as const;

const hasFilterParams = (params: URLSearchParams) =>
  FILTER_PARAM_KEYS.some((key) => params.has(key));

type UseVideoFiltersOptions = {
  enableUrlRouting?: boolean;
};

export const useVideoFilters = (options: UseVideoFiltersOptions = {}) => {
  const { enableUrlRouting = false } = options;
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchParamsString = searchParams.toString();
  const { data: session } = useSession();

  const [savedFilterPreferences, setSavedFilterPreferences] =
    useState<VideoFilters | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const hasAppliedSavedFiltersRef = useRef(false);

  const filters = useMemo(() => {
    if (enableUrlRouting) {
      return { ...DEFAULT_VIDEO_FILTERS };
    }
    const parsed = parseFiltersFromSearchParams(searchParams);
    return { ...DEFAULT_VIDEO_FILTERS, ...parsed };
  }, [enableUrlRouting, searchParams, searchParamsString]);

  const applyFilters = useCallback(
    (targetFilters: VideoFilters) => {
      if (enableUrlRouting) return;
      const params = buildFilterParams(targetFilters);
      const query = params.toString();
      const currentPath = pathname ?? "/watch";
      const nextPath = query ? `${currentPath}?${query}` : currentPath;
      router.replace(nextPath, { scroll: false });
    },
    [enableUrlRouting, pathname, router]
  );

  useEffect(() => {
    if (!session?.user?.id) {
      setSavedFilterPreferences(null);
      hasAppliedSavedFiltersRef.current = false;
      return;
    }

    let isCancelled = false;

    fetch("/api/user/filter-preferences")
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("Unable to load preferences");
        }
        const data = await response.json();
        if (isCancelled) return;
        if (data && typeof data === "object") {
          setSavedFilterPreferences(data as VideoFilters);
          hasAppliedSavedFiltersRef.current = false;
        } else {
          setSavedFilterPreferences(null);
        }
      })
      .catch((error) => {
        if (isCancelled) return;
        console.error("Error loading saved filters:", error);
        setSavedFilterPreferences(null);
      });

    return () => {
      isCancelled = true;
    };
  }, [session?.user?.id]);

  useEffect(() => {
    if (enableUrlRouting) return;
    if (hasAppliedSavedFiltersRef.current) return;
    if (!savedFilterPreferences) return;
    if (hasFilterParams(searchParams)) return;
    applyFilters(savedFilterPreferences);
    hasAppliedSavedFiltersRef.current = true;
  }, [
    applyFilters,
    enableUrlRouting,
    savedFilterPreferences,
    searchParams,
    searchParamsString,
  ]);

  const saveFilters = useCallback(
    async (filtersToSave: VideoFilters) => {
      if (!session?.user?.id) return;
      setIsSaving(true);
      try {
        const response = await fetch("/api/user/filter-preferences", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(filtersToSave),
        });
        if (!response.ok) {
          throw new Error("Failed to save preferences");
        }
        setSavedFilterPreferences(filtersToSave);
        hasAppliedSavedFiltersRef.current = true;
        toast.success("Filter preferences saved");
      } catch (error) {
        console.error("Error saving filters:", error);
        toast.error("Unable to save filters");
      } finally {
        setIsSaving(false);
      }
    },
    [session?.user?.id]
  );

  const clearFilters = useCallback(async () => {
    if (session?.user?.id) {
      try {
        const response = await fetch("/api/user/filter-preferences", {
          method: "DELETE",
        });
        if (!response.ok) {
          throw new Error("Failed to clear preferences");
        }
        setSavedFilterPreferences(null);
        hasAppliedSavedFiltersRef.current = true;
        toast.success("Filter preferences cleared");
      } catch (error) {
        console.error("Error clearing saved filters:", error);
        toast.error("Unable to clear saved filters");
      }
    }

    applyFilters({ ...DEFAULT_VIDEO_FILTERS });
  }, [applyFilters, session?.user?.id]);

  return {
    filters,
    applyFilters,
    saveFilters,
    clearFilters,
    isSaving,
  };
};
