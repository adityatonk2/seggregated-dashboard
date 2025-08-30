"use client";

import React, { useState, useEffect } from "react";
import SearchBar from "../components/SearchBar";

type Company = {
  _id: string;
  company: string;
  ceoName?: string | null;
  ceoLinkedin?: string | null;
  cioName?: string | null;
  cioLinkedin?: string | null;
  cfoName?: string | null;
  cfoLinkedin?: string | null;
  ctoCdoName?: string | null;
  ctoCdoLinkedin?: string | null;
  sector: string;
};

const CompaniesPage = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSector, setSelectedSector] = useState("");
  const [loading, setLoading] = useState(false);

  // pagination
  const [page, setPage] = useState(1);
  const [limit] = useState(50); // show 50 results per page
  const [totalPages, setTotalPages] = useState(1);

  // Fetch companies from API
  useEffect(() => {
    const fetchCompanies = async () => {
      setLoading(true);

      const params = new URLSearchParams();
      params.append("page", page.toString());
      params.append("limit", limit.toString());
      if (searchQuery) params.append("search", searchQuery);
      if (selectedSector) params.append("sector", selectedSector);

      const res = await fetch(`/api/companies?${params.toString()}`);
      const data = await res.json();

      if (res.ok) {
        setCompanies(data.data);
        setTotalPages(data.totalPages);
      }

      setLoading(false);
    };

    fetchCompanies();
  }, [searchQuery, selectedSector, page, limit]);

  const sectors = Array.from(new Set(companies.map((c) => c.sector))).sort();

  return (
    <main className="container mx-auto px-4 py-8">
      <header className="mb-6 text-center">
        <h1 className="text-3xl font-bold text-blue-900">Texas Companies & Decision Makers</h1>
        <p className="text-gray-600 mt-2">Search and filter by company, decision-maker, or type</p>
      </header>

      {/* Search */}
      <div className="mb-4 max-w-md mx-auto">
        <SearchBar
          searchQuery={searchQuery}
          onSearchChange={(val) => {
            setPage(1); // reset to first page when searching
            setSearchQuery(val);
          }}
          placeholder="Search by company, name, or sector..."
        />
      </div>

      {/* Sector Dropdown */}
      <div className="mb-6 max-w-md mx-auto">
        <label htmlFor="sector" className="block text-sm font-semibold text-gray-700 mb-2">
          Company Type
        </label>
        <select
          id="sector"
          value={selectedSector}
          onChange={(e) => {
            setPage(1); // reset to first page when filtering
            setSelectedSector(e.target.value);
          }}
          className="block w-full rounded-lg border border-gray-300 bg-white px-4 py-2"
        >
          <option value="">All Types</option>
          {sectors.map((sector) => (
            <option key={sector} value={sector}>
              {sector}
            </option>
          ))}
        </select>
      </div>

      {/* Companies Table */}
      <section className="bg-white shadow rounded-lg p-4">
        {loading ? (
          <p className="text-center text-gray-500">Loading...</p>
        ) : companies.length > 0 ? (
          <>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-2 text-left text-sm font-semibold">Company</th>
                  <th className="px-4 py-2 text-left text-sm font-semibold">Sector</th>
                  <th className="px-4 py-2 text-left text-sm font-semibold">CEO</th>
                  <th className="px-4 py-2 text-left text-sm font-semibold">CIO</th>
                  <th className="px-4 py-2 text-left text-sm font-semibold">CFO</th>
                  <th className="px-4 py-2 text-left text-sm font-semibold">CTO/CDO</th>
                </tr>
              </thead>
              <tbody>
                {companies.map((company) => (
                  <tr key={company._id} className="hover:bg-gray-50">
                    <td className="px-4 py-2">{company.company}</td>
                    <td className="px-4 py-2">{company.sector}</td>
                    <td className="px-4 py-2">
                      <a href={company.ceoLinkedin || "#"} target="_blank">
                        {company.ceoName || "N/A"}
                      </a>
                    </td>
                    <td className="px-4 py-2">
                      <a href={company.cioLinkedin || "#"} target="_blank">
                        {company.cioName || "N/A"}
                      </a>
                    </td>
                    <td className="px-4 py-2">
                      <a href={company.cfoLinkedin || "#"} target="_blank">
                        {company.cfoName || "N/A"}
                      </a>
                    </td>
                    <td className="px-4 py-2">
                      <a href={company.ctoCdoLinkedin || "#"} target="_blank">
                        {company.ctoCdoName || "N/A"}
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            <div className="flex justify-center items-center gap-4 mt-4">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
                className="px-4 py-2 rounded bg-gray-200 disabled:opacity-50"
              >
                Previous
              </button>
              <span>
                Page {page} of {totalPages}
              </span>
              <button
                disabled={page === totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="px-4 py-2 rounded bg-gray-200 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </>
        ) : (
          <p className="text-center text-gray-500">No companies found.</p>
        )}
      </section>
    </main>
  );
};

export default CompaniesPage;
