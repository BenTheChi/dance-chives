import driver from "../driver";
import { Event } from "../../types/event";
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

export const insertEvent = async (event: Event) => {
  const session = driver.session();

  const result = await session.run(
    `
CREATE (e:Event {
  id: $eventId,
  title: $title,
  description: $description,
  address: $address,
  prize: $prize,
  entryCost: $entryCost,
  startDate: $startDate,
  startTime: $startTime,
  endTime: $endTime,
  schedule: $schedule
})

WITH e
MERGE (c:City {id: $city.id})
  ON CREATE SET 
    c.name = $city.name,
    c.countryCode = $city.countryCode,
    c.region = $city.region,
    c.population = $city.population,
    c.timezone = $city.timezone
  ON MATCH SET
    c.population = $city.population
MERGE (e)-[:IN]->(c)

WITH e
CREATE (newPoster:Picture {
    id: $poster.id,
    title: $poster.title,
    url: $poster.url,
    type: 'poster'
})-[:POSTER]->(e)

WITH e
UNWIND $roles AS roleData
MATCH (u:User { id: roleData.user.id })
CALL apoc.merge.relationship(u, toUpper(roleData.title), {}, {}, e)
YIELD rel

WITH e
MATCH (u:User {id: $creatorId})
MERGE (u)-[:CREATED]->(e)

WITH e
FOREACH (sub IN $subEvents |
  CREATE (se:SubEvent { 
    id: sub.id,
    title: sub.title,
    description: sub.description,
    schedule: sub.schedule,
    startDate: sub.startDate,
    address: sub.address,
    startTime: sub.startTime,
    endTime: sub.endTime
  })-[:PART_OF]->(e)
  CREATE (subPic:Picture { 
    id: sub.poster.id,
    title: sub.poster.title,
    url: sub.poster.url,
    type: 'poster'
  })-[:POSTER]->(se)
)

WITH e
FOREACH (pic IN $gallery |
  CREATE (g:Picture { 
    id: pic.id,
    title: pic.title,
    url: pic.url,
    type: 'photo'
  })-[:PHOTO]->(e)
)

WITH e
FOREACH (sec IN $sections |
  CREATE (s:Section {
      id: sec.id,
      title: sec.title,
      description: sec.description
  })-[:IN]->(e)
)

WITH e
FOREACH (sec IN [s IN $sections WHERE s.hasBrackets = true] |
  MERGE (s:Section {id: sec.id})-[:IN]->(e)
  FOREACH (br IN sec.brackets |
    CREATE (b:Bracket {
        id: br.id,
        title: br.title
    })-[:IN]->(s)
    FOREACH (vid IN br.videos |
      CREATE (v:Video { 
        id: vid.id,
        title: vid.title,
        src: vid.src
      })-[:IN]->(b)
      FOREACH (user IN vid.taggedUsers |
        MERGE (u:User { id: user.id })
        MERGE (u)-[:IN]->(v)
      )
    )
  )
)

WITH e
FOREACH (sec IN [s IN $sections WHERE s.hasBrackets = false] |
  MERGE (s:Section {id: sec.id})-[:IN]->(e)
  FOREACH (vid IN sec.videos |
    CREATE (v:Video { 
      id: vid.id,
      title: vid.title,
      src: vid.src
    })-[:IN]->(s)
    FOREACH (user IN vid.taggedUsers |
      MERGE (u:User { id: user.id })
      MERGE (u)-[:IN]->(v)
    )
  )
)

WITH e
MATCH (event:Event {id: $eventId})
RETURN event
`,
    {
      eventId: event.id,
      creatorId: event.eventDetails.creatorId,
      title: event.eventDetails.title,
      description: event.eventDetails.description,
      address: event.eventDetails.address,
      prize: event.eventDetails.prize,
      entryCost: event.eventDetails.entryCost,
      startDate: event.eventDetails.startDate,
      startTime: event.eventDetails.startTime,
      endTime: event.eventDetails.endTime,
      schedule: event.eventDetails.schedule,
      poster: event.eventDetails.poster,
      city: event.eventDetails.city,
      sections: event.sections,
      roles: event.roles,
      subEvents: event.subEvents,
      gallery: event.gallery,
    }
  );
  await session.close();
  return result.records[0].get("event").properties;
};
