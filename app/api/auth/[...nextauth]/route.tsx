import NextAuth, { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import FacebookProvider from "next-auth/providers/facebook";
import CredentialsProvider from "next-auth/providers/credentials";
import axios from "axios";

import personIcon from "@/public/img/profile/profile-user.png";

const API_BASE = process.env.PRIVATE_API_AUTH || "http://172.25.11.111:8000/auth";

export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            name: "credentials",
            credentials: {
                username: { label: "Username", type: "text" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                if (!credentials) throw new Error("Missing credentials");

                try {
                    const { data } = await axios.post(`${API_BASE}/login`, {
                        username: credentials.username,
                        password: credentials.password
                    });

                    if (data.status === 1 && data.data?.user) {
                        const user = data.data.user;
                        return {
                            id: user.web_user_id,
                            name: user.username,
                            email: user.email,
                            image: user.image ?? "/img/profile/profile-user.png",
                            provider: "local",
                            created_at: user.create_at, // <-- เปลี่ยนตรงนี้
                        };
                    } else {
                        throw new Error(data.message || "เข้าสู่ระบบล้มเหลว");
                    }
                } catch (err: any) {
                    console.error("Login error:", err.response?.data || err.message);
                    throw new Error("ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง");
                }
            }
            ,
        }),

        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID || "",
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
            authorization: {
                params: {
                    prompt: "consent",
                    access_type: "offline",
                    response_type: "code",
                },
            },
        }),

        FacebookProvider({
            clientId: process.env.FACEBOOK_CLIENT_ID || "",
            clientSecret: process.env.FACEBOOK_CLIENT_SECRET || "",
        }),
    ],

    callbacks: {
        async signIn({ user, account }) {
            if (!account) return false;

            if (account.provider === "credentials") {
                return true;
            }

            try {
                const { data } = await axios.post(`${API_BASE}/oauth`, {
                    provider: account.provider,
                    provider_user_id: account.providerAccountId,
                    username: user.name,
                    email: user.email,
                    image: user.image,
                    created_at: user.created_at,
                });

                if (data.status === 1 && data.data?.user) {
                    const apiUser = data.data.user;
                    user.id = apiUser.web_user_id;
                    user.name = apiUser.username;
                    user.email = apiUser.email;
                    user.image = apiUser.image ?? "/img/profile/profile-user.png";
                    user.created_at = apiUser.create_at; // <-- เปลี่ยนตรงนี้
                    user.provider = apiUser.provider;
                    return true;
                }
                
                return false;
            } catch (err) {
                console.error("OAuth error:", err);
                return false;
            }
        },

        async jwt({ token, user }) {
            if (user) {
                console.log("JWT User Data:", user); // เพิ่ม debug log
                token.id = Number(user.id);
                token.name = user.name;
                token.email = user.email;
                token.picture = user.image;
                token.provider = user.provider;
                token.created_at = user.created_at; // <-- เอา fallback ออก
            }
            return token;
        },

        async session({ session, token }) {
            console.log("Session Token Data:", token); // เพิ่ม debug log
            if (session.user) {
                session.user.id = token.id;
                session.user.name = token.name;
                session.user.email = token.email;
                session.user.image = token.picture;
                session.user.provider = token.provider;
                session.user.created_at = token.created_at;
            }
            return session;
        }
    },

    pages: {
        signIn: "/login",
        error: "/login",
    },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };