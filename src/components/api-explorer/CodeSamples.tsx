import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Badge } from '../ui/badge';
import { EndpointInfo, ApiRequest } from './types';
import { toast } from 'sonner';

interface CodeSamplesProps {
  endpoint: EndpointInfo;
  request: ApiRequest;
  serverUrl: string;
}

export function CodeSamples({ endpoint, request, serverUrl }: CodeSamplesProps) {
  const [copiedSample, setCopiedSample] = useState<string | null>(null);

  const buildUrl = () => {
    let path = endpoint.path;
    
    // Replace path parameters
    Object.entries(request.pathParams).forEach(([key, value]) => {
      path = path.replace(`{${key}}`, encodeURIComponent(value));
    });

    // Add query parameters
    const queryString = Object.entries(request.queryParams)
      .filter(([_, value]) => value !== '')
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
      .join('&');

    const baseUrl = serverUrl.replace(/\/$/, '');
    const fullPath = `${baseUrl}${path}`;
    
    return queryString ? `${fullPath}?${queryString}` : fullPath;
  };

  const generateCurlSample = () => {
    const url = buildUrl();
    let curl = `curl -X ${request.method} "${url}"`;

    // Add headers
    Object.entries(request.headers).forEach(([key, value]) => {
      if (value && value !== '') {
        curl += ` \\\n  -H "${key}: ${value}"`;
      }
    });

    // Add body
    if (request.body && request.method !== 'GET') {
      curl += ` \\\n  -d '${request.body}'`;
    }

    return curl;
  };

  const generateJavaScriptSample = () => {
    const url = buildUrl();
    const headers: Record<string, string> = {};
    
    // Filter out empty headers
    Object.entries(request.headers).forEach(([key, value]) => {
      if (value && value !== '') {
        headers[key] = value;
      }
    });

    const options: any = {
      method: request.method,
      headers
    };

    if (request.body && request.method !== 'GET') {
      options.body = request.body;
    }

    return `// Using fetch API
const response = await fetch('${url}', ${JSON.stringify(options, null, 2)});

if (!response.ok) {
  throw new Error(\`HTTP error! status: \${response.status}\`);
}

const data = await response.json();
console.log(data);`;
  };

  const generatePythonSample = () => {
    const url = buildUrl();
    let python = `import requests
import json

url = "${url}"

headers = {`;
    
    Object.entries(request.headers).forEach(([key, value]) => {
      if (value && value !== '') {
        python += `\n    "${key}": "${value}",`;
      }
    });
    
    python += `\n}`;

    if (request.body && request.method !== 'GET') {
      python += `\n\ndata = ${request.body}`;
      python += `\n\nresponse = requests.${request.method.toLowerCase()}(url, headers=headers, json=data)`;
    } else {
      python += `\n\nresponse = requests.${request.method.toLowerCase()}(url, headers=headers)`;
    }

    python += `\n
if response.status_code == 200:
    result = response.json()
    print(json.dumps(result, indent=2))
else:
    print(f"Error: {response.status_code} - {response.text}")`;

    return python;
  };

  const generateNodeJSSample = () => {
    const url = buildUrl();
    const headers: Record<string, string> = {};
    
    Object.entries(request.headers).forEach(([key, value]) => {
      if (value && value !== '') {
        headers[key] = value;
      }
    });

    let nodejs = `const axios = require('axios');

const config = {
  method: '${request.method.toLowerCase()}',
  url: '${url}',
  headers: ${JSON.stringify(headers, null, 2)}`;

    if (request.body && request.method !== 'GET') {
      nodejs += `,
  data: ${request.body}`;
    }

    nodejs += `
};

axios(config)
  .then(response => {
    console.log(JSON.stringify(response.data, null, 2));
  })
  .catch(error => {
    console.error('Error:', error.response?.data || error.message);
  });`;

    return nodejs;
  };

  const copyToClipboard = async (code: string, sampleType: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedSample(sampleType);
      toast.success(`${sampleType} code copied to clipboard`);
      setTimeout(() => setCopiedSample(null), 2000);
    } catch (err) {
      toast.error('Failed to copy code to clipboard');
    }
  };

  const samples = [
    { id: 'curl', label: 'cURL', code: generateCurlSample() },
    { id: 'javascript', label: 'JavaScript', code: generateJavaScriptSample() },
    { id: 'python', label: 'Python', code: generatePythonSample() },
    { id: 'nodejs', label: 'Node.js', code: generateNodeJSSample() },
  ];

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">Code Samples</CardTitle>
          <Badge variant="outline" className="text-xs">
            {samples.length} languages
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <Tabs defaultValue="curl" className="w-full">
          <TabsList className="grid w-full grid-cols-4 rounded-lg bg-secondary/30">
            {samples.map((sample) => (
              <TabsTrigger 
                key={sample.id} 
                value={sample.id}
                className="text-xs rounded-lg data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
              >
                {sample.label}
              </TabsTrigger>
            ))}
          </TabsList>
          
          {samples.map((sample) => (
            <TabsContent key={sample.id} value={sample.id} className="mt-4">
              <div className="relative">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-muted-foreground font-medium">{sample.label} Request</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(sample.code, sample.label)}
                    className="h-6 px-2 text-xs hover:bg-secondary/50 rounded-lg"
                  >
                    {copiedSample === sample.label ? (
                      <Check className="h-3 w-3 mr-1" />
                    ) : (
                      <Copy className="h-3 w-3 mr-1" />
                    )}
                    {copiedSample === sample.label ? 'Copied!' : 'Copy'}
                  </Button>
                </div>
                <pre className="bg-muted/50 text-xs p-3 rounded-lg overflow-x-auto border border-border/50 font-mono leading-relaxed">
                  <code className="text-foreground/90">{sample.code}</code>
                </pre>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
}