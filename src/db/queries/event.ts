import driver from "../driver";
import { Event } from "../../types/event";
import { generateShortId, slugify } from "@/lib/utils";
import { title } from "process";

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
  creatorId: $creatorId,
  title: $title,
  description: $description,
  address: $address,
  prize: $prize,
  entryCost: $entryCost,
  startDate: date($startDate),
  startTime: $startTime,
  endTime: $endTime,
  schedule: $schedule
})
WITH e
MERGE (c:City {
  name: $city.name,
  countryCode: $city.countryCode,
  region: $city.region
})
SET c.population = $city.population
MERGE (e)-[:IN]->(c)

WITH e
OPTIONAL MATCH (existingPoster:Picture)-[:POSTER_OF]->(e)
DELETE existingPoster

WITH e
MERGE (newPoster:Picture { id: $poster.id })
ON CREATE SET
  newPoster.title = $poster.title,
  newPoster.url = $poster.url,
  newPoster.type = $poster.type
MERGE (newPoster)-[:POSTER_OF]->(e)

WITH e, $sections AS sections, $roles AS roles
UNWIND sections AS sec
MERGE (s:Section { id: sec.id })
ON CREATE SET
  s.title = sec.title,
  s.description = sec.description,
  s.hasBrackets = sec.hasBrackets
MERGE (s)-[:IN]->(e)

WITH e, s, sec.videos AS videos, sec.brackets AS brackets, roles
UNWIND videos AS vid
MERGE (v:Video { id: vid.id })
ON CREATE SET
  v.title = vid.title,
  v.url = vid.src
MERGE (v)-[:IN]->(s)

WITH e, s, brackets, roles
UNWIND brackets AS br
MERGE (b:Bracket { id: br.id })
ON CREATE SET
  b.title = br.title
MERGE (b)-[:IN]->(s)

WITH e, roles
UNWIND roles AS roleData
MERGE (m:Member { id: roleData.user.id })
WITH m, e, roleData
CALL apoc.merge.relationship(m, toUpper(roleData.title), {}, {}, e)
YIELD rel
WITH e

WITH e, $subEvents AS subEvents
UNWIND subEvents AS sub
MERGE (se:SubEvent { id: sub.id })
ON CREATE SET 
  se.title = sub.title,
  se.description = sub.description,
  se.schedule = sub.schedule,
  se.startDate = sub.startDate,
  se.address = sub.address,
  se.startTime = sub.startTime,
  se.endTime = sub.endTime
MERGE (se)-[:PART_OF]->(e)

WITH e, se, sub.poster AS poster
MERGE (subPic:Picture { id: poster.id })
ON CREATE SET
  subPic.title = poster.title,
  subPic.url = poster.url,
  subPic.type = poster.type
MERGE (subPic)-[:POSTER_OF]->(se)

WITH e, $gallery AS gallery
UNWIND gallery AS pic
MERGE (g:Picture { id: pic.id })
ON CREATE SET 
  g.title = pic.title,
  g.url = pic.url,
  g.type = pic.type
MERGE (g)-[:PHOTO_OF]->(e)

RETURN e

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
  return result.records[0].get("e").properties;
};

