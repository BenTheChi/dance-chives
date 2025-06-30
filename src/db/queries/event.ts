import driver from "../driver";
import { Event } from "../../types/event";

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

  // Merge bracket videos into sections
  const sections = sectionsResult.records[0]?.get("sections") || [];
  const bracketVideos = bracketVideosResult.records.map((record) => ({
    sectionId: record.get("sectionId"),
    bracketId: record.get("bracketId"),
    videos: record.get("videos"),
  }));

  // Update sections with bracket videos
  sections.forEach((section: any) => {
    section.brackets.forEach((bracket: any) => {
      const bracketVideoData = bracketVideos.find(
        (bv) => bv.sectionId === section.id && bv.bracketId === bracket.id
      );
      if (bracketVideoData) {
        bracket.videos = bracketVideoData.videos;
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
    subEvents,
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
    MATCH (e:Event {id: $id})<-[:IN]-(s:Section)<-[:IN]-(v:Video)<-[:IN]-(user:User)
    RETURN s.id as sectionId, v.id as videoId, collect({
      id: user.id,
      displayName: user.displayName,
      username: user.username
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
  const bracketVideos = bracketVideosResult.records.map((record) => ({
    sectionId: record.get("sectionId"),
    bracketId: record.get("bracketId"),
    videos: record.get("videos"),
  }));

  const sectionVideoUsers = sectionVideoUsersResult.records.map((record) => ({
    sectionId: record.get("sectionId"),
    videoId: record.get("videoId"),
    taggedUsers: record.get("taggedUsers"),
  }));

  const bracketVideoUsers = bracketVideoUsersResult.records.map((record) => ({
    sectionId: record.get("sectionId"),
    bracketId: record.get("bracketId"),
    videoId: record.get("videoId"),
    taggedUsers: record.get("taggedUsers"),
  }));

  // Check if event exists
  if (!title) {
    throw new Error(`Event with id ${id} not found`);
  }

  // Update sections with bracket videos
  sections.forEach((section: any) => {
    // Add tagged users to direct section videos
    section.videos.forEach((video: any) => {
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
    section.brackets.forEach((bracket: any) => {
      const bracketVideoData = bracketVideos.find(
        (bv) => bv.sectionId === section.id && bv.bracketId === bracket.id
      );
      if (bracketVideoData) {
        bracket.videos = bracketVideoData.videos;

        // Add tagged users to bracket videos
        bracket.videos.forEach((video: any) => {
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
