import { auth, signOut } from "@/auth";
import { redirect } from "next/navigation";
import { adminEmails } from "@/lib/authorizeAdmin";
import Link from "next/link";
import { db } from "@/lib/firebaseConfig";
import { collection, getDocs } from "firebase/firestore";
import { 
  FiUsers, 
  FiShoppingBag, 
  FiDollarSign, 
  FiShield, 
  FiLogOut, 
  FiChevronRight 
} from "react-icons/fi";

export default async function AdminDashboardPage() {
  // 1. Fetch current session with Auth.js v5
  const session = await auth();

  // 2. Redirect unauthenticated users
  if (!session || !session.user) {
    redirect("/auth/signin?callbackUrl=/admin");
  }

  // 3. Verify admin access
  const isAdmin = adminEmails?.includes(session.user.email);

  if (!isAdmin) {
    redirect("/?error=unauthorized");
  }

  // 4. Fetch Live Data from Firestore
  let totalUsers = 0;
  let totalOrders = 0;
  let grossRevenue = 0;

  try {
    // Fetch users collection count
    const usersSnapshot = await getDocs(collection(db, "users"));
    totalUsers = usersSnapshot.size;

    // Fetch orders collection & calculate metrics
    const ordersSnapshot = await getDocs(collection(db, "orders"));
    totalOrders = ordersSnapshot.size;

    ordersSnapshot.docs.forEach((docSnap) => {
      const data = docSnap.data();

      // Extract amount and check refund status
      const rawTotal = data.total ?? data.totalAmount ?? data.amount ?? 0;
      const amount = typeof rawTotal === "number" ? rawTotal : parseFloat(rawTotal || 0);
      const status = data.status || data.orderStatus || data.paymentStatus || "Completed";
      
      const isRefunded = status.toLowerCase() === "refunded" || status.toLowerCase() === "cancelled";

      if (!isRefunded) {
        grossRevenue += amount;
      }
    });
  } catch (error) {
    console.error("Error fetching admin metrics from Firestore:", error);
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 pb-4 border-b bg-white p-6 rounded-xl shadow-sm">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <FiShield className="text-indigo-600" /> MTT Admin Dashboard
          </h1>
          <p className="text-gray-600 text-sm mt-1">
            Logged in as <span className="font-semibold text-gray-800">{session.user.email}</span>
          </p>
        </div>

        <div className="flex items-center gap-4 mt-4 md:mt-0">
          <span className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-xs font-semibold">
            Authorized Admin
          </span>

          {/* v5 Sign Out using Server Action */}
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/auth/signin" });
            }}
          >
            <button
              type="submit"
              className="flex items-center gap-2 text-sm text-red-600 hover:text-red-800 border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
            >
              <FiLogOut /> Sign Out
            </button>
          </form>
        </div>
      </div>

      {/* Dynamic Overview Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {/* Total Users Card */}
        <Link
          href="/admin/users"
          className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-md hover:border-indigo-200 transition-all group"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <FiUsers size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Total Users</p>
              <p className="text-2xl font-bold text-gray-800">
                {totalUsers.toLocaleString()}
              </p>
            </div>
          </div>
          <FiChevronRight className="text-gray-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" size={20} />
        </Link>

        {/* Total Orders Card */}
        <Link
          href="/admin/orders"
          className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-md hover:border-indigo-200 transition-all group"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-50 text-green-600 rounded-lg group-hover:bg-green-600 group-hover:text-white transition-colors">
              <FiShoppingBag size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Total Orders</p>
              <p className="text-2xl font-bold text-gray-800">
                {totalOrders.toLocaleString()}
              </p>
            </div>
          </div>
          <FiChevronRight className="text-gray-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" size={20} />
        </Link>

        {/* Revenue Card */}
        <Link
          href="/admin/revenue"
          className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-md hover:border-indigo-200 transition-all group"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <FiDollarSign size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Gross Revenue</p>
              <p className="text-2xl font-bold text-gray-800">
                ₦{grossRevenue.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
          </div>
          <FiChevronRight className="text-gray-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" size={20} />
        </Link>
      </div>

      {/* Management Actions */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Quick Management</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link
            href="/admin/products"
            className="p-4 border border-gray-200 rounded-lg hover:border-indigo-500 hover:shadow-md transition-all block"
          >
            <h3 className="font-semibold text-gray-800">Manage Products</h3>
            <p className="text-sm text-gray-500 mt-1">Add, edit, or remove store items.</p>
          </Link>

          <Link
            href="/admin/orders"
            className="p-4 border border-gray-200 rounded-lg hover:border-indigo-500 hover:shadow-md transition-all block"
          >
            <h3 className="font-semibold text-gray-800">Manage Orders</h3>
            <p className="text-sm text-gray-500 mt-1">View order statuses and fulfillments.</p>
          </Link>
        </div>
      </div>
    </div>
  );
}