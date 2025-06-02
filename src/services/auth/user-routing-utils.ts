// src/services/auth/user-routing-utils.ts
import { User } from "@/services/api/types/user";

// Extended user type for routing decisions
type ExtendedUser = User & {
  onboarding_completed?: boolean;
  profile_completed?: boolean;
  profile_completion_percentage?: number;
  links?: any[];
};

/**
 * Type-safe property getter with fallback
 */
const getUserProperty = <T>(user: any, propertyName: string, fallback: T): T => {
  return user?.[propertyName] !== undefined ? user[propertyName] : fallback;
};

/**
 * Kullanıcının mevcut durumuna göre yönlendirilmesi gereken sayfayı belirler
 */
export const determineUserDestination = (user: User, currentPath: string): string | null => {
  // Eğer kullanıcı zaten dashboard/app sayfalarında ise yönlendirme yapma
  if (
    currentPath.startsWith('/dashboard') || 
    currentPath.startsWith('/links') || 
    currentPath.startsWith('/analytics') ||
    currentPath.startsWith('/profile') ||
    currentPath.startsWith('/onboarding')
  ) {
    return null;
  }

  const extendedUser = user as ExtendedUser;

  // İlk kez giriş yapan kullanıcı (onboarding tamamlanmamış)
  const onboardingCompleted = getUserProperty(extendedUser, 'onboarding_completed', false);
  if (!onboardingCompleted) {
    return '/onboarding/welcome';
  }

  // Profili tamamlanmamış kullanıcı
  const profileCompleted = getUserProperty(extendedUser, 'profile_completed', false);
  if (!profileCompleted) {
    // Profile completion percentage'ı kontrol et (eğer property varsa)
    const completionPercentage = getUserProperty(extendedUser, 'profile_completion_percentage', 0);
    if (completionPercentage < 50) {
      return '/profile/complete';
    }
    return '/profile/complete';
  }

  // Link'i olmayan kullanıcı (links property'si varsa kontrol et)
  const userLinks = getUserProperty(extendedUser, 'links', []);
  if (userLinks.length === 0) {
    return '/links/add?welcome=true';
  }

  // Normal kullanıcı - dashboard'a yönlendir
  return '/dashboard';
};

/**
 * Login başarılı olduktan sonra kullanıcıyı uygun sayfaya yönlendirir
 */
export const handlePostLoginRedirect = (user: User, router: any) => {
  const currentPath = window.location.pathname;
  const destination = determineUserDestination(user, currentPath);
  
  if (destination) {
    router.push(destination);
  }
};

/**
 * Kullanıcının onboarding durumunu kontrol eder
 */
export const checkOnboardingStatus = (user: User) => {
  const extendedUser = user as ExtendedUser;
  
  return {
    needsOnboarding: !getUserProperty(extendedUser, 'onboarding_completed', false),
    needsProfileCompletion: !getUserProperty(extendedUser, 'profile_completed', false),
    needsFirstLinks: getUserProperty(extendedUser, 'links', []).length === 0,
    completionPercentage: getUserProperty(extendedUser, 'profile_completion_percentage', 0)
  };
};

/**
 * Kullanıcının hangi onboarding adımında olduğunu belirler
 */
export const getOnboardingStep = (user: User) => {
  const extendedUser = user as ExtendedUser;
  
  const onboardingCompleted = getUserProperty(extendedUser, 'onboarding_completed', false);
  if (!onboardingCompleted) {
    return 'welcome';
  }
  
  const profileCompleted = getUserProperty(extendedUser, 'profile_completed', false);
  if (!profileCompleted) {
    return 'profile';
  }
  
  const userLinks = getUserProperty(extendedUser, 'links', []);
  if (userLinks.length === 0) {
    return 'first-links';
  }
  
  return 'completed';
};