import type { Metadata } from "next";
import { Inter, Bebas_Neue } from "next/font/google";
import "./globals.css";
import Nav from "./components/Nav";
import NotificationProvider from "./components/NotificationProvider";
import { ToastContainer } from "react-toastify";

const inter = Inter({ subsets: ["latin"] });
const bebas = Bebas_Neue({
  subsets: ["latin"],
  weight: ["400"],
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
