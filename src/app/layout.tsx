import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import Nav from "./components/Nav";
import NotificationProvider from "./components/NotificationProvider";
import { ToastContainer } from "react-toastify";

// Fonts are vendored in src/app/fonts so builds work fully offline
// (next/font/google fetches at build time and fails without network)
const inter = localFont({
  src: "./fonts/InterVariable.woff2",
  weight: "100 900",
  display: "swap",
});
const bebas = localFont({
  src: "./fonts/BebasNeue-Regular.woff2",
  weight: "400",
  display: "swap",
  variable: "--font-bebas",
});

export const metadata: Metadata = {
  title: "Afghan Travel Agency",
  description:
    "We are your reliable partner in your Journeys, at Afghan Travel Agency we provide you with the best services for your travels.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} ${bebas.variable} antialiased bg-night`}>
        <div className="min-h-screen bg-night text-stone-200">
          <ToastContainer theme="dark" draggable position="bottom-right" />
          <NotificationProvider />
          <Nav />
          {children}
        </div>
      </body>
    </html>
  );
}
