import React, { useState, useEffect } from "react";

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, "+")
    .replace(/_/g, "/");

  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

export default function App() {
  const [registration, setRegistration] = useState(null);
  const [subscription, setSubscription] = useState(null);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          console.log("✅ Service Worker Registered:", reg);
          return navigator.serviceWorker.ready;
        })
        .then((readyReg) => {
          console.log("✅ Service Worker Ready:", readyReg);
          setRegistration(readyReg);
        })
        .catch((err) => console.error("❌ SW registration error:", err));
    }
  }, []);

  const subscribe = async () => {
    if (!registration) return alert("Service Worker not ready");

    console.log("🔍 VAPID key:", VAPID_PUBLIC_KEY);
    console.log("🔍 Registration object:", registration);


    try {
      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });

      console.log("✅ Subscription created:", sub);

      // Save subscription to backend
      const res = await fetch(`${API_URL}/subscribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sub),
      });

      if (!res.ok) throw new Error("Failed to save subscription");

      setSubscription(sub);
      alert("✅ Device subscribed successfully!");
    } catch (err) {
      console.error("❌ Error during subscription:", err);
      alert("Failed to subscribe");
    }
  };

  const sendNotification = async () => {
    if (!subscription) return alert("Please subscribe first");

    const res = await fetch(`${API_URL}/sendNotification`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(subscription),
    });

    if (res.ok) alert("📨 Notification sent!");
    else alert("❌ Failed to send notification");
  };

  const unsubscribe = async () => {
    if (!subscription) return alert("No active subscription");

    await subscription.unsubscribe();
    setSubscription(null);
    alert("Unsubscribed");
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-black text-white">
      <h1 className="text-3xl font-bold mb-4">🔔 Web Push Test PWA</h1>
      <div className="flex gap-3">
        <button onClick={subscribe} className="px-4 py-2 bg-blue-600 rounded">
          Subscribe this device
        </button>
        <button onClick={sendNotification} className="px-4 py-2 bg-green-600 rounded">
          Send notification here
        </button>
        <button onClick={unsubscribe} className="px-4 py-2 bg-red-600 rounded">
          Unsubscribe
        </button>
      </div>
      <p className="text-sm mt-4 opacity-70">
        Install this app as a PWA to test iPhone Push Notifications.
      </p>
    </div>
  );
}
