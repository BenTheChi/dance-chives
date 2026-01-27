/**
 * Cohere LLM client for JSON-only responses
 * Uses model: command-r7b-12-2024
 */

/**
 * Call Cohere's chat completions endpoint.
 */
export async function callCohereAPI(
  prompt: string,
  apiKey: string
): Promise<any> {
  const response = await fetch(
    "https://api.cohere.com/v2/chat",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "command-r7b-12-2024",
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
        "Invalid Cohere API key. Please check your credentials."
      );
    }
    if (response.status === 429) {
      throw new Error(
        "Cohere API rate limit exceeded. Please try again in a moment."
      );
    }
    throw new Error(
      `Cohere API error: ${errorData.error?.message || response.statusText}`
    );
  }

  const data = await response.json();

  if (!data.message || !data.message.content || !Array.isArray(data.message.content) || data.message.content.length === 0) {
    throw new Error("Invalid response format from Cohere API");
  }

  const content = data.message.content[0].text;

  if (!content) {
    throw new Error("Empty response from Cohere API");
  }

  try {
    const cleanedContent = content
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();

    return JSON.parse(cleanedContent);
  } catch (parseError) {
    console.error("Failed to parse Cohere response:", content);
    throw new Error(
      `Invalid JSON response from Cohere: ${
        parseError instanceof Error ? parseError.message : "Unknown error"
      }`
    );
  }
}
