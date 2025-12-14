import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import { uploadToR2 } from "@/lib/R2";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const bgColor = (formData.get("bgColor") as string) || "#ffffff";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "File must be an image" },
        { status: 400 }
      );
    }

    // Validate file size (8MB max)
    const MAX_FILE_SIZE = 8 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File size exceeds 8MB limit" },
        { status: 400 }
      );
    }

    // Generate a temporary event ID for upload (will be replaced with actual event ID later)
    // This is needed for R2 path generation
    const tempEventId = `temp-${Date.now()}`;

    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Parse background color to RGB for sharp
    const hexToRgb = (hex: string) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result
        ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16),
          }
        : { r: 255, g: 255, b: 255 }; // Default to white
    };

    const bgRgb = hexToRgb(bgColor);

    // Generate thumbnail (357x357px)
    const thumbnailBuffer = await sharp(buffer)
      .resize(357, 357, {
        fit: "contain",
        background: bgRgb,
      })
      .toBuffer();

    // Create File objects from buffers for upload
    const originalFile = new File([new Uint8Array(buffer)], file.name, {
      type: file.type,
    });
    const thumbnailFile = new File(
      [new Uint8Array(thumbnailBuffer)],
      `thumbnail-${file.name}`,
      { type: file.type }
    );

    // Upload original poster
    const originalResult = await uploadToR2(
      originalFile,
      "event-poster",
      tempEventId
    );

    if (!originalResult.success || !originalResult.url) {
      return NextResponse.json(
        { error: "Failed to upload original poster" },
        { status: 500 }
      );
    }

    // Upload thumbnail
    const thumbnailResult = await uploadToR2(
      thumbnailFile,
      "event-poster",
      tempEventId
    );

    if (!thumbnailResult.success || !thumbnailResult.url) {
      // If thumbnail upload fails, we should delete the original
      // But for now, just return error
      return NextResponse.json(
        { error: "Failed to upload thumbnail" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      thumbnail: thumbnailResult.url,
      original: originalResult.url,
    });
  } catch (error) {
    console.error("Poster upload error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to upload poster",
      },
      { status: 500 }
    );
  }
}
