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

interface AnalysisMetrics {
  totalRows: number;
  columnsFound: string[];
  dateRange?: string;
  totalSumLabel?: string;
  totalSumValue?: string;
  extraStats: Array<{ label: string; value: string | number; icon: string }>;
  chartData: {
    title: string;
    items: Array<{ label: string; value: number; percentage: number; color: string }>;
  } | null;
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

  // Auto-analysis and Preview State
  const [rawRows, setRawRows] = useState<Record<string, unknown>[]>([]);
  const [previewRows, setPreviewRows] = useState<Record<string, unknown>[]>([]);
  const [metrics, setMetrics] = useState<AnalysisMetrics | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setMessage('');
      setError('');
      setRawRows([]);
      setPreviewRows([]);
      setMetrics(null);

      try {
        const rows = await parseSpreadsheet(selectedFile);
        setRawRows(rows);
        setPreviewRows(rows.slice(0, 5));
        runAutoAnalysis(spreadsheetType, rows);
      } catch (err: unknown) {
        setError(`Failed to parse file: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
  };

  const handleTypeChange = (newType: string) => {
    setSpreadsheetType(newType);
    setMessage('');
    setError('');
    if (rawRows.length > 0) {
      runAutoAnalysis(newType, rawRows);
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

  const runAutoAnalysis = (type: string, rows: Record<string, unknown>[]) => {
    if (rows.length === 0) return;

    const normalized = rows.map(r => normalizeKeys(r));
    const columns = Object.keys(rows[0]);
    const totalRows = rows.length;

    let dateRange = '';
    let totalSumLabel = '';
    let totalSumValue = '';
    const extraStats: AnalysisMetrics['extraStats'] = [];
    let chartData: AnalysisMetrics['chartData'] = null;

    if (type === 'attendance') {
      // Analyze Attendance
      const dates = normalized.map(r => formatExcelDate(r.date || r.attendancedate)).filter(Boolean);
      const minDate = dates.length > 0 ? dates.reduce((a, b) => a < b ? a : b) : '';
      const maxDate = dates.length > 0 ? dates.reduce((a, b) => a > b ? a : b) : '';
      dateRange = minDate && maxDate ? `${minDate} to ${maxDate}` : 'N/A';

      const statuses = normalized.map(r => String(r.status || '').toUpperCase().trim());
      const presentCount = statuses.filter(s => s === 'PRESENT' || s === '').length;
      const leaveCount = statuses.filter(s => s === 'LEAVE').length;
      const dayOffCount = statuses.filter(s => s === 'DAY_OFF').length;

      const presentRate = totalRows > 0 ? ((presentCount / totalRows) * 100).toFixed(1) : '0';

      totalSumLabel = 'Overall Present Rate';
      totalSumValue = `${presentRate}%`;

      extraStats.push(
        { label: 'Present Logged', value: presentCount, icon: '🟢' },
        { label: 'Leave Applied', value: leaveCount, icon: '🟡' },
        { label: 'Day Off Logged', value: dayOffCount, icon: '⚪' }
      );

      chartData = {
        title: 'Attendance Status Breakdown',
        items: [
          { label: 'Present', value: presentCount, percentage: Math.round((presentCount / totalRows) * 100), color: 'bg-emerald-500' },
          { label: 'Leave', value: leaveCount, percentage: Math.round((leaveCount / totalRows) * 100), color: 'bg-amber-500' },
          { label: 'Day Off', value: dayOffCount, percentage: Math.round((dayOffCount / totalRows) * 100), color: 'bg-slate-400' }
        ]
      };

    } else if (type === 'employees') {
      // Analyze Employees
      const categories = normalized.map(r => String(r.category || '').toUpperCase().trim());
      const cabling = categories.filter(c => c === 'CABLING').length;
      const survey = categories.filter(c => c === 'SURVEY').length;
      const splicing = categories.filter(c => c === 'SPLICING').length;
      const admin = categories.filter(c => c === 'ADMIN' || c === '').length;

      const activeEmployees = normalized.filter(r => String(r.status || '').toUpperCase() !== 'INACTIVE').length;

      totalSumLabel = 'Active Employees';
      totalSumValue = `${activeEmployees} of ${totalRows}`;

      extraStats.push(
        { label: 'Cabling Staff', value: cabling, icon: '📡' },
        { label: 'Survey Crew', value: survey, icon: '📐' },
        { label: 'Splicing Technicians', value: splicing, icon: '⚡' },
        { label: 'Admin Staff', value: admin, icon: '💼' }
      );

      chartData = {
        title: 'Staff Category Allocation',
        items: [
          { label: 'Cabling', value: cabling, percentage: Math.round((cabling / totalRows) * 100), color: 'bg-blue-500' },
          { label: 'Splicing', value: splicing, percentage: Math.round((splicing / totalRows) * 100), color: 'bg-indigo-500' },
          { label: 'Survey', value: survey, percentage: Math.round((survey / totalRows) * 100), color: 'bg-cyan-500' },
          { label: 'Admin/Other', value: admin, percentage: Math.round((admin / totalRows) * 100), color: 'bg-purple-500' }
        ]
      };

    } else if (type === 'fleet') {
      // Analyze Fleet logs
      const vehiclesList = normalized.map(r => String(r.vehicleno || r.vehiclenumber || '').toUpperCase().trim()).filter(Boolean);
      const uniqueVehicles = Array.from(new Set(vehiclesList));

      let totalKm = 0;
      const vehicleKmMap: Record<string, number> = {};

      normalized.forEach(r => {
        const vehicleNo = String(r.vehicleno || r.vehiclenumber || '').toUpperCase().trim();
        const onMeter = Number(r.onmeterreading || r.onmeter || r.startmeter || 0);
        const endMeter = Number(r.endmeterreading || r.endmeter || r.stopmeter || 0);
        let km = Number(r.totalkm || 0);
        if (!km || km <= 0) {
          km = Math.max(0, endMeter - onMeter);
        }
        totalKm += km;
        if (vehicleNo) {
          vehicleKmMap[vehicleNo] = (vehicleKmMap[vehicleNo] || 0) + km;
        }
      });

      totalSumLabel = 'Total Distance Covered';
      totalSumValue = `${totalKm.toLocaleString()} KM`;

      extraStats.push(
        { label: 'Vehicles Engaged', value: uniqueVehicles.length, icon: '🚚' },
        { label: 'Avg Distance/Log', value: `${totalRows > 0 ? Math.round(totalKm / totalRows) : 0} KM`, icon: '🛣️' }
      );

      const topVehicles = Object.entries(vehicleKmMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 4);

      chartData = {
        title: 'Top Vehicle Mileage Run',
        items: topVehicles.map(([vno, val]) => ({
          label: vno,
          value: val,
          percentage: totalKm > 0 ? Math.round((val / totalKm) * 100) : 0,
          color: 'bg-orange-500'
        }))
      };

    } else if (type === 'finance') {
      // Analyze Petty Cash Ledger
      let totalAmount = 0;
      const purposeMap: Record<string, number> = {};

      normalized.forEach(r => {
        const amt = Number(r.amount || 0);
        totalAmount += amt;
        let purpose = String(r.purpose || r.category || '').toUpperCase().trim();
        if (!['LOAN', 'FUEL', 'PROJECT_PURPOSE', 'UTILITY'].includes(purpose)) {
          purpose = 'PROJECT_PURPOSE';
        }
        purposeMap[purpose] = (purposeMap[purpose] || 0) + amt;
      });

      totalSumLabel = 'Total Ledger Volume';
      totalSumValue = `Rs. ${totalAmount.toLocaleString()}`;

      const uniqueProjects = Array.from(new Set(normalized.map(r => String(r.projectcode || r.project || '').toUpperCase().trim()).filter(Boolean)));

      extraStats.push(
        { label: 'Vouchers Processed', value: totalRows, icon: '🧾' },
        { label: 'Projects Funded', value: uniqueProjects.length, icon: '🏗️' }
      );

      chartData = {
        title: 'Expenditure Distribution',
        items: [
          { label: 'Project Cost', value: purposeMap['PROJECT_PURPOSE'] || 0, percentage: totalAmount > 0 ? Math.round(((purposeMap['PROJECT_PURPOSE'] || 0) / totalAmount) * 100) : 0, color: 'bg-emerald-600' },
          { label: 'Fuel advances', value: purposeMap['FUEL'] || 0, percentage: totalAmount > 0 ? Math.round(((purposeMap['FUEL'] || 0) / totalAmount) * 100) : 0, color: 'bg-amber-600' },
          { label: 'Utility charges', value: purposeMap['UTILITY'] || 0, percentage: totalAmount > 0 ? Math.round(((purposeMap['UTILITY'] || 0) / totalAmount) * 100) : 0, color: 'bg-blue-600' },
          { label: 'Staff Loans', value: purposeMap['LOAN'] || 0, percentage: totalAmount > 0 ? Math.round(((purposeMap['LOAN'] || 0) / totalAmount) * 100) : 0, color: 'bg-red-500' }
        ]
      };
    }

    setMetrics({
      totalRows,
      columnsFound: columns,
      dateRange,
      totalSumLabel,
      totalSumValue,
      extraStats,
      chartData
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
          setRawRows([]);
          setPreviewRows([]);
          setMetrics(null);
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
          setRawRows([]);
          setPreviewRows([]);
          setMetrics(null);
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
          setRawRows([]);
          setPreviewRows([]);
          setMetrics(null);
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
          setRawRows([]);
          setPreviewRows([]);
          setMetrics(null);
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
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 tracking-tight">Excel & CSV Migration Center</h1>
          <p className="text-gray-500 mt-1 text-sm">Upload, preview, validate, and auto-analyze operational spreadsheets directly into production database</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Upload & Options */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200/60">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Select Spreadsheet Type</h2>

            <select
              value={spreadsheetType}
              onChange={(e) => handleTypeChange(e.target.value)}
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none mb-6 font-semibold text-gray-700 transition-all cursor-pointer hover:bg-gray-100"
            >
              <option value="attendance">Staff Attendance Log (Module 2)</option>
              <option value="employees">Staff Employee Details (Module 1)</option>
              <option value="fleet">Daily Vehicle Running Chat (Module 6)</option>
              <option value="finance">Petty Cash Vouchers Ledger (Module 4)</option>
            </select>

            {message && <div className="mb-4 p-4 text-sm text-emerald-800 bg-emerald-50 border border-emerald-100 rounded-xl font-medium shadow-sm flex items-center gap-2"><span>✅</span> {message}</div>}
            {error && <div className="mb-4 p-4 text-sm text-rose-800 bg-rose-50 border border-rose-100 rounded-xl font-medium shadow-sm flex items-center gap-2"><span>⚠️</span> {error}</div>}

            <div className="border-2 border-dashed border-gray-200 rounded-2xl p-6 text-center hover:border-blue-500 transition-all bg-gray-50/50 hover:bg-white group cursor-pointer relative">
              <input
                type="file"
                accept=".csv, .xlsx, .xls"
                id="csv-file"
                onChange={handleFileChange}
                className="hidden"
              />
              <label htmlFor="csv-file" className="cursor-pointer block space-y-2">
                <span className="text-4xl block group-hover:scale-110 transition-transform">📊</span>
                <span className="block text-sm font-bold text-gray-700">
                  {file ? file.name : 'Click to browse or drop file here'}
                </span>
                <span className="block text-xs text-gray-400">Excel (.xlsx, .xls) & CSV (.csv) fully supported</span>
              </label>
            </div>

            <button
              onClick={handleUpload}
              disabled={uploading || !file}
              className={`w-full text-white p-4 rounded-xl font-bold text-sm shadow-md transition-all mt-6 flex items-center justify-center gap-2 ${uploading ? 'bg-gray-400 cursor-not-allowed' : !file ? 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none' : 'bg-blue-600 hover:bg-blue-700 active:scale-[0.99] hover:shadow-lg'}`}
            >
              {uploading ? 'Processing & Syncing Database...' : 'Start Bulk Import'}
            </button>
          </div>

          {/* Validation Panel */}
          {metrics && (
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200/60">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Integrity Validation</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs p-2 bg-gray-50 rounded-lg">
                  <span className="font-semibold text-gray-600">Total Rows Detected:</span>
                  <span className="font-bold text-gray-800">{metrics.totalRows}</span>
                </div>
                <div className="flex items-center justify-between text-xs p-2 bg-gray-50 rounded-lg">
                  <span className="font-semibold text-gray-600">File Type:</span>
                  <span className="font-bold text-blue-600 uppercase">{file?.name.split('.').pop()}</span>
                </div>
                <div className="flex items-center justify-between text-xs p-2 bg-emerald-50 text-emerald-800 rounded-lg">
                  <span className="font-semibold">Columns Matched:</span>
                  <span className="font-bold">{metrics.columnsFound.length} columns</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Columns: BI Auto-Analysis & Preview Dashboard */}
        <div className="lg:col-span-2 space-y-6">
          {metrics ? (
            <>
              {/* KPIs & Metrics Section */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50/50 p-5 rounded-2xl border border-blue-100 shadow-sm">
                  <p className="text-xs font-bold text-blue-600 uppercase tracking-wider">{metrics.totalSumLabel}</p>
                  <p className="text-2xl font-black text-slate-800 mt-2">{metrics.totalSumValue}</p>
                  {metrics.dateRange && <p className="text-[10px] text-slate-500 mt-1">Range: {metrics.dateRange}</p>}
                </div>

                {metrics.extraStats.map((stat, idx) => (
                  <div key={idx} className="bg-white p-5 rounded-2xl border border-gray-200/60 shadow-sm flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{stat.label}</p>
                      <p className="text-xl font-bold text-slate-800 mt-2">{stat.value}</p>
                    </div>
                    <span className="text-3xl">{stat.icon}</span>
                  </div>
                ))}
              </div>

              {/* Graphical BI Analytics Section */}
              {metrics.chartData && (
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200/60">
                  <h3 className="text-sm font-bold text-gray-800 tracking-tight mb-4 flex items-center gap-2">
                    <span>📈</span> {metrics.chartData.title}
                  </h3>
                  <div className="space-y-4">
                    {metrics.chartData.items.map((item, idx) => (
                      <div key={idx} className="space-y-1.5">
                        <div className="flex justify-between text-xs font-semibold">
                          <span className="text-gray-600">{item.label} ({item.value.toLocaleString()})</span>
                          <span className="text-gray-800">{item.percentage}%</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-1000 ${item.color}`}
                            style={{ width: `${item.percentage}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Data Preview Table */}
              {previewRows.length > 0 && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200/60 overflow-hidden">
                  <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Spreadsheet Data Preview (Top 5 Rows)</h3>
                    <span className="text-[10px] bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full font-bold">First 5 Records</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-gray-100/50 border-b border-gray-200">
                          {Object.keys(previewRows[0]).map((key) => (
                            <th key={key} className="p-3 font-semibold text-gray-600 tracking-wider">
                              {key}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {previewRows.map((row, idx) => (
                          <tr key={idx} className="hover:bg-gray-50 transition-colors">
                            {Object.values(row).map((val, colIdx) => (
                              <td key={colIdx} className="p-3 text-gray-700 font-medium truncate max-w-[150px]">
                                {String(val)}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="bg-white p-12 rounded-2xl border border-gray-200/60 shadow-sm flex flex-col items-center justify-center text-center space-y-4">
              <span className="text-6xl animate-bounce">📊</span>
              <h3 className="text-base font-bold text-gray-800">Auto-Analysis & BI Preview Dashboard</h3>
              <p className="text-gray-400 text-sm max-w-sm">Please select a spreadsheet file. Our real-time engine will automatically run analysis and render gorgeous visual charts of the dataset instantly.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
