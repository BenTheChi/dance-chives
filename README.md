# Dance Chives - An event archive app for the street dance community
## Problem
The street and club dance community thrives as an event-driven subculture centered around high-energy competitions known as battles. Through the collective grassroots efforts of dancers and organizers, thousands of these battles take place across the globe each year, generating extensive footage. While most events are promoted, shared, and documented on social media, platforms like Facebook, Instagram, and YouTube lack the structure to systematically organize dance events and their metadata in an accessible way. As a result, the culture remains fragmented online, leaving many talented dancers, event hosts, and creators without proper recognition.  

That’s where **Dance Chives** comes in.

## Solution
**Dance Chives** is a web app archive designed to collect, display, and track dance event data. Our goal is to unify all metadata, media, and social connection through our site. Most of the data we need is sourced from Instagram and YouTube, so we are only displaying them as iFrames. We aim for **high SEO** and organic search to drive traffic.  This site is highly inspired by similar sites like bboy.org and breakkonnect.com.  However, we aim to focus more on the collection of videos, images, and social media posts for events.

---

## Example Event
### Massive Monkees Day 2024  
- [Instagram Post](https://www.instagram.com/p/C7Hilb9xqNY/)  
- [YouTube Battles from that day](https://www.youtube.com/watch?v=_9yz_EXYi3g&list=PLHV9AalJgY_IPJgrCD12zXxCMsQ-wrEsP)  
- [Official Website](https://www.massivemonkees.com/massive-monkees-day)  

### Event Participants  
- **DJ**: [DJ Magic Sean](https://www.instagram.com/djmagicsean/)  
- **MC**: [Mac Tray](https://www.instagram.com/mactrayy/)  

There is an existing site called [BreakKonnect](https://breakkonnect.com/) that has similar functionality but does not emphasize video or image archiving.  

---

## Tech Stack
**Frontend**: TS / NextJS / React / ShadCN / Tailwind  
**Backend**: TS / NextJS / Neo4j (Aura hosted) / Vercel (will migrate to GCloud Run eventually)  
**Storage**: Image storage is on Google Cloud Storage hosted by Bens  

---

## Main Features
- **Bracket View**: Displaying an event’s videos in a bracketed format to watch all battles in one place.
- **Tagging System**: Connecting Styles and People (both site users and future users) to Events, Roles, Videos, other People, and more. This creates a rich ecosystem of useful data.
- **Advanced Search**: Using metadata from events to search with specific parameters (e.g., events in a city on mm/dd/yy featuring X dance styles).
- **Event Creation**: For promotion and future footage archival.
- **Event Images**: To store promotional posters and art.
- **User Profiles**: Functioning as portfolios, showcasing events participated in or danced at. User profiles also include contact sections.
- **Series Pages**: To group related events together.
- **User Authorization Roles**: For controlling who can create, edit, tag, and delete events.

---

## Nice-To-Have Features
- Dance Style History: Accompanied by videos and event suggestions.
- Non-English language support.
- Monetization through ads and promoted events.
- Ongoing dance class information.
- Ongoing practice session information.
- Venue (studio) information.
- Mapping feature with a timeline displaying enhanced geographical locations of events.

---

## Tech Todos
- Setup CI/CD pipeline.
- Add testing.
- Deploy to Vercel.
- Keep hitting Neo4j Aura to keep the instance up.
- Look into Tanstack for client/server syncing.
  - Consider if Zustand is needed for client-side syncing or if cache revalidation is enough.
  - Since client-side changes are minimal and mostly server-synced, Tanstack seems ideal.
- More architecture discussions.
  - Might start a weekly session just for engineers to brainstorm architecture design.
- Any other tickets on the project board.

---

## Meetings
**Weekly meetings every Wednesday at 6pm PST.**  
- **For designers**: Drop in to see current tickets.  
- **For engineers**: You can also drop in but may need a walk-through of the code and some guidance from Ben.  
- **How to join**:  
  - Join the Discord and ping Ben to arrange a time to go through the code, what to learn, and what needs to be done.  

👉 [Join the Discord](https://discord.gg/mk7ytfUsX8)
