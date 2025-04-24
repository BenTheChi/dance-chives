import { auth } from "@/auth";
import { Button } from "@/components/ui/button";
import { getUser } from "@/db/queries/user";
import { redirect } from "next/navigation";

export default async function Home() {
  const session = await auth();

  if (!session) {
    return <div>Not logged in</div>;
  }

  const result = await getUser(session?.user.id);

  console.log(result);

  return (
    <main>
      <header>
        <h1>Home</h1>
        <Button onClick={redirect("/add-event")}>Add Event</Button>
      </header>
      <section>Content here</section>
    </main>
  );
}
