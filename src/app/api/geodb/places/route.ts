import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const cityId = searchParams.get("cityId");
  const keyword = searchParams.get("keyword");

  try {
    let url: string;

    if (cityId) {
      // Fetch specific city by ID
      url = `http://geodb-free-service.wirefreethought.com/v1/geo/places/${cityId}`;
    } else if (keyword) {
      // Search cities by keyword
      url = `http://geodb-free-service.wirefreethought.com/v1/geo/places?limit=10&sort=population&types=CITY&namePrefix=${keyword}`;
    } else {
      return NextResponse.json(
        { error: "Either cityId or keyword must be provided" },
        { status: 400 }
      );
    }

    const response = await fetch(url);

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch from GeoDB" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("GeoDB API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
