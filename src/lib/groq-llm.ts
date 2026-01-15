/**
 * Type definitions for parsed playlist data
 */
export interface ParsedSection {
  id?: string;
  title: string;
  description: string;
  sectionType:
    | "Battle"
    | "Competition"
    | "Performance"
    | "Exhibition"
    | "Showcase"
    | "Class"
    | "Session"
    | "Party"
    | "Other";
  hasBrackets: boolean;
  videos: Array<{
    id?: string;
    title: string;
    src: string;
    type: "battle" | "freestyle" | "choreography" | "class" | "other";
    styles?: string[];
  }>;
  brackets: Array<{
    id?: string;
    title: string;
    videos: Array<{
      id?: string;
      title: string;
      src: string;
      type: "battle" | "freestyle" | "choreography" | "class" | "other";
      styles?: string[];
    }>;
  }>;
  styles?: string[];
  applyStylesToVideos?: boolean;
}

export interface ParsedPlaylistResponse {
  sections: ParsedSection[];
}

/**
 * Helper function to call Groq API.
 */
async function callGroqAPI(prompt: string, apiKey: string): Promise<any> {
  const response = await fetch(
    "https://api.groq.com/openai/v1/chat/completions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
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
      throw new Error("Invalid Groq API key. Please check your credentials.");
    }
    if (response.status === 429) {
      throw new Error(
        "Groq API rate limit exceeded. Please try again in a moment."
      );
    }
    throw new Error(
      `Groq API error: ${errorData.error?.message || response.statusText}`
    );
  }

  const data = await response.json();

  if (!data.choices || !data.choices[0] || !data.choices[0].message) {
    throw new Error("Invalid response format from Groq API");
  }

  const content = data.choices[0].message.content;

  if (!content) {
    throw new Error("Empty response from Groq API");
  }

  // Parse JSON response
  try {
    const cleanedContent = content
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();

    return JSON.parse(cleanedContent);
  } catch (parseError) {
    console.error("Failed to parse Groq response:", content);
    throw new Error(
      `Invalid JSON response from LLM: ${
        parseError instanceof Error ? parseError.message : "Unknown error"
      }`
    );
  }
}
export { callGroqAPI };
