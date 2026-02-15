/**
 * RequestHeadersTable - Editable table of HTTP request headers
 */

import {Input} from '@/components/ui/input';
import {Checkbox} from '@/components/ui/checkbox';
import type {HeaderRow} from './types';

interface RequestHeadersTableProps {
    headers: HeaderRow[];
    onHeadersChange: (headers: HeaderRow[]) => void;
}

export function RequestHeadersTable({headers, onHeadersChange}: RequestHeadersTableProps) {
    const updateHeader = (index: number, updates: Partial<HeaderRow>) => {
        const newHeaders = [...headers];
        newHeaders[index] = {...newHeaders[index], ...updates};
        onHeadersChange(newHeaders);
    };

    const handleKeyChange = (index: number, value: string) => {
        const newHeaders = [...headers];
        newHeaders[index] = {...newHeaders[index], key: value};
        // Auto-add empty row when typing in the last row
        if (index === headers.length - 1 && value) {
            newHeaders.push({enabled: false, key: '', value: ''});
        }
        onHeadersChange(newHeaders);
    };

    return (
        <div className="space-y-3">
            <div className="text-xs text-muted-foreground mb-2">
                HTTP headers to include with the request
            </div>
            <div className="border border-border rounded-md overflow-x-auto">
                <table className="w-full text-xs min-w-[350px]">
                    <thead className="bg-muted">
                    <tr>
                        <th className="w-10 p-2 text-left font-medium text-foreground"></th>
                        <th className="p-2 text-left font-medium text-foreground">Header</th>
                        <th className="p-2 text-left font-medium text-foreground">Value</th>
                    </tr>
                    </thead>
                    <tbody>
                    {headers.map((header, index) => (
                        <tr key={index} className="border-t border-border hover:bg-muted/50">
                            <td className="p-2">
                                <Checkbox
                                    checked={header.enabled}
                                    onCheckedChange={(checked) => updateHeader(index, {enabled: !!checked})}
                                    className="cursor-pointer"
                                />
                            </td>
                            <td className="p-2">
                                <Input
                                    value={header.key}
                                    onChange={(e) => handleKeyChange(index, e.target.value)}
                                    placeholder="Header name"
                                    className="h-7 text-xs"
                                />
                            </td>
                            <td className="p-2">
                                <Input
                                    value={header.value}
                                    onChange={(e) => updateHeader(index, {value: e.target.value})}
                                    placeholder="Header value"
                                    className="h-7 text-xs"
                                />
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
