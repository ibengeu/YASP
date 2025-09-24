import React from 'react';
import { Link } from 'react-router-dom';
import { AuthScreen } from '@/features/auth/components/AuthScreen';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function LoginPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation Back to Landing */}
      <div className="absolute top-4 left-4 z-10">
        <Link to="/">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Button>
        </Link>
      </div>

      {/* Auth Screen with Login View */}
      <AuthScreen initialView="login" />
    </div>
  );
}