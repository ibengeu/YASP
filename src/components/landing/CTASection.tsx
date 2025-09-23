import React from 'react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Zap, ArrowRight, CheckCircle, Clock, Shield } from 'lucide-react';
import { motion } from 'motion/react';

interface CTASectionProps {
  onGetStarted: () => void;
}

export function CTASection({ onGetStarted }: CTASectionProps) {
  const benefits = [
    {
      icon: CheckCircle,
      text: 'Working MVP available now'
    },
    {
      icon: Clock,
      text: 'Start testing in 30 seconds'
    },
    {
      icon: Shield,
      text: 'Free during beta'
    }
  ];

  return (
    <section className="py-24 bg-gradient-to-br from-primary/5 via-background to-accent/5 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:20px_20px]" />
      
      {/* Floating Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute top-1/4 left-1/4 w-32 h-32 bg-primary/10 rounded-full blur-xl"
          animate={{ 
            y: [0, -30, 0],
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.6, 0.3]
          }}
          transition={{ duration: 8, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-accent/10 rounded-full blur-xl"
          animate={{ 
            y: [0, 30, 0],
            scale: [1, 0.8, 1],
            opacity: [0.4, 0.7, 0.4]
          }}
          transition={{ duration: 10, repeat: Infinity }}
        />
      </div>

      <div className="relative max-w-4xl mx-auto px-6 text-center">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <Badge 
            variant="secondary" 
            className="px-4 py-2 text-sm font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400 border-green-200 dark:border-green-800 rounded-full"
          >
            🚀 MVP is ready to use
          </Badge>
        </motion.div>

        {/* Main Headline */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="space-y-6 mb-12"
        >
          <h2 className="text-4xl md:text-6xl font-semibold tracking-tight">
            Try the real MVP.
            <br />
            <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
              No demos, no promises.
            </span>
          </h2>
          
          <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Working API management tools you can use right now. 
            Start exploring APIs, testing endpoints, and building better integrations.
          </p>
        </motion.div>

        {/* Benefits */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-12"
        >
          {benefits.map((benefit, index) => (
            <motion.div
              key={benefit.text}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.4 + index * 0.1 }}
              className="flex items-center gap-3 text-muted-foreground"
            >
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <benefit.icon className="h-4 w-4 text-primary" />
              </div>
              <span className="text-sm font-medium">{benefit.text}</span>
            </motion.div>
          ))}
        </motion.div>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
        >
          <Button
            onClick={onGetStarted}
            size="lg"
            className="h-16 px-12 text-lg bg-primary hover:bg-primary/90 rounded-xl card-shadow-lg group min-w-[200px]"
          >
            <Zap className="h-6 w-6 mr-3 group-hover:scale-110 transition-transform" />
            <span>Try the MVP</span>
            <ArrowRight className="h-5 w-5 ml-3 group-hover:translate-x-1 transition-transform" />
          </Button>
          
          <Button
            onClick={() => {
              const demoElement = document.getElementById('interactive-demo');
              if (demoElement) {
                demoElement.scrollIntoView({ behavior: 'smooth' });
              }
            }}
            variant="outline"
            size="lg"
            className="h-16 px-8 text-lg border-border/50 hover:bg-secondary/50 rounded-xl min-w-[160px]"
          >
            See Live Demo
          </Button>
        </motion.div>

        {/* Trust Signals */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-3xl mx-auto"
        >
          <div className="text-center">
            <div className="text-2xl font-bold text-primary mb-2">100%</div>
            <div className="text-sm text-muted-foreground">Working MVP features</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary mb-2">0</div>
            <div className="text-sm text-muted-foreground">Setup required</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary mb-2">Free</div>
            <div className="text-sm text-muted-foreground">During beta period</div>
          </div>
        </motion.div>

        {/* Final Message */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1, delay: 0.8 }}
          className="mt-16"
        >
          <p className="text-sm text-muted-foreground">
            By signing up, you agree to our{' '}
            <button className="text-primary hover:text-primary/80 underline">
              Terms of Service
            </button>{' '}
            and{' '}
            <button className="text-primary hover:text-primary/80 underline">
              Privacy Policy
            </button>
          </p>
        </motion.div>
      </div>
    </section>
  );
}