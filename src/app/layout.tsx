import type { Metadata } from "next";
import { Archivo, Rubik_Mono_One } from "next/font/google";
import "./globals.css";

import { SessionProvider } from "next-auth/react";
import { Toaster } from "@/components/ui/sonner";
import { Footer } from "@/components/Footer";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";

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
  openGraph: {
    title: "Dance Chives",
    description: "Freestyle Dance Culture, Media, and Community",
    url: baseUrl,
    siteName: "Dance Chives",
    images: [
      {
        url: `${baseUrl}/mascot/Dancechives_MainLogo_Color_onLight.png`,
        width: 1200,
        height: 630,
        alt: "Dance Chives Logo",
      },
    ],
    type: "website",
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
        <meta
          property="og:image"
          content={`${baseUrl}/mascot/Dancechives_MainLogo_Color_onLight.png`}
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
      <body className="antialiased">
        <SessionProvider>
          <SidebarProvider>
            <AppSidebar />
            <div className="flex flex-col min-h-screen w-full">
              <main className="flex flex-col flex-1">{children}</main>
              <Footer />
            </div>
          </SidebarProvider>
        </SessionProvider>
        <Toaster />
      </body>
    </html>
  );
}
