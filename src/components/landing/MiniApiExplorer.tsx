import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader } from '../ui/card';
import { Badge } from '../ui/badge';
import { Play, Code, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';

export function MiniApiExplorer() {
  const [selectedEndpoint, setSelectedEndpoint] = useState('/users');
  const [isRunning, setIsRunning] = useState(false);

  const endpoints = [
    { path: '/users', method: 'GET', description: 'Get all users' },
    { path: '/users/{id}', method: 'GET', description: 'Get user by ID' },
    { path: '/users', method: 'POST', description: 'Create new user' },
  ];

  const handleRunTest = () => {
    setIsRunning(true);
    setTimeout(() => setIsRunning(false), 1500);
  };

  const methodColors = {
    GET: 'bg-green-100 text-green-800 border-green-200',
    POST: 'bg-blue-100 text-blue-800 border-blue-200',
    PUT: 'bg-orange-100 text-orange-800 border-orange-200',
    DELETE: 'bg-red-100 text-red-800 border-red-200'
  };

  return (
    <div className="h-full flex">
      {/* Endpoints List */}
      <div className="w-1/2 border-r border-border/50 bg-secondary/20">
        <div className="p-3 border-b border-border/50">
          <h4 className="font-medium text-sm">Users API</h4>
        </div>
        <div className="p-2 space-y-1">
          {endpoints.map((endpoint, index) => (
            <motion.button
              key={`${endpoint.method}-${endpoint.path}-${index}`}
              onClick={() => setSelectedEndpoint(endpoint.path)}
              whileHover={{ x: 4 }}
              className={`w-full text-left p-2 rounded-lg transition-colors ${
                selectedEndpoint === endpoint.path 
                  ? 'bg-primary/10 border-primary/20 border' 
                  : 'hover:bg-secondary/50'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <Badge 
                  variant="outline" 
                  className={`text-xs px-1.5 py-0.5 ${methodColors[endpoint.method as keyof typeof methodColors]}`}
                >
                  {endpoint.method}
                </Badge>
                <code className="text-xs font-mono">{endpoint.path}</code>
              </div>
              <p className="text-xs text-muted-foreground">{endpoint.description}</p>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Test Panel */}
      <div className="w-1/2 flex flex-col">
        <div className="p-3 border-b border-border/50">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-sm">Try It Out</h4>
            <Button
              onClick={handleRunTest}
              disabled={isRunning}
              size="sm"
              className="h-7 px-3 text-xs bg-primary hover:bg-primary/90 rounded-md"
            >
              {isRunning ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="h-3 w-3 border-2 border-white border-t-transparent rounded-full"
                />
              ) : (
                <>
                  <Play className="h-3 w-3 mr-1" />
                  Run
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="flex-1 p-3 space-y-3">
          {/* Request */}
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Request
            </label>
            <Card className="mt-1">
              <CardContent className="p-2">
                <code className="text-xs font-mono text-foreground">
                  GET https://api.example.com{selectedEndpoint}
                </code>
              </CardContent>
            </Card>
          </div>

          {/* Response */}
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Response
            </label>
            <Card className="mt-1">
              <CardContent className="p-2">
                {isRunning ? (
                  <div className="text-xs text-muted-foreground">Running...</div>
                ) : (
                  <pre className="text-xs font-mono text-foreground">
{`{
  "data": [
    {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com"
    }
  ],
  "status": "success"
}`}
                  </pre>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Status */}
        <div className="p-3 border-t border-border/50 bg-secondary/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              <span className="text-xs text-muted-foreground">200 OK • 145ms</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Code className="h-3 w-3" />
              JSON
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}