import Link from 'next/link';
import { Suspense } from 'react';

function NotFoundContent() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 mb-4 font-bold text-2xl shadow-sm">
        404
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Page Not Found</h1>
      <p className="text-gray-600 max-w-md text-sm mb-6">
        Sorry, the page you are looking for doesn't exist or has been moved.
      </p>
      <Link
        href="/shop"
        className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors text-sm shadow-sm"
      >
        Return to Shop
      </Link>
    </div>
  );
}

export default function NotFound() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    }>
      <NotFoundContent />
    </Suspense>
  );
}