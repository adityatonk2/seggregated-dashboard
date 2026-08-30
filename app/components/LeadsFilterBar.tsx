import React from "react";
import SearchBar from "./SearchBar";
import { LeadSource } from "../types/lead";

const SOURCE_OPTIONS: { value: LeadSource; label: string }[] = [
  { value: "client_export", label: "LinkedIn Connections" },
  { value: "card", label: "Business Cards" },
  { value: "company_directory", label: "Company Directory" },
  { value: "excel_import", label: "Excel Imports" },
];

export type LeadFilters = {
  search: string;
  sources: LeadSource[];
  sector: string;
  organisation: string;
  role: string;
};

type LeadsFilterBarProps = {
  filters: LeadFilters;
  sectors: string[];
  onChange: (filters: LeadFilters) => void;
};

const LeadsFilterBar: React.FC<LeadsFilterBarProps> = ({ filters, sectors, onChange }) => {
  const toggleSource = (source: LeadSource) => {
    const sources = filters.sources.includes(source)
      ? filters.sources.filter((s) => s !== source)
      : [...filters.sources, source];
    onChange({ ...filters, sources });
  };

  const hasActiveFilters =
    filters.search || filters.sources.length > 0 || filters.sector || filters.organisation || filters.role;

  return (
    <div className="mb-6 flex flex-col gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-200">
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1">
          <SearchBar
            searchQuery={filters.search}
            onSearchChange={(val) => onChange({ ...filters, search: val })}
            placeholder="Search name, organisation, role, sector..."
          />
        </div>

        <div className="flex-1">
          <select
            value={filters.sector}
            onChange={(e) => onChange({ ...filters, sector: e.target.value })}
            className="block w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-800 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Sectors</option>
            {sectors.map((sector) => (
              <option key={sector} value={sector}>
                {sector}
              </option>
            ))}
          </select>
        </div>

        <div className="flex-1">
          <input
            value={filters.organisation}
            onChange={(e) => onChange({ ...filters, organisation: e.target.value })}
            placeholder="Filter by organisation..."
            className="block w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-800 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex-1">
          <input
            value={filters.role}
            onChange={(e) => onChange({ ...filters, role: e.target.value })}
            placeholder="Filter by role/designation..."
            className="block w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-800 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {SOURCE_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => toggleSource(opt.value)}
            className={`px-3 py-1.5 rounded-full border text-sm font-medium transition ${
              filters.sources.includes(opt.value)
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-gray-100 hover:bg-gray-200 border-transparent text-gray-700"
            }`}
          >
            {opt.label}
          </button>
        ))}

        {hasActiveFilters && (
          <button
            onClick={() => onChange({ search: "", sources: [], sector: "", organisation: "", role: "" })}
            className="ml-auto px-3 py-1.5 rounded-full bg-red-50 text-red-600 text-sm font-medium hover:bg-red-100"
          >
            Clear filters
          </button>
        )}
      </div>
    </div>
  );
};

export default LeadsFilterBar;
