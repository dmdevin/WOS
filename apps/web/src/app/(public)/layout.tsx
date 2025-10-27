'use client';

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useState, useEffect } from "react";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  // --- THE FIX: Create state to hold the dynamic back URL ---
  const [backUrl, setBackUrl] = useState('/workshops'); // Default to the workshop selection page

  // This effect runs once on the client after the component mounts
  useEffect(() => {
    const lastWorkshopId = localStorage.getItem('lastActiveWorkshopId');
    if (lastWorkshopId) {
      // If we find a saved ID, update the URL to point to that workshop's dashboard
      setBackUrl(`/${lastWorkshopId}/dashboard`);
    }
  }, []); // Empty dependency array ensures this runs only once

  return (
    <main className="container mx-auto p-4 sm:p-8">
      <div className="mb-4">
        <Button variant="ghost" asChild>
          {/* --- THE FIX: Use the dynamic state variable for the link --- */}
          <Link href={backUrl}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
          </Link>
        </Button>
      </div>
      {children}
    </main>
  );
}