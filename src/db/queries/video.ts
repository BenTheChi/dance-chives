import driver from "../driver";
import {
  Video,
  BattleVideo,
  FreestyleVideo,
  ChoreographyVideo,
  ClassVideo,
} from "../../types/video";
import { UserSearchItem } from "../../types/user";
import { normalizeStyleNames } from "@/lib/utils/style-utils";

/**
 * Helper function to get userId from UserSearchItem.
 * If id is present, returns it. Otherwise, looks up user by username.
 * Throws error if user not found.
 */
async function getUserIdFromUserSearchItem(
  user: UserSearchItem
): Promise<string> {
  if (user.id) {
    return user.id;
  }

  if (!user.username) {
    throw new Error(
      `User must have either id or username. Got: ${JSON.stringify(user)}`
    );
  }

  // Import here to avoid circular dependency
  const { getUserByUsername } = await import("./user");
  const userRecord = await getUserByUsername(user.username);
  if (!userRecord || !userRecord.id) {
    throw new Error(`User not found with username: ${user.username}`);
  }

  return userRecord.id;
}

/**
 * Get the Neo4j label for a video type
 */
function getVideoLabelFromType(type: Video["type"]): string {
  switch (type) {
    case "battle":
      return "Battle";
    case "freestyle":
      return "Freestyle";
    case "choreography":
      return "Choreography";
    case "class":
      return "Class";
    default:
      return "Battle"; // Default fallback
  }
}

/**
 * Create a video node with appropriate labels and relationships
 */
export async function createVideo(
  video: Video,
  parentId: string,
  parentType: "Section" | "Bracket" | "Event:Workshop" | "Event:Session"
): Promise<void> {
  const session = driver.session();
  try {
    const videoLabel = getVideoLabelFromType(video.type);

    // Create video node with labels
    await session.run(
      `MATCH (parent ${
        parentType === "Section"
          ? `:Section {id: $parentId}`
          : parentType === "Bracket"
          ? `:Bracket {id: $parentId}`
          : parentType === "Event:Workshop"
          ? `:Event:Workshop {id: $parentId}`
          : `:Event:Session {id: $parentId}`
      })
       MERGE (v:Video:${videoLabel} {id: $videoId})
       ON CREATE SET
         v.title = $title,
         v.src = $src
       ON MATCH SET
         v.title = $title,
         v.src = $src
       MERGE (v)-[:IN]->(parent)`,
      {
        parentId,
        videoId: video.id,
        title: video.title,
        src: video.src,
      }
    );

    // Create style relationships
    const videoStyles = video.styles || [];
    if (videoStyles.length > 0) {
      const normalizedStyles = normalizeStyleNames(videoStyles);
      await session.run(
        `
        MATCH (v:Video {id: $videoId})
        WITH v, $styles AS styles
        UNWIND styles AS styleName
        MERGE (style:Style {name: styleName})
        MERGE (v)-[:STYLE]->(style)
        `,
        { videoId: video.id, styles: normalizedStyles }
      );
    }

    // Create user relationships based on video type
    if (video.type === "battle") {
      const battleVideo = video as BattleVideo;

      // Create DANCER relationships
      if (battleVideo.taggedDancers && battleVideo.taggedDancers.length > 0) {
        for (const dancer of battleVideo.taggedDancers) {
          const userId = await getUserIdFromUserSearchItem(dancer);
          await session.run(
            `MATCH (v:Video {id: $videoId})
             MERGE (u:User {id: $userId})
             MERGE (u)-[:DANCER]->(v)`,
            { videoId: video.id, userId }
          );
        }
      }

      // Create WINNER relationships
      if (battleVideo.taggedWinners && battleVideo.taggedWinners.length > 0) {
        for (const winner of battleVideo.taggedWinners) {
          const userId = await getUserIdFromUserSearchItem(winner);
          await session.run(
            `MATCH (v:Video {id: $videoId})
             MERGE (u:User {id: $userId})
             MERGE (u)-[:WINNER]->(v)`,
            { videoId: video.id, userId }
          );
        }
      }
    } else if (video.type === "freestyle") {
      const freestyleVideo = video as FreestyleVideo;

      // Create DANCER relationships
      if (
        freestyleVideo.taggedDancers &&
        freestyleVideo.taggedDancers.length > 0
      ) {
        for (const dancer of freestyleVideo.taggedDancers) {
          const userId = await getUserIdFromUserSearchItem(dancer);
          await session.run(
            `MATCH (v:Video {id: $videoId})
             MERGE (u:User {id: $userId})
             MERGE (u)-[:DANCER]->(v)`,
            { videoId: video.id, userId }
          );
        }
      }
    } else if (video.type === "choreography") {
      const choreographyVideo = video as ChoreographyVideo;

      // Create CHOREOGRAPHER relationships
      if (
        choreographyVideo.taggedChoreographers &&
        choreographyVideo.taggedChoreographers.length > 0
      ) {
        for (const choreographer of choreographyVideo.taggedChoreographers) {
          const userId = await getUserIdFromUserSearchItem(choreographer);
          await session.run(
            `MATCH (v:Video {id: $videoId})
             MERGE (u:User {id: $userId})
             MERGE (u)-[:CHOREOGRAPHER]->(v)`,
            { videoId: video.id, userId }
          );
        }
      }

      // Create DANCER relationships
      if (
        choreographyVideo.taggedDancers &&
        choreographyVideo.taggedDancers.length > 0
      ) {
        for (const dancer of choreographyVideo.taggedDancers) {
          const userId = await getUserIdFromUserSearchItem(dancer);
          await session.run(
            `MATCH (v:Video {id: $videoId})
             MERGE (u:User {id: $userId})
             MERGE (u)-[:DANCER]->(v)`,
            { videoId: video.id, userId }
          );
        }
      }
    } else if (video.type === "class") {
      const classVideo = video as ClassVideo;

      // Create TEACHER relationships
      if (classVideo.taggedTeachers && classVideo.taggedTeachers.length > 0) {
        for (const teacher of classVideo.taggedTeachers) {
          const userId = await getUserIdFromUserSearchItem(teacher);
          await session.run(
            `MATCH (v:Video {id: $videoId})
             MERGE (u:User {id: $userId})
             MERGE (u)-[:TEACHER]->(v)`,
            { videoId: video.id, userId }
          );
        }
      }

      // Create DANCER relationships
      if (classVideo.taggedDancers && classVideo.taggedDancers.length > 0) {
        for (const dancer of classVideo.taggedDancers) {
          const userId = await getUserIdFromUserSearchItem(dancer);
          await session.run(
            `MATCH (v:Video {id: $videoId})
             MERGE (u:User {id: $userId})
             MERGE (u)-[:DANCER]->(v)`,
            { videoId: video.id, userId }
          );
        }
      }
    }
  } finally {
    await session.close();
  }
}
