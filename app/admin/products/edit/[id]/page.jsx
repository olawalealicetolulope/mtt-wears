"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebaseConfig";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import {
  FiArrowLeft,
  FiUploadCloud,
  FiCheck,
  FiX,
  FiLoader,
} from "react-icons/fi";

// Utility to convert user-uploaded files to base64 strings
const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
};

export default function EditProductPage({ params: paramsPromise }) {
  const router = useRouter();
  const params = use(paramsPromise);
  const productId = params.id;

  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    stock: "",
    sku: "",
    category: "",
  });

  const [existingImages, setExistingImages] = useState([]);
  const [newFiles, setNewFiles] = useState([]);
  const [newPreviews, setNewPreviews] = useState([]);

  // Fetch product data on load
  useEffect(() => {
    async function fetchProduct() {
      try {
        const docRef = doc(db, "products", productId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setFormData({
            name: data.name || "",
            description: data.description || "",
            price: data.price ? String(data.price) : "",
            stock: data.stock !== undefined ? String(data.stock) : "",
            sku: data.sku || "",
            category: data.category || "",
          });
          setExistingImages(data.images || []);
        } else {
          setErrorMessage("Product not found in database.");
        }
      } catch (err) {
        console.error("Error fetching product:", err);
        setErrorMessage("Failed to load product details.");
      } finally {
        setLoading(false);
      }
    }

    if (productId) fetchProduct();
  }, [productId]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    setNewFiles((prev) => [...prev, ...files]);
    const previews = files.map((file) => URL.createObjectURL(file));
    setNewPreviews((prev) => [...prev, ...previews]);
  };

  const handleRemoveExistingImage = (index) => {
    setExistingImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleRemoveNewImage = (index) => {
    URL.revokeObjectURL(newPreviews[index]);
    setNewFiles((prev) => prev.filter((_, i) => i !== index));
    setNewPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage("");

    try {
      let uploadedBase64Images = [];
      if (newFiles.length > 0) {
        uploadedBase64Images = await Promise.all(
          newFiles.map((file) => fileToBase64(file))
        );
      }

      const allImages = [...existingImages, ...uploadedBase64Images];

      const docRef = doc(db, "products", productId);
      await updateDoc(docRef, {
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price || "0"),
        stock: parseInt(formData.stock || "0", 10),
        sku: formData.sku,
        category: formData.category,
        images: allImages,
        updatedAt: new Date().toISOString(),
      });

      router.push("/admin/products");
      router.refresh();
    } catch (error) {
      console.error("Error updating product:", error);
      setErrorMessage("Failed to save changes. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="flex items-center gap-3 text-gray-600 font-medium">
          <FiLoader className="animate-spin text-indigo-600 text-2xl" />
          Fetching product details...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-10">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <Link
            href="/admin/products"
            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-indigo-600 transition-colors mb-4"
          >
            <FiArrowLeft /> Back to Inventory
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Edit Product</h1>
        </div>

        {errorMessage && (
          <div className="p-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Main Info */}
          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-4">
            <h2 className="text-lg font-bold text-gray-800 border-b border-gray-100 pb-3">
              General Details
            </h2>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Product Name *
              </label>
              <input
                type="text"
                name="name"
                required
                value={formData.name}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg text-gray-900 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Description
              </label>
              <textarea
                name="description"
                rows={4}
                value={formData.description}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg text-gray-900 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
              />
            </div>
          </div>

          {/* Pricing, Stock & Category */}
          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-4">
            <h2 className="text-lg font-bold text-gray-800 border-b border-gray-100 pb-3">
              Inventory & Pricing
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Price ($ / ₦) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  name="price"
                  required
                  value={formData.price}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg text-gray-900 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Stock Units *
                </label>
                <input
                  type="number"
                  name="stock"
                  required
                  value={formData.stock}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg text-gray-900 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Category *
                </label>
                <input
                  type="text"
                  name="category"
                  required
                  value={formData.category}
                  onChange={handleInputChange}
                  placeholder="e.g. Accessories, Hoodies, T-Shirts"
                  className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg text-gray-900 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  SKU / Identifier
                </label>
                <input
                  type="text"
                  name="sku"
                  value={formData.sku}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg text-gray-900 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Media Section */}
          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-4">
            <h2 className="text-lg font-bold text-gray-800 border-b border-gray-100 pb-3">
              Product Images
            </h2>
            <label className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:border-indigo-400 transition-colors bg-gray-50/50 cursor-pointer block">
              <FiUploadCloud className="mx-auto text-3xl text-gray-400 mb-2" />
              <p className="text-sm font-medium text-gray-700">
                Click to upload additional product images
              </p>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>

            <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 pt-2">
              {existingImages.map((src, idx) => (
                <div
                  key={`exist-${idx}`}
                  className="relative rounded-lg overflow-hidden border border-gray-200 aspect-square group"
                >
                  <img src={src} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => handleRemoveExistingImage(idx)}
                    className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 text-xs shadow-md"
                  >
                    <FiX />
                  </button>
                </div>
              ))}
              {newPreviews.map((src, idx) => (
                <div
                  key={`new-${idx}`}
                  className="relative rounded-lg overflow-hidden border-2 border-indigo-400 aspect-square group"
                >
                  <img src={src} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => handleRemoveNewImage(idx)}
                    className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 text-xs shadow-md"
                  >
                    <FiX />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex items-center justify-end gap-3 pt-4">
            <Link
              href="/admin/products"
              className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 rounded-lg transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-medium px-6 py-2.5 rounded-lg transition-colors text-sm shadow-sm"
            >
              {isSubmitting ? (
                <>
                  <FiLoader className="animate-spin" /> Saving...
                </>
              ) : (
                <>
                  <FiCheck size={18} /> Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}