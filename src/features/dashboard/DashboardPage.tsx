import React, { useCallback, useEffect, useState } from "react";
import { IndexedDBService } from "@/core/services/indexdbservice";
import { Card, CardContent, CardHeader, CardTitle } from "@/core/components/ui/card";
import { Button } from "@/core/components/ui/button";
import { Input } from "@/core/components/ui/input";
import { toast } from "sonner";
import { v4 as uuidv4 } from 'uuid';

interface StoredSpec {
    id?: number;
    title: string;
    version: string;
    description?: string;
    createdAt: string;
    key?: string; // Add key to StoredSpec interface
}

export default function DashboardPage() {
    const [specs, setSpecs] = useState<StoredSpec[]>([]);
    const [loading, setLoading] = useState(true);
    const [newKey, setNewKey] = useState<string>('');
    const dbService = React.useMemo(() => new IndexedDBService(), []);

    const loadSpecs = useCallback(async () => {
        setLoading(true);
        try {
            const allSpecs = await dbService.getAllSpecs();
            setSpecs(allSpecs);
        } catch (error) {
            console.error("Error loading specs:", error);
            toast.error("Failed to load collections.");
        } finally {
            setLoading(false);
        }
    }, [dbService]);

    useEffect(() => {
        loadSpecs();
    }, [loadSpecs]);

    const generateKey = () => {
        const generated = uuidv4();
        setNewKey(generated);
        toast.success("New key generated!");
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text).then(() => {
            toast.success("Key copied to clipboard!");
        });
    };

    return (
        <div className="container mx-auto py-8">
            <h1 className="text-3xl font-bold mb-6">Dashboard</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Your Collections</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <p>Loading collections...</p>
                        ) : specs.length === 0 ? (
                            <p>No collections found. Upload one from the Directory page!</p>
                        ) : (
                            <div className="space-y-4">
                                {specs.map((spec) => (
                                    <div key={spec.id} className="border p-3 rounded-md">
                                        <h3 className="font-semibold">{spec.title} (v{spec.version})</h3>
                                        <p className="text-sm text-muted-foreground">Created: {new Date(spec.createdAt).toLocaleDateString()}</p>
                                        {spec.key && <p className="text-sm text-muted-foreground">Key: {spec.key}</p>}
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Generate Upload Key</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground mb-4">Generate a unique key to associate with your uploaded collections.</p>
                        <div className="flex space-x-2">
                            <Input type="text" value={newKey} readOnly placeholder="Click 'Generate' to get a new key" />
                            <Button onClick={generateKey}>Generate</Button>
                        </div>
                        {newKey && (
                            <Button variant="outline" className="mt-2 w-full" onClick={() => copyToClipboard(newKey)}>
                                Copy Key
                            </Button>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
