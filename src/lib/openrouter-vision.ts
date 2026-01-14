/**
 * OpenRouter Vision API client for image analysis
 * Uses model: nvidia/nemotron-nano-12b-v2-vl:free
 */

/**
 * Call OpenRouter's text-only API (no image).
 * Uses model: nvidia/nemotron-3-nano-30b-a3b:free
 */
export async function callOpenRouterTextAPI(
  prompt: string,
  apiKey: string
): Promise<any> {
  const response = await fetch(
    "https://openrouter.ai/api/v1/chat/completions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "nvidia/nemotron-3-nano-30b-a3b:free",
        messages: [
          {
            role: "system",
            content:
              "You are a JSON parser expert. Always return valid JSON only, no markdown, no code blocks, no explanations.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.01,
        response_format: { type: "json_object" },
      }),
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    if (response.status === 401) {
      throw new Error(
        "Invalid OpenRouter API key. Please check your credentials."
      );
    }
    if (response.status === 429) {
      throw new Error(
        "OpenRouter API rate limit exceeded. Please try again in a moment."
      );
    }
    throw new Error(
      `OpenRouter API error: ${errorData.error?.message || response.statusText}`
    );
  }

  const data = await response.json();

  // Log the response for debugging if it doesn't match expected format
  if (!data.choices || !data.choices[0] || !data.choices[0].message) {
    console.error(
      "Invalid OpenRouter API response:",
      JSON.stringify(data, null, 2)
    );
    throw new Error(
      `Invalid response format from OpenRouter API. Response: ${JSON.stringify(
        data
      )}`
    );
  }

  const content = data.choices[0].message.content;

  if (!content) {
    throw new Error("Empty response from OpenRouter API");
  }

  try {
    const cleanedContent = content
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();

    return JSON.parse(cleanedContent);
  } catch (parseError) {
    console.error("Failed to parse OpenRouter response:", content);
    throw new Error(
      `Invalid JSON response from OpenRouter: ${
        parseError instanceof Error ? parseError.message : "Unknown error"
      }`
    );
  }
}

/**
 * Call OpenRouter's vision API with an image and text prompt.
 * The image should be provided as a base64-encoded string.
 */
export async function callOpenRouterVisionAPI(
  imageBase64: string,
  prompt: string,
  apiKey: string
): Promise<any> {
  const response = await fetch(
    "https://openrouter.ai/api/v1/chat/completions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "allenai/molmo-2-8b:free",
        messages: [
          {
            role: "system",
            content:
              "You are a JSON parser expert. Always return valid JSON only, no markdown, no code blocks, no explanations.",
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: prompt,
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${imageBase64}`,
                },
              },
            ],
          },
        ],
        temperature: 0.01,
        response_format: { type: "json_object" },
      }),
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    if (response.status === 401) {
      throw new Error(
        "Invalid OpenRouter API key. Please check your credentials."
      );
    }
    if (response.status === 429) {
      throw new Error(
        "OpenRouter API rate limit exceeded. Please try again in a moment."
      );
    }
    throw new Error(
      `OpenRouter API error: ${errorData.error?.message || response.statusText}`
    );
  }

  const data = await response.json();

  // Log the response for debugging if it doesn't match expected format
  if (!data.choices || !data.choices[0] || !data.choices[0].message) {
    console.error(
      "Invalid OpenRouter API response:",
      JSON.stringify(data, null, 2)
    );
    throw new Error(
      `Invalid response format from OpenRouter API. Response: ${JSON.stringify(
        data
      )}`
    );
  }

  const content = data.choices[0].message.content;

  if (!content) {
    throw new Error("Empty response from OpenRouter API");
  }

  try {
    const cleanedContent = content
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();

    return JSON.parse(cleanedContent);
  } catch (parseError) {
    console.error("Failed to parse OpenRouter response:", content);
    throw new Error(
      `Invalid JSON response from OpenRouter: ${
        parseError instanceof Error ? parseError.message : "Unknown error"
      }`
    );
  }
}
