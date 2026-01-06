import { withPageAuth } from "@/lib/utils/page-auth";
import { AppNavbar } from "@/components/AppNavbar";
import { SettingsClient } from "./settings-client";
import { auth } from "@/auth";
import { prisma } from "@/lib/primsa";

export default async function SettingsPage() {
  return withPageAuth({ requireVerification: true }, async () => {
    const session = await auth();
    let optOutOfMarketing = false;

    if (session?.user?.id) {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
      });
      optOutOfMarketing =
        (user as { optOutOfMarketing?: boolean })?.optOutOfMarketing ?? false;
    }

    return (
      <>
        <AppNavbar />
        <div className="flex flex-col gap-4 p-6 md:px-4">
          <div className="container mx-auto px-4 sm:px-4 py-6 max-w-full overflow-x-hidden">
            <h1 className="text-3xl font-bold text-center mb-8">
              Account Settings
            </h1>
            <SettingsClient initialOptOutOfMarketing={optOutOfMarketing} />
          </div>
        </div>
      </>
    );
  });
}
