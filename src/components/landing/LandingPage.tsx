import React from 'react';
import { HeroSection } from './HeroSection';
import { NavigationHeader } from './NavigationHeader';

interface LandingPageProps {
  onGetStarted: () => void;
  onSignIn: () => void;
  onRequestDemo: () => void;
}

export function LandingPage({ onGetStarted, onSignIn, onRequestDemo }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-background">
      <NavigationHeader onGetStarted={onGetStarted} onSignIn={onSignIn} />
      
      <main>
        <HeroSection onGetStarted={onGetStarted} onRequestDemo={onRequestDemo} />
      </main>
    </div>
  );
}