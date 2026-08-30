import React from "react";

type FacetCount = { _id: string; count: number };

type StatsResponse = {
  total: number;
  bySource: FacetCount[];
  bySector: FacetCount[];
};

const SOURCE_LABELS: Record<string, string> = {
  client_export: "LinkedIn Connections",
  card: "Business Cards",
  company_directory: "Company Directory",
  excel_import: "Excel Imports",
};

const StatCards: React.FC<{ stats: StatsResponse | null; loading: boolean }> = ({ stats, loading }) => {
  if (loading || !stats) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-24 rounded-xl border border-gray-200 bg-white animate-pulse" />
        ))}
      </div>
    );
  }

  const topSectors = stats.bySector.slice(0, 3);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <p className="text-sm text-gray-500">Total Leads</p>
        <p className="text-3xl font-bold text-gray-900 mt-1">{stats.total.toLocaleString()}</p>
      </div>

      {stats.bySource.slice(0, 3).map((s) => (
        <div key={s._id} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-gray-500">{SOURCE_LABELS[s._id] || s._id}</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{s.count.toLocaleString()}</p>
        </div>
      ))}

      {topSectors.length > 0 && (
        <div className="col-span-2 sm:col-span-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-gray-500 mb-2">Top Sectors</p>
          <div className="flex flex-wrap gap-2">
            {stats.bySector.map((s) => (
              <span
                key={s._id}
                className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-sm font-medium border border-blue-100"
              >
                {s._id} ({s.count})
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default StatCards;
export type { StatsResponse };
