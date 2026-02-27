"use client";

import Link from "next/link";
import type { ComponentProps, AnchorHTMLAttributes, MouseEvent } from "react";
import { trackEvent } from "@/app/lib/analytics";

type EventProps = {
  eventName: string;
  eventParams?: Record<string, any>;
};

export function TrackedLink({
  eventName,
  eventParams,
  onClick,
  children,
  ...props
}: ComponentProps<typeof Link> & EventProps) {
  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(event);
    trackEvent(eventName, eventParams);
  };

  return (
    <Link {...props} onClick={handleClick}>
      {children}
    </Link>
  );
}

export function TrackedAnchor({
  eventName,
  eventParams,
  onClick,
  children,
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement> & EventProps) {
  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(event);
    trackEvent(eventName, eventParams);
  };

  return (
    <a {...props} onClick={handleClick}>
      {children}
    </a>
  );
}
