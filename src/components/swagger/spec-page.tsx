// src/components/swagger/spec-page.tsx
import {useEffect, useState} from 'react'
import {useNavigate, useParams} from 'react-router-dom'
import {OpenApiDocument} from '@/types/swagger'
import {SwaggerUI} from '@/components/swagger/swagger-ui'
import {Button} from '@/components/ui/button'
import {IndexedDBService} from '@/services/indexdbservice'

export function SpecPage() {
    const {id} = useParams<{ id: string }>()
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

    if (error) {
        return (
            <div className="container mx-auto py-6">
                <div className="text-center text-red-500">{error}</div>
                <Button
                    onClick={() => navigate('/')}
                    className="mt-4"
                >
                    Back to Directory
                </Button>
            </div>
        )
    }

    return (
        <>
            {isLoading ? (
                <div className="flex items-center justify-center h-[50vh]">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"/>
                </div>
            ) : (
                spec && <SwaggerUI spec={spec}/>
            )}
        </>
    )
}