// app/layout.tsx
import "./globals.css";
import Link from "next/link";

export const metadata = {
  title: "All Time Prospects Dashboard (2026)",
  description: "Client leads management dashboard",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const year = new Date().getFullYear(); // server-stable for this render

  return (
    <html lang="en" className="scroll-smooth" suppressHydrationWarning>
      <body className="bg-gray-50 min-h-screen w-full flex flex-col overflow-x-hidden">
        <nav className="w-full bg-white shadow-sm py-4 px-6 flex items-center space-x-5 mb-4">
          <Link
            href="/"
            className="inline-block text-blue-600 hover:text-blue-800 font-semibold text-lg transition-colors duration-200 px-4 py-2 rounded-lg border border-blue-100 bg-blue-50 shadow-sm hover:bg-blue-100"
          >
            Home
          </Link>
          <Link
            href="/companies"
            className="inline-block text-blue-600 hover:text-blue-800 font-semibold text-lg transition-colors duration-200 px-4 py-2 rounded-lg border border-blue-100 bg-blue-50 shadow-sm hover:bg-blue-100"
          >
            Companies
          </Link>
        </nav>

        <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-6">{children}</main>

        <footer className="bg-white shadow-inner py-4 px-6 text-center text-sm text-gray-500">
          © {year} FDC Innovation Labs. All rights reserved.
        </footer>
      </body>
    </html>
  );
}
