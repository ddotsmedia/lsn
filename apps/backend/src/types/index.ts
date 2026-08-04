export interface User {
  id: string;
  email: string;
  name: string;
  password_hash: string;
  phone?: string;
  created_at: Date;
  updated_at: Date;
}

export interface AdminUser {
  id: string;
  user_id: string;
  role: 'admin' | 'moderator';
  permissions: string[];
  created_at: Date;
}

export interface RefreshToken {
  id: string;
  user_id: string;
  token: string;
  expires_at: Date;
}

export interface GalleryCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  created_at: Date;
}

export interface GalleryImage {
  id: string;
  category_id: string;
  image_url: string;
  title: string;
  description?: string;
  created_at: Date;
}

export interface NewsEvent {
  id: string;
  title: string;
  slug: string;
  content: string;
  image_url?: string;
  published_at: Date;
  created_at: Date;
}

export interface Facility {
  id: string;
  name: string;
  description: string;
  image_url?: string;
  location: string;
  created_at: Date;
}

export interface AgeGroup {
  id: string;
  name: string;
  min_age: number;
  max_age: number;
  created_at: Date;
}

export interface Registration {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  age_group_id: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: Date;
}

export interface TourBooking {
  id: string;
  visitor_name: string;
  email: string;
  phone: string;
  preferred_date: Date;
  time_slot: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  created_at: Date;
}

export interface AuthPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  name: string;
}

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}
