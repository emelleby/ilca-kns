"use client";

import { useState } from "react";

export function PostFilter() {
  const [selectedFilter, setSelectedFilter] = useState("all");

  const filterOptions = [
    { value: "all", label: "All posts", emoji: "📝" },
    { value: "events", label: "Events", emoji: "📅" },
    { value: "news", label: "News", emoji: "📰" },
    { value: "training", label: "Training", emoji: "🏃" },
    { value: "social", label: "Social", emoji: "👥" }
  ];

  const selectedOption = filterOptions.find(option => option.value === selectedFilter);

  return (
    <div className="relative">
      <select
        value={selectedFilter}
        onChange={(e) => setSelectedFilter(e.target.value)}
        className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2.5 pr-10 text-sm font-medium text-gray-700 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors cursor-pointer"
      >
        {filterOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.emoji} {option.label}
          </option>
        ))}
      </select>
      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>
  );
}
