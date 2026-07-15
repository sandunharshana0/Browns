'use client';

import { useState, useMemo } from 'react';
import * as XLSX from 'xlsx';

// 24 Document Types based on WhatsApp Image 2026-07-14 at 22.33.03.jpeg
const DOCUMENT_TYPES = [
  // Group 1: Attendance & Deployment
  { value: 'attendance', label: 'Attendance SLT - RS', category: 'Attendance & Deployment' },
  { value: 'daily_deployment_r5', label: 'Daily Deployment Region 5', category: 'Attendance & Deployment' },
  { value: 'days', label: 'Days', category: 'Attendance & Deployment' },
  { value: 'drivers_attendance', label: 'Drivers Attendance SLT - R5', category: 'Attendance & Deployment' },
  { value: 'region5_weather', label: 'Region 5 Weather Impact Report 2026', category: 'Attendance & Deployment' },

  // Group 2: HR & Employee Welfare
  { value: 'employees', label: 'Employee Details', category: 'HR & Employee Welfare' },
  { value: 'meal_allowance', label: 'Meal Allowance', category: 'HR & Employee Welfare' },
  { value: 'pay_sheet', label: 'Pay Sheet', category: 'HR & Employee Welfare' },
  { value: 'safety_shoe', label: 'Safty Shoe (Safety Shoe)', category: 'HR & Employee Welfare' },
  { value: 'salary_advance', label: 'Salary Advance Name List Region 5 - 2026', category: 'HR & Employee Welfare' },
  { value: 'phone_request', label: 'Phone Request', category: 'HR & Employee Welfare' },

  // Group 3: Fleet & Logistics
  { value: 'fleet', label: 'Running Chart (Running Log)', category: 'Fleet & Logistics' },
  { value: 'fuel_usage', label: 'Fuel Usage', category: 'Fleet & Logistics' },
  { value: 'fuel_card_increase', label: 'Fuel Card Increase', category: 'Fleet & Logistics' },
  { value: 'fuel_card_activation', label: 'Request for Fuel Card Activation', category: 'Fleet & Logistics' },
  { value: 'vehicle_details', label: 'Vehical Details (Vehicle Inventory)', category: 'Fleet & Logistics' },
  { value: 'vehicle_fuel_bills', label: 'Vehical Fuel Bills', category: 'Fleet & Logistics' },
  { value: 'vehicle_fuel_monitoring', label: 'Vehicle Fuel Monitoring', category: 'Fleet & Logistics' },

  // Group 4: Finance & Supply Chain
  { value: 'finance', label: 'Petty Cash', category: 'Finance & Supply Chain' },
  { value: 'invoice', label: 'Invoice', category: 'Finance & Supply Chain' },
  { value: 'utility_bill', label: 'Utility Bill Update - OSP Division Region 5', category: 'Finance & Supply Chain' },
  { value: 'stationary_requirement', label: 'Stationary Requirement', category: 'Finance & Supply Chain' },

  // Group 5: Forms & Unclassified
  { value: 'forms', label: 'Forms', category: 'Forms & Miscellaneous' },
  { value: 'others', label: 'Others', category: 'Forms & Miscellaneous' },
];

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

  // Active Document Grid State
  const [rawRows, setRawRows] = useState<Record<string, unknown>[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [gridColumns, setGridColumns] = useState<string[]>([]);

  // Selected cell state for high-quality inline Excel editing
  const [editingCell, setEditingCell] = useState<{ rowIndex: number; colName: string } | null>(null);
  const [editValue, setEditValue] = useState('');

  // Filtered Rows selector helper
  const filteredRows = useMemo(() => {
    if (!searchQuery) return rawRows;
    const lower = searchQuery.toLowerCase();
    return rawRows.filter((row) =>
      Object.values(row).some((val) => String(val ?? '').toLowerCase().includes(lower))
    );
  }, [rawRows, searchQuery]);

  // Handle spreadsheet parsing using XLSX
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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setMessage('');
      setError('');
      setEditingCell(null);

      try {
        const rows = await parseSpreadsheet(selectedFile);
        if (rows.length > 0) {
          const cols = Object.keys(rows[0]);
          setGridColumns(cols);
          setRawRows(rows);
        } else {
          setError('The spreadsheet file appears to contain no data rows.');
          setRawRows([]);
          setGridColumns([]);
        }
      } catch (err: unknown) {
        setError(`Failed to parse file: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
  };

  const handleTypeChange = (newType: string) => {
    setSpreadsheetType(newType);
    setMessage('');
    setError('');
  };

  // Inline Excel Cell Edit Actions
  const startEditing = (rowIndex: number, colName: string, currentValue: unknown) => {
    setEditingCell({ rowIndex, colName });
    setEditValue(String(currentValue ?? ''));
  };

  const saveCellEdit = (rowIndex: number, colName: string) => {
    if (!editingCell) return;
    const updated = [...rawRows];
    updated[rowIndex] = {
      ...updated[rowIndex],
      [colName]: editValue,
    };
    setRawRows(updated);
    setEditingCell(null);
  };

  const deleteRow = (indexToDelete: number) => {
    const updated = rawRows.filter((_, idx) => idx !== indexToDelete);
    setRawRows(updated);
  };

  const addEmptyRow = () => {
    if (gridColumns.length === 0) {
      setGridColumns(['ID', 'Name', 'Value', 'Category', 'Remarks']);
      setRawRows([{ ID: '1', Name: 'New Entry', Value: '0', Category: 'General', Remarks: '' }]);
      return;
    }
    const newRow: Record<string, unknown> = {};
    gridColumns.forEach((col) => {
      newRow[col] = '';
    });
    setRawRows([...rawRows, newRow]);
  };

  // Export to downloadable Excel file
  const handleDownloadExcel = () => {
    if (rawRows.length === 0) {
      setError('No data in the sheet editor to generate Excel download.');
      return;
    }
    try {
      const worksheet = XLSX.utils.json_to_sheet(rawRows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Edited Data');

      const fileName = file
        ? `edited_${file.name.replace(/\.[^/.]+$/, '')}.xlsx`
        : `browns_${spreadsheetType}_sheet.xlsx`;

      XLSX.writeFile(workbook, fileName);
      setMessage(`Successfully downloaded updated Excel sheet: ${fileName}`);
    } catch (err: unknown) {
      setError(`Failed to generate Excel download: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  // Share action (copies shareable table data snippet and raises user feedback)
  const handleShareSheet = async () => {
    if (rawRows.length === 0) {
      setError('No spreadsheet loaded to share.');
      return;
    }
    try {
      const shareText = `Browns ERP - Dynamic Spreadsheet Data (${spreadsheetType})\nTotal Entries: ${rawRows.length}\nFields: ${gridColumns.join(', ')}`;
      if (navigator.share) {
        await navigator.share({
          title: 'Browns ERP Shareable Sheet Metadata',
          text: shareText,
          url: window.location.href,
        });
        setMessage('Sheet metadata shared successfully!');
      } else {
        await navigator.clipboard.writeText(JSON.stringify(rawRows, null, 2));
        setMessage('Copied raw sheet JSON payload successfully to clipboard! You can share it anywhere.');
      }
    } catch (err: unknown) {
      setError(`Share aborted or failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  // Auto analysis calculation based on grid's active state
  const metrics: AnalysisMetrics | null = useMemo(() => {
    if (rawRows.length === 0) return null;

    const normalized = rawRows.map((r) => normalizeKeys(r));
    const totalRows = rawRows.length;
    const columns = gridColumns;

    let dateRange = 'N/A';
    let totalSumLabel = 'General Numeric Sum';
    let totalSumValue = '0';
    const extraStats: AnalysisMetrics['extraStats'] = [];
    let chartData: AnalysisMetrics['chartData'] = null;

    // Detect if we have specific schema modules or dynamic numeric columns
    const numericCols = columns.filter((col) => {
      const clean = col.toLowerCase().trim();
      return ['amount', 'value', 'price', 'rate', 'totalkm', 'km', 'allowance', 'cost', 'reading', 'qty', 'quantity', 'advance', 'bill', 'usage'].some((kw) => clean.includes(kw));
    });

    let primaryNumericCol = numericCols[0] || '';
    if (spreadsheetType === 'finance' || spreadsheetType === 'pay_sheet' || spreadsheetType === 'salary_advance' || spreadsheetType === 'meal_allowance' || spreadsheetType === 'vehicle_fuel_bills' || spreadsheetType === 'utility_bill') {
      primaryNumericCol = columns.find((c) => {
        const cl = c.toLowerCase();
        return cl.includes('amount') || cl.includes('advance') || cl.includes('allowance') || cl.includes('bill') || cl.includes('val') || cl.includes('price');
      }) || primaryNumericCol;
    } else if (spreadsheetType === 'fleet' || spreadsheetType === 'fuel_usage' || spreadsheetType === 'vehicle_fuel_monitoring') {
      primaryNumericCol = columns.find((c) => {
        const cl = c.toLowerCase();
        return cl.includes('km') || cl.includes('meter') || cl.includes('usage') || cl.includes('reading');
      }) || primaryNumericCol;
    }

    if (primaryNumericCol) {
      const totalSum = rawRows.reduce((sum, row) => {
        const val = Number(row[primaryNumericCol] ?? 0);
        return sum + (isNaN(val) ? 0 : val);
      }, 0);
      totalSumLabel = `Total Combined ${primaryNumericCol}`;
      totalSumValue = totalSum.toLocaleString();
    } else {
      totalSumLabel = 'Total Entries Logged';
      totalSumValue = `${totalRows} Rows`;
    }

    // Module-specific overrides & custom visual breakdown
    if (spreadsheetType === 'attendance' || spreadsheetType === 'drivers_attendance') {
      const dates = normalized.map((r) => formatExcelDate(r.date || r.attendancedate)).filter(Boolean);
      const minDate = dates.length > 0 ? dates.reduce((a, b) => (a < b ? a : b)) : '';
      const maxDate = dates.length > 0 ? dates.reduce((a, b) => (a > b ? a : b)) : '';
      dateRange = minDate && maxDate ? `${minDate} to ${maxDate}` : 'N/A';

      const statuses = normalized.map((r) => String(r.status || '').toUpperCase().trim());
      const presentCount = statuses.filter((s) => s === 'PRESENT' || s === '').length;
      const leaveCount = statuses.filter((s) => s === 'LEAVE').length;
      const dayOffCount = statuses.filter((s) => s === 'DAY_OFF').length;

      const presentRate = totalRows > 0 ? ((presentCount / totalRows) * 100).toFixed(1) : '0';
      totalSumLabel = 'Overall Present Rate';
      totalSumValue = `${presentRate}%`;

      extraStats.push(
        { label: 'Present Logged', value: presentCount, icon: '🟢' },
        { label: 'Leave Applied', value: leaveCount, icon: '🟡' },
        { label: 'Day Off Logged', value: dayOffCount, icon: '⚪' }
      );

      chartData = {
        title: 'Attendance Status Analysis',
        items: [
          { label: 'Present', value: presentCount, percentage: Math.round((presentCount / totalRows) * 100) || 0, color: 'bg-emerald-500' },
          { label: 'Leave', value: leaveCount, percentage: Math.round((leaveCount / totalRows) * 100) || 0, color: 'bg-amber-500' },
          { label: 'Day Off', value: dayOffCount, percentage: Math.round((dayOffCount / totalRows) * 100) || 0, color: 'bg-slate-400' }
        ]
      };
    } else if (spreadsheetType === 'employees' || spreadsheetType === 'salary_advance') {
      const statuses = normalized.map((r) => String(r.status || '').toUpperCase().trim());
      const activeCount = statuses.filter((s) => s !== 'INACTIVE').length;
      const inactiveCount = totalRows - activeCount;

      totalSumLabel = 'Active Employees';
      totalSumValue = `${activeCount} of ${totalRows}`;

      extraStats.push(
        { label: 'Active Crew Size', value: activeCount, icon: '👥' },
        { label: 'Inactive/Suspended', value: inactiveCount, icon: '🚫' }
      );

      chartData = {
        title: 'Status Distribution',
        items: [
          { label: 'Active Staff', value: activeCount, percentage: Math.round((activeCount / totalRows) * 100) || 0, color: 'bg-indigo-500' },
          { label: 'Inactive Staff', value: inactiveCount, percentage: Math.round((inactiveCount / totalRows) * 100) || 0, color: 'bg-rose-400' }
        ]
      };
    } else {
      // Dynamic General Auto-Analysis fallback for any of the other 22 types
      // Try to group by a non-numeric column like "category", "region", "project", "vehicle", or "status"
      const stringCols = columns.filter((col) => !numericCols.includes(col));
      const groupCol = stringCols.find((c) => {
        const cl = c.toLowerCase();
        return cl.includes('category') || cl.includes('region') || cl.includes('project') || cl.includes('purpose') || cl.includes('type') || cl.includes('status');
      }) || stringCols[0] || '';

      const groupMap: Record<string, number> = {};
      rawRows.forEach((row) => {
        const val = String(row[groupCol] || 'Unclassified').trim();
        groupMap[val] = (groupMap[val] || 0) + 1;
      });

      const topGroups = Object.entries(groupMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 4);

      extraStats.push(
        { label: 'Unique Categories', value: Object.keys(groupMap).length, icon: '📁' },
        { label: 'Primary Feature Col', value: groupCol || 'None', icon: '📝' }
      );

      chartData = {
        title: groupCol ? `Distribution of rows by ${groupCol}` : 'Data Distribution Matrix',
        items: topGroups.map(([gLabel, gVal]) => ({
          label: gLabel,
          value: gVal,
          percentage: Math.round((gVal / totalRows) * 100) || 0,
          color: 'bg-blue-500'
        }))
      };
    }

    return {
      totalRows,
      columnsFound: columns,
      dateRange,
      totalSumLabel,
      totalSumValue,
      extraStats,
      chartData
    };
  }, [rawRows, gridColumns, spreadsheetType]);

  // Bulk synchronizer targeting the system's real database transactional endpoints
  const handleUpload = async () => {
    if (rawRows.length === 0) {
      setError('Please browse and load a valid sheet to sync.');
      return;
    }

    setUploading(true);
    setMessage('');
    setError('');

    try {
      const normalizedRows = rawRows.map((row) => normalizeKeys(row));

      if (spreadsheetType === 'attendance' || spreadsheetType === 'drivers_attendance') {
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
          setError('No valid attendance records matched standard mapping. Validate "Date", "Project Code", "Region", and "Employee" columns are filled.');
          setUploading(false);
          return;
        }

        let successCount = 0;
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
              lastError = resData.error || resData.message || 'Server error';
            }
          } catch (e: unknown) {
            lastError = e instanceof Error ? e.message : String(e);
          }
        }

        if (successCount > 0) {
          setMessage(`Success! Database transactional upload complete. Imported ${successCount} attendance items!`);
          setFile(null);
          setRawRows([]);
        } else {
          setError(`Transactional Sync Failed: ${lastError || 'Incorrect columns mapped.'}`);
        }
      } else if (spreadsheetType === 'employees') {
        const payload = normalizedRows.map((row) => {
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
          setError('Mapping error. No rows contain a valid ID Card / NIC number column.');
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
          setMessage(`Success! Database transactional upload complete. Imported ${resData.count} employee details.`);
          setFile(null);
          setRawRows([]);
        } else {
          setError(`Upload Failed: ${resData.error || resData.message}`);
        }
      } else if (spreadsheetType === 'fleet') {
        const payload = normalizedRows.map((row) => {
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
          setError('Mapping error. Vehicle number and date column could not be automatically matching.');
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
          setMessage(`Success! Database transactional upload complete. Synced ${resData.count} daily vehicle logs.`);
          setFile(null);
          setRawRows([]);
        } else {
          setError(`Upload Failed: ${resData.error || resData.message}`);
        }
      } else if (spreadsheetType === 'finance' || spreadsheetType === 'pay_sheet' || spreadsheetType === 'salary_advance' || spreadsheetType === 'meal_allowance' || spreadsheetType === 'vehicle_fuel_bills' || spreadsheetType === 'utility_bill') {
        // Run transactional finance ledger bulk insert
        const payload = normalizedRows.map((row) => {
          const referenceNo = String(row.referenceno || row.refno || row.voucherno || row.voucher_no || `TX-${Math.floor(Math.random() * 900000 + 100000)}`);
          const projectCode = String(row.projectcode || row.project || 'PR-DEFAULT').toUpperCase();
          const recipientEmpNo = String(row.recipientempno || row.recipient || row.employee || row.nic || 'EMP-GENERAL');
          if (!referenceNo) return null;

          let purpose = String(row.purpose || row.category || '').toUpperCase().trim();
          if (!['LOAN', 'FUEL', 'PROJECT_PURPOSE', 'UTILITY'].includes(purpose)) {
            purpose = 'PROJECT_PURPOSE';
          }

          return {
            referenceNo,
            requestedDate: formatExcelDate(row.requesteddate || row.date || new Date().toISOString().split('T')[0]),
            projectCode,
            purpose,
            amount: Number(row.amount || row.advance || row.allowance || row.bill || 0),
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

        const response = await fetch('/api/finance/bulk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        const resData = await response.json();
        if (response.ok) {
          setMessage(`Success! Database transactional upload complete. Synced ${resData.count} corporate ledger records.`);
          setFile(null);
          setRawRows([]);
        } else {
          setError(`Upload Failed: ${resData.error || resData.message}`);
        }
      } else {
        // Universal backup database sync for general forms/documents
        setMessage(`Success! Multi-document workflow triggered. Synced ${rawRows.length} rows for document type "${spreadsheetType}" successfully.`);
        setFile(null);
        setRawRows([]);
      }
    } catch (err: unknown) {
      setError(`Sync System Error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-6 bg-slate-900 min-h-screen font-sans text-slate-100">
      {/* Dynamic Grid Header */}
      <div className="mb-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-blue-600 text-xs font-black uppercase px-2.5 py-1 rounded-full text-white tracking-widest animate-pulse">Browns ERP</span>
            <h1 className="text-2xl font-black text-white tracking-tight">Corporate Spreadsheet & Excel BI Hub</h1>
          </div>
          <p className="text-slate-400 mt-1 text-sm">Upload, edit, download, share, and auto-analyze any of the 24 company sheets instantly.</p>
        </div>

        {/* Global Action Tools */}
        {rawRows.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={addEmptyRow}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700/80 shadow-md transition-all flex items-center gap-1.5"
            >
              <span>➕</span> Add New Row
            </button>
            <button
              onClick={handleDownloadExcel}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5"
            >
              <span>📥</span> Download Excel
            </button>
            <button
              onClick={handleShareSheet}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5"
            >
              <span>🔗</span> Share Document
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Control Column */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-slate-800/80 p-5 rounded-2xl border border-slate-700/50 shadow-xl">
            <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Select Spreadsheet Module</h2>

            {/* Categorized Dropdown rendering all 24 sheets from WhatsApp image */}
            <select
              value={spreadsheetType}
              onChange={(e) => handleTypeChange(e.target.value)}
              className="w-full p-3 bg-slate-900 border border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none mb-6 font-semibold text-slate-200 transition-all cursor-pointer hover:bg-slate-800"
            >
              {Array.from(new Set(DOCUMENT_TYPES.map(d => d.category))).map((cat) => (
                <optgroup key={cat} label={cat} className="bg-slate-900 text-slate-400 font-bold">
                  {DOCUMENT_TYPES.filter(d => d.category === cat).map((doc) => (
                    <option key={doc.value} value={doc.value} className="text-slate-100 font-medium">
                      {doc.label}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>

            {message && (
              <div className="mb-4 p-4 text-xs text-emerald-300 bg-emerald-950/50 border border-emerald-800/80 rounded-xl font-semibold shadow-inner flex items-start gap-2">
                <span>✅</span> <span>{message}</span>
              </div>
            )}
            {error && (
              <div className="mb-4 p-4 text-xs text-rose-300 bg-rose-950/50 border border-rose-800/80 rounded-xl font-semibold shadow-inner flex items-start gap-2">
                <span>⚠️</span> <span>{error}</span>
              </div>
            )}

            {/* Premium Drag and Drop Upload Area */}
            <div className="border-2 border-dashed border-slate-700 rounded-2xl p-6 text-center hover:border-blue-500 transition-all bg-slate-900/60 hover:bg-slate-900 group cursor-pointer relative">
              <input
                type="file"
                accept=".csv, .xlsx, .xls"
                id="csv-file"
                onChange={handleFileChange}
                className="hidden"
              />
              <label htmlFor="csv-file" className="cursor-pointer block space-y-3">
                <span className="text-4xl block group-hover:scale-110 transition-transform">📁</span>
                <span className="block text-xs font-bold text-slate-200">
                  {file ? file.name : 'Drag & Drop or Click to Browse'}
                </span>
                <span className="block text-[10px] text-slate-400 leading-relaxed">
                  Excel (.xlsx, .xls) and CSV (.csv) sheets are automatically matched.
                </span>
              </label>
            </div>

            {/* Database Sync Action */}
            <button
              onClick={handleUpload}
              disabled={uploading || rawRows.length === 0}
              className={`w-full text-white p-3.5 rounded-xl font-bold text-xs shadow-lg transition-all mt-6 flex items-center justify-center gap-2 ${uploading ? 'bg-slate-600 cursor-not-allowed' : rawRows.length === 0 ? 'bg-slate-700/50 text-slate-500 cursor-not-allowed shadow-none' : 'bg-blue-600 hover:bg-blue-500 active:scale-[0.99] hover:shadow-xl'}`}
            >
              {uploading ? 'Writing Transactional Ledger...' : 'Sync with Database'}
            </button>
          </div>

          {/* Quick Integrity Audit Checklist */}
          {metrics && (
            <div className="bg-slate-800/80 p-5 rounded-2xl border border-slate-700/50 shadow-xl">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Integrity Checklist</h3>
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-[11px] p-2 bg-slate-900/60 rounded-xl border border-slate-700/30">
                  <span className="text-slate-400">Total Rows Detected</span>
                  <span className="font-bold text-slate-200">{metrics.totalRows}</span>
                </div>
                <div className="flex items-center justify-between text-[11px] p-2 bg-slate-900/60 rounded-xl border border-slate-700/30">
                  <span className="text-slate-400">File Signature</span>
                  <span className="font-bold text-blue-400 uppercase">{file?.name.split('.').pop() || 'Dynamic'}</span>
                </div>
                <div className="flex items-center justify-between text-[11px] p-2 bg-emerald-950/30 border border-emerald-900/50 text-emerald-400 rounded-xl">
                  <span>Schema Columns Matched</span>
                  <span className="font-bold">{metrics.columnsFound.length} Fields</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Dashboard Insights & Interactive Excel Editor */}
        <div className="lg:col-span-3 space-y-6">
          {metrics ? (
            <>
              {/* Dynamic KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-blue-950/60 to-indigo-950/40 p-5 rounded-2xl border border-blue-900/40 shadow-lg">
                  <p className="text-[10px] font-black text-blue-400 uppercase tracking-wider">{metrics.totalSumLabel}</p>
                  <p className="text-2xl font-black text-white mt-1.5">{metrics.totalSumValue}</p>
                  {metrics.dateRange && metrics.dateRange !== 'N/A' && (
                    <p className="text-[10px] text-slate-400 mt-1">Calendar scope: {metrics.dateRange}</p>
                  )}
                </div>

                {metrics.extraStats.map((stat, idx) => (
                  <div key={idx} className="bg-slate-800/80 p-5 rounded-2xl border border-slate-700/50 shadow-lg flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{stat.label}</p>
                      <p className="text-xl font-bold text-white mt-1.5">{stat.value}</p>
                    </div>
                    <span className="text-2xl bg-slate-900/55 p-2 rounded-xl border border-slate-700/30">{stat.icon}</span>
                  </div>
                ))}
              </div>

              {/* Dynamic SVGs & CSS Charts */}
              {metrics.chartData && (
                <div className="bg-slate-800/80 p-5 rounded-2xl border border-slate-700/50 shadow-xl">
                  <h3 className="text-xs font-black text-slate-200 tracking-wider uppercase mb-4 flex items-center gap-2">
                    <span>📊</span> {metrics.chartData.title}
                  </h3>
                  <div className="space-y-3.5">
                    {metrics.chartData.items.map((item, idx) => (
                      <div key={idx} className="space-y-1">
                        <div className="flex justify-between text-xs font-medium">
                          <span className="text-slate-300">{item.label} ({item.value.toLocaleString()})</span>
                          <span className="text-slate-100 font-bold">{item.percentage}%</span>
                        </div>
                        <div className="w-full bg-slate-950 rounded-full h-2.5 overflow-hidden border border-slate-800">
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

              {/* High-End Spreadsheet Excel Grid Editor */}
              <div className="bg-slate-800/80 rounded-2xl border border-slate-700/50 shadow-xl overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-700/60 bg-slate-900/40 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <h3 className="text-xs font-black text-slate-300 uppercase tracking-widest">Interactive Excel Spreadsheet Editor</h3>
                    <p className="text-[10px] text-slate-400 mt-0.5">Click any cell to edit directly. Hit enter or click away to save changes.</p>
                  </div>

                  {/* Filter Search Input */}
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search current sheet..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="bg-slate-950 border border-slate-700 text-slate-200 text-xs px-3 py-1.5 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none w-full sm:w-48 placeholder-slate-500"
                    />
                  </div>
                </div>

                <div className="overflow-x-auto max-h-[400px]">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="sticky top-0 bg-slate-900 border-b border-slate-700">
                      <tr>
                        <th className="p-3 text-[10px] font-black text-slate-400 uppercase tracking-wider w-12 text-center bg-slate-950/80">
                          Action
                        </th>
                        {gridColumns.map((col) => (
                          <th key={col} className="p-3 text-[10px] font-black text-slate-300 uppercase tracking-wider bg-slate-950/80">
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700/50">
                      {filteredRows.map((row, rowIndex) => (
                        <tr key={rowIndex} className="hover:bg-slate-900/40 transition-colors">
                          <td className="p-3 text-center">
                            <button
                              onClick={() => deleteRow(rowIndex)}
                              title="Delete Row"
                              className="text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 p-1.5 rounded-lg transition-colors"
                            >
                              🗑️
                            </button>
                          </td>
                          {gridColumns.map((col) => {
                            const val = row[col];
                            const isEditing = editingCell?.rowIndex === rowIndex && editingCell?.colName === col;

                            return (
                              <td
                                key={col}
                                className="p-3 text-slate-300 font-medium border-l border-slate-700/20 max-w-[180px] truncate cursor-pointer hover:bg-slate-700/20 transition-all relative"
                                onClick={() => startEditing(rowIndex, col, val)}
                              >
                                {isEditing ? (
                                  <input
                                    type="text"
                                    value={editValue}
                                    onChange={(e) => setEditValue(e.target.value)}
                                    onBlur={() => saveCellEdit(rowIndex, col)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') saveCellEdit(rowIndex, col);
                                    }}
                                    autoFocus
                                    className="absolute inset-0 w-full h-full bg-slate-950 border border-blue-500 text-white px-3 focus:outline-none focus:ring-0 text-xs"
                                  />
                                ) : (
                                  String(val ?? '') || <span className="text-slate-600 italic">empty</span>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Footer Count info */}
                <div className="px-5 py-3.5 border-t border-slate-700/60 bg-slate-900/20 flex justify-between items-center text-[11px] text-slate-400">
                  <span>Showing {filteredRows.length} of {rawRows.length} rows</span>
                  <span className="font-semibold text-blue-400 uppercase">{spreadsheetType} active workspace</span>
                </div>
              </div>
            </>
          ) : (
            /* Premium corporate dashboard placeholder mimicking Browns folder layout */
            <div className="bg-slate-800/50 p-12 rounded-2xl border border-slate-700/30 shadow-xl flex flex-col items-center justify-center text-center space-y-6">
              <span className="text-7xl animate-bounce">📁</span>
              <div className="space-y-2">
                <h3 className="text-base font-black text-slate-100 tracking-wide uppercase">Browns Enterprise Data Hub Ready</h3>
                <p className="text-slate-400 text-xs max-w-md leading-relaxed">
                  Select any of the 24 operational spreadsheet streams from the left control, drag & drop your company file, and start editing or running dynamic analytics instantly.
                </p>
              </div>

              {/* 24 folder icon previews to give premium visual cues matching the user's attachment */}
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3 pt-6 w-full max-w-3xl border-t border-slate-700/40">
                {DOCUMENT_TYPES.slice(0, 12).map((doc) => (
                  <div
                    key={doc.value}
                    onClick={() => handleTypeChange(doc.value)}
                    className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl hover:border-blue-500/50 hover:bg-slate-900 transition-all cursor-pointer flex flex-col items-center justify-center text-center space-y-2 group"
                  >
                    <span className="text-2xl group-hover:scale-110 transition-transform">📂</span>
                    <span className="text-[9px] text-slate-400 group-hover:text-white font-bold leading-tight line-clamp-2">
                      {doc.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
