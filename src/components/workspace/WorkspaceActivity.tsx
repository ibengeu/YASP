import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { 
  Activity, 
  Plus, 
  Edit, 
  Trash, 
  Users, 
  FileText, 
  Settings,
  MessageCircle,
  GitBranch
} from 'lucide-react';
import { motion } from 'motion/react';
import { WorkspaceActivity as ActivityType, WorkspaceAction } from './types';
import { getWorkspaceActivity } from './demo-data';
import { useWorkspace } from './WorkspaceContext';
// Simple date formatting utility
const formatDistanceToNow = (date: Date): string => {
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInMinutes < 1) return 'just now';
  if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes === 1 ? '' : 's'} ago`;
  if (diffInHours < 24) return `${diffInHours} hour${diffInHours === 1 ? '' : 's'} ago`;
  if (diffInDays < 7) return `${diffInDays} day${diffInDays === 1 ? '' : 's'} ago`;
  
  return date.toLocaleDateString();
};

interface WorkspaceActivityProps {
  limit?: number;
  showHeader?: boolean;
}

const getActionIcon = (action: WorkspaceAction) => {
  switch (action) {
    case 'created_workspace':
    case 'added_api':
    case 'created_collection':
    case 'created_environment':
      return Plus;
    case 'updated_workspace':
    case 'updated_api':
    case 'updated_collection':
    case 'updated_environment':
      return Edit;
    case 'deleted_workspace':
    case 'deleted_api':
    case 'deleted_collection':
    case 'deleted_environment':
      return Trash;
    case 'added_member':
    case 'removed_member':
    case 'updated_member_role':
      return Users;
    case 'added_comment':
      return MessageCircle;
    default:
      return Activity;
  }
};

const getActionColor = (action: WorkspaceAction) => {
  switch (action) {
    case 'created_workspace':
    case 'added_api':
    case 'created_collection':
    case 'created_environment':
    case 'added_member':
      return 'text-green-600 bg-green-50 border-green-200';
    case 'updated_workspace':
    case 'updated_api':
    case 'updated_collection':
    case 'updated_environment':
    case 'updated_member_role':
      return 'text-blue-600 bg-blue-50 border-blue-200';
    case 'deleted_workspace':
    case 'deleted_api':
    case 'deleted_collection':
    case 'deleted_environment':
    case 'removed_member':
      return 'text-red-600 bg-red-50 border-red-200';
    case 'added_comment':
      return 'text-purple-600 bg-purple-50 border-purple-200';
    default:
      return 'text-gray-600 bg-gray-50 border-gray-200';
  }
};

const formatAction = (activity: ActivityType): string => {
  const { action, resourceType, resourceName, details } = activity;
  
  if (details) {
    return details;
  }
  
  switch (action) {
    case 'created_workspace':
      return 'Created workspace';
    case 'updated_workspace':
      return 'Updated workspace settings';
    case 'deleted_workspace':
      return 'Deleted workspace';
    case 'added_member':
      return `Invited ${resourceName} to workspace`;
    case 'removed_member':
      return `Removed ${resourceName} from workspace`;
    case 'updated_member_role':
      return `Updated ${resourceName}'s role`;
    case 'added_api':
      return `Added API "${resourceName}"`;
    case 'updated_api':
      return `Updated API "${resourceName}"`;
    case 'deleted_api':
      return `Deleted API "${resourceName}"`;
    case 'created_collection':
      return `Created collection "${resourceName}"`;
    case 'updated_collection':
      return `Updated collection "${resourceName}"`;
    case 'deleted_collection':
      return `Deleted collection "${resourceName}"`;
    case 'added_comment':
      return `Commented on ${resourceType} "${resourceName}"`;
    case 'created_environment':
      return `Created environment "${resourceName}"`;
    case 'updated_environment':
      return `Updated environment "${resourceName}"`;
    case 'deleted_environment':
      return `Deleted environment "${resourceName}"`;
    default:
      return 'Performed an action';
  }
};

export function WorkspaceActivity({ limit = 10, showHeader = true }: WorkspaceActivityProps) {
  const { currentWorkspace } = useWorkspace();
  
  if (!currentWorkspace) {
    return null;
  }
  
  const activities = getWorkspaceActivity(currentWorkspace.id, limit);
  
  if (activities.length === 0) {
    return (
      <Card className="border-border/50">
        {showHeader && (
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Recent Activity
            </CardTitle>
          </CardHeader>
        )}
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No recent activity in this workspace</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="border-border/50">
      {showHeader && (
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Recent Activity
          </CardTitle>
        </CardHeader>
      )}
      <CardContent className={showHeader ? '' : 'pt-6'}>
        <div className="space-y-4">
          {activities.map((activity, index) => {
            const ActionIcon = getActionIcon(activity.action);
            const actionColor = getActionColor(activity.action);
            
            return (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="flex items-start gap-3 p-3 rounded-lg hover:bg-secondary/30 transition-colors"
              >
                {/* User Avatar */}
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarImage src={activity.userAvatar} />
                  <AvatarFallback className="bg-primary/10 text-primary text-sm">
                    {activity.userName.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                
                {/* Activity Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm">{activity.userName}</span>
                    <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs ${actionColor}`}>
                      <ActionIcon className="h-3 w-3" />
                      <span className="capitalize">
                        {activity.action.replace(/_/g, ' ')}
                      </span>
                    </div>
                  </div>
                  
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {formatAction(activity)}
                  </p>
                  
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDistanceToNow(activity.timestamp)}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
        
        {activities.length >= limit && (
          <div className="mt-4 pt-4 border-t border-border/50">
            <button className="text-sm text-primary hover:text-primary/80 transition-colors">
              View all activity →
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}