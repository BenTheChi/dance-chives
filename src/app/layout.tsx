import type { Metadata } from "next";
import { Nunito, Nunito_Sans } from "next/font/google";
import Script from "next/script";
import "./globals.css";

import { SidebarProvider } from "@/components/ui/sidebar";
import { SessionProvider } from "next-auth/react";
import { auth } from "@/auth";
import { Toaster } from "@/components/ui/sonner";

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
  display: "swap",
});

const nunitoSans = Nunito_Sans({
  variable: "--font-nunito-sans",
  subsets: ["latin"],
  display: "swap",
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

  // Log server-side environment
  const nodeEnv = process.env.NODE_ENV || "development";
  const vercelEnv = process.env.VERCEL_ENV;
  const appEnv = process.env.APP_ENV;

  // Determine actual environment (staging vs production)
  // Note: NODE_ENV can be "staging" even though TypeScript types don't include it
  const nodeEnvStr = String(nodeEnv);
  const actualEnv =
    vercelEnv === "preview" || nodeEnvStr === "staging" || appEnv === "staging"
      ? "staging"
      : nodeEnvStr === "production" || vercelEnv === "production"
      ? "production"
      : "development";

  console.log("🔧 [SERVER] Environment:", {
    NODE_ENV: nodeEnv,
    VERCEL_ENV: vercelEnv || "not set",
    APP_ENV: appEnv || "not set",
    actualEnv,
    DATABASE_URL: process.env.DATABASE_URL ? "✅ Set" : "❌ Not set",
    DEV_DATABASE_URL: process.env.DEV_DATABASE_URL ? "✅ Set" : "❌ Not set",
    usingDevDb: actualEnv === "development",
  });

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
        className={`${nunito.variable} ${nunitoSans.variable} antialiased font-sans`}
      >
        <SessionProvider session={session}>
          <SidebarProvider>
            <div className="flex w-full">
              {/* <AppSidebar /> */}
              <main className="flex flex-col flex-1">{children}</main>
            </div>
          </SidebarProvider>
        </SessionProvider>
        <Toaster />
        {/* MailerLite Universal */}
        <Script
          id="mailerlite-universal"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
    (function(w,d,e,u,f,l,n){w[f]=w[f]||function(){(w[f].q=w[f].q||[])
    .push(arguments);},l=d.createElement(e),l.async=1,l.src=u,
    n=d.getElementsByTagName(e)[0],n.parentNode.insertBefore(l,n);})
    (window,document,'script','https://assets.mailerlite.com/js/universal.js','ml');
    ml('account', '1952934');
`,
          }}
        />
      </body>
    </html>
  );
}
