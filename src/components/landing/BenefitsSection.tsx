import React from 'react';
import { Badge } from '../ui/badge';
import { Card, CardContent } from '../ui/card';
import { 
  Clock, 
  TrendingUp, 
  Shield, 
  Users, 
  Zap, 
  CheckCircle,
  ArrowRight
} from 'lucide-react';
import { motion } from 'motion/react';

export function BenefitsSection() {
  const benefits = [
    {
      icon: Clock,
      title: 'Save Development Time',
      description: 'Reduce API integration time by 75% with our intuitive tools and comprehensive documentation.',
      metric: '75%',
      metricLabel: 'Faster Integration',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      icon: TrendingUp,
      title: 'Improve API Quality',
      description: 'Catch issues early with automated testing and validation tools that ensure API reliability.',
      metric: '90%',
      metricLabel: 'Issue Detection',
      color: 'from-green-500 to-emerald-500'
    },
    {
      icon: Shield,
      title: 'Enhanced Security',
      description: 'Enterprise-grade security controls and monitoring keep your APIs safe and compliant.',
      metric: '99.9%',
      metricLabel: 'Security Score',
      color: 'from-red-500 to-orange-500'
    },
    {
      icon: Users,
      title: 'Better Collaboration',
      description: 'Enable seamless teamwork with shared workspaces, comments, and real-time collaboration.',
      metric: '10x',
      metricLabel: 'Team Efficiency',
      color: 'from-purple-500 to-pink-500'
    }
  ];

  const testimonialPoints = [
    'Reduced onboarding time for new developers',
    'Standardized API documentation across teams',
    'Improved API discovery and reusability',
    'Enhanced developer experience and satisfaction',
    'Faster time-to-market for API-driven features'
  ];

  return (
    <section className="py-24 bg-background">
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
            className="mb-4 px-3 py-1 text-sm font-medium bg-primary/10 text-primary border-primary/20 rounded-full"
          >
            Benefits
          </Badge>
          <h2 className="text-4xl md:text-5xl font-semibold tracking-tight mb-6">
            Why developers choose APIFlow
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Join thousands of developers who have transformed their API workflow 
            with our comprehensive platform.
          </p>
        </motion.div>

        {/* Benefits Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-20">
          {benefits.map((benefit, index) => (
            <motion.div
              key={benefit.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              whileHover={{ y: -8 }}
              className="group"
            >
              <Card className="h-full border-border/50 hover:border-primary/20 transition-all duration-300 hover:card-shadow-lg bg-card/50 backdrop-blur-sm">
                <CardContent className="p-8">
                  <div className="flex items-start gap-6">
                    {/* Icon */}
                    <div className={`h-16 w-16 rounded-xl bg-linear-to-br ${benefit.color} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                      <benefit.icon className="h-8 w-8 text-white" />
                    </div>

                    {/* Content */}
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold mb-3 group-hover:text-primary transition-colors">
                        {benefit.title}
                      </h3>
                      <p className="text-muted-foreground leading-relaxed mb-4">
                        {benefit.description}
                      </p>
                      
                      {/* Metric */}
                      <div className="flex items-center gap-3">
                        <div className="text-2xl font-bold text-primary">
                          {benefit.metric}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {benefit.metricLabel}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Impact Section */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center"
        >
          {/* Left Content */}
          <div>
            <Badge 
              variant="secondary" 
              className="mb-4 px-3 py-1 text-sm font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400 border-green-200 dark:border-green-800 rounded-full"
            >
              Success Stories
            </Badge>
            <h3 className="text-3xl md:text-4xl font-semibold tracking-tight mb-6">
              Real results from real teams
            </h3>
            <p className="text-lg text-muted-foreground leading-relaxed mb-8">
              Companies using APIFlow report significant improvements in developer 
              productivity, API quality, and time-to-market for new features.
            </p>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-6 mb-8">
              <div>
                <div className="text-3xl font-bold text-primary mb-1">2.5x</div>
                <div className="text-sm text-muted-foreground">Faster API Discovery</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-primary mb-1">60%</div>
                <div className="text-sm text-muted-foreground">Less Support Tickets</div>
              </div>
            </div>

            <motion.div
              className="inline-flex items-center gap-2 text-primary font-medium hover:gap-3 transition-all cursor-pointer"
              whileHover={{ x: 5 }}
            >
              View case studies
              <ArrowRight className="h-4 w-4" />
            </motion.div>
          </div>

          {/* Right Content - Testimonial Points */}
          <div>
            <Card className="border-border/50 card-shadow-lg bg-card/80 backdrop-blur-sm">
              <CardContent className="p-8">
                <div className="flex items-center gap-3 mb-6">
                  <Zap className="h-6 w-6 text-primary" />
                  <h4 className="text-xl font-semibold">Platform Impact</h4>
                </div>
                
                <div className="space-y-4">
                  {testimonialPoints.map((point, index) => (
                    <motion.div
                      key={point}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                      className="flex items-start gap-3"
                    >
                      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
                      <span className="text-muted-foreground leading-relaxed">{point}</span>
                    </motion.div>
                  ))}
                </div>

                {/* Quote */}
                <div className="mt-8 pt-6 border-t border-border/50">
                  <blockquote className="text-foreground italic leading-relaxed">
                    "APIFlow transformed how our team works with APIs. What used to take hours now takes minutes."
                  </blockquote>
                  <cite className="text-sm text-muted-foreground mt-2 block">
                    — Engineering Team Lead, Tech Startup
                  </cite>
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.div>
      </div>
    </section>
  );
}