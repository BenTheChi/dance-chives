"use client";

import { useRive } from "@rive-app/react-canvas";

type RiveLoaderProps = {
  size?: number;
  className?: string;
  ariaLabel?: string;
};

const RIVE_SRC = "/animations/chiveloader.riv";

export function RiveLoader({
  size,
  className,
  ariaLabel = "Loading",
}: RiveLoaderProps) {
  const { RiveComponent } = useRive({
    src: RIVE_SRC,
    autoplay: true,
  });

  return (
    <div
      className={className}
      style={size ? { width: size, height: size } : undefined}
      role="img"
      aria-label={ariaLabel}
    >
      <RiveComponent />
    </div>
  );
}
