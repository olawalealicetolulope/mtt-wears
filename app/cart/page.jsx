'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Script from 'next/script';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { IoTrashOutline, IoAdd, IoRemove } from 'react-icons/io5';
import { db } from '@/lib/firebaseConfig';
import { 
  collection, 
  onSnapshot, 
  doc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where,
  addDoc,
  writeBatch 
} from 'firebase/firestore';

export default function CartPage() {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [discount, setDiscount] = useState(0);

  // --- SHIPPING ADDRESS STATE ---
  const [shippingAddress, setShippingAddress] = useState({
    fullName: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'Nigeria',
  });

  const router = useRouter();
  const { data: session } = useSession();
  const userId = session?.user?.email || session?.user?.id;
  const userEmail = session?.user?.email;

  // Pre-fill user name/email if session exists
  useEffect(() => {
    if (session?.user) {
      setShippingAddress((prev) => ({
        ...prev,
        fullName: session.user.name || prev.fullName,
      }));
    }
  }, [session]);

  const handleAddressChange = (e) => {
    const { name, value } = e.target;
    setShippingAddress((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // --- HELPER CALCULATOR FUNCTIONS ---
  const getUnitPrice = (item) => {
    const rawPrice = item?.price ?? item?.product?.price ?? item?.unitPrice ?? 0;
    if (typeof rawPrice === 'number') return rawPrice;
    const cleaned = String(rawPrice).replace(/[^0-9.]/g, '');
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
  };

  const getItemQuantity = (item) => {
    const rawQty = item?.quantity ?? item?.qty ?? item?.count ?? item?.product?.quantity ?? 1;
    const parsed = parseInt(rawQty, 10);
    return isNaN(parsed) || parsed < 1 ? 1 : parsed;
  };

  const getItemLineTotal = (item) => {
    return getUnitPrice(item) * getItemQuantity(item);
  };

  // --- REAL-TIME FIRESTORE LISTENER ---
  useEffect(() => {
    let cartQuery;

    if (userId) {
      cartQuery = query(collection(db, 'cart'), where('userId', '==', userId));
    } else {
      cartQuery = collection(db, 'cart');
    }

    const unsubscribe = onSnapshot(
      cartQuery,
      (snapshot) => {
        const items = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }));

        setCartItems(items);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching cart items:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userId]);

  // --- OVERALL CALCULATIONS ---
  const totalItemCount = cartItems.reduce(
    (sum, item) => sum + getItemQuantity(item), 
    0
  );

  const subtotal = cartItems.reduce(
    (acc, item) => acc + getItemLineTotal(item), 
    0
  );

  const FREE_SHIPPING_THRESHOLD = 150000; // Free shipping over ₦150,000
  const FLAT_SHIPPING_FEE = 5000; // Standard shipping fee ₦5,000

  const shipping = subtotal > FREE_SHIPPING_THRESHOLD || subtotal === 0 ? 0 : FLAT_SHIPPING_FEE;
  const total = Math.max(0, subtotal - discount + shipping);

  // Helper formatter for Naira
  const formatNaira = (amount) => {
    return `₦${amount.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // --- ACTIONS ---
  const updateQuantity = async (id, delta) => {
    const targetItem = cartItems.find((item) => item.id === id);
    if (!targetItem) return;

    const currentQty = getItemQuantity(targetItem);
    const newQty = currentQty + delta;
    if (newQty < 1) return;

    try {
      const itemRef = doc(db, 'cart', id);
      await updateDoc(itemRef, { 
        quantity: newQty,
        qty: newQty 
      });
    } catch (error) {
      console.error('Error updating quantity:', error);
    }
  };

  const removeItem = async (id) => {
    try {
      const itemRef = doc(db, 'cart', id);
      await deleteDoc(itemRef);
    } catch (error) {
      console.error('Error removing item:', error);
    }
  };

  const clearCart = async () => {
    try {
      const batch = writeBatch(db);
      cartItems.forEach((item) => {
        const docRef = doc(db, 'cart', item.id);
        batch.delete(docRef);
      });
      await batch.commit();
    } catch (error) {
      console.error('Error clearing cart:', error);
    }
  };

  const applyPromo = (e) => {
    e.preventDefault();
    if (promoCode.trim().toUpperCase() === 'MTTGLOW') {
      setDiscount(subtotal * 0.1);
    } else {
      alert('Invalid Promo Code');
    }
  };

  // --- PAYSTACK PAYMENT INTEGRATION ---
  const handlePaystackPayment = () => {
    const paystackKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY;

    if (!paystackKey) {
      alert('Paystack public key is missing! Please set NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY in your .env.local file.');
      return;
    }

    // Validate shipping address fields
    if (!shippingAddress.fullName || !shippingAddress.phone || !shippingAddress.address || !shippingAddress.city || !shippingAddress.state) {
      alert('Please fill out all required shipping address fields before checking out.');
      return;
    }

    const payerEmail = userEmail || prompt('Please enter your email for the payment receipt:');
    if (!payerEmail || !payerEmail.includes('@')) {
      alert('A valid email address is required to proceed with checkout.');
      return;
    }

    if (typeof window === 'undefined' || !window.PaystackPop) {
      alert('Paystack SDK is loading. Please try again in a moment.');
      return;
    }

    setIsProcessingPayment(true);

    const handler = window.PaystackPop.setup({
      key: paystackKey,
      email: payerEmail,
      amount: Math.round(total * 100), // Converts total Naira to Kobo for Paystack
      currency: 'NGN',
      ref: `MTT_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      metadata: {
        custom_fields: [
          {
            display_name: 'Total Items',
            variable_name: 'total_items',
            value: totalItemCount,
          },
          {
            display_name: 'Phone Number',
            variable_name: 'phone_number',
            value: shippingAddress.phone,
          },
          {
            display_name: 'Delivery City',
            variable_name: 'delivery_city',
            value: shippingAddress.city,
          },
        ],
      },
      callback: function (response) {
        (async () => {
          try {
            // 1. Save completed order including shipping details to Firestore
            await addDoc(collection(db, 'orders'), {
              userId: userId || 'guest',
              userEmail: payerEmail,
              reference: response.reference,
              transactionStatus: response.status || 'success',
              items: cartItems,
              shippingAddress: shippingAddress,
              customerName: shippingAddress.fullName,
              totalAmount: total,
              subtotalAmount: subtotal,
              shippingFee: shipping,
              discountApplied: discount,
              status: 'Processing',
              paymentStatus: 'Paid',
              createdAt: new Date().toISOString(),
            });

            // 2. Clear user's cart in Firestore
            await clearCart();

            setIsProcessingPayment(false);

            // 3. Redirect to Success Page
            router.push(`/checkout/success?reference=${response.reference}`);
          } catch (error) {
            console.error('Error processing post-payment actions:', error);
            setIsProcessingPayment(false);
            alert('Payment succeeded, but an error occurred saving your order. Please contact support.');
          }
        })();
      },
      onClose: function () {
        setIsProcessingPayment(false);
      },
    });

    handler.openIframe();
  };

  const getItemImage = (item) => {
    if (item.image) return item.image;
    if (item.imageUrl) return item.imageUrl;
    if (Array.isArray(item.images) && item.images.length > 0) return item.images[0];
    return '/placeholder-apparel.jpg';
  };

  return (
    <>
      {/* Paystack Inline SDK */}
      <Script 
        src="https://js.paystack.co/v1/inline.js" 
        strategy="lazyOnload"
      />

      <main className="bg-black text-white min-h-screen pb-12 px-4 sm:px-6 lg:px-8 pt-16">
        <div className="max-w-6xl mx-auto">
          
          {/* Header */}
          <section className="text-center py-12 px-6">
            <h1 className="text-3xl sm:text-5xl font-black uppercase tracking-tight p-3 flex items-center justify-center gap-3">
              <span>Your Cart</span>
              <span className="text-lg sm:text-2xl px-3 py-1 rounded-full bg-neutral-900 border border-neutral-800 text-neutral-300 font-mono">
                ({totalItemCount})
              </span>
            </h1>
            <p className="text-neutral-400 text-xs sm:text-sm">
              Free shipping on orders over {formatNaira(FREE_SHIPPING_THRESHOLD)}. Items are reserved for 30 minutes.
            </p>
          </section>

          {loading ? (
            <div className="space-y-4 max-w-2xl mx-auto">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="animate-pulse bg-neutral-900 rounded-2xl h-32 w-full" />
              ))}
            </div>
          ) : cartItems.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
              
              {/* Left Side: Cart Items & Shipping Address Form */}
              <section className="lg:col-span-2 space-y-8">
                {/* Cart Items List */}
                <div className="space-y-6">
                  {cartItems.map((item) => {
                    const itemQty = getItemQuantity(item);
                    const lineTotal = getItemLineTotal(item);

                    return (
                      <div
                        key={item.id}
                        className="flex gap-4 sm:gap-6 p-4 sm:p-6 rounded-2xl bg-neutral-950/50 border border-neutral-900"
                      >
                        {/* Item Image */}
                        <div className="relative aspect-[3/4] w-24 sm:w-32 flex-shrink-0 rounded-xl overflow-hidden bg-neutral-900 border border-neutral-850">
                          <img
                            src={getItemImage(item)}
                            alt={item.title || item.name || 'MTT Item'}
                            className="w-full h-full object-cover"
                          />
                        </div>

                        {/* Details */}
                        <div className="flex flex-col justify-between flex-grow py-1">
                          <div>
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <span className="text-[9px] font-mono uppercase text-neutral-500 tracking-wider">
                                  {item.category || 'Accessories'}
                                </span>
                                <h2 className="text-sm sm:text-base font-bold uppercase text-neutral-100 line-clamp-1 mt-0.5">
                                  {item.title || item.name || 'Untitled Product'}
                                </h2>
                                <p className="text-xs text-neutral-400 mt-1">
                                  Size: <span className="text-white font-medium">{item.size || 'Standard'}</span>
                                </p>
                              </div>

                              {/* Line Item Total */}
                              <span className="text-sm sm:text-base font-black text-white">
                                {formatNaira(lineTotal)}
                              </span>
                            </div>
                          </div>

                          {/* Quantity Controls */}
                          <div className="flex items-center justify-between mt-4">
                            <div className="flex items-center border border-neutral-800 rounded-full bg-neutral-950 overflow-hidden">
                              <button
                                onClick={() => updateQuantity(item.id, -1)}
                                className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-900 transition-colors"
                              >
                                <IoRemove size={14} />
                              </button>
                              <span className="px-3 text-xs sm:text-sm font-semibold select-none w-8 text-center">
                                {itemQty}
                              </span>
                              <button
                                onClick={() => updateQuantity(item.id, 1)}
                                className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-900 transition-colors"
                              >
                                <IoAdd size={14} />
                              </button>
                            </div>

                            <button
                              onClick={() => removeItem(item.id)}
                              className="text-neutral-500 hover:text-red-500 p-2 rounded-full hover:bg-neutral-900/50 transition-all"
                              aria-label="Remove item"
                            >
                              <IoTrashOutline size={18} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Shipping Address Section */}
                <div className="bg-neutral-950/40 border border-neutral-900 rounded-2xl p-6 sm:p-8 space-y-6">
                  <h2 className="text-lg font-extrabold uppercase tracking-tight pb-3 border-b border-neutral-900">
                    Shipping Address
                  </h2>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5 sm:col-span-2">
                      <label className="text-xs font-medium text-neutral-400 uppercase tracking-wider">Full Name *</label>
                      <input
                        type="text"
                        name="fullName"
                        value={shippingAddress.fullName}
                        onChange={handleAddressChange}
                        placeholder="John Doe"
                        required
                        className="w-full bg-neutral-950 border border-neutral-900 rounded-xl px-4 py-3 text-xs text-white placeholder-neutral-600 outline-none focus:border-neutral-700"
                      />
                    </div>

                    <div className="space-y-1.5 sm:col-span-2">
                      <label className="text-xs font-medium text-neutral-400 uppercase tracking-wider">Phone Number *</label>
                      <input
                        type="tel"
                        name="phone"
                        value={shippingAddress.phone}
                        onChange={handleAddressChange}
                        placeholder="08012345678"
                        required
                        className="w-full bg-neutral-950 border border-neutral-900 rounded-xl px-4 py-3 text-xs text-white placeholder-neutral-600 outline-none focus:border-neutral-700"
                      />
                    </div>

                    <div className="space-y-1.5 sm:col-span-2">
                      <label className="text-xs font-medium text-neutral-400 uppercase tracking-wider">Street Address *</label>
                      <input
                        type="text"
                        name="address"
                        value={shippingAddress.address}
                        onChange={handleAddressChange}
                        placeholder="123 Lekki Phase 1"
                        required
                        className="w-full bg-neutral-950 border border-neutral-900 rounded-xl px-4 py-3 text-xs text-white placeholder-neutral-600 outline-none focus:border-neutral-700"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-neutral-400 uppercase tracking-wider">City *</label>
                      <input
                        type="text"
                        name="city"
                        value={shippingAddress.city}
                        onChange={handleAddressChange}
                        placeholder="Lagos"
                        required
                        className="w-full bg-neutral-950 border border-neutral-900 rounded-xl px-4 py-3 text-xs text-white placeholder-neutral-600 outline-none focus:border-neutral-700"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-neutral-400 uppercase tracking-wider">State *</label>
                      <input
                        type="text"
                        name="state"
                        value={shippingAddress.state}
                        onChange={handleAddressChange}
                        placeholder="Lagos State"
                        required
                        className="w-full bg-neutral-950 border border-neutral-900 rounded-xl px-4 py-3 text-xs text-white placeholder-neutral-600 outline-none focus:border-neutral-700"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-neutral-400 uppercase tracking-wider">Postal / Zip Code</label>
                      <input
                        type="text"
                        name="postalCode"
                        value={shippingAddress.postalCode}
                        onChange={handleAddressChange}
                        placeholder="101233"
                        className="w-full bg-neutral-950 border border-neutral-900 rounded-xl px-4 py-3 text-xs text-white placeholder-neutral-600 outline-none focus:border-neutral-700"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-neutral-400 uppercase tracking-wider">Country</label>
                      <input
                        type="text"
                        name="country"
                        value={shippingAddress.country}
                        disabled
                        className="w-full bg-neutral-900/50 border border-neutral-900 rounded-xl px-4 py-3 text-xs text-neutral-400 cursor-not-allowed outline-none"
                      />
                    </div>
                  </div>
                </div>
              </section>

              {/* Right Side: Summary */}
              <section className="bg-neutral-950/40 border border-neutral-900 rounded-2xl p-6 sm:p-8 space-y-6 sticky top-20">
                <h2 className="text-lg font-extrabold uppercase tracking-tight pb-3 border-b border-neutral-900">
                  Order Summary
                </h2>

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between text-neutral-400">
                    <span>Subtotal ({totalItemCount} {totalItemCount === 1 ? 'item' : 'items'})</span>
                    <span className="text-white font-medium">{formatNaira(subtotal)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-emerald-500">
                      <span>Discount (10%)</span>
                      <span>-{formatNaira(discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-neutral-400">
                    <span>Shipping</span>
                    <span className="text-white font-medium">
                      {shipping === 0 ? 'FREE' : formatNaira(shipping)}
                    </span>
                  </div>
                  {shipping > 0 && subtotal > 0 && (
                    <p className="text-[10px] text-neutral-500 italic">
                      Add {formatNaira(FREE_SHIPPING_THRESHOLD - subtotal)} more for free shipping!
                    </p>
                  )}
                  <div className="border-t border-neutral-900 pt-3 flex justify-between text-base font-black uppercase">
                    <span>Estimated Total</span>
                    <span className="text-white">{formatNaira(total)}</span>
                  </div>
                </div>

                {/* Promo Code Form */}
                <form onSubmit={applyPromo} className="flex gap-2 my-8 py-2 border-t border-neutral-900/50">
                  <input
                    type="text"
                    placeholder="Promo Code (MTTGLOW)"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    className="bg-neutral-950 border border-neutral-900 rounded-full px-4 py-2.5 text-xs text-white placeholder-neutral-600 outline-none focus:border-neutral-700 flex-grow"
                  />
                  <button
                    type="submit"
                    className="bg-white text-black text-xs font-bold uppercase tracking-wider px-6 py-2.5 rounded-full hover:bg-neutral-200 transition-colors"
                  >
                    Apply
                  </button>
                </form>

                {/* Checkout Button */}
                <div className="pt-2">
                  <button
                    onClick={handlePaystackPayment}
                    disabled={isProcessingPayment}
                    className="w-full bg-white text-black text-xs font-black uppercase tracking-widest py-4 rounded-full hover:bg-neutral-200 transition-all text-center flex justify-center items-center gap-2 disabled:opacity-50"
                  >
                    {isProcessingPayment ? 'Initializing Payment...' : 'Pay with Paystack'}
                    <span>→</span>
                  </button>
                  <div className="mt-4 text-center">
                    <Link
                      href="/shop"
                      className="text-xs text-neutral-500 hover:text-white transition-colors"
                    >
                      Continue Shopping
                    </Link>
                  </div>
                </div>
              </section>
            </div>
          ) : (
            <section className="text-center py-20 border border-dashed border-neutral-900 rounded-3xl bg-neutral-950/20 max-w-2xl mx-auto">
              <p className="text-neutral-500 text-sm mb-6">Your shopping cart is currently empty.</p>
              <Link
                href="/shop"
                className="inline-flex items-center gap-2 bg-white text-black text-xs font-bold uppercase tracking-widest px-6 py-3.5 rounded-full hover:bg-neutral-200 transition-colors"
              >
                Continue Shopping
                <span>→</span>
              </Link>
            </section>
          )}
        </div>
      </main>
    </>
  );
}