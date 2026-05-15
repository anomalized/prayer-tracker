import type { Metadata, Viewport } from "next";
import "./globals.css";
import ServiceWorkerProvider from "@/components/ui/ServiceWorkerProvider";

export const metadata: Metadata = {
  title: "Salah Tracker 🌸",
  description: "Your personal prayer companion",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Salah Tracker",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f0c8bc",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="icon" href="/icon-192.png" />
      </head>
      <body className="min-h-screen bg-nude-50 font-body">
        <ServiceWorkerProvider />
        {/*each route group owns its own max-width */}
        {children}
      </body>
    </html>
  );
}