import { NextAuthOptions } from "next-auth";
import { SupabaseAdapter } from "@auth/supabase-adapter";
import GoogleProvider from "next-auth/providers/google";
// import CredentialsProvider from "next-auth/providers/credentials"
// import bcrypt from "bcryptjs"
// import { NextRequest } from "next/server";

const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  adapter: SupabaseAdapter({
    url: process.env.SUPABASE_URL as string,
    secret: process.env.SUPABASE_SERVICE_ROLE_KEY as string,
  }),
  debug: process.env.NODE_ENV === "development",
  session: { strategy: "jwt" },
  // pages: {

  //   signIn: "/auth/login",
  // },
};

// TODO Add basic auth via this credentials factory but make sure to 1. add hashed Password field to user table , 2.add constrain for make it NULL when provider is google , 3. redirect google login user to page where create new password to allow him use this auth in future

/*
CredentialsProvider({
  name: "Email and Password",
  credentials: {
    email: { label: "Email", type: "email", placeholder: "john@example.com" },
    password: { label: "Password", type: "password" }
  },
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  authorize: async (credentials, req) => {
    if (!credentials) return null

    // get user from Supabase by email
    const res = await fetch(`${process.env.NEXTAUTH_URL}/api/auth/get-user`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: credentials.email }),
    })

    const user = await res.json()
    if (!user) return null

    // compare hashed password
    const isValid = await bcrypt.compare(credentials.password, user.hashedPassword)

    if (!isValid) return null

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      image: user.image ?? null,
    }
  }
})
*/
export default authOptions;
