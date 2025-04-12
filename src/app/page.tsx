import { auth } from "@/auth";
import { getUser } from "@/db/queries/user";
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
      </header>
      <section>Content here</section>
    </main>
  );
}