export const EditEvent = async (event: Event) => {
  const { id, eventDetails } = event;
  const session = driver.session();
  
  const result = await session.run(
  // Update main event properties
    `MATCH (e:Event {id: $id})
    SET e.title = $title,
        e.description = $description,
        e.address = $address,
        e.prize = $prize,
        e.entryCost = $entryCost,
        e.startDate = date($startDate),
        e.startTime = $startTime,
        e.endTime = $endTime,
        e.schedule = $schedule

   
    WITH e
    MATCH (e)-[r:IN]->(oldCity:City)
    DELETE r
    WITH e
    MERGE (c:City {
      name: $city.name,
      countryCode: $city.countryCode,
      region: $city.region
    })
    SET c.population = $city.population
    MERGE (e)-[:IN]->(c)

    
    WITH e
    MATCH (oldPoster:Picture)-[r:POSTER_OF]->(e)
    DELETE r, oldPoster
    WITH e
    MERGE (newPoster:Picture { id: $poster.id })
    ON CREATE SET
      newPoster.title = $poster.title,
      newPoster.url = $poster.url,
      newPoster.type = $poster.type
    MERGE (newPoster)-[:POSTER_OF]->(e)

    WITH e, $sections AS sections
    UNWIND sections AS sec
    MERGE (s:Section { id: sec.id })
    ON CREATE SET
      s.title = sec.title,
      s.description = sec.description,
      s.hasBrackets = sec.hasBrackets
    ON MATCH SET
      s.title = sec.title,
      s.description = sec.description,
      s.hasBrackets = sec.hasBrackets
    MERGE (s)-[:IN]->(e)


    WITH e, s, sec.videos AS videos
    UNWIND videos AS vid
    MERGE (v:Video { id: vid.id })
    ON CREATE SET
      v.title = vid.title,
      v.url = vid.src
    ON MATCH SET
      v.title = vid.title,
      v.url = vid.src
    MERGE (v)-[:IN]->(s)

    
    WITH e, s, sec.brackets AS brackets
    UNWIND brackets AS br
    MERGE (b:Bracket { id: br.id })
    ON CREATE SET
      b.title = br.title
    ON MATCH SET
      b.title = br.title
    MERGE (b)-[:IN]->(s)

 
    WITH e, sections
    MATCH (s:Section)-[:IN]->(e)
    WHERE NOT s.id IN [sec IN sections | sec.id]
    OPTIONAL MATCH (v:Video)-[:IN]->(s)
    OPTIONAL MATCH (b:Bracket)-[:IN]->(s)
    DELETE s, v, b


    WITH e, $roles AS roles
    UNWIND roles AS roleData
    MERGE (m:Member { id: roleData.user.id })
    WITH m, e, roleData
    CALL apoc.merge.relationship(m, toUpper(roleData.title), {}, {}, e)
    YIELD rel
    WITH e


    WITH e, roles
    MATCH (m:Member)-[r]->(e)
    WHERE NOT m.id IN [role IN roles | role.user.id]
    DELETE r


    WITH e, $subEvents AS subEvents
    UNWIND subEvents AS sub
    MERGE (se:SubEvent { id: sub.id })
    ON CREATE SET 
      se.title = sub.title,
      se.description = sub.description,
      se.schedule = sub.schedule,
      se.startDate = sub.startDate,
      se.address = sub.address,
      se.startTime = sub.startTime,
      se.endTime = sub.endTime
    ON MATCH SET
      se.title = sub.title,
      se.description = sub.description,
      se.schedule = sub.schedule,
      se.startDate = sub.startDate,
      se.address = sub.address,
      se.startTime = sub.startTime,
      se.endTime = sub.endTime
    MERGE (se)-[:PART_OF]->(e)


    WITH e, se, sub.poster AS poster
    MERGE (subPic:Picture { id: poster.id })
    ON CREATE SET
      subPic.title = poster.title,
      subPic.url = poster.url,
      subPic.type = poster.type
    ON MATCH SET
      subPic.title = poster.title,
      subPic.url = poster.url,
      subPic.type = poster.type
    MERGE (subPic)-[:POSTER_OF]->(se)


    WITH e, subEvents
    MATCH (se:SubEvent)-[:PART_OF]->(e)
    WHERE NOT se.id IN [sub IN subEvents | sub.id]
    OPTIONAL MATCH (subPic:Picture)-[:POSTER_OF]->(se)
    DELETE se, subPic


    WITH e, $gallery AS gallery
    UNWIND gallery AS pic
    MERGE (g:Picture { id: pic.id })
    ON CREATE SET 
      g.title = pic.title,
      g.url = pic.url,
      g.type = pic.type
    ON MATCH SET
      g.title = pic.title,
      g.url = pic.url,
      g.type = pic.type
    MERGE (g)-[:PHOTO_OF]->(e)


    WITH e, gallery
    MATCH (g:Picture)-[:PHOTO_OF]->(e)
    WHERE NOT g.id IN [pic IN gallery | pic.id]
    DELETE g

    RETURN e
    `,
    {
      id,
      title: eventDetails.title,
      description: eventDetails.description,
      address: eventDetails.address,
      prize: eventDetails.prize,
      entryCost: eventDetails.entryCost,
      startDate: eventDetails.startDate,
      startTime: eventDetails.startTime,
      endTime: eventDetails.endTime,
      schedule: eventDetails.schedule,
      poster: eventDetails.poster,
      city: eventDetails.city,
      sections: event.sections,
      roles: event.roles,
      subEvents: event.subEvents,
      gallery: event.gallery,
    }
  );
  
  await session.close();
  return result.records[0].get("e").properties;
};

export const deleteEvent = async (event: Event) => {
  const { id, eventDetails } = event;
  const session = driver.session();
  const result = await session.run(
    `
    MATCH (e:Event {id: $id})
    DELETE e
    `,
    {
      id,
      title: eventDetails.title,
    }
  );
  await session.close();
  return result.records[0].get("e").properties;
};


