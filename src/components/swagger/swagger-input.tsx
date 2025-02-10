import {useCallback, useState} from "react";
import {OpenApiDocument} from "@/types/swagger";
import {Upload} from "lucide-react";
import {Button} from "@/components/ui/button";
import {Textarea} from "@/components/ui/textarea";

interface SwaggerInputProps {
    onSpecLoaded: (spec: OpenApiDocument) => void;
}

export function SwaggerInput({onSpecLoaded}: SwaggerInputProps) {
    const [error, setError] = useState<string | null>(null);
    const [pastedContent, setPastedContent] = useState<string>("");

    const extractOpenApiSpec = (content: any): OpenApiDocument | null => {
        if (content.spec && typeof content.spec === 'object') {
            return content.spec;
        }

        if (content.openapi || content.swagger) {
            return content;
        }

        return null;
    };

    const validateAndLoadSpec = useCallback((content: any) => {
        setError(null);

        try {
            const spec = extractOpenApiSpec(content);

            if (!spec) {
                setError("Could not find valid OpenAPI specification in the provided content");
                return false;
            }

            const version = spec.openapi || spec.swagger;
            if (!version) {
                setError("Missing OpenAPI/Swagger version identifier");
                return false;
            }

            if (!version.startsWith("3.")) {
                setError(`Unsupported OpenAPI version: ${version}. Only version 3.x is supported.`);
                return false;
            }

            if (!spec.info) {
                setError("Missing 'info' section in specification");
                return false;
            }

            if (!spec.paths) {
                setError("Missing 'paths' section in specification");
                return false;
            }

            onSpecLoaded(spec);
            return true;
        } catch (err) {
            setError("Invalid specification format");
            return false;
        }
    }, [onSpecLoaded]);

    const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (!file.type.includes('json') && !file.name.endsWith('.json')) {
            setError("Please upload a JSON file");
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const content = JSON.parse(e.target?.result as string);
                validateAndLoadSpec(content);
            } catch (err) {
                setError("Invalid JSON file format");
            }
        };
        reader.onerror = () => {
            setError("Error reading file");
        };
        reader.readAsText(file);
    }, [validateAndLoadSpec]);

    const handlePasteChange = useCallback((event: React.ChangeEvent<HTMLTextAreaElement>) => {
        const content = event.target.value;
        setPastedContent(content);

        if (!content.trim()) {
            setError(null);
            return;
        }

        try {
            const parsedContent = JSON.parse(content);
            validateAndLoadSpec(parsedContent);
        } catch (err) {
            setError("Invalid JSON format. Please check your input.");
        }
    }, [validateAndLoadSpec]);

    return (
        <div className="space-y-8">
            <div className="space-y-2">
                <h2 className="text-xl font-semibold">Load OpenAPI Specification</h2>
                <p className="text-sm text-muted-foreground">
                    Upload a JSON file or paste your OpenAPI 3.x specification below
                </p>
            </div>

            <div className="flex justify-center border-2 border-dashed rounded-lg p-12">
                <div className="text-center space-y-4">
                    <Upload
                        className="mx-auto h-12 w-12 text-muted-foreground"
                        aria-hidden="true"
                    />
                    <Button variant="secondary">
                        Select OpenAPI file
                        <input
                            type="file"
                            className="sr-only"
                            accept="application/json,.json"
                            onChange={handleFileUpload}
                            aria-label="Upload OpenAPI specification file"
                        />
                    </Button>
                </div>
            </div>

            <div className="space-y-4">
                <label className="text-sm font-medium">
                    Or paste your OpenAPI specification:
                </label>
                <Textarea
                    placeholder="Paste your OpenAPI/Swagger JSON here..."
                    className="font-mono min-h-[200px]"
                    value={pastedContent}
                    onChange={handlePasteChange}
                    aria-label="OpenAPI specification input"
                />
            </div>

            {error && (
                <div className="text-sm text-destructive font-medium" role="alert">
                    {error}
                </div>
            )}
        </div>
    );
}