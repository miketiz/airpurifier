import type { NextConfig } from 'next'

const nextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: "https",
                hostname: "platform-lookaside.fbsbx.com",
                pathname: "/platform/profilepic/**",
            },
            {
                protocol: "https",
                hostname: "lh3.googleusercontent.com",
                pathname: "/**",
            },
        ],
        domains: [
            "platform-lookaside.fbsbx.com",
            "lh3.googleusercontent.com",
        ],
    },
};

export default nextConfig;