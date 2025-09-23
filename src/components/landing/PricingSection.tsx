import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardHeader } from '../ui/card';
import { Switch } from '../ui/switch';
import { Check, Zap, Crown, Building, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';

interface PricingSectionProps {
  onGetStarted: () => void;
}

export function PricingSection({ onGetStarted }: PricingSectionProps) {
  const [isAnnual, setIsAnnual] = useState(true);

  const plans = [
    {
      name: 'Starter',
      description: 'Perfect for individual developers and small projects',
      icon: Zap,
      monthlyPrice: 0,
      annualPrice: 0,
      badge: 'Free Forever',
      badgeColor: 'bg-green-100 text-green-800 border-green-200',
      features: [
        'Up to 5 APIs',
        'Basic documentation',
        'Community support',
        'Standard templates',
        'Basic analytics'
      ],
      limitations: [
        'Limited to 1,000 API calls/month',
        'Community support only'
      ],
      cta: 'Start Free',
      popular: false
    },
    {
      name: 'Professional',
      description: 'Ideal for growing teams and production workloads',
      icon: Crown,
      monthlyPrice: 29,
      annualPrice: 24,
      badge: 'Most Popular',
      badgeColor: 'bg-primary/10 text-primary border-primary/20',
      features: [
        'Unlimited APIs',
        'Advanced documentation',
        'Priority support',
        'Custom templates',
        'Advanced analytics',
        'Team collaboration',
        'API testing suite',
        'Custom branding'
      ],
      limitations: [],
      cta: 'Start Trial',
      popular: true
    },
    {
      name: 'Enterprise',
      description: 'For large organizations with advanced security needs',
      icon: Building,
      monthlyPrice: 99,
      annualPrice: 82,
      badge: 'Advanced Security',
      badgeColor: 'bg-purple-100 text-purple-800 border-purple-200',
      features: [
        'Everything in Professional',
        'Single Sign-On (SSO)',
        'Advanced security controls',
        'Dedicated account manager',
        'Custom integrations',
        'SLA guarantees',
        'On-premise deployment',
        'Advanced compliance'
      ],
      limitations: [],
      cta: 'Contact Sales',
      popular: false
    }
  ];

  const faqItems = [
    {
      question: 'Can I change plans anytime?',
      answer: 'Yes, you can upgrade, downgrade, or cancel your plan at any time. Changes take effect immediately.'
    },
    {
      question: 'Is there a free trial?',
      answer: 'Yes! All paid plans come with a 14-day free trial. No credit card required to start.'
    },
    {
      question: 'What payment methods do you accept?',
      answer: 'We accept all major credit cards, PayPal, and can arrange bank transfers for Enterprise plans.'
    }
  ];

  const savings = isAnnual ? Math.round(((29 * 12) - (24 * 12)) / (29 * 12) * 100) : 0;

  return (
    <section id="pricing" className="py-24 bg-background">
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
            Pricing
          </Badge>
          <h2 className="text-4xl md:text-5xl font-semibold tracking-tight mb-6">
            Simple, transparent pricing
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed mb-8">
            Choose the plan that fits your needs. Start free and scale as you grow.
          </p>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-4">
            <span className={`text-sm font-medium ${!isAnnual ? 'text-foreground' : 'text-muted-foreground'}`}>
              Monthly
            </span>
            <Switch
              checked={isAnnual}
              onCheckedChange={setIsAnnual}
              className="data-[state=checked]:bg-primary"
            />
            <span className={`text-sm font-medium ${isAnnual ? 'text-foreground' : 'text-muted-foreground'}`}>
              Annual
            </span>
            {isAnnual && (
              <Badge variant="secondary" className="ml-2 bg-green-100 text-green-800 border-green-200">
                Save {savings}%
              </Badge>
            )}
          </div>
        </motion.div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              whileHover={{ y: -8 }}
              className={`group relative ${plan.popular ? 'md:-mt-4 md:mb-4' : ''}`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground px-4 py-1 text-sm font-medium">
                    Most Popular
                  </Badge>
                </div>
              )}
              
              <Card className={`h-full border-border/50 transition-all duration-300 bg-card/50 backdrop-blur-sm ${
                plan.popular 
                  ? 'border-primary/50 hover:border-primary hover:card-shadow-lg ring-1 ring-primary/10' 
                  : 'hover:border-primary/20 hover:card-shadow-lg'
              }`}>
                <CardHeader className="pb-8 pt-8">
                  {/* Plan Badge */}
                  <div className="flex items-center justify-between mb-4">
                    <Badge variant="outline" className={`text-xs ${plan.badgeColor}`}>
                      {plan.badge}
                    </Badge>
                    <div className={`h-10 w-10 rounded-lg bg-gradient-to-br ${
                      plan.name === 'Starter' ? 'from-green-500 to-emerald-500' :
                      plan.name === 'Professional' ? 'from-blue-500 to-cyan-500' :
                      'from-purple-500 to-pink-500'
                    } flex items-center justify-center`}>
                      <plan.icon className="h-5 w-5 text-white" />
                    </div>
                  </div>

                  {/* Plan Info */}
                  <div>
                    <h3 className="text-2xl font-semibold mb-2">{plan.name}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed mb-6">
                      {plan.description}
                    </p>
                  </div>

                  {/* Pricing */}
                  <div className="mb-6">
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-bold">
                        ${isAnnual ? plan.annualPrice : plan.monthlyPrice}
                      </span>
                      {plan.monthlyPrice > 0 && (
                        <span className="text-muted-foreground">/month</span>
                      )}
                    </div>
                    {plan.monthlyPrice > 0 && isAnnual && (
                      <p className="text-sm text-muted-foreground mt-1">
                        Billed annually (${plan.annualPrice * 12}/year)
                      </p>
                    )}
                  </div>

                  {/* CTA Button */}
                  <Button
                    onClick={plan.name === 'Enterprise' ? undefined : onGetStarted}
                    className={`w-full h-12 rounded-xl transition-all ${
                      plan.popular
                        ? 'bg-primary hover:bg-primary/90 text-primary-foreground card-shadow-sm'
                        : 'bg-secondary hover:bg-secondary/80 text-secondary-foreground'
                    }`}
                  >
                    {plan.cta}
                    {plan.name !== 'Enterprise' && (
                      <ArrowRight className="h-4 w-4 ml-2" />
                    )}
                  </Button>
                </CardHeader>

                <CardContent className="pt-0">
                  {/* Features */}
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                      Features included
                    </h4>
                    {plan.features.map((feature) => (
                      <div key={feature} className="flex items-start gap-3">
                        <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm leading-relaxed">{feature}</span>
                      </div>
                    ))}
                  </div>

                  {/* Limitations */}
                  {plan.limitations.length > 0 && (
                    <div className="mt-6 pt-6 border-t border-border/50">
                      <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide mb-3">
                        Limitations
                      </h4>
                      {plan.limitations.map((limitation) => (
                        <div key={limitation} className="flex items-start gap-3 mb-2">
                          <div className="h-4 w-4 border border-muted-foreground/30 rounded-full mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-muted-foreground leading-relaxed">{limitation}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* FAQ */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="text-center"
        >
          <h3 className="text-2xl md:text-3xl font-semibold tracking-tight mb-8">
            Frequently asked questions
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {faqItems.map((faq, index) => (
              <motion.div
                key={faq.question}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.4 + index * 0.1 }}
                className="text-left"
              >
                <h4 className="font-medium mb-2">{faq.question}</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">{faq.answer}</p>
              </motion.div>
            ))}
          </div>

          <div className="mt-12">
            <p className="text-muted-foreground mb-4">
              Have more questions? We're here to help.
            </p>
            <Button variant="outline" className="border-border/50 hover:bg-secondary/50 rounded-lg">
              Contact Support
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}