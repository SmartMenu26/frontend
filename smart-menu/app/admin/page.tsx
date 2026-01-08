"use client";

import { useEffect, useState } from "react";
import { subscribeUser, unsubscribeUser, sendNotification } from "../actions";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

export default function AdminPushPage() {
  const [isSupported, setIsSupported] = useState(false);
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if ("serviceWorker" in navigator && "PushManager" in window) {
      setIsSupported(true);
      (async () => {
        const reg = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
          updateViaCache: "none",
        });
        const sub = await reg.pushManager.getSubscription();
        setSubscription(sub);
      })();
    }
  }, []);

  async function subscribeToPush() {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(
        process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
      ),
    });
    setSubscription(sub);
    await subscribeUser(JSON.parse(JSON.stringify(sub)));
  }

  async function unsubscribeFromPush() {
    await subscription?.unsubscribe();
    setSubscription(null);
    await unsubscribeUser();
  }

  async function sendTest() {
    if (!subscription) return;
    await sendNotification(message);
    setMessage("");
  }

  if (!isSupported) return <p>Push not supported in this browser.</p>;

  return (
    <div style={{ padding: 16 }}>
      <h2>Push Notifications</h2>

      {subscription ? (
        <>
          <p>Subscribed ✅</p>
          <button onClick={unsubscribeFromPush}>Unsubscribe</button>
          <div style={{ marginTop: 12 }}>
            <input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Test message"
            />
            <button onClick={sendTest}>Send Test</button>
          </div>
        </>
      ) : (
        <>
          <p>Not subscribed</p>
          <button onClick={subscribeToPush}>Subscribe</button>
        </>
      )}
    </div>
  );
}
