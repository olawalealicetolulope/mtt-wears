import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { adminEmails } from "@/lib/authorizeAdmin";
import Link from "next/link";
import { db } from "@/lib/firebaseConfig";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import {
  FiDollarSign,
  FiTrendingUp,
  FiCreditCard,
  FiArrowLeft,
  FiArrowUpRight,
  FiPieChart,
  FiSearch,
} from "react-icons/fi";
import RevenueChart from "@/components/admin/RevenueChart";
import ExportReportButton from "@/components/admin/ExportReportButton"; // Import the client button

export default async function AdminRevenuePage() {
  // 1. Authentication & Authorization Check
  const session = await auth();

  if (!session || !session.user) {
    redirect("/auth/signin?callbackUrl=/admin/revenue");
  }

  const isAdmin = adminEmails?.includes(session.user.email);
  if (!isAdmin) {
    redirect("/?error=unauthorized");
  }

  // 2. Fetch Live Orders from Firestore & Compute Metrics
  let transactions = [];
  let grossRevenue = 0;
  let totalFee = 0;
  let netEarnings = 0;
  let avgOrderValue = 0;
  let totalOrdersCount = 0;
  let chartDataMap = {};

  try {
    const ordersRef = collection(db, "orders");
    const ordersQuery = query(ordersRef, orderBy("createdAt", "asc"));
    const snapshot = await getDocs(ordersQuery);

    totalOrdersCount = snapshot.size;

    transactions = snapshot.docs.map((docSnap, index) => {
      const data = docSnap.data();

      // Extract and parse numeric total
      const rawTotal = data.total ?? data.totalAmount ?? data.amount ?? 0;
      const amount = typeof rawTotal === "number" ? rawTotal : parseFloat(rawTotal || 0);

      // Estimate transaction fees (~2.9%)
      const fee = Number((amount * 0.029).toFixed(2));
      const status = data.status || data.orderStatus || data.paymentStatus || "Completed";
      
      const isRefunded = status.toLowerCase() === "refunded" || status.toLowerCase() === "cancelled";
      const net = isRefunded ? -amount : amount - fee;

      // Accumulate metrics if order is not refunded
      if (!isRefunded) {
        grossRevenue += amount;
        totalFee += fee;
        netEarnings += net;
      }

      // Format custom Display Order ID (ORD-001) & Transaction ID (TXN-001)
      const seqIndex = index + 1;
      const formattedOrderId = data.orderNumber || data.orderCode 
        ? `ORD-${String(data.orderNumber || data.orderCode).padStart(3, "0")}`
        : `ORD-${String(seqIndex).padStart(3, "0")}`;

      const formattedTxnId = `TXN-${String(seqIndex).padStart(3, "0")}`;

      // Robust date parsing
      const rawDate = data.createdAt || data.created_at || data.date || data.timestamp;
      let dateObj = null;

      if (rawDate) {
        if (typeof rawDate.toDate === "function") {
          dateObj = rawDate.toDate();
        } else if (rawDate?.seconds) {
          dateObj = new Date(rawDate.seconds * 1000);
        } else if (typeof rawDate === "number") {
          dateObj = new Date(rawDate > 1e11 ? rawDate : rawDate * 1000);
        } else if (typeof rawDate === "string") {
          dateObj = new Date(rawDate);
        }
      }

      const formattedDate = dateObj && !isNaN(dateObj.getTime())
        ? dateObj.toLocaleDateString("en-US", {
            month: "short",
            day: "2-digit",
            year: "numeric",
          })
        : "N/A";

      // Group revenue by date for the Chart Component
      if (dateObj && !isNaN(dateObj.getTime()) && !isRefunded) {
        const shortDate = dateObj.toLocaleDateString("en-US", { month: "short", day: "2-digit" });
        chartDataMap[shortDate] = (chartDataMap[shortDate] || 0) + amount;
      }

      return {
        id: formattedTxnId,
        docId: docSnap.id,
        orderId: formattedOrderId,
        customer: data.customerName || data.name || data.userEmail?.split("@")[0] || "Guest Customer",
        method: data.paymentMethod || data.method || "Paystack / Card",
        amount,
        fee,
        net,
        status: isRefunded ? "Refunded" : data.paymentStatus || "Completed",
        date: formattedDate,
      };
    });

    avgOrderValue = totalOrdersCount > 0 ? grossRevenue / totalOrdersCount : 0;
  } catch (error) {
    console.error("Error fetching transactions/orders from Firestore:", error);
  }

  // Format dynamic chart data array
  const chartData = Object.keys(chartDataMap).map((dateKey) => ({
    date: dateKey,
    revenue: chartDataMap[dateKey],
  }));

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-10">
      {/* Navigation & Header */}
      <div className="mb-6">
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-indigo-600 transition-colors mb-4"
        >
          <FiArrowLeft /> Back to Dashboard
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <FiDollarSign className="text-emerald-600" /> Revenue & Financials
            </h1>
            <p className="text-gray-600 text-sm mt-1">
              Overview of store earnings, profit margins, and payment transaction logs.
            </p>
          </div>

          {/* Interactive Export Button */}
          <ExportReportButton transactions={transactions} />
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500 font-medium">Gross Revenue</p>
            <span className="inline-flex items-center text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
              <FiArrowUpRight className="mr-0.5" /> Live
            </span>
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-2">
            ₦{grossRevenue.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500 font-medium">Net Earnings</p>
            <span className="inline-flex items-center text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
              <FiArrowUpRight className="mr-0.5" /> Live
            </span>
          </div>
          <p className="text-2xl font-bold text-emerald-600 mt-2">
            ₦{netEarnings.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500 font-medium">Avg. Order Value</p>
            <span className="inline-flex items-center text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
              Stable
            </span>
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-2">
            ₦{avgOrderValue.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500 font-medium">Platform Fees</p>
            <span className="inline-flex items-center text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
              ~2.9%
            </span>
          </div>
          <p className="text-2xl font-bold text-gray-700 mt-2">
            ₦{totalFee.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      {/* Analytics Breakdown with Integrated Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <FiTrendingUp className="text-indigo-600" /> Revenue Stream Overview
            </h2>
            <select className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 text-gray-600 focus:outline-none">
              <option value="30">All Time</option>
            </select>
          </div>
          
          <div className="h-64">
            <RevenueChart data={chartData} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <FiPieChart className="text-indigo-600" /> Payment Methods
          </h2>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs font-semibold text-gray-700 mb-1">
                <span>Card / Paystack</span>
                <span>100% (₦{grossRevenue.toLocaleString("en-NG")})</span>
              </div>
              <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                <div className="bg-indigo-600 h-full w-[100%]" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search transaction or Order ID..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select className="w-full sm:w-auto text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20">
              <option value="all">All Gateways</option>
              <option value="paystack">Paystack</option>
            </select>
            <select className="w-full sm:w-auto text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20">
              <option value="all">All Statuses</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="refunded">Refunded</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 text-gray-700 font-semibold border-b border-gray-100">
              <tr>
                <th className="py-3.5 px-4">Transaction ID</th>
                <th className="py-3.5 px-4">Order ID</th>
                <th className="py-3.5 px-4">Customer</th>
                <th className="py-3.5 px-4">Method</th>
                <th className="py-3.5 px-4">Amount</th>
                <th className="py-3.5 px-4">Est. Fee</th>
                <th className="py-3.5 px-4">Net</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {transactions.length > 0 ? (
                transactions.map((txn) => (
                  <tr key={txn.docId} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-3.5 px-4 font-mono text-xs font-semibold text-gray-800">
                      {txn.id}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-indigo-600">
                      {txn.orderId}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-gray-900">
                      {txn.customer}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-gray-500 flex items-center gap-1.5 pt-4">
                      <FiCreditCard className="text-gray-400" /> {txn.method}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-gray-900">
                      ₦{txn.amount.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-red-500">
                      -₦{txn.fee.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td
                      className={`py-3.5 px-4 font-semibold ${
                        txn.net < 0 ? "text-red-600" : "text-emerald-600"
                      }`}
                    >
                      ₦{txn.net.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 text-xs font-semibold rounded-full ${
                          txn.status === "Completed" || txn.status === "Paid"
                            ? "bg-emerald-50 text-emerald-700"
                            : txn.status === "Pending"
                            ? "bg-amber-50 text-amber-700"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {txn.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-gray-500">{txn.date}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-gray-500">
                    No transactions found in Firestore database.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
          <p>Showing {transactions.length > 0 ? 1 : 0} to {transactions.length} transactions</p>
          <div className="flex gap-2">
            <button className="px-3 py-1.5 border border-gray-200 rounded-lg disabled:opacity-50" disabled>
              Previous
            </button>
            <button className="px-3 py-1.5 border border-gray-200 rounded-lg disabled:opacity-50" disabled>
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}