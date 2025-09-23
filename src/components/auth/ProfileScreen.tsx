import React, { useState } from 'react';
import { User, Mail, Building, Briefcase, Camera, Shield, Bell, Trash2, Eye, EyeOff, Save, X, Check, Github, ExternalLink } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Switch } from '../ui/switch';
import { Separator } from '../ui/separator';
import { Alert, AlertDescription } from '../ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { User as UserType, ProfileFormData, ChangePasswordFormData, ValidationError, SocialAccount, NotificationPreferences } from './types';
import { validateEmail, validateName, validatePassword, validatePasswordMatch, formatName, getInitials } from './utils';
import { motion } from 'motion/react';

interface ProfileScreenProps {
  user: UserType;
  onUpdateProfile: (data: ProfileFormData) => void;
  onChangePassword: (data: ChangePasswordFormData) => void;
  onUpdateNotifications: (preferences: NotificationPreferences) => void;
  onUploadAvatar: (file: File) => void;
  onRemoveAvatar: () => void;
  onConnectSocial: (provider: string) => void;
  onDisconnectSocial: (provider: string) => void;
  onDeleteAccount: () => void;
  onBackToDashboard: () => void;
  loading?: boolean;
  error?: string | null;
  success?: string | null;
}

export function ProfileScreen({
  user,
  onUpdateProfile,
  onChangePassword,
  onUpdateNotifications,
  onUploadAvatar,
  onRemoveAvatar,
  onConnectSocial,
  onDisconnectSocial,
  onDeleteAccount,
  onBackToDashboard,
  loading = false,
  error,
  success
}: ProfileScreenProps) {
  const [activeTab, setActiveTab] = useState('profile');
  const [profileData, setProfileData] = useState<ProfileFormData>({
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    company: user.company || '',
    role: user.role || ''
  });
  
  const [passwordData, setPasswordData] = useState<ChangePasswordFormData>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [notifications, setNotifications] = useState<NotificationPreferences>(user.notificationPreferences);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [profileErrors, setProfileErrors] = useState<ValidationError[]>([]);
  const [passwordErrors, setPasswordErrors] = useState<ValidationError[]>([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const handleProfileChange = (field: keyof ProfileFormData, value: string) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
    setHasUnsavedChanges(true);
    
    // Clear validation errors
    setProfileErrors(prev => prev.filter(error => error.field !== field));
  };

  const handlePasswordChange = (field: keyof ChangePasswordFormData, value: string) => {
    setPasswordData(prev => ({ ...prev, [field]: value }));
    
    // Clear validation errors
    setPasswordErrors(prev => prev.filter(error => error.field !== field));
  };

  const handleNotificationChange = (field: keyof NotificationPreferences, value: boolean) => {
    const updatedNotifications = { ...notifications, [field]: value };
    setNotifications(updatedNotifications);
    onUpdateNotifications(updatedNotifications);
  };

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const errors: ValidationError[] = [];
    
    const firstNameError = validateName(profileData.firstName, 'firstName');
    if (firstNameError) errors.push(firstNameError);
    
    const lastNameError = validateName(profileData.lastName, 'lastName');
    if (lastNameError) errors.push(lastNameError);
    
    const emailError = validateEmail(profileData.email);
    if (emailError) errors.push(emailError);
    
    setProfileErrors(errors);
    
    if (errors.length === 0) {
      onUpdateProfile(profileData);
      setHasUnsavedChanges(false);
    }
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const errors: ValidationError[] = [];
    
    if (!passwordData.currentPassword) {
      errors.push({ field: 'currentPassword', message: 'Current password is required' });
    }
    
    const newPasswordError = validatePassword(passwordData.newPassword);
    if (newPasswordError) errors.push(newPasswordError);
    
    const passwordMatchError = validatePasswordMatch(passwordData.newPassword, passwordData.confirmPassword);
    if (passwordMatchError) errors.push(passwordMatchError);
    
    setPasswordErrors(errors);
    
    if (errors.length === 0) {
      onChangePassword(passwordData);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    }
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUploadAvatar(file);
    }
  };

  const getFieldError = (errors: ValidationError[], field: string) => {
    return errors.find(error => error.field === field);
  };

  const getSocialIcon = (provider: string) => {
    switch (provider) {
      case 'github':
        return <Github className="h-4 w-4" />;
      case 'google':
        return (
          <svg className="h-4 w-4" viewBox="0 0 24 24">
            <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
        );
      case 'microsoft':
        return (
          <svg className="h-4 w-4" viewBox="0 0 24 24">
            <path fill="#f25022" d="M1 1h10v10H1z"/>
            <path fill="#00a4ef" d="M13 1h10v10H13z"/>
            <path fill="#7fba00" d="M1 13h10v10H1z"/>
            <path fill="#ffb900" d="M13 13h10v10H13z"/>
          </svg>
        );
      default:
        return <ExternalLink className="h-4 w-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border/50 bg-background/95 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h1 className="text-3xl tracking-tight">Profile Settings</h1>
              <p className="text-muted-foreground">
                Manage your account settings and preferences
              </p>
            </div>
            <Button
              variant="outline"
              onClick={onBackToDashboard}
              className="border-border/50 hover:bg-secondary/50 rounded-lg"
            >
              <X className="h-4 w-4 mr-2" />
              Close
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Status Messages */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <Alert variant="destructive" className="border-destructive/20 bg-destructive/5 rounded-xl">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </motion.div>
        )}

        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20 rounded-xl">
              <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
              <AlertDescription className="text-green-800 dark:text-green-200">{success}</AlertDescription>
            </Alert>
          </motion.div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="grid w-full grid-cols-4 bg-muted/50 rounded-xl">
            <TabsTrigger value="profile" className="rounded-lg">Profile</TabsTrigger>
            <TabsTrigger value="security" className="rounded-lg">Security</TabsTrigger>
            <TabsTrigger value="notifications" className="rounded-lg">Notifications</TabsTrigger>
            <TabsTrigger value="account" className="rounded-lg">Account</TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            <Card className="border-border/50 card-shadow-sm">
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>
                  Update your personal details and profile picture
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Avatar Section */}
                <div className="flex items-center gap-6">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={user.avatar} alt={formatName(user.firstName, user.lastName)} />
                    <AvatarFallback className="text-lg font-medium bg-primary/10 text-primary">
                      {getInitials(user.firstName, user.lastName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-3">
                    <div>
                      <h3 className="font-medium">Profile Picture</h3>
                      <p className="text-sm text-muted-foreground">
                        Upload a profile picture to personalize your account
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarUpload}
                        className="hidden"
                        id="avatar-upload"
                      />
                      <Button
                        asChild
                        variant="outline"
                        size="sm"
                        className="border-border/50 hover:bg-secondary/50"
                      >
                        <label htmlFor="avatar-upload" className="cursor-pointer">
                          <Camera className="h-4 w-4 mr-2" />
                          Upload
                        </label>
                      </Button>
                      {user.avatar && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={onRemoveAvatar}
                          className="border-border/50 hover:bg-secondary/50 text-destructive hover:text-destructive"
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                <Separator className="bg-border/50" />

                {/* Profile Form */}
                <form onSubmit={handleProfileSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name *</Label>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="firstName"
                          type="text"
                          value={profileData.firstName}
                          onChange={(e) => handleProfileChange('firstName', e.target.value)}
                          className={`pl-12 h-12 bg-input-background border-border/50 focus:border-primary focus:ring-primary/30 rounded-xl ${
                            getFieldError(profileErrors, 'firstName') ? 'border-destructive focus:border-destructive focus:ring-destructive/30' : ''
                          }`}
                          disabled={loading}
                        />
                      </div>
                      {getFieldError(profileErrors, 'firstName') && (
                        <p className="text-sm text-destructive">
                          {getFieldError(profileErrors, 'firstName')?.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name *</Label>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="lastName"
                          type="text"
                          value={profileData.lastName}
                          onChange={(e) => handleProfileChange('lastName', e.target.value)}
                          className={`pl-12 h-12 bg-input-background border-border/50 focus:border-primary focus:ring-primary/30 rounded-xl ${
                            getFieldError(profileErrors, 'lastName') ? 'border-destructive focus:border-destructive focus:ring-destructive/30' : ''
                          }`}
                          disabled={loading}
                        />
                      </div>
                      {getFieldError(profileErrors, 'lastName') && (
                        <p className="text-sm text-destructive">
                          {getFieldError(profileErrors, 'lastName')?.message}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        value={profileData.email}
                        onChange={(e) => handleProfileChange('email', e.target.value)}
                        className={`pl-12 h-12 bg-input-background border-border/50 focus:border-primary focus:ring-primary/30 rounded-xl ${
                          getFieldError(profileErrors, 'email') ? 'border-destructive focus:border-destructive focus:ring-destructive/30' : ''
                        }`}
                        disabled={loading}
                      />
                      {!user.emailVerified && (
                        <Badge variant="secondary" className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-yellow-100 text-yellow-800 border-0">
                          Unverified
                        </Badge>
                      )}
                    </div>
                    {getFieldError(profileErrors, 'email') && (
                      <p className="text-sm text-destructive">
                        {getFieldError(profileErrors, 'email')?.message}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="company">Company</Label>
                      <div className="relative">
                        <Building className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="company"
                          type="text"
                          value={profileData.company}
                          onChange={(e) => handleProfileChange('company', e.target.value)}
                          className="pl-12 h-12 bg-input-background border-border/50 focus:border-primary focus:ring-primary/30 rounded-xl"
                          disabled={loading}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="role">Role</Label>
                      <div className="relative">
                        <Briefcase className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="role"
                          type="text"
                          value={profileData.role}
                          onChange={(e) => handleProfileChange('role', e.target.value)}
                          className="pl-12 h-12 bg-input-background border-border/50 focus:border-primary focus:ring-primary/30 rounded-xl"
                          disabled={loading}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button
                      type="submit"
                      disabled={loading || !hasUnsavedChanges}
                      className="bg-primary hover:bg-primary/90 rounded-lg"
                    >
                      {loading ? (
                        <div className="flex items-center gap-2">
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                          <span>Saving...</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Save className="h-4 w-4" />
                          <span>Save Changes</span>
                        </div>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="space-y-6">
            {/* Change Password */}
            <Card className="border-border/50 card-shadow-sm">
              <CardHeader>
                <CardTitle>Change Password</CardTitle>
                <CardDescription>
                  Update your password to keep your account secure
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handlePasswordSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <div className="relative">
                      <Input
                        id="currentPassword"
                        type={showCurrentPassword ? 'text' : 'password'}
                        value={passwordData.currentPassword}
                        onChange={(e) => handlePasswordChange('currentPassword', e.target.value)}
                        className={`pr-12 h-12 bg-input-background border-border/50 focus:border-primary focus:ring-primary/30 rounded-xl ${
                          getFieldError(passwordErrors, 'currentPassword') ? 'border-destructive focus:border-destructive focus:ring-destructive/30' : ''
                        }`}
                        disabled={loading}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-secondary/50 rounded-lg"
                      >
                        {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    {getFieldError(passwordErrors, 'currentPassword') && (
                      <p className="text-sm text-destructive">
                        {getFieldError(passwordErrors, 'currentPassword')?.message}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="newPassword">New Password</Label>
                      <div className="relative">
                        <Input
                          id="newPassword"
                          type={showNewPassword ? 'text' : 'password'}
                          value={passwordData.newPassword}
                          onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                          className={`pr-12 h-12 bg-input-background border-border/50 focus:border-primary focus:ring-primary/30 rounded-xl ${
                            getFieldError(passwordErrors, 'newPassword') ? 'border-destructive focus:border-destructive focus:ring-destructive/30' : ''
                          }`}
                          disabled={loading}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-secondary/50 rounded-lg"
                        >
                          {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                      {getFieldError(passwordErrors, 'newPassword') && (
                        <p className="text-sm text-destructive">
                          {getFieldError(passwordErrors, 'newPassword')?.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm New Password</Label>
                      <div className="relative">
                        <Input
                          id="confirmPassword"
                          type={showConfirmPassword ? 'text' : 'password'}
                          value={passwordData.confirmPassword}
                          onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                          className={`pr-12 h-12 bg-input-background border-border/50 focus:border-primary focus:ring-primary/30 rounded-xl ${
                            getFieldError(passwordErrors, 'confirmPassword') ? 'border-destructive focus:border-destructive focus:ring-destructive/30' : ''
                          }`}
                          disabled={loading}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-secondary/50 rounded-lg"
                        >
                          {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                      {getFieldError(passwordErrors, 'confirmPassword') && (
                        <p className="text-sm text-destructive">
                          {getFieldError(passwordErrors, 'confirmPassword')?.message}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button
                      type="submit"
                      disabled={loading}
                      className="bg-primary hover:bg-primary/90 rounded-lg"
                    >
                      {loading ? (
                        <div className="flex items-center gap-2">
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                          <span>Updating...</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4" />
                          <span>Update Password</span>
                        </div>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* Social Accounts */}
            <Card className="border-border/50 card-shadow-sm">
              <CardHeader>
                <CardTitle>Connected Accounts</CardTitle>
                <CardDescription>
                  Link your social accounts for easier sign-in
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {['google', 'github', 'microsoft'].map((provider) => {
                  const connectedAccount = user.socialAccounts.find(acc => acc.provider === provider);
                  return (
                    <div key={provider} className="flex items-center justify-between p-4 border border-border/50 rounded-xl">
                      <div className="flex items-center gap-3">
                        {getSocialIcon(provider)}
                        <div>
                          <p className="font-medium capitalize">{provider}</p>
                          {connectedAccount ? (
                            <p className="text-sm text-muted-foreground">{connectedAccount.email}</p>
                          ) : (
                            <p className="text-sm text-muted-foreground">Not connected</p>
                          )}
                        </div>
                      </div>
                      {connectedAccount ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onDisconnectSocial(provider)}
                          className="border-border/50 hover:bg-destructive/5 hover:border-destructive/50 hover:text-destructive"
                        >
                          Disconnect
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onConnectSocial(provider)}
                          className="border-border/50 hover:bg-secondary/50"
                        >
                          Connect
                        </Button>
                      )}
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-6">
            <Card className="border-border/50 card-shadow-sm">
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>
                  Choose what notifications you'd like to receive
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="emailNotifications" className="font-medium">Email Notifications</Label>
                      <p className="text-sm text-muted-foreground">Receive important updates via email</p>
                    </div>
                    <Switch
                      id="emailNotifications"
                      checked={notifications.emailNotifications}
                      onCheckedChange={(checked) => handleNotificationChange('emailNotifications', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="apiUpdates" className="font-medium">API Updates</Label>
                      <p className="text-sm text-muted-foreground">Get notified about API changes and updates</p>
                    </div>
                    <Switch
                      id="apiUpdates"
                      checked={notifications.apiUpdates}
                      onCheckedChange={(checked) => handleNotificationChange('apiUpdates', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="securityAlerts" className="font-medium">Security Alerts</Label>
                      <p className="text-sm text-muted-foreground">Important security notifications</p>
                    </div>
                    <Switch
                      id="securityAlerts"
                      checked={notifications.securityAlerts}
                      onCheckedChange={(checked) => handleNotificationChange('securityAlerts', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="marketingEmails" className="font-medium">Marketing Emails</Label>
                      <p className="text-sm text-muted-foreground">Product updates and news</p>
                    </div>
                    <Switch
                      id="marketingEmails"
                      checked={notifications.marketingEmails}
                      onCheckedChange={(checked) => handleNotificationChange('marketingEmails', checked)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Account Tab */}
          <TabsContent value="account" className="space-y-6">
            <Card className="border-border/50 card-shadow-sm">
              <CardHeader>
                <CardTitle>Account Information</CardTitle>
                <CardDescription>
                  View your account details and manage your account
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Account Created</Label>
                    <p className="text-sm">{new Date(user.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Last Login</Label>
                    <p className="text-sm">{new Date(user.lastLogin).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Email Status</Label>
                    <div className="flex items-center gap-2">
                      {user.emailVerified ? (
                        <>
                          <Badge className="bg-green-100 text-green-800 border-0">Verified</Badge>
                          <Check className="h-4 w-4 text-green-600" />
                        </>
                      ) : (
                        <>
                          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-0">Unverified</Badge>
                          <Button variant="link" className="p-0 h-auto text-sm text-primary">
                            Verify now
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Two-Factor Auth</Label>
                    <div className="flex items-center gap-2">
                      {user.twoFactorEnabled ? (
                        <>
                          <Badge className="bg-green-100 text-green-800 border-0">Enabled</Badge>
                          <Button variant="link" className="p-0 h-auto text-sm text-primary">
                            Manage
                          </Button>
                        </>
                      ) : (
                        <>
                          <Badge variant="secondary">Disabled</Badge>
                          <Button variant="link" className="p-0 h-auto text-sm text-primary">
                            Enable
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Danger Zone */}
            <Card className="border-destructive/20 card-shadow-sm">
              <CardHeader>
                <CardTitle className="text-destructive">Danger Zone</CardTitle>
                <CardDescription>
                  Irreversible actions that will affect your account
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between p-4 border border-destructive/20 bg-destructive/5 rounded-xl">
                  <div>
                    <h4 className="font-medium text-destructive">Delete Account</h4>
                    <p className="text-sm text-muted-foreground">
                      Permanently delete your account and all associated data
                    </p>
                  </div>
                  <Button
                    variant="destructive"
                    onClick={() => setDeleteDialogOpen(true)}
                    className="bg-destructive hover:bg-destructive/90"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Account
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Delete Account Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="border-border/50 card-shadow-lg rounded-xl">
          <DialogHeader className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center">
                <Trash2 className="h-5 w-5 text-destructive" />
              </div>
              <DialogTitle className="text-xl tracking-tight">
                Delete Account
              </DialogTitle>
            </div>
            <DialogDescription className="text-muted-foreground leading-relaxed">
              This action cannot be undone. This will permanently delete your account
              and remove all your data from our servers, including:
              <ul className="mt-2 space-y-1 text-sm">
                <li>• All your API specifications and documentation</li>
                <li>• Your profile information and settings</li>
                <li>• All associated data and history</li>
              </ul>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-3">
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              className="border-border/50 hover:bg-secondary/50 rounded-lg"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                onDeleteAccount();
                setDeleteDialogOpen(false);
              }}
              className="bg-destructive hover:bg-destructive/90 rounded-lg"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete My Account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}