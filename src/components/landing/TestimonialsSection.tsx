import React from 'react';
import { Badge } from '../ui/badge';
import { Card, CardContent } from '../ui/card';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Star, Quote } from 'lucide-react';
import { motion } from 'motion/react';

export function TestimonialsSection() {
  const testimonials = [
    {
      name: 'Sarah Chen',
      role: 'Lead Developer',
      company: 'TechFlow Inc',
      avatar: 'SC',
      rating: 5,
      content: 'APIFlow has revolutionized how we manage our APIs. The documentation is always up-to-date and the testing suite has caught so many issues before they hit production.',
      highlight: 'Caught 90% more issues'
    },
    {
      name: 'Marcus Rodriguez',
      role: 'DevOps Engineer',
      company: 'CloudScale',
      avatar: 'MR',
      rating: 5,
      content: 'The security features and monitoring capabilities are outstanding. We can track everything and ensure compliance across all our APIs.',
      highlight: 'Improved security posture'
    },
    {
      name: 'Elena Kowalski',
      role: 'API Product Manager',
      company: 'DataSync',
      avatar: 'EK',
      rating: 5,
      content: 'Our developer onboarding time has been cut in half. New team members can find and understand our APIs immediately.',
      highlight: '50% faster onboarding'
    },
    {
      name: 'James Thompson',
      role: 'Senior Backend Engineer',
      company: 'MicroService Co',
      avatar: 'JT',
      rating: 5,
      content: 'The collaboration features are game-changing. Our frontend and backend teams can work together seamlessly now.',
      highlight: 'Better team collaboration'
    },
    {
      name: 'Priya Patel',
      role: 'Engineering Manager',
      company: 'InnovateLab',
      avatar: 'PP',
      rating: 5,
      content: 'APIFlow helped us standardize our API documentation across 50+ microservices. The consistency is incredible.',
      highlight: 'Standardized 50+ APIs'
    },
    {
      name: 'Alex Kim',
      role: 'Full Stack Developer',
      company: 'StartupXYZ',
      avatar: 'AK',
      rating: 5,
      content: 'As a small team, we needed something powerful but easy to use. APIFlow delivers both. The learning curve was practically zero.',
      highlight: 'Zero learning curve'
    }
  ];

  const stats = [
    { value: '10,000+', label: 'Happy Developers' },
    { value: '4.9/5', label: 'Average Rating' },
    { value: '99%', label: 'Would Recommend' },
    { value: '500+', label: 'Companies Trust Us' }
  ];

  return (
    <section className="py-24 bg-gradient-to-br from-secondary/30 via-background to-background">
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
            Testimonials
          </Badge>
          <h2 className="text-4xl md:text-5xl font-semibold tracking-tight mb-6">
            Loved by developers worldwide
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            See what developers and teams are saying about their experience with APIFlow.
          </p>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16"
        >
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
              className="text-center"
            >
              <div className="text-3xl md:text-4xl font-bold text-primary mb-2">
                {stat.value}
              </div>
              <div className="text-sm text-muted-foreground">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              whileHover={{ y: -8 }}
              className="group"
            >
              <Card className="h-full border-border/50 hover:border-primary/20 transition-all duration-300 hover:card-shadow-lg bg-card/80 backdrop-blur-sm">
                <CardContent className="p-6">
                  {/* Rating */}
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star 
                        key={i} 
                        className="h-4 w-4 text-yellow-500 fill-current" 
                      />
                    ))}
                  </div>

                  {/* Quote Icon */}
                  <Quote className="h-8 w-8 text-primary/20 mb-4" />

                  {/* Content */}
                  <blockquote className="text-foreground leading-relaxed mb-6 group-hover:text-foreground/90 transition-colors">
                    "{testimonial.content}"
                  </blockquote>

                  {/* Highlight */}
                  <div className="mb-6">
                    <Badge 
                      variant="secondary" 
                      className="text-xs bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400 border-green-200 dark:border-green-800"
                    >
                      {testimonial.highlight}
                    </Badge>
                  </div>

                  {/* Author */}
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-primary/10 text-primary font-medium text-sm">
                        {testimonial.avatar}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-foreground truncate">
                        {testimonial.name}
                      </div>
                      <div className="text-sm text-muted-foreground truncate">
                        {testimonial.role} at {testimonial.company}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-center mt-16"
        >
          <div className="bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 rounded-2xl p-8 md:p-12 border border-primary/20">
            <h3 className="text-2xl md:text-3xl font-semibold mb-4">
              Join the community
            </h3>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed mb-6">
              Connect with thousands of developers who are building amazing things with APIs.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Badge 
                variant="outline" 
                className="text-sm px-4 py-2 border-border/50 bg-background/50"
              >
                Join our Slack community
              </Badge>
              <Badge 
                variant="outline" 
                className="text-sm px-4 py-2 border-border/50 bg-background/50"
              >
                Follow us on Twitter
              </Badge>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}