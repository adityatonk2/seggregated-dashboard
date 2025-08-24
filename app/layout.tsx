// app/layout.tsx
import './globals.css';

export const metadata = {
  title: 'Leads Dashboard',
  description: 'Client leads management dashboard',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className="bg-gray-50 min-h-screen w-full flex flex-col overflow-x-hidden">
        <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {children}
        </main>

        <footer className="bg-white shadow-inner py-4 px-6 text-center text-sm text-gray-500">
          © {new Date().getFullYear()} Your Company. All rights reserved.
        </footer>
      </body>
    </html>
  );
}
