// src/services/auth/user-routing-utils.ts
import { User } from "@/services/api/types/user";

/**
 * Giris yapmis bir kullanici ana sayfaya geldiginde nereye gitmeli?
 *
 * ONCEKI HALI UC SEKILDE BOZUKTU:
 *
 * 1. "links" alanina bakip link'i olmayani /links/add'e yolluyordu. Ama
 *    backend'in UserRead modelinde links alani YOK; deger her zaman bos
 *    diziye dusuyor ve TUM kullanicilar -- onlarca linki olanlar dahil --
 *    "ilk linkini ekle" ekranina gidiyordu.
 * 2. Profili tamamlanmamis kullaniciyi /profile/complete'e yolluyordu;
 *    boyle bir sayfa hic olmadi, sonuc 404 idi. (Profil tamamlama zaten
 *    onboarding sihirbaziyla yapiliyor.)
 * 3. Donen yollarda dil oneki yoktu; middleware bunu telafi ediyordu ama
 *    her yonlendirme fazladan bir tur atiyordu.
 *
 * Kullanilmayan yardimcilar da (handlePostLoginRedirect, checkOnboardingStatus,
 * getOnboardingStep) silindi. Sonuncusu zaten yarim birakilmisti: hicbir
 * sey dondurmeyen bir dala sahipti.
 */
export function getSignedInHomeDestination(
  user: User,
  language: string
): string {
  if (!user.onboarding_completed) {
    return `/${language}/onboarding/welcome`;
  }

  // Panoda zaten "henuz link eklemedin" bos durumu var; kullaniciyi
  // zorla bir ekrana sokmaya gerek yok.
  return `/${language}/dashboard`;
}
