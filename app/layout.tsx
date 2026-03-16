import type { Metadata } from 'next';
import { Space_Grotesk, Inter } from 'next/font/google';
import { Wallet } from 'lucide-react';
import BottomNav from './components/BottomNav';
import './globals.css';

/* ── Task 2.1: Font Loading ── */
const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  weight: ['300', '400', '500', '600'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: '私人秘書',
  description: '家庭記帳與行事曆私人秘書',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: '私人秘書',
  },
  other: {
    'mobile-web-app-capable': 'yes',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-Hant" className={`${spaceGrotesk.variable} ${inter.variable}`}>
      <head>
        <link rel="apple-touch-icon" href="/icon.svg" />
        <meta name="theme-color" content="#0e131d" />
      </head>
      <body className="bg-md-background text-md-on-surface min-h-screen">
        {/* Task 2.4: Background decorative blur circles */}
        <div className="fixed pointer-events-none -z-10 inset-0 overflow-hidden">
          <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-md-primary-container/20 blur-[120px] opacity-20" />
          <div className="absolute -bottom-32 -right-32 w-80 h-80 rounded-full bg-md-secondary-container/20 blur-[100px] opacity-20" />
        </div>

        {/* Task 2.2: Sticky Top App Bar */}
        <header className="sticky top-0 z-50 bg-md-background/80 backdrop-blur-md border-b border-md-outline-variant/10">
          <div className="max-w-4xl mx-auto flex items-center gap-3 px-4 py-3">
            <Wallet className="w-6 h-6 text-md-primary" />
            <h1 className="font-[family-name:var(--font-headline)] text-lg font-semibold tracking-tight text-md-on-surface">
              私人秘書
            </h1>
          </div>
        </header>

        {/* Main content with bottom nav clearance */}
        <div className="pb-24">{children}</div>

        {/* Task 2.3: Bottom Navigation Bar (client component) */}
        <BottomNav />
      </body>
    </html>
  );
}
