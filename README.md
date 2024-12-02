## Purpose of Dance Chives
The street/club dance community is an event-based subculture primarily revolving around competitions called battles. Thanks to the collaborative, grassroots efforts of the dance community thousands of these competitions occur worldwide annually with days worth of available footage. Most of these events are advertised, shared, and recorded on social media. However, Facebook, Instagram, and YouTube lack the organizational capabilities to compile dance events and their metadata in a user-friendly way. The culture is scattered across the internet, leaving many event organizers, dancers, and other creators unrecognized. This is where Dance Chives comes in.

Dance Chives is a single-page web app designed to collect, display, and track dance event data.

**Main Features:**

- Bracket View: Displaying an event’s videos in a bracketed format to watch all battles in one place.
- Tagging System: Connecting Styles and People (both site users and future users) to Events, Roles, Videos, other People, and more. This creates a rich ecosystem of useful data.
- Advanced Search: Using metadata from events to search with specific parameters (e.g., Events in a city on mm/dd/yy featuring X dance styles).
- Event Creation: For promotion and future footage archival.
- Event Images: To store promotional posters and art.
- User Profiles: Functioning as portfolios, showcasing Events participated in or danced at. User profiles also include contact sections.
- Series Pages: To group related events together.
- User Roles: For controlling who can create, edit, tag, and delete events.
- Dance Style History: Accompanied by videos and event suggestions.

**Future Aspirations:**

- Non-English language support
- Monetization through ads and promoted events
- Ongoing dance class information
- Ongoing practice session information
- Venue (studio) information
- Mapping feature with a timeline displaying enhanced geographical locations of events

*Please note that Dance Chives is still under development, so some features may be limited.*


## npm scripts
- `npm install` - install dependencies

## Build and dev scripts

- `dev` – start development server
- `build` – build production version of the app
- `preview` – locally preview production build

### Testing scripts

- `typecheck` – checks TypeScript types
- `lint` – runs ESLint
- `prettier:check` – checks files with Prettier
- `vitest` – runs vitest tests
- `vitest:watch` – starts vitest watch
- `test` – runs `vitest`, `prettier:check`, `lint` and `typecheck` scripts