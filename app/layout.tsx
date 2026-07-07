import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/helpers";
import { AppShell } from "@/components/layouts/app-shell";
import { ReduxProvider } from "@/store/provider";
import { I18nProvider } from "@/i18n/provider";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "LoanFactory Borrower Portal",
  description:
    "Apply for loans, upload documents, track your application status, and manage your loan account securely with LoanFactory.",
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn("h-full", "antialiased", "font-sans", inter.variable)}
    >
      <body className="min-h-full flex">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <ReduxProvider>
            <I18nProvider>
              <AppShell>{children}</AppShell>
              <Toaster position="top-center" richColors />
            </I18nProvider>
          </ReduxProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
