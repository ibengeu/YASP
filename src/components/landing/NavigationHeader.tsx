import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../ui/button';
import { Menu, X, Code, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface NavigationHeaderProps {
  onGetStarted?: () => void;
  onSignIn?: () => void;
}

export function NavigationHeader({ onGetStarted, onSignIn }: NavigationHeaderProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navigationItems = [
    { label: 'Live Demo', href: '#interactive-demo' },
    { label: 'What Works', href: '#features' },
    { label: 'Roadmap', href: '#roadmap' }
  ];

  const scrollToSection = (href: string) => {
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setIsMobileMenuOpen(false);
  };


  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className={`fixed top-0 w-full z-50 transition-all duration-75 ease-in-out ${
        isScrolled
          ? 'bg-background/95 backdrop-blur-lg border-b border-border shadow-sm'
          : 'bg-muted/30'
      }`}
    >
      <nav className="w-full px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <motion.div
            className="flex items-center gap-3"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="h-8 w-8 bg-primary flex items-center justify-center">
              <Code className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-sans text-xl font-normal tracking-tight">YASP</span>
          </motion.div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navigationItems.map((item) => (
              <button
                key={item.label}
                onClick={() => scrollToSection(item.href)}
                className="font-sans text-sm font-normal text-muted-foreground hover:text-foreground transition-colors duration-75 ease-in-out"
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-3">
            <Button
              variant="ghost"
              asChild
              className="hover:bg-muted/50"
            >
              <Link to="/login">
                Sign In
              </Link>
            </Button>
            <Button
              asChild
              className="bg-primary hover:bg-primary/90"
            >
              <Link to="/sign-up">
                <Zap className="h-4 w-4 mr-2" />
                Try MVP
              </Link>
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2"
          >
            {isMobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>
        </div>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-background/95 backdrop-blur-lg border-b border-border"
          >
            <div className="w-full px-4 py-3 space-y-3">
              {navigationItems.map((item) => (
                <button
                  key={item.label}
                  onClick={() => scrollToSection(item.href)}
                  className="block w-full text-left font-sans text-sm font-normal text-muted-foreground hover:text-foreground transition-colors duration-75 ease-in-out py-2"
                >
                  {item.label}
                </button>
              ))}
              <div className="pt-3 space-y-3 border-t border-border">
                <Button
                  variant="outline"
                  asChild
                  className="w-full border-border hover:bg-muted/50"
                >
                  <Link to="/login">
                    Sign In
                  </Link>
                </Button>
                <Button
                  asChild
                  className="w-full bg-primary hover:bg-primary/90"
                >
                  <Link to="/sign-up">
                    <Zap className="h-4 w-4 mr-2" />
                    Try MVP
                  </Link>
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}