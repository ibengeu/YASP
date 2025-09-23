import React, { useState, useEffect } from 'react';
import { Textarea } from '../ui/textarea';
import { Alert, AlertDescription } from '../ui/alert';
import { Badge } from '../ui/badge';

interface JsonEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  readOnly?: boolean;
  className?: string;
}

export function JsonEditor({ value, onChange, placeholder, readOnly = false, className = "" }: JsonEditorProps) {
  const [error, setError] = useState<string | null>(null);
  const [formatted, setFormatted] = useState(value);

  useEffect(() => {
    setFormatted(value);
    validateJson(value);
  }, [value]);

  const validateJson = (jsonString: string) => {
    if (!jsonString.trim()) {
      setError(null);
      return;
    }
    
    try {
      JSON.parse(jsonString);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Invalid JSON');
    }
  };

  const handleChange = (newValue: string) => {
    setFormatted(newValue);
    onChange(newValue);
    validateJson(newValue);
  };

  const formatJson = () => {
    if (!formatted.trim()) return;
    
    try {
      const parsed = JSON.parse(formatted);
      const prettified = JSON.stringify(parsed, null, 2);
      setFormatted(prettified);
      onChange(prettified);
      setError(null);
    } catch (e) {
      // Keep current value if parsing fails
    }
  };

  const minifyJson = () => {
    if (!formatted.trim()) return;
    
    try {
      const parsed = JSON.parse(formatted);
      const minified = JSON.stringify(parsed);
      setFormatted(minified);
      onChange(minified);
      setError(null);
    } catch (e) {
      // Keep current value if parsing fails
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant={error ? "destructive" : "secondary"}>
            {error ? "Invalid" : "Valid"} JSON
          </Badge>
        </div>
        {!readOnly && (
          <div className="flex gap-1">
            <button
              type="button"
              onClick={formatJson}
              className="px-2 py-1 text-xs bg-muted hover:bg-muted/80 rounded transition-colors"
              disabled={!!error || !formatted.trim()}
            >
              Format
            </button>
            <button
              type="button"
              onClick={minifyJson}
              className="px-2 py-1 text-xs bg-muted hover:bg-muted/80 rounded transition-colors"
              disabled={!!error || !formatted.trim()}
            >
              Minify
            </button>
          </div>
        )}
      </div>
      
      <Textarea
        value={formatted}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={placeholder}
        readOnly={readOnly}
        className={`font-mono text-sm min-h-[200px] ${className}`}
        style={{ whiteSpace: 'pre' }}
      />
      
      {error && (
        <Alert variant="destructive">
          <AlertDescription className="text-xs">
            {error}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}