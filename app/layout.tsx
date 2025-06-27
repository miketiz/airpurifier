import type { Metadata } from "next";
import { Kanit } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from './contexts/ThemeContext';
import { Toaster } from 'react-hot-toast';
import SessionProvider from './components/SessionProvider'

const kanit = Kanit({
  subsets: ["thai", "latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800"],
  variable: "--font-kanit",
});

export const metadata: Metadata = {
  title: "MM-AIR",
  description: "AIR PURIFIER ",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="th" className={kanit.variable}>
      <body>
        <SessionProvider>
          <ThemeProvider>
            {children}
            <Toaster />
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
