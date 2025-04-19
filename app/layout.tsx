import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/app/providers";
import { Toaster } from "@/components/ui/toaster";
import { Notifications } from "@/components/Notifications";
import { NotificationToast } from "@/components/NotificationToast";

export const metadata: Metadata = {
  title: "Web3 AI Wallet",
  description: "AI-powered Web3 wallet with natural language transaction support",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Providers>
          {children}
          <Toaster />
          <Notifications />
          <NotificationToast />
        </Providers>
      </body>
    </html>
  );
}
