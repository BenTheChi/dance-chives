import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({});

type GeminiCallOptions = {
  model?: string;
  temperature?: number;
  candidateCount?: number;
  topP?: number;
  topK?: number;
  maxOutputTokens?: number;
};

export async function callGeminiAPI(
  prompt: string,
  apiKey: string,
  options: GeminiCallOptions = {}
): Promise<any> {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-lite",
    contents: prompt,
  });

  console.log(response.text);
  console.log(response.usageMetadata);

  if (!response.text) {
    throw new Error("Empty response from Gemini API");
  }

  // Clean the response text before parsing
  const cleanedContent = response.text
    .replace(/```json\n?/g, "")
    .replace(/```\n?/g, "")
    .trim();

  try {
    return JSON.parse(cleanedContent);
  } catch (parseError) {
    console.error("Failed to parse Gemini response:", cleanedContent);
    throw new Error(
      `Invalid JSON response from Gemini: ${
        parseError instanceof Error ? parseError.message : "Unknown error"
      }`
    );
  }
}
