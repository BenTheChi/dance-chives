import driver from "../driver";
import { NewEvent } from "../../types/event";
import { generateShortId, slugify } from "@/lib/utils";

export const getEvent = async (id: string) => {
  const session = driver.session();
  const result = await session.run(
    `MATCH (e:Event {id: $id})<-(:POSTER_OF)-(i:Image) 
    MATCH (e)<-[:CREATED]-(u:User)
    RETURN e, u, i`,
    {
      id,
    }
  );
  session.close();
  return result.records[0].get("e").properties;
};

export const insertEvent = async (event: NewEvent) => {
  const session = driver.session();
  const result = await session.run(
    `
      CREATE (e:Event {
        id: $id,
        title: $title,
        startDate: $startDate,
        endDate: $endDate
      })
      SET e.description = $description,
          e.address = $address,
          e.time = $time
      WITH e
      ${
        event.poster
          ? `
          CREATE (i:Image {
            id: $posterId,
            title: $posterTitle,
            src: $posterSrc,
            type: $posterType
          })
          CREATE (e)<-[:POSTER_OF]-(i)
          WITH e, i
        `
          : ""
      }
      MATCH (u:User {id: $creatorId})
      CREATE (u)-[:CREATED]->(e)
      RETURN e, u${event.poster ? ", i" : ""}
      `,
    {
      id: slugify(event.title) + "-" + generateShortId(6),
      title: event.title,
      startDate: event.startDate,
      endDate: event.endDate,
      description: event.description ?? null,
      address: event.address ?? null,
      time: event.time ?? null,
      creatorId: event.creatorId,
      ...(event.poster && {
        posterId: event.poster.id,
        posterTitle: event.poster.title,
        posterSrc: event.poster.src,
        posterType: event.poster.type,
      }),
    }
  );
  await session.close();
  return result.records[0].get("e").properties;
};
