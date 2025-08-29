"use client";

import React, { useEffect, useState, useRef } from "react";
import { Client } from "../types/client";

const DashboardPage = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(200);
  const [totalPages, setTotalPages] = useState(1);
  const [sectorFilter, setSectorFilter] = useState(""); // used for both button & search
  const [searchText, setSearchText] = useState(""); // 🔹 local state for search input
  const [loading, setLoading] = useState(false);

  // Debounce ref
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const fetchClients = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      });
      if (sectorFilter.trim()) {
        params.append("sector", sectorFilter.trim());
      }

      const res = await fetch(`/api/clients?${params}`);
      const json = await res.json();
      setClients(json.data);
      setTotalPages(json.totalPages);
    } catch (error) {
      console.error("Error fetching clients:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      fetchClients();
    }, 400); // debounce: 400ms

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [page, sectorFilter]);

  const PaginationControls = () => (
    <div className="flex justify-end items-center gap-6 my-4">
      <button
        disabled={page === 1}
        onClick={() => setPage((p) => p - 1)}
        className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400 border shadow-sm transition"
      >
        ⬅ Prev
      </button>

      <span className="text-sm font-medium text-gray-700">
        Page <span className="font-semibold">{page}</span> of <span className="font-semibold">{totalPages}</span>
      </span>

      <button
        disabled={page === totalPages}
        onClick={() => setPage((p) => p + 1)}
        className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400 border shadow-sm transition"
      >
        Next ➡
      </button>
    </div>
  );

  // Predefined Sectors
  const sectors = [
    "Energy",
    "Power",
    "Banks",
    "Finance",
    "Management",
    "Technology",
    "Healthcare",
    "Retail",
    "Education",
  ];

  return (
    <main className="p-6">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">All Time Prospects Dashboard (2025)</h1>

      {/* 🔹 Search Box */}
      <div className="mb-6 flex items-center gap-3">
        <input
          type="text"
          value={searchText}
          onChange={(e) => {
            setSearchText(e.target.value);
            setPage(1); // reset page
            setSectorFilter(e.target.value); // update filter
          }}
          placeholder="Search by Designation..."
          className="flex-1 px-4 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
        />
        {searchText && (
          <button
            onClick={() => {
              setSearchText("");
              setSectorFilter("");
            }}
            className="px-4 py-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 text-sm font-medium"
          >
            Clear
          </button>
        )}
      </div>

      {/* Sector Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        {sectors.map((sector) => (
          <button
            key={sector}
            onClick={() => {
              setPage(1); // reset to page 1
              setSectorFilter(sector === sectorFilter ? "" : sector); // toggle
              setSearchText(sector === sectorFilter ? "" : sector); // sync search box
            }}
            className={`px-4 py-2 rounded-full border shadow-sm text-sm font-medium transition ${
              sectorFilter === sector
                ? "bg-blue-600 text-white border-blue-700"
                : "bg-gray-100 hover:bg-gray-200 text-gray-700"
            }`}
          >
            {sector}
          </button>
        ))}
      </div>

      {/* Pagination Top */}
      <PaginationControls />

      {/* Loader */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="w-10 h-10 border-4 border-blue-500 border-dashed rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg shadow-lg border border-gray-200">
          <table className="min-w-full bg-white">
            <thead className="bg-gray-100 text-gray-700">
              <tr>
                <th className="border px-4 py-3 text-left">Name</th>
                <th className="border px-4 py-3 text-left">Organization</th>
                <th className="border px-4 py-3 text-left">Designation</th>
                <th className="border px-4 py-3 text-left">LinkedIn</th>
                <th className="border px-4 py-3 text-left">Email Address</th>
                <th className="border px-4 py-3 text-left">Connected On</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((client, i) => (
                <tr key={client._id} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                  <td className="border px-4 py-3">{client.Name}</td>
                  <td className="border px-4 py-3">{client.Organization}</td>
                  <td className="border px-4 py-3">{client.Designation}</td>
                  <td className="border px-4 py-3">
                    {client.LinkedIn ? (
                      <a
                        href={client.LinkedIn}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 underline"
                      >
                        View Profile
                      </a>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="border px-4 py-3">{client["Email Address"] ?? "—"}</td>
                  <td className="border px-4 py-3">{client["Connected On"] ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination Bottom */}
      <PaginationControls />
    </main>
  );
};

export default DashboardPage;
