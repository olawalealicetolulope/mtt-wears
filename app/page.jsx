'use client';

import Image from "next/image";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import { db } from "@/lib/firebaseConfig"; // Adjust path if your Firebase file is located elsewhere
import { collection, getDocs, query, limit } from "firebase/firestore";

export default function Home() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch products from Firestore
  useEffect(() => {
    async function fetchProducts() {
      try {
        const productsRef = collection(db, "products");
        // Fetch up to 8 products for the featured section
        const q = query(productsRef, limit(8));
        const querySnapshot = await getDocs(q);

        const fetchedProducts = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // Filter out any documents that do not have a valid image or title
        const validProducts = fetchedProducts.filter((product) => {
          const hasImage =
            Array.isArray(product.images) &&
            product.images.length > 0 &&
            typeof product.images[0] === "string" &&
            product.images[0].trim() !== "";
          return hasImage;
        });

        setProducts(validProducts);
      } catch (error) {
        console.error("Error fetching products from Firestore:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, []);

  return (
    <main className="min-h-screen bg-[url('/bg.avif')] bg-no-repeat bg-center bg-cover">
      {/* Hero Section */}
      <section className="relative min-h-screen bg-black/70 flex flex-col items-center justify-center gap-10 px-4 text-center">
        <span className="bg-white text-black px-4 py-1 rounded-full text-sm tracking-wider uppercase">
          Streetwear. Confidence. Style.
        </span>

        <h1 className="text-white font-bold text-4xl md:text-6xl lg:text-7xl uppercase leading-tight">
          Elevate Your Fashion Game
        </h1>

        <p className="text-gray-200 max-w-2xl text-base md:text-lg lg:text-xl">
          Discover premium outfits designed to make you stand out. MTT Wears brings modern street fashion to your wardrobe.
        </p>

        <div className="flex flex-col sm:flex-row gap-4">
          <Link href="/shop">
            <button className="bg-white text-black px-8 py-3 rounded-md hover:bg-gray-200 transition font-medium">
              Shop Now
            </button>
          </Link>
          <Link href="/collections">
            <button className="border border-white text-white px-8 py-3 rounded-md hover:bg-white hover:text-black transition font-medium">
              View Collections
            </button>
          </Link>
        </div>
      </section>

      {/* About Section */}
      <section className="bg-gray-100 py-16 px-4">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div>
            <h2 className="text-3xl font-semibold text-gray-800 mb-4">
              About MTT Wears
            </h2>
            <p className="text-gray-700 mb-4">
              MTT Wears is a modern fashion brand focused on delivering premium quality streetwear for bold and confident individuals.
            </p>
            <p className="text-gray-700">
              From casual fits to statement pieces, we redefine style with comfort and elegance.
            </p>
          </div>
          <Image
            src="/img1.jpg"
            alt="MTT Wears fashion"
            width={600}
            height={400}
            className="rounded-lg shadow-lg object-cover"
          />
        </div>
      </section>

      {/* Features */}
      <section className="bg-white py-16 px-4">
        <div className="max-w-6xl mx-auto text-center mb-10">
          <h2 className="text-3xl font-semibold text-gray-800 mb-2">
            Why Choose MTT Wears?
          </h2>
          <p className="text-gray-500 max-w-xl mx-auto">
            We combine comfort, quality, and trend to give you the best fashion experience.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          {[
            { title: "Premium Quality", desc: "High-quality fabrics built for durability and comfort." },
            { title: "Latest Trends", desc: "Stay ahead with our modern and stylish collections." },
            { title: "Fast Delivery", desc: "Quick and reliable nationwide delivery service." },
          ].map((item, idx) => (
            <div key={idx} className="shadow-md p-6 rounded-lg hover:shadow-xl transition bg-white">
              <h3 className="font-semibold text-xl mb-2 text-black">
                {item.title}
              </h3>
              <p className="text-gray-600 text-sm">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Dynamic Products Section */}
      <section className="bg-gray-100 py-16 px-4">
        <h2 className="text-3xl text-center font-semibold mb-10 text-gray-800">
          Featured Products
        </h2>

        {loading ? (
          /* Loading Skeleton */
          <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 text-center">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="p-4 shadow-md rounded-lg bg-white animate-pulse">
                <div className="w-full h-64 bg-gray-200 rounded-md mb-4" />
                <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto mb-3" />
                <div className="h-8 bg-gray-200 rounded w-1/2 mx-auto" />
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <p className="text-center text-gray-500">No valid products available at the moment.</p>
        ) : (
          /* Products Grid */
          <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 text-center">
            {products.map((product) => {
              const imageSrc = product.images[0];
              const numericPrice = typeof product.price === "number" ? product.price : parseFloat(product.price || 0);

              return (
                <div
                  key={product.id}
                  className="p-4 shadow-md hover:shadow-xl rounded-lg bg-white flex flex-col justify-between transition-all"
                >
                  <div>
                    <Image
                      src={imageSrc}
                      alt={product.name || "Product Image"}
                      width={300}
                      height={300}
                      unoptimized // Essential to support Base64 strings stored in Firestore
                      className="w-full h-64 object-cover rounded-md mb-4"
                    />
                    <h3 className="text-lg font-semibold text-gray-800 line-clamp-1">
                      {product.name || "Untitled Product"}
                    </h3>
                    {product.price && (
                      <p className="text-sm font-bold text-gray-900 mt-1">
                        ₦{numericPrice.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    )}
                  </div>
                  <Link href={`/shop/${product.id}`} className="mt-4 block">
                    <button className="w-full bg-black text-white px-4 py-2 rounded-md hover:bg-gray-800 transition">
                      Buy Now
                    </button>
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* CTA */}
      <section className="py-20 px-4 bg-black text-center">
        <h2 className="text-3xl font-semibold mb-4 text-white">
          Upgrade Your Wardrobe Today
        </h2>
        <p className="text-gray-300 mb-6 max-w-xl mx-auto">
          Join thousands of customers rocking MTT Wears. Style that speaks for you.
        </p>
        <Link href="/shop">
          <button className="bg-white text-black px-6 py-3 rounded-md hover:bg-gray-200 transition font-medium">
            Start Shopping
          </button>
        </Link>
      </section>

      {/* Footer */}
      <footer className="bg-black text-white text-center py-6">
        <p>© {new Date().getFullYear()} MTT Wears. All rights reserved.</p>
      </footer>
    </main>
  );
}