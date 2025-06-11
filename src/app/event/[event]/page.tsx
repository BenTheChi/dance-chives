import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { getEvent } from "@/db/queries/event";
import { Event } from "@/types/event";
import {
  Calendar,
  Clock,
  DollarSign,
  FileText,
  Gift,
  MapPin,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

type PageProps = {
  params: Promise<{ event: string }>;
};

export default async function EventPage({ params }: PageProps) {
  const paramResult = params;
  const event = (await getEvent(paramResult.event)) as Event;

  return (
    <>
      <div className="flex flex-row gap-2">
        <Link href="/">{`< Search Events`}</Link>
        <Button asChild>
          <Link href={`/event/${event.id}/edit`}>Edit</Link>
        </Button>
        <Button onClick={() => deleteEvent()}>Delete</Button>
      </div>
      <section>
        <div className="flex flex-row gap-2">
          {event.eventDetails.poster ? (
            <Image
              src={event.eventDetails.poster.src}
              alt={event.eventDetails.poster.title}
              width={100}
              height={100}
            />
          ) : (
            <div className="w-100 h-100 bg-gray-300 text-center m-auto">
              No poster
            </div>
          )}
          <div className="flex flex-col gap-2">
            <h1>{event.eventDetails.title}</h1>
            <p>
              <Calendar /> <b>Date:</b> {event.eventDetails.startDate}
            </p>
            <p>
              <MapPin /> <b>Location:</b> {event.eventDetails.city.name},{" "}
              {event.eventDetails.city.country}
            </p>
            {event.eventDetails.address && (
              <p>
                <MapPin /> <b>Location:</b> {event.eventDetails.address}
              </p>
            )}
            {event.eventDetails.startTime && event.eventDetails.endTime && (
              <p>
                <Clock /> <b>Time:</b> {event.eventDetails.startTime} -{" "}
                {event.eventDetails.endTime}
              </p>
            )}
            {event.eventDetails.description && (
              <p>
                <FileText /> <b>Description:</b>{" "}
                {event.eventDetails.description}
              </p>
            )}
            {event.eventDetails.schedule && (
              <p>
                <Calendar /> <b>Schedule:</b> {event.eventDetails.schedule}
              </p>
            )}
            {event.eventDetails.prize && (
              <p>
                <Gift /> <b>Prize:</b> {event.eventDetails.prize}
              </p>
            )}
            {event.eventDetails.entryCost && (
              <p>
                <DollarSign /> <b>Entry Cost:</b> {event.eventDetails.entryCost}
              </p>
            )}
          </div>
        </div>
      </section>
      <section className="flex flex-row gap-2 flex-wrap">
        {event.roles.map((role) => (
          <div key={role.id} className="flex flex-col gap-2">
            <p>{role.title}</p>
            {role.user && (
              <Link href={`/user/${role.user.id}`}>
                <span>{role.user.displayName}</span>
              </Link>
            )}
          </div>
        ))}
      </section>
      <section>
        <h2>Sections</h2>
        {event.sections.map((section) => (
          <Button asChild key={section.id}>
            <Link href={`/event/${event.id}/section/${section.id}`}>
              {section.title}
            </Link>
          </Button>
        ))}
      </section>
      <section>
        <h2>Sub Events</h2>
        <Accordion type="single" collapsible>
          {event.subEvents.map((subEvent) => (
            <AccordionItem value={subEvent.id}>
              <AccordionTrigger>
                {subEvent.title} - {subEvent.startDate}
              </AccordionTrigger>
              <AccordionContent>
                {subEvent.poster && (
                  <Image
                    src={subEvent.poster.src}
                    alt={subEvent.poster.title}
                    width={100}
                    height={100}
                  />
                )}
                <p>
                  <Calendar /> <b>Date:</b> {subEvent.startDate}
                </p>
                {subEvent.startTime && subEvent.endTime && (
                  <p>
                    <Clock /> <b>Time:</b> {subEvent.startTime} -{" "}
                    {subEvent.endTime}
                  </p>
                )}
                {subEvent.address && (
                  <p>
                    <MapPin /> <b>Location:</b> {subEvent.address}
                  </p>
                )}
                {subEvent.description && (
                  <p>
                    <FileText /> <b>Description:</b> {subEvent.description}
                  </p>
                )}
                {subEvent.schedule && (
                  <p>
                    <Calendar /> <b>Schedule:</b> {subEvent.schedule}
                  </p>
                )}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>
    </>
  );
}
