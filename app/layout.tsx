import { GeistSans } from "geist/font/sans";
import "./globals.css";
import { Providers } from "./providers";
import { Toaster } from "sonner";

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata = {
  metadataBase: new URL(defaultUrl),
  title: "SENI",
  description: "SENI - Your Digital Platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={GeistSans.className} suppressHydrationWarning>
      <body className="bg-background text-foreground" suppressHydrationWarning>
        <main className="items-center w-full">
          <Providers>
            {children}
          </Providers>
          <Toaster richColors position="top-right" />
        </main>
      </body>
    </html>
  );
}
