// components/SearchFilterBar.tsx
import { Search, Filter } from 'lucide-react';

export default function SearchFilterBar() {
  return (
    <div className="flex items-center gap-4 p-4 bg-white rounded-lg shadow-sm border">
      {/* Search Input */}
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search..."
          className="w-full pl-10 pr-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        />
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        {['Events', 'People'].map((tab) => (
          <button
            key={tab}
            className={`px-4 py-2 text-sm font-medium ${
              tab === 'Events' 
                ? 'border-b-2 border-purple-500 text-purple-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Filter Button */}
      <button className="p-2 rounded-md hover:bg-gray-100">
        <Filter className="h-5 w-5 text-gray-600" />
      </button>
    </div>
  );
}