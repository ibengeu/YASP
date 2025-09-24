import React from 'react';
import { Badge } from '../ui/badge';
import { Card, CardContent } from '../ui/card';
import { 
  Search, 
  Code, 
  Zap, 
  Shield, 
  BarChart3, 
  Users, 
  FileText, 
  TestTube, 
  Globe,
  ArrowUpRight
} from 'lucide-react';
import { motion } from 'motion/react';

export function FeaturesSection() {
  const features = [
    {
      icon: Search,
      title: 'API Catalog Browser',
      description: 'Search and discover APIs with real-time filtering. Built and working today.',
      badge: '✅ Live',
      badgeColor: 'bg-green-100 text-green-800 border-green-200',
      gradient: 'from-blue-500 to-cyan-500',
      status: 'ready'
    },
    {
      icon: FileText,
      title: 'Interactive Documentation',
      description: 'Auto-generated docs from OpenAPI specs with live examples and code snippets.',
      badge: '✅ Live',
      badgeColor: 'bg-green-100 text-green-800 border-green-200',
      gradient: 'from-purple-500 to-pink-500',
      status: 'ready'
    },
    {
      icon: TestTube,
      title: 'API Testing Tool',
      description: 'Test any endpoint directly in your browser with real request/response handling.',
      badge: '✅ Live',
      badgeColor: 'bg-green-100 text-green-800 border-green-200',
      gradient: 'from-green-500 to-emerald-500',
      status: 'ready'
    },
    {
      icon: Users,
      title: 'User Authentication',
      description: 'Complete auth system with profile management, ready for team workflows.',
      badge: '✅ Live',
      badgeColor: 'bg-green-100 text-green-800 border-green-200',
      gradient: 'from-indigo-500 to-blue-500',
      status: 'ready'
    },
    {
      icon: Shield,
      title: 'Advanced Security',
      description: 'Enterprise-grade security controls, OAuth integration, and access management.',
      badge: '🚧 Soon',
      badgeColor: 'bg-orange-100 text-orange-800 border-orange-200',
      gradient: 'from-red-500 to-orange-500',
      status: 'planned'
    },
    {
      icon: BarChart3,
      title: 'Usage Analytics',
      description: 'Detailed insights, performance metrics, and API usage tracking dashboard.',
      badge: '🚧 Soon',
      badgeColor: 'bg-orange-100 text-orange-800 border-orange-200',
      gradient: 'from-yellow-500 to-amber-500',
      status: 'planned'
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6
      }
    }
  };

  return (
    <section id="features" className="py-24 bg-background">
      <div className="max-w-6xl mx-auto px-6">
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
            className="mb-4 px-3 py-1 text-sm font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400 border-green-200 dark:border-green-800 rounded-full"
          >
            What's Working Now
          </Badge>
          <h2 className="text-4xl md:text-5xl font-semibold tracking-tight mb-6">
            Real tools, working today
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            No vaporware. No promises. These features are built, tested, and ready to use. 
            Try them right now in your browser.
          </p>
        </motion.div>

        {/* Features Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              variants={itemVariants}
              whileHover={{ y: feature.status === 'ready' ? -8 : -4 }}
              className={`group ${feature.status === 'planned' ? 'opacity-75' : ''}`}
            >
              <Card className="h-full border-border/50 hover:border-primary/20 transition-all duration-300 hover:card-shadow-lg bg-card/50 backdrop-blur-sm">
                <CardContent className="p-8">
                  {/* Icon and Badge */}
                  <div className="flex items-start justify-between mb-6">
                    <div className={`h-12 w-12 rounded-xl bg-linear-to-br ${feature.gradient} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                      <feature.icon className="h-6 w-6 text-white" />
                    </div>
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${feature.badgeColor || 'border-border/50 bg-secondary/50'}`}
                    >
                      {feature.badge}
                    </Badge>
                  </div>

                  {/* Content */}
                  <div className="space-y-4">
                    <h3 className="text-xl font-semibold group-hover:text-primary transition-colors">
                      {feature.title}
                    </h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {feature.description}
                    </p>
                  </div>

                  {/* Hover Arrow */}
                  <div className="mt-6 flex justify-end opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <ArrowUpRight className="h-5 w-5 text-primary" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* MVP Callout */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="mt-20 text-center"
        >
          <div className="bg-linear-to-r from-green-50 to-blue-50 dark:from-green-900/10 dark:to-blue-900/10 rounded-2xl p-8 md:p-12 border border-green-200 dark:border-green-800">
            <Globe className="h-12 w-12 text-green-600 mx-auto mb-6" />
            <h3 className="text-2xl md:text-3xl font-semibold mb-4">
              Start with the MVP, grow with us
            </h3>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed mb-6">
              Currently supports OpenAPI 3.x and Swagger 2.0 specs. More formats and 
              enterprise features coming based on user feedback.
            </p>
            <Badge variant="outline" className="bg-white/50 border-green-200 text-green-800">
              Early Adopter Program • Shape the future
            </Badge>
          </div>
        </motion.div>
      </div>
    </section>
  );
}