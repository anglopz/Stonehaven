/**
 * Navbar Component
 */

'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Trees, Home, MapPin, PlusCircle, User, LogOut, Menu, X } from 'lucide-react';
import { useAuth } from '@/hooks';
import { ROUTES } from '@/lib/constants';
import { Button } from '@/components/ui';

export function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    setIsUserMenuOpen(false);
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-gray-200 bg-white shadow-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link
            href={ROUTES.HOME}
            className="flex items-center space-x-2 text-2xl font-bold"
          >
            <Trees className="h-8 w-8 text-emerald-600" />
            <span className="bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
              Stonehaven
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden items-center space-x-1 md:flex">
            <NavLink href={ROUTES.HOME} icon={Home}>
              Home
            </NavLink>
            <NavLink href={ROUTES.CAMPGROUNDS} icon={MapPin}>
              Campgrounds
            </NavLink>
            <NavLink href={ROUTES.CAMPGROUND_NEW} icon={PlusCircle}>
              New Campground
            </NavLink>
          </div>

          {/* Desktop Auth */}
          <div className="hidden items-center space-x-4 md:flex">
            {isAuthenticated && user ? (
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center space-x-2 rounded-lg px-3 py-2 transition-colors hover:bg-gray-100"
                >
                  <User className="h-5 w-5 text-gray-600" />
                  <span className="font-medium text-gray-700">{user.username}</span>
                </button>

                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 rounded-lg border border-gray-200 bg-white shadow-lg">
                    <div className="p-2">
                      <button
                        onClick={handleLogout}
                        className="flex w-full items-center space-x-2 rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-red-50 hover:text-red-600"
                      >
                        <LogOut className="h-4 w-4" />
                        <span>Logout</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link href={ROUTES.LOGIN}>
                  <Button variant="ghost" size="sm">
                    Login
                  </Button>
                </Link>
                <Link href={ROUTES.REGISTER}>
                  <Button variant="primary" size="sm">
                    Sign Up
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="rounded-lg p-2 text-gray-600 transition-colors hover:bg-gray-100 md:hidden"
          >
            {isMobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="border-t border-gray-200 md:hidden">
          <div className="space-y-1 px-4 py-3">
            <MobileNavLink href={ROUTES.HOME} icon={Home}>
              Home
            </MobileNavLink>
            <MobileNavLink href={ROUTES.CAMPGROUNDS} icon={MapPin}>
              Campgrounds
            </MobileNavLink>
            <MobileNavLink href={ROUTES.CAMPGROUND_NEW} icon={PlusCircle}>
              New Campground
            </MobileNavLink>

            <div className="border-t border-gray-200 pt-3">
              {isAuthenticated && user ? (
                <>
                  <div className="mb-2 px-3 py-2 text-sm font-medium text-gray-700">
                    {user.username}
                  </div>
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center space-x-2 rounded-lg px-3 py-2 text-sm text-red-600 transition-colors hover:bg-red-50"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Logout</span>
                  </button>
                </>
              ) : (
                <div className="space-y-2">
                  <Link href={ROUTES.LOGIN} className="block">
                    <Button variant="ghost" size="sm" className="w-full">
                      Login
                    </Button>
                  </Link>
                  <Link href={ROUTES.REGISTER} className="block">
                    <Button variant="primary" size="sm" className="w-full">
                      Sign Up
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}

interface NavLinkProps {
  href: string;
  icon: React.ElementType;
  children: React.ReactNode;
}

function NavLink({ href, icon: Icon, children }: NavLinkProps) {
  return (
    <Link
      href={href}
      className="flex items-center space-x-1 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 hover:text-gray-900"
    >
      <Icon className="h-4 w-4" />
      <span>{children}</span>
    </Link>
  );
}

function MobileNavLink({ href, icon: Icon, children }: NavLinkProps) {
  return (
    <Link
      href={href}
      className="flex items-center space-x-2 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100"
    >
      <Icon className="h-5 w-5" />
      <span>{children}</span>
    </Link>
  );
}
