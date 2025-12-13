"use client";

import { useState, useCallback, useRef } from "react";
import Cropper from "react-easy-crop";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Slider } from "./ui/slider";
import Image from "next/image";
import { Upload, X } from "lucide-react";

interface Area {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface CropPosition {
  x: number;
  y: number;
}

interface UploadProfilePictureProps {
  onImagesReady: (profileImage: Blob, avatarImage: Blob) => void;
  currentProfileImage?: string | null;
  currentAvatarImage?: string | null;
}

export function UploadProfilePicture({
  onImagesReady,
  currentProfileImage,
  currentAvatarImage,
}: UploadProfilePictureProps) {
  const [originalImageSrc, setOriginalImageSrc] = useState<string | null>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [profileCrop, setProfileCrop] = useState<CropPosition>({ x: 0, y: 0 });
  const [profileZoom, setProfileZoom] = useState(1);
  const [avatarCrop, setAvatarCrop] = useState<CropPosition>({ x: 0, y: 0 });
  const [avatarZoom, setAvatarZoom] = useState(1);
  const [profileCroppedAreaPixels, setProfileCroppedAreaPixels] =
    useState<Area | null>(null);
  const [avatarCroppedAreaPixels, setAvatarCroppedAreaPixels] =
    useState<Area | null>(null);
  const [isAdjustingAvatar, setIsAdjustingAvatar] = useState(false);
  const [profilePreview, setProfilePreview] = useState<string | null>(
    currentProfileImage || null
  );
  const [avatarPreview, setAvatarPreview] = useState<string | null>(
    currentAvatarImage || null
  );
  const [profileConfirmed, setProfileConfirmed] = useState(
    !!currentProfileImage
  );
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const PROFILE_ASPECT = 250 / 350; // Portrait aspect ratio
  const AVATAR_ASPECT = 1; // Square aspect ratio
  const PROFILE_WIDTH = 250;
  const PROFILE_HEIGHT = 350;
  const AVATAR_SIZE = 60;

  const validateImage = (
    file: File
  ): Promise<{ valid: boolean; error?: string }> => {
    return new Promise((resolve) => {
      const img = new window.Image();
      const objectUrl = URL.createObjectURL(file);

      img.onload = () => {
        URL.revokeObjectURL(objectUrl);
        if (img.width < 250 || img.height < 350) {
          resolve({
            valid: false,
            error: `Image must be at least 250×350 pixels. Your image is ${img.width}×${img.height} pixels.`,
          });
        } else {
          resolve({ valid: true });
        }
      };

      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        resolve({ valid: false, error: "Invalid image file" });
      };

      img.src = objectUrl;
    });
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file");
      return;
    }

