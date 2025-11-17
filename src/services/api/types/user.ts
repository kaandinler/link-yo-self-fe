// src/services/api/types/user.ts - Mevcut dosyayı güncelle
import { FileEntity } from './file-entity';
import { Role } from './role';

export enum UserProviderEnum {
  EMAIL = 'email',
  GOOGLE = 'google',
}

// Backend User modelini tam olarak yansıtan extended type
export type User = {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  photo?: FileEntity;
  provider?: UserProviderEnum;
  socialId?: string;
  role?: Role;

  // Backend'den gelen ek alanlar
  username?: string;
  display_name?: string;
  bio?: string;
  profile_image_url?: string;
  page_title?: string;
  page_description?: string;
  website?: string;
  twitter_username?: string;
  instagram_username?: string;
  linkedin_username?: string;
  theme_color?: string;
  background_type?: string;
  background_value?: string;

  // Profile completion fields
  profile_completed?: boolean;
  onboarding_completed?: boolean;
  profile_completion_percentage?: number;

  // Timestamps
  created_at?: string;
  updated_at?: string;

  // Links - opsiyonel çünkü her zaman populate edilmeyebilir
  links?: unknown[];
};
