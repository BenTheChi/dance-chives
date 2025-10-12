// Test data for Neo4j development database
// This script creates sample events, users, cities, and relationships
// Create test cities
CREATE
  (nyc:City
    {
      id: 'new-york-ny',
      name: 'New York',
      countryCode: 'US',
      region: 'New York',
      population: 8336817,
      timezone: 'America/New_York'
    });

CREATE
  (la:City
    {
      id: 'los-angeles-ca',
      name: 'Los Angeles',
      countryCode: 'US',
      region: 'California',
      population: 3898747,
      timezone: 'America/Los_Angeles'
    });

CREATE
  (chicago:City
    {
      id: 'chicago-il',
      name: 'Chicago',
      countryCode: 'US',
      region: 'Illinois',
      population: 2746388,
      timezone: 'America/Chicago'
    });

CREATE
  (miami:City
    {
      id: 'miami-fl',
      name: 'Miami',
      countryCode: 'US',
      region: 'Florida',
      population: 442241,
      timezone: 'America/New_York'
    });

// Create test users (matching PostgreSQL users)
CREATE
  (alice:User
    {
      id: 'test-user-1',
      name: 'Alice Johnson',
      email: 'alice@example.com',
      image: 'https://example.com/alice.jpg'
    });

CREATE
  (bob:User
    {
      id: 'test-user-2',
      name: 'Bob Smith',
      email: 'bob@example.com',
      image: 'https://example.com/bob.jpg'
    });

CREATE
  (carol:User
    {
      id: 'test-user-3',
      name: 'Carol Davis',
      email: 'carol@example.com',
      image: 'https://example.com/carol.jpg'
    });

CREATE
  (david:User
    {
      id: 'test-user-4',
      name: 'David Wilson',
      email: 'david@example.com',
      image: 'https://example.com/david.jpg'
    });

CREATE
  (eva:User
    {
      id: 'test-user-5',
      name: 'Eva Martinez',
      email: 'eva@example.com',
      image: 'https://example.com/eva.jpg'
    });

// Create test events
CREATE
  (summerBattle:Event
    {
      id: 'summer-battle-2024',
      title: 'Summer Battle 2024',
      description:
        'The hottest breaking battle of the summer featuring top dancers from around the world.',
      address: '123 Dance Street, New York, NY 10001',
      prize: '$5000 Cash Prize',
      entryCost: '$25',
      startDate: '2024-07-15',
      startTime: '19:00',
      endTime: '23:00',
      schedule: 'Registration: 6PM, Battles: 7PM-11PM'
    });

CREATE
  (winterCypher:Event
    {
      id: 'winter-cypher-2024',
      title: 'Winter Cypher 2024',
      description:
        'Annual winter cypher bringing together the community for freestyle sessions.',
      address: '456 Hip Hop Ave, Los Angeles, CA 90210',
      prize: 'Community Recognition',
      entryCost: 'Free',
      startDate: '2024-12-20',
      startTime: '18:00',
      endTime: '22:00',
      schedule: 'Open cypher all night'
    });

CREATE
  (springJam:Event
    {
      id: 'spring-jam-2024',
      title: 'Spring Jam 2024',
      description:
        'Celebrating spring with house, breaking, and popping battles.',
      address: '789 Movement Blvd, Chicago, IL 60601',
      prize: '$2000 + Trophies',
      entryCost: '$15',
      startDate: '2024-04-10',
      startTime: '17:00',
      endTime: '21:00',
      schedule: 'Workshops: 5PM, Battles: 7PM'
    });

// Create event posters
CREATE
  (summerPoster:Picture
    {
      id: 'poster-summer-battle-2024',
      title: 'Summer Battle 2024 Poster',
      url: 'https://example.com/posters/summer-battle-2024.jpg',
      type: 'poster'
    })-
    [:POSTER]->
  (summerBattle);

CREATE
  (winterPoster:Picture
    {
      id: 'poster-winter-cypher-2024',
      title: 'Winter Cypher 2024 Poster',
      url: 'https://example.com/posters/winter-cypher-2024.jpg',
      type: 'poster'
    })-
    [:POSTER]->
  (winterCypher);

