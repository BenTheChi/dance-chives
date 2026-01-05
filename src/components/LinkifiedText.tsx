import React from "react";

interface LinkifiedTextProps {
  text: string;
  className?: string;
}

/**
 * Component that automatically converts URLs and @handles in text to clickable links
 * - URLs (http, https, www) become regular links
 * - @handles become Instagram profile links
 * Links open in a new tab with security attributes
 */
export function LinkifiedText({ text, className }: LinkifiedTextProps) {
  // Regex to match URLs (http, https, www) and Instagram handles (@username)
  const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+)/g;
  const instagramRegex = /@([a-zA-Z0-9_.]+)/g;

  // Combined regex to split by both URLs and Instagram handles
  const combinedRegex = /(https?:\/\/[^\s]+|www\.[^\s]+|@[a-zA-Z0-9_.]+)/g;

  // Split text by URLs and Instagram handles
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
