'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { db } from '@/lib/firebaseConfig';
import { collection, getDocs } from 'firebase/firestore';

export default function CollectionsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('All');

  const categories = ["All", "Hoodies", "T-Shirts", "Accessories", "Jackets"];

  useEffect(() => {
    const fetchCollections = async () => {
      try {
        setLoading(true);
        const productsRef = collection(db, 'products');

        // Fetch all products from Firestore and filter locally for flexible matching
        const querySnapshot = await getDocs(productsRef);

        const fetchedItems = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        setProducts(fetchedItems);
      } catch (error) {
        console.error("Error loading MTT Wears collection catalog:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCollections();
  }, []);

  // Safe category filtering that handles variations like "T-Shirts", "tshirts", "tee shirts"
  const filteredProducts = products.filter((product) => {
    if (activeFilter.toUpperCase() === 'ALL') return true;

    const rawCategory = (product.category || "").toLowerCase().replace(/[^a-z0-9]/g, "");
    const rawFilter = activeFilter.toLowerCase().replace(/[^a-z0-9]/g, "");

    // Match "tshirts" with "tshirts", "hoodies" with "hoodies", etc.
    if (rawFilter.includes("tshirt") || rawFilter.includes("tee")) {
      return rawCategory.includes("tshirt") || rawCategory.includes("tee") || rawCategory.includes("shirt");
    }

    return rawCategory === rawFilter;
  });

  // Smart image URL resolver
  const getProductImage = (product) => {
    if (Array.isArray(product.images) && product.images.length > 0 && product.images[0]) {
      return product.images[0];
    }
    if (typeof product.imageUrl === 'string' && product.imageUrl.trim() !== '') {
      return product.imageUrl;
    }
    if (typeof product.item === 'string' && product.item.trim() !== '') {
      return product.item;
    }
    return '/placeholder-apparel.jpg';
  };

  return (
    <main className="min-h-screen bg-black text-white pt-24 px-6 md:px-12 pb-16">
      {/* Page Header */}
      <header className="text-center my-8">
        <h1 className="text-3xl md:text-5xl font-bold tracking-widest uppercase mb-4">
          Collections
        </h1>
        <p className="text-sm text-neutral-400 max-w-md mx-auto">
          Explore premium high-contrast streetwear engineered for comfort and modern structural functional aesthetics.
        </p>
      </header>

      {/* Dynamic Category Filtering Bar */}
      <section className="flex flex-wrap justify-center items-center gap-4 my-10 border-b border-zinc-900 pb-6">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setActiveFilter(category)}
            className={`text-xs md:text-sm uppercase tracking-wider px-4 py-2 rounded-md transition-all duration-300 ${
              activeFilter.toUpperCase() === category.toUpperCase()
                ? 'bg-neutral-800 text-white font-bold border border-neutral-700'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            {category}
          </button>
        ))}
      </section>

      {/* Catalog Grid View */}
      {loading ? (
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="animate-pulse bg-zinc-900 rounded-lg h-96 w-full" />
          ))}
        </section>
      ) : filteredProducts.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-neutral-500 text-lg">No streetwear items found in this collection category.</p>
        </div>
      ) : (
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {filteredProducts.map((product) => {
            const imgSrc = getProductImage(product);
            const numericPrice = typeof product.price === 'number' 
              ? product.price 
              : parseFloat(product.price || 0);

            return (
              <div 
                key={product.id}
                className="group relative bg-zinc-950 border border-zinc-900 rounded-lg overflow-hidden transition-all duration-300 hover:border-neutral-700 flex flex-col justify-between"
              >
                {/* Product Thumbnail Container */}
                <div className="relative aspect-[3/4] w-full bg-zinc-900 overflow-hidden">
                  <Image
                    src={imgSrc}
                    alt={product.name || 'MTT Product'}
                    fill
                    unoptimized
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                    className="object-cover object-center transition-transform duration-500 group-hover:scale-105"
                  />
                  
                  {product.isNew && (
                    <span className="absolute top-3 left-3 bg-blue-600 text-[10px] font-bold tracking-widest px-2.5 py-1 uppercase rounded z-10">
                      New Drop
                    </span>
                  )}
                </div>

                {/* Text Meta Content Info Card */}
                <div className="p-4 flex flex-col justify-between flex-1">
                  <div>
                    <span className="text-[10px] uppercase text-neutral-500 tracking-widest block mb-1">
                      {product.category || 'Streetwear'}
                    </span>
                    <h3 className="text-sm font-semibold tracking-wide text-white uppercase truncate">
                      {product.name || 'Untitled Item'}
                    </h3>
                    <span className="text-xs text-neutral-400 block mt-1">
                      Size Variants: {Array.isArray(product.sizes) ? product.sizes.join(', ') : 'Standard'}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-zinc-900">
                    <span className="text-sm font-bold text-neutral-200">
                      ₦{numericPrice.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                    
                    <Link 
                      href={`/shop/${product.id}`}
                      className="text-xs font-semibold uppercase text-white bg-zinc-900 hover:bg-white hover:text-black border border-zinc-800 px-3 py-1.5 rounded transition-all duration-300"
                    >
                      View Drop
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </section>
      )}
    </main>
  );
}