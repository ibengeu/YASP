import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Card, CardContent } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Play, Code, Search, TestTube, BarChart3 } from 'lucide-react';
import { motion } from 'motion/react';
import { ImageWithFallback } from '../figma/ImageWithFallback';

interface InteractiveDemoProps {
  onTryDemo: () => void;
}

export function InteractiveDemo({ onTryDemo }: InteractiveDemoProps) {
  const [activeTab, setActiveTab] = useState('explorer');

  const demoFeatures = [
    {
      id: 'explorer',
      label: 'API Explorer',
      icon: Search,
      title: 'Discover APIs Instantly',
      description: 'Browse through your API catalog with powerful search and filtering capabilities.',
      highlights: ['Smart search', 'Category filtering', 'Real-time results']
    },
    {
      id: 'documentation',
      label: 'Documentation',
      icon: Code,
      title: 'Interactive Documentation',
      description: 'Auto-generated, beautiful documentation with live examples and code snippets.',
      highlights: ['Live examples', 'Code generation', 'Try it out']
    },
    {
      id: 'testing',
      label: 'Testing',
      icon: TestTube,
      title: 'API Testing Suite',
      description: 'Test endpoints directly in the browser with syntax highlighting and response validation.',
      highlights: ['Syntax highlighting', 'Mock responses', 'Request history']
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: BarChart3,
      title: 'Usage Analytics',
      description: 'Track API performance, usage patterns, and get insights into your API ecosystem.',
      highlights: ['Performance metrics', 'Usage trends', 'Error tracking']
    }
  ];

  const currentFeature = demoFeatures.find(f => f.id === activeTab) || demoFeatures[0];

  return (
    <section id="interactive-demo" className="py-20 bg-gradient-to-br from-muted/30 via-background to-background">
      <div className="max-w-6xl mx-auto px-4">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <Badge
            variant="secondary"
            className="mb-4 px-3 py-1 font-sans text-sm font-normal bg-primary/10 text-primary border-primary/20"
          >
            Live Demo
          </Badge>
          <h2 className="font-sans text-4xl md:text-5xl font-normal leading-tight tracking-tight mb-6">
            See YASP in Action
          </h2>
          <p className="font-sans text-xl font-normal leading-relaxed text-muted-foreground max-w-3xl mx-auto mb-8">
            Experience the power of our platform with an interactive demo.
            No setup required, start exploring immediately.
          </p>

          <Button
            onClick={onTryDemo}
            size="lg"
            className="group"
          >
            <Play className="h-5 w-5 mr-2 group-hover:scale-110 transition-transform duration-75" />
            Try Interactive Demo
          </Button>
        </motion.div>

        {/* Demo Interface */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1, delay: 0.2 }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start"
        >
          {/* Demo Tabs */}
          <div className="lg:col-span-1">
            <Tabs value={activeTab} onValueChange={setActiveTab} orientation="vertical" className="w-full">
              <TabsList className="flex lg:flex-col h-auto bg-transparent p-0 gap-2 w-full">
                {demoFeatures.map((feature) => (
                  <TabsTrigger
                    key={feature.id}
                    value={feature.id}
                    className="flex-1 lg:flex-none lg:w-full justify-start gap-3 p-4 border border-border bg-card/50 hover:bg-card data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:border-primary transition-all duration-75 ease-in-out"
                  >
                    <feature.icon className="h-5 w-5" />
                    <span className="font-sans font-normal">{feature.label}</span>
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>

          {/* Demo Content */}
          <div className="lg:col-span-2">
            <Card className="border-border shadow-lg bg-card/80 backdrop-blur-sm overflow-hidden">
              <CardContent className="p-0">
                {/* Feature Info */}
                <div className="p-8 border-b border-border">
                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 bg-primary/10 flex items-center justify-center">
                      <currentFeature.icon className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-sans text-2xl font-normal leading-tight mb-2">{currentFeature.title}</h3>
                      <p className="font-sans font-normal leading-relaxed text-muted-foreground mb-4">
                        {currentFeature.description}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {currentFeature.highlights.map((highlight) => (
                          <Badge
                            key={highlight}
                            variant="secondary"
                            className="font-sans text-xs font-normal bg-primary/10 text-primary border-primary/20"
                          >
                            {highlight}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Demo Screenshot/Interface */}
                <div className="relative aspect-video bg-gradient-to-br from-muted/50 to-muted/30">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <motion.div
                      initial={{ scale: 0.95, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.5 }}
                      className="relative w-full h-full"
                    >
                      <ImageWithFallback
                        src="https://images.unsplash.com/photo-1732203971761-e9d4a6f5e93f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBkYXNoYm9hcmQlMjBzb2Z0d2FyZSUyMGludGVyZmFjZXxlbnwxfHx8fDE3NTg0NjEzNzF8MA&ixlib=rb-4.1.0&q=80&w=1080"
                        alt="YASP API Management Platform Demo"
                        className="w-full h-full object-cover"
                      />

                      {/* Overlay with Play Button */}
                      <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-75 cursor-pointer">
                        <motion.button
                          onClick={onTryDemo}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                          className="h-16 w-16 bg-primary/90 backdrop-blur-sm flex items-center justify-center text-primary-foreground hover:bg-primary transition-colors duration-75"
                        >
                          <Play className="h-8 w-8 ml-1" fill="currentColor" />
                        </motion.button>
                      </div>
                    </motion.div>
                  </div>

                  {/* Floating UI Elements */}
                  <motion.div
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 3, repeat: Infinity }}
                    className="absolute top-4 right-4 bg-card/90 backdrop-blur-sm border border-border p-3 shadow-sm"
                  >
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 bg-chart-3" />
                      <span className="font-sans text-xs font-normal">Live API</span>
                    </div>
                  </motion.div>

                  <motion.div
                    animate={{ y: [0, 10, 0] }}
                    transition={{ duration: 4, repeat: Infinity, delay: 1 }}
                    className="absolute bottom-4 left-4 bg-card/90 backdrop-blur-sm border border-border p-3 shadow-sm"
                  >
                    <div className="flex items-center gap-2">
                      <BarChart3 className="h-4 w-4 text-primary" />
                      <span className="font-sans text-xs font-normal">Real-time</span>
                    </div>
                  </motion.div>
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.div>

        {/* Call to Action */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-center mt-16"
        >
          <p className="font-sans text-base font-normal text-muted-foreground mb-6">
            Ready to experience the full platform?
          </p>
          <Button
            onClick={onTryDemo}
            variant="outline"
            size="lg"
            className="border-border hover:bg-muted/50"
          >
            Start Your Free Trial
          </Button>
        </motion.div>
      </div>
    </section>
  );
}