"use client";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface FleetRow {
  vehicleNo: string;
  vehicleType: string;
  driver: string;
  totalKm: number;
  totalFuelLiters: number;
  totalFuelCost: number;
}

interface PDFReportButtonProps {
  data: FleetRow[];
  month: string;
}

export default function PDFReportButton({ data, month }: PDFReportButtonProps) {
  const generatePDF = () => {
    const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });

    doc.setFontSize(16);
    doc.text("Browns Engineering & Constructions (Pvt) Ltd", 14, 20);
    doc.setFontSize(12);
    doc.text(`Fleet Logistics Report — ${month}`, 14, 28);
    doc.setFontSize(9);
    doc.text(`Generated: ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`, 14, 34);

    const tableColumn = ["Vehicle No", "Type", "Driver", "Total KM", "Fuel (L)", "Fuel Cost (LKR)"];
    const tableRows = data.map((row) => [
      row.vehicleNo,
      row.vehicleType,
      row.driver,
      row.totalKm.toLocaleString(),
      row.totalFuelLiters.toFixed(1),
      row.totalFuelCost.toLocaleString(undefined, { minimumFractionDigits: 2 }),
    ]);

    autoTable(doc, {
      startY: 40,
      head: [tableColumn],
      body: tableRows,
      foot: [
        [
          "",
          "",
          "TOTAL",
          data.reduce((s, r) => s + r.totalKm, 0).toLocaleString(),
          data.reduce((s, r) => s + r.totalFuelLiters, 0).toFixed(1),
          data.reduce((s, r) => s + r.totalFuelCost, 0).toLocaleString(undefined, {
            minimumFractionDigits: 2,
          }),
        ],
      ],
      theme: "grid",
      headStyles: { fillColor: [30, 58, 95], textColor: 255, fontStyle: "bold" },
      footStyles: { fillColor: [245, 245, 245], textColor: [10, 10, 10], fontStyle: "bold" },
      styles: { fontSize: 8, cellPadding: 2 },
    });

    doc.save(`fleet-report-${month.replace(/\s+/g, "-")}.pdf`);
  };

  return (
    <button
      onClick={generatePDF}
      className="flex items-center gap-2 rounded-lg bg-[#1e3a5f] px-4 py-2 text-sm font-semibold text-white hover:bg-[#162d4a] transition-colors"
    >
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      PDF Report
    </button>
  );
}
