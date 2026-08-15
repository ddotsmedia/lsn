import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { z } from "zod"

const LOGIN_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"

// Validation schema
const CredentialsSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  totp: z.string().optional(),
})

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        totp: { label: "TOTP (if enabled)", type: "text" },
      },
      async authorize(credentials) {
        try {
          // Validate credentials
          const validated = CredentialsSchema.parse(credentials)

          // Call backend login API
          const response = await fetch(`${LOGIN_URL}/api/v1/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(validated),
          })

          if (!response.ok) {
            throw new Error("Invalid credentials")
          }

          const data = await response.json()

          // Return user object
          return {
            id: data.user.id,
            email: data.user.email,
            name: data.user.name,
            role: data.user.role,
            image: data.user.avatar,
            accessToken: data.accessToken,
            refreshToken: data.refreshToken,
            requiresMFA: data.requiresMFA,
            sessionId: data.sessionId,
          }
        } catch (error) {
          console.error("Auth error:", error)
          return null
        }
      },
    }),
  ],

  pages: {
    signIn: "/auth/login",
    error: "/auth/error",
  },

  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 hours
    updateAge: 60 * 60, // 1 hour
  },

  jwt: {
    maxAge: 24 * 60 * 60,
    secret: process.env.NEXTAUTH_SECRET,
  },

  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id
        token.email = user.email
        token.role = user.role as string
        token.accessToken = user.accessToken as string
        token.refreshToken = user.refreshToken as string
        token.requiresMFA = user.requiresMFA as boolean
        token.sessionId = user.sessionId as string
      }
      return token
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.email = token.email as string
        session.user.role = token.role as string
        session.user.image = token.picture
      }
      session.accessToken = token.accessToken as string
      session.refreshToken = token.refreshToken as string
      session.requiresMFA = token.requiresMFA as boolean
      return session
    },

    async redirect({ url, baseUrl }) {
      // Allow relative URLs
      if (url.startsWith("/")) return `${baseUrl}${url}`
      // Allow same origin URLs
      if (new URL(url).origin === baseUrl) return url
      return baseUrl
    },
  },

  events: {
    async signIn({ user, account, isNewUser }) {
      console.log("User signed in:", user.email)
    },

    async signOut({ token }) {
      console.log("User signed out:", token?.email)
    },

    async error({ error }) {
      console.error("Auth error:", error)
    },
  },

  debug: process.env.NODE_ENV === "development",
})

// Add custom type extensions
declare module "next-auth" {
  interface User {
    id: string
    role: string
    accessToken: string
    refreshToken: string
    requiresMFA?: boolean
    sessionId?: string
  }

  interface Session {
    user: User & {
      email: string
      name: string
      image?: string
    }
    accessToken: string
    refreshToken: string
    requiresMFA: boolean
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    email: string
    role: string
    accessToken: string
    refreshToken: string
    requiresMFA: boolean
    sessionId?: string
  }
}
