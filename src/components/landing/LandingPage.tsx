import React from 'react';
import { useNavigate } from 'react-router-dom';
import { HeroSection } from './HeroSection';
import { NavigationHeader } from './NavigationHeader';
import { InteractiveDemo } from './InteractiveDemo';

interface LandingPageProps {}

export function LandingPage({}: LandingPageProps) {
  const navigate = useNavigate();

  const handleTryDemo = () => {
    navigate('/specs');
  };

  const handleGetStarted = () => {
    navigate('/sign-up');
  };

  const handleSignIn = () => {
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-background">
      <NavigationHeader
        onGetStarted={handleGetStarted}
        onSignIn={handleSignIn}
      />

      <main>
        <HeroSection />
        <InteractiveDemo onTryDemo={handleTryDemo} />
      </main>
    </div>
  );
}