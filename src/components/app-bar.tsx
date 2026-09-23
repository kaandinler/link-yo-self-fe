"use client";
import React, { useState } from "react";
import { useParams, usePathname } from "next/navigation";
import useAuth from "@/services/auth/use-auth";
import useAuthActions from "@/services/auth/use-auth-actions";
import { useTranslation } from "@/services/i18n/client";
import useLanguage from "@/services/i18n/use-language";
import Link from "@/components/link";
import ThemeSwitchButton from "@/components/switch-theme-button";
import LanguageSwitchButton from "@/components/language-switch-button";
import { IS_SIGN_UP_ENABLED } from "@/services/auth/config";
import {
  Menu,
  X,
  User,
  LogOut,
  ChevronDown,
  Link2,
  BarChart3,
  Plus,
  Eye,
  TrendingUp,
} from "lucide-react";

// Navigation item type definitions
type DashboardNavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

type PublicNavItem = {
  href: string;
  label: string;
};

function ResponsiveAppBar() {
  const { t } = useTranslation("common");
  const { user, isLoaded } = useAuth();
  const { logOut } = useAuthActions();
  const pathname = usePathname();
  const language = useLanguage();
  const params = useParams<{ username?: string }>();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  // Etiketler t() ile: onceden duz Ingilizce yaziliydi ve /tr'de de
  // "Dashboard, Links, Analytics..." gorunuyordu. i18n koruma testleri
  // bunu yakalamiyordu, cunku onlar yalnizca ceviri cagrilarini
  // denetliyor -- hic cagrilmayan metin onlara gorunmez.
  const dashboardNavItems: DashboardNavItem[] = [
    { href: "/dashboard", label: t("navigation.dashboard"), icon: BarChart3 },
    { href: "/links", label: t("navigation.links"), icon: Link2 },
    { href: "/analytics", label: t("navigation.analytics"), icon: TrendingUp },
    { href: "/profile/edit", label: t("navigation.profile"), icon: User },
  ];

  const publicNavItems: PublicNavItem[] = [
    { href: "/", label: t("navigation.home") },
    { href: "/about", label: t("navigation.about") },
    { href: "/contact", label: t("navigation.contact") },
  ];

  /**
   * Menu ogesi su anki sayfa mi?
   *
   * usePathname() dil onekini de donduruyor ("/en/dashboard"), menu
   * adresleri ise oneksiz ("/dashboard"). Onceki hali ikisini
   * dogrudan karsilastiriyordu ve HICBIR sayfada hicbir oge
   * vurgulanmiyordu -- olculdu: /en/dashboard, /en/links ve
   * /en/analytics'te vurgulanan oge sayisi 0.
   */
  const aktifMi = (href: string) => pathname === `/${language}${href}`;

  /**
   * Ust seritte gosterilen ad: urunun kendi "gorunen ad" alani.
   *
   * Onceden first_name || email: first_name bu urunde hic
   * doldurulmuyor (boilerplate'ten kalma), yani herkes menude kendi
   * E-POSTASINI goruyordu -- ekran paylasiminda da. Olculdu: gorunen
   * adi "Ada Lovelace" olan kullanicida menu e-postayi gosteriyordu.
   */
  const gorunenAd = user?.display_name || user?.username || "";

  const handleMobileMenuToggle = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const handleUserMenuToggle = () => {
    setUserMenuOpen(!userMenuOpen);
  };

  const handleLogout = () => {
    logOut();
    setUserMenuOpen(false);
  };

  /**
   * Kullanicinin herkese acik sayfasi.
   *
   * Onceki hali `/@${username}` uretiyordu; boyle bir rota YOK. Olculdu:
   * dugme /en/@kullanici'ya gidip 404 veriyordu, dogru adres
   * /en/kullanici 200 donuyordu. Yani giris yapmis her sayfada duran,
   * kullanicinin kendi sayfasini gormesini saglayan dugme bozuktu.
   *
   * Bu bir <a target="_blank"> -- dil onekini ekleyen ic Link degil --
   * o yuzden onek burada elle konuyor.
   *
   * Kullanici adi yoksa adres uydurulmuyor. Eski hali e-postanin "@"
   * oncesine dusuyordu; o, baska birinin kullanici adi olabilir.
   */
  const profilAdresi = user?.username ? `/${language}/${user.username}` : null;

  /*
   * Herkese acik profil: ziyaretcinin gordugu sayfa, uygulamanin degil.
   *
   * Seride orada yer yoktu: bir kisinin bio sayfasina gelen ziyaretci
   * ustte LinkYoSelf'in menusunu (Home / About / Contact, Sign in,
   * Sign up) goruyordu -- sayfanin sahibinin degil urunun sayfasi
   * gibi. Link-in-bio sayfalari bunu gostermez; urune donus yolu
   * profilin altindaki "Powered by Link Yo Self" baglantisi.
   *
   * NEDEN useParams: profil rotasi [username]. Router eslesmeyi zaten
   * yapiyor; eslesen rotada `username` parametresi var, digerlerinde
   * yok. Uygulama rotalarinin bir listesini tutmak gerekmiyor -- yeni
   * bir sayfa eklendiginde unutulacak bir yer kalmiyor. Kullanicinin
   * kendi profili de dahil: sahibi de sayfasini ziyaretcinin gordugu
   * gibi goruyor (Onizle dugmesinin amaci bu).
   */
  if (params?.username) return null;

  return (
    <header className="sticky top-0 z-50 bg-gradient-to-r from-page via-page-accent to-page border-b border-line backdrop-blur-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo - Dashboard'a veya Home'a link */}
          <Link
            href={user ? "/dashboard" : "/"}
            className="flex items-center min-h-[44px]"
          >
            <div className="flex items-center gap-3 cursor-pointer">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
                <Link2 className="h-6 w-6 text-ink" />
              </div>
              {/*
                <h1> DEGIL. Burasi her sayfada gorunen ust serit; site
                adi, o sayfanin basligi degil. h1 olarak durdugu surece
                HER sayfada iki h1 vardi ve belge sirasinda ONCE bu
                geliyordu -- yani bir kaziyicinin ya da ekran okuyucunun
                gordugu ilk baslik, sayfanin konusu yerine urunun adi
                oluyordu. Olculdu, herkese acik profil sayfasinda:
                ["LinkYoSelf", "Ada Lovelace"]. Oysa o sayfanin konusu
                Ada Lovelace.
              */}
              <span className="text-2xl font-bold text-ink">LinkYoSelf</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            {user
              ? // Dashboard navigation for logged-in users
                dashboardNavItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={aktifMi(item.href) ? "page" : undefined}
                  >
                    <span
                      className={`
                    flex items-center gap-2 px-3 py-2 rounded-lg font-medium transition-colors cursor-pointer
                    ${
                      aktifMi(item.href)
                        ? "bg-purple-600 text-white"
                        : "text-ink-soft hover:text-ink hover:bg-field/50"
                    }
                  `}
                    >
                      <item.icon className="h-4 w-4" />
                      {item.label}
                    </span>
                  </Link>
                ))
              : // Public navigation for non-logged-in users
                publicNavItems.map((item) => (
                  <Link key={item.href} href={item.href}>
                    <span className="text-ink-soft hover:text-ink transition-colors font-medium cursor-pointer">
                      {item.label}
                    </span>
                  </Link>
                ))}

            {/* Admin panel link */}
            {user?.is_admin && (
              <Link href="/admin-panel/users">
                <span className="text-ink-soft hover:text-ink transition-colors font-medium cursor-pointer">
                  {t("common:navigation.users")}
                </span>
              </Link>
            )}
          </nav>

          {/* Desktop Auth/User Area */}
          <div className="hidden md:flex items-center gap-4">
            {/* Tema ve dil dugmeleri kosullu bloklarin disinda: giris
                yapilmis olsun ya da olmasin her zaman erisilebilir
                olmali. Dil dugmesi ozellikle giris ONCESI gerekli --
                kayit formunu okuyamayan biri hesap da acamaz. */}
            <LanguageSwitchButton />
            <ThemeSwitchButton />

            {!isLoaded ? (
              <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
            ) : user ? (
              <>
                {/* Quick Action Buttons */}
                <div className="flex items-center gap-2">
                  <Link href="/links?new=1">
                    <button className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-4 py-2 rounded-lg transition-all">
                      <Plus className="h-4 w-4" />
                      <span className="hidden sm:inline">
                        {t("navigation.addLink")}
                      </span>
                    </button>
                  </Link>

                  {profilAdresi && (
                    <a
                      href={profilAdresi}
                      target="_blank"
                      rel="noopener noreferrer"
                      data-testid="preview-profile"
                      className="flex items-center gap-2 bg-surface-raised hover:bg-field text-ink px-4 py-2 rounded-lg border border-line-strong transition-colors"
                    >
                      <Eye className="h-4 w-4" />
                      <span className="hidden sm:inline">
                        {t("navigation.preview")}
                      </span>
                    </a>
                  )}
                </div>

                {/* User Menu */}
                <div className="relative">
                  <button
                    onClick={handleUserMenuToggle}
                    className="flex items-center gap-2 bg-surface/50 hover:bg-field/50 border border-line rounded-lg px-3 py-2 transition-all duration-200"
                  >
                    {user.profile_image_url ? (
                      <img
                        src={user.profile_image_url}
                        alt={gorunenAd}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                        <User className="h-4 w-4 text-ink" />
                      </div>
                    )}
                    <span className="text-ink font-medium">{gorunenAd}</span>
                    <ChevronDown className="h-4 w-4 text-ink-muted" />
                  </button>

                  {/* User Dropdown Menu */}
                  {userMenuOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setUserMenuOpen(false)}
                      ></div>
                      <div className="absolute right-0 mt-2 w-48 bg-surface-raised border border-line rounded-lg shadow-2xl z-20 py-2">
                        <Link href="/profile">
                          <div
                            className="flex items-center gap-2 px-4 py-2 text-ink-soft hover:text-ink hover:bg-field transition-colors cursor-pointer"
                            onClick={() => setUserMenuOpen(false)}
                          >
                            <User className="h-4 w-4" />
                            {t("common:navigation.profile")}
                          </div>
                        </Link>
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-2 px-4 py-2 text-ink-soft hover:text-ink hover:bg-field transition-colors"
                        >
                          <LogOut className="h-4 w-4" />
                          {t("common:navigation.logout")}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-4">
                <Link href="/sign-in">
                  <button className="text-ink-soft hover:text-ink transition-colors font-medium">
                    {t("common:navigation.signIn")}
                  </button>
                </Link>
                {IS_SIGN_UP_ENABLED && (
                  <Link href="/sign-up">
                    <button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 py-2 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg">
                      {t("common:navigation.signUp")}
                    </button>
                  </Link>
                )}
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={handleMobileMenuToggle}
            // Ikondan ibaret oldugu icin erisilebilir bir adi yoktu.
            aria-label={t("navigation.menu")}
            data-testid="mobile-menu-toggle"
            // 44 piksel: telefonun ana gezinme kontrolu ve p-2 ile 40x40
            // kaliyordu. Ikon 24 piksel; buyuyen yalnizca dokunulabilir alan.
            className="md:hidden flex min-h-[44px] min-w-[44px] items-center justify-center p-2 text-ink hover:text-accent transition-colors"
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-overlay/95 backdrop-blur-lg border-t border-line py-4 space-y-2">
            {user
              ? // Dashboard navigation for mobile
                dashboardNavItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={aktifMi(item.href) ? "page" : undefined}
                  >
                    <div
                      className={`flex items-center gap-2 px-4 py-2 transition-colors rounded-lg mx-2 ${
                        aktifMi(item.href)
                          ? "bg-purple-600 text-white"
                          : "text-ink-soft hover:text-ink hover:bg-field/50"
                      }`}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <item.icon className="h-4 w-4" />
                      {item.label}
                    </div>
                  </Link>
                ))
              : // Public navigation for mobile
                publicNavItems.map((item) => (
                  <Link key={item.href} href={item.href}>
                    <div
                      className="block px-4 py-2 text-ink-soft hover:text-ink hover:bg-field/50 transition-colors rounded-lg mx-2"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {item.label}
                    </div>
                  </Link>
                ))}

            {/* Admin panel for mobile */}
            {user?.is_admin && (
              <Link href="/admin-panel/users">
                <div
                  className="block px-4 py-2 text-ink-soft hover:text-ink hover:bg-field/50 transition-colors rounded-lg mx-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {t("common:navigation.users")}
                </div>
              </Link>
            )}

            {/* Mobil tema dugmesi: masaustundekiyle ayni yerde degil ama
                ayni erisilebilirlikte. */}
            <div className="px-2 pt-2">
              <LanguageSwitchButton genis />
              <ThemeSwitchButton genis />
            </div>

            {/* Mobile Auth Section */}
            <div className="border-t border-line pt-4 mt-4">
              {!isLoaded ? (
                <div className="flex justify-center py-4">
                  <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : user ? (
                <div className="space-y-2 mx-2">
                  <div className="flex items-center gap-3 px-4 py-2 bg-field/50 rounded-lg">
                    {user.profile_image_url ? (
                      <img
                        src={user.profile_image_url}
                        alt={gorunenAd}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                        <User className="h-4 w-4 text-ink" />
                      </div>
                    )}
                    <span className="text-ink font-medium">{gorunenAd}</span>
                  </div>
                  <Link href="/profile">
                    <div
                      className="flex items-center gap-2 px-4 py-2 text-ink-soft hover:text-ink hover:bg-field/50 transition-colors rounded-lg"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <User className="h-4 w-4" />
                      {t("common:navigation.profile")}
                    </div>
                  </Link>
                  <button
                    onClick={() => {
                      handleLogout();
                      setMobileMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-4 py-2 text-ink-soft hover:text-ink hover:bg-field/50 transition-colors rounded-lg"
                  >
                    <LogOut className="h-4 w-4" />
                    {t("common:navigation.logout")}
                  </button>
                </div>
              ) : (
                <div className="space-y-2 mx-2">
                  <Link href="/sign-in">
                    <button
                      className="w-full text-ink-soft hover:text-ink hover:bg-field/50 transition-colors rounded-lg px-4 py-2 text-left"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {t("common:navigation.signIn")}
                    </button>
                  </Link>
                  {IS_SIGN_UP_ENABLED && (
                    <Link href="/sign-up">
                      <button
                        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-4 py-2 rounded-lg font-semibold transition-all duration-200"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        {t("common:navigation.signUp")}
                      </button>
                    </Link>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

export default ResponsiveAppBar;
