"use client";

interface GoogleMapEmbedProps {
  latitude: number;
  longitude: number;
  zoom?: number;
  width?: string;
  height?: string;
  className?: string;
}

export function GoogleMapEmbed({
  latitude,
  longitude,
  zoom = 12,
  width = "100%",
  height = "450px",
  className = "",
}: GoogleMapEmbedProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  
  if (!apiKey) {
    return (
      <div className={`flex items-center justify-center bg-muted rounded-lg ${className}`} style={{ width, height }}>
        <p className="text-muted-foreground text-sm">
          Google Maps API key not configured
        </p>
      </div>
    );
  }

  const embedUrl = `https://www.google.com/maps/embed/v1/view?key=${apiKey}&center=${latitude},${longitude}&zoom=${zoom}`;

  return (
    <iframe
      width={width}
      height={height}
      style={{ border: 0 }}
      loading="lazy"
      allowFullScreen
      referrerPolicy="no-referrer-when-downgrade"
      src={embedUrl}
      className={className}
      title="City Location Map"
    />
  );
}

