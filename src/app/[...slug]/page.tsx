import { redirect } from "next/navigation";

// Check if maintenance mode is enabled
const isMaintenanceMode = process.env.NEXT_PUBLIC_MAINTENANCE_MODE === "true";

export default function CatchAll() {
  // If maintenance mode is enabled, redirect to homepage
  if (isMaintenanceMode) {
    redirect("/");
  }

  // If maintenance mode is disabled, this route won't be hit
  // (Next.js will use the actual route handlers)
  return null;
}
