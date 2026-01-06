"use client";

import * as React from "react";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { HexColorPicker } from "react-colorful";
import { UploadIcon, X } from "lucide-react";

interface PosterUploadProps {
  initialPoster?: string | null;
  initialPosterFile?: File | null; // File from form state to restore preview
  onFileChange: (data: { file: File | null; bgColor: string }) => void;
  editable: boolean;
  maxFiles?: number; // Kept for compatibility, always 1 for posters
  className?: string;
  initialBgColor?: string;
}

export function PosterUpload({
  initialPoster,
  initialPosterFile,
  onFileChange,
  editable,
  maxFiles = 1,
  className = "",
  initialBgColor = "#ffffff",
}: PosterUploadProps) {
  const [posterFile, setPosterFile] = useState<File | null>(
    initialPosterFile || null
  );
  const [bgColor, setBgColor] = useState<string>(initialBgColor);
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const previewImageRef = useRef<HTMLImageElement | null>(null);
  const prevInitialPosterFileRef = useRef<File | null | undefined>(
    initialPosterFile
  );
  const prevInitialBgColorRef = useRef<string | undefined>(initialBgColor);
  const isUserChangingColorRef = useRef<boolean>(false);
  const onFileChangeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const MAX_FILE_SIZE = 8 * 1024 * 1024; // 8MB
  const THUMBNAIL_SIZE = 450;

  // Helper function to parse hex color to RGB
  const hexToRgb = (hex: string): { r: number; g: number; b: number } => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : { r: 255, g: 255, b: 255 }; // Default to white
  };

  // Generate canvas preview matching server logic
  const updateCanvasPreview = (
    image: HTMLImageElement,
    canvas: HTMLCanvasElement
  ) => {
    const ctx = canvas.getContext("2d", {
      alpha: false, // Disable alpha for better performance
      desynchronized: false, // Better quality
    });
    if (!ctx) return;

    // Enable high-quality image smoothing
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    // Set canvas size to exactly 450×450
    canvas.width = THUMBNAIL_SIZE;
    canvas.height = THUMBNAIL_SIZE;

    // Fill with background color
    const bgRgb = hexToRgb(bgColor);
    ctx.fillStyle = `rgb(${bgRgb.r}, ${bgRgb.g}, ${bgRgb.b})`;
    ctx.fillRect(0, 0, THUMBNAIL_SIZE, THUMBNAIL_SIZE);

    // Calculate dimensions to maintain aspect ratio
    const imageAspect = image.width / image.height;
    const canvasAspect = THUMBNAIL_SIZE / THUMBNAIL_SIZE;

    let drawWidth: number;
    let drawHeight: number;
    let drawX: number;
    let drawY: number;

    if (imageAspect > canvasAspect) {
      // Landscape: image is wider, pad top and bottom
      drawWidth = THUMBNAIL_SIZE;
      drawHeight = THUMBNAIL_SIZE / imageAspect;
      drawX = 0;
      drawY = (THUMBNAIL_SIZE - drawHeight) / 2;
    } else {
      // Portrait or square: image is taller or equal, pad left and right
      drawWidth = THUMBNAIL_SIZE * imageAspect;
      drawHeight = THUMBNAIL_SIZE;
      drawX = (THUMBNAIL_SIZE - drawWidth) / 2;
      drawY = 0;
    }

    // Draw the image
    ctx.drawImage(image, drawX, drawY, drawWidth, drawHeight);
  };

  // Load image and update canvas preview
  useEffect(() => {
    const canvas = previewCanvasRef.current;
    if (!canvas) return;

    const drawExistingPoster = (image: HTMLImageElement) => {
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Set canvas size to exactly 450×450
      canvas.width = THUMBNAIL_SIZE;
      canvas.height = THUMBNAIL_SIZE;

      // Draw the existing thumbnail directly (it's already 450×450 with background)
      ctx.drawImage(image, 0, 0, THUMBNAIL_SIZE, THUMBNAIL_SIZE);
      previewImageRef.current = image;
    };

    const loadInitialPoster = (src: string, useCors = true) => {
      const image = new Image();
      if (useCors) {
        image.crossOrigin = "anonymous";
      }

      image.onload = () => {
        drawExistingPoster(image);
      };

      image.onerror = () => {
        // If CORS blocks the image load, retry without the crossOrigin flag
        if (useCors) {
          loadInitialPoster(src, false);
          return;
        }
        // If poster fails to load, silently clear canvas instead of showing error
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.clearRect(0, 0, THUMBNAIL_SIZE, THUMBNAIL_SIZE);
        }
        previewImageRef.current = null;
      };

      image.src = src;
    };

    if (posterFile) {
      // Load the selected file and apply preview with background color
      const image = new Image();
      const url = URL.createObjectURL(posterFile);

      image.onload = () => {
        updateCanvasPreview(image, canvas);
        URL.revokeObjectURL(url);
        previewImageRef.current = image;
      };

      image.onerror = () => {
        URL.revokeObjectURL(url);
        toast.error("Failed to load image for preview");
      };

      image.src = url;
    } else if (initialPoster) {
      // Load the initial poster (existing thumbnail - already has background baked in)
      loadInitialPoster(initialPoster);
    } else {
      // Clear canvas
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.clearRect(0, 0, THUMBNAIL_SIZE, THUMBNAIL_SIZE);
      }
      previewImageRef.current = null;
    }
  }, [posterFile, initialPoster, bgColor]);

  // Re-render canvas when bgColor changes (only if we have a file selected)
  useEffect(() => {
    if (posterFile && previewImageRef.current && previewCanvasRef.current) {
      updateCanvasPreview(previewImageRef.current, previewCanvasRef.current);
    }
  }, [bgColor, posterFile]);

  // Restore posterFile from props when component remounts or props change
  useEffect(() => {
    // Only update if the prop actually changed (to avoid unnecessary re-renders)
    if (prevInitialPosterFileRef.current !== initialPosterFile) {
      if (initialPosterFile) {
        setPosterFile(initialPosterFile);
      } else if (!initialPoster && !initialPosterFile) {
        // If both initialPosterFile and initialPoster are null/undefined, clear the file
        // This handles the case where the poster was removed
        setPosterFile(null);
      }
      prevInitialPosterFileRef.current = initialPosterFile;
    }
  }, [initialPosterFile, initialPoster]);

  // Sync bgColor with initialBgColor prop when it changes
  // Skip sync if user is actively changing the color to prevent infinite loops
  useEffect(() => {
    // Only update if the prop actually changed and user is not actively changing color
    if (
      prevInitialBgColorRef.current !== initialBgColor &&
      initialBgColor &&
      !isUserChangingColorRef.current
    ) {
      setBgColor(initialBgColor);
      prevInitialBgColorRef.current = initialBgColor;
    }
  }, [initialBgColor]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Validate file size
    if (selectedFile.size > MAX_FILE_SIZE) {
      toast.error(
        `File too large: ${selectedFile.name}. Maximum file size is 8MB. Please select a smaller file.`
      );
      e.target.value = "";
      return;
    }

    // Validate file type
    if (!selectedFile.type.startsWith("image/")) {
      toast.error("Please select an image file.");
      e.target.value = "";
      return;
    }

    setPosterFile(selectedFile);
    onFileChange({ file: selectedFile, bgColor });

    // Reset input to allow selecting the same file again
    e.target.value = "";
  };

  const handleRemove = () => {
    setPosterFile(null);
    onFileChange({ file: null, bgColor });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Notify parent when bgColor changes (only if we have a file)
  // Debounce to prevent excessive updates during color picker dragging
  useEffect(() => {
    if (posterFile) {
      // Clear any pending timeout
      if (onFileChangeTimeoutRef.current) {
        clearTimeout(onFileChangeTimeoutRef.current);
      }

      // Debounce the onFileChange call to prevent infinite loops during dragging
      onFileChangeTimeoutRef.current = setTimeout(() => {
        onFileChange({ file: posterFile, bgColor });
        // Reset the flag after a short delay to allow prop sync
        setTimeout(() => {
          isUserChangingColorRef.current = false;
        }, 100);
      }, 50);
    }

    // Cleanup timeout on unmount
    return () => {
      if (onFileChangeTimeoutRef.current) {
        clearTimeout(onFileChangeTimeoutRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bgColor, posterFile]);

  const hasPreview = posterFile || initialPoster;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Preview Box - 450x450 Canvas */}
      {hasPreview && (
        <div className="flex flex-col items-center gap-4">
        <div className="relative w-full max-w-[320px] sm:max-w-[450px] aspect-square rounded-sm border border-charcoal overflow-hidden">
            <canvas
              ref={previewCanvasRef}
              className="w-full h-full"
              width={THUMBNAIL_SIZE}
              height={THUMBNAIL_SIZE}
            />
            {(posterFile || (editable && initialPoster && !posterFile)) && (
              <button
                onClick={handleRemove}
                className="absolute top-2 right-2 bg-red-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm opacity-0 hover:opacity-100 transition-opacity"
                aria-label="Remove image"
                type="button"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Color Picker - Only show when a new file is selected (creating or replacing) */}
          {posterFile && (
            <div className="flex flex-col items-center gap-2">
              <Label htmlFor="bg-color">Background Color</Label>
              <div className="flex items-center justify-center gap-3">
                <Popover
                  open={isColorPickerOpen}
                  onOpenChange={setIsColorPickerOpen}
                >
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      className="w-16 h-10 rounded border border-charcoal cursor-pointer"
                      style={{ backgroundColor: bgColor }}
                      aria-label="Pick background color"
                    />
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-3" align="start">
                    <HexColorPicker
                      color={bgColor}
                      onChange={(color) => {
                        isUserChangingColorRef.current = true;
                        setBgColor(color);
                      }}
                    />
                  </PopoverContent>
                </Popover>
                <Input
                  id="bg-color"
                  type="text"
                  value={bgColor}
                  onChange={(e) => {
                    const value = e.target.value;
                    // Allow any input while typing, but validate on blur
                    isUserChangingColorRef.current = true;
                    setBgColor(value);
                  }}
                  onBlur={(e) => {
                    const value = e.target.value.trim();
                    isUserChangingColorRef.current = true;
                    // Validate and normalize hex color format on blur
                    if (!value) {
                      setBgColor("#ffffff");
                      return;
                    }
                    // Add # if missing
                    const normalized = value.startsWith("#")
                      ? value
                      : "#" + value;
                    // Validate hex format (3 or 6 hex digits)
                    if (/^#[A-Fa-f0-9]{3}$/.test(normalized)) {
                      // Expand shorthand #RGB to #RRGGBB
                      setBgColor(
                        "#" +
                          normalized[1] +
                          normalized[1] +
                          normalized[2] +
                          normalized[2] +
                          normalized[3] +
                          normalized[3]
                      );
                    } else if (/^#[A-Fa-f0-9]{6}$/.test(normalized)) {
                      setBgColor(normalized.toLowerCase());
                    } else {
                      // Invalid format, reset to default
                      setBgColor("#ffffff");
                    }
                  }}
                  className="w-24 bg-fog-white"
                  placeholder="#ffffff"
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* File Input - Show when editable, even if there's an existing poster */}
      {editable && (
        <div className="space-y-2">
          <div className="flex items-center justify-center w-full">
            <label
              htmlFor="poster-file"
              className="bg-neutral-300 flex flex-col items-center justify-center w-full h-40 px-4 border-2 border-dashed rounded-sm border-charcoal cursor-pointer hover:bg-neutral-100"
            >
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <UploadIcon className="w-10 h-10 text-gray-400" />
                <p className="mb-2 text-sm text-black">
                  <span className="font-semibold">
                    {initialPoster ? "Click to replace" : "Click to upload"}
                  </span>{" "}
                  or drag and drop
                </p>
                <p className="text-xs text-gray-500">
                  SVG, PNG, JPG or GIF (MAX. 8MB)
                </p>
              </div>
              <input
                id="poster-file"
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept="image/*"
                onChange={handleFileSelect}
              />
            </label>
          </div>
        </div>
      )}
    </div>
  );
}
