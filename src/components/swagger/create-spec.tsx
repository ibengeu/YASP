// create-spec.tsx
import {SwaggerInput} from "@/components/swagger/swagger-input.tsx";
import {Card} from "@/components/ui/card.tsx";
import {useNavigate} from "react-router-dom";
import {useRef, useState} from "react";
import {IndexedDBService} from "@/services/indexdbservice.ts";
import {OpenApiDocument} from "@/types/swagger.ts";

export const CreateSpecPage = () => {
    const navigate = useNavigate()
    const [error, setError] = useState<string | null>(null)
    const dbServiceRef = useRef(new IndexedDBService())

    const handleSpecLoaded = async (spec: OpenApiDocument) => {
        try {
            const id = await dbServiceRef.current.saveSpec(spec)
            navigate(`/spec/${id}`)
        } catch (err) {
            console.error('Error saving specification:', err)
            setError(err instanceof Error ? err.message : 'Failed to save specification')
        }
    }

    return (
        <div className="container mx-auto flex-1 px-4 py-6">
            <Card className="max-w-4xl mx-auto">
                <div className="p-6">

                    {error && (
                        <div
                            className="mb-6 p-4 bg-destructive/10 text-destructive rounded-md border border-destructive/20"
                            role="alert"
                            aria-live="polite"
                        >
                            {error}
                        </div>
                    )}

                    <SwaggerInput onSpecLoaded={handleSpecLoaded}/>
                </div>
            </Card>
        </div>
    )
}