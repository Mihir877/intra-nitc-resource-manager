import React from "react";
import { Header } from "./Header";
import { Navigation } from "./Navigation";
import { useSidebar } from "@/hooks/useSidebar";
// If using shadcn/ui sheet:
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Outlet } from "react-router-dom";

export function Layout({ children }) {
  const { open, setOpen } = useSidebar();

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Mobile sidebar */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="p-0 w-72">
          <SheetHeader className="px-4 py-[6px] border-b">
            <div className="flex items-center space-x-2 select-none cursor-pointer">
              <div className="h-11 rounded-lg flex items-center justify-center p-1">
                <img
                  src="/assets/nitc_logo.png"
                  alt="NITC Logo"
                  className="h-full object-contain"
                />
              </div>
              <div>
                <h1 className="font-bold text-xl">NITC Resources</h1>
              </div>
            </div>
          </SheetHeader>
          <div className="py-2">
            <Navigation />
          </div>
        </SheetContent>
      </Sheet>

      <Header />

      <div className="flex h-[calc(100vh-3.5rem-1px)]">
        {/* Desktop sidebar */}
        <aside className="hidden md:block w-54 shrink-0 border-r bg-card">
          <div className="h-full py-2">
            <Navigation />
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1 min-w-0 overflow-y-auto">
          <div className="max-w-[1400px] mx-auto p-4 md:p-6 lg:p-8 pb-8">
            {/* {children} */}
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
