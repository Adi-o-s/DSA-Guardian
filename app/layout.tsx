import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { auth, signOut } from "@/lib/auth";
import { Providers } from "@/components/app/Providers";
import { AppShell } from "@/components/app/AppShell";
import { Landing } from "@/components/marketing/Landing";
import "./globals.css";

const sans = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-mono",
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://adityashrotriya.me";

// Dynamically generated metadata images (opengraph-image, apple-icon) are NOT
// basePath-prefixed by Next, unlike static ones and the manifest link — so the
// URLs below are prefixed by hand.
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "DSA Guardian",
    template: "%s · DSA Guardian",
  },
  description:
    "Striver's A2Z sheet, live LeetCode progress, daily goals and contest upsolving — unified in one streak-driven dashboard.",
  applicationName: "DSA Guardian",
  keywords: [
    "DSA",
    "LeetCode",
    "Striver A2Z",
    "interview preparation",
    "coding practice",
  ],
  icons: {
    icon: `${BASE_PATH}/icon.svg`,
    apple: `${BASE_PATH}/apple-icon`,
  },
  openGraph: {
    type: "website",
    url: `${BASE_PATH}/`,
    siteName: "DSA Guardian",
    title: "DSA Guardian",
    description:
      "Striver A2Z + live LeetCode sync, daily goals, company-tagged Hard picks and contest upsolving.",
    images: [
      {
        url: `${BASE_PATH}/og`,
        width: 1200,
        height: 630,
        alt: "DSA Guardian — your daily guardian for DSA mastery",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "DSA Guardian",
    description:
      "Striver A2Z + live LeetCode sync, daily goals, company-tagged Hard picks and contest upsolving.",
    images: [`${BASE_PATH}/og`],
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f7f5" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0b" },
  ],
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const user = session?.user;

  async function signOutAction() {
    "use server";
    await signOut({ redirectTo: "/" });
  }

  return (
    <html
      lang="en"
      className={`${sans.variable} ${mono.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-screen font-sans antialiased">
        <Providers>
          {user ? (
            <AppShell user={user} signOutAction={signOutAction}>
              {children}
            </AppShell>
          ) : (
            <Landing />
          )}
        </Providers>
      </body>
    </html>
  );
}
