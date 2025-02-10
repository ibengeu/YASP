// layout.tsx
import {Button} from '@/components/ui/button'
import {ThemeToggle} from '@/components/theme-toggle'
import {Plus} from 'lucide-react'
import {Outlet, useLocation, useNavigate} from 'react-router-dom'

export const RootLayout = () => {
    const navigate = useNavigate()
    const location = useLocation()
    const isRoot = location.pathname === '/'

    return (
        <div className="flex min-h-screen flex-col">
            <header className="sticky top-0 border-b bg-background z-10">
                <div className="container mx-auto flex h-14 items-center justify-between px-4">
                    <Button
                        variant="ghost"
                        onClick={() => navigate('/')}
                        className="text-xl font-semibold tracking-tight hover:bg-transparent"
                    >
                        API Documentation
                    </Button>

                    <div className="flex items-center gap-2">
                        {isRoot ? (
                            <Button
                                onClick={() => navigate('/new')}
                                className="gap-2"
                                aria-label="Add new API specification"
                            >
                                <Plus className="h-4 w-4"/>
                                Add New Spec
                            </Button>
                        ) : (
                            <Button
                                onClick={() => navigate('/')}
                                variant="outline"
                                aria-label="Return to directory"
                            >
                                Back to Directory
                            </Button>
                        )}
                        <ThemeToggle/>
                    </div>
                </div>
            </header>
            <main className="flex-1">
                <Outlet/>
            </main>
        </div>
    )
}