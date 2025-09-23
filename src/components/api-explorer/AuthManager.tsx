import React, { useState, useEffect } from 'react';
import { Key, Eye, EyeOff, Shield, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Separator } from '../ui/separator';
import { Switch } from '../ui/switch';
import { OpenAPISpec, SecurityScheme } from './types';

interface AuthManagerProps {
  apiSpec: OpenAPISpec;
  onAuthChange: (auth: AuthConfig) => void;
  className?: string;
}

export interface AuthConfig {
  type: 'none' | 'apiKey' | 'bearer' | 'basic' | 'oauth2';
  apiKey?: string;
  apiKeyLocation?: 'header' | 'query' | 'cookie';
  apiKeyName?: string;
  bearerToken?: string;
  basicUsername?: string;
  basicPassword?: string;
  oauth2Token?: string;
  customHeaders?: Record<string, string>;
}

export function AuthManager({ apiSpec, onAuthChange, className = "" }: AuthManagerProps) {
  const [authConfig, setAuthConfig] = useState<AuthConfig>({ type: 'none' });
  const [showSensitive, setShowSensitive] = useState(false);
  const [selectedScheme, setSelectedScheme] = useState<string>('');

  const securitySchemes = apiSpec.components?.securitySchemes || {};
  const hasSecuritySchemes = Object.keys(securitySchemes).length > 0;

  useEffect(() => {
    onAuthChange(authConfig);
  }, [authConfig, onAuthChange]);

  const handleAuthTypeChange = (type: AuthConfig['type']) => {
    setAuthConfig(prev => ({
      type,
      ...(type === 'none' ? {} : {
        customHeaders: prev.customHeaders
      })
    }));
  };

  const handleSchemeSelect = (schemeName: string) => {
    const scheme = securitySchemes[schemeName];
    if (!scheme) return;

    setSelectedScheme(schemeName);
    
    switch (scheme.type) {
      case 'apiKey':
        setAuthConfig({
          type: 'apiKey',
          apiKeyLocation: scheme.in as 'header' | 'query' | 'cookie',
          apiKeyName: scheme.name,
          apiKey: ''
        });
        break;
      case 'http':
        if (scheme.scheme === 'bearer') {
          setAuthConfig({
            type: 'bearer',
            bearerToken: ''
          });
        } else if (scheme.scheme === 'basic') {
          setAuthConfig({
            type: 'basic',
            basicUsername: '',
            basicPassword: ''
          });
        }
        break;
      case 'oauth2':
        setAuthConfig({
          type: 'oauth2',
          oauth2Token: ''
        });
        break;
      default:
        setAuthConfig({ type: 'none' });
    }
  };

  const updateAuthField = <K extends keyof AuthConfig>(
    field: K,
    value: AuthConfig[K]
  ) => {
    setAuthConfig(prev => ({ ...prev, [field]: value }));
  };

  const getAuthSummary = () => {
    switch (authConfig.type) {
      case 'apiKey':
        return `API Key in ${authConfig.apiKeyLocation} (${authConfig.apiKeyName})`;
      case 'bearer':
        return 'Bearer Token Authentication';
      case 'basic':
        return 'Basic Authentication';
      case 'oauth2':
        return 'OAuth 2.0 Token';
      default:
        return 'No Authentication';
    }
  };

  const renderAuthForm = () => {
    switch (authConfig.type) {
      case 'apiKey':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="api-key-location" className="text-sm font-medium">Location</Label>
                <Select 
                  value={authConfig.apiKeyLocation || 'header'} 
                  onValueChange={(value: 'header' | 'query' | 'cookie') => 
                    updateAuthField('apiKeyLocation', value)
                  }
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="header">Header</SelectItem>
                    <SelectItem value="query">Query Parameter</SelectItem>
                    <SelectItem value="cookie">Cookie</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="api-key-name" className="text-sm font-medium">Parameter Name</Label>
                <Input
                  id="api-key-name"
                  value={authConfig.apiKeyName || ''}
                  onChange={(e) => updateAuthField('apiKeyName', e.target.value)}
                  placeholder="e.g., X-API-Key, api_key"
                  className="mt-1"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="api-key" className="text-sm font-medium">API Key</Label>
              <div className="relative mt-1">
                <Input
                  id="api-key"
                  type={showSensitive ? 'text' : 'password'}
                  value={authConfig.apiKey || ''}
                  onChange={(e) => updateAuthField('apiKey', e.target.value)}
                  placeholder="Enter your API key"
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSensitive(!showSensitive)}
                  className="absolute right-0 top-0 h-full px-3"
                >
                  {showSensitive ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>
        );

      case 'bearer':
        return (
          <div>
            <Label htmlFor="bearer-token" className="text-sm font-medium">Bearer Token</Label>
            <div className="relative mt-1">
              <Input
                id="bearer-token"
                type={showSensitive ? 'text' : 'password'}
                value={authConfig.bearerToken || ''}
                onChange={(e) => updateAuthField('bearerToken', e.target.value)}
                placeholder="Enter your bearer token"
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowSensitive(!showSensitive)}
                className="absolute right-0 top-0 h-full px-3"
              >
                {showSensitive ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        );

      case 'basic':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="basic-username" className="text-sm font-medium">Username</Label>
              <Input
                id="basic-username"
                value={authConfig.basicUsername || ''}
                onChange={(e) => updateAuthField('basicUsername', e.target.value)}
                placeholder="Enter username"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="basic-password" className="text-sm font-medium">Password</Label>
              <div className="relative mt-1">
                <Input
                  id="basic-password"
                  type={showSensitive ? 'text' : 'password'}
                  value={authConfig.basicPassword || ''}
                  onChange={(e) => updateAuthField('basicPassword', e.target.value)}
                  placeholder="Enter password"
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSensitive(!showSensitive)}
                  className="absolute right-0 top-0 h-full px-3"
                >
                  {showSensitive ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>
        );

      case 'oauth2':
        return (
          <div>
            <Label htmlFor="oauth2-token" className="text-sm font-medium">OAuth 2.0 Access Token</Label>
            <div className="relative mt-1">
              <Input
                id="oauth2-token"
                type={showSensitive ? 'text' : 'password'}
                value={authConfig.oauth2Token || ''}
                onChange={(e) => updateAuthField('oauth2Token', e.target.value)}
                placeholder="Enter your access token"
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowSensitive(!showSensitive)}
                className="absolute right-0 top-0 h-full px-3"
              >
                {showSensitive ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        );

      default:
        return (
          <div className="text-center py-8 text-muted-foreground">
            <Shield className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No authentication required</p>
          </div>
        );
    }
  };

  return (
    <Card className={`border-border/50 ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Key className="h-4 w-4" />
            Authentication
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant={authConfig.type === 'none' ? 'secondary' : 'default'} className="text-xs">
              {getAuthSummary()}
            </Badge>
            <div className="flex items-center gap-2">
              <Label htmlFor="show-sensitive" className="text-xs text-muted-foreground">Show</Label>
              <Switch
                id="show-sensitive"
                checked={showSensitive}
                onCheckedChange={setShowSensitive}
                size="sm"
              />
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <Tabs value={authConfig.type} onValueChange={handleAuthTypeChange} className="w-full">
          <TabsList className="grid w-full grid-cols-5 rounded-lg bg-secondary/30">
            <TabsTrigger value="none" className="text-xs rounded-lg">None</TabsTrigger>
            <TabsTrigger value="apiKey" className="text-xs rounded-lg">API Key</TabsTrigger>
            <TabsTrigger value="bearer" className="text-xs rounded-lg">Bearer</TabsTrigger>
            <TabsTrigger value="basic" className="text-xs rounded-lg">Basic</TabsTrigger>
            <TabsTrigger value="oauth2" className="text-xs rounded-lg">OAuth2</TabsTrigger>
          </TabsList>

          {/* Available Security Schemes */}
          {hasSecuritySchemes && (
            <div className="mt-4">
              <Label className="text-sm font-medium">Available Security Schemes</Label>
              <div className="mt-2 space-y-2">
                {Object.entries(securitySchemes).map(([name, scheme]) => (
                  <Button
                    key={name}
                    variant={selectedScheme === name ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleSchemeSelect(name)}
                    className="w-full justify-start text-xs h-auto p-2"
                  >
                    <div className="flex flex-col items-start">
                      <div className="flex items-center gap-2">
                        <span className="font-mono">{name}</span>
                        <Badge variant="secondary" className="text-[10px] h-4">
                          {scheme.type}
                          {scheme.scheme && ` (${scheme.scheme})`}
                        </Badge>
                      </div>
                      {scheme.description && (
                        <p className="text-xs text-muted-foreground mt-1 text-left">
                          {scheme.description}
                        </p>
                      )}
                    </div>
                  </Button>
                ))}
              </div>
              <Separator className="my-4" />
            </div>
          )}

          <TabsContent value="none" className="mt-4">
            {renderAuthForm()}
          </TabsContent>
          <TabsContent value="apiKey" className="mt-4">
            {renderAuthForm()}
          </TabsContent>
          <TabsContent value="bearer" className="mt-4">
            {renderAuthForm()}
          </TabsContent>
          <TabsContent value="basic" className="mt-4">
            {renderAuthForm()}
          </TabsContent>
          <TabsContent value="oauth2" className="mt-4">
            {renderAuthForm()}
          </TabsContent>
        </Tabs>

        {authConfig.type !== 'none' && (
          <Alert className="mt-4 border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-xs">
              <strong>Security Notice:</strong> Your credentials are stored locally in this session only. 
              They are not sent to any external servers except the API you're testing.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}