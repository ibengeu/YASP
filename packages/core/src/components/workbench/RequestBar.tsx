import { Play } from 'lucide-react';
import { getMethodColor } from '@/lib/constants';
import type { HTTPMethod } from '@/components/api-details/types';

const HTTP_METHODS: HTTPMethod[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];

interface RequestBarProps {
  method: HTTPMethod;
  url: string;
  onUrlChange: (url: string) => void;
  onMethodChange: (method: HTTPMethod) => void;
  onSend: () => void;
  isSending: boolean;
}

export function RequestBar({ method, url, onUrlChange, onMethodChange, onSend, isSending }: RequestBarProps) {
  const methodColors = getMethodColor(method);

  return (
    <div className="p-4 border-b border-primary/15 shrink-0 bg-background/80">
      <div className="flex items-stretch h-10 rounded-lg border border-primary/20 bg-background shadow-sm focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/20 transition-all">
        {/* Method dropdown */}
        <div className="flex items-center border-r border-primary/15 rounded-l-lg">
          <select
            value={method}
            onChange={(e) => onMethodChange(e.target.value as HTTPMethod)}
            className={`h-full px-3 text-sm font-bold bg-transparent border-none focus:outline-none cursor-pointer appearance-none ${methodColors.text}`}
          >
            {HTTP_METHODS.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>
        {/* URL input */}
        <input
          type="text"
          value={url}
          onChange={(e) => onUrlChange(e.target.value)}
          className="flex-1 bg-transparent px-3 text-base text-foreground font-mono placeholder:text-muted-foreground focus:outline-none cursor-text"
          placeholder="Enter request URL"
        />
        {/* Send button */}
        <button
          type="button"
          onClick={onSend}
          disabled={isSending}
          className="px-4 bg-primary text-primary-foreground text-xs font-bold rounded-r-lg hover:opacity-90 transition-colors cursor-pointer flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSending ? 'Sending...' : 'Send Request'}
          {!isSending && <Play className="w-3 h-3 fill-current" />}
        </button>
      </div>
    </div>
  );
}
