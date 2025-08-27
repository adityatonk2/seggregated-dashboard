"use client";

import React, { useState, useMemo } from "react";
import SearchBar from "../components/SearchBar";
import rawCompaniesData from "../CompanyLeadsData.json";

// Raw shape of your JSON data (loose, since keys may vary in naming)
interface CompanyRaw {
  company: string;
  ceoName?: string | null;
  ceo_name?: string | null;
  ceoLinkedin?: string | null;
  ceo_linkedin?: string | null;
  cioName?: string | null;
  cio_name?: string | null;
  cioLinkedin?: string | null;
  cio_linkedin?: string | null;
  cfoName?: string | null;
  cfo_name?: string | null;
  cfoLinkedin?: string | null;
  cfo_linkedin?: string | null;
  ctoCdoName?: string | null;
  cto_cdo_name?: string | null;
  ctoCdoLinkedin?: string | null;
  cto_cdo_linkedin?: string | null;
  sector?: string | null;
}

// Normalized, strongly-typed company object
type Company = {
  company: string;
  ceoName: string | null;
  ceoLinkedin: string | null;
  cioName: string | null;
  cioLinkedin: string | null;
  cfoName: string | null;
  cfoLinkedin: string | null;
  ctoCdoName: string | null;
  ctoCdoLinkedin: string | null;
  sector: string; // always present
};

const CompaniesPage = () => {
  // Normalize raw data
  const companiesData: Company[] = useMemo(() => {
    return rawCompaniesData.map(
      (company: CompanyRaw): Company => ({
        company: company.company,
        ceoName: company.ceoName ?? company.ceo_name ?? null,
        ceoLinkedin: company.ceoLinkedin ?? company.ceo_linkedin ?? null,
        cioName: company.cioName ?? company.cio_name ?? null,
        cioLinkedin: company.cioLinkedin ?? company.cio_linkedin ?? null,
        cfoName: company.cfoName ?? company.cfo_name ?? null,
        cfoLinkedin: company.cfoLinkedin ?? company.cfo_linkedin ?? null,
        ctoCdoName: company.ctoCdoName ?? company.cto_cdo_name ?? null,
        ctoCdoLinkedin: company.ctoCdoLinkedin ?? company.cto_cdo_linkedin ?? null,
        sector: company.sector ?? "Unknown",
      })
    );
  }, []);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSector, setSelectedSector] = useState("");

  // Get unique sectors
  const sectors = useMemo(() => {
    return Array.from(
      new Set(companiesData.map((company) => company.sector.trim()).filter((sector): sector is string => !!sector))
    ).sort();
  }, [companiesData]);

  // Filtering
  const filteredCompanies = useMemo(() => {
    return companiesData.filter((company) => {
      const matchSector = selectedSector ? company.sector === selectedSector : true;
      const matchSearch =
        searchQuery.trim() === "" ||
        company.sector.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
        company.company.toLowerCase().includes(searchQuery.toLowerCase().trim());
      return matchSector && matchSearch;
    });
  }, [companiesData, selectedSector, searchQuery]);

  return (
    <main className="container mx-auto px-3 sm:px-4 lg:px-8 py-6 sm:py-10 min-h-screen bg-gradient-to-b from-blue-50 via-white to-gray-50 overflow-x-hidden">
      <header className="mb-6 sm:mb-10 text-center">
        <h1 className="text-2xl sm:text-4xl font-extrabold text-blue-900 tracking-tight drop-shadow-sm">
          Texas Companies & Decision Makers
        </h1>
        <p className="text-gray-600 mt-1 sm:mt-2 text-sm sm:text-base">Search and filter companies by type</p>
      </header>

      {/* Search Bar */}
      <div className="mb-6 sm:mb-8 max-w-md mx-auto sm:mx-0">
        <SearchBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          placeholder="Search by company or sector..."
        />
      </div>

      {/* Sector Filter Dropdown */}
      <div className="mb-6 sm:mb-8 max-w-md mx-auto sm:mx-0">
        <label htmlFor="sector" className="block text-sm font-semibold text-gray-700 mb-2">
          Company Type
        </label>
        <select
          id="sector"
          value={selectedSector}
          onChange={(e) => setSelectedSector(e.target.value)}
          className="block w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-800 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 transition-all duration-200 hover:border-gray-400"
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
      <section
        aria-labelledby="companies-section"
        className="bg-white rounded-xl sm:rounded-2xl shadow-md sm:shadow-lg p-4 sm:p-6 mt-4 sm:mt-8 transition-all duration-300 hover:shadow-xl"
      >
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-3 sm:mb-4">
          <h2 id="companies-section" className="text-lg sm:text-xl font-semibold text-gray-800">
            {filteredCompanies.length > 0 ? `Showing ${filteredCompanies.length} Companies` : "No Companies Found"}
          </h2>
          {(selectedSector || searchQuery) && (
            <button
              className="mt-2 sm:mt-0 text-xs sm:text-sm text-blue-600 hover:underline"
              onClick={() => {
                setSelectedSector("");
                setSearchQuery("");
              }}
            >
              Clear Filters
            </button>
          )}
        </div>

        <div className="overflow-x-auto max-w-full">
          {filteredCompanies.length > 0 ? (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Company</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Type</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">CEO</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">CIO</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">CFO</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">CTO/CDO</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredCompanies.map((company, idx) => (
                  <tr
                    key={company.company + idx}
                    className={`hover:bg-blue-50 transition-colors duration-150 ${
                      idx % 2 === 0 ? "bg-white" : "bg-gray-50"
                    }`}
                  >
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{company.company}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{company.sector}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {company.ceoName ? (
                        company.ceoLinkedin ? (
                          <a
                            href={
                              company.ceoLinkedin.startsWith("http")
                                ? company.ceoLinkedin
                                : `https://${company.ceoLinkedin}`
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            {company.ceoName}
                          </a>
                        ) : (
                          company.ceoName
                        )
                      ) : (
                        "N/A"
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {company.cioName ? (
                        company.cioLinkedin ? (
                          <a
                            href={
                              company.cioLinkedin.startsWith("http")
                                ? company.cioLinkedin
                                : `https://${company.cioLinkedin}`
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            {company.cioName}
                          </a>
                        ) : (
                          company.cioName
                        )
                      ) : (
                        "N/A"
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {company.cfoName ? (
                        company.cfoLinkedin ? (
                          <a
                            href={
                              company.cfoLinkedin.startsWith("http")
                                ? company.cfoLinkedin
                                : `https://${company.cfoLinkedin}`
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            {company.cfoName}
                          </a>
                        ) : (
                          company.cfoName
                        )
                      ) : (
                        "N/A"
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {company.ctoCdoName ? (
                        company.ctoCdoLinkedin ? (
                          <a
                            href={
                              company.ctoCdoLinkedin.startsWith("http")
                                ? company.ctoCdoLinkedin
                                : `https://${company.ctoCdoLinkedin}`
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            {company.ctoCdoName}
                          </a>
                        ) : (
                          company.ctoCdoName
                        )
                      ) : (
                        "N/A"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-center text-gray-500 py-6 sm:py-8 text-sm sm:text-base">
              <p>No matching companies. Try adjusting your filters or search.</p>
            </div>
          )}
        </div>
      </section>
    </main>
  );
};

export default CompaniesPage;
