"use client";

import { ThemeProvider } from "next-themes";

/**
 * Client-side providers. Kept in its own component so app/layout.tsx can stay a
 * server component and keep calling auth().
 */
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </ThemeProvider>
  );
}
