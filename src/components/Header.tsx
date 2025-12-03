'use client';

import Link from 'next/link';
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { Menu, X, Crown } from 'lucide-react';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  const navigationLinks = [
    { href: '/', label: 'Home' },
    { href: '/live', label: 'Live' },
    { href: '/upcoming', label: 'Upcoming' },
    { href: '/leagues', label: 'Leagues' },
    { href: '/teams', label: 'Teams' },
    { href: '/players/trending', label: 'Players' },
    { href: '/matches', label: 'All Matches' },

  ];

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname === href || pathname?.startsWith(href + '/');
  };

  const handlePremiumAccess = () => {
    const url = process.env.NEXT_PUBLIC_PRICING_URL || 'https://www.iptv.shopping/pricing'
    // Simple tracking push
    try { (window as any).dataLayer = (window as any).dataLayer || []; (window as any).dataLayer.push({ event: 'cta_click', cta: 'premium_header' }) } catch (e) { }
    window.location.href = url;
  };

  return (
    <header className="sticky top-0 z-50 bg-gray-900 border-b border-gray-800 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo/Brand */}
          <Link href="/" className="flex items-center space-x-2" onClick={closeMenu}>
            <div className="text-2xl font-bold">
              <span className="text-professional-gold">Kick</span>
              <span className="text-professional-red">AI</span>
              <span className="text-white">Matches</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {navigationLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`${isActive(link.href) ? 'text-professional-gold border-b-2 border-professional-gold' : 'text-gray-300'} hover:text-professional-gold transition-colors duration-200 font-medium pb-1`}
              >
                {link.label}
              </Link>
            ))}

            {/* Premium Access Button */}
            <button
              onClick={handlePremiumAccess}
              className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-professional-gold to-professional-red text-white font-semibold rounded-lg hover:from-yellow-400 hover:to-red-600 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              <Crown size={18} />
              <span>Get Premium Access</span>
            </button>
          </nav>

          {/* Mobile Menu Button */}
          <button
            onClick={toggleMenu}
            className="md:hidden p-2 rounded-md text-gray-300 hover:text-professional-gold hover:bg-gray-800 transition-colors duration-200"
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 bg-gray-800 rounded-lg mt-2 border border-gray-700">
              {navigationLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`block px-3 py-2 ${isActive(link.href) ? 'text-professional-gold bg-gray-700' : 'text-gray-300'} hover:text-professional-gold hover:bg-gray-700 rounded-md transition-colors duration-200 font-medium`}
                  onClick={closeMenu}
                >
                  {link.label}
                </Link>
              ))}

              {/* Mobile Premium Access Button */}
              <button
                onClick={() => {
                  handlePremiumAccess();
                  closeMenu();
                }}
                className="flex items-center justify-center space-x-2 w-full px-3 py-2 mt-2 bg-gradient-to-r from-professional-gold to-professional-red text-white font-semibold rounded-md hover:from-yellow-400 hover:to-red-600 transition-all duration-300 shadow-lg"
              >
                <Crown size={18} />
                <span>Get Premium Access</span>
              </button>
            </div>
          </div>
        )}
      </div>
      {/* aria-live region for announcements */}
      <div id="site-announcements" aria-live="polite" className="sr-only" />
    </header>
  );
};

export default Header;