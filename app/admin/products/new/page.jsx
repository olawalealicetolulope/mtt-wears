"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebaseConfig"; // Adjust to match your config file path
import { collection, addDoc } from "firebase/firestore";
import {
  FiArrowLeft,
  FiUploadCloud,
  FiPackage,
  FiTag,
  FiPlusCircle,
  FiCheck,
  FiX,
  FiLoader,
} from "react-icons/fi";

// Helper: Convert File to Base64 string for direct Firestore saving
const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
};

export default function AddProductPage() {
  const router = useRouter();

  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Handle local file selection and create previews
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    setSelectedFiles((prev) => [...prev, ...files]);

    const newPreviews = files.map((file) => URL.createObjectURL(file));
    setPreviews((prev) => [...prev, ...newPreviews]);
  };

  // Remove preview & file before submit
  const handleRemoveImage = (index) => {
    URL.revokeObjectURL(previews[index]);
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  // Form submit handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const formData = new FormData(e.currentTarget);

      // 1. Convert uploaded files directly to Base64 strings (No Storage required)
      let base64Images = [];
      if (selectedFiles.length > 0) {
        base64Images = await Promise.all(
          selectedFiles.map((file) => fileToBase64(file))
        );
      }

      // 2. Format tags input
      const tagsInput = formData.get("tags") || "";
      const tags = tagsInput
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean);

      // 3. Store product directly in Firestore
      await addDoc(collection(db, "products"), {
        name: formData.get("name"),
        description: formData.get("description"),
        price: parseFloat(formData.get("price") || "0"),
        salePrice: formData.get("salePrice")
          ? parseFloat(formData.get("salePrice"))
          : null,
        stock: parseInt(formData.get("stock") || "0", 10),
        sku: formData.get("sku"),
        status: formData.get("status"),
        isFeatured: formData.get("isFeatured") === "on",
        category: formData.get("category"),
        tags: tags,
        images: base64Images, // Saved directly to document
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      // 4. Redirect on success
      router.push("/admin/products");
      router.refresh();
    } catch (error) {
      console.error("Error creating product:", error);
      setErrorMessage(
        error.message || "Failed to create product. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-10">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/admin/products"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-indigo-600 transition-colors mb-4"
        >
          <FiArrowLeft /> Back to Products
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <FiPlusCircle className="text-indigo-600" /> Create New Product
            </h1>
            <p className="text-gray-600 text-sm mt-1">
              Add a new apparel item or accessory to your MTT Wears catalog.
            </p>
          </div>
        </div>
      </div>

      {/* Error Message Alert */}
      {errorMessage && (
        <div className="mb-6 p-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between">
          <span>{errorMessage}</span>
          <button
            type="button"
            onClick={() => setErrorMessage("")}
            className="text-red-500 hover:text-red-700 font-bold ml-4"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Form Area */}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* General Information */}
          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-4">
            <h2 className="text-lg font-bold text-gray-800 border-b border-gray-100 pb-3">
              General Information
            </h2>

            <div>
              <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-1">
                Product Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                required
                placeholder="e.g., Oversized Heavyweight Cotton Tee"
                className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-gray-900"
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-semibold text-gray-700 mb-1">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                rows={5}
                placeholder="Detail materials, fit, care instructions, and sizing notes..."
                className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-gray-900"
              />
            </div>
          </div>

          {/* Product Images Upload */}
          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-4">
            <h2 className="text-lg font-bold text-gray-800 border-b border-gray-100 pb-3">
              Product Images
            </h2>

            <label
              htmlFor="image-upload"
              className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center hover:border-indigo-400 transition-colors bg-gray-50/50 cursor-pointer block"
            >
              <FiUploadCloud className="mx-auto text-4xl text-gray-400 mb-3" />
              <p className="text-sm font-medium text-gray-700">
                Click to upload or drag and drop files here
              </p>
              <p className="text-xs text-gray-400 mt-1">
                PNG, JPG, or WEBP (Saved to Firestore)
              </p>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
                id="image-upload"
              />
            </label>

            {/* Previews */}
            {previews.length > 0 && (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-4 pt-2">
                {previews.map((src, idx) => (
                  <div
                    key={idx}
                    className="relative group rounded-lg overflow-hidden border border-gray-200 aspect-square"
                  >
                    <img
                      src={src}
                      alt={`Preview ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(idx)}
                      className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 opacity-90 hover:opacity-100 transition-opacity"
                    >
                      <FiX className="text-xs" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pricing & Inventory */}
          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-4">
            <h2 className="text-lg font-bold text-gray-800 border-b border-gray-100 pb-3">
              Pricing & Inventory
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="price" className="block text-sm font-semibold text-gray-700 mb-1">
                  Regular Price (₦) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">
                    ₦
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    id="price"
                    name="price"
                    required
                    placeholder="25000.00"
                    className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-gray-900"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="salePrice" className="block text-sm font-semibold text-gray-700 mb-1">
                  Sale Price (₦)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">
                    ₦
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    id="salePrice"
                    name="salePrice"
                    placeholder="20000.00"
                    className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-gray-900"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="stock" className="block text-sm font-semibold text-gray-700 mb-1">
                  Stock Quantity <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <FiPackage className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="number"
                    id="stock"
                    name="stock"
                    required
                    placeholder="100"
                    className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-gray-900"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="sku" className="block text-sm font-semibold text-gray-700 mb-1">
                  SKU (Stock Keeping Unit)
                </label>
                <input
                  type="text"
                  id="sku"
                  name="sku"
                  placeholder="MTT-TEE-001"
                  className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-gray-900"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Controls */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-4">
            <h2 className="text-lg font-bold text-gray-800 border-b border-gray-100 pb-3">
              Publish
            </h2>

            <div>
              <label htmlFor="status" className="block text-sm font-semibold text-gray-700 mb-1">
                Visibility Status
              </label>
              <select
                id="status"
                name="status"
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-gray-900"
              >
                <option value="active">Active (Published on Store)</option>
                <option value="draft">Draft (Hidden)</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="isFeatured"
                name="isFeatured"
                className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
              />
              <label htmlFor="isFeatured" className="text-sm font-medium text-gray-700">
                Mark as Featured Product
              </label>
            </div>

            <div className="pt-4 border-t border-gray-100">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-medium py-2.5 rounded-lg transition-colors text-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <FiLoader className="animate-spin" /> Saving...
                  </>
                ) : (
                  <>
                    <FiCheck /> Save Product
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-4">
            <h2 className="text-lg font-bold text-gray-800 border-b border-gray-100 pb-3">
              Organization
            </h2>

            <div>
              <label htmlFor="category" className="block text-sm font-semibold text-gray-700 mb-1">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                id="category"
                name="category"
                required
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-gray-900"
              >
                <option value="">Select Category</option>
                <option value="tshirts">T-Shirts</option>
                <option value="hoodies">Hoodies & Sweatshirts</option>
                <option value="pants">Pants & Shorts</option>
                <option value="jackets">Jackets & Outerwear</option>
                <option value="accessories">Caps</option>
              </select>
            </div>

            <div>
              <label htmlFor="tags" className="block text-sm font-semibold text-gray-700 mb-1">
                Tags
              </label>
              <div className="relative">
                <FiTag className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  id="tags"
                  name="tags"
                  placeholder="Streetwear, Summer, Unisex (comma separated)"
                  className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-gray-900"
                />
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}