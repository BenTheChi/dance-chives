import React from "react";

interface LinkifiedTextProps {
  text: string;
  className?: string;
}

/**
 * Component that automatically converts URLs and @handles in text to clickable links
 * - URLs (http, https, www) become regular links
 * - Email addresses (username@domain.com or @username@domain.com) become mailto: links
 * - @handles become Instagram profile links
 * Links open in a new tab with security attributes
 */
export function LinkifiedText({ text, className }: LinkifiedTextProps) {
  // Regex to match URLs (http, https, www)
  const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+)/g;
  // Regex to match Instagram handles (@username, but not email addresses)
  const instagramRegex = /@([a-zA-Z0-9_.]+)/g;

  // Combined regex to split by URLs, email addresses, and Instagram handles
  // Email regex must come before Instagram regex to match emails first
  // Match emails with leading @ first, then regular emails, then Instagram handles
  const combinedRegex = /(https?:\/\/[^\s]+|www\.[^\s]+|@[a-zA-Z0-9_.-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}|[a-zA-Z0-9_.-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}|@[a-zA-Z0-9_.]+)/g;

  // Split text by URLs, email addresses, and Instagram handles
  const parts = text.split(combinedRegex);

  return (
    <div className={className}>
      {parts.map((part, index) => {
        // Check if this part is a URL
        if (part.match(urlRegex)) {
          // Ensure URL has protocol
          const href = part.startsWith("www.") ? `https://${part}` : part;

          return (
            <a
              key={index}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent-blue hover:underline break-all"
            >
              {part}
            </a>
          );
        }

        // Check if this part is an email address (must check before Instagram)
        // Email addresses contain @ followed by domain with TLD (e.g., user@domain.com or @user@domain.com)
        // Check if part contains @ and looks like an email (has domain with TLD)
        if (part.includes("@") && /[a-zA-Z0-9_.-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(part)) {
          // Extract email (remove leading @ symbol if present)
          const email = part.startsWith("@") ? part.substring(1) : part;
          const href = `mailto:${email}`;

          return (
            <a
              key={index}
              href={href}
              className="text-accent-blue hover:underline break-all"
            >
              {part}
            </a>
          );
        }

        // Check if this part is an Instagram handle
        const instagramMatch = part.match(instagramRegex);
        if (instagramMatch) {
          // Extract username (remove @ symbol)
          const username = part.substring(1);
          const href = `https://instagram.com/${username}`;

          return (
            <a
              key={index}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent-blue hover:underline break-all"
            >
              {part}
            </a>
          );
        }

        // Regular text - preserve whitespace and line breaks
        return <span key={index}>{part}</span>;
      })}
    </div>
  );
}
