import NextAuth, { type DefaultSession } from "next-auth";
import { Neo4jAdapter } from "@auth/neo4j-adapter";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import driver from "./db/driver";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "./lib/primsa";


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
      auth?: number; // Add auth level to session
      accountVerified?: Date; // Add account verification status to session
    } & DefaultSession["user"];
  }
}

// const neo4jSession = driver.session();

// export const { handlers, auth, signIn, signOut } = NextAuth({
//   providers: [Google],
//   adapter: Neo4jAdapter(neo4jSession),
// });

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Google,
    // Test login provider - only for development
    ...(process.env.NODE_ENV === "development"
      ? [
          Credentials({
            id: "test-login",
            name: "Test Login",
            credentials: {
              userId: { label: "User ID", type: "text" },
            },
            async authorize(credentials) {
              if (!credentials?.userId) {
                return null;
              }

              // Fetch user from database
              const user = await prisma.user.findUnique({
                where: { id: credentials.userId as string },
                select: {
                  id: true,
                  name: true,
                  email: true,
                  image: true,
                  auth: true,
                  accountVerified: true,
                },
              });

              if (!user) {
                return null;
              }

              console.log(
                `🧪 Test login: ${user.email} (Auth Level: ${user.auth ?? 0})`
              );

              return {
                id: user.id,
                name: user.name,
                email: user.email,
                image: user.image,
              };
            },
          }),
        ]
      : []),
  ],
  callbacks: {
    session: async ({ session, token }) => {
      if (session?.user && token.sub) {
        // Fetch user's auth level and account verification status from PostgreSQL
        const dbUser = await prisma.user.findUnique({
          where: { id: token.sub },
          select: {
            id: true,
            auth: true,
            accountVerified: true,
            // Add other custom fields you want in session
          },
        });

        // Fetch username from Neo4j
        const { getUser } = await import("./db/queries/user");
        let neo4jUser = null;
        try {
          neo4jUser = await getUser(token.sub);
        } catch (error) {
          // User might not have a Neo4j profile yet
          console.log("No Neo4j profile found for user:", token.sub);
        }

        session.user.id = token.sub;
        session.user.auth = dbUser?.auth ?? undefined;
        session.user.accountVerified = dbUser?.accountVerified ?? undefined;
        session.user.username = neo4jUser?.username ?? undefined;
        session.user.displayName = neo4jUser?.displayName ?? undefined;
        // Use Neo4j profile image if available
        // If user has Neo4j profile but no image (empty string or null), set to empty string to show placeholder
        // If no Neo4j profile exists yet, keep OAuth image
        if (neo4jUser) {
          session.user.image = neo4jUser.image || "";
        }
      }
      return session;
    },
    jwt: async ({ token, user }) => {
      if (user) {
        token.sub = user.id;
      }
      return token;
    },
  },
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
});
