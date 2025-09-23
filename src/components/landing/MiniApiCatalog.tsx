import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Search, FileText, ArrowRight, Globe, Shield, Zap } from 'lucide-react';
import { motion } from 'motion/react';

export function MiniApiCatalog() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedApi, setSelectedApi] = useState<string | null>(null);

  const apis = [
    {
      id: 'users-api',
      name: 'Users API',
      description: 'Manage user accounts and profiles',
      version: 'v1.2.0',
      status: 'Active',
      endpoints: 12,
      category: 'Authentication'
    },
    {
      id: 'payments-api',
      name: 'Payments API',
      description: 'Process payments and transactions',
      version: 'v2.1.0',
      status: 'Active',
      endpoints: 8,
      category: 'Finance'
    },
    {
      id: 'notifications-api',
      name: 'Notifications API',
      description: 'Send emails, SMS, and push notifications',
      version: 'v1.0.3',
      status: 'Beta',
      endpoints: 6,
      category: 'Messaging'
    }
  ];

  const filteredApis = apis.filter(api =>
    api.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    api.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    api.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Beta':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Authentication':
        return Shield;
      case 'Finance':
        return Zap;
      case 'Messaging':
        return Globe;
      default:
        return FileText;
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Search Header */}
      <div className="p-3 border-b border-border/50 bg-secondary/20">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search APIs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-8 text-sm bg-background border-border/50"
          />
        </div>
      </div>

      {/* API List */}
      <div className="flex-1 overflow-auto">
        <div className="p-2 space-y-2">
          {filteredApis.map((api) => {
            const CategoryIcon = getCategoryIcon(api.category);
            
            return (
              <motion.div
                key={api.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -2 }}
                className="group"
              >
                <Card 
                  className={`cursor-pointer transition-all border-border/50 hover:border-primary/30 hover:card-shadow-sm ${
                    selectedApi === api.id ? 'border-primary/50 bg-primary/5' : 'hover:bg-secondary/30'
                  }`}
                  onClick={() => setSelectedApi(selectedApi === api.id ? null : api.id)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-start gap-3">
                      {/* Icon */}
                      <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <CategoryIcon className="h-4 w-4 text-primary" />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h4 className="font-medium text-sm truncate">{api.name}</h4>
                          <Badge 
                            variant="outline" 
                            className={`text-xs px-1.5 py-0.5 ${getStatusColor(api.status)}`}
                          >
                            {api.status}
                          </Badge>
                        </div>
                        
                        <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                          {api.description}
                        </p>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span>{api.version}</span>
                            <span>•</span>
                            <span>{api.endpoints} endpoints</span>
                          </div>
                          <ArrowRight className="h-3 w-3 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                        </div>
                      </div>
                    </div>

                    {/* Expanded Content */}
                    {selectedApi === api.id && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-3 pt-3 border-t border-border/50"
                      >
                        <div className="flex items-center justify-between">
                          <Badge variant="secondary" className="text-xs">
                            {api.category}
                          </Badge>
                          <Button
                            size="sm"
                            className="h-6 px-2 text-xs bg-primary hover:bg-primary/90 rounded-md"
                          >
                            <FileText className="h-3 w-3 mr-1" />
                            Explore
                          </Button>
                        </div>
                        
                        <div className="mt-2 text-xs text-muted-foreground">
                          Quick access to interactive documentation and testing tools.
                        </div>
                      </motion.div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Footer Stats */}
      <div className="p-3 border-t border-border/50 bg-secondary/20">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{filteredApis.length} APIs found</span>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-green-500" />
            <span>All systems operational</span>
          </div>
        </div>
      </div>
    </div>
  );
}