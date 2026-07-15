'use client';

import { useState } from 'react';
import * as XLSX from 'xlsx';

interface AttendanceGroup {
  date: string;
  projectCode: string;
  region: string;
  client?: string;
  records: Array<{
    employeeNo: string;
    teamLeaderName?: string;
    status: string;
  }>;
}

function formatExcelDate(value: unknown): string {
  if (value === null || value === undefined || value === '') return '';
  if (typeof value === 'number') {
    const d = new Date((value - 25569) * 86400 * 1000);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
  const strVal = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(strVal)) return strVal;
  const parsed = new Date(strVal);
  if (!isNaN(parsed.getTime())) {
    const y = parsed.getFullYear();
    const m = String(parsed.getMonth() + 1).padStart(2, '0');
    const day = String(parsed.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
  return '';
}

function normalizeKeys(row: Record<string, unknown>): Record<string, unknown> {
  const normalized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(row)) {
    const cleanKey = key.trim().toLowerCase().replace(/[\s_-]+/g, '');
    normalized[cleanKey] = typeof value === 'string' ? value.trim() : value;
  }
  return normalized;
}

export default function ExcelCSVUploader() {
  const [file, setFile] = useState<File | null>(null);
  const [spreadsheetType, setSpreadsheetType] = useState('attendance');
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

  const parseSpreadsheet = (file: File): Promise<Record<string, unknown>[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, { defval: '' });
          resolve(jsonData);
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file.'));
      reader.readAsArrayBuffer(file);
    });
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a valid CSV or Excel file first.');
      return;
    }

    setUploading(true);
    setMessage('');
    setError('');

    try {
      const rawRows = await parseSpreadsheet(file);
      if (rawRows.length === 0) {
        setError('The uploaded file is empty.');
        setUploading(false);
        return;
      }

      const normalizedRows = rawRows.map(row => normalizeKeys(row));

      if (spreadsheetType === 'attendance') {
        const groups: Record<string, AttendanceGroup> = {};

        for (const row of normalizedRows) {
          const rawDate = row.date || row.attendancedate || '';
          const date = formatExcelDate(rawDate);
          const projectCode = String(row.projectcode || row.project || '').toUpperCase();
          const region = String(row.region || '');
          const clientRaw = String(row.client || row.clientname || '').toUpperCase();
          const client = ['DIALOG', 'MOBITEL', 'SLT'].includes(clientRaw) ? clientRaw : undefined;

          const employeeNo = String(row.employeeno || row.employee || row.employeeuuid || '');
          const teamLeaderName = String(row.teamleadername || row.teamleader || '') || undefined;
          const statusRaw = String(row.status || '').toUpperCase();
          const status = ['PRESENT', 'LEAVE', 'DAY_OFF'].includes(statusRaw) ? statusRaw : 'PRESENT';

          if (!date || !projectCode || !region || !employeeNo) continue;

          const groupKey = `${date}_${projectCode}_${region}_${client || ''}`;
          if (!groups[groupKey]) {
            groups[groupKey] = {
              date,
              projectCode,
              region,
              client,
              records: []
            };
          }
          groups[groupKey].records.push({
            employeeNo,
            teamLeaderName,
            status
          });
        }

        const groupList = Object.values(groups);
        if (groupList.length === 0) {
          setError('No valid attendance records found in the sheet. Please make sure Date, Project Code, Region, and Employee columns are present.');
          setUploading(false);
          return;
        }

        let successCount = 0;
        let failCount = 0;
        let lastError = '';

        for (const group of groupList) {
          try {
            const response = await fetch('/api/attendance/bulk', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(group),
            });

            const resData = await response.json();
            if (response.ok) {
              successCount += group.records.length;
            } else {
              failCount += group.records.length;
              lastError = resData.error || resData.message || 'Server error';
            }
          } catch (e: unknown) {
            failCount += group.records.length;
            lastError = e instanceof Error ? e.message : String(e);
          }
        }

        if (successCount > 0) {
          let msg = `Success! Imported ${successCount} attendance records.`;
          if (failCount > 0) {
            msg += ` Failed to import ${failCount} records. Last Error: ${lastError}`;
          }
          setMessage(msg);
          setFile(null);
        } else {
          setError(`Upload Failed: ${lastError || 'All records failed verification.'}`);
        }
      } else if (spreadsheetType === 'employees') {
        const payload = normalizedRows.map(row => {
          let category = String(row.category || '').toUpperCase().trim();
          if (!['CABLING', 'SURVEY', 'SPLICING', 'ADMIN'].includes(category)) {
            category = 'ADMIN';
          }

          let pos = String(row.projectposition || row.position || '').toUpperCase().trim();
          if (pos === 'TECHNICIAN' || pos === 'TECH') pos = 'TECHNICIAN';
          else if (pos === 'TO') pos = 'TO';
          else if (pos === 'TEAMLEADER' || pos === 'TEAM_LEADER' || pos === 'TL') pos = 'TEAM_LEADER';
          else pos = 'TECHNICIAN';

          const idNo = String(row.idno || row.nic || row.idnumber || row.nationalid || '');
          if (!idNo) return null;

          return {
            empNo: row.empno || row.employeeno || row.employeeuuid || undefined,
            category,
            teamName: row.teamname || row.team || null,
            region: row.region || 'Default',
            nameWithInitials: row.namewithinitials || row.initialsname || row.name || '',
            fullName: row.fullname || row.full_name || '',
            projectPosition: pos,
            address: row.address || null,
            designation: row.designation || null,
            idNo,
            contactNo: row.contactno || row.phone || null,
            status: String(row.status || '').toUpperCase() === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE',
            projectCode: row.projectcode || row.project || null,
            appointmentDate: row.appointmentdate ? formatExcelDate(row.appointmentdate) : null,
            emergencyName: row.emergencyname || null,
            emergencyPhone: row.emergencyphone || null,
          };
        }).filter(Boolean);

        if (payload.length === 0) {
          setError('No valid employee records found. Ensure "idNo" or "nic" column is filled.');
          setUploading(false);
          return;
        }

        const response = await fetch('/api/employees/bulk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        const resData = await response.json();
        if (response.ok) {
          setMessage(`Success! Imported ${resData.count} employee records.`);
          setFile(null);
        } else {
          setError(`Upload Failed: ${resData.error || resData.message || 'Server error.'}`);
        }
      } else if (spreadsheetType === 'fleet') {
        const payload = normalizedRows.map(row => {
          const vehicleNo = String(row.vehicleno || row.vehiclenumber || '').toUpperCase();
          const date = formatExcelDate(row.date || row.logdate);
          if (!vehicleNo || !date) return null;

          return {
            date,
            vehicleNo,
            onMeterReading: Number(row.onmeterreading || row.onmeter || row.startmeter || 0),
            endMeterReading: Number(row.endmeterreading || row.endmeter || row.stopmeter || 0),
            totalKm: row.totalkm ? Number(row.totalkm) : null,
            reason: row.reason || row.remarks || null,
            fuelMeter: row.fuelmeter || row.fuel || null,
          };
        }).filter(Boolean);

        if (payload.length === 0) {
          setError('No valid fleet records found. Ensure "vehicleNo" and "date" columns are present.');
          setUploading(false);
          return;
        }

        const response = await fetch('/api/running-logs/bulk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        const resData = await response.json();
        if (response.ok) {
          setMessage(`Success! Imported ${resData.count} daily running logs.`);
          setFile(null);
        } else {
          setError(`Upload Failed: ${resData.error || resData.message || 'Server error.'}`);
        }
      } else if (spreadsheetType === 'finance') {
        const payload = normalizedRows.map(row => {
          const referenceNo = String(row.referenceno || row.refno || row.voucherno || row.voucher_no || '');
          const projectCode = String(row.projectcode || row.project || '').toUpperCase();
          const recipientEmpNo = String(row.recipientempno || row.recipient || row.employee || row.nic || '');
          if (!referenceNo || !projectCode || !recipientEmpNo) return null;

          let purpose = String(row.purpose || row.category || '').toUpperCase().trim();
          if (!['LOAN', 'FUEL', 'PROJECT_PURPOSE', 'UTILITY'].includes(purpose)) {
            purpose = 'PROJECT_PURPOSE';
          }

          return {
            referenceNo,
            requestedDate: formatExcelDate(row.requesteddate || row.date || new Date().toISOString().split('T')[0]),
            projectCode,
            purpose,
            amount: Number(row.amount || 0),
            recipientEmpNo,
            bankAccNo: row.bankaccno || row.bankaccount || null,
            bankBranch: row.bankbranch || row.branch || null,
            remarks: row.remarks || row.description || null,
            submittedAmount: row.submittedamount ? Number(row.submittedamount) : null,
            balance: row.balance ? Number(row.balance) : null,
            cashReturn: row.cashreturn ? Number(row.cashreturn) : null,
            cashReturnDate: row.cashreturndate ? formatExcelDate(row.cashreturndate) : null,
          };
        }).filter(Boolean);

        if (payload.length === 0) {
          setError('No valid petty cash advance records found. Ensure reference number, project code, and recipient columns are filled.');
          setUploading(false);
          return;
        }

        const response = await fetch('/api/finance/bulk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        const resData = await response.json();
        if (response.ok) {
          setMessage(`Success! Imported ${resData.count} petty cash advance records.`);
          setFile(null);
        } else {
          setError(`Upload Failed: ${resData.error || resData.message || 'Server error.'}`);
        }
      }
    } catch (err: unknown) {
      setError(`System Error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen font-sans">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Excel CSV Data Migration Center</h1>
        <p className="text-gray-500">Upload your Browns Engineering operational sheets directly into the production database</p>
      </div>

      <div className="max-w-xl bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
        <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-4">Select Spreadsheet Type</h2>

        <select
          value={spreadsheetType}
          onChange={(e) => {
            setSpreadsheetType(e.target.value);
            setMessage('');
            setError('');
          }}
          className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none mb-6 font-medium text-gray-700"
        >
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
            accept=".csv, .xlsx, .xls"
            id="csv-file"
            onChange={handleFileChange}
            className="hidden"
          />
          <label htmlFor="csv-file" className="cursor-pointer block space-y-2">
            <span className="text-3xl block">📊</span>
            <span className="block text-sm font-bold text-gray-700">
              {file ? file.name : 'Click to browse or drop your Excel or CSV file here'}
            </span>
            <span className="block text-xs text-gray-400">Standard Excel (.xlsx, .xls) and CSV (.csv) formats are fully supported</span>
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
