export const trackEvent = (
  eventName: string,
  params: Record<string, any> = {}
) => {
  if (typeof window === "undefined") return;

  // @ts-ignore
  window.gtag?.("event", eventName, params);
};