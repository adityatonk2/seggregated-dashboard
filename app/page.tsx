"use client";

import React, { useEffect, useRef, useState } from "react";
import { Lead } from "./types/lead";
import StatCards, { StatsResponse } from "./components/StatCards";
import LeadsFilterBar, { LeadFilters } from "./components/LeadsFilterBar";
import LeadsTable, { SortField } from "./components/LeadsTable";
import ImportLeadsModal from "./components/ImportLeadsModal";

const EMPTY_FILTERS: LeadFilters = { search: "", sources: [], sector: "", organisation: "", role: "" };

const buildParams = (filters: LeadFilters) => {
  const params = new URLSearchParams();
  if (filters.search) params.append("search", filters.search);
  if (filters.sources.length) params.append("source", filters.sources.join(","));
  if (filters.sector) params.append("sector", filters.sector);
  if (filters.organisation) params.append("organisation", filters.organisation);
  if (filters.role) params.append("role", filters.role);
  return params;
};

const DashboardPage = () => {
  const [filters, setFilters] = useState<LeadFilters>(EMPTY_FILTERS);
  const [debouncedFilters, setDebouncedFilters] = useState<LeadFilters>(EMPTY_FILTERS);

  const [leads, setLeads] = useState<Lead[]>([]);
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [sectors, setSectors] = useState<string[]>([]);

  const [page, setPage] = useState(1);
  const [limit] = useState(50);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const [loading, setLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);

  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setPage(1);
      setDebouncedFilters(filters);
    }, 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [filters]);

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const params = buildParams(debouncedFilters);
      params.append("page", String(page));
      params.append("limit", String(limit));
      params.append("sort", sortField);
      params.append("order", sortOrder);

      const res = await fetch(`/api/leads?${params}`);
      const json = await res.json();

      if (!json.success) {
        console.error("Failed to fetch leads:", json.error);
        return;
      }

      setLeads(json.data || []);
      setTotalPages(json.totalPages || 1);
      setTotal(json.total || 0);
    } catch (err) {
      console.error("Failed to fetch leads:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    setStatsLoading(true);
    try {
      const params = buildParams(debouncedFilters);
      const res = await fetch(`/api/leads/stats?${params}`);
      const json = await res.json();

      if (!json.success) {
        console.error("Failed to fetch stats:", json.error);
        return;
      }

      setStats(json);
      if (!debouncedFilters.sector) {
        setSectors((json.bySector || []).map((s: { _id: string }) => s._id));
      }
    } catch (err) {
      console.error("Failed to fetch stats:", err);
    } finally {
      setStatsLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedFilters, page, sortField, sortOrder]);

  useEffect(() => {
    fetchStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedFilters]);

  const handleSortChange = (field: SortField) => {
    if (field === sortField) {
      setSortOrder((o) => (o === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const refreshAfterImport = () => {
    setShowImportModal(false);
    fetchLeads();
    fetchStats();
  };

  return (
    <main className="p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Sales Leads Dashboard</h1>
          <p className="text-sm sm:text-base text-gray-500 mt-1">
            {total.toLocaleString()} total leads matching current filters
          </p>
        </div>

        <button
          onClick={() => setShowImportModal(true)}
          className="px-5 py-2.5 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition inline-flex items-center justify-center w-full sm:w-auto"
        >
          📥 Import Leads
        </button>
      </div>

      <StatCards stats={stats} loading={statsLoading} />

      <LeadsFilterBar filters={filters} sectors={sectors} onChange={setFilters} />

      <LeadsTable
        leads={leads}
        loading={loading}
        sortField={sortField}
        sortOrder={sortOrder}
        onSortChange={handleSortChange}
      />

      <div className="flex flex-wrap justify-between items-center gap-3 my-6">
        <button
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1}
          className="px-3 py-2 sm:px-4 rounded-lg border bg-gray-100 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed text-sm sm:text-base"
        >
          ⬅ Prev
        </button>

        <span className="text-sm font-medium text-gray-700 order-last sm:order-none w-full sm:w-auto text-center">
          Page <span className="font-semibold">{page}</span> of <span className="font-semibold">{totalPages}</span>
        </span>

        <button
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          disabled={page === totalPages}
          className="px-3 py-2 sm:px-4 rounded-lg border bg-gray-100 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed text-sm sm:text-base"
        >
          Next ➡
        </button>
      </div>

      {showImportModal && (
        <ImportLeadsModal onClose={() => setShowImportModal(false)} onImported={refreshAfterImport} />
      )}
    </main>
  );
};

export default DashboardPage;
