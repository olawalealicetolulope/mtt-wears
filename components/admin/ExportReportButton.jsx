"use client";

import { FiDownload } from "react-icons/fi";

export default function ExportReportButton({ transactions = [] }) {
  const handleExportCSV = () => {
    if (!transactions || transactions.length === 0) {
      alert("No transaction data available to export.");
      return;
    }

    // Define CSV Headers
    const headers = [
      "Transaction ID",
      "Order ID",
      "Customer",
      "Payment Method",
      "Amount (NGN)",
      "Est Fee (NGN)",
      "Net Earnings (NGN)",
      "Status",
      "Date",
    ];

    // Map transaction data to CSV rows
    const rows = transactions.map((txn) => [
      `"${txn.id}"`,
      `"${txn.orderId}"`,
      `"${(txn.customer || "").replace(/"/g, '""')}"`,
      `"${(txn.method || "").replace(/"/g, '""')}"`,
      txn.amount,
      txn.fee,
      txn.net,
      `"${txn.status}"`,
      `"${txn.date}"`,
    ]);

    // Build CSV string
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");

    // Trigger file download in browser
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `Financial_Report_${new Date().toISOString().split("T")[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <button
      onClick={handleExportCSV}
      className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors shadow-sm w-fit cursor-pointer"
    >
      <FiDownload /> Export Financial Report
    </button>
  );
}