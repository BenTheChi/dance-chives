// components/cards.tsx (or cards/index.tsx)
import React from "react";

interface EventcardProps {
  events: string;
  organisation: string;
  imageUrl: string;
  date: string;
  city: string;
  statuss: string;
}

const Eventcard = ({ events, organisation, imageUrl, date, city, statuss }: EventcardProps) => {
  return (
    <div className="bg-white shadow-md rounded-md mt-4 mb-2 ml-0 mr-0 w-70 h-40 flex overflow-hidden">
      {/* Image */}
      <img
        src={imageUrl}
        alt="event"
        className="w-1/2 h-full object-cover"
      />

      {/* Text section with 3px border on top, right, bottom (no left) */}
      <div className="flex flex-col justify-center items-start p-3 w-1/2 border-t-[3px] border-r-[3px] border-b-[3px] border-gray-300">
        <p className="text-base font-semibold text-gray-800">{events}</p>
        <p className="text-xs text-gray-600">{organisation}</p>
        <p className="text-xs text-gray-600">{date}</p>
        <p className="text-xs text-gray-600">{city}</p>
        <div className="bg-green-200 shadow-md rounded-md px-2 py-0.5 text-[10px] font-medium mt-2">
          {statuss}
        </div>
      </div>
    </div>
  );
};

export default Eventcard;