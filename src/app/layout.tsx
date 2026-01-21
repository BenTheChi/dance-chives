import type { Metadata } from "next";
import { Archivo, Rubik_Mono_One } from "next/font/google";
import "./globals.css";

import { SessionProvider } from "next-auth/react";
import { Toaster } from "@/components/ui/sonner";
import { Footer } from "@/components/Footer";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { AppNavbar } from "@/components/AppNavbar";
import { AccountVerificationRedirector } from "@/components/account-verification-redirector";
import { SubmissionOverlayProvider } from "@/components/SubmissionOverlay";

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

const baseUrl =
  process.env.NEXT_PUBLIC_BASE_URL || "https://www.dancechives.com";

const defaultImageUrl = `${baseUrl}/mascot/Dancechives_MainLogo_Color_onLight.png`;

export const metadata: Metadata = {
  title: "Dance Chives",
  description:
    "The free community archive for street dance events and battle videos",
  keywords: [
    "street dance",
    "dance battles",
    "dance events",
    "freestyle dance",
    "dance community",
    "battle videos",
    "dance videos",
    "dance archive",
    "hip hop dance",
    "breaking",
    "breakdance",
    "popping",
    "locking",
    "house",
    "krump",
    "waacking",
    "voguing",
    "bboying",
    "b-boying",
    "waacking",
    "voguing",
    "dance competitions",
  ].join(", "),
  authors: [{ name: "Ben Chi - Heartbreaker" }],
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [{ url: "/favicon.ico", sizes: "any" }],
    shortcut: [{ url: "/favicon.ico" }],
  },
  openGraph: {
    title: "Dance Chives",
    description:
      "The free community archive for street dance events and battle videos",
    url: baseUrl,
    siteName: "Dance Chives",
    images: [
      {
        url: defaultImageUrl,
        width: 1200,
        height: 630,
        alt: "Dance Chives Logo",
      },
    ],
    type: "website",
  },
  other: {
    "article:author": "Ben Chi - Heartbreaker",
    "og:image:type": "image/png",
    "og:image:secure_url": defaultImageUrl,
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
          content="minimum-scale=1, maximum-scale=1, initial-scale=1, width=device-width, user-scalable=no, viewport-fit=cover"
        />
        {/* MailerLite Universal */}
        <script
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
        {/* End MailerLite Universal */}
      </head>
      <body className="antialiased relative">
        {/* Background pattern for all pages */}
        <div
          className="fixed inset-0 z-0 opacity-80"
          style={{
            backgroundImage: "url(/shattered-island.gif)",
            backgroundRepeat: "repeat",
            backgroundSize: "auto",
          }}
        />
        <SessionProvider>
          <SubmissionOverlayProvider>
            <AccountVerificationRedirector />
            <SidebarProvider>
              <AppSidebar />
              <div className="flex flex-col min-h-screen w-full relative z-10">
                <AppNavbar />
                <main className="flex flex-col flex-1">{children}</main>
                <Footer />
              </div>
            </SidebarProvider>
          </SubmissionOverlayProvider>
        </SessionProvider>
        <Toaster />
      </body>
    </html>
  );
}
