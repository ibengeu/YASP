import {useNavigate} from 'react-router-dom'
import {Card, CardDescription, CardHeader, CardTitle} from '@/components/ui/card'
import {Button} from '@/components/ui/button'
import {Download, Search, Trash2} from 'lucide-react'
import {IndexedDBService} from "@/services/indexdbservice"
import {Input} from "@/components/ui/input"
import {downloadSpec} from "@/lib/utils"
import {useEffect, useState} from 'react'
import {SwaggerInput} from "@/components/swagger/swagger-input.tsx";
import {OpenApiDocument} from "@/types/swagger.ts";

interface Spec {
    id: string | number
    title: string
    version: string
    description?: string
    createdAt: string | number | Date
}

export function DirectoryPage() {
    const navigate = useNavigate()
    const [specs, setSpecs] = useState<Spec[]>([])
    const [searchTerm, setSearchTerm] = useState('')
    const [showInput, setShowInput] = useState(false)
    const dbService = new IndexedDBService()

    useEffect(() => {
        loadSpecs()
    }, [])

    const loadSpecs = async () => {
        const allSpecs = await dbService.getAllSpecs()
        setSpecs(allSpecs as unknown as Spec[])
    }

    const handleSpecLoaded = async (loadedSpec: OpenApiDocument) => {
        try {
            const id = await dbService.saveSpec(loadedSpec)
            navigate(`/spec/${id}`)
        } catch (error) {
            console.error('Error saving spec:', error)
        }
    }

    const handleRemoveSpec = async (event: React.MouseEvent, specId: string | number) => {
        event.stopPropagation()
        if (window.confirm('Are you sure you want to remove this specification?')) {
            await dbService.deleteSpec(specId)
            await loadSpecs()
        }
    }

    const filteredAndSortedSpecs = specs
        .filter(spec =>
            spec.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (spec.description?.toLowerCase() || '').includes(searchTerm.toLowerCase())
        )
        .sort((a, b) => a.title.localeCompare(b.title))

    const groupedSpecs: Record<string, Spec[]> = filteredAndSortedSpecs.reduce((acc, spec) => {
        const firstLetter = spec.title[0].toUpperCase()
        if (!acc[firstLetter]) acc[firstLetter] = []
        acc[firstLetter].push(spec)
        return acc
    }, {} as Record<string, Spec[]>)

    if (showInput) {
        return (
            <div className="container mx-auto flex-1 px-4">
                <div className="py-4">
                    <Button
                        variant="outline"
                        onClick={() => setShowInput(false)}
                        className="mb-4"
                    >
                        Back to Directory
                    </Button>
                </div>
                <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center">
                    <SwaggerInput onSpecLoaded={handleSpecLoaded}/>
                </div>
            </div>
        )
    }

    return (
        <div className="container mx-auto py-6">


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
                                onClick={() => navigate(`/spec/${spec.id}`)}
                            >
                                <CardHeader>
                                    <div className="flex justify-between items-start gap-2">
                                        <CardTitle className="flex-1 truncate">
                                            {spec.title}
                                        </CardTitle>
                                        <div className="flex items-center gap-1 shrink-0">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="opacity-0 group-hover:opacity-100 transition-opacity"
                                                onClick={(e) => handleRemoveSpec(e, spec.id)}
                                                aria-label="Remove specification"
                                            >
                                                <Trash2 className="h-4 w-4 text-destructive"/>
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="opacity-0 group-hover:opacity-100 transition-opacity"
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    downloadSpec(spec, `${spec.title}-${spec.version}.json`)
                                                }}
                                                aria-label="Download specification"
                                            >
                                                <Download className="h-4 w-4"/>
                                            </Button>
                                        </div>
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
    )
}