export type SettingsCategory = 
  | 'general'
  | 'members'
  | 'teams'
  | 'billing'
  | 'notifications'
  | 'integrations'
  | 'security'
  | 'appearance'
  | 'profile';

export interface SettingsSection {
  id: SettingsCategory;
  label: string;
  icon: string;
  group: 'workspace' | 'account';
}

export const settingsSections: SettingsSection[] = [
  { id: 'general', label: 'General', icon: 'Settings', group: 'workspace' },
  { id: 'members', label: 'Members', icon: 'Users', group: 'workspace' },
  { id: 'teams', label: 'Teams', icon: 'UsersRound', group: 'workspace' },
  { id: 'billing', label: 'Billing', icon: 'CreditCard', group: 'workspace' },
  { id: 'integrations', label: 'Integrations', icon: 'Blocks', group: 'workspace' },
  { id: 'security', label: 'Security', icon: 'Shield', group: 'workspace' },
  { id: 'profile', label: 'Profile', icon: 'User', group: 'account' },
  { id: 'notifications', label: 'Notifications', icon: 'Bell', group: 'account' },
  { id: 'appearance', label: 'Appearance', icon: 'Palette', group: 'account' },
];

export interface WorkspaceSettings {
  name: string;
  url: string;
  logo: string | null;
  timezone: string;
  dateFormat: string;
  timeFormat: string;
  weekStartsOn: string;
}

export const mockWorkspaceSettings: WorkspaceSettings = {
  name: 'Linear Precision',
  url: 'linear-precision',
  logo: null,
  timezone: 'America/Los_Angeles',
  dateFormat: 'MM/DD/YYYY',
  timeFormat: '12h',
  weekStartsOn: 'Monday',
};

export interface UserProfile {
  name: string;
  email: string;
  avatar: string | null;
  role: string;
  timezone: string;
  jobTitle: string;
  bio: string;
}

export const mockUserProfile: UserProfile = {
  name: 'Alex Developer',
  email: 'alex@linearprecision.com',
  avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026024d',
  role: 'Admin',
  timezone: 'America/Los_Angeles',
  jobTitle: 'Senior Frontend Engineer',
  bio: 'Building the future of project management.',
};

export interface Member {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'Member' | 'Guest';
  avatar?: string;
  initials: string;
}

export const mockMembers: Member[] = [
  { id: '1', name: 'Alex Chen', email: 'alex@linearprecision.com', role: 'Admin', initials: 'AC', avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026024d' },
  { id: '2', name: 'Sarah Miller', email: 'sarah@linearprecision.com', role: 'Member', initials: 'SM', avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026704d' },
  { id: '3', name: 'James Wilson', email: 'james@linearprecision.com', role: 'Member', initials: 'JW' },
  { id: '4', name: 'Emily Davis', email: 'emily@linearprecision.com', role: 'Guest', initials: 'ED' },
];

export const mockTeams = [
  { id: 't1', name: 'Engineering', members: 12, description: 'Core platform and product engineering' },
  { id: 't2', name: 'Design', members: 4, description: 'Product design and user research' },
  { id: 't3', name: 'Marketing', members: 6, description: 'Growth, content, and product marketing' },
];

export const mockIntegrations = [
  { id: 'i1', name: 'GitHub', description: 'Link pull requests and commits to issues.', icon: 'Github', connected: true },
  { id: 'i2', name: 'Slack', description: 'Create issues and receive notifications in Slack.', icon: 'Slack', connected: true },
  { id: 'i3', name: 'Figma', description: 'Embed Figma designs directly in issues and documents.', icon: 'Figma', connected: false },
  { id: 'i4', name: 'Sentry', description: 'Automatically create issues from Sentry errors.', icon: 'Bug', connected: false },
];