    // Validate dimensions
    const validation = await validateImage(file);
    if (!validation.valid) {
      setError(validation.error || "Invalid image");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      setOriginalImageSrc(result);
      setImageSrc(result);
      setProfileCrop({ x: 0, y: 0 });
      setProfileZoom(1);
      setAvatarCrop({ x: 0, y: 0 });
      setAvatarZoom(1);
      setIsAdjustingAvatar(false);
      setProfileConfirmed(false);
      setProfileCroppedAreaPixels(null);
      setAvatarCroppedAreaPixels(null);
    };
    reader.readAsDataURL(file);
  };

  const onProfileCropComplete = useCallback(
    (_croppedArea: Area, croppedAreaPixels: Area) => {
      setProfileCroppedAreaPixels(croppedAreaPixels);
    },
    []
  );

  const onAvatarCropComplete = useCallback(
    (_croppedArea: Area, croppedAreaPixels: Area) => {
      setAvatarCroppedAreaPixels(croppedAreaPixels);
    },
    []
  );

  const createImage = (url: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const image = new window.Image();
      image.addEventListener("load", () => resolve(image));
      image.addEventListener("error", (error) => reject(error));
      image.src = url;
    });
  };

  const getRadianAngle = (degreeValue: number) => {
    return (degreeValue * Math.PI) / 180;
  };

  const rotateSize = (width: number, height: number, rotation: number) => {
    const rotRad = getRadianAngle(rotation);
    return {
      width:
        Math.abs(Math.cos(rotRad) * width) +
        Math.abs(Math.sin(rotRad) * height),
      height:
        Math.abs(Math.sin(rotRad) * width) +
        Math.abs(Math.cos(rotRad) * height),
    };
  };

  const getCroppedImg = async (
    imageSrc: string,
    pixelCrop: Area,
    rotation = 0,
    flip = { horizontal: false, vertical: false }
  ): Promise<Blob> => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      throw new Error("No 2d context");
    }

    // Enable high-quality image smoothing
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    const rotRad = getRadianAngle(rotation);

    // Calculate bounding box of the rotated image
    const { width: bBoxWidth, height: bBoxHeight } = rotateSize(
      image.width,
      image.height,
      rotation
    );

    // Set canvas size to match the bounding box
    canvas.width = bBoxWidth;
    canvas.height = bBoxHeight;

    // Translate canvas context to a central location to allow rotating and flipping around the center
    ctx.translate(bBoxWidth / 2, bBoxHeight / 2);
    ctx.rotate(rotRad);
    ctx.scale(flip.horizontal ? -1 : 1, flip.vertical ? -1 : 1);
    ctx.translate(-image.width / 2, -image.height / 2);

    // Draw rotated image
    ctx.drawImage(image, 0, 0);

    const data = ctx.getImageData(
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height
    );

    // Set canvas size to final desired crop size
    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    // Paste generated rotate image at the top left corner
    ctx.putImageData(data, 0, 0);

    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error("Canvas is empty"));
          return;
        }
        resolve(blob);
      }, "image/png");
    });
  };

  const generateProfileImage = async (): Promise<Blob> => {
    const sourceImage = originalImageSrc || imageSrc;
    if (!sourceImage || !profileCroppedAreaPixels) {
      throw new Error("No image or crop area");
    }

    const croppedBlob = await getCroppedImg(
      sourceImage,
      profileCroppedAreaPixels
    );

    // Resize to 250×350 and convert to WebP
    return new Promise((resolve, reject) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = PROFILE_WIDTH;
        canvas.height = PROFILE_HEIGHT;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("No 2d context"));
          return;
        }

        // Enable high-quality image smoothing
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";

        ctx.drawImage(img, 0, 0, PROFILE_WIDTH, PROFILE_HEIGHT);
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("Failed to create blob"));
              return;
            }
            resolve(blob);
          },
          "image/webp",
          0.95 // Increased from 0.9 to 0.95 for better quality
        );
      };
      img.onerror = reject;
      img.src = URL.createObjectURL(croppedBlob);
    });
  };

  const generateAvatarImage = async (): Promise<Blob> => {
    const sourceImage = originalImageSrc || imageSrc;
    if (!sourceImage || !profileCroppedAreaPixels) {
      throw new Error("No image or crop area");
    }

    const profileCropX = profileCroppedAreaPixels.x;
    const profileCropY = profileCroppedAreaPixels.y;
    const profileCropWidth = profileCroppedAreaPixels.width;
    const profileCropHeight = profileCroppedAreaPixels.height;

    // Calculate avatar crop position from profile crop
    let avatarCropArea: Area;
    if (isAdjustingAvatar && avatarCroppedAreaPixels) {
      // When manually adjusting, use the user's selected crop area directly
      // This preserves their zoom/pan selection and scales it to fit 60x60
      // No constraints - user can crop from anywhere in the original image
      avatarCropArea = {
        x: avatarCroppedAreaPixels.x,
        y: avatarCroppedAreaPixels.y,
        width: avatarCroppedAreaPixels.width,
        height: avatarCroppedAreaPixels.height,
      };
    } else {
      // Auto-generate: take a larger area from the profile crop and scale it down
      // This shows more of the face/content in the avatar preview
      // Use the full width of the profile crop, centered vertically at 35% from top
      const avatarCropWidth = profileCropWidth; // Use full width
      const avatarCropHeight = profileCropWidth; // Square area (width x width)

      // Center horizontally, position at 35% from top of profile crop
      const avatarX = profileCropX;
      const avatarY =
        profileCropY + profileCropHeight * 0.35 - avatarCropHeight / 2;

      // Ensure avatar crop is within profile crop bounds
      const clampedY = Math.max(
        profileCropY,
        Math.min(avatarY, profileCropY + profileCropHeight - avatarCropHeight)
      );

      avatarCropArea = {
        x: profileCropX,
        y: clampedY,
        width: avatarCropWidth,
        height: avatarCropHeight,
      };
    }

    const croppedBlob = await getCroppedImg(sourceImage, avatarCropArea);

    // Resize to 60×60 and apply circular mask
    return new Promise((resolve, reject) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = AVATAR_SIZE;
        canvas.height = AVATAR_SIZE;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("No 2d context"));
          return;
        }

        // Enable high-quality image smoothing
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";

        // Create circular clipping path
        ctx.beginPath();
        ctx.arc(
          AVATAR_SIZE / 2,
          AVATAR_SIZE / 2,
          AVATAR_SIZE / 2,
          0,
          Math.PI * 2
        );
        ctx.clip();

        // Draw image scaled to fit the 60x60 circle
        // This scales down the crop area (auto-generated or user-selected) to fit
        ctx.drawImage(img, 0, 0, AVATAR_SIZE, AVATAR_SIZE);

        // Export as PNG with transparency
        canvas.toBlob((blob) => {
          if (!blob) {
            reject(new Error("Failed to create blob"));
            return;
          }
          resolve(blob);
        }, "image/png");
      };
      img.onerror = reject;
      img.src = URL.createObjectURL(croppedBlob);
    });
  };

  const handleConfirmProfileCrop = async () => {
    if (!profileCroppedAreaPixels) return;

    try {
      const profileBlob = await generateProfileImage();
      const profileUrl = URL.createObjectURL(profileBlob);
      setProfilePreview(profileUrl);

      // Auto-generate avatar crop
      const avatarBlob = await generateAvatarImage();
      const avatarUrl = URL.createObjectURL(avatarBlob);
      setAvatarPreview(avatarUrl);

      // Hide the cropper but keep original image for avatar adjustment
      setImageSrc(null);
      setProfileConfirmed(true);

      // Notify parent component
      onImagesReady(profileBlob, avatarBlob);
    } catch (error) {
      console.error("Error generating images:", error);
      setError("Failed to generate images. Please try again.");
    }
  };

  const handleAdjustAvatar = () => {
    if (!originalImageSrc || !profileCroppedAreaPixels) return;

    setIsAdjustingAvatar(true);
    setImageSrc(originalImageSrc);

    // Calculate the avatar position to match the auto-generated area
    // This shows the full-width square area that was auto-generated
    const profileCropX = profileCroppedAreaPixels.x;
    const profileCropY = profileCroppedAreaPixels.y;
    const profileCropWidth = profileCroppedAreaPixels.width;
    const profileCropHeight = profileCroppedAreaPixels.height;

    // Auto-generated area: full width, centered at 35% from top
    const avatarCropWidth = profileCropWidth;
    const avatarCropHeight = profileCropWidth;
    const avatarX = profileCropX;
    const avatarY =
      profileCropY + profileCropHeight * 0.35 - avatarCropHeight / 2;

    // We need to load the image to get its dimensions to calculate relative position
    const img = new window.Image();
    img.onload = () => {
      // Calculate relative position (0-100%) for react-easy-crop
      // Center the crop area in the view
      const relativeX = (avatarX / img.width) * 100;
      const relativeY =
        (Math.max(
          profileCropY,
          Math.min(avatarY, profileCropY + profileCropHeight - avatarCropHeight)
        ) /
          img.height) *
        100;

      setAvatarCrop({ x: relativeX, y: relativeY });
      setAvatarZoom(1); // Start at zoom 1 (no zoom) so user can see the full auto-generated area
    };
    img.src = originalImageSrc;
  };

  const handleConfirmAvatarAdjustment = async () => {
    if (!avatarCroppedAreaPixels) return;

    try {
      const avatarBlob = await generateAvatarImage();
      const avatarUrl = URL.createObjectURL(avatarBlob);
      setAvatarPreview(avatarUrl);

      // Regenerate profile image to ensure consistency
      const profileBlob = await generateProfileImage();
      onImagesReady(profileBlob, avatarBlob);

      setIsAdjustingAvatar(false);
      setImageSrc(null);
    } catch (error) {
      console.error("Error generating avatar:", error);
      setError("Failed to generate avatar. Please try again.");
    }
  };

  const handleRemoveImage = () => {
    setOriginalImageSrc(null);
    setImageSrc(null);
    setProfilePreview(null);
    setAvatarPreview(null);
    setProfileCrop({ x: 0, y: 0 });
    setProfileZoom(1);
    setAvatarCrop({ x: 0, y: 0 });
    setAvatarZoom(1);
    setIsAdjustingAvatar(false);
    setProfileConfirmed(false);
    setProfileCroppedAreaPixels(null);
    setAvatarCroppedAreaPixels(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Always show something - either existing images or upload button
  const hasExistingImages = profilePreview && profileConfirmed;
  const showUploadButton = !imageSrc && !hasExistingImages;

  return (
    <div className="space-y-4">
      {showUploadButton && (
        <div className="space-y-2">
          <Input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
            id="profile-picture-upload"
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            className="w-full"
          >
            <Upload className="mr-2 h-4 w-4" />
            Upload Photo
          </Button>
          <p className="text-xs text-muted-foreground">
            Image must be at least 250×350 pixels
          </p>
        </div>
      )}

      {profilePreview && profileConfirmed && !imageSrc && (
        <div className="space-y-4">
          <div className="flex gap-10">
            <div className="space-y-2">
              <div className="relative h-[350px] w-[250px] overflow-hidden rounded-lg border-2 border-black">
                <Image
                  src={profilePreview}
                  alt="Profile preview"
                  width={250}
                  height={350}
                  className="h-full w-full object-cover"
                  unoptimized
                />
              </div>
            </div>
            {avatarPreview && (
              <div className="space-y-2 flex flex-col items-center">
                <div className="relative h-[60px] w-[60px] overflow-hidden rounded-full">
                  <Image
                    src={avatarPreview}
                    alt="Avatar preview"
                    width={60}
                    height={60}
                    className="h-full w-full object-cover"
                    unoptimized
                  />
                </div>
                {originalImageSrc && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAdjustAvatar}
                  >
                    Adjust Avatar Crop
                  </Button>
                )}
              </div>
            )}
          </div>
          <div className="space-y-2">
            <Input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
              id="profile-picture-upload-new"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                const input = document.getElementById(
                  "profile-picture-upload-new"
                ) as HTMLInputElement;
                input?.click();
              }}
              className="w-full"
            >
              <Upload className="mr-2 h-4 w-4" />
              Upload New Photo
            </Button>
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {imageSrc && !isAdjustingAvatar && (
        <div className="space-y-4">
          <div className="relative h-[400px] w-full rounded-lg border bg-gray-100 overflow-hidden">
            <Cropper
              image={imageSrc}
              crop={profileCrop}
              zoom={profileZoom}
              aspect={PROFILE_ASPECT}
              onCropChange={setProfileCrop}
              onZoomChange={setProfileZoom}
              onCropComplete={onProfileCropComplete}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Zoom: {profileZoom.toFixed(1)}x
            </label>
            <Slider
              value={[profileZoom]}
              min={1}
              max={3}
              step={0.1}
              onValueChange={([zoom]) => setProfileZoom(zoom)}
            />
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              onClick={handleConfirmProfileCrop}
              className="flex-1"
            >
              Confirm Profile Crop
            </Button>
            <Button type="button" variant="outline" onClick={handleRemoveImage}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {imageSrc && isAdjustingAvatar && (
        <div className="space-y-4">
          <div className="relative h-[300px] w-full rounded-lg border bg-gray-100 overflow-hidden">
            <Cropper
              image={imageSrc}
              crop={avatarCrop}
              zoom={avatarZoom}
              aspect={AVATAR_ASPECT}
              onCropChange={setAvatarCrop}
              onZoomChange={setAvatarZoom}
              onCropComplete={onAvatarCropComplete}
              cropShape="round"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Zoom: {avatarZoom.toFixed(1)}x
            </label>
            <Slider
              value={[avatarZoom]}
              min={1}
              max={3}
              step={0.1}
              onValueChange={([zoom]) => setAvatarZoom(zoom)}
            />
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              onClick={handleConfirmAvatarAdjustment}
              className="flex-1"
            >
              Confirm Avatar
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsAdjustingAvatar(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
