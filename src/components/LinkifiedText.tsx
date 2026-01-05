import React from "react";

interface LinkifiedTextProps {
  text: string;
  className?: string;
}

/**
 * Component that automatically converts URLs in text to clickable links
 * Links open in a new tab with security attributes
 */
export function LinkifiedText({ text, className }: LinkifiedTextProps) {
  // Regex to match URLs (http, https, www)
  const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+)/g;

  // Split text by URLs and create array of parts
  const parts = text.split(urlRegex);

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
        
        // Regular text - preserve whitespace and line breaks
        return <span key={index}>{part}</span>;
      })}
    </div>
  );
}

