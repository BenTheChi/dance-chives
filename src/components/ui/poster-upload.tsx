"use client";

import * as React from "react";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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
  onUpload: (urls: { thumbnail: string; original: string }) => void;
  editable: boolean;
  maxFiles?: number; // Kept for compatibility, always 1 for posters
  className?: string;
}

export function PosterUpload({
  initialPoster,
  onUpload,
  editable,
  maxFiles = 1,
  className = "",
}: PosterUploadProps) {
  const [posterFile, setPosterFile] = useState<File | null>(null);
  const [bgColor, setBgColor] = useState<string>("#ffffff");
  const [isUploading, setIsUploading] = useState(false);
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const previewImageRef = useRef<HTMLImageElement | null>(null);

  const MAX_FILE_SIZE = 8 * 1024 * 1024; // 8MB
  const THUMBNAIL_SIZE = 357;

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
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size to exactly 357×357
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
      const image = new Image();
      image.crossOrigin = "anonymous";

      image.onload = () => {
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // Set canvas size to exactly 357×357
        canvas.width = THUMBNAIL_SIZE;
        canvas.height = THUMBNAIL_SIZE;

        // Draw the existing thumbnail directly (it's already 357×357 with background)
        ctx.drawImage(image, 0, 0, THUMBNAIL_SIZE, THUMBNAIL_SIZE);
        previewImageRef.current = image;
      };

      image.onerror = () => {
        toast.error("Failed to load existing poster");
      };

      image.src = initialPoster;
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

    // Reset input to allow selecting the same file again
    e.target.value = "";
  };

  const handleRemove = () => {
    setPosterFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleUpload = async () => {
    if (!posterFile) {
      toast.error("Please select a file to upload.");
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", posterFile);
      formData.append("bgColor", bgColor);

      const response = await fetch("/api/poster/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || `Upload failed: ${response.statusText}`
        );
      }

      const data = await response.json();

      if (data.thumbnail && data.original) {
        // Call onUpload callback
        onUpload({
          thumbnail: data.thumbnail,
          original: data.original,
        });

        toast.success("Poster uploaded successfully!");
        setPosterFile(null);
      } else {
        throw new Error("Invalid response from server");
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to upload poster. Please try again."
      );
    } finally {
      setIsUploading(false);
    }
  };

  const hasPreview = posterFile || initialPoster;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Preview Box - 357x357 Canvas */}
      {hasPreview && (
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-[357px] h-[357px] rounded-lg border border-charcoal overflow-hidden">
            <canvas
              ref={previewCanvasRef}
              className="w-full h-full"
              width={THUMBNAIL_SIZE}
              height={THUMBNAIL_SIZE}
            />
            {posterFile && (
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
        </div>
      )}

      {/* File Input */}
      <div className="space-y-2">
        <Label htmlFor="poster-file">Poster Image</Label>
        <div className="flex items-center justify-center w-full">
          <label
            htmlFor="poster-file"
            className="flex flex-col items-center justify-center w-full h-40 px-4 border-2 border-dashed rounded-lg border-gray-300 cursor-pointer bg-gray-50 hover:bg-gray-100 dark:bg-gray-700 dark:border-gray-600 dark:hover:border-gray-500 dark:hover:bg-gray-600"
          >
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <UploadIcon className="w-10 h-10 text-gray-400" />
              <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                <span className="font-semibold">Click to upload</span> or drag
                and drop
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
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
              disabled={isUploading}
            />
          </label>
        </div>
      </div>

      {/* Color Picker - Only show when a new file is selected (creating or replacing) */}
      {posterFile && (
        <div className="space-y-2">
          <Label htmlFor="bg-color">Background Color</Label>
          <div className="flex items-center gap-3">
            <Popover
              open={isColorPickerOpen}
              onOpenChange={setIsColorPickerOpen}
            >
              <PopoverTrigger asChild>
                <button
                  type="button"
                  disabled={isUploading}
                  className="w-16 h-10 rounded border border-charcoal cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ backgroundColor: bgColor }}
                  aria-label="Pick background color"
                />
              </PopoverTrigger>
              <PopoverContent className="w-auto p-3" align="start">
                <HexColorPicker color={bgColor} onChange={setBgColor} />
              </PopoverContent>
            </Popover>
            <Input
              id="bg-color"
              type="text"
              value={bgColor}
              onChange={(e) => {
                const value = e.target.value;
                // Allow any input while typing, but validate on blur
                setBgColor(value);
              }}
              onBlur={(e) => {
                const value = e.target.value.trim();
                // Validate and normalize hex color format on blur
                if (!value) {
                  setBgColor("#ffffff");
                  return;
                }
                // Add # if missing
                const normalized = value.startsWith("#") ? value : "#" + value;
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
              className="w-24 bg-white"
              placeholder="#ffffff"
              disabled={isUploading}
            />
            <span className="text-sm text-gray-500">
              Color shown behind poster
            </span>
          </div>
        </div>
      )}

      {/* Upload Button - Only show when file is selected */}
      {posterFile && (
        <Button
          onClick={handleUpload}
          disabled={isUploading}
          className="w-full"
          type="button"
        >
          {isUploading ? "Uploading..." : "Upload Poster"}
        </Button>
      )}
    </div>
  );
}
