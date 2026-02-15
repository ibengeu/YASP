/**
 * RequestParamsTable - Editable table of query/path parameters
 */

import {Input} from '@/components/ui/input';
import {Checkbox} from '@/components/ui/checkbox';
import type {ParamRow} from './types';

interface RequestParamsTableProps {
    params: ParamRow[];
    onParamsChange: (params: ParamRow[]) => void;
}

export function RequestParamsTable({params, onParamsChange}: RequestParamsTableProps) {
    const updateParam = (index: number, updates: Partial<ParamRow>) => {
        const newParams = [...params];
        newParams[index] = {...newParams[index], ...updates};
        onParamsChange(newParams);
    };

    const handleKeyChange = (index: number, value: string) => {
        const newParams = [...params];
        newParams[index] = {...newParams[index], key: value};
        // Auto-add empty row when typing in the last row
        if (index === params.length - 1 && value) {
            newParams.push({enabled: false, key: '', value: '', description: undefined});
        }
        onParamsChange(newParams);
    };

    const handleValueChange = (index: number, value: string) => {
        updateParam(index, {
            value,
            enabled: value ? true : params[index].enabled,
        });
    };

    return (
        <div className="space-y-3">
            <div className="text-xs text-muted-foreground mb-2">
                Query and path parameters for this endpoint
            </div>
            <div className="border border-border rounded-md overflow-x-auto">
                <table className="w-full text-xs min-w-[400px]">
                    <thead className="bg-muted">
                    <tr>
                        <th className="w-10 p-2 text-left font-medium text-foreground"></th>
                        <th className="p-2 text-left font-medium text-foreground">Key</th>
                        <th className="p-2 text-left font-medium text-foreground">Value</th>
                        <th className="p-2 text-left font-medium text-foreground">Description</th>
                    </tr>
                    </thead>
                    <tbody>
                    {params.map((param, index) => (
                        <tr key={index} className="border-t border-border hover:bg-muted/50">
                            <td className="p-2">
                                <Checkbox
                                    checked={param.enabled}
                                    onCheckedChange={(checked) => updateParam(index, {enabled: !!checked})}
                                    className="cursor-pointer"
                                />
                            </td>
                            <td className="p-2">
                                <Input
                                    value={param.key}
                                    onChange={(e) => handleKeyChange(index, e.target.value)}
                                    placeholder="Parameter name"
                                    className="h-7 text-xs"
                                />
                            </td>
                            <td className="p-2">
                                <Input
                                    value={param.value}
                                    onChange={(e) => handleValueChange(index, e.target.value)}
                                    placeholder="Value"
                                    className="h-7 text-xs"
                                />
                            </td>
                            <td className="p-2">
                                <span className="text-muted-foreground text-xs truncate block">
                                    {param.description || '-'}
                                </span>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
