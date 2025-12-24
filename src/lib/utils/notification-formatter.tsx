"use client";

import Link from "next/link";
import React from "react";

interface NotificationContext {
  eventId?: string | null;
  eventTitle?: string | null;
  sectionId?: string | null;
  sectionTitle?: string | null;
  videoId?: string | null;
  videoTitle?: string | null;
  role?: string | null;
}

/**
 * Formats a notification message with React elements (bold, links)
 */
export function formatNotificationMessage(
  notification: {
    type: string;
    title: string;
    message: string;
    relatedRequestType?: string | null;
    relatedRequestId?: string | null;
  },
  context: NotificationContext
): React.ReactNode {
  const { type, message } = notification;
  const { eventId, eventTitle, sectionId, sectionTitle, videoId, videoTitle, role } =
    context;

  // Handle TAGGED notifications
  if (type === "TAGGED") {
    const parts: React.ReactNode[] = [];
    parts.push("You have been tagged as a ");
    if (role) {
      parts.push(<strong key="role">{role}</strong>);
    } else {
      parts.push("a role");
    }
    parts.push(" for ");

    if (videoId && videoTitle && sectionId && eventId) {
      parts.push(
        <Link
          key="link"
          href={`/events/${eventId}/sections/${sectionId}?video=${videoId}`}
          className="text-primary hover:underline"
        >
          {videoTitle}
        </Link>
      );
    } else if (sectionId && sectionTitle && eventId) {
      parts.push(
        <Link
          key="link"
          href={`/events/${eventId}/sections/${sectionId}`}
          className="text-primary hover:underline"
        >
          {sectionTitle}
        </Link>
      );
    } else if (eventId && eventTitle) {
      parts.push(
        <Link
          key="link"
          href={`/events/${eventId}`}
          className="text-primary hover:underline"
        >
          {eventTitle}
        </Link>
      );
    } else {
      // Fallback to message if context is missing
      parts.push(message);
    }

    return <>{parts}</>;
  }

  // Handle REQUEST_APPROVED notifications
  if (type === "REQUEST_APPROVED") {
    // Parse message to extract role and resource
    // Format: "Your request as a **Role Name** for [Link]Event/Section/Video[/Link] has been approved"
    const parts: React.ReactNode[] = [];
    parts.push("Your request as a ");

    if (role) {
      parts.push(<strong key="role">{role}</strong>);
    }

    parts.push(" for ");

    if (videoId && videoTitle) {
      parts.push(
        <Link
          key="link"
          href={`/events/${eventId}/sections/${sectionId}?video=${videoId}`}
          className="text-primary hover:underline"
        >
          {videoTitle}
        </Link>
      );
    } else if (sectionId && sectionTitle) {
      parts.push(
        <Link
          key="link"
          href={`/events/${eventId}/sections/${sectionId}`}
          className="text-primary hover:underline"
        >
          {sectionTitle}
        </Link>
      );
    } else if (eventId && eventTitle) {
      parts.push(
        <Link
          key="link"
          href={`/events/${eventId}`}
          className="text-primary hover:underline"
        >
          {eventTitle}
        </Link>
      );
    }

    parts.push(" has been approved");

    return <>{parts}</>;
  }

  // Handle REQUEST_DENIED notifications
  if (type === "REQUEST_DENIED") {
    const parts: React.ReactNode[] = [];
    parts.push("Your request as a ");

    if (role) {
      parts.push(<strong key="role">{role}</strong>);
    }

    parts.push(" for ");

    if (videoId && videoTitle) {
      parts.push(
        <Link
          key="link"
          href={`/events/${eventId}/sections/${sectionId}?video=${videoId}`}
          className="text-primary hover:underline"
        >
          {videoTitle}
        </Link>
      );
    } else if (sectionId && sectionTitle) {
      parts.push(
        <Link
          key="link"
          href={`/events/${eventId}/sections/${sectionId}`}
          className="text-primary hover:underline"
        >
          {sectionTitle}
        </Link>
      );
    } else if (eventId && eventTitle) {
      parts.push(
        <Link
          key="link"
          href={`/events/${eventId}`}
          className="text-primary hover:underline"
        >
          {eventTitle}
        </Link>
      );
    }

    parts.push(" has been denied");

    return <>{parts}</>;
  }

  // Handle OWNERSHIP_TRANSFERRED notifications
  if (type === "OWNERSHIP_TRANSFERRED" || message.includes("transferred")) {
    const parts: React.ReactNode[] = [];
    parts.push("Ownership of ");

    if (eventId && eventTitle) {
      parts.push(
        <Link
          key="link"
          href={`/events/${eventId}`}
          className="text-primary hover:underline"
        >
          {eventTitle}
        </Link>
      );
    } else {
      // Fallback to parsing message
      parts.push(message);
    }

    parts.push(" has been transferred to you");

    return <>{parts}</>;
  }

  // Default: return message as-is
  return <>{message}</>;
}

