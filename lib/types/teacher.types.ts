/**
 * Teacher Management Types
 * TypeScript type definitions for teacher CRUD operations
 */

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'docente' | 'studente';
  status: 'active' | 'inactive' | 'suspended' | 'invited';
  bio?: string;
  profile_image_url?: string;
  created_at: string;
  updated_at?: string;
  last_login_at?: string;
  storage_used_mb?: number;
}

export interface CreateTeacherInput {
  email: string;
  name: string;
  bio?: string;
  sendInvitation?: boolean;
  password?: string; // Optional manual password when not sending invitation
}

export interface UpdateTeacherInput {
  name?: string;
  bio?: string;
  profile_image_url?: string;
  status?: 'active' | 'inactive' | 'suspended';
  role?: 'docente' | 'admin';
}

export interface TeacherFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: 'active' | 'inactive' | 'suspended' | 'invited';
}

export interface TeacherStats {
  total: number;
  active: number;
  inactive: number;
  suspended: number;
  invited: number;
}

export interface PaginatedTeachersResponse {
  teachers: User[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
