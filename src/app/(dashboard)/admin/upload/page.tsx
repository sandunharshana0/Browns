'use client';

import { useState } from 'react';

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.split('\n').filter((l) => l.trim().length > 0);
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map((h) => h.trim());
  return lines.slice(1).map((line) => {
    const values = line.split(',').map((v) => v.trim());
    const record: Record<string, string> = {};
    headers.forEach((h, i) => { record[h] = values[i] ?? ''; });
    return record;
  });
}

export default function ExcelCSVUploader() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setMessage('');
      setError('');
    }
  };

  const handleUpload = () => {
    if (!file) {
      setError('Please select a valid CSV file first.');
      return;
    }

    setUploading(true);
    setMessage('');
    setError('');

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const text = evt.target?.result as string;
        const data = parseCSV(text);
        const response = await fetch('/api/attendance/bulk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });

        const resData = await response.json();

        if (response.ok) {
          setMessage(`Success! Imported ${resData.count} records.`);
          setFile(null);
        } else {
          setError(`Upload Failed: ${resData.error || 'Server error.'}`);
        }
      } catch (err: any) {
        setError(`System Error: ${err.message}`);
      } finally {
        setUploading(false);
      }
    };
    reader.onerror = () => {
      setError('Failed to read file.');
      setUploading(false);
    };
    reader.readAsText(file);
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen font-sans">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Excel CSV Data Migration Center</h1>
        <p className="text-gray-500">Upload your Browns Engineering operational sheets directly into the production database</p>
      </div>

      <div className="max-w-xl bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
        <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-4">Select Spreadsheet Type</h2>

        <select className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none mb-6 font-medium text-gray-700">
          <option value="attendance">Staff Attendance Log (Module 2)</option>
          <option value="employees">Staff Employee Details (Module 1)</option>
          <option value="fleet">Daily Vehicle Running Chat (Module 6)</option>
          <option value="finance">Petty Cash Vouchers Ledger (Module 4)</option>
        </select>

        {message && <div className="mb-4 p-4 text-sm text-green-700 bg-green-50 border border-green-200 rounded-xl font-medium">{message}</div>}
        {error && <div className="mb-4 p-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl font-medium">{error}</div>}

        <div className="border-2 border-dashed border-gray-200 rounded-2xl p-6 text-center hover:border-blue-500 transition-all bg-gray-50/50">
          <input
            type="file"
            accept=".csv"
            id="csv-file"
            onChange={handleFileChange}
            className="hidden"
          />
          <label htmlFor="csv-file" className="cursor-pointer block space-y-2">
            <span className="text-3xl block">📊</span>
            <span className="block text-sm font-bold text-gray-700">
              {file ? file.name : 'Click to browse or drop your CSV file here'}
            </span>
            <span className="block text-xs text-gray-400">Only standard comma-separated .csv files are supported</span>
          </label>
        </div>

        <button
          onClick={handleUpload}
          disabled={uploading}
          className={`w-full text-white p-4 rounded-2xl font-bold text-sm shadow-md transition-all mt-6 ${uploading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 active:scale-[0.99]'}`}
        >
          {uploading ? 'Processing & Syncing Database...' : 'Start Bulk Import'}
        </button>
      </div>
    </div>
  );
}
