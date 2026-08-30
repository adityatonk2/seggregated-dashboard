import React, { useState } from "react";

type ImportResult = {
  success: boolean;
  totalRows?: number;
  inserted?: number;
  updated?: number;
  skipped?: number;
  error?: string;
  detail?: string;
};

type ImportLeadsModalProps = {
  onClose: () => void;
  onImported: () => void;
};

const ImportLeadsModal: React.FC<ImportLeadsModalProps> = ({ onClose, onImported }) => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/leads/import", { method: "POST", body: formData });
      const json: ImportResult = await res.json();
      setResult(json);

      if (json.success) {
        onImported();
      }
    } catch {
      setResult({ success: false, error: "Upload failed. Please try again." });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-xl bg-white shadow-xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">Import Leads from Excel</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">
            &times;
          </button>
        </div>

        <p className="text-sm text-gray-600">
          Upload an .xlsx file with columns for{" "}
          <span className="font-medium">Name, Organisation, Profile/Designation, and LinkedIn</span>{" "}
          — column order and exact header wording don&apos;t matter, but Name and Organisation must be identifiable.
        </p>

        <input
          type="file"
          accept=".xlsx"
          onChange={(e) => {
            setFile(e.target.files?.[0] || null);
            setResult(null);
          }}
          className="block w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />

        {result && (
          <div
            className={`text-sm rounded-lg p-3 ${
              result.success ? "bg-green-50 text-green-800 border border-green-100" : "bg-red-50 text-red-700 border border-red-100"
            }`}
          >
            {result.success ? (
              <>
                Imported {result.totalRows} row(s): {result.inserted} inserted, {result.updated} updated
                {result.skipped ? `, ${result.skipped} skipped` : ""}.
              </>
            ) : (
              <>
                {result.error}
                {result.detail && <div className="mt-1 text-xs opacity-80 break-words">{result.detail}</div>}
              </>
            )}
          </div>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <button onClick={onClose} className="px-4 py-2 rounded-lg border bg-gray-100 hover:bg-gray-200 text-sm font-medium">
            Close
          </button>
          <button
            onClick={handleUpload}
            disabled={!file || uploading}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? "Uploading..." : "Upload"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImportLeadsModal;
