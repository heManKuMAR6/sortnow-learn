"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { captureCampaign } from "@/lib/campaign";

/** Remembers ?src=... from the link a visitor arrived on. Stores one short tag, nothing else. */
export function CampaignCapture() {
  const pathname = usePathname();
  useEffect(() => {
    captureCampaign();
  }, [pathname]);
  return null;
}
