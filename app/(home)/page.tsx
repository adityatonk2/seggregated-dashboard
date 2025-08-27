"use client";

import React, { useState, useMemo } from "react";
import SearchBar from "../components/SearchBar";
import FilterPanel from "../components/FilterPanel";
import LeadsTable from "../components/LeadsTable";
import leadsData from "../LeadsData.json";

type Lead = {
  sno: number;
  name: string | null;
  designation: string | null;
  organisation: string | null;
  linkedin: string | null;
};

const DashboardPage = () => {
  const [selectedOrganisation, setSelectedOrganisation] = useState("");
  const [selectedDesignation, setSelectedDesignation] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const organisations = useMemo(() => {
    return Array.from(
      new Set(leadsData.map((lead: Lead) => lead.organisation?.trim()).filter((org): org is string => !!org))
    ).sort();
  }, []);

  const designations = useMemo(() => {
    return Array.from(
      new Set(leadsData.map((lead: Lead) => lead.designation?.trim()).filter((desig): desig is string => !!desig))
    ).sort();
  }, []);

  // Filter leads by organisation, designation, AND search query (case-insensitive, check name)
  const filteredLeads = useMemo(() => {
    return leadsData.filter((lead: Lead) => {
      const matchOrg = selectedOrganisation ? lead.organisation === selectedOrganisation : true;
      const matchDesig = selectedDesignation ? lead.designation === selectedDesignation : true;
      // Check if name contains the search query (case-insensitive)
      const matchSearch =
        searchQuery.trim() === "" ||
        (lead.name !== null && lead.name.toLowerCase().includes(searchQuery.toLowerCase().trim()));

      return matchOrg && matchDesig && matchSearch;
    });
  }, [selectedOrganisation, selectedDesignation, searchQuery]);

  return (
    <main className="container mx-auto px-3 sm:px-4 lg:px-8 py-6 sm:py-10 min-h-screen bg-gradient-to-b from-blue-50 via-white to-gray-50 overflow-x-hidden">
      <header className="mb-6 sm:mb-10 text-center">
        <h1 className="text-2xl sm:text-4xl font-extrabold text-blue-900 tracking-tight drop-shadow-sm">
          All Time Prospects Dashboard (2025)
        </h1>
        <p className="text-gray-600 mt-1 sm:mt-2 text-sm sm:text-base">Filter and explore your leads efficiently</p>
      </header>

      {/* Search Bar */}
      <div className="mb-6 sm:mb-8 max-w-md mx-auto sm:mx-0">
        <SearchBar searchQuery={searchQuery} onSearchChange={setSearchQuery} placeholder="Search leads by name..." />
      </div>

      <div className="mb-6 sm:mb-8">
        <FilterPanel
          organisations={organisations}
          designations={designations}
          selectedOrganisation={selectedOrganisation}
          selectedDesignation={selectedDesignation}
          onOrganisationChange={setSelectedOrganisation}
          onDesignationChange={setSelectedDesignation}
        />
      </div>

      <section
        aria-labelledby="leads-section"
        className="bg-white rounded-xl sm:rounded-2xl shadow-md sm:shadow-lg p-4 sm:p-6 mt-4 sm:mt-8 transition-all duration-300 hover:shadow-xl"
      >
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-3 sm:mb-4">
          <h2 id="leads-section" className="text-lg sm:text-xl font-semibold text-gray-800">
            {filteredLeads.length > 0 ? `Showing ${filteredLeads.length} Leads` : "No Leads Found"}
          </h2>
          {(selectedOrganisation || selectedDesignation || searchQuery) && (
            <button
              className="mt-2 sm:mt-0 text-xs sm:text-sm text-blue-600 hover:underline"
              onClick={() => {
                setSelectedOrganisation("");
                setSelectedDesignation("");
                setSearchQuery("");
              }}
            >
              Clear Filters
            </button>
          )}
        </div>

        <div className="overflow-x-auto max-w-full">
          {filteredLeads.length > 0 ? (
            <LeadsTable leads={filteredLeads} />
          ) : (
            <div className="text-center text-gray-500 py-6 sm:py-8 text-sm sm:text-base">
              <p>No matching leads. Try adjusting your filters or search.</p>
            </div>
          )}
        </div>
      </section>
    </main>
  );
};

export default DashboardPage;
