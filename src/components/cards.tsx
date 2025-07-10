import Image from "next/image";
import React from "react";
import Link from "next/link";
import { EventCard } from "@/types/event";

const Eventcard = ({
  id,
  title,
  series,
  imageUrl,
  date,
  city,
  styles,
}: EventCard) => {
  return (
    <div className="bg-white shadow-md rounded-md mt-4 mb-2 ml-0 mr-0 w-70 h-40 flex overflow-hidden">
      {/* Image */}
      <Image
        src={imageUrl || "/exploreEvents.jpg"}
        alt="event"
        className="w-1/2 h-full object-cover"
        width={100}
        height={100}
      />

      {/* Text section with 3px border on top, right, bottom (no left) */}
      <div className="flex flex-col justify-center items-start p-3 w-1/2 border-t-[3px] border-r-[3px] border-b-[3px] border-gray-300">
        <Link href={`/event/${id}`}>
          <p className="text-base font-semibold text-gray-800">{title}</p>
        </Link>
        {series && <p className="text-xs text-gray-600">{series}</p>}
        <p className="text-xs text-gray-600">{date}</p>
        <p className="text-xs text-gray-600">{city}</p>

        {styles.map((style) => (
          <div
            className="bg-green-200 shadow-md rounded-md px-2 py-0.5 text-[10px] font-medium mt-2"
            key={style}
          >
            <span>{style}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Eventcard;
