"use server";

import webpush, { type PushSubscription as WebPushSubscription } from "web-push";

export type SubscriptionPayload = {
  endpoint: string;
  expirationTime?: number | null;
  keys: {
    p256dh: string;
    auth: string;
  };
};

function toWebPushSubscription(sub: SubscriptionPayload): WebPushSubscription {
  return {
    endpoint: sub.endpoint,
    expirationTime: sub.expirationTime ?? null,
    keys: {
      p256dh: sub.keys.p256dh,
      auth: sub.keys.auth,
    },
  };
}

webpush.setVapidDetails(
  "mailto:your-email@example.com",
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

let subscription: WebPushSubscription | null = null;

export async function subscribeUser(sub: SubscriptionPayload) {
  subscription = toWebPushSubscription(sub);
  return { success: true };
}

export async function unsubscribeUser() {
  subscription = null;
  return { success: true };
}

export async function sendNotification(message: string) {
  if (!subscription) throw new Error("No subscription available");

  await webpush.sendNotification(
    subscription,
    JSON.stringify({
      title: "Smart Menu",
      body: message,
      icon: "/icons/smart-logo-512x512.png",
    })
  );

  return { success: true };
}
