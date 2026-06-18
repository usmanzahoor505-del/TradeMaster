// ─── Shared API model types (match the .NET backend) ────────────────────────

export interface Signal {
  id: number;
  teacherId: number;
  pair: string;
  action: string; // "BUY" | "SELL"
  entryLow: number;
  entryHigh: number;
  tp1: number;
  tp2?: number | null;
  sl: number;
  leverage: string;
  riskLevel: string; // LOW | MEDIUM | HIGH
  status: string; // Active | Closed | ...
  createdAt: string;
}

export interface Teacher {
  id: number;
  name: string;
  email: string;
  role: string;
  tier: string; // Free | Pro
  status: string;
  isFeatured?: boolean;
  createdAt: string;
}

export interface Post {
  id: number;
  userId: number;
  teacherName: string;
  teacherAvatar: string;
  teacherTier: string;
  isFeatured: boolean;
  content: string;
  image?: string | null;
  postType: string; // General | MarketAnalysis | TradingInsight | Educational
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  isLikedByCurrentUser: boolean;
  status: string;
  createdAt: string;
  updatedAt?: string | null;
}

export interface PagedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  hasMore: boolean;
}

export interface PostCommentNode {
  id: number;
  postId: number;
  userId: number;
  userName: string;
  text: string;
  parentCommentId?: number | null;
  createdAt: string;
  replies: PostCommentNode[];
}

export interface PostDetails {
  post: Post;
  comments: PostCommentNode[];
}

export interface TeacherCard {
  id: number;
  name: string;
  tier: string;
  isFeatured: boolean;
  subscribers: number;
  winRate: number;
  totalSignals: number;
  wins: number;
  closed: number;
  createdAt: string;
}

export interface Subscription {
  id: number;
  studentId: number;
  teacherId: number;
  planId: number;
  startDate: string;
  endDate?: string | null;
  status: string; // Active | Cancelled
  paymentRef?: string | null;
}

export interface Trade {
  id: number;
  studentId: number;
  signalId: number;
  entryPrice: number;
  exitPrice?: number | null;
  pnl?: number | null;
  outcome: string; // Open | Win | Loss
  closedAt?: string | null;
}

export interface Transaction {
  id: number;
  userId: number;
  amount: number;
  currency: string;
  type: string; // credit | debit
  status: string; // Pending | Completed | Failed
  gateway: string;
  gatewayRef?: string | null;
  createdAt: string;
}

export interface Plan {
  id: number;
  name: string; // Basic | Silver | Gold | Platinum
  priceUsd: number;
  featuresJson: string;
  commissionRate: number;
  createdAt: string;
}

export interface UserAccount {
  id: number;
  name: string;
  email: string;
  role: string; // Student | Teacher | Admin
  tier: string; // Free | Pro | ...
  status: string; // Active | Suspended | Banned
  isFeatured?: boolean;
  createdAt: string;
}

export interface AppNotification {
  id: number;
  userId: number;
  signalId?: number | null;
  title: string;
  message: string;
  readAt?: string | null;
  sentAt: string;
}

export interface Dispute {
  id: number;
  raisedById: number;
  againstId?: number | null;
  subject: string;
  description: string;
  status: string; // Open | Resolved | Rejected
  resolution?: string | null;
  createdAt: string;
  resolvedAt?: string | null;
}
