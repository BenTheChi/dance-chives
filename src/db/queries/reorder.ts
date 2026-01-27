import driver from "../driver";
import { int } from "neo4j-driver";

/**
 * Reorder sections within an event
 * Always renumbers all sections (0, 1, 2, 3...)
 */
export async function reorderSections(
  eventId: string,
  sectionIds: string[]
): Promise<void> {
  const session = driver.session();
  try {
    await session.executeWrite(async (tx) => {
      await tx.run(
        `
        UNWIND $updates AS update
        MATCH (s:Section {id: update.id})
        SET s.position = update.position
        `,
        {
          updates: sectionIds.map((id, index) => ({
            id,
            position: int(index), // 0-based
          })),
        }
      );
    });
  } finally {
    await session.close();
  }
}

/**
 * Reorder brackets within a section
 */
export async function reorderBrackets(
  sectionId: string,
  bracketIds: string[]
): Promise<void> {
  const session = driver.session();
  try {
    await session.executeWrite(async (tx) => {
      await tx.run(
        `
        UNWIND $updates AS update
        MATCH (b:Bracket {id: update.id})
        WHERE EXISTS {
          MATCH (b)-[:IN]->(:Section {id: $sectionId})
        }
        SET b.position = update.position
        `,
        {
          sectionId,
          updates: bracketIds.map((id, index) => ({
            id,
            position: int(index), // 0-based
          })),
        }
      );
    });
  } finally {
    await session.close();
  }
}

/**
 * Reorder videos directly in a section (non-bracket videos)
 */
export async function reorderSectionVideos(
  sectionId: string,
  videoIds: string[]
): Promise<void> {
  const session = driver.session();
  try {
    await session.executeWrite(async (tx) => {
      await tx.run(
        `
        UNWIND $updates AS update
        MATCH (v:Video {id: update.id})
        WHERE EXISTS {
          MATCH (v)-[:IN]->(:Section {id: $sectionId})
          WHERE NOT EXISTS {
            MATCH (v)-[:IN]->(:Bracket)
          }
        }
        SET v.position = update.position
        `,
        {
          sectionId,
          updates: videoIds.map((id, index) => ({
            id,
            position: int(index), // 0-based
          })),
        }
      );
    });
  } finally {
    await session.close();
  }
}

/**
 * Reorder videos within a bracket
 */
export async function reorderBracketVideos(
  bracketId: string,
  videoIds: string[]
): Promise<void> {
  const session = driver.session();
  try {
    await session.executeWrite(async (tx) => {
      await tx.run(
        `
        UNWIND $updates AS update
        MATCH (v:Video {id: update.id})
        WHERE EXISTS {
          MATCH (v)-[:IN]->(:Bracket {id: $bracketId})
        }
        SET v.position = update.position
        `,
        {
          bracketId,
          updates: videoIds.map((id, index) => ({
            id,
            position: int(index), // 0-based
          })),
        }
      );
    });
  } finally {
    await session.close();
  }
}
