"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { FiEye, FiMoreVertical, FiCheckCircle, FiClock, FiXCircle, FiDollarSign } from "react-icons/fi";
import { updateOrderStatusAction, updatePaymentStatusAction } from "@/app/actions/orderActions";

export default function OrderActionsMenu({ orderId, currentStatus, currentPaymentStatus }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const menuRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleStatusChange = async (newStatus) => {
    setIsUpdating(true);
    setIsOpen(false);
    await updateOrderStatusAction(orderId, newStatus);
    setIsUpdating(false);
  };

  const handlePaymentStatusChange = async (newPaymentStatus) => {
    setIsUpdating(true);
    setIsOpen(false);
    await updatePaymentStatusAction(orderId, newPaymentStatus);
    setIsUpdating(false);
  };

  return (
    <div className="flex items-center justify-end gap-2 relative" ref={menuRef}>
      {/* View Details Button */}
      <Link
        href={`/admin/orders/${orderId}`}
        className="text-gray-500 hover:text-indigo-600 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
        title="View Details"
      >
        <FiEye size={16} />
      </Link>

      {/* Action Menu Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isUpdating}
        className={`p-1.5 rounded-lg transition-colors ${
          isOpen ? "bg-gray-200 text-gray-800" : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
        } ${isUpdating ? "opacity-50 cursor-not-allowed" : ""}`}
        title="Quick Actions"
      >
        <FiMoreVertical size={16} />
      </button>

      {/* Action Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 top-8 z-50 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-2 text-left text-xs">
          <div className="px-3 py-1 font-semibold text-gray-400 uppercase tracking-wider text-[10px]">
            Fulfillment Status
          </div>

          {currentStatus !== "Processing" && (
            <button
              onClick={() => handleStatusChange("Processing")}
              className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-gray-50 text-blue-600 transition-colors"
            >
              <FiClock size={14} /> Mark Processing
            </button>
          )}

          {currentStatus !== "Completed" && (
            <button
              onClick={() => handleStatusChange("Completed")}
              className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-gray-50 text-emerald-600 transition-colors"
            >
              <FiCheckCircle size={14} /> Mark Completed
            </button>
          )}

          {currentStatus !== "Cancelled" && (
            <button
              onClick={() => handleStatusChange("Cancelled")}
              className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-gray-50 text-red-600 transition-colors"
            >
              <FiXCircle size={14} /> Cancel Order
            </button>
          )}

          <div className="my-1 border-t border-gray-100" />

          <div className="px-3 py-1 font-semibold text-gray-400 uppercase tracking-wider text-[10px]">
            Payment Status
          </div>

          {currentPaymentStatus !== "Paid" && (
            <button
              onClick={() => handlePaymentStatusChange("Paid")}
              className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-gray-50 text-emerald-600 transition-colors"
            >
              <FiDollarSign size={14} /> Mark as Paid
            </button>
          )}

          {currentPaymentStatus !== "Refunded" && (
            <button
              onClick={() => handlePaymentStatusChange("Refunded")}
              className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-gray-50 text-gray-600 transition-colors"
            >
              <FiDollarSign size={14} /> Mark as Refunded
            </button>
          )}
        </div>
      )}
    </div>
  );
}