import type { Metadata, Viewport } from 'next';
import { IBM_Plex_Mono } from 'next/font/google';
import { Wallet, LayoutGrid } from 'lucide-react';
import BottomNav from './components/BottomNav';
import './globals.css';

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  variable: '--font-ibm-plex-mono',
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: '私人秘書',
  description: '家庭記帳與行事曆私人秘書',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: '私人秘書',
  },
  other: {
    'mobile-web-app-capable': 'yes',
  },
};

export const viewport: Viewport = {
  themeColor: '#6366f1',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-Hant" className={ibmPlexMono.variable}>
      <head>
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>
      <body className="bg-background text-foreground font-mono antialiased min-h-screen">
        {/* Sticky Top App Bar */}
        <header className="sticky top-0 z-50 bg-background/90 backdrop-blur-sm border-b-2 border-primary/30">
          <div className="max-w-md mx-auto flex items-center gap-3 px-4 py-3">
            <Wallet className="w-5 h-5 text-primary" />
            <h1 className="text-lg font-bold text-foreground flex-1">私人秘書</h1>
            <a
              href="/monthly"
              className="flex items-center justify-center w-9 h-9 rounded-md border-2 border-primary text-primary transition-colors hover:bg-accent"
            >
              <LayoutGrid className="w-4 h-4" />
            </a>
          </div>
        </header>

        {/* Main content with bottom nav clearance */}
        <div className="pb-24">{children}</div>

        {/* Bottom Navigation Bar */}
        <BottomNav />
      </body>
    </html>
  );
}
