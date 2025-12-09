import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { SessionProvider } from "next-auth/react";
import { auth } from "@/auth";
import { Toaster } from "@/components/ui/sonner";
import { ReportButton } from "@/components/report/ReportButton";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Dance Chives",
  description: "Freestyle Dance Culture, Media, and Community",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  return (
    <html lang="en">
      <head>
        <link rel="shortcut icon" href="logo.svg" />
        <meta
          name="viewport"
          content="minimum-scale=1, initial-scale=1, width=device-width, user-scalable=no"
        />
        <meta property="og:title" content="Dance Chives" />
        <meta
          property="og:description"
          content="Freestyle Dance Culture, Media, and Community"
        />
        <meta property="og:url" content="https://www.dancechives.com/" />
        <meta property="og:type" content="website" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <SessionProvider session={session}>
          <SidebarProvider>
            <div className="flex w-full">
              <AppSidebar />
              <main className="flex flex-col flex-1">{children}</main>
            </div>
          </SidebarProvider>
          <ReportButton />
        </SessionProvider>
        <Toaster />
      </body>
    </html>
  );
}