CREATE
  (springPoster:Picture
    {
      id: 'poster-spring-jam-2024',
      title: 'Spring Jam 2024 Poster',
      url: 'https://example.com/posters/spring-jam-2024.jpg',
      type: 'poster'
    })-
    [:POSTER]->
  (springJam);

// Create event-city relationships
MATCH (e:Event {id: 'summer-battle-2024'}), (c:City {id: 'new-york-ny'})
CREATE (e)-[:IN]->(c);

MATCH (e:Event {id: 'winter-cypher-2024'}), (c:City {id: 'los-angeles-ca'})
CREATE (e)-[:IN]->(c);

MATCH (e:Event {id: 'spring-jam-2024'}), (c:City {id: 'chicago-il'})
CREATE (e)-[:IN]->(c);

// Create user-event relationships (creators and participants)
MATCH (u:User {id: 'test-user-1'}), (e:Event {id: 'summer-battle-2024'})
CREATE (u)-[:CREATED]->(e);

MATCH (u:User {id: 'test-user-2'}), (e:Event {id: 'summer-battle-2024'})
CREATE (u)-[:JUDGE]->(e);

MATCH (u:User {id: 'test-user-2'}), (e:Event {id: 'winter-cypher-2024'})
CREATE (u)-[:CREATED]->(e);

MATCH (u:User {id: 'test-user-3'}), (e:Event {id: 'winter-cypher-2024'})
CREATE (u)-[:PARTICIPANT]->(e);

MATCH (u:User {id: 'test-user-1'}), (e:Event {id: 'spring-jam-2024'})
CREATE (u)-[:CREATED]->(e);

MATCH (u:User {id: 'test-user-4'}), (e:Event {id: 'spring-jam-2024'})
CREATE (u)-[:MC]->(e);

// Create test sections and videos
CREATE
  (breakingSection:Section
    {
      id: 'breaking-section-summer',
      title: 'Breaking Battle',
      description: 'Main breaking competition'
    })-
    [:IN]->
  (summerBattle);

CREATE
  (houseSection:Section
    {
      id: 'house-section-spring',
      title: 'House Battle',
      description: 'House dance competition'
    })-
    [:IN]->
  (springJam);

// Create test brackets
CREATE
  (breakingBracket:Bracket
    {id: 'breaking-bracket-finals', title: 'Breaking Finals'})-
    [:IN]->
  (breakingSection);

// Create test videos
CREATE
  (finalVideo:Video
    {
      id: 'breaking-finals-video-1',
      title: 'Breaking Finals - Round 1',
      src: 'https://example.com/videos/breaking-finals-1.mp4'
    })-
    [:IN]->
  (breakingBracket);

CREATE
  (semifinalVideo:Video
    {
      id: 'breaking-semifinals-video-1',
      title: 'Breaking Semifinals - Battle 1',
      src: 'https://example.com/videos/breaking-semi-1.mp4'
    })-
    [:IN]->
  (houseSection);

// Tag users in videos
MATCH (u:User {id: 'test-user-2'}), (v:Video {id: 'breaking-finals-video-1'})
CREATE (u)-[:IN]->(v);

MATCH (u:User {id: 'test-user-3'}), (v:Video {id: 'breaking-finals-video-1'})
CREATE (u)-[:IN]->(v);

// Create gallery photos
CREATE
  (galleryPhoto1:Picture
    {
      id: 'gallery-summer-1',
      title: 'Summer Battle Crowd',
      url: 'https://example.com/gallery/summer-crowd.jpg',
      type: 'photo'
    })-
    [:PHOTO]->
  (summerBattle);

CREATE
  (galleryPhoto2:Picture
    {
      id: 'gallery-summer-2',
      title: 'Winner Celebration',
      url: 'https://example.com/gallery/winner-celebration.jpg',
      type: 'photo'
    })-
    [:PHOTO]->
  (summerBattle);