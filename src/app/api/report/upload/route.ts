import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { uploadReportFileToR2 } from "@/lib/R2";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No file provided" },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          success: false,
          error: `File size exceeds maximum allowed size of ${MAX_FILE_SIZE / 1024 / 1024}MB`,
        },
        { status: 400 }
      );
    }

    // Upload file to R2
    const uploadResult = await uploadReportFileToR2(file, session.user.id);

    if (!uploadResult.success || !uploadResult.url) {
      return NextResponse.json(
        { success: false, error: "Failed to upload file" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      url: uploadResult.url,
    });
  } catch (error) {
    console.error("Error uploading report file:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "An unexpected error occurred",
      },
      { status: 500 }
    );
  }
}

