import React from 'react';
import { Input } from "@/components/ui/input";

const SearchFilterBar = () => {
  return (
    <div className="w-full p-4">
      <Input
        type="search"
        placeholder="Search events..."
        className="max-w-lg"
      />
    </div>
  );
};

export default SearchFilterBar; 