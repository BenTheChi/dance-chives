import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Chives TV | Dance Chives",
  description: "Watch battle videos in an infinite scroll interface",
};

export default function TVLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
