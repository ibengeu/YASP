import { Badge } from "@/components/ui/badge"
import { InfoObject } from "@/types/swagger"

interface ApiInfoProps {
    info: InfoObject
}

export default function ApiInfo({ info }: ApiInfoProps) {
    return (
        <div>
            <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold">{info.title}</h1>
                <Badge variant="secondary">v{info.version}</Badge>
            </div>
            {info.description && (
                <p className="mt-2 text-sm text-muted-foreground">{info.description}</p>
            )}
        </div>
    )
}