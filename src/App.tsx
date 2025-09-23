import React, { useState } from "react";
import { ApiExplorer } from "./components/api-explorer/ApiExplorer";
import { OpenAPICatalog } from "./components/openapi-catalog/OpenAPICatalog";
import { AuthScreen } from "./components/auth/AuthScreen";
import { LandingPage } from "./components/landing/LandingPage";
import { WorkspaceProvider } from "./components/workspace/WorkspaceContext";
import { WorkspaceDashboard } from "./components/workspace/WorkspaceDashboard";

import { CreateWorkspaceDialog } from "./components/workspace/CreateWorkspaceDialog";
import { AppLayout, PageContainer, Section } from "./components/layout/AppLayout";
import { AppView } from "./components/layout/AppHeader";
import { InviteManagement } from "./components/invite/InviteManagement";
import { ApiMetadata } from "./components/api-catalog/types";
import { User } from "./components/auth/types";
import { demoApiSpec } from "./components/api-explorer/demo-data";
import { Toaster } from "./components/ui/sonner";
import { CarbonMigrationDemo } from "./components/carbon/CarbonMigrationDemo";
import { CarbonProvider } from "./components/carbon/CarbonProvider";



export default function App() {
  const [currentView, setCurrentView] =
    useState<AppView>("landing");
  const [currentUser, setCurrentUser] = useState<User | null>(
    null,
  );
  const [selectedApi, setSelectedApi] =
    useState<ApiMetadata | null>(null);
  const [createWorkspaceDialogOpen, setCreateWorkspaceDialogOpen] =
    useState(false);

  const handleAuthSuccess = (user: User) => {
    setCurrentUser(user);
    setCurrentView("openapi-catalog"); // Main catalog view
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentView("auth");
    setSelectedApi(null);
  };

  const handleViewProfile = () => {
    setCurrentView("profile");
  };

  const handleViewDocumentation = (api: ApiMetadata) => {
    setSelectedApi(api);
    setCurrentView("explorer");
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
      endpoint: spec.servers?.[0]?.url || 'https://api.example.com',
      documentation: '/docs',
      openapi: spec.originalContent || '{}',
      status: spec.status === 'published' ? 'active' : 'draft',
      lastUpdated: spec.updatedAt || new Date(),
      rating: 4.5,
      downloads: spec.downloadCount || 0
    };
    setSelectedApi(apiMetadata);
    setCurrentView("explorer");
  };

  const handleBackToCatalog = () => {
    setCurrentView("openapi-catalog");
    setSelectedApi(null);
  };

  const handleBackFromProfile = () => {
    setCurrentView("openapi-catalog");
  };

  const handleGoToDashboard = () => {
    setCurrentView("workspace-dashboard");
  };

  const handleGetStarted = () => {
    setCurrentView("auth");
  };

  const handleSignIn = () => {
    setCurrentView("auth");
  };

  const handleRequestDemo = () => {
    // In a real app, this would open a demo modal or schedule a demo
    console.log("Demo requested");
    setCurrentView("carbon-demo");
  };

  const handleNavigate = (view: AppView) => {
    setCurrentView(view);
  };

  return (
    <CarbonProvider>
      {/* Landing Page */}
      {currentView === "landing" && (
        <LandingPage
          onGetStarted={handleGetStarted}
          onSignIn={handleSignIn}
          onRequestDemo={handleRequestDemo}
        />
      )}

      {/* Authentication */}
      {currentView === "auth" && (
        <AuthScreen onAuthSuccess={handleAuthSuccess} />
      )}

      {/* Carbon Design System Demo */}
      {currentView === "carbon-demo" && (
        <AppLayout
          currentUser={currentUser}
          currentView={currentView}
          onNavigate={handleNavigate}
          onLogout={handleLogout}
          onCreateWorkspace={() => setCreateWorkspaceDialogOpen(true)}
        >
          <WorkspaceProvider currentUser={currentUser}>
            <PageContainer>
              <Section>
                <CarbonMigrationDemo />
              </Section>
            </PageContainer>
          </WorkspaceProvider>
        </AppLayout>
      )}

      {/* Profile */}
      {currentView === "profile" && currentUser && (
        <AppLayout
          currentUser={currentUser}
          currentView={currentView}
          onNavigate={handleNavigate}
          onLogout={handleLogout}
          onCreateWorkspace={() => setCreateWorkspaceDialogOpen(true)}
        >
          <WorkspaceProvider currentUser={currentUser}>
            <PageContainer>
              <Section>
                <AuthScreen
                  onAuthSuccess={handleBackFromProfile}
                  initialView="profile"
                  user={currentUser}
                />
              </Section>
            </PageContainer>
          </WorkspaceProvider>
        </AppLayout>
      )}

      {/* Authenticated Workspace Views */}
      {(currentView === "openapi-catalog" ||
        currentView === "explorer" ||
        currentView === "workspace-dashboard" ||
        currentView === "invite-management") &&
        currentUser && (
          <WorkspaceProvider currentUser={currentUser}>
            <AppLayout
              currentUser={currentUser}
              currentView={currentView}
              onNavigate={handleNavigate}
              onLogout={handleLogout}
              onCreateWorkspace={() => setCreateWorkspaceDialogOpen(true)}
            >
              {/* Workspace Dashboard */}
              {currentView === "workspace-dashboard" && (
                <PageContainer>
                  <Section>
                    <WorkspaceDashboard
                      onViewSettings={() => {/* TODO: Open settings */}}
                      onInviteMembers={() => {/* TODO: Open invite */}}
                    />
                  </Section>
                </PageContainer>
              )}

              {/* API Catalog */}
              {currentView === "openapi-catalog" && (
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
              )}

              {/* API Explorer */}
              {currentView === "explorer" && (
                <PageContainer fullWidth={true} padding="none">
                  <ApiExplorer
                    apiSpec={demoApiSpec}
                    onBackToCatalog={handleBackToCatalog}
                  />
                </PageContainer>
              )}

              {/* Invite Management */}
              {currentView === "invite-management" && (
                <PageContainer>
                  <Section>
                    <InviteManagement />
                  </Section>
                </PageContainer>
              )}
            </AppLayout>

            {/* Dialogs */}
            <CreateWorkspaceDialog
              open={createWorkspaceDialogOpen}
              onOpenChange={setCreateWorkspaceDialogOpen}
            />
          </WorkspaceProvider>
        )}

      <Toaster />
    </CarbonProvider>
  );
}