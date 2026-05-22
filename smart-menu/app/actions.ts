"use server";

import webpush, { type PushSubscription as WebPushSubscription } from "web-push";
import fs from "fs/promises";
import path from "path";

export type SubscriptionPayload = {
  endpoint: string;
  expirationTime?: number | null;
  keys: {
    p256dh: string;
    auth: string;
  };
};

const SUBSCRIPTIONS_FILE = path.join(process.cwd(), "lib", "push-subscriptions.json");

// Helper to safely read subscriptions from the file
async function getStoredSubscriptions(): Promise<SubscriptionPayload[]> {
  try {
    const data = await fs.readFile(SUBSCRIPTIONS_FILE, "utf-8");
    return JSON.parse(data) as SubscriptionPayload[];
  } catch (error: any) {
    if (error.code === "ENOENT") {
      return [];
    }
    console.error("Error reading subscriptions file:", error);
    return [];
  }
}

// Helper to safely write subscriptions to the file
async function saveSubscriptions(subscriptions: SubscriptionPayload[]): Promise<void> {
  try {
    await fs.mkdir(path.dirname(SUBSCRIPTIONS_FILE), { recursive: true });
    await fs.writeFile(SUBSCRIPTIONS_FILE, JSON.stringify(subscriptions, null, 2), "utf-8");
  } catch (error) {
    console.error("Error writing subscriptions file:", error);
  }
}

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

export async function subscribeUser(sub: SubscriptionPayload) {
  const subscriptions = await getStoredSubscriptions();
  const exists = subscriptions.some((s) => s.endpoint === sub.endpoint);
  if (!exists) {
    subscriptions.push(sub);
    await saveSubscriptions(subscriptions);
  }
  return { success: true };
}

export async function unsubscribeUser(endpoint: string) {
  const subscriptions = await getStoredSubscriptions();
  const filtered = subscriptions.filter((s) => s.endpoint !== endpoint);
  await saveSubscriptions(filtered);
  return { success: true };
}

export async function sendNotification(message: string) {
  const subscriptions = await getStoredSubscriptions();
  if (subscriptions.length === 0) {
    return { success: true, message: "No active subscriptions." };
  }

  const payload = JSON.stringify({
    title: "Smart Menu",
    body: message,
    icon: "/icons/smart-logo-192x192.png",
  });

  const staleEndpoints: string[] = [];

  const promises = subscriptions.map(async (sub) => {
    try {
      await webpush.sendNotification(toWebPushSubscription(sub), payload);
    } catch (error: any) {
      console.error("Web Push sending failed for endpoint:", sub.endpoint, error);
      if (error.statusCode === 410 || error.statusCode === 404) {
        staleEndpoints.push(sub.endpoint);
      }
    }
  });

  await Promise.all(promises);

  if (staleEndpoints.length > 0) {
    const updated = subscriptions.filter((sub) => !staleEndpoints.includes(sub.endpoint));
    await saveSubscriptions(updated);
  }

  return { success: true };
}

export async function sendPushToAll(title: string, body: string) {
  const subscriptions = await getStoredSubscriptions();
  if (subscriptions.length === 0) {
    return { success: true, message: "No active subscriptions." };
  }

  const payload = JSON.stringify({
    title,
    body,
    icon: "/icons/smart-logo-192x192.png",
  });

  const staleEndpoints: string[] = [];

  const promises = subscriptions.map(async (sub) => {
    try {
      await webpush.sendNotification(toWebPushSubscription(sub), payload);
    } catch (error: any) {
      console.error("Web Push sending failed for endpoint:", sub.endpoint, error);
      if (error.statusCode === 410 || error.statusCode === 404) {
        staleEndpoints.push(sub.endpoint);
      }
    }
  });

  await Promise.all(promises);

  if (staleEndpoints.length > 0) {
    const updated = subscriptions.filter((sub) => !staleEndpoints.includes(sub.endpoint));
    await saveSubscriptions(updated);
  }

  return { success: true };
}
