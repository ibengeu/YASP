import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Card, CardContent } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Play, ArrowRight, Zap, Code, Search, FileText, CheckCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { MiniApiExplorer } from './MiniApiExplorer';
import { MiniApiCatalog } from './MiniApiCatalog';

interface HeroSectionProps {
  onGetStarted: () => void;
  onRequestDemo: () => void;
}

export function HeroSection({ onGetStarted, onRequestDemo }: HeroSectionProps) {
  const [activeDemo, setActiveDemo] = useState('explorer');

  const currentFeatures = [
    { icon: Search, label: 'API Discovery', description: 'Browse and search APIs' },
    { icon: Code, label: 'Interactive Testing', description: 'Test endpoints in real-time' },
    { icon: FileText, label: 'Auto Documentation', description: 'Generated API docs' }
  ];

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-background">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:20px_20px]" />

      <div className="relative max-w-7xl mx-auto px-6 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left Side - Content */}
          <div className="space-y-8">


            {/* Main Headline */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1 }}
              className="space-y-6"
            >
              <h1 className="text-4xl md:text-6xl font-semibold tracking-tight leading-tight">
                Test APIs instantly.
                <br />
                <span className="text-primary">
                  No setup required.
                </span>
              </h1>
              
              <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-lg">
                Our working MVP lets you discover, explore, and test APIs right in your browser. 
                Start building with real tools, available today.
              </p>
            </motion.div>



            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="flex flex-col sm:flex-row gap-4"
            >
              <Button
                onClick={onGetStarted}
                size="lg"
                className="px-8 text-lg bg-primary hover:bg-primary/90 rounded-xl card-shadow-sm group"
              >
                Get Started
                <ArrowRight className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
              

            </motion.div>
          </div>

          {/* Right Side - Interactive Demo */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="relative"
            id="interactive-demo"
          >
            <Card className="w-[600px] border-border/50 card-shadow-lg bg-card/80 backdrop-blur-sm overflow-hidden">
              <CardContent className="p-0">
                {/* Demo Header */}
                <div className="bg-secondary/50 border-b border-border/50 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex gap-1.5">
                      <div className="h-3 w-3 rounded-full bg-red-500" />
                      <div className="h-3 w-3 rounded-full bg-yellow-500" />
                      <div className="h-3 w-3 rounded-full bg-green-500" />
                    </div>
                    <span className="text-sm font-medium ml-2">YASP MVP</span>
                  </div>
                  
                  <Tabs value={activeDemo} onValueChange={setActiveDemo}>
                    <TabsList className="bg-background/50 border border-border/50">
                      <TabsTrigger value="explorer" className="text-sm">API Explorer</TabsTrigger>
                      <TabsTrigger value="catalog" className="text-sm">API Catalog</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>

                {/* Demo Content */}
                <div className="h-96">
                  <Tabs value={activeDemo} onValueChange={setActiveDemo}>
                    <TabsContent value="explorer" className="h-full m-0">
                      <MiniApiExplorer />
                    </TabsContent>
                    <TabsContent value="catalog" className="h-full m-0">
                      <MiniApiCatalog />
                    </TabsContent>
                  </Tabs>
                </div>


              </CardContent>
            </Card>


          </motion.div>
        </div>
      </div>
    </section>
  );
}