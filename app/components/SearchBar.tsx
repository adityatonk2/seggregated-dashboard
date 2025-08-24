import React from 'react';
import { Search } from 'lucide-react';

interface SearchBarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  placeholder?: string;
}

export default function SearchBar({
  searchQuery,
  onSearchChange,
  placeholder = 'Search leads...',
}: SearchBarProps) {
  return (
    <div className="relative w-full max-w-md mx-auto sm:mx-0">
      <input
        type="text"
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-3 text-sm sm:text-base text-gray-700 placeholder-gray-400 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 outline-none transition"
      />
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
    </div>
  );
}
