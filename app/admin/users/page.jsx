import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { adminEmails } from "@/lib/authorizeAdmin";
import { db } from "@/lib/firebaseConfig";
import { collection, getDocs } from "firebase/firestore";
import { 
  FiUsers, 
  FiSearch, 
  FiUserCheck, 
  FiShield, 
  FiMoreVertical, 
  FiArrowLeft 
} from "react-icons/fi";
import Link from "next/link";

export default async function TotalUsersPage() {
  // 1. Check Authentication & Authorization
  const session = await auth();

  if (!session || !session.user) {
    redirect("/auth/signin?callbackUrl=/admin/users");
  }

  const isAdmin = adminEmails?.includes(session.user.email);
  if (!isAdmin) {
    redirect("/?error=unauthorized");
  }

  // 2. Fetch Users Data from Firestore
  let users = [];
  let totalRegistered = 0;
  let adminCount = 0;
  let activeTodayCount = 0;
  let newThisMonthCount = 0;

  try {
    const usersSnapshot = await getDocs(collection(db, "users"));
    totalRegistered = usersSnapshot.size;

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    users = usersSnapshot.docs.map((docSnap) => {
      const data = docSnap.data();

      // DEBUG: Log fields to terminal so you can verify key names
      // console.log("User Doc Data:", data);

      const userEmail = data.email || "No Email Provided";
      const isUserAdmin = adminEmails?.includes(userEmail) || data.role?.toLowerCase() === "admin";

      if (isUserAdmin) adminCount++;

      // Check all possible field names where date might be saved
      const rawCreatedAt = 
        data.createdAt || 
        data.created_at || 
        data.timestamp || 
        data.joinedDate || 
        data.registeredAt || 
        data.dateJoined || 
        data.created || 
        data.date ||
        data.metadata?.creationTime; // Firebase Auth metadata if synced

      let joinedDateObj = null;

      if (rawCreatedAt) {
        if (typeof rawCreatedAt.toDate === "function") {
          // Firebase Timestamp object
          joinedDateObj = rawCreatedAt.toDate();
        } else if (rawCreatedAt?.seconds) {
          // Raw object with seconds { seconds: 1700000000, nanoseconds: 0 }
          joinedDateObj = new Date(rawCreatedAt.seconds * 1000);
        } else if (typeof rawCreatedAt === "number") {
          // Unix Timestamp
          joinedDateObj = new Date(rawCreatedAt > 1e11 ? rawCreatedAt : rawCreatedAt * 1000);
        } else if (typeof rawCreatedAt === "string") {
          // ISO String or formatted string
          joinedDateObj = new Date(rawCreatedAt);
        }
      }

      // Check if date is valid
      const isValidDate = joinedDateObj && !isNaN(joinedDateObj.getTime());

      // Metric calculation for "New This Month"
      if (isValidDate && joinedDateObj >= startOfMonth) {
        newThisMonthCount++;
      }

      // Check common timestamp field names for last active
      const rawLastActive = 
        data.lastActive || 
        data.last_active || 
        data.lastSeen || 
        data.updatedAt || 
        data.updated_at;

      let lastActiveObj = null;

      if (rawLastActive) {
        if (typeof rawLastActive.toDate === "function") {
          lastActiveObj = rawLastActive.toDate();
        } else if (rawLastActive?.seconds) {
          lastActiveObj = new Date(rawLastActive.seconds * 1000);
        } else if (typeof rawLastActive === "number") {
          lastActiveObj = new Date(rawLastActive > 1e11 ? rawLastActive : rawLastActive * 1000);
        } else if (typeof rawLastActive === "string") {
          lastActiveObj = new Date(rawLastActive);
        }
      }

      const isValidLastActive = lastActiveObj && !isNaN(lastActiveObj.getTime());

      if (isValidLastActive && lastActiveObj >= startOfToday) {
        activeTodayCount++;
      }

      return {
        id: docSnap.id,
        name: data.displayName || data.name || userEmail.split("@")[0] || "Unnamed User",
        email: userEmail,
        role: isUserAdmin ? "Admin" : "Customer",
        status: data.status || "Active",
        joinedDate: isValidDate
          ? joinedDateObj.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" })
          : "N/A",
        lastActive: isValidLastActive
          ? lastActiveObj.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
          : "Recently",
      };
    });
  } catch (error) {
    console.error("Error fetching users from Firestore:", error);
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
              <FiUsers className="text-indigo-600" /> User Management
            </h1>
            <p className="text-gray-600 text-sm mt-1">
              View, filter, and manage registered accounts.
            </p>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
          <p className="text-sm text-gray-500 font-medium">Total Registered</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {totalRegistered.toLocaleString()}
          </p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
          <p className="text-sm text-gray-500 font-medium">Active Today</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">
            {activeTodayCount.toLocaleString()}
          </p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
          <p className="text-sm text-gray-500 font-medium">Admins</p>
          <p className="text-2xl font-bold text-indigo-600 mt-1">
            {adminCount}
          </p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
          <p className="text-sm text-gray-500 font-medium">New This Month</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">
            {newThisMonthCount.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Main Users Table Section */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Table Search & Filter Bar */}
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or email..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select className="w-full sm:w-auto text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20">
              <option value="all">All Roles</option>
              <option value="admin">Admin</option>
              <option value="customer">Customer</option>
            </select>
            <select className="w-full sm:w-auto text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20">
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        {/* User Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 text-gray-700 font-semibold border-b border-gray-100">
              <tr>
                <th className="py-3.5 px-4">User</th>
                <th className="py-3.5 px-4">Role</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Joined</th>
                <th className="py-3.5 px-4">Last Active</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.length > 0 ? (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                    {/* User Info */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm uppercase">
                          {user.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{user.name}</p>
                          <p className="text-xs text-gray-500">{user.email}</p>
                        </div>
                      </div>
                    </td>

                    {/* Role */}
                    <td className="py-3.5 px-4">
                      {user.role === "Admin" ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700">
                          <FiShield size={12} /> Admin
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-gray-100 text-gray-700">
                          <FiUserCheck size={12} /> Customer
                        </span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 text-xs font-semibold rounded-full ${
                          user.status.toLowerCase() === "active"
                            ? "bg-green-50 text-green-700"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {user.status}
                      </span>
                    </td>

                    {/* Joined Date */}
                    <td className="py-3.5 px-4 text-gray-500">{user.joinedDate}</td>

                    {/* Last Active */}
                    <td className="py-3.5 px-4 text-gray-500">{user.lastActive}</td>

                    {/* Action Menu */}
                    <td className="py-3.5 px-4 text-right">
                      <button className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                        <FiMoreVertical size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-500">
                    No users found in Firestore database.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Pagination */}
        <div className="p-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
          <p>
            Showing {users.length > 0 ? 1 : 0} to {users.length} of {totalRegistered} users
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