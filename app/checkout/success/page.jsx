"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { 
  FiCheckCircle, 
  FiPackage, 
  FiArrowRight, 
  FiPrinter, 
  FiShoppingBag,
  FiMapPin,
  FiCreditCard,
  FiLoader
} from "react-icons/fi";
import { db } from "@/lib/firebaseConfig";
import { collection, query, where, getDocs } from "firebase/firestore";

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const reference = searchParams.get("reference");

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchOrderByReference() {
      if (!reference) {
        setError("No transaction reference found in URL.");
        setLoading(false);
        return;
      }

      try {
        const ordersRef = collection(db, "orders");
        const q = query(ordersRef, where("reference", "==", reference));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const docSnap = querySnapshot.docs[0];
          const data = docSnap.data();

          const formattedOrder = {
            id: data.reference || docSnap.id,
            date: data.createdAt 
              ? new Date(data.createdAt).toLocaleDateString("en-NG", { year: "numeric", month: "long", day: "numeric" }) 
              : new Date().toLocaleDateString("en-NG", { year: "numeric", month: "long", day: "numeric" }),
            customer: {
              name: data.shippingAddress?.fullName || data.customerName || "Valued Customer",
              email: data.userEmail || "N/A",
              address: data.shippingAddress 
                ? `${data.shippingAddress.address}, ${data.shippingAddress.city}, ${data.shippingAddress.state}` 
                : "Address not provided",
            },
            paymentMethod: "Paystack / Card",
            items: Array.isArray(data.items) ? data.items.map((item, index) => ({
              id: item.id || index,
              name: item.title || item.name || "Store Item",
              quantity: item.quantity || item.qty || 1,
              price: Number(item.price || item.unitPrice || 0),
              image: item.image || item.imageUrl || "/placeholder-apparel.jpg",
              size: item.size || "Standard"
            })) : [],
            subtotal: Number(data.subtotalAmount || 0),
            shippingFee: Number(data.shippingFee || 0),
            total: Number(data.totalAmount || 0),
          };

          setOrder(formattedOrder);
        } else {
          setError("Order details could not be found for this reference.");
        }
      } catch (err) {
        console.error("Error fetching order from Firestore:", err);
        setError("An error occurred while fetching your order details.");
      } finally {
        setLoading(false);
      }
    }

    fetchOrderByReference();
  }, [reference]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
        <FiLoader className="w-10 h-10 text-indigo-600 animate-spin mb-4" />
        <h2 className="text-lg font-bold text-gray-800">Verifying transaction & loading order...</h2>
        <p className="text-xs text-gray-500 mt-1">Reference: {reference || "Searching..."}</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center text-red-600 mb-4">
          <FiShoppingBag className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Order Not Found</h1>
        <p className="text-gray-600 max-w-md text-sm mb-6">{error || "We could not locate this order in our system."}</p>
        <Link
          href="/shop"
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors text-sm shadow-sm inline-flex items-center gap-2"
        >
          Return to Shop <FiArrowRight />
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4 sm:px-6 lg:px-8 print:bg-white print:py-0">
      <div className="max-w-3xl mx-auto space-y-8">
        
        {/* Header Badge */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-100 rounded-full text-emerald-600 mb-2">
            <FiCheckCircle className="w-10 h-10" />
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            Payment Successful!
          </h1>
          <p className="text-gray-600 max-w-md mx-auto text-sm">
            Thank you for your order. We’ve sent a confirmation email to{" "}
            <span className="font-semibold text-gray-800">{order.customer.email}</span>.
          </p>
        </div>

        {/* Action Bar */}
        <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-gray-100 shadow-sm print:hidden">
          <div className="text-sm">
            <span className="text-gray-500">Transaction Ref: </span>
            <span className="font-bold text-gray-900">{order.id}</span>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-2 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-lg transition-colors"
            >
              <FiPrinter /> Print Receipt
            </button>
          </div>
        </div>

        {/* Receipt Container */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden p-6 sm:p-8 space-y-8">
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pb-6 border-b border-gray-100 text-sm">
            <div>
              <p className="text-gray-400 text-xs uppercase font-medium">Order Date</p>
              <p className="font-semibold text-gray-800 mt-1">{order.date}</p>
            </div>
            <div>
              <p className="text-gray-400 text-xs uppercase font-medium">Payment Method</p>
              <p className="font-semibold text-gray-800 mt-1 flex items-center gap-1">
                <FiCreditCard className="text-gray-400" /> {order.paymentMethod}
              </p>
            </div>
            <div>
              <p className="text-gray-400 text-xs uppercase font-medium">Status</p>
              <span className="inline-block mt-1 px-2.5 py-0.5 text-xs font-semibold bg-emerald-50 text-emerald-700 rounded-full">
                Paid
              </span>
            </div>
            <div>
              <p className="text-gray-400 text-xs uppercase font-medium">Total Amount</p>
              <p className="font-bold text-indigo-600 mt-1">
                ₦{order.total.toLocaleString()}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pb-6 border-b border-gray-100 text-sm">
            <div className="flex gap-3">
              <FiMapPin className="text-indigo-600 text-lg flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-gray-900">Shipping Address</h3>
                <p className="text-gray-600 mt-1">{order.customer.name}</p>
                <p className="text-gray-500 mt-0.5">{order.customer.address}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <FiPackage className="text-indigo-600 text-lg flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-gray-900">Estimated Delivery</h3>
                <p className="text-gray-600 mt-1">2 - 4 Business Days</p>
                <p className="text-gray-400 text-xs mt-0.5">Standard Delivery via Courier</p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <FiShoppingBag className="text-indigo-600" /> Purchased Items
            </h3>
            <div className="divide-y divide-gray-100">
              {order.items.map((item, index) => (
                <div key={index} className="py-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-14 h-14 object-cover rounded-lg border border-gray-100 bg-gray-50"
                    />
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{item.name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">Size: <span className="font-medium text-gray-700">{item.size}</span></p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Qty: {item.quantity} × ₦{item.price.toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <p className="font-bold text-gray-900 text-sm">
                    ₦{(item.quantity * item.price).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-xl space-y-2 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span>
              <span>₦{order.subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Delivery Fee</span>
              <span>₦{order.shippingFee.toLocaleString()}</span>
            </div>
            <div className="pt-2 border-t border-gray-200 flex justify-between font-bold text-gray-900 text-base">
              <span>Total Paid</span>
              <span className="text-indigo-600">₦{order.total.toLocaleString()}</span>
            </div>
          </div>

        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center print:hidden">
          <Link
            href="/shop"
            className="inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors text-sm shadow-sm"
          >
            Continue Shopping <FiArrowRight />
          </Link>
        </div>

      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <FiLoader className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    }>
      <PaymentSuccessContent />
    </Suspense>
  );
}