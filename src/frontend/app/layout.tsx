import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/lib/providers';
import { MainLayout } from '@/components/layout';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'ReCamp - Find Your Perfect Camping Adventure',
  description: 'Discover amazing campgrounds, share your favorite spots, and connect with fellow outdoor enthusiasts.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          <MainLayout>{children}</MainLayout>
        </Providers>
      </body>
    </html>
  );
}
