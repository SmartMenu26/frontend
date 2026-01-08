"use server";

import webpush from "web-push";

webpush.setVapidDetails(
  "mailto:your-email@example.com",
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

let subscription: PushSubscription | null = null;

export async function subscribeUser(sub: PushSubscription) {
  subscription = sub;
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
      icon: "/icons/icon-192.png",
    })
  );

  return { success: true };
}
