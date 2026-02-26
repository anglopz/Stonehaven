import type { Metadata } from 'next';
import './globals.css';
import { Providers } from '@/lib/providers';
import { MainLayout } from '@/components/layout';

export const metadata: Metadata = {
  title: 'Stonehaven - Find Your Perfect Camping Adventure',
  description: 'Discover amazing campgrounds, share your favorite spots, and connect with fellow outdoor enthusiasts.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <Providers>
          <MainLayout>{children}</MainLayout>
        </Providers>
      </body>
    </html>
  );
}
