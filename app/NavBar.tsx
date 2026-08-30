"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

export default function NavBar() {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  if (pathname === "/login") return null;

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      router.push("/login");
      router.refresh();
    }
  };

  return (
    <nav className="w-full bg-white shadow-sm py-3 px-4 sm:py-4 sm:px-6 flex flex-wrap items-center gap-3 mb-4">
      <Link
        href="/"
        className="inline-block text-blue-600 hover:text-blue-800 font-semibold text-base sm:text-lg transition-colors duration-200 px-3 py-2 sm:px-4 rounded-lg border border-blue-100 bg-blue-50 shadow-sm hover:bg-blue-100"
      >
        Dashboard
      </Link>
      <Link
        href="/ai"
        className="inline-block text-purple-600 hover:text-purple-800 font-semibold text-base sm:text-lg transition-colors duration-200 px-3 py-2 sm:px-4 rounded-lg border border-purple-100 bg-purple-50 shadow-sm hover:bg-purple-100"
      >
        AI Workspace
      </Link>
      <button
        onClick={handleLogout}
        disabled={loggingOut}
        className="ml-auto inline-block text-gray-600 hover:text-gray-800 font-semibold text-sm sm:text-base transition-colors duration-200 px-3 py-2 sm:px-4 rounded-lg border border-gray-200 bg-gray-50 shadow-sm hover:bg-gray-100 disabled:opacity-50"
      >
        {loggingOut ? "..." : "Logout"}
      </button>
    </nav>
  );
}
