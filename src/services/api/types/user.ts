// Backend'in UserRead modelini yansitir.
//
// NOT: Alan adlari backend ile ayni (snake_case). Onceki halinde
// boilerplate'ten kalan firstName/lastName/provider/socialId alanlari vardi;
// backend bunlari hic gondermiyor, yani her zaman undefined'dilar ve bu
// alanlari okuyan yerler (app-bar, profil sayfasi) bos gorunuyordu.
export type User = {
  // Backend'de Integer primary key; onceki hali string diyordu.
  id: number;
  email: string;
  first_name?: string;
  last_name?: string;

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

  /**
   * Adres sahipligi dogrulandi mi? Sifre sifirlama baglantisi bu adrese
   * gittigi icin arayuz dogrulanmamis adres icin uyari gosteriyor.
   */
  email_verified?: boolean;

  // Profile completion fields
  /** Backend UserRead.is_admin - admin sayfalarini gostermek icin. */
  is_admin?: boolean;
  profile_completed?: boolean;
  onboarding_completed?: boolean;
  profile_completion_percentage?: number;

  // Timestamps
  created_at?: string;
  updated_at?: string;

  // Links - opsiyonel çünkü her zaman populate edilmeyebilir
  links?: unknown[];
};
