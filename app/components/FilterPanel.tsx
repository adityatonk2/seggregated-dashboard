import React from 'react';

type FilterPanelProps = {
  organisations: string[];
  designations: string[];
  selectedOrganisation: string;
  selectedDesignation: string;
  onOrganisationChange: (organisation: string) => void;
  onDesignationChange: (designation: string) => void;
};

const FilterPanel: React.FC<FilterPanelProps> = ({
  organisations,
  designations,
  selectedOrganisation,
  selectedDesignation,
  onOrganisationChange,
  onDesignationChange,
}) => (
  <div className="mb-8 flex flex-col sm:flex-row sm:items-end sm:space-x-6 space-y-4 sm:space-y-0 bg-white p-4 rounded-xl shadow-sm border border-gray-200">
    {/* Organisation Filter */}
    <div className="flex-1">
      <label
        htmlFor="organisation"
        className="block text-sm font-semibold text-gray-700 mb-2"
      >
        Organisation
      </label>
      <div className="relative">
        <select
          id="organisation"
          value={selectedOrganisation}
          onChange={(e) => onOrganisationChange(e.target.value)}
          className="block w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-800 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 transition-all duration-200 hover:border-gray-400"
        >
          <option value="">All Organisations</option>
          {organisations.map((org) => (
            <option key={org} value={org}>
              {org}
            </option>
          ))}
        </select>
      </div>
    </div>

    {/* Designation Filter */}
    <div className="flex-1">
      <label
        htmlFor="designation"
        className="block text-sm font-semibold text-gray-700 mb-2"
      >
        Designation
      </label>
      <div className="relative">
        <select
          id="designation"
          value={selectedDesignation}
          onChange={(e) => onDesignationChange(e.target.value)}
          className="block w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-800 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 transition-all duration-200 hover:border-gray-400"
        >
          <option value="">All Designations</option>
          {designations.map((desig) => (
            <option key={desig} value={desig}>
              {desig}
            </option>
          ))}
        </select>
      </div>
    </div>
  </div>
);

export default FilterPanel;
