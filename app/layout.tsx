import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { Analytics } from "@vercel/analytics/next";
import { ServiceWorkerRegistration } from "@/components/pwa/ServiceWorkerRegistration";
import { ToastProvider } from "@/lib/toast-context";
import { ToastContainer } from "@/components/ui/ToastContainer";
import { NotificationListener } from "@/components/layout/NotificationListener";
import "./globals.css";

const rosemary = localFont({
  src: "../public/fonts/Rosemary.ttf",
  variable: "--font-rosemary",
});

export const viewport: Viewport = {
  themeColor: "#111827",
};

export const metadata: Metadata = {
  title: "Bliss",
  description: "Hookup with locals nearby.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Bliss",
  },
  icons: {
    apple: "/images/bliss_icon.png",
    icon: "/images/bliss_icon.png",
  },
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${rosemary.variable} antialiased`}>
        <ServiceWorkerRegistration />
        <ToastProvider>
          <NotificationListener />
          <ToastContainer />
          {children}
          <Analytics />
        </ToastProvider>
      </body>
    </html>
  );
}
