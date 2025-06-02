"use client";
import { useState } from "react";
import { usePathname } from "next/navigation";
import useAuth from "@/services/auth/use-auth";
import useAuthActions from "@/services/auth/use-auth-actions";
import { useTranslation } from "@/services/i18n/client";
import Link from "@/components/link";
import { RoleEnum } from "@/services/api/types/role";
import { IS_SIGN_UP_ENABLED } from "@/services/auth/config";
import { Menu, X, User, LogOut, Settings, ChevronDown } from "lucide-react";
import { Link as LinkIcon, Users, BarChart3, Palette, Star, ArrowRight } from "lucide-react";

// Logo SVG bileşeni
const LogoIcon = () => (
  <svg
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    className="text-white"
  >
    <path
      d="M36.7273 44C33.9891 44 31.6043 39.8386 30.3636 33.69C29.123 39.8386 26.7382 44 24 44C21.2618 44 18.877 39.8386 17.6364 33.69C16.3957 39.8386 14.0109 44 11.2727 44C7.25611 44 4 35.0457 4 24C4 12.9543 7.25611 4 11.2727 4C14.0109 4 16.3957 8.16144 17.6364 14.31C18.877 8.16144 21.2618 4 24 4C26.7382 4 29.123 8.16144 30.3636 14.31C31.6043 8.16144 33.9891 4 36.7273 4C40.7439 4 44 12.9543 44 24C44 35.0457 40.7439 44 36.7273 44Z"
      fill="currentColor"
    />
  </svg>
);

function ResponsiveAppBar() {
  const { t } = useTranslation("common");
  const { user, isLoaded } = useAuth();
  const { logOut } = useAuthActions();
  const pathname = usePathname();
  
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  // Landing page'de navbar'ı gizle - KALDIRIYORUZ, her sayfada gösterelim
  // const isLandingPage = pathname?.includes('/landing-page') || pathname === '/' || pathname?.match(/^\/[a-z]{2}$/);
  
  // if (isLandingPage) {
  //   return null;
  // }

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

  return (
    <header className="sticky top-0 z-50 bg-gradient-to-r from-gray-900 via-purple-900 to-gray-900 border-b border-gray-800 backdrop-blur-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo - Desktop & Mobile */}
          <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
                        <LinkIcon className="h-6 w-6 text-white" />
                      </div>
                      <h1 className="text-2xl font-bold text-white">LinkYoSelf</h1>
                    </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <Link href="/">
              <span className="text-gray-300 hover:text-white transition-colors font-medium cursor-pointer">
                Home
              </span>
            </Link>
            <Link href="/about">
              <span className="text-gray-300 hover:text-white transition-colors font-medium cursor-pointer">
                About
              </span>
            </Link>
            <Link href="/contact">
              <span className="text-gray-300 hover:text-white transition-colors font-medium cursor-pointer">
                Contact
              </span>
            </Link>
            {user?.role && [RoleEnum.ADMIN].includes(Number(user?.role?.id)) && (
              <Link href="/admin-panel/users">
                <span className="text-gray-300 hover:text-white transition-colors font-medium cursor-pointer">
                  {t("common:navigation.users")}
                </span>
              </Link>
            )}
          </nav>

          {/* Desktop Auth/User Area */}
          <div className="hidden md:flex items-center gap-4">
            {!isLoaded ? (
              <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
            ) : user ? (
              <div className="relative">
                <button
                  onClick={handleUserMenuToggle}
                  className="flex items-center gap-2 bg-gray-800/50 hover:bg-gray-700/50 border border-gray-700 rounded-lg px-3 py-2 transition-all duration-200"
                >
                  {user.photo?.path ? (
                    <img
                      src={user.photo.path}
                      alt={`${user.firstName} ${user.lastName}`}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                      <User className="h-4 w-4 text-white" />
                    </div>
                  )}
                  <span className="text-white font-medium">
                    {user.firstName || user.email}
                  </span>
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                </button>

                {/* User Dropdown Menu */}
                {userMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setUserMenuOpen(false)}
                    ></div>
                    <div className="absolute right-0 mt-2 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-2xl z-20 py-2">
                    <Link href="/profile">
                        <div
                          className="flex items-center gap-2 px-4 py-2 text-gray-300 hover:text-white hover:bg-gray-700 transition-colors cursor-pointer"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          <User className="h-4 w-4" />
                          {t("common:navigation.profile")}
                        </div>
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-4 py-2 text-gray-300 hover:text-white hover:bg-gray-700 transition-colors"
                      >
                        <LogOut className="h-4 w-4" />
                        {t("common:navigation.logout")}
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <Link href="/sign-in">
                  <button className="text-gray-300 hover:text-white transition-colors font-medium">
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
            className="md:hidden p-2 text-white hover:text-purple-300 transition-colors"
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
          <div className="md:hidden bg-gray-800/95 backdrop-blur-lg border-t border-gray-700 py-4 space-y-2">
            <Link href="/">
              <div
                className="block px-4 py-2 text-gray-300 hover:text-white hover:bg-gray-700/50 transition-colors rounded-lg mx-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Home
              </div>
            </Link>
            <Link href="/about">
              <div
                className="block px-4 py-2 text-gray-300 hover:text-white hover:bg-gray-700/50 transition-colors rounded-lg mx-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                About
              </div>
            </Link>
            <Link href="/contact">
              <div
                className="block px-4 py-2 text-gray-300 hover:text-white hover:bg-gray-700/50 transition-colors rounded-lg mx-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Contact
              </div>
            </Link>
            {user?.role && [RoleEnum.ADMIN].includes(Number(user?.role?.id)) && (
              <Link href="/admin-panel/users">
                <div
                  className="block px-4 py-2 text-gray-300 hover:text-white hover:bg-gray-700/50 transition-colors rounded-lg mx-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {t("common:navigation.users")}
                </div>
              </Link>
            )}

            {/* Mobile Auth Section */}
            <div className="border-t border-gray-700 pt-4 mt-4">
              {!isLoaded ? (
                <div className="flex justify-center py-4">
                  <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : user ? (
                <div className="space-y-2 mx-2">
                  <div className="flex items-center gap-3 px-4 py-2 bg-gray-700/50 rounded-lg">
                    {user.photo?.path ? (
                      <img
                        src={user.photo.path}
                        alt={`${user.firstName} ${user.lastName}`}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                        <User className="h-4 w-4 text-white" />
                      </div>
                    )}
                    <span className="text-white font-medium">
                      {user.firstName || user.email}
                    </span>
                  </div>
                  <Link href="/profile">
                    <div
                      className="flex items-center gap-2 px-4 py-2 text-gray-300 hover:text-white hover:bg-gray-700/50 transition-colors rounded-lg"
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
                    className="w-full flex items-center gap-2 px-4 py-2 text-gray-300 hover:text-white hover:bg-gray-700/50 transition-colors rounded-lg"
                  >
                    <LogOut className="h-4 w-4" />
                    {t("common:navigation.logout")}
                  </button>
                </div>
              ) : (
                <div className="space-y-2 mx-2">
                  <Link href="/sign-in">
                    <button
                      className="w-full text-gray-300 hover:text-white hover:bg-gray-700/50 transition-colors rounded-lg px-4 py-2 text-left"
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