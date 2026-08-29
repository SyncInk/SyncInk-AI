import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { ClerkErrorBoundary } from "@/components/ClerkErrorBoundary";
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
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || '';
  const secretKey = process.env.CLERK_SECRET_KEY || '';
  
  const isClerkValid = 
    (publishableKey.startsWith('pk_test_') || publishableKey.startsWith('pk_live_')) &&
    (secretKey.startsWith('sk_test_') || secretKey.startsWith('sk_live_'));

  const safeFallback = (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', alignItems: 'center', justifyContent: 'center', backgroundColor: '#000', color: '#fff', fontFamily: 'sans-serif' }}>
      <div style={{ textAlign: 'center', padding: '2rem', border: '1px solid #333', borderRadius: '1rem', background: '#111', maxWidth: '500px' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#ff4444' }}>Authentication Keys Missing</h2>
        <p style={{ color: '#aaa', marginBottom: '1rem', lineHeight: '1.5' }}>
          SyncInk is securely locked, but the server is missing the required authentication keys. 
          To fix this, open your Vercel Dashboard and add both <code>NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY</code> and <code>CLERK_SECRET_KEY</code> to the Environment Variables.
        </p>
        <p style={{ color: '#aaa' }}>Then, redeploy the application.</p>
      </div>
    </div>
  );

  const content = isClerkValid ? (
    <ClerkErrorBoundary fallback={safeFallback}>
      <ClerkProvider publishableKey={publishableKey}>
        {children}
      </ClerkProvider>
    </ClerkErrorBoundary>
  ) : (
    safeFallback
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
