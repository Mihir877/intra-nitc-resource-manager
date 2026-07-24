import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Database, CheckCircle2, AlertTriangle, ShieldAlert } from "lucide-react";
import api from "@/api/axios";
import { toast } from "sonner";
import PageTitle from "../common/PageTitle";
import useAuth from "@/hooks/useAuth";

export default function SeederPage() {
  const { user } = useAuth();
  const [seeding, setSeeding] = useState(false);

  const isSuperAdmin = user?.email?.toLowerCase() === "admin_m25cse@nitc.ac.in";

  const handleSeedDemoData = async () => {
    setSeeding(true);
    const toastId = toast.loading("Seeding realistic demo data...");
    try {
      const res = await api.post("/seeder/demo");
      if (res.data.success) {
        toast.success("Demo data seeded successfully!", { id: toastId });
      } else {
        toast.error(res.data.message || "Failed to seed demo data", { id: toastId });
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to trigger seeder", { id: toastId });
    } finally {
      setSeeding(false);
    }
  };

  if (!isSuperAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center space-y-4 p-5">
        <ShieldAlert className="h-16 w-16 text-red-500 animate-bounce" />
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Access Denied</h2>
        <p className="text-muted-foreground max-w-md">
          Only the main administrator account (admin_m25cse@nitc.ac.in) has access to trigger database seeders.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageTitle
        title="Database Seeder"
        subtitle="Manage and populate system database with realistic simulation data"
      />

      <div className="max-w-2xl mx-auto">
        <Card className="border border-border bg-card dark:border-gray-700/80 shadow-sm">
          <CardHeader className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500 dark:bg-emerald-500/20">
                <Database className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-lg">Seed Simulation Data</CardTitle>
                <CardDescription>
                  Generate a realistic timeline of booking requests across departments
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-gray-600 dark:text-gray-300">
            <div className="p-3 border rounded-lg bg-amber-500/5 dark:bg-amber-500/10 border-amber-500/20 flex gap-3 text-xs leading-relaxed text-amber-700 dark:text-amber-400">
              <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold">Warning:</span> Triggering this seeder will delete all existing requests and bookings in the database before populating new slots. User and resource configurations will remain untouched.
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium text-gray-900 dark:text-gray-100">Seeder Details:</h4>
              <ul className="list-disc list-inside space-y-1.5 pl-2 text-xs">
                <li>Generates exactly <span className="font-semibold text-gray-900 dark:text-gray-100">5 requests per active resource</span> (~150+ bookings total).</li>
                <li>Timeline spans across a 16-day window: <span className="font-semibold">from 5 days ago to 10 days in the future</span>.</li>
                <li>Respects each resource's custom availability hours and maximum booking limits.</li>
                <li>Guarantees <span className="font-semibold text-gray-900 dark:text-gray-100">0 scheduling overlaps</span> per resource.</li>
                <li>Binds booking users to students in the <span className="font-semibold">same department</span> as the resource (CSE, ECE, ME, ARCH).</li>
                <li>Assigns <span className="font-semibold text-gray-900 dark:text-gray-100">65% of bookings to demo@user.com</span> to illustrate a complete timeline for testing.</li>
                <li>Distributes request statuses realistically: ~70% approved, ~18% pending, and ~12% rejected.</li>
              </ul>
            </div>
          </CardContent>
          <CardFooter className="border-t dark:border-gray-700/80 pt-4 flex justify-between items-center bg-muted/20 dark:bg-slate-900/10 rounded-b-lg">
            <span className="text-xs text-muted-foreground">Last run: Done in-realtime on trigger</span>
            <Button
              variant="default"
              disabled={seeding}
              onClick={handleSeedDemoData}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-sm transition-colors"
            >
              {seeding ? "Seeding Data..." : "Run Seeder"}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
