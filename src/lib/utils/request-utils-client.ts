/**
 * Client-safe utility functions for requests
 * These functions don't use any server-only dependencies (Prisma, database, etc.)
 */

/**
 * Breadcrumb item for request navigation
 */
export interface BreadcrumbItem {
  label: string;
  href: string;
}

/**
 * Generate breadcrumb trail for a request (event -> section -> video)
 * Only includes levels that exist
 */
export function generateRequestBreadcrumbs(request: {
  eventId?: string | null;
  eventTitle?: string | null;
  sectionId?: string | null;
  sectionTitle?: string | null;
  videoId?: string | null;
  videoTitle?: string | null;
}): BreadcrumbItem[] {
  const breadcrumbs: BreadcrumbItem[] = [];

  // Event (always present if eventId exists)
  if (request.eventId && request.eventTitle) {
    breadcrumbs.push({
      label: request.eventTitle,
      href: `/events/${request.eventId}`,
    });
  }

  // Section (only if sectionId exists)
  if (request.sectionId && request.sectionTitle && request.eventId) {
    breadcrumbs.push({
      label: request.sectionTitle,
      href: `/events/${request.eventId}/sections/${request.sectionId}`,
    });
  }

  // Video (only if videoId exists and we have sectionId)
  if (
    request.videoId &&
    request.videoTitle &&
    request.sectionId &&
    request.eventId
  ) {
    breadcrumbs.push({
      label: request.videoTitle,
      href: `/events/${request.eventId}/sections/${request.sectionId}?video=${request.videoId}`,
    });
  }

  return breadcrumbs;
}



