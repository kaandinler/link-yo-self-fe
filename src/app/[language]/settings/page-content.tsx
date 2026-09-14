"use client";

import React, { useState } from "react";
import {
  AlertTriangle,
  ExternalLink,
  Link2,
  User as UserIcon,
} from "lucide-react";
import Link from "next/link";
import { useDeleteMyAccountService } from "@/services/api/services/users";
import { useProfile } from "@/services/api/services/onboarding";
import { getErrorMessage } from "@/services/api/api-errors";
import HTTP_CODES_ENUM from "@/services/api/types/http-codes";
import useAuthActions from "@/services/auth/use-auth-actions";
import withPageRequiredAuth from "@/services/auth/with-page-required-auth";
import useConfirmDialog from "@/components/confirm-dialog/use-confirm-dialog";
import useLanguage from "@/services/i18n/use-language";

function Settings() {
  const language = useLanguage();
  const { logOut } = useAuthActions();
  const { confirmDialog } = useConfirmDialog();
  const { data: profile } = useProfile();
  const deleteMyAccount = useDeleteMyAccountService();

  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!password) {
      setError("Enter your password to confirm.");
      return;
    }

    const confirmed = await confirmDialog({
      title: "Close your account?",
      message:
        "Your profile page and all of your links will stop working. This cannot be undone.",
      successButtonText: "Close account",
      cancelButtonText: "Keep my account",
    });

    if (!confirmed) return;

    setIsDeleting(true);
    try {
      const { status, data } = await deleteMyAccount({ password });

      if (status === HTTP_CODES_ENUM.NO_CONTENT) {
        // Oturum artik backend'de gecersiz; yerel token'lari da temizliyoruz.
        await logOut();

        // Tam sayfa yuklemesi ile ana sayfaya donuyoruz. router.replace ile
        // denendiginde sayfanin auth guard'i once davraniyor ve kullaniciyi
        // sign-in?returnTo=/settings adresine atiyordu: kapatilmis bir hesabin
        // ayar sayfasina donmeyi vaat eden bir adres. Tam yukleme ayrica
        // react-query onbellegini de sifirliyor.
        window.location.replace(`/${language}`);
        return;
      }

      setError(
        getErrorMessage(data, "Your account could not be closed. Try again.")
      );
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 p-4 md:p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Settings</h1>
          <p className="text-gray-400 mt-1">Manage your account and profile</p>
        </div>

        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-6 space-y-4">
          <h2 className="text-lg font-semibold text-white">Account</h2>

          <div className="flex items-center gap-3 text-gray-300">
            <UserIcon className="h-4 w-4 shrink-0 text-gray-400" />
            <span className="break-all">{profile?.email ?? "—"}</span>
          </div>
          <div className="flex items-center gap-3 text-gray-300">
            <Link2 className="h-4 w-4 shrink-0 text-gray-400" />
            <span className="break-all font-mono">
              {profile?.username ? `/${language}/${profile.username}` : "—"}
            </span>
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            <Link
              href={`/${language}/profile/edit`}
              className="inline-flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Edit profile
            </Link>
            <Link
              href={`/${language}/profile/customize`}
              className="inline-flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Customize page
            </Link>
            {profile?.username && (
              <Link
                href={`/${language}/${profile.username}`}
                className="inline-flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <ExternalLink className="h-4 w-4" />
                View public page
              </Link>
            )}
          </div>
        </div>

        {/* Tehlikeli bolge */}
        <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-6">
          <div className="flex items-start gap-3 mb-4">
            <AlertTriangle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
            <div>
              <h2 className="text-lg font-semibold text-white">
                Close your account
              </h2>
              <p className="text-gray-300 text-sm mt-1">
                Your profile page and all of your links will stop working, and
                you will be signed out everywhere. This cannot be undone.
              </p>
            </div>
          </div>

          <form onSubmit={handleDelete} className="space-y-3">
            <label
              htmlFor="delete-account-password"
              className="block text-sm text-gray-300"
            >
              Confirm with your password
            </label>
            <input
              id="delete-account-password"
              name="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                setError(null);
              }}
              className="w-full md:max-w-sm bg-gray-900/60 border border-gray-600 focus:border-red-400 outline-none text-white rounded-lg px-3 py-2"
            />

            {error && <p className="text-red-300 text-sm">{error}</p>}

            <button
              type="submit"
              disabled={isDeleting}
              className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg transition-colors"
            >
              {isDeleting ? "Closing…" : "Close my account"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default withPageRequiredAuth(Settings);
