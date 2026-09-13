// app/[language]/page.tsx - Ana sayfa
"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import useAuth from "@/services/auth/use-auth";
import { determineUserDestination } from "@/services/auth/user-routing-utils";
import LandingPage from "./landing-page/page-content";
import LoadingSpinner from "@/components/loading-spinner";

const HomePage: React.FC = () => {
  const { user, isLoaded } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && user) {
      // Giriş yapmış kullanıcıyı uygun sayfaya yönlendir
      const destination = determineUserDestination(user, "/");
      if (destination) {
        router.push(destination);
      }
    }
  }, [user, isLoaded, router]);

  // Loading state
  if (!isLoaded) {
    return <LoadingSpinner text="Loading your account..." fullScreen={true} />;
  }

  // Giriş yapmamış kullanıcı için landing page
  if (!user) {
    return <LandingPage />;
  }

  // Giriş yapmış kullanıcı yönlendirilirken loading
  return (
    <LoadingSpinner text="Redirecting to your dashboard..." fullScreen={true} />
  );
};

export default HomePage;
