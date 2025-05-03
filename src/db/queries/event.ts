import driver from "../driver";
import { NewEvent } from "../../types/event";

export const getEvent = async (id: string) => {
  const session = driver.session();
  const result = await session.run("MATCH (e:Event {id: $id}) RETURN e", {
    id,
  });
  session.close();
  return result.records[0].get("e").properties;
};

export const insertEvent = async (event: NewEvent) => {
  const session = driver.session();
  const result = await session.run(
    `
    CREATE (e:Event {id: apoc.create.uuid(), title: $title, startDate: $startDate, endDate: $endDate})
    SET e.description = $description
    SET e.address = $address
    SET e.time = $time
    ${
      event.poster
        ? "CREATE (i:Image {id: apoc.create.uuid(), src: $poster.src, type: $poster.type}) CREATE (e)<-[:POSTER_OF]-(i)"
        : ""
    }
    MATCH (u:User {id: $creatorId})
  CREATE (u)-[:CREATED]->(e)

    RETURN e, i, u
    `,
    {
      creatorId: event.creatorId,
      title: event.title,
      startDate: event.startDate,
      endDate: event.endDate,
      description: event.description ?? null,
      address: event.address ?? null,
      time: event.time ?? null,
      poster: event.poster ?? null,
    }
  );
  session.close();
  return result.records[0].get("e").properties;
};
