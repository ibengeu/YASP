import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Progress } from "../ui/progress";
import {
  Users,
  FileText,
  Activity,
  TrendingUp,
  Clock,
  Plus,
  Eye,
  Edit,
  Settings,
} from "lucide-react";
import { motion } from "motion/react";
import { useWorkspace } from "./WorkspaceContext";
import { WorkspaceActivity } from "./WorkspaceActivity";
import { getWorkspaceApis } from "../api-catalog/demo-data";
// Simple date formatting utility
const formatDistanceToNow = (date: Date): string => {
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(
    diffInMs / (1000 * 60 * 60 * 24),
  );

  if (diffInMinutes < 1) return "just now";
  if (diffInMinutes < 60)
    return `${diffInMinutes} minute${diffInMinutes === 1 ? "" : "s"} ago`;
  if (diffInHours < 24)
    return `${diffInHours} hour${diffInHours === 1 ? "" : "s"} ago`;
  if (diffInDays < 7)
    return `${diffInDays} day${diffInDays === 1 ? "" : "s"} ago`;

  return date.toLocaleDateString();
};

interface WorkspaceDashboardProps {
  onViewSettings?: () => void;
  onInviteMembers?: () => void;
}

export function WorkspaceDashboard({
  onViewSettings,
  onInviteMembers,
}: WorkspaceDashboardProps) {
  const { currentWorkspace, workspaceMembers, permissions } =
    useWorkspace();

  if (!currentWorkspace) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-semibold">
            No Workspace Selected
          </h2>
          <p className="text-muted-foreground">
            Select a workspace to view the dashboard.
          </p>
        </div>
      </div>
    );
  }

  const workspaceApis = getWorkspaceApis(currentWorkspace.id);
  const apisByLifecycle = workspaceApis.reduce(
    (acc, api) => {
      acc[api.lifecycle] = (acc[api.lifecycle] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  const recentlyUpdatedApis = workspaceApis
    .sort(
      (a, b) =>
        new Date(b.lastUpdated).getTime() -
        new Date(a.lastUpdated).getTime(),
    )
    .slice(0, 5);

  const membersByRole = workspaceMembers.reduce(
    (acc, member) => {
      acc[member.role] = (acc[member.role] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  return (
    <div className="h-full overflow-y-auto bg-background px-(--spacing-07) pb-(--spacing-07)">
      <div className="max-w-7xl mx-auto space-y-(--spacing-07)">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div
                className="h-12 w-12 rounded-xl flex items-center justify-center text-white text-xl"
                style={{
                  backgroundColor:
                    currentWorkspace.color || "#007aff",
                }}
              >
                {currentWorkspace.icon || "📁"}
              </div>
              <div>
                <h1 className="text-3xl font-semibold tracking-tight">
                  {currentWorkspace.name}
                </h1>
                <p className="text-muted-foreground">
                  {currentWorkspace.description ||
                    "No description provided"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="capitalize">
                {currentWorkspace.visibility}
              </Badge>
              {currentWorkspace.isPersonal && (
                <Badge variant="secondary">Personal</Badge>
              )}
              <span className="text-sm text-muted-foreground">
                Created{" "}
                {formatDistanceToNow(
                  currentWorkspace.createdAt,
                )}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {permissions.canInviteMembers && (
              <Button
                variant="outline"
                onClick={onInviteMembers}
              >
                <Users className="h-4 w-4 mr-2" />
                Invite Members
              </Button>
            )}

            {permissions.canManageSettings && (
              <Button
                variant="outline"
                onClick={onViewSettings}
              >
                <Settings className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="border-border/50 card-shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Total APIs
                    </p>
                    <p className="text-2xl font-semibold">
                      {workspaceApis.length}
                    </p>
                  </div>
                  <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <FileText className="h-6 w-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <Card className="border-border/50 card-shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Team Members
                    </p>
                    <p className="text-2xl font-semibold">
                      {workspaceMembers.length}
                    </p>
                  </div>
                  <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <Card className="border-border/50 card-shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Production APIs
                    </p>
                    <p className="text-2xl font-semibold">
                      {apisByLifecycle.production || 0}
                    </p>
                  </div>
                  <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <TrendingUp className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
          >
            <Card className="border-border/50 card-shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Last Updated
                    </p>
                    <p className="text-sm font-medium">
                      {recentlyUpdatedApis.length > 0
                        ? formatDistanceToNow(
                            new Date(
                              recentlyUpdatedApis[0].lastUpdated,
                            )
                          )
                        : "No recent updates"}
                    </p>
                  </div>
                  <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center">
                    <Clock className="h-6 w-6 text-orange-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* API Lifecycle Distribution */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.4 }}
          >
            <Card className="border-border/50 card-shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  API Lifecycle
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(apisByLifecycle).map(
                  ([lifecycle, count]) => {
                    const total = workspaceApis.length;
                    const percentage =
                      total > 0 ? (count / total) * 100 : 0;
                    const color =
                      {
                        production: "bg-green-500",
                        staging: "bg-blue-500",
                        development: "bg-yellow-500",
                        deprecated: "bg-red-500",
                      }[lifecycle] || "bg-gray-500";

                    return (
                      <div
                        key={lifecycle}
                        className="space-y-2"
                      >
                        <div className="flex justify-between text-sm">
                          <span className="capitalize font-medium">
                            {lifecycle}
                          </span>
                          <span className="text-muted-foreground">
                            {count}
                          </span>
                        </div>
                        <Progress
                          value={percentage}
                          className="h-2"
                        />
                      </div>
                    );
                  },
                )}
                {workspaceApis.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No APIs in this workspace yet
                  </p>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Recent APIs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.5 }}
          >
            <Card className="border-border/50 card-shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Recently Updated
                </CardTitle>
              </CardHeader>
              <CardContent>
                {recentlyUpdatedApis.length > 0 ? (
                  <div className="space-y-3">
                    {recentlyUpdatedApis.map((api) => (
                      <div
                        key={api.id}
                        className="flex items-start gap-3 p-3 rounded-lg hover:bg-secondary/30 transition-colors"
                      >
                        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <FileText className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">
                            {api.title}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            v{api.version} •{" "}
                            {formatDistanceToNow(
                              new Date(api.lastUpdated)
                            )}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No APIs in this workspace yet
                  </p>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Workspace Activity */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.6 }}
          >
            <WorkspaceActivity limit={5} />
          </motion.div>
        </div>

        {/* Team Overview */}
        {workspaceMembers.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.7 }}
          >
            <Card className="border-border/50 card-shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Team Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.entries(membersByRole).map(
                    ([role, count]) => (
                      <div
                        key={role}
                        className="text-center p-4 rounded-lg bg-secondary/30"
                      >
                        <p className="text-2xl font-semibold">
                          {count}
                        </p>
                        <p className="text-sm text-muted-foreground capitalize">
                          {role}s
                        </p>
                      </div>
                    ),
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}