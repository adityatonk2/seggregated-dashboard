"use client";

import React, { useEffect, useState, useRef, useMemo } from "react";
import Link from "next/link";
import { Client } from "../types/client";

const DashboardPage = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(200);
  const [totalPages, setTotalPages] = useState(1);

  const [sectorFilter, setSectorFilter] = useState("");
  const [searchText, setSearchText] = useState("");
  const [loading, setLoading] = useState(false);

  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // ======================
  // FETCH CLIENTS
  // ======================
  const fetchClients = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      });

      if (sectorFilter) {
        params.append("sector", sectorFilter);
      }

      const res = await fetch(`/api/clients?${params}`);
      const json = await res.json();

      setClients(json.data || []);
      setTotalPages(json.totalPages || 1);
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(fetchClients, 400);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [page, sectorFilter]);

  // ======================
  // CLIENT-SIDE SEARCH
  // ======================
  const filteredClients = useMemo(() => {
    const q = searchText.toLowerCase().trim();
    if (!q) return clients;

    return clients.filter((c) =>
      [c.Name, c.Organization, c.Designation, c.LinkedIn].filter(Boolean).some((v) => v!.toLowerCase().includes(q)),
    );
  }, [clients, searchText]);

  // ======================
  // PAGINATION CONTROLS
  // ======================
  const PaginationControls = () => (
    <div className="flex justify-between items-center gap-4 my-6">
      <button
        onClick={() => setPage((p) => Math.max(1, p - 1))}
        disabled={page === 1}
        className="px-4 py-2 rounded-lg border bg-gray-100 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        ⬅ Prev
      </button>

      <span className="text-sm font-medium text-gray-700">
        Page <span className="font-semibold">{page}</span> of <span className="font-semibold">{totalPages}</span>
      </span>

      <button
        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
        disabled={page === totalPages}
        className="px-4 py-2 rounded-lg border bg-gray-100 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Next ➡
      </button>
    </div>
  );

  // ======================
  // SECTORS
  // ======================
  const sectors = [
    "Energy",
    "Power",
    "Bank",
    "Finance",
    "Management",
    "Technology",
    "Healthcare",
    "Retail",
    "Education",
  ];

  return (
    <main className="p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-3xl font-bold">All Time Prospects Dashboard (2025)</h1>

        <div className="flex gap-3 flex-wrap">
          {/* Internal route */}
          <a
            href="/card-data"
            className="px-5 py-2.5 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition inline-flex items-center justify-center"
          >
            📇 View Physical Collected Data
          </a>

          {/* External Notion link */}
          <a
            href="https://www.notion.so/September-to-January-Leads-2ffa76a33b1080099858d670db41ca75"
            target="_blank"
            rel="noopener noreferrer"
            className="px-5 py-2.5 rounded-lg bg-gray-800 text-white font-semibold hover:bg-gray-900 transition inline-flex items-center justify-center"
          >
            📝 View Notion Leads
          </a>
        </div>
      </div>

      {/* SEARCH */}
      <div className="mb-6 flex gap-3">
        <input
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          placeholder="Search name, organisation, designation..."
          className="flex-1 px-4 py-2 border rounded-lg"
        />
        {searchText && (
          <button onClick={() => setSearchText("")} className="px-4 py-2 bg-red-100 text-red-600 rounded-lg">
            Clear
          </button>
        )}
      </div>

      {/* SECTOR FILTER */}
      <div className="flex flex-wrap gap-3 mb-6">
        {sectors.map((sector) => (
          <button
            key={sector}
            onClick={() => {
              setPage(1);
              setSectorFilter(sector === sectorFilter ? "" : sector);
            }}
            className={`px-4 py-2 rounded-full border text-sm font-medium ${
              sectorFilter === sector ? "bg-blue-600 text-white" : "bg-gray-100 hover:bg-gray-200"
            }`}
          >
            {sector}
          </button>
        ))}
      </div>

      <PaginationControls />

      {/* TABLE */}
      {loading ? (
        <div className="py-20 text-center">Loading...</div>
      ) : (
        <div className="overflow-x-auto border rounded-lg">
          <table className="min-w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="border px-4 py-2 text-left">Name</th>
                <th className="border px-4 py-2 text-left">Organization</th>
                <th className="border px-4 py-2 text-left">Designation</th>
                <th className="border px-4 py-2 text-left">LinkedIn</th>
              </tr>
            </thead>
            <tbody>
              {filteredClients.map((c, i) => (
                <tr key={c._id} className={i % 2 ? "bg-gray-50" : ""}>
                  <td className="border px-4 py-2">{c.Name}</td>
                  <td className="border px-4 py-2">{c.Organization}</td>
                  <td className="border px-4 py-2">{c.Designation}</td>
                  <td className="border px-4 py-2">
                    {c.LinkedIn ? (
                      <a
                        href={c.LinkedIn}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 underline"
                      >
                        View
                      </a>
                    ) : (
                      "—"
                    )}
                  </td>
                </tr>
              ))}

              {!filteredClients.length && (
                <tr>
                  <td colSpan={4} className="text-center py-6 text-gray-500">
                    No results found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <PaginationControls />
    </main>
  );
};

export default DashboardPage;
