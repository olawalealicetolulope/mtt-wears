import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { adminEmails } from "@/lib/authorizeAdmin";
import Link from "next/link";
import { db } from "@/lib/firebaseConfig";
import { doc, getDoc } from "firebase/firestore";
import { FiArrowLeft, FiShoppingBag, FiUser, FiMail, FiCalendar, FiDollarSign, FiCheckCircle, FiClock, FiXCircle } from "react-icons/fi";

export default async function OrderDetailsPage({ params }) {
  // 1. Await dynamic route params (Next.js 15 requirement)
  const resolvedParams = await params;
  const orderId = resolvedParams.id;

  // 2. Authentication & Admin Authorization check
  const session = await auth();
  if (!session || !session.user) {
    redirect(`/auth/signin?callbackUrl=/admin/orders/${orderId}`);
  }

  const isAdmin = adminEmails?.includes(session.user.email);
  if (!isAdmin) {
    redirect("/?error=unauthorized");
  }

  // 3. Fetch single order from Firestore
  let orderData = null;
  try {
    const docRef = doc(db, "orders", orderId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      orderData = { id: docSnap.id, ...docSnap.data() };
    }
  } catch (error) {
    console.error("Error fetching order details:", error);
  }

  // If order document doesn't exist in Firestore
  if (!orderData) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 md:p-10 flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Order Not Found</h1>
        <p className="text-gray-500 mb-6">The order ID &quot;{orderId}&quot; does not exist in the database.</p>
        <Link
          href="/admin/orders"
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <FiArrowLeft /> Back to Orders
        </Link>
      </div>
    );
  }

  // Normalize data safely
  const status = orderData.status || orderData.orderStatus || "Pending";
  const paymentStatus = orderData.paymentStatus || orderData.payment_status || "Unpaid";
  const customerName = orderData.customerName || orderData.name || orderData.userEmail?.split("@")[0] || "Guest Customer";
  const customerEmail = orderData.userEmail || orderData.email || "No Email Provided";
  
  // Date formatting
  const rawDate = orderData.createdAt || orderData.created_at || orderData.date || orderData.timestamp;
  let dateObj = null;
  if (rawDate) {
    if (typeof rawDate.toDate === "function") dateObj = rawDate.toDate();
    else if (rawDate?.seconds) dateObj = new Date(rawDate.seconds * 1000);
    else if (typeof rawDate === "number") dateObj = new Date(rawDate > 1e11 ? rawDate : rawDate * 1000);
    else if (typeof rawDate === "string") dateObj = new Date(rawDate);
  }
  const formattedDate = dateObj && !isNaN(dateObj.getTime())
    ? dateObj.toLocaleString("en-US", { month: "short", day: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })
    : "N/A";

  // Total pricing
  const totalAmount = typeof orderData.total === "number" 
    ? orderData.total 
    : parseFloat(orderData.totalAmount || orderData.amount || orderData.total || 0);

  // Items list parsing
  const items = Array.isArray(orderData.items) ? orderData.items : [];

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-10">
      {/* Top Navigation */}
      <div className="mb-6">
        <Link
          href="/admin/orders"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-indigo-600 transition-colors mb-4"
        >
          <FiArrowLeft /> Back to Orders
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <FiShoppingBag className="text-indigo-600" /> Order Details
            </h1>
            <p className="text-gray-600 text-sm mt-1">
              Viewing complete breakdown for database ID: <span className="font-mono text-gray-800">{orderData.id}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Main Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side: Order Items & Overview */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Purchased Items</h2>
            
            {items.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {items.map((item, idx) => (
                  <div key={idx} className="py-3 flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-gray-800">{item.name || item.title || "Store Item"}</p>
                      <p className="text-xs text-gray-500">Qty: {item.quantity || item.qty || 1}</p>
                    </div>
                    <p className="font-semibold text-gray-900">
                      ₦{((item.price || 0) * (item.quantity || item.qty || 1)).toLocaleString("en-NG", { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No structured items array found for this order. Total recorded amount applies.</p>
            )}

            <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between text-base font-bold text-gray-900">
              <span>Total Amount</span>
              <span className="text-indigo-600 text-xl">
                ₦{totalAmount.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>

        {/* Right Side: Customer & Status Meta */}
        <div className="space-y-6">
          {/* Customer Meta */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Customer Information</h2>
            <div className="space-y-3 text-sm text-gray-600">
              <div className="flex items-center gap-3">
                <FiUser className="text-gray-400" size={16} />
                <span className="font-semibold text-gray-800">{customerName}</span>
              </div>
              <div className="flex items-center gap-3">
                <FiMail className="text-gray-400" size={16} />
                <span className="text-gray-600">{customerEmail}</span>
              </div>
              <div className="flex items-center gap-3">
                <FiCalendar className="text-gray-400" size={16} />
                <span className="text-gray-600">{formattedDate}</span>
              </div>
            </div>
          </div>

          {/* Status Meta */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Status & Payment</h2>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-gray-400 uppercase font-semibold mb-1">Fulfillment Status</p>
                <span className={`inline-flex items-center gap-1 text-xs font-semibold px-3 py-1 rounded-full ${
                  status === "Completed" || status === "Delivered" ? "bg-emerald-50 text-emerald-700" :
                  status === "Processing" ? "bg-blue-50 text-blue-700" :
                  status === "Cancelled" ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700"
                }`}>
                  {status === "Completed" ? <FiCheckCircle size={12} /> : <FiClock size={12} />} {status}
                </span>
              </div>

              <div>
                <p className="text-xs text-gray-400 uppercase font-semibold mb-1">Payment Status</p>
                <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-full ${
                  paymentStatus === "Paid" ? "bg-emerald-50 text-emerald-700" :
                  paymentStatus === "Refunded" ? "bg-gray-100 text-gray-600" : "bg-amber-50 text-amber-700"
                }`}>
                  {paymentStatus}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}