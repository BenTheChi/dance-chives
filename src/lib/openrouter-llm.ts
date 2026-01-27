/**
 * OpenRouter LLM client for JSON-only responses
 * Uses model: google/gemma-3n-e4b-it:free
 */

/**
 * Call OpenRouter's OpenAI-compatible chat completions endpoint.
 */
export async function callOpenRouterAPI(
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
        model: "google/gemma-3n-e4b-it:free",
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

  if (!data.choices || !data.choices[0] || !data.choices[0].message) {
    throw new Error("Invalid response format from OpenRouter API");
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
