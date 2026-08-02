import React from "react";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    /* Establish full-height view port with responsive outer padding */
    <div className="min-h-screen bg-slate-50 p-3 sm:p-4 md:p-8">
      {/* Restrict main content width for optimal readability and alignment across screen sizes */}
      <div className="mx-auto max-w-6xl">{children}</div>
    </div>
  );
}