import React, {useState} from "react";
import {Route, Routes} from "react-router-dom";
import {useAuth} from "@/core/context/auth-context";
import {ApiExplorer} from "./components/api-explorer/ApiExplorer";
import {OpenAPICatalog} from "./components/openapi-catalog/OpenAPICatalog";
import {AuthScreen} from "./features/auth/components/AuthScreen";
import {LandingPage} from "./components/landing/LandingPage";
import {WorkspaceProvider} from "./components/workspace/WorkspaceContext";
import {CreateWorkspaceDialog} from "./components/workspace/CreateWorkspaceDialog";
import {AppLayout, PageContainer, Section} from "./components/layout/AppLayout";
import {ApiMetadata} from "./components/api-catalog/types";
import {demoApiSpec} from "./components/api-explorer/demo-data";
import {Toaster} from "./components/ui/sonner";
import {CarbonMigrationDemo} from "./components/carbon/CarbonMigrationDemo";
import {CarbonProvider} from "./components/carbon/CarbonProvider";
import {LoginPage} from "./pages/LoginPage";
import {SignUpPage} from "./pages/SignUpPage";
import {InviteManagementPage} from "./pages/InviteManagementPage";
import {useNavigate} from "react-router";


export default function App() {
    const {user: currentUser, logout} = useAuth();
    const navigate = useNavigate();
    const [, setSelectedApi] = useState<ApiMetadata | null>(null);
    const [createWorkspaceDialogOpen, setCreateWorkspaceDialogOpen] = useState(false);
    const handleLogout = () => {
        logout();
        setSelectedApi(null);
        // Navigation will be handled by React Router
    };
    const handleViewOpenAPISpec = (spec: any) => {
        // Convert OpenAPI spec to ApiMetadata format for the explorer
        const apiMetadata: ApiMetadata = {
            id: spec.id,
            title: spec.title || spec.displayName,
            description: spec.description,
            version: spec.version,
            author: spec.owner?.name || 'Unknown',
            category: spec.category || 'Other',
            tags: spec.tags?.map((tag: any) => tag.name || tag) || [],
            endpoints: Object.keys(spec.paths || {}).length,
            lifecycle: spec.status === 'published' ? 'production' : 'development',
            lastUpdated: spec.updatedAt || new Date().toISOString(),
            isPublic: true,
            workspaceId: 'default'
        };
        setSelectedApi(apiMetadata);
        navigate('/explorer');
        // Navigation will be handled by React Router
    };

    const handleBackToCatalog = () => {
        setSelectedApi(null);
        navigate('/catalog');
    };

    return (
        <CarbonProvider>
            <Routes>
                {/* Landing Page */}
                <Route path="/" element={<LandingPage/>}/>

                {/* Authentication Routes */}
                <Route path="/login" element={<LoginPage/>}/>
                <Route path="/sign-up" element={<SignUpPage/>}/>


                {/* Carbon Design System Demo */}
                <Route
                    path="/carbon-demo"
                    element={
                        <AppLayout
                            currentUser={currentUser}
                            currentView="carbon-demo"
                            onNavigate={() => {
                            }}
                            onLogout={handleLogout}
                            onCreateWorkspace={() => setCreateWorkspaceDialogOpen(true)}
                        >
                            <WorkspaceProvider currentUser={currentUser}>
                                <PageContainer>
                                    <Section>
                                        <CarbonMigrationDemo/>
                                    </Section>
                                </PageContainer>
                                <CreateWorkspaceDialog
                                    open={createWorkspaceDialogOpen}
                                    onOpenChange={setCreateWorkspaceDialogOpen}
                                />
                            </WorkspaceProvider>
                        </AppLayout>
                    }
                />

                {/* Profile Route */}
                <Route
                    path="/profile"
                    element={
                        currentUser ? (
                            <AppLayout
                                currentUser={currentUser}
                                currentView="profile"
                                onNavigate={() => {
                                }}
                                onLogout={handleLogout}
                                onCreateWorkspace={() => setCreateWorkspaceDialogOpen(true)}
                            >
                                <WorkspaceProvider currentUser={currentUser}>
                                    <PageContainer>
                                        <Section>
                                            <AuthScreen initialView="profile"/>
                                        </Section>
                                    </PageContainer>
                                    <CreateWorkspaceDialog
                                        open={createWorkspaceDialogOpen}
                                        onOpenChange={setCreateWorkspaceDialogOpen}
                                    />
                                </WorkspaceProvider>
                            </AppLayout>
                        ) : (
                            <LoginPage/>
                        )
                    }
                />

                {/* API Catalog Route */}
                <Route
                    path="/catalog"
                    element={
                        currentUser ? (
                            <WorkspaceProvider currentUser={currentUser}>
                                <AppLayout
                                    currentUser={currentUser}
                                    currentView="openapi-catalog"
                                    onNavigate={() => {
                                    }}
                                    onLogout={handleLogout}
                                    onCreateWorkspace={() => setCreateWorkspaceDialogOpen(true)}
                                >
                                    <PageContainer>
                                        <Section>
                                            <OpenAPICatalog
                                                onSpecSelect={handleViewOpenAPISpec}
                                                onSpecUpload={(spec) => {
                                                    console.log("Uploaded OpenAPI spec:", spec);
                                                }}
                                            />
                                        </Section>
                                    </PageContainer>
                                </AppLayout>
                                <CreateWorkspaceDialog
                                    open={createWorkspaceDialogOpen}
                                    onOpenChange={setCreateWorkspaceDialogOpen}
                                />
                            </WorkspaceProvider>
                        ) : (
                            <LoginPage/>
                        )
                    }
                />

                {/* API Explorer Route */}
                <Route
                    path="/explorer"
                    element={
                        currentUser ? (
                            <WorkspaceProvider currentUser={currentUser}>
                                <AppLayout
                                    currentUser={currentUser}
                                    currentView="explorer"
                                    onNavigate={() => {
                                    }}
                                    onLogout={handleLogout}
                                    onCreateWorkspace={() => setCreateWorkspaceDialogOpen(true)}
                                >
                                    <div className="h-[calc(100vh-4rem)]">
                                        <ApiExplorer
                                            apiSpec={demoApiSpec}
                                            onBackToCatalog={handleBackToCatalog}
                                        />
                                    </div>
                                </AppLayout>
                                <CreateWorkspaceDialog
                                    open={createWorkspaceDialogOpen}
                                    onOpenChange={setCreateWorkspaceDialogOpen}
                                />
                            </WorkspaceProvider>
                        ) : (
                            <LoginPage/>
                        )
                    }
                />

                {/* Invite Management Page Route */}
                <Route path="/invites" element={<InviteManagementPage/>}/>
            </Routes>

            <Toaster/>
        </CarbonProvider>
    );
}