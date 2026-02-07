/**
 * Main Layout Component
 */

'use client';

import { ReactNode } from 'react';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { FlashMessages } from './FlashMessage';

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <FlashMessages />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
