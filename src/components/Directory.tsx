// Directory.tsx
import {useEffect, useState} from 'react';
import {Card, CardDescription, CardHeader, CardTitle} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {Plus, Search, Trash2} from 'lucide-react';
import {IndexedDBService} from "@/services/indexdbservice.ts";
import {Input} from "@/components/ui/input.tsx";

interface Spec {
    id: string | number;
    title: string;
    version: string;
    description?: string;
    createdAt: string | number | Date;
}

interface DirectoryPageProps {
    onSpecSelect: (spec: Spec) => void;
    onAddNew: () => void;
}

export function DirectoryPage({onSpecSelect, onAddNew}: DirectoryPageProps) {
    const [specs, setSpecs] = useState<Spec[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const dbService = new IndexedDBService();

    useEffect(() => {
        loadSpecs();
    }, []);

    const loadSpecs = async () => {
        const allSpecs = await dbService.getAllSpecs();
        setSpecs(allSpecs as unknown as Spec[]);
    };

    const handleSpecSelect = (spec: Spec) => {
        onSpecSelect(spec);
    };

    const handleRemoveSpec = async (event: React.MouseEvent, specId: string | number) => {
        event.stopPropagation();
        if (window.confirm('Are you sure you want to remove this specification?')) {
            await dbService.deleteSpec(specId);
            await loadSpecs();
        }
    };

    const filteredAndSortedSpecs = specs
        .filter(spec =>
            spec.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (spec.description?.toLowerCase() || '').includes(searchTerm.toLowerCase())
        )
        .sort((a, b) => a.title.localeCompare(b.title));

    const groupedSpecs: Record<string, Spec[]> = filteredAndSortedSpecs.reduce((acc, spec) => {
        const firstLetter = spec.title[0].toUpperCase();
        if (!acc[firstLetter]) acc[firstLetter] = [];
        acc[firstLetter].push(spec);
        return acc;
    }, {} as Record<string, Spec[]>);

    return (
        <div className="container mx-auto py-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">API Specifications</h1>
                <Button onClick={onAddNew}>
                    <Plus className="mr-2 h-4 w-4"/> Add New Spec
                </Button>
            </div>

            <div className="relative mb-6">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground"/>
                <Input
                    placeholder="Search specifications..."
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {Object.entries(groupedSpecs).map(([letter, letterSpecs]) => (
                <div key={letter} className="mb-8">
                    <h2 className="text-lg font-semibold mb-4">{letter}</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {letterSpecs.map((spec) => (
                            <Card
                                key={spec.id}
                                className="hover:shadow-lg transition-shadow cursor-pointer group"
                                onClick={() => handleSpecSelect(spec)}
                            >
                                <CardHeader>
                                    <div className="flex justify-between items-start">
                                        <CardTitle>{spec.title}</CardTitle>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                                            onClick={(e) => handleRemoveSpec(e, spec.id)}
                                        >
                                            <Trash2 className="h-4 w-4 text-destructive"/>
                                        </Button>
                                    </div>
                                    <CardDescription>
                                        <div className="flex justify-between items-center">
                                            <span>Version: {spec.version}</span>
                                            <span className="text-sm text-muted-foreground">
                                                {new Date(spec.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                        {spec.description && (
                                            <p className="mt-2 text-sm truncate">
                                                {spec.description}
                                            </p>
                                        )}
                                    </CardDescription>
                                </CardHeader>
                            </Card>
                        ))}
                    </div>
                </div>
            ))}

            {filteredAndSortedSpecs.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                    {searchTerm ? 'No matching specifications found.' : 'No API specifications found. Click "Add New Spec" to get started.'}
                </div>
            )}
        </div>
    );
}