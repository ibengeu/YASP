/**
 * RequestAuthPanel - Authentication configuration panel
 */

import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import type {AuthConfig, AuthType} from './types';

interface RequestAuthPanelProps {
    auth: AuthConfig;
    onAuthChange: (auth: AuthConfig) => void;
    detectedAuth: {type: AuthType};
}

export function RequestAuthPanel({auth, onAuthChange, detectedAuth}: RequestAuthPanelProps) {
    const authWasAutoDetected = detectedAuth.type !== 'none';

    return (
        <div className="space-y-4">
            <div>
                <Label className="text-xs mb-2">Auth Type</Label>
                <Select
                    value={auth.type}
                    onValueChange={(value) => onAuthChange({...auth, type: value as AuthType})}
                >
                    <SelectTrigger className="cursor-pointer">
                        <SelectValue/>
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="none" className="cursor-pointer">No Auth</SelectItem>
                        <SelectItem value="api-key" className="cursor-pointer">API Key</SelectItem>
                        <SelectItem value="bearer" className="cursor-pointer">Bearer Token</SelectItem>
                        <SelectItem value="basic" className="cursor-pointer">Basic Auth</SelectItem>
                    </SelectContent>
                </Select>
                {authWasAutoDetected && auth.type === detectedAuth.type && (
                    <p className="text-xs text-secondary mt-1">
                        Pre-selected from API specification
                    </p>
                )}
            </div>

            {auth.type === 'api-key' && (
                <div>
                    <Label className="text-xs mb-2">API Key</Label>
                    <Input
                        value={auth.apiKey || ''}
                        onChange={(e) => onAuthChange({...auth, apiKey: e.target.value})}
                        placeholder="Enter your API key"
                    />
                    <p className="text-xs text-muted-foreground mt-1">Will be sent as X-API-Key header</p>
                </div>
            )}

            {auth.type === 'bearer' && (
                <div>
                    <Label className="text-xs mb-2">Token</Label>
                    <Input
                        value={auth.token || ''}
                        onChange={(e) => onAuthChange({...auth, token: e.target.value})}
                        placeholder="Enter bearer token"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                        Will be sent as Authorization: Bearer {'{token}'}
                    </p>
                </div>
            )}

            {auth.type === 'basic' && (
                <div className="space-y-3">
                    <div>
                        <Label className="text-xs mb-2">Username</Label>
                        <Input
                            value={auth.username || ''}
                            onChange={(e) => onAuthChange({...auth, username: e.target.value})}
                            placeholder="Enter username"
                        />
                    </div>
                    <div>
                        <Label className="text-xs mb-2">Password</Label>
                        <Input
                            type="password"
                            value={auth.password || ''}
                            onChange={(e) => onAuthChange({...auth, password: e.target.value})}
                            placeholder="Enter password"
                        />
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Will be sent as Authorization: Basic {'{base64(username:password)}'}
                    </p>
                </div>
            )}

            {auth.type === 'none' && (
                <div className="text-sm text-muted-foreground">
                    No authentication will be used for this request.
                </div>
            )}
        </div>
    );
}
