import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { adminEmails } from "@/lib/authorizeAdmin";
import Link from "next/link";
import { db } from "@/lib/firebaseConfig";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import {
  FiShoppingBag,
  FiSearch,
  FiArrowLeft,
  FiClock,
  FiCheckCircle,
  FiXCircle,
} from "react-icons/fi";
import OrderActionsMenu from "@/components/admin/OrderActionsMenu";

export default async function AdminOrdersPage() {
  // 1. Check Authentication & Authorization
  const session = await auth();

  if (!session || !session.user) {
    redirect("/auth/signin?callbackUrl=/admin/orders");
  }

  const isAdmin = adminEmails?.includes(session.user.email);
  if (!isAdmin) {
    redirect("/?error=unauthorized");
  }

  // 2. Fetch Live Orders from Firestore
  let orders = [];
  let totalOrdersCount = 0;
  let processingPendingCount = 0;
  let completedCount = 0;
  let cancelledRefundedCount = 0;

  try {
    const ordersRef = collection(db, "orders");
    const ordersQuery = query(ordersRef, orderBy("createdAt", "asc"));
    const snapshot = await getDocs(ordersQuery);

    totalOrdersCount = snapshot.size;

    orders = snapshot.docs.map((docSnap, index) => {
      const data = docSnap.data();

      // Normalize status fields
      const status = data.status || data.orderStatus || "Pending";
      const paymentStatus = data.paymentStatus || data.payment_status || "Unpaid";

      // Calculate dynamic metric counts
      const statusLower = status.toLowerCase();
      if (statusLower === "completed" || statusLower === "delivered") {
        completedCount++;
      } else if (statusLower === "cancelled" || statusLower === "refunded") {
        cancelledRefundedCount++;
      } else {
        processingPendingCount++;
      }

      // Robust date parsing
      const rawDate =
        data.createdAt ||
        data.created_at ||
        data.date ||
        data.timestamp;

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

      // Total price handling
      const numericTotal = typeof data.total === "number" 
        ? data.total 
        : parseFloat(data.totalAmount || data.amount || data.total || 0);

      // Item count calculation
      let itemsCount = 0;
      if (Array.isArray(data.items)) {
        itemsCount = data.items.reduce((acc, item) => acc + (item.quantity || item.qty || 1), 0);
      } else {
        itemsCount = parseInt(data.itemsCount || data.totalItems || 1, 10);
      }

      // Format Order ID sequentially
      const formattedOrderId = data.orderNumber || data.orderCode 
        ? `ORD-${String(data.orderNumber || data.orderCode).padStart(3, "0")}`
        : `ORD-${String(index + 1).padStart(3, "0")}`;

      return {
        id: docSnap.id,
        displayId: formattedOrderId,
        customer: data.customerName || data.name || data.userEmail?.split("@")[0] || "Guest Customer",
        email: data.userEmail || data.email || "No Email Provided",
        itemsCount,
        total: numericTotal,
        status,
        paymentStatus,
        date: formattedDate,
      };
    });
  } catch (error) {
    console.error("Error fetching orders from Firestore:", error);
  }

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
              <FiShoppingBag className="text-indigo-600" /> Order Management
            </h1>
            <p className="text-gray-600 text-sm mt-1">
              Track customer purchases, fulfillment status, and payment logs.
            </p>
          </div>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
          <p className="text-sm text-gray-500 font-medium">Total Orders</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {totalOrdersCount.toLocaleString()}
          </p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
          <p className="text-sm text-gray-500 font-medium">Processing / Pending</p>
          <p className="text-2xl font-bold text-amber-600 mt-1">
            {processingPendingCount.toLocaleString()}
          </p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
          <p className="text-sm text-gray-500 font-medium">Completed</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">
            {completedCount.toLocaleString()}
          </p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
          <p className="text-sm text-gray-500 font-medium">Cancelled / Refunded</p>
          <p className="text-2xl font-bold text-red-600 mt-1">
            {cancelledRefundedCount.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Search and Filters */}
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by Order ID or customer..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select className="w-full sm:w-auto text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20">
              <option value="all">All Order Statuses</option>
              <option value="completed">Completed</option>
              <option value="processing">Processing</option>
              <option value="pending">Pending</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <select className="w-full sm:w-auto text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20">
              <option value="all">All Payments</option>
              <option value="paid">Paid</option>
              <option value="unpaid">Unpaid</option>
              <option value="refunded">Refunded</option>
            </select>
          </div>
        </div>

        {/* Orders Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 text-gray-700 font-semibold border-b border-gray-100">
              <tr>
                <th className="py-3.5 px-4">Order ID</th>
                <th className="py-3.5 px-4">Customer</th>
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4">Items</th>
                <th className="py-3.5 px-4">Total</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Payment</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {orders.length > 0 ? (
                orders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-indigo-600 tracking-wide">
                      {order.displayId}
                    </td>

                    <td className="py-3.5 px-4">
                      <div>
                        <p className="font-semibold text-gray-900">{order.customer}</p>
                        <p className="text-xs text-gray-500">{order.email}</p>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-gray-500">{order.date}</td>

                    <td className="py-3.5 px-4 text-gray-700">{order.itemsCount} pcs</td>

                    <td className="py-3.5 px-4 font-semibold text-gray-900">
                      ₦{order.total.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>

                    <td className="py-3.5 px-4">
                      {(order.status === "Completed" || order.status === "Delivered") && (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700">
                          <FiCheckCircle size={12} /> Completed
                        </span>
                      )}
                      {order.status === "Processing" && (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700">
                          <FiClock size={12} /> Processing
                        </span>
                      )}
                      {order.status === "Pending" && (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700">
                          <FiClock size={12} /> Pending
                        </span>
                      )}
                      {order.status === "Cancelled" && (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-red-50 text-red-700">
                          <FiXCircle size={12} /> Cancelled
                        </span>
                      )}
                      {!["Completed", "Delivered", "Processing", "Pending", "Cancelled"].includes(order.status) && (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-gray-100 text-gray-700">
                          {order.status}
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 text-xs font-semibold rounded-full ${
                          order.paymentStatus === "Paid"
                            ? "bg-emerald-50 text-emerald-700"
                            : order.paymentStatus === "Refunded"
                            ? "bg-gray-100 text-gray-600"
                            : "bg-amber-50 text-amber-700"
                        }`}
                      >
                        {order.paymentStatus}
                      </span>
                    </td>

                    {/* Interactive Action Dropdown */}
                    <td className="py-3.5 px-4 text-right">
                      <OrderActionsMenu
                        orderId={order.id}
                        currentStatus={order.status}
                        currentPaymentStatus={order.paymentStatus}
                      />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-gray-500">
                    No orders found in Firestore database.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Pagination */}
        <div className="p-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
          <p>
            Showing {orders.length > 0 ? 1 : 0} to {orders.length} of {totalOrdersCount} orders
          </p>
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