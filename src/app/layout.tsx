import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";

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

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
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
                <meta
                    property="og:url"
                    content="https://www.dancechives.com/"
                />
                <meta property="og:type" content="website" />
            </head>
            <body
                className={`${geistSans.variable} ${geistMono.variable} antialiased`}
            >
                <SidebarProvider>
                    <div className="flex w-full">
                        <AppSidebar />
                        <SidebarTrigger />
                        <main className="flex flex-col flex-1">{children}</main>
                    </div>
                </SidebarProvider>
            </body>
        </html>
    );
}
