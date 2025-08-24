import React from 'react';

type Lead = {
  sno: number;
  name: string | null;
  designation: string | null;
  organisation: string | null;
  linkedin: string | null;
};

type LeadsTableProps = {
  leads: Lead[];
};

const LeadsTable: React.FC<LeadsTableProps> = ({ leads }) => {
  return (
    <div className="w-full">
      {/* Desktop & Tablet View */}
      <div className="hidden sm:block overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">S no.</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Name</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Designation</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Organisation</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">LinkedIn</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {leads.map((lead, idx) => (
              <tr
                key={lead.sno}
                className={`hover:bg-blue-50 transition-colors duration-150 ${
                  idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                }`}
              >
                <td className="px-4 py-3 text-sm text-gray-700">{lead.sno}</td>
                <td className="px-4 py-3 text-sm font-medium text-gray-900">
                  {lead.name?.trim() || 'N/A'}
                </td>
                <td className="px-4 py-3 text-sm text-gray-700">
                  {lead.designation?.trim() || 'N/A'}
                </td>
                <td className="px-4 py-3 text-sm text-gray-700">
                  {lead.organisation?.trim() || 'N/A'}
                </td>
                <td className="px-4 py-3 text-sm">
                  {lead.linkedin ? (
                    <a
                      href={
                        lead.linkedin.startsWith('http')
                          ? lead.linkedin
                          : `https://${lead.linkedin}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      View
                    </a>
                  ) : (
                    <span className="text-gray-400">N/A</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile View */}
      <div className="sm:hidden space-y-4">
        {leads.map((lead) => (
          <div
            key={lead.sno}
            className="bg-white rounded-xl shadow-md border border-gray-200 p-4 space-y-2"
          >
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">#{lead.sno}</span>
              {lead.linkedin && (
                <a
                  href={
                    lead.linkedin.startsWith('http')
                      ? lead.linkedin
                      : `https://${lead.linkedin}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 text-sm hover:underline"
                >
                  LinkedIn
                </a>
              )}
            </div>
            <h3 className="text-lg font-semibold text-gray-900">
              {lead.name?.trim() || 'N/A'}
            </h3>
            <p className="text-sm text-gray-600">
              {lead.designation?.trim() || 'N/A'}
            </p>
            <p className="text-sm text-gray-600">
              {lead.organisation?.trim() || 'N/A'}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LeadsTable;
