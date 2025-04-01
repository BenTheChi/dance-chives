import NextAuth, { type DefaultSession } from "next-auth";
import neo4j from "neo4j-driver";
import { Neo4jAdapter } from "@auth/neo4j-adapter";
import Google from "next-auth/providers/google";

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

const driver = neo4j.driver(
  process.env.NEO4J_URI ||
    (() => {
      throw new Error("NEO4J_URI is not defined");
    })(),
  neo4j.auth.basic(
    process.env.NEO4J_USERNAME ||
      (() => {
        throw new Error("NEO4J_USERNAME is not defined");
      })(),
    process.env.NEO4J_PASSWORD ||
      (() => {
        throw new Error("NEO4J_PASSWORD is not defined");
      })()
  )
);

const neo4jSession = driver.session();

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [Google],
  adapter: Neo4jAdapter(neo4jSession),
});
