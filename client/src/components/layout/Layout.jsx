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

export function Layout({ children }) {
  const { open, setOpen } = useSidebar();

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Mobile sidebar */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="p-0 w-72">
          <SheetHeader className="px-4 py-3 border-b">
            <SheetTitle className="text-base text-left">
              NITC Resources
            </SheetTitle>
          </SheetHeader>
          <div className="py-2">
            <Navigation />
          </div>
        </SheetContent>
      </Sheet>

      <Header />

      <div className="flex">
        {/* Desktop sidebar */}
        <aside className="hidden md:block w-54 shrink-0 border-r bg-card">
          <div className="h-[calc(100vh-3.5rem)] overflow-y-auto py-2">
            <Navigation />
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1 min-w-0">
          <div className="max-w-[1400px] mx-auto p-4 md:p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
