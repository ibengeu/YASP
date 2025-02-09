import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { OpenApiDocument } from '@/types/swagger'
import { SwaggerUI } from '@/components/swagger/swagger-ui'
import { Button } from '@/components/ui/button'
import { IndexedDBService } from '@/services/indexdbservice'

export function SpecPage() {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const [spec, setSpec] = useState<OpenApiDocument | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const dbService = new IndexedDBService()

    useEffect(() => {
        const loadSpec = async () => {
            if (!id) return

            try {
                const loadedSpec = await dbService.getSpecById(Number(id))
                if (!loadedSpec) {
                    throw new Error('Specification not found')
                }
                setSpec(loadedSpec.spec)
            } catch (error) {
                console.error('Error loading spec:', error)
                setError('Failed to load specification')
            } finally {
                setIsLoading(false)
            }
        }

        loadSpec()
    }, [id])

    const handleBackToDirectory = () => {
        navigate('/')
    }

    if (error) {
        return (
            <div className="container mx-auto py-6">
                <div className="text-center text-red-500">{error}</div>
                <Button
                    onClick={handleBackToDirectory}
                    className="mt-4"
                >
                    Back to Directory
                </Button>
            </div>
        )
    }

    return (
        <div className="flex min-h-screen flex-col">
            <header className="sticky top-0 border-b bg-background z-10">
                <div className="container mx-auto flex h-14 items-center justify-between px-4">
                    <h1 className="text-xl font-semibold tracking-tight">
                        {spec?.info?.title || 'API Documentation'}
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
                {isLoading ? (
                    <div className="flex items-center justify-center h-[50vh]">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"/>
                    </div>
                ) : (
                    spec && <SwaggerUI spec={spec}/>
                )}
            </main>
        </div>
    )
}