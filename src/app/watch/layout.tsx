import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Watch | Dance Chives",
  description: "Watch battle videos in an infinite scroll interface",
};

export default function WatchLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
