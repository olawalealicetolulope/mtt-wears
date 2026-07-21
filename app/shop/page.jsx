"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { FiHeart, FiCheck, FiPlus, FiMinus } from "react-icons/fi"
import { db } from "@/lib/firebaseConfig"
import { 
  collection, 
  getDocs, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc,
  increment,
  onSnapshot,
  query,
  where
} from "firebase/firestore"
import { useSession } from "next-auth/react"

export default function ShopPage() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState("All")
  const [addedIds, setAddedIds] = useState([])
  
  // Map of productId -> quantity currently in cart
  const [cartQuantities, setCartQuantities] = useState({})

  const { data: session } = useSession()
  const userId = session?.user?.email || session?.user?.id || "guest_user"

  const categories = ["All", "Hoodies", "T-Shirts", "Accessories", "Jackets"]

  // 1. Fetch Store Products
  const fetchStoreItems = async () => {
    try {
      setLoading(true)
      const productsRef = collection(db, "products")
      const querySnapshot = await getDocs(productsRef)

      const fetchedItems = querySnapshot.docs
        .map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }))
        .filter((item) => {
          const isTestTitle = item.name?.toLowerCase().includes("oversized street")
          const isTestImage = item.item === "/shirt1.jpg" || item.images?.[0] === "/shirt1.jpg"
          return !isTestTitle && !isTestImage
        })

      setItems(fetchedItems)
    } catch (error) {
      console.error("Error retrieving documents from Firestore: ", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStoreItems()
  }, [])

  // 2. Real-time Listener for Cart Quantities
  useEffect(() => {
    const cartQuery = query(collection(db, "cart"), where("userId", "==", userId))

    const unsubscribe = onSnapshot(
      cartQuery,
      (snapshot) => {
        const qtyMap = {}
        snapshot.docs.forEach((docSnap) => {
          const data = docSnap.data()
          const pId = data.productId || docSnap.id.replace(`${userId}_`, '')
          const q = parseInt(data.quantity || data.qty || 1, 10)
          qtyMap[pId] = q
        })
        setCartQuantities(qtyMap)
      },
      (error) => {
        console.error("Error tracking cart quantity:", error)
      }
    )

    return () => unsubscribe()
  }, [userId])

  const getProductImage = (product) => {
    if (Array.isArray(product.images) && product.images.length > 0 && product.images[0]) {
      return product.images[0]
    }
    if (typeof product.item === "string" && product.item.trim() !== "") {
      return product.item
    }
    return "/placeholder-apparel.jpg"
  }

  // 3. Add / Increase Quantity
  const handleAddToCart = async (product) => {
    try {
      const cartItemId = `${userId}_${product.id}`
      const cartDocRef = doc(db, "cart", cartItemId)
      const cartSnap = await getDoc(cartDocRef)

      if (cartSnap.exists()) {
        await updateDoc(cartDocRef, {
          quantity: increment(1)
        })
      } else {
        await setDoc(cartDocRef, {
          productId: product.id,
          userId: userId,
          title: product.name || "Untitled Item",
          price: typeof product.price === "number" ? product.price : parseFloat(product.price || 0),
          image: getProductImage(product),
          category: product.category || "Streetwear",
          quantity: 1,
          size: product.size || "Standard",
          createdAt: new Date().toISOString()
        })
      }

      setAddedIds((prev) => [...prev, product.id])
      setTimeout(() => {
        setAddedIds((prev) => prev.filter((id) => id !== product.id))
      }, 1500)
    } catch (error) {
      console.error("Failed to add product to Firestore cart:", error)
    }
  }

  // 4. Decrease Quantity / Remove from Cart directly on Shop Page
  const handleDecreaseQuantity = async (product) => {
    try {
      const cartItemId = `${userId}_${product.id}`
      const cartDocRef = doc(db, "cart", cartItemId)
      const currentQty = cartQuantities[product.id] || 0

      if (currentQty > 1) {
        await updateDoc(cartDocRef, {
          quantity: increment(-1)
        })
      } else if (currentQty === 1) {
        await deleteDoc(cartDocRef)
      }
    } catch (error) {
      console.error("Failed to decrease product quantity:", error)
    }
  }

  const filteredItems = items.filter((item) => {
    if (activeFilter === "All") return true

    const itemCategory = (item.category || "").toLowerCase().replace(/[^a-z0-9]/g, "")
    const filterCategory = activeFilter.toLowerCase().replace(/[^a-z0-9]/g, "")

    if (filterCategory.includes("tshirt") || filterCategory.includes("tee")) {
      return itemCategory.includes("tshirt") || itemCategory.includes("tee") || itemCategory.includes("shirt")
    }

    return itemCategory === filterCategory
  })

  return (
    <div className="min-h-screen bg-black text-white pt-12">
      <section className="text-center py-20 px-6">
        <p className="inline-block border border-white px-6 py-2 rounded-full text-sm tracking-wide">
          PREMIUM STREETWEAR COLLECTION
        </p>

        <h1 className="text-5xl md:text-7xl font-extrabold mt-8 leading-tight">
          SHOP THE <span className="text-gray-300">LATEST</span> DROPS
        </h1>

        <p className="max-w-2xl mx-auto mt-6 text-gray-400 text-lg">
          Discover trendy outfits crafted for confidence, comfort, and modern street fashion.
        </p>
      </section>

      {/* Category Filter Bar */}
      <section className="flex flex-wrap justify-center gap-4 px-6 pb-12">
        {categories.map((item) => (
          <button
            key={item}
            onClick={() => setActiveFilter(item)}
            className={`px-6 py-2 rounded-full border transition tracking-wider text-sm ${
              activeFilter === item
                ? "bg-neutral-800 text-white font-bold border-neutral-700"
                : "border-gray-700 text-gray-400 hover:bg-white hover:text-black"
            }`}
          >
            {item}
          </button>
        ))}
      </section>

      {/* Grid Display */}
      {loading ? (
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 px-8 pb-20">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="animate-pulse bg-zinc-900 rounded-3xl h-[480px] w-full" />
          ))}
        </section>
      ) : filteredItems.length === 0 ? (
        <div className="text-center py-20 text-neutral-500">
          No products match this category.
        </div>
      ) : (
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 px-8 pb-20">
          {filteredItems.map((product) => {
            const imgSrc = getProductImage(product)
            const isAdded = addedIds.includes(product.id)
            const qtyInCart = cartQuantities[product.id] || 0
            const numericPrice = typeof product.price === "number" ? product.price : parseFloat(product.price || 0)

            return (
              <div
                key={product.id}
                className="bg-[#111] rounded-3xl overflow-hidden group hover:scale-[1.02] transition duration-300 border border-zinc-900 flex flex-col justify-between"
              >
                <div className="relative h-[350px] overflow-hidden bg-zinc-900">
                  <Image
                    src={imgSrc}
                    alt={product.name || "Product Image"}
                    fill
                    unoptimized
                    sizes="(max-width: 768px) 100vw, 25vw"
                    className="object-cover group-hover:scale-110 transition duration-500"
                  />

                  <button className="absolute top-4 right-4 bg-white text-black p-2 rounded-full hover:bg-red-100 transition z-10">
                    <FiHeart />
                  </button>

                  {/* Quantity Badge on Card Image */}
                  {qtyInCart > 0 && (
                    <span className="absolute top-4 left-4 bg-black/80 backdrop-blur-md text-white text-xs font-mono font-bold px-3 py-1.5 rounded-full border border-neutral-700 z-10">
                      In Cart: {qtyInCart}
                    </span>
                  )}
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-widest text-gray-500">
                      {product.category || "Streetwear"}
                    </p>

                    <div className="flex items-center justify-between mt-2 gap-2">
                      <h2 className="text-lg font-semibold uppercase truncate">
                        {product.name}
                      </h2>

                      {/* Price updated to Nigerian Naira */}
                      <span className="font-bold text-lg whitespace-nowrap">
                        ₦{numericPrice.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>

                  {/* Action Controls: Shows +/- controls if item is in cart, or 'Add to Cart' button */}
                  {qtyInCart > 0 ? (
                    <div className="mt-5 flex items-center justify-between bg-zinc-900 border border-zinc-800 rounded-xl p-1.5">
                      <button
                        onClick={() => handleDecreaseQuantity(product)}
                        className="p-2.5 rounded-lg bg-black hover:bg-zinc-800 text-white transition flex items-center justify-center"
                        aria-label="Decrease quantity"
                      >
                        <FiMinus className="text-sm" />
                      </button>

                      <span className="font-bold text-sm text-neutral-200">
                        {qtyInCart} in Cart
                      </span>

                      <button
                        onClick={() => handleAddToCart(product)}
                        className="p-2.5 rounded-lg bg-white hover:bg-gray-200 text-black transition flex items-center justify-center"
                        aria-label="Increase quantity"
                      >
                        <FiPlus className="text-sm" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleAddToCart(product)}
                      className={`w-full mt-5 py-3 rounded-xl font-semibold transition flex items-center justify-center gap-2 ${
                        isAdded
                          ? "bg-green-600 text-white"
                          : "bg-white text-black hover:bg-gray-200"
                      }`}
                    >
                      {isAdded ? (
                        <>
                          <FiCheck className="text-lg" /> Added!
                        </>
                      ) : (
                        "Add to Cart"
                      )}
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </section>
      )}
    </div>
  )
}