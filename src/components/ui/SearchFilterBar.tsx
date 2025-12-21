"use client";
import { Search, Filter } from "lucide-react";
import { useState, useRef, useEffect, useMemo } from "react";

export default function SearchFilterBar() {
  const [activeTab, setActiveTab] = useState("events");
  const [underlineStyle, setUnderlineStyle] = useState({
    width: "0px",
    left: "0px",
  });

  const tabs = useMemo(
    () => [
      { id: "events", label: "Events" },
      { id: "series", label: "Series" },
      { id: "people", label: "People" },
    ],
    []
  );

  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    const currentTab =
      tabRefs.current[tabs.findIndex((tab) => tab.id === activeTab)];
    if (currentTab) {
      setUnderlineStyle({
        width: `${currentTab.offsetWidth}px`,
        left: `${currentTab.offsetLeft}px`,
      });
    }
  }, [activeTab, tabs]);

  return (
    <div className="w-full bg-fog-white shadow-sm px-4">
      <div className="w-full mx-auto">
        <div className="flex items-center justify-between h-20 px-6 border-b-2 border-gray-300 relative">
          {/* Search Bar - Left Side */}
          <div className="flex-1 min-w-0">
            <div className="relative max-w-2xl">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search events, people, or series..."
                className="w-50% pl-10 pr-4 py-2 rounded-sm border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Tabs and Filter */}
          <div className="flex items-center mr-48 ml-40 gap-6 relative">
            {/* Tabs */}
            <div className="relative flex gap-8">
              {tabs.map((tab, index) => (
                <button
                  key={tab.id}
                  ref={(el) => {
                    tabRefs.current[index] = el;
                  }}
                  onClick={() => setActiveTab(tab.id)}
                  className={`text-sm font-semibold pb-2 transition-colors ${
                    activeTab === tab.id ? "text-green-600" : "text-gray-600"
                  }`}
                >
                  {tab.label}
                </button>
              ))}

              {/* Green underline inside gray border */}
              <span
                className="absolute bottom-0 h-[2px] bg-green-500 transition-all duration-300"
                style={{
                  width: underlineStyle.width,
                  left: underlineStyle.left,
                }}
              />
            </div>

            {/* Filter Button */}
            <button className="p-2 rounded-sm hover:bg-gray-100 transition-colors flex items-center gap-1">
              <Filter className="h-5 w-5 text-gray-600" />
              <span className="text-sm font-medium hidden sm:inline">
                Filters
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
