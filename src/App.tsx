// src/App.tsx
import {useState} from "react"
import {OpenApiDocument} from "./types/swagger"
import {SwaggerInput} from "@/components/swagger/swagger-input"
import {SwaggerUI} from "@/components/swagger/swagger-ui"
import {Button} from "@/components/ui/button"
import {IndexedDBService} from "@/services/indexdbservice.ts";
import {DirectoryPage} from "@/components/Directory.tsx";

type View = 'directory' | 'input' | 'viewer';

function App() {
    const [currentView, setCurrentView] = useState<View>('directory');
    const [currentSpec, setCurrentSpec] = useState<OpenApiDocument | null>(null);
    const dbService = new IndexedDBService();

    const handleSpecLoaded = async (loadedSpec: OpenApiDocument) => {
        try {
            await dbService.saveSpec(loadedSpec);
            setCurrentSpec(loadedSpec);
            setCurrentView('viewer');
        } catch (error) {
            console.error('Error saving spec:', error);
        }
    };

    const handleSpecSelect = (spec: any) => {
        setCurrentSpec(spec.spec);
        setCurrentView('viewer');
    };

    const handleAddNew = () => {
        setCurrentView('input');
    };

    const handleBackToDirectory = () => {
        setCurrentSpec(null);
        setCurrentView('directory');
    };

    if (currentView === 'directory') {
        return (
            <DirectoryPage
                onSpecSelect={handleSpecSelect}
                onAddNew={handleAddNew}
            />
        );
    }

    if (currentView === 'input') {
        return (
            <div className="container mx-auto flex-1 px-4">
                <div className="py-4">
                    <Button
                        variant="outline"
                        onClick={handleBackToDirectory}
                        className="mb-4"
                    >
                        Back to Directory
                    </Button>
                </div>
                <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center">
                    <SwaggerInput onSpecLoaded={handleSpecLoaded}/>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen flex-col">
            <header className="sticky top-0 border-b bg-background z-10">
                <div className="container mx-auto flex h-14 items-center justify-between px-4">
                    <h1 className="text-xl font-semibold tracking-tight">
                        {currentSpec?.info?.title || 'API Documentation'}
                    </h1>
                    <Button
                        variant="outline"
                        onClick={handleBackToDirectory}
                        className="h-9"
                    >
                        Back to Directory
                    </Button>
                </div>
            </header>
            <main className="flex-1">
                {currentSpec && <SwaggerUI spec={currentSpec}/>}
            </main>
        </div>
    );
}

export default App;