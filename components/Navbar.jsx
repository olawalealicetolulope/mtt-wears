'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { HiOutlineMenuAlt3 } from 'react-icons/hi';
import { MdClose } from 'react-icons/md';
import { FaUserCircle } from 'react-icons/fa';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import { IoSearch } from "react-icons/io5";

// Firebase imports for real-time sync
import { db } from '@/lib/firebaseConfig';
import { collection, onSnapshot } from 'firebase/firestore';

export default function Navbar() {
  const [navOpen, setNavOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  
  // Navigation Routing States
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [searchQuery, setSearchQuery] = useState('');

  // User menu state
  const [anchorEl, setAnchorEl] = useState(null);
  const menuOpen = Boolean(anchorEl);
  const handleClick = (event) => setAnchorEl(event.currentTarget);
  const handleClose = () => setAnchorEl(null);

  const { data: session } = useSession();

  // Handle page scrolling
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Sync state with URL query if page is loaded/reloaded with active filters
  useEffect(() => {
    const query = searchParams.get('q');
    if (query) {
      setSearchQuery(query);
    }
  }, [searchParams]);

  // Real-time Firebase Cart Listener
  useEffect(() => {
    const cartRef = collection(db, 'cart');

    const unsubscribe = onSnapshot(
      cartRef,
      (snapshot) => {
        // Sum total quantities from all items in the Firestore collection
        const total = snapshot.docs.reduce((sum, doc) => {
          const data = doc.data();
          const qty = typeof data.quantity === 'number' ? data.quantity : parseInt(data.quantity || 1, 10);
          return sum + (isNaN(qty) ? 1 : qty);
        }, 0);

        setCartCount(total);
      },
      (error) => {
        console.error('Error listening to cart items in Navbar:', error);
        setCartCount(0);
      }
    );

    return () => unsubscribe();
  }, []);

  // Handle submitting the search form
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/shop?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      router.push('/shop');
    }
  };

  // Helper utility function to assign bold font style along with the active gray color
  const getLinkStyle = (path) => {
    return pathname === path 
      ? 'text-neutral-400 font-bold' 
      : 'text-white hover:text-neutral-300 transition-colors';
  };

  return (
    <>
      <nav
        className={`fixed top-0 left-0 w-full z-50 px-6 py-4 flex items-center justify-between transition-all duration-300 ${
          scrolled ? 'bg-black/90 backdrop-blur-md' : 'bg-transparent'
        }`}
      >
        {/* Logo */}
        <h1 className="text-xl md:text-2xl font-bold tracking-wider text-white">
          <Link href="/">MTT WEARS</Link>
        </h1>

        {/* Desktop Links */}
        <div className="hidden lg:flex items-center gap-8 text-sm uppercase">
          <Link href="/" className={getLinkStyle('/')}>Home</Link>
          <Link href="/shop" className={getLinkStyle('/shop')}>Shop</Link>
          <Link href="/collections" className={getLinkStyle('/collections')}>Collections</Link>
          <Link href="/about" className={getLinkStyle('/about')}>About</Link>
        </div>

        {/* Search (Desktop) */}
        <form 
          onSubmit={handleSearchSubmit} 
          className="hidden lg:flex items-center bg-white rounded-md px-2 py-1"
        >
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="px-2 py-0.5 text-black outline-none text-sm w-44 focus:w-60 transition-all duration-300"
          />
          <button type="submit" className="text-black hover:text-neutral-600 px-1 transition-colors">
            <IoSearch size={18} />
          </button>
        </form>

        {/* Right Section */}
        <div className="flex items-center gap-3 sm:gap-4 ml-auto lg:ml-6">
          {/* Cart Badge (Desktop) */}
          <div className="relative hidden lg:block">
            <Link href="/cart" className="flex items-center justify-center p-1">
              <span className="text-xl">🛒</span>
              <span className="absolute -top-1 -right-2 bg-red-600 text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white min-w-[18px] text-center">
                {cartCount}
              </span>
            </Link>
          </div>

          {/* Hamburger Button */}
          <button
            className="lg:hidden z-50"
            onClick={() => setNavOpen(!navOpen)}
            aria-label="Toggle menu"
          >
            {navOpen ? (
              <MdClose className="text-2xl text-white" />
            ) : (
              <HiOutlineMenuAlt3 className="text-2xl text-white" />
            )}
          </button>

          {/* User Icon */}
          {session ? (
            <div>
              <button
                id="user-button"
                aria-controls={menuOpen ? 'user-menu' : undefined}
                aria-haspopup="true"
                aria-expanded={menuOpen ? 'true' : undefined}
                onClick={handleClick}
                className="flex items-center justify-center rounded-full p-1 hover:bg-zinc-800 transition-colors"
              >
                <img
                  src={session?.user?.image}
                  alt={session?.user?.name?.slice(0, 2).toUpperCase()}
                  className="w-8 h-8 sm:w-9 sm:h-9 rounded-full object-cover border border-gray-300"
                />
              </button>
              <Menu
                id="user-menu"
                anchorEl={anchorEl}
                open={menuOpen}
                onClose={handleClose}
                slotProps={{ list: { 'aria-labelledby': 'user-button' } }}
              >
                <MenuItem onClick={handleClose}>
                  <Link href="/profile">Profile</Link>
                </MenuItem>
                <MenuItem onClick={handleClose}>
                  <Link href="/orders">Orders</Link>
                </MenuItem>
                <MenuItem onClick={handleClose}>
                  <button onClick={() => signOut()}>Log Out</button>
                </MenuItem>
              </Menu>
            </div>
          ) : (
            <Link
              href="/auth/signin"
              className="flex items-center justify-center rounded-full p-1 hover:bg-zinc-800 transition-colors"
            >
              <FaUserCircle className={pathname === '/auth/signin' ? 'text-neutral-400 w-8 h-8 sm:w-9 sm:h-9' : 'text-white w-8 h-8 sm:w-9 sm:h-9'} />
            </Link>
          )}
        </div>
      </nav>

      {/* Mobile Menu */}
      {navOpen && (
        <div className="fixed top-16 left-0 w-full bg-black flex flex-col items-center gap-6 py-6 z-40 lg:hidden border-b border-zinc-900">
          <form onSubmit={handleSearchSubmit} className="flex items-center bg-white rounded-md px-2 py-1.5 w-11/12 max-w-sm">
            <input
              type="text"
              placeholder="Search store..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="px-2 py-0.5 text-black outline-none text-sm w-full"
            />
            <button type="submit" onClick={() => setNavOpen(false)} className="text-black px-1">
              <IoSearch size={18} />
            </button>
          </form>

          <Link href="/" onClick={() => setNavOpen(false)} className={getLinkStyle('/')}>Home</Link>
          <Link href="/shop" onClick={() => setNavOpen(false)} className={getLinkStyle('/shop')}>Shop</Link>
          <Link href="/collections" onClick={() => setNavOpen(false)} className={getLinkStyle('/collections')}>Collections</Link>
          <Link href="/about" onClick={() => setNavOpen(false)} className={getLinkStyle('/about')}>About</Link>
          <Link href="/cart" onClick={() => setNavOpen(false)} className={getLinkStyle('/cart')}>Cart ({cartCount})</Link>
          <Link href="/auth/signin" onClick={() => setNavOpen(false)} className={getLinkStyle('/auth/signin')}>Login</Link>
        </div>
      )}
    </>
  );
}