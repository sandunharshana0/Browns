'use client';

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface FleetSummaryData {
  vehicleNo: string;
  cardNo: string;
  totalKm: number;
  totalSpent: number;
  efficiency: number;
}

interface PDFReportButtonProps {
  data: FleetSummaryData[];
  month: string;
}

export default function PDFReportButton({ data, month }: PDFReportButtonProps) {
  const generatePDF = () => {
    const doc = new jsPDF();

    // 🏢 1. Company Letterhead / Header Setup
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(28, 64, 150); // Browns Corporate Blue
    doc.text('BROWNS ENGINEERING & CONSTRUCTIONS (PVT) LTD', 14, 20);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139); // Slate Gray
    doc.text('Head Office: No. 34, Sir Mohamed Macan Markar Mawatha, Colombo 03, Sri Lanka.', 14, 26);
    doc.text(`Document: Monthly Fleet Logistics & Operations Report - ${month}`, 14, 31);
    
    // ⎯⎯⎯ Horizontal Line Separator
    doc.setDrawColor(226, 232, 240);
    doc.line(14, 36, 196, 36);

    // 📊 2. Executive Analytics Summary Cards (Brief Metrics Overview)
    const totalKmAll = data.reduce((sum, item) => sum + item.totalKm, 0);
    const totalSpentAll = data.reduce((sum, item) => sum + item.totalSpent, 0);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(51, 65, 85);
    doc.text('EXECUTIVE PERFORMANCE SUMMARY', 14, 45);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`• Total Active Hired Fleet: ${data.length} Vehicles`, 14, 52);
    doc.text(`• Cumulative Distance Traveled: ${totalKmAll.toLocaleString()} KM`, 14, 58);
    doc.text(`• Total Fuel & Commitment Spend: LKR ${totalSpentAll.toLocaleString()}/=`, 14, 64);

    // 📋 3. Dynamic Data Table Initialization (Excel Row Mapping)
    const tableHeaders = [['Vehicle No', 'Fuel Card Mapped', 'Monthly KM', 'Total Cost (LKR)', 'Fuel Efficiency']];
    
    const tableRows = data.map(item => [
      item.vehicleNo,
      item.cardNo,
      `${item.totalKm.toLocaleString()} KM`,
      `Rs. ${item.totalSpent.toLocaleString()}/=`,
      `${item.efficiency.toFixed(1)} KM/L`
    ]);

    autoTable(doc, {
      startY: 72,
      head: tableHeaders,
      body: tableRows,
      theme: 'striped',
      headStyles: { fillColor: [41, 128, 185], fontSize: 10, fontStyle: 'bold' },
      bodyStyles: { fontSize: 9, textColor: [51, 65, 85] },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      margin: { left: 14, right: 14 },
    });

    // ✍️ 4. Authorized Signature Block (Bottom Guard)
    const finalY = (doc as any).lastAutoTable.finalY + 30;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.line(14, finalY, 70, finalY); // Signature Line
    doc.text('Prepared By: Fleet Administrator', 14, finalY + 5);
    doc.text(`Date of Generation: ${new Date().toLocaleDateString('en-GB')}`, 14, finalY + 11);

    // 📥 5. Auto Trigger Download File Browser Prompt
    doc.save(`Browns_Fleet_Report_${month.replace(' ', '_')}.pdf`);
  };

  return (
    <button
      onClick={generatePDF}
      className="bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs px-4 py-2.5 rounded-lg shadow-sm transition-all flex items-center gap-2"
    >
      📥 Download PDF Report
    </button>
  );
}
