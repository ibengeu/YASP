import React from 'react';
import { Link } from 'react-router-dom';
import { InviteManagement } from '@/components/invite/InviteManagement';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function InviteManagementPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation Back to Catalog */}
      <div className="absolute top-4 left-4 z-10">
        <Link to="/catalog">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Catalog
          </Button>
        </Link>
      </div>

      {/* Main Content */}
      <div className="container mx-auto p-6 pt-20">
        <div className="max-w-7xl mx-auto">
          <InviteManagement />
        </div>
      </div>
    </div>
  );
}