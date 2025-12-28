import type { Metadata } from "next";
import { Archivo, Rubik_Mono_One } from "next/font/google";
import "./globals.css";

import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { SessionProvider } from "next-auth/react";
import { Toaster } from "@/components/ui/sonner";
import { Footer } from "@/components/Footer";

const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
});

const rubikMonoOne = Rubik_Mono_One({
  variable: "--font-rubik-mono-one",
  subsets: ["latin"],
  weight: ["400"],
});

export const metadata: Metadata = {
  title: "Dance Chives",
  description: "Freestyle Dance Culture, Media, and Community",
  icons: {
    icon: [
      { url: "/icon.svg", sizes: "any" },
      { url: "/icon.svg", sizes: "512x512", type: "image/svg+xml" },
    ],
    apple: [{ url: "/icon.svg", sizes: "180x180", type: "image/svg+xml" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${archivo.variable} ${rubikMonoOne.variable}`}>
      <head>
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
      <body className="antialiased">
        <SessionProvider>
          <SidebarProvider>
            <div className="flex flex-col min-h-screen w-full">
              <div className="flex flex-1 w-full">
                <AppSidebar />
                <main className="flex flex-col flex-1">{children}</main>
              </div>
              <Footer />
            </div>
          </SidebarProvider>
        </SessionProvider>
        <Toaster />
      </body>
    </html>
  );
}
