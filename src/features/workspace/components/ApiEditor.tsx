import {Badge} from "@/core/components/ui/badge.tsx";
import {ApiSpec} from "@/features/workspace/WorkspacePage.tsx";
import {useRef} from "react";
import {Card} from "@/core/components/ui/card.tsx";
import {Editor} from "@monaco-editor/react";


interface ApiEditorProps {
    spec: ApiSpec;
    onContentChange: (content: string) => void;
}

const ApiEditor: React.FC<ApiEditorProps> = ({ spec, onContentChange }) => {
    const editorRef = useRef<unknown>(null);

    const handleEditorDidMount = (editor: unknown, monaco: unknown) => {
        editorRef.current = editor;

        // Configure YAML and JSON schemas for OpenAPI
        const monacoInstance = monaco as { languages?: { yaml?: { yamlDefaults?: { setDiagnosticsOptions?: (options: unknown) => void } } } };
        if (monacoInstance.languages?.yaml?.yamlDefaults?.setDiagnosticsOptions) {
            monacoInstance.languages.yaml.yamlDefaults.setDiagnosticsOptions({
                validate: true,
                schemas: [{
                    uri: 'http://json.schemastore.org/swagger-2.0',
                    fileMatch: ['*'],
                    schema: {
                        type: 'object',
                        properties: {
                            openapi: { type: 'string' },
                            info: { type: 'object' },
                            paths: { type: 'object' }
                        }
                    }
                }]
            });
        }
    };

    const handleEditorChange = (value: string | undefined) => {
        if (value !== undefined) {
            onContentChange(value);
        }
    };

    return (
        <div className="h-full flex flex-col bg-background overflow-hidden">
            <div className="flex-shrink-0 p-4 bg-card border-b border-border">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <h2 className="text-lg font-semibold text-card-foreground">
                            {spec.name}
                        </h2>
                        <Badge variant="outline" className="uppercase text-xs">
                            {spec.format}
                        </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                        OpenAPI 3.0 Editor
                    </div>
                </div>
            </div>

            <div className="flex-1 p-4 overflow-hidden">
                <Card className="h-full overflow-hidden">
                    <Editor
                        height="100%"
                        language={spec.format === 'yaml' ? 'yaml' : 'json'}
                        value={spec.content}
                        onChange={handleEditorChange}
                        onMount={handleEditorDidMount}
                        theme="vs-light"
                        options={{
                            minimap: { enabled: false },
                            fontSize: 14,
                            lineNumbers: 'on',
                            folding: true,
                            wordWrap: 'on',
                            automaticLayout: true,
                            scrollBeyondLastLine: false,
                            tabSize: 2,
                            insertSpaces: true,
                            renderWhitespace: 'selection'
                        }}
                    />
                </Card>
            </div>
        </div>
    );
};

export default ApiEditor;
