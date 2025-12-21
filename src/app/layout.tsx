import type { Metadata } from "next";
import { Archivo, Rubik_Mono_One } from "next/font/google";
import "./globals.css";

import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { SessionProvider } from "next-auth/react";
import { auth } from "@/auth";
import { Toaster } from "@/components/ui/sonner";

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
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  return (
    <html lang="en" className={`${archivo.variable} ${rubikMonoOne.variable}`}>
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
      <body className="antialiased">
        <SessionProvider session={session}>
          <SidebarProvider>
            <div className="flex w-full">
              <AppSidebar />
              <main className="flex flex-col flex-1">{children}</main>
            </div>
          </SidebarProvider>
        </SessionProvider>
        <Toaster />
      </body>
    </html>
  );
}
