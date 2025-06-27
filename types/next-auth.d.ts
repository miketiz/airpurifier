import NextAuth from "next-auth"
import { DefaultSession } from "next-auth"

declare module "next-auth" {
    interface Session {
        user: {
            id: number
            name: string
            email: string
            image: string
            role: string
            provider?: string
            created_at?: string
        }
    }

    interface User {
        id: number
        name: string
        email: string
        image: string
        provider?: string
        created_at?: string
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        id: number
        name: string
        email: string
        picture: string
        userRole: string
        provider?: string
        created_at?: string
    }
}