"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { CardProspect } from "../types/cardProspect";
import SearchBar from "../components/SearchBar";

export default function CardDataPage() {
  const [data, setData] = useState<CardProspect[]>([]);
  const [searchText, setSearchText] = useState("");
  const [loading, setLoading] = useState(false);

  // ======================
  // FETCH CARD DATA
  // ======================
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/card-prospects");
        const json = await res.json();
        setData(json.data || []);
      } catch (err) {
        console.error("Failed to fetch card data", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // ======================
  // SEARCH FILTER
  // ======================
  const filteredData = useMemo(() => {
    const q = searchText.toLowerCase().trim();
    if (!q) return data;

    return data.filter((d) =>
      [d.name, d.organisation, d.designation, d.linkedin].filter(Boolean).some((v) => v!.toLowerCase().includes(q)),
    );
  }, [data, searchText]);

  return (
    <main className="p-6 space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Physical Collected Data</h1>
          <p className="text-gray-600 mt-1">
            Total Records: <span className="font-semibold">{filteredData.length}</span>
          </p>
        </div>

        <Link
          href="/"
          className="inline-flex items-center justify-center px-4 py-2 rounded-lg border bg-gray-100 hover:bg-gray-200 text-sm font-medium"
        >
          ← Back to Dashboard
        </Link>
      </div>

      {/* SEARCH */}
      <SearchBar
        searchQuery={searchText}
        onSearchChange={setSearchText}
        placeholder="Search name, organisation, designation..."
      />

      {/* TABLE */}
      {loading ? (
        <div className="py-20 text-center text-gray-600">Loading data...</div>
      ) : (
        <div className="overflow-x-auto border rounded-lg shadow-sm">
          <table className="min-w-full bg-white">
            <thead className="bg-gray-100 text-gray-700">
              <tr>
                <th className="border px-4 py-2 text-left">S No</th>
                <th className="border px-4 py-2 text-left">Name</th>
                <th className="border px-4 py-2 text-left">Designation</th>
                <th className="border px-4 py-2 text-left">Organisation</th>
                <th className="border px-4 py-2 text-left">LinkedIn</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((d, i) => (
                <tr key={d.sno} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                  <td className="border px-4 py-2">{d.sno}</td>
                  <td className="border px-4 py-2 font-medium text-gray-900">{d.name}</td>
                  <td className="border px-4 py-2">{d.designation}</td>
                  <td className="border px-4 py-2">{d.organisation}</td>
                  <td className="border px-4 py-2">
                    {d.linkedin ? (
                      <a
                        href={d.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        View Profile
                      </a>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                </tr>
              ))}

              {!filteredData.length && (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-gray-500">
                    No results found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
