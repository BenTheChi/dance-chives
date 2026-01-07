/**
 * Groq Compound Mini LLM client for parsing YouTube playlists into structured event sections
 *
 * MULTI-STEP APPROACH:
 * ===================
 * 1. Extract video IDs to reduce token size
 * 2. Clean video titles by removing event title using regex
 * 3. Step 1 LLM Call: Categorize videos into sections
 *    - Simple task: sort videos into provided/detected sections
 *    - No descriptions needed, sections are provided or detected from patterns
 *    - Returns JSON with videos organized by section
 * 4. Step 2 LLM Call: ONLY for battle sections
 *    - Organize videos into brackets based on title patterns
 *    - Parse titles down to "X vs Y" format ONLY
 *    - Returns JSON with brackets and cleaned titles
 * 5. Validation: Ensure total video count matches across all transformations
 */

import { YouTubeVideoMetadata } from "./youtube-api";
import { callGeminiAPI } from "./gemini-llm";
import {
  FormContext,
  ParsedPlaylistResponse,
  buildCategorizationPrompt,
  buildBracketOrganizationPrompt,
  buildTitleSanitizationPrompt,
  fixCategorizationIssues,
  fixBracketIssues,
  extractVideoId,
  reconstructUrl,
} from "./llm-utils";

export type {
  FormContext,
  ParsedSection,
  ParsedPlaylistResponse,
} from "./llm-utils";

/**
 * Helper function to call Groq API
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

/**
 * Use Groq for Step 1 (categorization) and Gemini for Steps 2-3
 */
