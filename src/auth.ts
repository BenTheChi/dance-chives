import NextAuth, { type DefaultSession } from "next-auth";
import { Neo4jAdapter } from "@auth/neo4j-adapter";
import Google from "next-auth/providers/google";
import driver from "./db/driver";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      image: string;
      displayName?: string;
      username?: string;
      aboutme?: string;
    } & DefaultSession["user"];
  }
}

const neo4jSession = driver.session();

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [Google],
  adapter: Neo4jAdapter(neo4jSession),
});
