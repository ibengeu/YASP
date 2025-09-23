import React from 'react';
import { Badge } from '../ui/badge';
import { Card, CardContent } from '../ui/card';
import { CheckCircle, Clock, Lightbulb, Users, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';
import { Button } from '../ui/button';

interface RoadmapSectionProps {
  onJoinWaitlist?: () => void;
}

export function RoadmapSection({ onJoinWaitlist }: RoadmapSectionProps) {
  const roadmapItems = [
    {
      phase: 'MVP (Current)',
      status: 'completed',
      icon: CheckCircle,
      features: [
        'API catalog with search and filtering',
        'Interactive API documentation',
        'Real-time endpoint testing',
        'User authentication system',
        'Basic profile management'
      ],
      timeline: 'Available Now'
    },
    {
      phase: 'Beta Release',
      status: 'in-progress',
      icon: Clock,
      features: [
        'Team collaboration features',
        'API key management',
        'Custom branding options',
        'Export documentation',
        'Basic analytics dashboard'
      ],
      timeline: 'Next 4-6 weeks'
    },
    {
      phase: 'Full Platform',
      status: 'planned',
      icon: Lightbulb,
      features: [
        'Enterprise security controls',
        'Advanced analytics & monitoring',
        'CI/CD integrations',
        'Custom domain support',
        'SSO and RBAC'
      ],
      timeline: 'Q2 2024'
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return { icon: CheckCircle, color: 'text-green-500' };
      case 'in-progress':
        return { icon: Clock, color: 'text-orange-500' };
      default:
        return { icon: Lightbulb, color: 'text-blue-500' };
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return { text: '✅ Ready', color: 'bg-green-100 text-green-800 border-green-200' };
      case 'in-progress':
        return { text: '🚧 Building', color: 'bg-orange-100 text-orange-800 border-orange-200' };
      default:
        return { text: '💡 Planned', color: 'bg-blue-100 text-blue-800 border-blue-200' };
    }
  };

  return (
    <section id="roadmap" className="py-24 bg-secondary/30">
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
            Development Roadmap
          </Badge>
          <h2 className="text-4xl md:text-5xl font-semibold tracking-tight mb-6">
            Built with transparency
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            See exactly what's working today and what's coming next. 
            Early adopters help shape our development priorities.
          </p>
        </motion.div>

        {/* Roadmap Timeline */}
        <div className="relative">
          {/* Timeline Line */}
          <div className="absolute left-8 top-8 bottom-8 w-px bg-border/50 hidden md:block" />

          <div className="space-y-8">
            {roadmapItems.map((item, index) => {
              const statusInfo = getStatusIcon(item.status);
              const badgeInfo = getStatusBadge(item.status);

              return (
                <motion.div
                  key={item.phase}
                  initial={{ opacity: 0, x: -30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.2 }}
                  className="relative"
                >
                  {/* Timeline Dot */}
                  <div className="absolute left-6 top-6 w-4 h-4 rounded-full bg-background border-2 border-current hidden md:flex items-center justify-center">
                    <div className={`w-2 h-2 rounded-full ${
                      item.status === 'completed' ? 'bg-green-500' :
                      item.status === 'in-progress' ? 'bg-orange-500' : 'bg-blue-500'
                    }`} />
                  </div>

                  {/* Content Card */}
                  <Card className={`ml-0 md:ml-16 border-border/50 hover:border-primary/30 transition-all ${
                    item.status === 'completed' ? 'bg-green-50/50 dark:bg-green-900/10' :
                    item.status === 'in-progress' ? 'bg-orange-50/50 dark:bg-orange-900/10' :
                    'bg-blue-50/50 dark:bg-blue-900/10'
                  }`}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between gap-4 mb-4">
                        <div className="flex items-center gap-3">
                          <div className={`h-10 w-10 rounded-lg bg-background border-2 flex items-center justify-center ${
                            item.status === 'completed' ? 'border-green-200 text-green-600' :
                            item.status === 'in-progress' ? 'border-orange-200 text-orange-600' :
                            'border-blue-200 text-blue-600'
                          }`}>
                            <statusInfo.icon className="h-5 w-5" />
                          </div>
                          <div>
                            <h3 className="text-xl font-semibold">{item.phase}</h3>
                            <p className="text-sm text-muted-foreground">{item.timeline}</p>
                          </div>
                        </div>
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${badgeInfo.color}`}
                        >
                          {badgeInfo.text}
                        </Badge>
                      </div>

                      {/* Features List */}
                      <div className="space-y-2">
                        {item.features.map((feature, featureIndex) => (
                          <motion.div
                            key={feature}
                            initial={{ opacity: 0, x: -10 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.4, delay: (index * 0.2) + (featureIndex * 0.1) }}
                            className="flex items-center gap-3"
                          >
                            <div className={`h-1.5 w-1.5 rounded-full ${
                              item.status === 'completed' ? 'bg-green-500' :
                              item.status === 'in-progress' ? 'bg-orange-500' : 'bg-blue-500'
                            }`} />
                            <span className="text-sm text-foreground">{feature}</span>
                          </motion.div>
                        ))}
                      </div>

                      {/* Action for current phase */}
                      {item.status === 'completed' && (
                        <div className="mt-4 pt-4 border-t border-border/30">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Ready to try these features?</span>
                            <Button
                              size="sm"
                              className="h-8 px-3 text-xs bg-green-600 hover:bg-green-700 rounded-lg"
                            >
                              Try Now
                              <ArrowRight className="h-3 w-3 ml-1" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Early Adopter CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mt-16 text-center"
        >
          <Card className="border-primary/20 bg-primary/5 card-shadow-lg">
            <CardContent className="p-8">
              <div className="flex items-center justify-center gap-2 mb-4">
                <Users className="h-6 w-6 text-primary" />
                <h3 className="text-2xl font-semibold">Join the Early Adopter Program</h3>
              </div>
              <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                Get early access to beta features, influence our roadmap, and receive special pricing 
                when we launch paid plans.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button
                  onClick={onJoinWaitlist}
                  size="lg"
                  className="bg-primary hover:bg-primary/90 rounded-xl"
                >
                  Join Early Access
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
                <Badge variant="outline" className="bg-white/50 border-primary/30 text-primary">
                  Free during beta • No credit card required
                </Badge>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </section>
  );
}