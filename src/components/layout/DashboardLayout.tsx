"use client";

import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { MadeWithDyad } from "@/components/made-with-dyad";

export const DashboardLayout = () => {
  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <Sidebar />
      <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-14">
        <main className="grid flex-1 items-start gap-4 p-4 sm:p-6 lg:p-8"> {/* Ajustado o padding aqui */}
          <Outlet />
        </main>
        <MadeWithDyad />
      </div>
    </div>
  );
};