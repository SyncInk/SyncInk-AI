import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SyncInk AI — Create. Think. Sync.",
  description: "Next-generation Liquid Glass AI Assistant by SyncInk.",
  icons: {
    icon: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

  const content = publishableKey ? (
    <ClerkProvider publishableKey={publishableKey}>
      {children}
    </ClerkProvider>
  ) : (
    children
  );

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full w-full overflow-hidden antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const theme = localStorage.getItem('syncink_theme') || 
                  (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
                if (theme === 'dark') {
                  document.documentElement.classList.add('dark');
                  document.documentElement.setAttribute('data-theme', 'dark');
                } else {
                  document.documentElement.classList.remove('dark');
                  document.documentElement.setAttribute('data-theme', 'light');
                }
              } catch (e) {}

              const originalError = console.error;
              console.error = function(...args) {
                const msg = args.join(' ');
                if (msg.includes('Hydration failed') || msg.includes('server rendered HTML didn\\'t match') || msg.includes('bis_skin_checked')) {
                  return;
                }
                originalError.apply(console, args);
              };
            `,
          }}
        />
      </head>
      <body className="fixed inset-0 w-full h-full m-0 p-0 overflow-hidden bg-background text-foreground transition-colors duration-300" suppressHydrationWarning>
        {content}
      </body>
    </html>
  );
}