export async function parsePlaylistWithGroq(
  videos: YouTubeVideoMetadata[],
  context: FormContext
): Promise<ParsedPlaylistResponse> {
  const apiKey = process.env.GROQ_API_KEY;
  const geminiApiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("GROQ_API_KEY environment variable is not set");
  }

  if (!geminiApiKey) {
    throw new Error("GEMINI_API_KEY environment variable is not set");
  }

  if (!videos || videos.length === 0) {
    throw new Error("No videos provided to parse");
  }

  try {
    console.log("=== STEP 1: Categorizing videos into sections ===");

    // Step 1: Categorize videos into sections
    const categorizationPrompt = buildCategorizationPrompt(videos, context);
    const categorizedResponse = await callGroqAPI(categorizationPrompt, apiKey);

    if (
      !categorizedResponse.sections ||
      !Array.isArray(categorizedResponse.sections)
    ) {
      throw new Error("Invalid response structure: missing sections array");
    }

    console.log(
      `✅ Step 1 complete: ${categorizedResponse.sections.length} sections created`
    );

    // Auto-fix any issues (missing videos, duplicates)
    console.log("\n🔧 Auto-fixing categorization issues...");
    const fixedResponse = fixCategorizationIssues(
      categorizedResponse,
      videos,
      context
    );

    // Validate after auto-fix
    const inputVideoIds = new Set(videos.map((v) => extractVideoId(v.url)));
    const categorizedVideoIds = new Set<string>();
    const categorizedVideoIdsList: string[] = [];

    fixedResponse.sections.forEach((section: any) => {
      if (section.videos) {
        section.videos.forEach((video: any) => {
          const videoId = extractVideoId(video.src);
          categorizedVideoIds.add(videoId);
          categorizedVideoIdsList.push(videoId);
        });
      }
    });

    // Find any remaining issues after auto-fix
    const missingAfterCategorization = Array.from(inputVideoIds).filter(
      (id) => !categorizedVideoIds.has(id)
    );

    const duplicateVideoIdsStep1 = categorizedVideoIdsList.filter(
      (id, index) => categorizedVideoIdsList.indexOf(id) !== index
    );
    const uniqueDuplicatesStep1 = Array.from(new Set(duplicateVideoIdsStep1));

    // Detailed debugging output
    console.log(`\n📊 STEP 1 VALIDATION (after auto-fix):`);
    console.log(`  Input videos: ${videos.length}`);
    console.log(`  Output videos: ${categorizedVideoIdsList.length}`);
    console.log(`  Unique videos: ${categorizedVideoIds.size}`);

    if (missingAfterCategorization.length > 0) {
      console.error(
        `\n❌ MISSING VIDEOS (${missingAfterCategorization.length}):`
      );
      missingAfterCategorization.forEach((id) => {
        const video = videos.find((v) => extractVideoId(v.url) === id);
        console.error(`  - ID: ${id}`);
        console.error(`    Title: "${video?.title || "Unknown"}"`);
        console.error(`    URL: ${video?.url || id}`);
      });
    }

    if (uniqueDuplicatesStep1.length > 0) {
      console.error(`\n❌ DUPLICATE VIDEOS (${uniqueDuplicatesStep1.length}):`);
      uniqueDuplicatesStep1.forEach((id) => {
        const video = videos.find((v) => extractVideoId(v.url) === id);
        const count = categorizedVideoIdsList.filter(
          (vid) => vid === id
        ).length;
        console.error(`  - ID: ${id} (appears ${count} times)`);
        console.error(`    Title: "${video?.title || "Unknown"}"`);
        console.error(`    URL: ${video?.url || id}`);
      });
    }

    if (
      missingAfterCategorization.length > 0 ||
      uniqueDuplicatesStep1.length > 0
    ) {
      throw new Error(
        `Categorization failed after auto-fix: ${missingAfterCategorization.length} missing, ${uniqueDuplicatesStep1.length} duplicates`
      );
    }

    console.log(`  ✅ All videos accounted for, no duplicates\n`);

    console.log("=== STEP 2: Organizing battle sections into brackets ===");

    // Step 2: For each battle section, organize into brackets
    const finalSections = [];

    for (let i = 0; i < fixedResponse.sections.length; i++) {
      const section = fixedResponse.sections[i];

      // Only process battle sections that should have brackets
      if (
        section.hasBrackets &&
        section.sectionType === "Battle" &&
        section.videos &&
        section.videos.length > 0
      ) {
        console.log(
          `  Processing battle section: ${section.title} (${section.videos.length} videos)`
        );

        const bracketPrompt = buildBracketOrganizationPrompt(section, i);
        const bracketResponse = await callGeminiAPI(
          bracketPrompt,
          geminiApiKey
        );

        // Auto-fix any bracket issues
        console.log(`  🔧 Auto-fixing bracket issues...`);
        const fixedBracketResponse = fixBracketIssues(
          bracketResponse,
          section.videos,
          section.title
        );

        // Validate after auto-fix
        const sectionVideoIds = new Set(
          section.videos.map((v: any) => extractVideoId(v.src))
        );
        const bracketVideoIds = new Set<string>();
        const bracketVideoIdsList: string[] = [];

        if (fixedBracketResponse.brackets) {
          fixedBracketResponse.brackets.forEach((bracket: any) => {
            if (bracket.videos) {
              bracket.videos.forEach((video: any) => {
                const videoId = extractVideoId(video.src);
                bracketVideoIds.add(videoId);
                bracketVideoIdsList.push(videoId);
              });
            }
          });
        }

        // Find any remaining issues after auto-fix
        const missingInBrackets = (
          Array.from(sectionVideoIds) as string[]
        ).filter((id) => !bracketVideoIds.has(id));

        const duplicateVideoIdsStep2 = bracketVideoIdsList.filter(
          (id, index) => bracketVideoIdsList.indexOf(id) !== index
        );
        const uniqueDuplicatesStep2 = Array.from(
          new Set(duplicateVideoIdsStep2)
        );

        // Detailed debugging output
        console.log(
          `\n📊 STEP 2 VALIDATION for "${section.title}" (after auto-fix):`
        );
        console.log(`  Input videos: ${section.videos.length}`);
        console.log(`  Output videos: ${bracketVideoIdsList.length}`);
        console.log(`  Unique videos: ${bracketVideoIds.size}`);

        if (missingInBrackets.length > 0) {
          console.error(
            `\n❌ MISSING VIDEOS in brackets (${missingInBrackets.length}):`
          );
          missingInBrackets.forEach((id) => {
            const video = section.videos.find(
              (v: any) => extractVideoId(v.src) === id
            );
            console.error(`  - ID: ${id}`);
            console.error(`    Title: "${video?.title || "Unknown"}"`);
            console.error(`    URL: ${reconstructUrl(id)}`);
          });
        }

        if (uniqueDuplicatesStep2.length > 0) {
          console.error(
            `\n❌ DUPLICATE VIDEOS in brackets (${uniqueDuplicatesStep2.length}):`
          );
          uniqueDuplicatesStep2.forEach((id) => {
            const video = section.videos.find(
              (v: any) => extractVideoId(v.src) === id
            );
            const count = bracketVideoIdsList.filter(
              (vid) => vid === id
            ).length;
            console.error(`  - ID: ${id} (appears ${count} times)`);
            console.error(`    Title: "${video?.title || "Unknown"}"`);
            console.error(`    URL: ${reconstructUrl(id)}`);
          });
        }

        if (missingInBrackets.length > 0 || uniqueDuplicatesStep2.length > 0) {
          console.error(
            `⚠️ WARNING: Bracket organization failed after auto-fix for "${section.title}"`
          );
          console.error(
            `  Keeping original section structure without brackets`
          );

          // Keep original section without brackets if organization fails
          finalSections.push({
            ...section,
            hasBrackets: false,
            brackets: [],
          });
        } else {
          console.log(
            `  ✅ Bracket organization complete: ${fixedBracketResponse.brackets.length} brackets\n`
          );

          // Use the bracket-organized version
          finalSections.push({
            title: section.title,
            description: section.description || "",
            sectionType: section.sectionType,
            hasBrackets: true,
            videos: [], // Videos are now in brackets
            brackets: fixedBracketResponse.brackets,
            styles: section.styles,
            applyStylesToVideos: section.applyStylesToVideos,
          });
        }
      } else {
        // Non-battle sections or sections without brackets
        finalSections.push({
          ...section,
          brackets: section.brackets || [],
        });
      }
    }

    const parsed: ParsedPlaylistResponse = { sections: finalSections };

    // Reconstruct full YouTube URLs from video IDs
    parsed.sections.forEach((section) => {
      if (section.videos) {
        section.videos.forEach((video) => {
          video.src = reconstructUrl(video.src);
        });
      }
      if (section.brackets) {
        section.brackets.forEach((bracket) => {
          if (bracket.videos) {
            bracket.videos.forEach((video) => {
              video.src = reconstructUrl(video.src);
            });
          }
        });
      }
    });

    // Final validation: all videos accounted for
    const outputVideoIds = new Set<string>();
    const outputVideoIdsList: string[] = []; // Track all IDs including duplicates

    parsed.sections.forEach((section) => {
      if (section.videos) {
        section.videos.forEach((video) => {
          const videoId = extractVideoId(video.src);
          outputVideoIds.add(videoId);
          outputVideoIdsList.push(videoId);
        });
      }
      if (section.brackets) {
        section.brackets.forEach((bracket) => {
          if (bracket.videos) {
            bracket.videos.forEach((video) => {
              const videoId = extractVideoId(video.src);
              outputVideoIds.add(videoId);
              outputVideoIdsList.push(videoId);
            });
          }
        });
      }
    });

    // Find missing videos
    const missingVideos = Array.from(inputVideoIds).filter(
      (id) => !outputVideoIds.has(id)
    );

    // Find duplicate videos
    const duplicateVideoIdsFinal = outputVideoIdsList.filter(
      (id, index) => outputVideoIdsList.indexOf(id) !== index
    );
    const uniqueDuplicatesFinal = Array.from(new Set(duplicateVideoIdsFinal));

    // Detailed final validation output
    console.log(`\n📊 FINAL VALIDATION:`);
    console.log(`  Input videos: ${videos.length}`);
    console.log(`  Output videos: ${outputVideoIdsList.length}`);
    console.log(`  Unique videos: ${outputVideoIds.size}`);

    if (missingVideos.length > 0) {
      console.error(
        `\n❌ MISSING VIDEOS IN FINAL OUTPUT (${missingVideos.length}):`
      );
      missingVideos.forEach((id) => {
        const video = videos.find((v) => extractVideoId(v.url) === id);
        console.error(`  - ID: ${id}`);
        console.error(`    Title: "${video?.title || "Unknown"}"`);
        console.error(`    URL: ${video?.url || id}`);
      });
    }

    if (uniqueDuplicatesFinal.length > 0) {
      console.error(
        `\n❌ DUPLICATE VIDEOS IN FINAL OUTPUT (${uniqueDuplicatesFinal.length}):`
      );
      uniqueDuplicatesFinal.forEach((id) => {
        const video = videos.find((v) => extractVideoId(v.url) === id);
        const count = outputVideoIdsList.filter((vid) => vid === id).length;
        console.error(`  - ID: ${id} (appears ${count} times)`);
        console.error(`    Title: "${video?.title || "Unknown"}"`);
        console.error(`    URL: ${video?.url || id}`);
      });
    }

    if (missingVideos.length > 0 || uniqueDuplicatesFinal.length > 0) {
      throw new Error(
        `Final validation failed: ${missingVideos.length} missing, ${uniqueDuplicatesFinal.length} duplicates`
      );
    }

    console.log(
      `  ✅ All ${videos.length} videos accounted for, no duplicates\n`
    );

    // Step 3: Sanitize all titles to "X vs Y" format
    console.log("=== STEP 3: Sanitizing video titles ===");
    const sanitizationPrompt = buildTitleSanitizationPrompt(parsed);
    const sanitizedResponse = await callGeminiAPI(
      sanitizationPrompt,
      geminiApiKey
    );

    // Validate the sanitized response has the same structure
    if (
      !sanitizedResponse.sections ||
      !Array.isArray(sanitizedResponse.sections)
    ) {
      console.error(
        "⚠️ WARNING: Title sanitization returned invalid structure, using original"
      );
      console.log("=== LLM OUTPUT (Parsed Response) ===");
      console.log(JSON.stringify(parsed, null, 2));
      console.log("=== END LLM OUTPUT ===");
      return parsed;
    }

    // Verify all videos are still present after sanitization
    const sanitizedVideoIds = new Set<string>();
    sanitizedResponse.sections.forEach((section: any) => {
      if (section.videos) {
        section.videos.forEach((video: any) => {
          sanitizedVideoIds.add(extractVideoId(video.src));
        });
      }
      if (section.brackets) {
        section.brackets.forEach((bracket: any) => {
          if (bracket.videos) {
            bracket.videos.forEach((video: any) => {
              sanitizedVideoIds.add(extractVideoId(video.src));
            });
          }
        });
      }
    });

    if (sanitizedVideoIds.size !== outputVideoIds.size) {
      console.error(
        `⚠️ WARNING: Title sanitization changed video count (${sanitizedVideoIds.size} vs ${outputVideoIds.size}), using original`
      );
      console.log("=== LLM OUTPUT (Parsed Response) ===");
      console.log(JSON.stringify(parsed, null, 2));
      console.log("=== END LLM OUTPUT ===");
      return parsed;
    }

    // Ensure all URLs are properly formatted (handle both full URLs and IDs)
    sanitizedResponse.sections.forEach((section: any) => {
      if (section.videos) {
        section.videos.forEach((video: any) => {
          video.src = reconstructUrl(video.src);
        });
      }
      if (section.brackets) {
        section.brackets.forEach((bracket: any) => {
          if (bracket.videos) {
            bracket.videos.forEach((video: any) => {
              video.src = reconstructUrl(video.src);
            });
          }
        });
      }
    });

    console.log("✅ Title sanitization complete\n");
    console.log("=== LLM OUTPUT (Parsed Response) ===");
    console.log(JSON.stringify(sanitizedResponse, null, 2));
    console.log("=== END LLM OUTPUT ===");

    return sanitizedResponse as ParsedPlaylistResponse;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(`Failed to parse playlist with Groq: ${String(error)}`);
  }
}
