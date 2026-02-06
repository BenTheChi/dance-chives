import { NextRequest, NextResponse } from "next/server";

/**
 * Server-side proxy for fetching images from external URLs.
 * This bypasses CORS restrictions since server-to-server requests
 * don't have CORS limitations.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url } = body;

    // Validate input
    if (!url || typeof url !== "string") {
      return NextResponse.json(
        { error: "Image URL is required" },
        { status: 400 }
      );
    }

    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      return NextResponse.json(
        { error: "Image URL must start with http:// or https://" },
        { status: 400 }
      );
    }

    // Fetch the image from the external URL
    const response = await fetch(url, {
      headers: {
        // Add a user agent to appear more like a legitimate browser request
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Could not load image from URL" },
        { status: response.status }
      );
    }

    // Validate content type
    const contentType = response.headers.get("content-type") || "";
    if (!contentType.startsWith("image/")) {
      return NextResponse.json(
        { error: "URL must point to an image" },
        { status: 400 }
      );
    }

    // Get the image blob
    const blob = await response.blob();

    // Check file size (8MB limit)
    const MAX_FILE_SIZE = 8 * 1024 * 1024;
    if (blob.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          error:
            "Image is too large. Maximum file size is 8MB. Please use a smaller image.",
        },
        { status: 413 }
      );
    }

    // Convert blob to buffer
    const arrayBuffer = await blob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Return the image with appropriate headers
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Length": buffer.length.toString(),
        // Allow this response to be cached
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error) {
    console.error("Error fetching image:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch image from URL",
      },
      { status: 500 }
    );
  }
}
