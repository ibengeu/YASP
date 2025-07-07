import React, { useState } from 'react';
import { X, Users, Tag, Activity } from 'lucide-react';
import { Button } from '@/core/components/ui/button';
import { Input } from '@/core/components/ui/input';
import { Label } from '@/core/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/core/components/ui/select';
import { Switch } from '@/core/components/ui/switch';
import { Separator } from '@/core/components/ui/separator';
import { Badge } from '@/core/components/ui/badge';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  specId: string | number;
  currentSettings: {
    title: string;
    workspaceType: 'Personal' | 'Team' | 'Partner' | 'Public';
    tags: string[];
    isDiscoverable: boolean;
  };
  onSettingsChange: (specId: string | number, settings: any) => void;
}

export function SettingsPanel({
  isOpen,
  onClose,
  specId,
  currentSettings,
  onSettingsChange
}: SettingsPanelProps) {
  const [settings, setSettings] = useState(currentSettings);
  const [newTag, setNewTag] = useState('');

  const handleSave = () => {
    onSettingsChange(specId, settings);
    onClose();
  };

  const handleTagAdd = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && newTag.trim()) {
      e.preventDefault();
      const trimmedTag = newTag.trim();
      if (!settings.tags.includes(trimmedTag)) {
        setSettings({
          ...settings,
          tags: [...settings.tags, trimmedTag]
        });
      }
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setSettings({
      ...settings,
      tags: settings.tags.filter(tag => tag !== tagToRemove)
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex justify-end animate-in fade-in duration-300">
      <div className="w-96 bg-card h-full shadow-2xl overflow-y-auto animate-in slide-in-from-right duration-300 ease-out">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-foreground">Workspace Settings</h2>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>

          <div className="space-y-6">
            {/* Workspace Name */}
            <div className="space-y-2">
              <Label htmlFor="workspace-name">Workspace Name</Label>
              <Input
                id="workspace-name"
                value={settings.title}
                onChange={(e) => setSettings({ ...settings, title: e.target.value })}
                placeholder="Enter workspace name"
              />
            </div>

            {/* Workspace Type */}
            <div className="space-y-2">
              <Label>Workspace Type</Label>
              <Select
                value={settings.workspaceType}
                onValueChange={(value: 'Personal' | 'Team' | 'Partner' | 'Public') => 
                  setSettings({ ...settings, workspaceType: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Personal">Personal</SelectItem>
                  <SelectItem value="Team">Team</SelectItem>
                  <SelectItem value="Partner">Partner</SelectItem>
                  <SelectItem value="Public">Public</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            {/* Access Control */}
            <div className="space-y-2">
              <Label>Access Control</Label>
              <Button variant="outline" className="w-full justify-start">
                <Users className="w-4 h-4 mr-2" />
                Manage Access
              </Button>
              <p className="text-sm text-muted-foreground">
                Control who can view and edit this workspace
              </p>
            </div>

            <Separator />

            {/* Tags */}
            <div className="space-y-2">
              <Label>Tags</Label>
              <Input
                placeholder="Add a tag and press Enter"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={handleTagAdd}
              />
              {settings.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {settings.tags.map((tag, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="bg-chart-1/20 text-chart-1 flex items-center gap-1 pr-1"
                    >
                      <Tag className="w-3 h-3" />
                      {tag}
                      <button
                        onClick={() => removeTag(tag)}
                        className="ml-1 text-chart-1 hover:text-chart-1/80 font-bold"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <Separator />

            {/* Activity */}
            <div className="space-y-2">
              <Label>Activity</Label>
              <Button variant="outline" className="w-full justify-start">
                <Activity className="w-4 h-4 mr-2" />
                View Activity
              </Button>
              <p className="text-sm text-muted-foreground">
                See who has contributed to this workspace
              </p>
            </div>

            <Separator />

            {/* Discoverability */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Discoverability</Label>
                  <p className="text-sm text-muted-foreground">
                    Make this workspace visible to your team or community
                  </p>
                </div>
                <Switch
                  checked={settings.isDiscoverable}
                  onCheckedChange={(checked) => setSettings({ ...settings, isDiscoverable: checked })}
                />
              </div>
              {settings.isDiscoverable && (
                <div className="bg-chart-1/10 border border-chart-1/30 rounded-lg p-3">
                  <p className="text-sm text-chart-1">
                    This workspace is visible to the community
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-3 pt-6 mt-6 border-t">
            <Button onClick={handleSave} className="flex-1">
              Save Changes
            </Button>
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}