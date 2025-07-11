import driver from "../driver";
import {
  Event,
  Section,
  Bracket,
  Video,
  SubEvent,
  EventCard,
} from "../../types/event";
import { UserSearchItem } from "../../types/user";

// Neo4j record interfaces
interface BracketVideoRecord {
  sectionId: string;
  bracketId: string;
  videos: Video[];
}

interface BracketVideoUserRecord {
  sectionId: string;
  bracketId: string;
  videoId: string;
  taggedUsers: UserSearchItem[];
}

interface SectionVideoUserRecord {
  sectionId: string;
  videoId: string;
  taggedUsers: UserSearchItem[];
}

export const getEvent = async (id: string): Promise<Event> => {
  const session = driver.session();

  // Get main event data
  const eventResult = await session.run(
    `
    MATCH (e:Event {id: $id})
    OPTIONAL MATCH (e)-[:IN]->(c:City)
    OPTIONAL MATCH (poster:Picture)-[:POSTER]->(e)
    OPTIONAL MATCH (creator:User)-[:CREATED]->(e)
    
    RETURN e {
      id: e.id,
      createdAt: e.createdAt,
      updatedAt: e.updatedAt,
      title: e.title,
      description: e.description,
      address: e.address,
      prize: e.prize,
      entryCost: e.entryCost,
      startDate: e.startDate,
      startTime: e.startTime,
      endTime: e.endTime,
      schedule: e.schedule,
      creatorId: creator.id,
      poster: poster {
        id: poster.id,
        title: poster.title,
        url: poster.url,
        type: poster.type
      },
      city: c {
        id: c.id,
        name: c.name,
        countryCode: c.countryCode,
        region: c.region,
        population: c.population,
        timezone: c.timezone
      }
    } as event
  `,
    { id }
  );

  // Get roles
  const rolesResult = await session.run(
    `
    MATCH (e:Event {id: $id})<-[roleRel]-(user:User)
    WHERE type(roleRel) IN ['ORGANIZER', 'HEAD_JUDGE', 'DJ', 'MC', 'JUDGE', 'COORDINATOR']
    RETURN collect({
      id: type(roleRel),
      title: type(roleRel),
      user: user {
        id: user.id,
        displayName: user.displayName,
        username: user.username
      }
    }) as roles
  `,
    { id }
  );

  // Get sections with video and bracket counts
  const sectionsResult = await session.run(
    `
    MATCH (e:Event {id: $id})<-[:IN]-(s:Section)
    OPTIONAL MATCH (s)<-[:IN]-(v:Video)
    OPTIONAL MATCH (s)<-[:IN]-(b:Bracket)
    
    WITH s, collect(DISTINCT v) as videos, collect(DISTINCT b) as brackets
    
    RETURN collect({
      id: s.id,
      title: s.title,
      description: s.description,
      hasBrackets: size(brackets) > 0,
      videos: [v in videos | {
        id: v.id,
        title: v.title,
        src: v.src,
        taggedUsers: []
      }],
      brackets: [b in brackets | {
        id: b.id,
        title: b.title,
        videos: []
      }]
    }) as sections
  `,
    { id }
  );

  // Get bracket videos separately
  const bracketVideosResult = await session.run(
    `
    MATCH (e:Event {id: $id})<-[:IN]-(s:Section)<-[:IN]-(b:Bracket)<-[:IN]-(v:Video)
    RETURN s.id as sectionId, b.id as bracketId, collect({
      id: v.id,
      title: v.title,
      src: v.src
    }) as videos
  `,
    { id }
  );

  // Get tagged users for bracket videos
  const bracketVideoUsersResult = await session.run(
    `
    MATCH (e:Event {id: $id})<-[:IN]-(s:Section)<-[:IN]-(b:Bracket)<-[:IN]-(v:Video)<-[:IN]-(u:User)
    RETURN s.id as sectionId, b.id as bracketId, v.id as videoId, collect({
      id: u.id,
      displayName: u.displayName,
      username: u.username
    }) as taggedUsers
  `,
    { id }
  );

  // Get tagged users for direct section videos
  const sectionVideoUsersResult = await session.run(
    `
    MATCH (e:Event {id: $id})<-[:IN]-(s:Section)<-[:IN]-(v:Video)<-[:IN]-(u:User)
    RETURN s.id as sectionId, v.id as videoId, collect({
      id: u.id,
      displayName: u.displayName,
      username: u.username
    }) as taggedUsers
  `,
    { id }
  );

  // Merge bracket videos into sections
  const sections = sectionsResult.records[0]?.get("sections") || [];
  const bracketVideos = bracketVideosResult.records.map(
    (record): BracketVideoRecord => ({
      sectionId: record.get("sectionId"),
      bracketId: record.get("bracketId"),
      videos: record.get("videos"),
    })
  );

  const bracketVideoUsers = bracketVideoUsersResult.records.map(
    (record): BracketVideoUserRecord => ({
      sectionId: record.get("sectionId"),
      bracketId: record.get("bracketId"),
      videoId: record.get("videoId"),
      taggedUsers: record.get("taggedUsers"),
    })
  );

  // Update sections with bracket videos and tagged users
  sections.forEach((section: Section) => {
    // Add tagged users to direct section videos
    section.videos.forEach((video: Video) => {
      const userData = sectionVideoUsersResult.records.find(
        (record) =>
          record.get("sectionId") === section.id &&
          record.get("videoId") === video.id
      );
      if (userData) {
        video.taggedUsers = userData.get("taggedUsers");
      } else {
        video.taggedUsers = [];
      }
    });

    // Add videos and tagged users to brackets
    section.brackets.forEach((bracket: Bracket) => {
      const bracketVideoData = bracketVideos.find(
        (bv) => bv.sectionId === section.id && bv.bracketId === bracket.id
      );
      if (bracketVideoData) {
        bracket.videos = bracketVideoData.videos;

        // Add tagged users to bracket videos
        bracket.videos.forEach((video: Video) => {
          const userData = bracketVideoUsers.find(
            (bvu: BracketVideoUserRecord) =>
              bvu.sectionId === section.id &&
              bvu.bracketId === bracket.id &&
              bvu.videoId === video.id
          );
          if (userData) {
            video.taggedUsers = userData.taggedUsers;
          } else {
            video.taggedUsers = [];
          }
        });
      } else {
        bracket.videos = [];
      }
    });
  });

  // Get sub events
  const subEventsResult = await session.run(
    `
    MATCH (e:Event {id: $id})<-[:PART_OF]-(se:SubEvent)
    OPTIONAL MATCH (sePoster:Picture)-[:POSTER]->(se)
    
    RETURN collect({
      id: se.id,
      title: se.title,
      description: se.description,
      schedule: se.schedule,
      startDate: se.startDate,
      address: se.address,
      startTime: se.startTime,
      endTime: se.endTime,
      poster: sePoster {
        id: sePoster.id,
        title: sePoster.title,
        url: sePoster.url,
        type: sePoster.type
      }
    }) as subEvents
  `,
    { id }
  );

  // Get gallery
  const galleryResult = await session.run(
    `
    MATCH (e:Event {id: $id})<-[:PHOTO]-(galleryPic:Picture)
    RETURN collect(galleryPic {
      id: galleryPic.id,
      title: galleryPic.title,
      url: galleryPic.url,
      type: galleryPic.type
    }) as gallery
  `,
    { id }
  );

  session.close();

  const event = eventResult.records[0]?.get("event");
  const roles = rolesResult.records[0]?.get("roles") || [];
  const subEvents = subEventsResult.records[0]?.get("subEvents") || [];
  const gallery = galleryResult.records[0]?.get("gallery") || [];

  // Check if event exists
  if (!event) {
    throw new Error(`Event with id ${id} not found`);
  }

  // Convert subEvent dates to MM/DD/YYYY format
  const formattedSubEvents = subEvents.map((subEvent: SubEvent) => ({
    ...subEvent,
    startDate: subEvent.startDate,
  }));

  return {
    ...event,
    eventDetails: {
      title: event.title,
      description: event.description,
      address: event.address,
      prize: event.prize,
      entryCost: event.entryCost,
      startDate: event.startDate,
      startTime: event.startTime,
      endTime: event.endTime,
      schedule: event.schedule,
      creatorId: event.creatorId,
      poster: event.poster,
      city: event.city,
    },
    roles,
    sections,
    subEvents: formattedSubEvents,
    gallery,
  };
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

export const getEventSections = async (id: string) => {
  const session = driver.session();

  // Get event title
  const eventResult = await session.run(
    `
    MATCH (e:Event {id: $id})
    RETURN e.title as title
  `,
    { id }
  );

  // Get sections with full video and bracket data
  const sectionsResult = await session.run(
    `
    MATCH (e:Event {id: $id})<-[:IN]-(s:Section)
    OPTIONAL MATCH (s)<-[:IN]-(v:Video)
    OPTIONAL MATCH (s)<-[:IN]-(b:Bracket)
    OPTIONAL MATCH (b)<-[:IN]-(bv:Video)
    
    WITH s, collect(DISTINCT v) as videos, collect(DISTINCT b) as brackets
    
    RETURN collect({
      id: s.id,
      title: s.title,
      description: s.description,
      hasBrackets: size(brackets) > 0,
      videos: [v in videos | {
        id: v.id,
        title: v.title,
        src: v.src
      }],
      brackets: [b in brackets | {
        id: b.id,
        title: b.title,
        videos: []
      }]
    }) as sections
  `,
    { id }
  );

  // Get bracket videos separately
  const bracketVideosResult = await session.run(
    `
    MATCH (e:Event {id: $id})<-[:IN]-(s:Section)<-[:IN]-(b:Bracket)<-[:IN]-(v:Video)
    RETURN s.id as sectionId, b.id as bracketId, collect({
      id: v.id,
      title: v.title,
      src: v.src
    }) as videos
  `,
    { id }
  );

  // Get tagged users for direct section videos
  const sectionVideoUsersResult = await session.run(
    `
    MATCH (e:Event {id: $id})<-[:IN]-(s:Section)<-[:IN]-(v:Video)<-[:IN]-(u:User)
    RETURN s.id as sectionId, v.id as videoId, collect({
      id: u.id,
      displayName: u.displayName,
      username: u.username
    }) as taggedUsers
  `,
    { id }
  );

  // Get tagged users for bracket videos
  const bracketVideoUsersResult = await session.run(
    `
    MATCH (e:Event {id: $id})<-[:IN]-(s:Section)<-[:IN]-(b:Bracket)<-[:IN]-(v:Video)<-[:IN]-(user:User)
    RETURN s.id as sectionId, b.id as bracketId, v.id as videoId, collect({
      id: user.id,
      displayName: user.displayName,
      username: user.username
    }) as taggedUsers
  `,
    { id }
  );

  session.close();

  const title = eventResult.records[0]?.get("title");
  const sections = sectionsResult.records[0]?.get("sections") || [];
  const bracketVideos = bracketVideosResult.records.map(
    (record): BracketVideoRecord => ({
      sectionId: record.get("sectionId"),
      bracketId: record.get("bracketId"),
      videos: record.get("videos"),
    })
  );

  const sectionVideoUsers = sectionVideoUsersResult.records.map(
    (record): SectionVideoUserRecord => ({
      sectionId: record.get("sectionId"),
      videoId: record.get("videoId"),
      taggedUsers: record.get("taggedUsers"),
    })
  );

  const bracketVideoUsers = bracketVideoUsersResult.records.map(
    (record): BracketVideoUserRecord => ({
      sectionId: record.get("sectionId"),
      bracketId: record.get("bracketId"),
      videoId: record.get("videoId"),
      taggedUsers: record.get("taggedUsers"),
    })
  );

  // Check if event exists
  if (!title) {
    throw new Error(`Event with id ${id} not found`);
  }

  // Update sections with bracket videos
  sections.forEach((section: Section) => {
    // Add tagged users to direct section videos
    section.videos.forEach((video: Video) => {
      const userData = sectionVideoUsers.find(
        (svu) => svu.sectionId === section.id && svu.videoId === video.id
      );
      if (userData) {
        video.taggedUsers = userData.taggedUsers;
      } else {
        video.taggedUsers = [];
      }
    });

    // Add videos and tagged users to brackets
    section.brackets.forEach((bracket: Bracket) => {
      const bracketVideoData = bracketVideos.find(
        (bv) => bv.sectionId === section.id && bv.bracketId === bracket.id
      );
      if (bracketVideoData) {
        bracket.videos = bracketVideoData.videos;

        // Add tagged users to bracket videos
        bracket.videos.forEach((video: Video) => {
          const userData = bracketVideoUsers.find(
            (bvu) =>
              bvu.sectionId === section.id &&
              bvu.bracketId === bracket.id &&
              bvu.videoId === video.id
          );
          if (userData) {
            video.taggedUsers = userData.taggedUsers;
          } else {
            video.taggedUsers = [];
          }
        });
      } else {
        bracket.videos = [];
      }
    });
  });

  return { title, sections };
};

export const EditEvent = async (event: Event) => {
  const { id, eventDetails } = event;
  const session = driver.session();

  try {
    // Start transaction
    const tx = session.beginTransaction();

    // Update event properties
    await tx.run(
      `MATCH (e:Event {id: $id})
       SET e.title = $title,
           e.description = $description,
           e.address = $address,
           e.prize = $prize,
           e.entryCost = $entryCost,
           e.startDate = $startDate,
           e.startTime = $startTime,
           e.endTime = $endTime,
           e.schedule = $schedule`,
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
      }
    );

    // Update city relationship
    await tx.run(
      `MATCH (e:Event {id: $id})-[i:IN]->(c:City)
       DELETE i
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
       MERGE (e)-[:IN]->(c)`,
      { id, city: eventDetails.city }
    );

    // Update poster
    await tx.run(
      `MATCH (e:Event {id: $id})
       OPTIONAL MATCH (oldPoster:Picture)-[r:POSTER]->(e)
       DETACH DELETE oldPoster
       WITH e
       FOREACH (poster IN CASE WHEN $poster IS NOT NULL THEN [$poster] ELSE [] END |
         MERGE (newPoster:Picture { id: poster.id, title: poster.title, url: poster.url, type: poster.type })
         MERGE (newPoster)-[:POSTER]->(e)
       )`,
      { id, poster: eventDetails.poster }
    );

    // Update roles
    await tx.run(
      `MATCH (e:Event {id: $id})
       UNWIND $roles AS roleData
       MERGE (u:User { id: roleData.user.id })
       WITH u, e, roleData
       CALL apoc.merge.relationship(u, toUpper(roleData.title), {}, {}, e)
       YIELD rel
       RETURN e, u
       `,
      { id, roles: event.roles }
    );

    // Delete roles not in the new list
    await tx.run(
      `MATCH (e:Event {id: $id})
       MATCH (u:User)-[r]->(e)
       WHERE NOT u.id IN [role IN $roles | role.user.id]
       DELETE r`,
      { id, roles: event.roles }
    );

    // Update sub events
    await tx.run(
      `MATCH (e:Event {id: $id})
       // First, remove all existing poster relationships for subevents
       OPTIONAL MATCH (se:SubEvent)-[:PART_OF]->(e)
       OPTIONAL MATCH (oldPoster:Picture)-[r:POSTER]->(se)
       DELETE r
       
       WITH e
       FOREACH (sub IN $subEvents |
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

         FOREACH (poster IN CASE WHEN sub.poster IS NOT NULL THEN [sub.poster] ELSE [] END |
           MERGE (subPic:Picture { id: poster.id, title: poster.title, url: poster.url, type: poster.type })
           MERGE (subPic)-[:POSTER]->(se)
         )
       )`,
      { id, subEvents: event.subEvents }
    );

    // Clean up orphaned poster nodes that are no longer connected to any subevents
    await tx.run(
      `MATCH (p:Picture)
       WHERE p.type = 'poster' AND NOT (p)--()
       DELETE p`
    );

    // Delete sub events not in the new list
    await tx.run(
      `MATCH (e:Event {id: $id})
       MATCH (se:SubEvent)-[:PART_OF]->(e)
       WHERE NOT se.id IN [sub IN $subEvents | sub.id]
       DETACH DELETE se`,
      { id, subEvents: event.subEvents }
    );

    // Delete all user-video relationships
    await tx.run(
      `MATCH (e:Event {id: $id})
       OPTIONAL MATCH (e)<-[:IN]-(s:Section)<-[:IN]-(v:Video)<-[r:IN]-(u:User)
       DELETE r`,
      { id }
    );

    await tx.run(
      `MATCH (e:Event {id: $id})
       OPTIONAL MATCH (e)<-[:IN]-(s:Section)<-[:IN]-(b:Bracket)<-[:IN]-(v:Video)<-[r:IN]-(u:User)
       DELETE r`,
      { id }
    );

    // Update sections
    await tx.run(
      `MATCH (e:Event {id: $id})
       FOREACH (sec IN $sections |
         MERGE (s:Section { id: sec.id })
         ON MATCH SET
           s.title = sec.title,
           s.description = sec.description
         MERGE (s)-[:IN]->(e)
       )`,
      { id, sections: event.sections }
    );

    // Cascade delete brackets if section hasBrackets is false
    await tx.run(
      `MATCH (e:Event {id: $id})
       MATCH (b:Bracket)-[:IN]->(s:Section)-[:IN]->(e)
       WHERE ANY(sec IN $sections WHERE sec.id = s.id AND sec.hasBrackets = false)
       DETACH DELETE b`,
      { id, sections: event.sections }
    );

    // Cascade delete direct section videos if section hasBrackets is true
    await tx.run(
      `MATCH (e:Event {id: $id})
       MATCH (vid:Video)-[:IN]->(s:Section)-[:IN]->(e)
       WHERE ANY(sec IN $sections WHERE sec.id = s.id AND sec.hasBrackets = true)
       DETACH DELETE vid`,
      { id, sections: event.sections }
    );

    // Handle sections with brackets (hasBrackets = true)
    await tx.run(
      `MATCH (e:Event {id: $id})
       FOREACH (sec IN [s IN $sections WHERE s.hasBrackets = true] |
         MERGE (s:Section {id: sec.id})-[:IN]->(e)
         FOREACH (br IN sec.brackets |
           MERGE (b:Bracket { id: br.id })
           ON CREATE SET
             b.title = br.title
           ON MATCH SET
             b.title = br.title
           MERGE (b)-[:IN]->(s)
           
           FOREACH (bvid IN br.videos |
             MERGE (bv:Video { id: bvid.id })
             ON CREATE SET
               bv.title = bvid.title,
               bv.src = bvid.src
             ON MATCH SET
               bv.title = bvid.title,
               bv.src = bvid.src
             FOREACH (user IN bvid.taggedUsers |
               MERGE (u:User { id: user.id })
               MERGE (u)-[:IN]->(bv)
             )
             MERGE (bv)-[:IN]->(b)
           )
         )
       )`,
      { id, sections: event.sections }
    );

    // Handle sections without brackets (hasBrackets = false)
    await tx.run(
      `MATCH (e:Event {id: $id})
       FOREACH (sec IN [s IN $sections WHERE s.hasBrackets = false] |
         MERGE (s:Section {id: sec.id})-[:IN]->(e)
         FOREACH (vid IN sec.videos |
           MERGE (v:Video { id: vid.id })
           ON CREATE SET
             v.title = vid.title,
             v.src = vid.src
           ON MATCH SET
             v.title = vid.title,
             v.src = vid.src
           MERGE (v)-[:IN]->(s)
           FOREACH (user IN vid.taggedUsers |
             MERGE (u:User {id: user.id})
             MERGE (u)-[:IN]->(v)
           )
         )
       )`,
      { id, sections: event.sections }
    );

    // Delete sections not in the new list
    await tx.run(
      `MATCH (e:Event {id: $id})
       MATCH (s:Section)-[:IN]->(e)
       WHERE NOT ANY(sec IN $sections WHERE sec.id = s.id)
       DETACH DELETE s`,
      { id, sections: event.sections }
    );

    // Delete brackets not in the new list
    await tx.run(
      `MATCH (e:Event {id: $id})
       MATCH (b:Bracket)-[:IN]->(s:Section)-[:IN]->(e)
       WHERE NOT ANY(sec IN $sections WHERE ANY(br IN sec.brackets WHERE br.id = b.id))
       DETACH DELETE b`,
      { id, sections: event.sections }
    );

    // Delete videos not in the new list (but preserve user nodes)
    await tx.run(
      `MATCH (e:Event {id: $id})
       MATCH (v:Video)-[:IN]->(s:Section)-[:IN]->(e)
       WHERE NOT ANY(sec IN $sections WHERE ANY(vid IN sec.videos WHERE vid.id = v.id))
       DETACH DELETE v`,
      { id, sections: event.sections }
    );

    // Delete videos in brackets not in the new list (but preserve user nodes)
    await tx.run(
      `MATCH (e:Event {id: $id})
       MATCH (v:Video)-[:IN]->(b:Bracket)-[:IN]->(s:Section)-[:IN]->(e)
       WHERE NOT ANY(sec IN $sections WHERE ANY(br IN sec.brackets WHERE ANY(vid IN br.videos WHERE vid.id = v.id)))
       DETACH DELETE v`,
      { id, sections: event.sections }
    );

    // Update gallery
    await tx.run(
      `MATCH (e:Event {id: $id})
       FOREACH (pic IN $gallery |
         MERGE (g:Picture { id: pic.id, title: pic.title, url: pic.url, type: pic.type })
         MERGE (g)-[:PHOTO]->(e)
       )`,
      { id, gallery: event.gallery }
    );

    // Delete gallery items not in the new list
    await tx.run(
      `MATCH (e:Event {id: $id})
       MATCH (g:Picture)-[:PHOTO]->(e)
       WHERE NOT g.id IN [pic IN $gallery | pic.id]
       DETACH DELETE g`,
      { id, gallery: event.gallery }
    );

    // Commit transaction
    await tx.commit();
    await session.close();

    return true;
  } catch (error) {
    // Rollback transaction on error
    if (session) {
      await session.close();
    }
    throw error;
  }
};

