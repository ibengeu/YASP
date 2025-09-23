import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Menu, X, Code, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface NavigationHeaderProps {
  onGetStarted: () => void;
  onSignIn: () => void;
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
      className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        isScrolled 
          ? 'bg-background/95 backdrop-blur-lg border-b border-border/50 card-shadow-sm' 
          : 'bg-secondary/30'
      }`}
    >
      <nav className="w-full px-6 py-2">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <motion.div 
            className="flex items-center gap-2"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <Code className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-semibold tracking-tight">YASP</span>
          </motion.div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navigationItems.map((item) => (
              <button
                key={item.label}
                onClick={() => scrollToSection(item.href)}
                className="text-muted-foreground hover:text-foreground transition-colors font-medium"
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-3">
            <Button
              variant="ghost"
              onClick={onSignIn}
              className="hover:bg-secondary/50 rounded-lg"
            >
              Sign In
            </Button>
            <Button
              onClick={onGetStarted}
              className="bg-primary hover:bg-primary/90 rounded-lg card-shadow-sm"
            >
              <Zap className="h-4 w-4 mr-2" />
              Try MVP
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
            className="md:hidden bg-background/95 backdrop-blur-lg border-b border-border/50"
          >
            <div className="w-full px-6 py-2 space-y-4">
              {navigationItems.map((item) => (
                <button
                  key={item.label}
                  onClick={() => scrollToSection(item.href)}
                  className="block w-full text-left text-muted-foreground hover:text-foreground transition-colors font-medium py-2"
                >
                  {item.label}
                </button>
              ))}
              <div className="pt-4 space-y-3 border-t border-border/50">
                <Button
                  variant="outline"
                  onClick={onSignIn}
                  className="w-full border-border/50 hover:bg-secondary/50 rounded-lg"
                >
                  Sign In
                </Button>
                <Button
                  onClick={onGetStarted}
                  className="w-full bg-primary hover:bg-primary/90 rounded-lg"
                >
                  <Zap className="h-4 w-4 mr-2" />
                  Try MVP
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}