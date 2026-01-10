import NextAuth, { type DefaultSession } from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "./lib/primsa";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      image: string;
      avatar?: string;
      displayName?: string;
      username?: string;
      aboutme?: string;
      auth?: number; // Add auth level to session
      accountVerified?: Date; // Add account verification status to session
      instagram?: string;
    } & DefaultSession["user"];
  }
}

declare module "next-auth" {
  interface JWT {
    id?: string;
    email?: string;
    name?: string;
    image?: string;
    avatar?: string;
    displayName?: string;
    username?: string;
    aboutme?: string;
    auth?: number;
    accountVerified?: Date;
    instagram?: string;
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Google,
    // Magic link credentials provider (used internally after token verification)
    Credentials({
      id: "magic-link",
      name: "Magic Link",
      credentials: {
        userId: { label: "User ID", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.userId) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { id: credentials.userId as string },
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        });

        if (!user) {
          return null;
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
        };
      },
    }),
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
      // All user data is read from the JWT token - no DB access here
      if (session?.user) {
        const userId = token.id ?? token.sub;
        if (userId && typeof userId === "string") {
          session.user.id = userId;
          session.user.email =
            (token.email as string | undefined) ?? session.user.email ?? "";
          session.user.name =
            (token.name as string | undefined) ?? session.user.name ?? "";
          session.user.image =
            (token.image as string | undefined) ?? session.user.image ?? "";
          session.user.avatar = token.avatar as string | undefined;
          session.user.displayName = token.displayName as string | undefined;
          session.user.username = token.username as string | undefined;
          session.user.aboutme = token.aboutme as string | undefined;
          session.user.auth = token.auth as number | undefined;
          session.user.accountVerified = token.accountVerified as
            | Date
            | undefined;
          session.user.instagram = token.instagram as string | undefined;
        }
      }
      return session;
    },
    jwt: async ({ token, user, account, profile }) => {
      // Get user ID from either the new user object (initial login) or existing token
      const userId = user?.id ?? token.id ?? token.sub;

      if (!userId || typeof userId !== "string") {
        return token;
      }

      // On initial login, set basic user info from OAuth
      if (user && user.id) {
        token.sub = user.id;
        token.id = user.id;
        token.email = user.email ?? undefined;
        token.name = user.name ?? undefined;
        token.image = user.image ?? undefined;
      }

      // Always fetch fresh user data from PostgreSQL (ensures latest data after signup/updates)
      const dbUser = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          name: true,
          image: true,
          auth: true,
          accountVerified: true,
        },
      });

      if (dbUser) {
        token.id = dbUser.id;
        token.sub = dbUser.id;
        token.email = dbUser.email ?? undefined;
        token.name = dbUser.name ?? undefined;
        token.image = dbUser.image ?? undefined;
        token.auth = dbUser.auth ?? undefined;
        token.accountVerified = dbUser.accountVerified ?? undefined;
      }

      // Always fetch fresh user data from Neo4j (ensures latest profile data after signup/updates)
      const { getUser } = await import("./db/queries/user");
      let neo4jUser = null;
      try {
        neo4jUser = await getUser(userId);
      } catch {
        // User might not have a Neo4j profile yet (e.g., during OAuth before signup)
        // This is expected and not an error
      }

      if (neo4jUser) {
        token.username =
          (neo4jUser.username as string | undefined) ?? undefined;
        token.displayName =
          (neo4jUser.displayName as string | undefined) ?? undefined;
        token.aboutme = (neo4jUser.bio as string | undefined) ?? undefined;
        // Use Neo4j profile image if available and set
        // If user has Neo4j profile with an image, use it
        // If user has Neo4j profile but no image, keep OAuth/PostgreSQL image
        if (
          neo4jUser.image &&
          typeof neo4jUser.image === "string" &&
          neo4jUser.image.trim() !== ""
        ) {
          token.image = neo4jUser.image;
        }
        // Set avatar from Neo4j if available
        if (
          neo4jUser.avatar &&
          typeof neo4jUser.avatar === "string" &&
          neo4jUser.avatar.trim() !== ""
        ) {
          token.avatar = neo4jUser.avatar;
        } else {
          token.avatar = undefined;
        }
      } else {
        // Clear Neo4j-specific fields if user doesn't have a Neo4j profile yet
        // This ensures the token reflects the current state
        token.username = undefined;
        token.displayName = undefined;
        token.aboutme = undefined;
        token.avatar = undefined;
      }

      return token;
    },
  },
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
});
