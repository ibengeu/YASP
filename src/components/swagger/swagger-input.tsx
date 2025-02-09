// swagger-input.tsx
import { useState } from "react";
import { OpenApiDocument } from "@/types/swagger";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

interface SwaggerInputProps {
    onSpecLoaded: (spec: OpenApiDocument) => void;
}

export function SwaggerInput({ onSpecLoaded }: SwaggerInputProps) {
    const [error, setError] = useState<string | null>(null);

    const validateAndLoadSpec = (spec: any) => {
        if (!spec.openapi || !spec.info || !spec.paths) {
            setError("Invalid OpenAPI specification");
            return;
        }
        setError(null);
        onSpecLoaded(spec);  // Call the callback with the validated spec
    };

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const content = e.target?.result as string;
                const spec = JSON.parse(content);
                validateAndLoadSpec(spec);
            } catch (err) {
                setError("Invalid JSON file");
            }
        };
        reader.readAsText(file);
    };

    const handlePaste = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
        try {
            const spec = JSON.parse(event.target.value);
            validateAndLoadSpec(spec);
        } catch (err) {
            setError("Invalid JSON content");
        }
    };

    return (
        <Card className="p-6 w-full max-w-2xl">
            <div className="space-y-4">
                <div>
                    <h2 className="text-lg font-semibold mb-2">Load OpenAPI Specification</h2>
                    <p className="text-sm text-muted-foreground">
                        Upload a JSON file or paste your OpenAPI specification below
                    </p>
                </div>

                <div className="flex justify-center border-2 border-dashed rounded-lg p-6">
                    <div className="text-center">
                        <Upload className="mx-auto h-12 w-12 text-muted-foreground"/>
                        <div className="mt-4 flex text-sm justify-center">
                            <label htmlFor="file-upload" className="relative cursor-pointer">
                                <Button variant="secondary">
                                    Select OpenAPI file
                                    <input
                                        id="file-upload"
                                        name="file-upload"
                                        type="file"
                                        className="sr-only"
                                        accept=".json"
                                        onChange={handleFileUpload}
                                    />
                                </Button>
                            </label>
                        </div>
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium">
                        Or paste your OpenAPI specification:
                    </label>
                    <Textarea
                        placeholder="Paste your OpenAPI/Swagger JSON here..."
                        className="font-mono"
                        rows={10}
                        onChange={handlePaste}
                    />
                </div>

                {error && (
                    <div className="text-sm text-destructive font-medium">
                        {error}
                    </div>
                )}
            </div>
        </Card>
    );
}