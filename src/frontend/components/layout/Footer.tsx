/**
 * Footer Component
 */

import Link from 'next/link';
import { Trees, Facebook, Twitter, Instagram, Github, Heart } from 'lucide-react';
import { ROUTES } from '@/lib/constants';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-gray-200 bg-gray-900">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2">
              <Trees className="h-8 w-8 text-emerald-500" />
              <span className="text-2xl font-bold text-white">ReCamp</span>
            </div>
            <p className="mt-4 text-sm text-gray-400">
              Find your perfect camping adventure under the stars. Discover amazing
              campgrounds and share your favorite spots with fellow outdoor enthusiasts.
            </p>
            <div className="mt-6 flex space-x-4">
              <SocialLink href="#" icon={Facebook} label="Facebook" />
              <SocialLink href="#" icon={Twitter} label="Twitter" />
              <SocialLink href="#" icon={Instagram} label="Instagram" />
              <SocialLink href="#" icon={Github} label="GitHub" />
            </div>
          </div>

          {/* Explore */}
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">
              Explore
            </h3>
            <ul className="space-y-3">
              <FooterLink href={ROUTES.CAMPGROUNDS}>Browse Campgrounds</FooterLink>
              <FooterLink href={ROUTES.CAMPGROUND_NEW}>Add Campground</FooterLink>
              <FooterLink href="/about">About Us</FooterLink>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">
              Legal
            </h3>
            <ul className="space-y-3">
              <FooterLink href="/privacy">Privacy Policy</FooterLink>
              <FooterLink href="/terms">Terms of Service</FooterLink>
              <FooterLink href="/contact">Contact</FooterLink>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 border-t border-gray-800 pt-8">
          <div className="flex flex-col items-center justify-between space-y-4 md:flex-row md:space-y-0">
            <p className="text-sm text-gray-400">
              © {currentYear} ReCamp. All rights reserved.
            </p>
            <p className="flex items-center text-sm text-gray-400">
              Made with <Heart className="mx-1 h-4 w-4 text-red-500" /> for campers
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}

interface SocialLinkProps {
  href: string;
  icon: React.ElementType;
  label: string;
}

function SocialLink({ href, icon: Icon, label }: SocialLinkProps) {
  return (
    <a
      href={href}
      aria-label={label}
      className="text-gray-400 transition-colors hover:text-emerald-500"
    >
      <Icon className="h-5 w-5" />
    </a>
  );
}

interface FooterLinkProps {
  href: string;
  children: React.ReactNode;
}

function FooterLink({ href, children }: FooterLinkProps) {
  return (
    <li>
      <Link
        href={href}
        className="text-sm text-gray-400 transition-colors hover:text-emerald-500"
      >
        {children}
      </Link>
    </li>
  );
}
