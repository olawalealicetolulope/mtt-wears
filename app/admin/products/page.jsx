import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { adminEmails } from "@/lib/authorizeAdmin";
import { db } from "@/lib/firebaseConfig"; // Make sure path matches your lib/firebase file
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import Link from "next/link";
import Image from "next/image";
import DeleteProductButton from "./DeleteProductButton";
import {
  FiPackage,
  FiPlus,
  FiSearch,
  FiArrowLeft,
  FiEdit,
  FiMoreVertical,
  FiTag,
  FiAlertCircle,
} from "react-icons/fi";

export const revalidate = 0; // Ensures fresh inventory data on every request

export default async function AdminProductsPage() {
  // 1. Authentication & Admin Authorization Check
  const session = await auth();

  if (!session || !session.user) {
    redirect("/auth/signin?callbackUrl=/admin/products");
  }

  const isAdmin = adminEmails?.includes(session.user.email);
  if (!isAdmin) {
    redirect("/?error=unauthorized");
  }

  // 2. Fetch Live Products from Firestore
  let products = [];
  try {
    const productsRef = collection(db, "products");
    const q = query(productsRef, orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);

    products = querySnapshot.docs.map((doc) => {
      const data = doc.data();

      // Determine inventory status dynamically based on stock
      let stockStatus = "In Stock";
      if (data.stock <= 0) {
        stockStatus = "Out of Stock";
      } else if (data.stock < 10) {
        stockStatus = "Low Stock";
      }

      return {
        id: doc.id,
        name: data.name || "Untitled Product",
        category: data.category || "Uncategorized",
        price: typeof data.price === "number" ? data.price : parseFloat(data.price || "0"),
        stock: data.stock || 0,
        status: stockStatus,
        image: data.images && data.images.length > 0 ? data.images[0] : "/logo1.jpg",
      };
    });
  } catch (error) {
    console.error("Error fetching Firestore products:", error);
  }

  // 3. Compute Real Metrics
  const totalProducts = products.length;
  const inStockCount = products.filter((p) => p.stock >= 10).length;
  const lowOrOutStockCount = products.filter((p) => p.stock < 10).length;
  const uniqueCategories = new Set(products.map((p) => p.category)).size;

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
              <FiPackage className="text-indigo-600" /> Product Inventory
            </h1>
            <p className="text-gray-600 text-sm mt-1">
              Add new apparel, manage prices, update stock levels, and organize categories.
            </p>
          </div>

          <Link
            href="/admin/products/new"
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors shadow-sm w-fit"
          >
            <FiPlus size={18} /> Add New Product
          </Link>
        </div>
      </div>

      {/* Dynamic Product Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
          <p className="text-sm text-gray-500 font-medium">Total Products</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{totalProducts}</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
          <p className="text-sm text-gray-500 font-medium">In Stock Items</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{inStockCount}</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
          <p className="text-sm text-gray-500 font-medium">Low / Out of Stock</p>
          <p className="text-2xl font-bold text-amber-600 mt-1">{lowOrOutStockCount}</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
          <p className="text-sm text-gray-500 font-medium">Active Categories</p>
          <p className="text-2xl font-bold text-indigo-600 mt-1">{uniqueCategories}</p>
        </div>
      </div>

      {/* Main Inventory Section */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Search & Filter Controls */}
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by product title or SKU..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select className="w-full sm:w-auto text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20">
              <option value="all">All Categories</option>
              <option value="tshirts">T-Shirts</option>
              <option value="hoodies">Hoodies</option>
              <option value="pants">Pants</option>
              <option value="accessories">Accessories</option>
            </select>
            <select className="w-full sm:w-auto text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20">
              <option value="all">Stock Availability</option>
              <option value="instock">In Stock</option>
              <option value="lowstock">Low Stock</option>
              <option value="outofstock">Out of Stock</option>
            </select>
          </div>
        </div>

        {/* Product Catalog Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 text-gray-700 font-semibold border-b border-gray-100">
              <tr>
                <th className="py-3.5 px-4">Item Details</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Price</th>
                <th className="py-3.5 px-4">Stock Level</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {products.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-500">
                    No products found. Click <strong>Add New Product</strong> to get started.
                  </td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50/50 transition-colors">
                    {/* Product Title & Image */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="relative w-11 h-11 rounded-lg overflow-hidden border border-gray-200 bg-gray-100 flex-shrink-0">
                          <Image
                            src={product.image}
                            alt={product.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{product.name}</p>
                          <p className="text-xs font-mono text-gray-400">{product.id}</p>
                        </div>
                      </div>
                    </td>

                    {/* Category Tag */}
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-md bg-gray-100 text-gray-700 capitalize">
                        <FiTag size={12} /> {product.category}
                      </span>
                    </td>

                    {/* Price (Updated to Naira) */}
                    <td className="py-3.5 px-4 font-semibold text-gray-900">
                      ₦{product.price.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>

                    {/* Stock Level */}
                    <td className="py-3.5 px-4 text-gray-700 font-medium">
                      {product.stock} units
                    </td>

                    {/* Stock Status Badge */}
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-semibold rounded-full ${
                          product.status === "In Stock"
                            ? "bg-emerald-50 text-emerald-700"
                            : product.status === "Low Stock"
                            ? "bg-amber-50 text-amber-700"
                            : "bg-red-50 text-red-700"
                        }`}
                      >
                        {product.status === "Out of Stock" && <FiAlertCircle size={12} />}
                        {product.status}
                      </span>
                    </td>

                    {/* Actions Column */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`/admin/products/edit/${product.id}`}
                          className="text-gray-500 hover:text-indigo-600 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                          title="Edit Product"
                        >
                          <FiEdit size={16} />
                        </Link>

                        <DeleteProductButton
                          productId={product.id}
                          productName={product.name}
                        />

                        <button className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                          <FiMoreVertical size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Pagination */}
        <div className="p-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
          <p>Showing {products.length} item(s)</p>
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