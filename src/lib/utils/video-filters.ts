import { VideoFilters } from "@/types/video-filter";

const fourDigitPattern = /^\d{4}$/;

export const parseFiltersFromSearchParams = (
  params: URLSearchParams
): VideoFilters => {
  const filters: VideoFilters = {};

  const yearFrom = params.get("yearFrom");
  if (yearFrom && fourDigitPattern.test(yearFrom)) {
    filters.yearFrom = Number(yearFrom);
  }

  const yearTo = params.get("yearTo");
  if (yearTo && fourDigitPattern.test(yearTo)) {
    filters.yearTo = Number(yearTo);
  }

  const cities = params.get("cities");
  if (cities) {
    const list = cities
      .split(",")
      .map((city) => city.trim())
      .filter((city) => city.length > 0);
    if (list.length > 0) {
      filters.cities = list;
    }
  }

  const styles = params.get("styles");
  if (styles) {
    const list = styles
      .split(",")
      .map((style) => style.trim())
      .filter((style) => style.length > 0);
    if (list.length > 0) {
      filters.styles = list;
    }
  }

  if (params.get("finalsOnly") === "true") {
    filters.finalsOnly = true;
  }

  if (params.get("noPrelims") === "true") {
    filters.noPrelims = true;
  }

  const sortOrder = params.get("sortOrder");
  if (sortOrder === "asc" || sortOrder === "desc") {
    filters.sortOrder = sortOrder;
  }

  return filters;
};

export const buildFilterParams = (filters: VideoFilters): URLSearchParams => {
  const params = new URLSearchParams();
  const normalized = normalizeFilters(filters);

  if (typeof normalized.yearFrom === "number") {
    params.set("yearFrom", String(normalized.yearFrom));
  }
  if (typeof normalized.yearTo === "number") {
    params.set("yearTo", String(normalized.yearTo));
  }
  if (normalized.cities && normalized.cities.length > 0) {
    params.set("cities", normalized.cities.join(","));
  }
  if (normalized.styles && normalized.styles.length > 0) {
    params.set("styles", normalized.styles.join(","));
  }
  if (normalized.finalsOnly) {
    params.set("finalsOnly", "true");
  }
  if (normalized.noPrelims) {
    params.set("noPrelims", "true");
  }
  if (normalized.sortOrder) {
    params.set("sortOrder", normalized.sortOrder);
  }

  return params;
};

export const normalizeFilters = (filters: VideoFilters): VideoFilters => {
  const normalized: VideoFilters = {};
  if (typeof filters.yearFrom === "number") {
    normalized.yearFrom = filters.yearFrom;
  }
  if (typeof filters.yearTo === "number") {
    normalized.yearTo = filters.yearTo;
  }
  if (filters.cities && filters.cities.length > 0) {
    normalized.cities = Array.from(
      new Set(filters.cities.map((city) => city.trim()).filter(Boolean))
    ).sort();
  }
  if (filters.styles && filters.styles.length > 0) {
    normalized.styles = Array.from(
      new Set(filters.styles.map((style) => style.trim()).filter(Boolean))
    ).sort();
  }
  if (filters.finalsOnly) {
    normalized.finalsOnly = true;
  }
  if (filters.noPrelims) {
    normalized.noPrelims = true;
  }
  if (filters.sortOrder) {
    normalized.sortOrder = filters.sortOrder;
  }
  return normalized;
};

export const filtersAreEqual = (a: VideoFilters, b: VideoFilters): boolean => {
  const sanitizedA = normalizeFilters(a);
  const sanitizedB = normalizeFilters(b);
  return JSON.stringify(sanitizedA) === JSON.stringify(sanitizedB);
};