export const deleteEvent = async (eventId: string) => {
  const session = driver.session();
  try {
    await session.run(
      `MATCH (e:Event {id: $id})
    OPTIONAL MATCH (e)<-[:POSTER|PHOTO]-(pic:Picture)
    OPTIONAL MATCH (e)<-[:PART_OF]-(se:SubEvent)<-[:POSTER]-(sePic:Picture)
    OPTIONAL MATCH (e)<-[:IN]-(s:Section)
    OPTIONAL MATCH (s)<-[:IN]-(b:Bracket)
    OPTIONAL MATCH (s)<-[:IN]-(v1:Video)
    OPTIONAL MATCH (b)<-[:IN]-(v2:Video)
    
    DETACH DELETE pic, se, sePic, s, b, v1, v2, e
    
    RETURN count(*) as deletedNodes`,
      {
        id: eventId,
      }
    );
    await session.close();
    return true;
  } catch (error) {
    console.error("Error deleting event:", error);
    return false;
  }
};

export const getEvents = async (): Promise<EventCard[]> => {
  const session = driver.session();
  const result = await session.run(
    `MATCH (e:Event)-[:IN]->(c:City)
    OPTIONAL MATCH (e)<-[:POSTER]-(p:Picture)
    RETURN e {
      id: e.id,
      title: e.title,
      imageUrl: p.url,
      city: c.name,
      styles: []
    }`
  );
  await session.close();
  return result.records.map((record) => record.get("e"));
};

//Gets all pictures including poster, gallery, and subevent posters
export const getEventPictures = async (eventId: string) => {
  const session = driver.session();
  const result = await session.run(
    `MATCH (e:Event {id: $eventId})
    OPTIONAL MATCH (e)<-[:POSTER]-(poster:Picture)
    OPTIONAL MATCH (e)<-[:PHOTO]-(gallery:Picture)
    OPTIONAL MATCH (e)<-[:PART_OF]-(se:SubEvent)<-[:POSTER]-(subEventPoster:Picture)

    RETURN poster, gallery, subEventPoster
    `,
    {
      eventId,
    }
  );
  await session.close();

  const pictures: string[] = [];

  result.records.forEach((record) => {
    if (record.get("poster")?.properties["url"]) {
      pictures.push(record.get("poster").properties["url"]);
    }
    if (record.get("gallery")?.properties["url"]) {
      pictures.push(record.get("gallery").properties["url"]);
    }
    if (record.get("subEventPoster")?.properties["url"]) {
      pictures.push(record.get("subEventPoster").properties["url"]);
    }
  });

  return pictures;
};
