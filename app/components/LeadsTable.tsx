import React from "react";
import { Lead } from "../types/lead";

const SOURCE_BADGE: Record<string, string> = {
  client_export: "bg-indigo-50 text-indigo-700 border-indigo-100",
  card: "bg-amber-50 text-amber-700 border-amber-100",
  company_directory: "bg-emerald-50 text-emerald-700 border-emerald-100",
  excel_import: "bg-purple-50 text-purple-700 border-purple-100",
};

const SOURCE_LABEL: Record<string, string> = {
  client_export: "LinkedIn",
  card: "Card",
  company_directory: "Directory",
  excel_import: "Excel",
};

type SortField = "name" | "organisation" | "role" | "sector" | "connectedOn" | "createdAt";

type LeadsTableProps = {
  leads: Lead[];
  loading: boolean;
  sortField: SortField;
  sortOrder: "asc" | "desc";
  onSortChange: (field: SortField) => void;
};

const HEADERS: { field: SortField; label: string }[] = [
  { field: "name", label: "Name" },
  { field: "organisation", label: "Organisation" },
  { field: "role", label: "Role" },
  { field: "sector", label: "Sector" },
];

const LeadsTable: React.FC<LeadsTableProps> = ({ leads, loading, sortField, sortOrder, onSortChange }) => {
  const sortIndicator = (field: SortField) => {
    if (sortField !== field) return null;
    return sortOrder === "asc" ? " ▲" : " ▼";
  };

  if (loading) {
    return <div className="py-20 text-center text-gray-500">Loading leads...</div>;
  }

  return (
    <div className="overflow-x-auto border border-gray-200 rounded-xl shadow-sm bg-white">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {HEADERS.map((h) => (
              <th
                key={h.field}
                onClick={() => onSortChange(h.field)}
                className="px-4 py-3 text-left text-sm font-semibold text-gray-700 cursor-pointer select-none hover:bg-gray-100"
              >
                {h.label}
                {sortIndicator(h.field)}
              </th>
            ))}
            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Source</th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">LinkedIn</th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Email</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {leads.map((lead, idx) => (
            <tr key={lead._id} className={`hover:bg-blue-50 transition-colors ${idx % 2 ? "bg-gray-50" : "bg-white"}`}>
              <td className="px-4 py-3 text-sm font-medium text-gray-900">{lead.name}</td>
              <td className="px-4 py-3 text-sm text-gray-700">{lead.organisation}</td>
              <td className="px-4 py-3 text-sm text-gray-700">{lead.role || "—"}</td>
              <td className="px-4 py-3 text-sm text-gray-700">{lead.sector || "—"}</td>
              <td className="px-4 py-3 text-sm">
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-medium border ${
                    SOURCE_BADGE[lead.source] || "bg-gray-50 text-gray-700 border-gray-100"
                  }`}
                >
                  {SOURCE_LABEL[lead.source] || lead.source}
                </span>
              </td>
              <td className="px-4 py-3 text-sm">
                {lead.linkedin ? (
                  <a
                    href={lead.linkedin.startsWith("http") ? lead.linkedin : `https://${lead.linkedin}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    View
                  </a>
                ) : (
                  <span className="text-gray-400">—</span>
                )}
              </td>
              <td className="px-4 py-3 text-sm text-gray-700">{lead.email || "—"}</td>
            </tr>
          ))}

          {!leads.length && (
            <tr>
              <td colSpan={7} className="text-center py-10 text-gray-500">
                No leads found
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default LeadsTable;
export type { SortField };
