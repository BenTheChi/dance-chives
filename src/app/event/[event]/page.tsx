import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Event } from "@/types/event";
import {
  Building,
  Calendar,
  Clock,
  DollarSign,
  FileText,
  Gift,
  Locate,
  MapPin,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { AppNavbar } from "@/components/AppNavbar";

type PageProps = {
  params: Promise<{ event: string }>;
};

export default async function EventPage({ params }: PageProps) {
  const paramResult = params;
  // const event = (await getEvent(paramResult.event)) as Event;

  const event = {
    id: "battlezone-2025",
    createdAt: new Date("2024-01-15"),
    updatedAt: new Date("2024-03-20"),
    eventDetails: {
      creatorId: "07516846-276c-46fe-b452-d0d22bdb9d1d",
      title: "Battlezone 2025",
      city: {
        id: 128526,
        name: "Seattle",
        countryCode: "US",
        region: "Washington",
        population: 737015,
        timezone: "America__Los_Angeles",
      },
      startDate: "06/11/2025",
      description:
        "Battlezone is back for its fifteenth edition this year! We're bringing together the best breaking talent from across the Pacific Northwest for an unforgettable weekend of dance battles, workshops, and community building. This year's event features:\n\n• 1v1 Breaking Championship\n• 2v2 All-Styles Battle\n• Judge Showcases\n• Workshops with International Artists\n• Live DJ Battles\n• Community Cypher Sessions\n\nJoin us for three days of non-stop breaking action, where legends are made and new friendships are forged. Whether you're competing or spectating, Battlezone 2025 promises to be an experience you won't forget! \n Battlezone is back for its fifteenth edition this year! We're bringing together the best breaking talent from across the Pacific Northwest for an unforgettable weekend of dance battles, workshops, and community building. This year's event features:\n\n• 1v1 Breaking Championship\n• 2v2 All-Styles Battle\n• Judge Showcases\n• Workshops with International Artists\n• Live DJ Battles\n• Community Cypher Sessions\n\nJoin us for three days of non-stop breaking action, where legends are made and new friendships are forged. Whether you're competing or spectating, Battlezone 2025 promises to be an experience you won't forget!",
      schedule:
        "Day 1 (June 11):\n10:00 AM - Registration Opens\n11:00 AM - Workshop: Power Moves with B-Boy Storm\n1:00 PM - 1v1 Breaking Prelims\n4:00 PM - Judge Showcases\n6:00 PM - Opening Ceremony\n\nDay 2 (June 12):\n11:00 AM - Workshop: Top Rock Fundamentals\n1:00 PM - 2v2 All-Styles Prelims\n3:00 PM - 1v1 Breaking Top 16\n6:00 PM - DJ Battle\n\nDay 3 (June 13):\n12:00 PM - 1v1 Breaking Top 8\n2:00 PM - 2v2 All-Styles Finals\n4:00 PM - 1v1 Breaking Finals\n6:00 PM - Awards Ceremony",
      address:
        "Seattle Center Exhibition Hall\n305 Harrison St\nSeattle, WA 98109",
      startTime: "10:00",
      endTime: "22:00",
      prize: "5000",
      entryCost: "45",
      poster: {
        id: "5ef7e1b6-b290-47d3-895d-dc0942356b04",
        title: "battlezone-2025.jpg",
        url: "https://storage.googleapis.com/dance-chives-posters/5ef7e1b6-b290-47d3-895d-dc0942356b04-hades.jpg",
        // url: "https://storage.googleapis.com/dance-chives-posters/1790114d-00fb-424f-8cae-b4257eb3fb50-dancePalette.jpg",
        type: "poster",
        file: null,
      },
    },
    sections: [
      {
        id: "1",
        title: "Judge Showcases",
        description:
          "Watch our international panel of judges demonstrate their skills and share their unique styles with the community.",
        videos: [
          {
            id: "1",
            title: "B-Boy Storm Showcase",
            src: "https://example.com/video1",
            taggedUsers: [
              {
                id: "storm123",
                displayName: "B-Boy Storm",
                username: "bboystorm",
              },
            ],
          },
          {
            id: "2",
            title: "B-Girl Asia Showcase",
            src: "https://example.com/video2",
            taggedUsers: [
              {
                id: "asia456",
                displayName: "B-Girl Asia",
                username: "bgirlasia",
              },
            ],
          },
          {
            id: "3",
            title: "B-Boy Thesis Showcase",
            src: "https://example.com/video3",
            taggedUsers: [
              {
                id: "thesis789",
                displayName: "B-Boy Thesis",
                username: "bboythesis",
              },
            ],
          },
        ],
        brackets: [],
      },
      {
        id: "2",
        title: "1 vs 1 Breaking",
        description:
          "The main event of Battlezone 2025! 64 of the best breakers from across the Pacific Northwest will battle it out for the championship title and a $3000 prize pool. This is a Red Bull BC One qualifier event.",
        videos: [],
        brackets: [
          {
            id: "1",
            title: "Prelims",
            videos: [
              {
                id: "1",
                title: "Battle 1: Storm vs Thesis",
                src: "https://example.com/battle1",
                taggedUsers: [
                  {
                    id: "storm123",
                    displayName: "B-Boy Storm",
                    username: "bboystorm",
                  },
                  {
                    id: "thesis789",
                    displayName: "B-Boy Thesis",
                    username: "bboythesis",
                  },
                ],
              },
              {
                id: "2",
                title: "Battle 2: Asia vs Gravity",
                src: "https://example.com/battle2",
                taggedUsers: [
                  {
                    id: "asia456",
                    displayName: "B-Girl Asia",
                    username: "bgirlasia",
                  },
                  {
                    id: "gravity101",
                    displayName: "B-Boy Gravity",
                    username: "bboygravity",
                  },
                ],
              },
            ],
          },
          {
            id: "2",
            title: "Top 16",
            videos: [
              {
                id: "4",
                title: "Top 16: Storm vs Gravity",
                src: "https://example.com/top16-1",
                taggedUsers: [
                  {
                    id: "storm123",
                    displayName: "B-Boy Storm",
                    username: "bboystorm",
                  },
                  {
                    id: "gravity101",
                    displayName: "B-Boy Gravity",
                    username: "bboygravity",
                  },
                ],
              },
            ],
          },
          {
            id: "3",
            title: "Top 8",
            videos: [],
          },
          {
            id: "4",
            title: "Top 4",
            videos: [],
          },
          {
            id: "5",
            title: "Final",
            videos: [],
          },
        ],
      },
      {
        id: "3",
        title: "2v2 All Style",
        description:
          "Teams of two dancers will battle it out in this open style competition. Any dance style is welcome - breaking, popping, locking, house, or any fusion of styles. $2000 prize pool.",
        videos: [],
        brackets: [
          {
            id: "1",
            title: "Prelims",
            videos: [
              {
                id: "5",
                title: "Team Alpha vs Team Beta",
                src: "https://example.com/2v2-1",
                taggedUsers: [
                  {
                    id: "alpha1",
                    displayName: "Alpha 1",
                    username: "alpha1",
                  },
                  {
                    id: "alpha2",
                    displayName: "Alpha 2",
                    username: "alpha2",
                  },
                  {
                    id: "beta1",
                    displayName: "Beta 1",
                    username: "beta1",
                  },
                  {
                    id: "beta2",
                    displayName: "Beta 2",
                    username: "beta2",
                  },
                ],
              },
            ],
          },
          {
            id: "2",
            title: "Finals",
            videos: [],
          },
        ],
      },
    ],
    roles: [
      {
        id: "1",
        title: "Organizer",
        user: {
          id: "4bde11d0-f124-46c1-ae84-3c17ccea5e1d",
          displayName: "B-Boy Storm",
          username: "bboystorm",
        },
      },
      {
        id: "2",
        title: "Head Judge",
        user: {
          id: "684ba876-3363-4384-9e2e-b4161f48fa4a",
          displayName: "B-Boy Thesis",
          username: "bboythesis",
        },
      },
      {
        id: "3",
        title: "DJ",
        user: {
          id: "dj123",
          displayName: "DJ Kool Herc",
          username: "djkoolherc",
        },
      },
      {
        id: "4",
        title: "MC",
        user: {
          id: "mc456",
          displayName: "MC Flow",
          username: "mcflow",
        },
      },
    ],
    subEvents: [
      {
        id: "1",
        title: "Battlezone Workshop Series",
        description:
          "Join our international panel of judges for exclusive workshops covering power moves, footwork, top rock, and musicality. All levels welcome!",
        schedule:
          "Day 1: Power Moves with B-Boy Storm\nDay 2: Top Rock with B-Girl Asia\nDay 3: Musicality with B-Boy Thesis",
        startDate: "06/11/2025",
        address: "Seattle Center Exhibition Hall - Workshop Room A",
        startTime: "11:00",
        endTime: "13:00",
        poster: {
          id: "f1aa6f5d-97ba-4bd3-a3c0-e3ab490b9a5c",
          title: "hansolo.jpg",
          url: "https://storage.googleapis.com/dance-chives-posters/f1aa6f5d-97ba-4bd3-a3c0-e3ab490b9a5c-hansolo.jpg",
          type: "poster",
          file: null,
        },
      },
      {
        id: "2",
        title: "Battlezone DJ Battle",
        description:
          "Witness the best DJs in the breaking scene battle it out for the title of Battlezone DJ Champion. $1000 prize pool.",
        schedule: "Prelims: 6:00 PM\nFinals: 8:00 PM",
        startDate: "06/12/2025",
        address: "Seattle Center Exhibition Hall - Main Stage",
        startTime: "18:00",
        endTime: "22:00",
        poster: {
          id: "f1aa6f5d-97ba-4bd3-a3c0-e3ab490b9a5c",
          title: "hansolo.jpg",
          url: "https://storage.googleapis.com/dance-chives-posters/f1aa6f5d-97ba-4bd3-a3c0-e3ab490b9a5c-hansolo.jpg",
          type: "poster",
          file: null,
        },
      },
    ],
    gallery: [
      {
        id: "1790114d-00fb-424f-8cae-b4257eb3fb50",
        title: "dancePalette.jpg",
        url: "https://storage.googleapis.com/dance-chives-posters/1790114d-00fb-424f-8cae-b4257eb3fb50-dancePalette.jpg",
        type: "gallery",
        file: null,
      },
      {
        id: "9345a8af-6301-4274-accd-772785dbb009",
        title: "gym_selfie.jpg",
        url: "https://storage.googleapis.com/dance-chives-posters/9345a8af-6301-4274-accd-772785dbb009-gym_selfie.jpg",
        type: "gallery",
        file: null,
      },
      {
        id: "99b5ff2a-e69a-40f0-8c19-f3e4dda645ef",
        title: "learnathon.png",
        url: "https://storage.googleapis.com/dance-chives-posters/99b5ff2a-e69a-40f0-8c19-f3e4dda645ef-learnathon.png",
        type: "gallery",
        file: null,
      },
    ],
  } as Event;

  return (
    <>
      <AppNavbar />
      <div className="flex flex-col justify-center items-center gap-2 py-5 px-15">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 auto-rows-min w-full">
          <div className="flex flex-row justify-between items-center mb-2 w-full col-span-1 md:col-span-2 xl:col-span-4 auto-rows-min">
            <Link href="/" className="hover:underline">
              {`< Search Events`}
            </Link>
            <Button asChild>
              <Link href={`/event/${event.id}/edit`}>Edit</Link>
            </Button>
            {/* <Button onClick={() => console.log("delete")}>Delete</Button> */}
          </div>

          {event.eventDetails.poster ? (
            <Image
              src={event.eventDetails.poster.url}
              alt={event.eventDetails.poster.title}
              width={500}
              height={500}
              className="object-contain rounded-md w-full md:col-span-1 xl:col-span-1"
            />
          ) : (
            <div className="w-full h-[300px] md:h-[400px] bg-gray-300 text-center m-auto flex items-center justify-center md:col-span-1 xl:col-span-1">
              No poster
            </div>
          )}

          <div className="flex flex-col gap-4 md:col-span-1 xl:col-span-1">
            {/* Event Details */}
            <section className="bg-blue-100 p-4 rounded-md flex flex-col gap-2">
              <h1 className="text-2xl font-bold">{event.eventDetails.title}</h1>
              <div className="flex flex-row gap-2">
                <Calendar />
                <b>Date:</b>
                {event.eventDetails.startDate}
              </div>
              <div className="flex flex-row gap-2">
                <Building />
                <b>City:</b> {event.eventDetails.city.name}
                {event.eventDetails.city.countryCode &&
                  `, ${event.eventDetails.city.countryCode}`}
              </div>
              {event.eventDetails.address && (
                <div className="flex flex-row gap-2">
                  <div className="flex flex-row gap-2">
                    <MapPin />
                    <b>Location:</b>
                  </div>
                  <div className="whitespace-pre-wrap">
                    {event.eventDetails.address}
                  </div>
                </div>
              )}
              {event.eventDetails.startTime && event.eventDetails.endTime && (
                <div className="flex flex-row gap-2">
                  <Clock />
                  <b>Time:</b> {event.eventDetails.startTime} -{" "}
                  {event.eventDetails.endTime}
                </div>
              )}
              {event.eventDetails.prize && (
                <div className="flex flex-row gap-2">
                  <Gift />
                  <b>Prize:</b> {event.eventDetails.prize}
                </div>
              )}
              {event.eventDetails.entryCost && (
                <div className="flex flex-row gap-2">
                  <DollarSign />
                  <b>Entry Cost:</b> {event.eventDetails.entryCost}
                </div>
              )}
            </section>

            {/* Roles */}
            <section className="p-4 rounded-md bg-green-100 flex flex-col gap-2">
              {event.roles.map((role) => (
                <div key={role.id} className="flex flex-col gap-2">
                  {role.user && (
                    <div className="flex flex-row gap-1 items-center">
                      <span className="text-lg font-bold">{role.title}:</span>
                      <Link href={`/user/${role.user.id}`}>
                        <span className="text-blue-500 hover:text-blue-700 hover:underline">
                          {role.user.displayName}
                        </span>
                      </Link>
                    </div>
                  )}
                </div>
              ))}
            </section>
          </div>

          {/* Description */}
          {event.eventDetails.description && (
            <section className="flex flex-col gap-2 p-4 bg-red-100 rounded-md md:col-span-1 xl:col-span-1">
              <div className="flex flex-row justify-center items-center gap-2 font-bold text-2xl">
                <FileText />
                Description:
              </div>
              <div className="whitespace-pre-wrap max-w-[500px]">
                {event.eventDetails.description}
              </div>
            </section>
          )}

          {/* Schedule */}
          {event.eventDetails.schedule && (
            <section className="flex flex-col gap-2 bg-purple-100 rounded-md p-4 md:col-span-1 xl:col-span-1">
              <div className="flex flex-row justify-center items-center gap-2 font-bold text-2xl">
                <Calendar />
                Schedule:
              </div>
              <div className="whitespace-pre-wrap">
                {event.eventDetails.schedule}
              </div>
            </section>
          )}

          {/* Sections */}
          <section className="flex flex-col gap-2 bg-green-300 rounded-md p-4 w-full md:col-span-1 xl:col-span-2 shadow-md hover:bg-green-200 hover:cursor-pointer hover:shadow-none">
            <Link href={`/event/${event.id}/sections`} className="w-full">
              <div className="w-full">
                <h2 className="text-2xl font-bold mb-4 text-center">
                  Sections
                </h2>

                <div className="flex flex-col gap-4">
                  {event.sections.map((section) => (
                    <div
                      key={section.id}
                      className="bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="text-xl font-semibold text-gray-800">
                          {section.title}
                        </h3>
                        <span className="text-sm text-gray-500">
                          {section.videos.length}{" "}
                          {section.videos.length === 1 ? "video" : "videos"}
                        </span>
                      </div>

                      {section.brackets.length > 0 ? (
                        <div className="space-y-2">
                          <div className="text-sm text-gray-600 mb-2">
                            Brackets:
                          </div>
                          {section.brackets.map((bracket) => (
                            <div
                              key={bracket.id}
                              className="bg-gray-50 rounded p-2 flex justify-between items-center"
                            >
                              <span className="font-medium text-gray-700">
                                {bracket.title}
                              </span>
                              <span className="text-sm text-gray-500">
                                {bracket.videos.length}{" "}
                                {bracket.videos.length === 1
                                  ? "video"
                                  : "videos"}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-sm text-gray-600 italic">
                          No brackets - direct video collection
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </Link>
          </section>

          {/* Sub Events */}
          <section className="w-full bg-yellow-100 rounded-md p-4 md:col-span-1 xl:col-span-2">
            <h2 className="text-2xl font-bold mb-2 text-center">Sub Events</h2>
            <Accordion type="single" collapsible>
              {event.subEvents.map((subEvent) => (
                <AccordionItem
                  value={subEvent.id}
                  key={subEvent.id}
                  className="border-x-2 border-t-2 border-gray-300 rounded-md my-2 first:rounded-t-md last:rounded-b-md last:border-2 w-full bg-violet-100"
                >
                  <AccordionTrigger className="px-5 cursor-pointer hover:no-underline">
                    <div className="flex flex-row gap-2 items-center">
                      <span className="text-lg font-bold">
                        {subEvent.title}
                      </span>
                      <span>- {subEvent.startDate}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="p-4 flex flex-row gap-2">
                    <div className="flex flex-col gap-2">
                      {subEvent.poster && (
                        <Image
                          src={subEvent.poster.url}
                          alt={subEvent.poster.title}
                          width={500}
                          height={500}
                          className="object-contain rounded-md w-full max-w-[500px] h-auto"
                        />
                      )}

                      <div className="flex flex-col gap-2 bg-orange-100 rounded-md p-4">
                        <div className="flex flex-row gap-2">
                          <Calendar /> <b>Date:</b> {subEvent.startDate}
                        </div>
                        {subEvent.startTime && subEvent.endTime && (
                          <div className="flex flex-row gap-2">
                            <Clock /> <b>Time:</b> {subEvent.startTime} -{" "}
                            {subEvent.endTime}
                          </div>
                        )}
                        {subEvent.address && (
                          <div className="flex flex-row gap-2">
                            <MapPin /> <b>Location:</b> {subEvent.address}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-row gap-2">
                      {subEvent.description && (
                        <div className="flex flex-col gap-2 bg-red-100 rounded-md p-4">
                          <div className="flex flex-row justify-center items-center gap-2 font-bold text-2xl">
                            <FileText />
                            Description:
                          </div>
                          <div className="whitespace-pre-wrap max-w-[500px]">
                            {subEvent.description}
                          </div>
                        </div>
                      )}
                      {subEvent.schedule && (
                        <div className="flex flex-col gap-2 bg-blue-100 rounded-md p-4">
                          <div className="flex flex-row justify-center items-center gap-2 font-bold text-2xl">
                            <Calendar />
                            Schedule:
                          </div>
                          <div className="whitespace-pre-wrap max-w-[500px]">
                            {subEvent.schedule}
                          </div>
                        </div>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </section>

          {/* Photo Gallery */}
          <section className="flex flex-col bg-red-100 rounded-md p-4 w-full md:col-span-2 xl:col-span-4">
            <h2 className="text-2xl font-bold mb-2 text-center">
              Photo Gallery
            </h2>
            <div className="flex flex-row gap-5 flex-wrap justify-center">
              {event.gallery.map((image) => (
                <Image
                  key={image.id}
                  src={image.url}
                  alt={image.title}
                  width={100}
                  height={100}
                  className="object-contain w-full max-w-[200px] h-auto"
                />
              ))}
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
