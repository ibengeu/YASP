import React from 'react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Code, Github, Twitter, Linkedin, Mail, ExternalLink } from 'lucide-react';
import { motion } from 'motion/react';

export function FooterSection() {
  const currentYear = new Date().getFullYear();

  const footerSections = [
    {
      title: 'Product',
      links: [
        { label: 'Features', href: '#features' },
        { label: 'Pricing', href: '#pricing' },
        { label: 'Documentation', href: '#docs' },
        { label: 'API Reference', href: '#api' },
        { label: 'Changelog', href: '#changelog' }
      ]
    },
    {
      title: 'Company',
      links: [
        { label: 'About Us', href: '#about' },
        { label: 'Careers', href: '#careers' },
        { label: 'Blog', href: '#blog' },
        { label: 'Press', href: '#press' },
        { label: 'Contact', href: '#contact' }
      ]
    },
    {
      title: 'Resources',
      links: [
        { label: 'Help Center', href: '#help' },
        { label: 'Community', href: '#community' },
        { label: 'Tutorials', href: '#tutorials' },
        { label: 'Best Practices', href: '#guides' },
        { label: 'Status Page', href: '#status', external: true }
      ]
    },
    {
      title: 'Legal',
      links: [
        { label: 'Privacy Policy', href: '#privacy' },
        { label: 'Terms of Service', href: '#terms' },
        { label: 'Cookie Policy', href: '#cookies' },
        { label: 'Security', href: '#security' },
        { label: 'Compliance', href: '#compliance' }
      ]
    }
  ];

  const socialLinks = [
    { icon: Twitter, href: '#twitter', label: 'Twitter' },
    { icon: Github, href: '#github', label: 'GitHub' },
    { icon: Linkedin, href: '#linkedin', label: 'LinkedIn' },
    { icon: Mail, href: '#email', label: 'Email' }
  ];

  const scrollToSection = (href: string) => {
    if (href.startsWith('#')) {
      const element = document.querySelector(href);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <footer className="bg-secondary/30 border-t border-border/50">
      <div className="max-w-6xl mx-auto px-6">
        {/* Main Footer Content */}
        <div className="py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8">
            {/* Brand Section */}
            <div className="lg:col-span-2">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="space-y-6"
              >
                {/* Logo */}
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                    <Code className="h-5 w-5 text-primary-foreground" />
                  </div>
                  <span className="text-xl font-semibold tracking-tight">APIFlow</span>
                </div>

                {/* Description */}
                <p className="text-muted-foreground leading-relaxed max-w-sm">
                  The modern API management platform that developers love. 
                  Discover, test, and manage your APIs with ease.
                </p>

                {/* Newsletter */}
                <div className="space-y-3">
                  <h4 className="font-medium">Stay updated</h4>
                  <div className="flex gap-2">
                    <input
                      type="email"
                      placeholder="Enter your email"
                      className="flex-1 h-10 px-3 text-sm bg-background border border-border/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                    />
                    <Button size="sm" className="h-10 px-4">
                      Subscribe
                    </Button>
                  </div>
                </div>

                {/* Social Links */}
                <div className="flex items-center gap-3">
                  {socialLinks.map((social) => (
                    <motion.button
                      key={social.label}
                      onClick={() => console.log(`Navigate to ${social.label}`)}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      className="h-10 w-10 rounded-lg bg-background border border-border/50 hover:border-primary/50 hover:bg-primary/5 flex items-center justify-center transition-colors"
                      aria-label={social.label}
                    >
                      <social.icon className="h-4 w-4 text-muted-foreground hover:text-primary" />
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            </div>

            {/* Links Sections */}
            {footerSections.map((section, index) => (
              <motion.div
                key={section.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="space-y-4"
              >
                <h4 className="font-medium">{section.title}</h4>
                <ul className="space-y-3">
                  {section.links.map((link) => (
                    <li key={link.label}>
                      <button
                        onClick={() => scrollToSection(link.href)}
                        className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 group"
                      >
                        {link.label}
                        {link.external && (
                          <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Bottom Bar */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="py-6 border-t border-border/50"
        >
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Copyright */}
            <div className="text-sm text-muted-foreground">
              © {currentYear} APIFlow. All rights reserved.
            </div>

            {/* Status & Info */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-green-500" />
                <span className="text-sm text-muted-foreground">All systems operational</span>
              </div>
              
              <Badge 
                variant="outline" 
                className="text-xs border-border/50 bg-background/50"
              >
                v2.1.0
              </Badge>
            </div>
          </div>
        </motion.div>
      </div>
    </footer>
  );
}