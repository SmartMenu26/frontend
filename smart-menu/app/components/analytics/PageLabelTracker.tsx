"use client";

import { useEffect } from "react";
import { trackEvent } from "@/app/lib/analytics";

type Props = {
  label: string;
  locale: string;
};

export function PageLabelTracker({ label, locale }: Props) {
  useEffect(() => {
    trackEvent("page_label", { label, locale });
  }, [label, locale]);

  return null;
}
