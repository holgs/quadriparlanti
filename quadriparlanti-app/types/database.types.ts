/**
 * Database Type Definitions
 * Generated from Supabase PostgreSQL schema
 */

// Enum types
export type UserRole = 'docente' | 'admin';
export type UserStatus = 'active' | 'invited' | 'suspended';
export type ThemeStatus = 'draft' | 'published' | 'archived';
export type WorkStatus = 'draft' | 'pending_review' | 'published' | 'needs_revision' | 'archived';
export type LicenseType = 'none' | 'CC BY' | 'CC BY-SA' | 'CC BY-NC' | 'CC BY-NC-SA';
export type LinkType = 'youtube' | 'vimeo' | 'drive' | 'other';
export type FileType = 'pdf' | 'image';
export type DeviceType = 'mobile' | 'desktop' | 'tablet' | 'unknown';
export type ReferrerType = 'theme_page' | 'search' | 'direct' | 'external';
export type ReviewAction = 'approved' | 'rejected';

// Table interfaces
export interface User {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
  status: UserStatus;
  created_at: string;
  last_login_at: string | null;
  storage_used_mb: number;
}

export interface Theme {
  id: string;
  title_it: string;
  title_en: string | null;
  description_it: string;
  description_en: string | null;
  slug: string;
  featured_image_url: string | null;
  status: ThemeStatus;
  display_order: number;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface Work {
  id: string;
  title_it: string;
  title_en: string | null;
  description_it: string;
  description_en: string | null;
  class_name: string;
  teacher_name: string;
  school_year: string; // Format: YYYY-YY (e.g., "2024-25")
  status: WorkStatus;
  license: LicenseType | null;
  tags: string[];
  view_count: number;
  created_by: string;
  created_at: string;
  updated_at: string;
  submitted_at: string | null;
  published_at: string | null;
  edit_count: number;
}

export interface WorkTheme {
  work_id: string;
  theme_id: string;
  created_at: string;
}

export interface WorkAttachment {
  id: string;
  work_id: string;
  file_name: string;
  file_size_bytes: number;
  file_type: FileType;
  mime_type: string;
  storage_path: string;
  thumbnail_path: string | null;
  uploaded_at: string;
}

export interface WorkLink {
  id: string;
  work_id: string;
  url: string;
  link_type: LinkType;
  custom_label: string | null;
  preview_title: string | null;
  preview_thumbnail_url: string | null;
  created_at: string;
}

export interface QRCode {
  id: string;
  theme_id: string;
  short_code: string; // 6-character alphanumeric code
  is_active: boolean;
  scan_count: number;
  created_at: string;
  last_scanned_at: string | null;
}

export interface QRScan {
  id: string;
  qr_code_id: string;
  theme_id: string | null;
  scanned_at: string;
  hashed_ip: string;
  user_agent: string | null;
  device_type: DeviceType;
  referer: string | null;
}

export interface WorkView {
  id: string;
  work_id: string;
  viewed_at: string;
  hashed_ip: string;
  referrer: ReferrerType;
  user_agent: string | null;
  session_id: string | null;
}

export interface WorkReview {
  id: string;
  work_id: string;
  reviewer_id: string | null;
  action: ReviewAction;
  comments: string | null;
  reviewed_at: string;
}

export interface Config {
  key: string;
  value: string;
  description: string | null;
  updated_at: string;
  updated_by: string | null;
}

// View interfaces
export interface DailyScanStat {
  scan_date: string;
  theme_id: string | null;
  scan_count: number;
  unique_visitors: number;
  mobile_scans: number;
  desktop_scans: number;
  tablet_scans: number;
}

export interface WorkPerformanceStat {
  id: string;
  title_it: string;
  class_name: string;
  school_year: string;
  view_count: number;
  published_at: string | null;
  detail_views: number;
  unique_viewers: number;
  avg_days_to_view: number;
}

export interface AdminReviewQueueItem {
  id: string;
  title_it: string;
  description_it: string;
  class_name: string;
  teacher_name: string;
  school_year: string;
  submitted_at: string | null;
  created_at: string;
  edit_count: number;
  teacher_full_name: string | null;
  teacher_email: string;
  attachment_count: number;
  link_count: number;
  hours_pending: number;
}

// Extended types with relations
export interface WorkWithRelations extends Work {
  themes?: Theme[];
  attachments?: WorkAttachment[];
  links?: WorkLink[];
  creator?: User;
  reviews?: WorkReview[];
}

export interface ThemeWithWorks extends Theme {
  works?: WorkWithRelations[];
  qr_codes?: QRCode[];
}

export interface UserWithStats extends User {
  works_count?: number;
  published_works_count?: number;
}

// Database type for Supabase client
export interface Database {
  public: {
    Tables: {
      users: {
        Row: User;
        Insert: Omit<User, 'id' | 'created_at' | 'storage_used_mb'> & {
          id?: string;
          created_at?: string;
          storage_used_mb?: number;
        };
        Update: Partial<Omit<User, 'id' | 'created_at'>>;
      };
      themes: {
        Row: Theme;
        Insert: Omit<Theme, 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<Theme, 'id' | 'created_at'>>;
      };
      works: {
        Row: Work;
        Insert: Omit<Work, 'id' | 'created_at' | 'updated_at' | 'view_count' | 'edit_count' | 'submitted_at' | 'published_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
          view_count?: number;
          edit_count?: number;
          submitted_at?: string | null;
          published_at?: string | null;
        };
        Update: Partial<Omit<Work, 'id' | 'created_at' | 'created_by'>>;
      };
      work_themes: {
        Row: WorkTheme;
        Insert: WorkTheme;
        Update: Partial<WorkTheme>;
      };
      work_attachments: {
        Row: WorkAttachment;
        Insert: Omit<WorkAttachment, 'id' | 'uploaded_at'> & {
          id?: string;
          uploaded_at?: string;
        };
        Update: Partial<Omit<WorkAttachment, 'id' | 'work_id' | 'uploaded_at'>>;
      };
      work_links: {
        Row: WorkLink;
        Insert: Omit<WorkLink, 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Omit<WorkLink, 'id' | 'work_id' | 'created_at'>>;
      };
      qr_codes: {
        Row: QRCode;
        Insert: Omit<QRCode, 'id' | 'created_at' | 'scan_count' | 'last_scanned_at'> & {
          id?: string;
          created_at?: string;
          scan_count?: number;
          last_scanned_at?: string | null;
        };
        Update: Partial<Omit<QRCode, 'id' | 'created_at'>>;
      };
      qr_scans: {
        Row: QRScan;
        Insert: Omit<QRScan, 'id' | 'scanned_at'> & {
          id?: string;
          scanned_at?: string;
        };
        Update: never; // Scans are immutable
      };
      work_views: {
        Row: WorkView;
        Insert: Omit<WorkView, 'id' | 'viewed_at'> & {
          id?: string;
          viewed_at?: string;
        };
        Update: never; // Views are immutable
      };
      work_reviews: {
        Row: WorkReview;
        Insert: Omit<WorkReview, 'id' | 'reviewed_at'> & {
          id?: string;
          reviewed_at?: string;
        };
        Update: never; // Reviews are immutable
      };
      config: {
        Row: Config;
        Insert: Omit<Config, 'updated_at'> & {
          updated_at?: string;
        };
        Update: Partial<Omit<Config, 'key'>>;
      };
    };
    Views: {
      daily_scan_stats: {
        Row: DailyScanStat;
      };
      work_performance_stats: {
        Row: WorkPerformanceStat;
      };
      admin_review_queue: {
        Row: AdminReviewQueueItem;
      };
    };
    Functions: {
      generate_short_code: {
        Args: Record<string, never>;
        Returns: string;
      };
      hash_ip: {
        Args: { ip_address: string };
        Returns: string;
      };
      regenerate_daily_salt: {
        Args: Record<string, never>;
        Returns: void;
      };
    };
  };
}
