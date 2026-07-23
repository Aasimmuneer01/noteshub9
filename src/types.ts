export interface Warning {
  reason: string;
  date: any;
  adminName: string;
  notes?: string;
}

export interface BanInfo {
  enabled: boolean;
  reason: string;
  expiry?: any;
  type: 'temporary' | 'permanent';
}

export interface User {
  uid: string;
  email: string;
  displayName: string;
  createdAt?: any;
  lastLogin?: any;
  role: 'user' | 'moderator' | 'admin' | 'superadmin' | string;
  isBanned?: boolean;
  banReason?: string;
  banUntil?: string; 
  banInfo?: BanInfo;
  emailVerified?: boolean;
  verificationRequired?: boolean;
  deviceFingerprint?: string;
  accountStatus?: 'active' | 'banned' | 'suspicious' | 'warning' | string;
  isPremium?: boolean;
  isEmailVerified?: boolean;
  // Premium details
  premiumPlan?: string;
  premiumStart?: any;
  premiumExpiry?: any;
  premiumGrantedBy?: string;
  premiumGrantedAt?: any;
  premiumStatus?: 'active' | 'expired' | 'none';
  // Legal/User protection
  termsAccepted?: boolean;
  termsAcceptedAt?: any;
  warnings?: Warning[];
  warningCount: number;
  warningAcknowledged?: boolean;
  aiFeatureSeen?: boolean;
}

export interface Bookmark {
  id: string;
  userId: string;
  resourceId: string;
  resourceTitle: string;
  resourceThumbnail?: string;
  createdAt: any;
}

export interface ReadingHistory {
  userId: string;
  resourceId: string;
  resourceTitle: string;
  lastPage: number;
  totalPages: number;
  percentage: number;
  zoom: number;
  scrollPosition?: { x: number; y: number };
  timeSpent: number; // in seconds
  updatedAt: any;
}

export interface Note {
  id: string;
  userId: string;
  resourceId: string;
  page: number;
  content: string;
  isSavedPage?: boolean;
  createdAt: any;
  updatedAt: any;
}

export interface AppHighlight {
  id: string;
  userId: string;
  resourceId: string;
  page: number;
  type: 'text' | 'area';
  data: any; // PDF.js specific data
  color: string;
  createdAt: any;
}

export interface Folder {
  id: string;
  userId: string;
  name: string;
  resourceIds: string[];
  createdAt: any;
}

export interface Resource {
  id: string;
  title: string;
  slug: string;
  category: string;
  theme: string;
  subject: string;
  classLevel: string;
  board: string;
  bannerUrl: string;
  thumbnailUrl: string;
  pdfUrl: string;
  description: string;
  createdAt: any;
  viewCount: number;
  downloadCount: number;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: any;
  provider: string;
}

export interface Chat {
  id: string;
  title: string;
  subject: string;
  createdAt: any;
  updatedAt: any;
  messages: Message[];
}

export interface AIProvider {
  name: string;
  isActive: boolean;
}

export interface AIUsage {
  count: number;
  lastUpdated: any;
}
