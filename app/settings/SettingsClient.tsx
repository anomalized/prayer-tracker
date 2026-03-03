"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateProfile, updatePassword, signOut, deleteAccount } from "@/lib/actions/settings";

interface Props {
  userId: string;
  fullName: string;
  email: string;
  city: string;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-nude-100 rounded-3xl overflow-hidden shadow-sm">
      <div className="px-4 py-3 border-b border-nude-100 bg-nude-50">
        <p className="font-body text-xs font-bold tracking-widest text-nude-500 uppercase">{title}</p>
      </div>
      <div className="divide-y divide-nude-50">{children}</div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="px-4 py-3">
      <p className="font-body text-xs text-nude-400 mb-1.5">{label}</p>
      {children}
    </div>
  );
}

export default function SettingsClient({ userId, fullName, email, city }: Props) {
  const router = useRouter();
  const [name, setName]         = useState(fullName);
  const [userCity, setUserCity] = useState(city);
  const [newPass, setNewPass]   = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [showDelete, setShowDelete]   = useState(false);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);
  const [isPending, startTransition] = useTransition();

  const showMsg = (text: string, ok: boolean) => {
    setMessage({ text, ok });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleSaveProfile = () => {
    if (!name.trim()) return;
    startTransition(async () => {
      const res = await updateProfile(name.trim(), userCity.trim());
      if (res.error) showMsg(res.error, false);
      else showMsg("Profile updated! 🌸", true);
    });
  };

  const handleSavePassword = () => {
    if (newPass.length < 8) return showMsg("Password must be at least 8 characters.", false);
    if (newPass !== confirmPass) return showMsg("Passwords don't match.", false);
    startTransition(async () => {
      const res = await updatePassword(newPass);
      if (res.error) showMsg(res.error, false);
      else { showMsg("Password updated!", true); setNewPass(""); setConfirmPass(""); }
    });
  };

  const handleSignOut = () => {
    startTransition(async () => { await signOut(); });
  };

  const handleDeleteAccount = () => {
    startTransition(async () => { await deleteAccount(); });
  };

  return (
    <div className="min-h-screen bg-nude-50">
      {/* Header */}
      <div className="bg-gradient-to-b from-nude-200 to-nude-100 px-5 pt-12 pb-6 relative overflow-hidden">
        <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-nude-300 opacity-20" />
        <button
          onClick={() => router.back()}
          className="font-body text-sm text-nude-600 mb-4 flex items-center gap-1"
        >
          ← Back
        </button>
        <h1 className="font-display text-3xl font-bold text-nude-800">Settings ⚙️</h1>
        <p className="font-body text-sm text-nude-500 mt-1">{email}</p>
      </div>

      <div className="px-4 py-4 space-y-4">

        {/* Toast */}
        {message && (
          <div className={`rounded-2xl px-4 py-3 text-sm font-body text-center
            ${message.ok ? "bg-green-50 text-green-600 border border-green-100" : "bg-red-50 text-red-400 border border-red-100"}`}>
            {message.text}
          </div>
        )}

        {/* Profile */}
        <Section title="Profile">
          <Row label="Display Name">
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full bg-nude-50 border border-nude-200 rounded-2xl px-4 py-2.5 text-nude-800 text-sm font-body focus:outline-none focus:border-nude-400 transition-colors"
            />
          </Row>
          <Row label="City (for prayer times)">
            <input
              value={userCity}
              onChange={e => setUserCity(e.target.value)}
              placeholder="e.g. Islamabad, London, Dubai"
              className="w-full bg-nude-50 border border-nude-200 rounded-2xl px-4 py-2.5 text-nude-800 text-sm font-body focus:outline-none focus:border-nude-400 transition-colors"
            />
          </Row>
          <div className="px-4 py-3">
            <button
              onClick={handleSaveProfile}
              disabled={isPending}
              className="w-full py-2.5 rounded-2xl bg-gradient-to-r from-nude-400 to-nude-500 text-white font-bold font-body text-sm disabled:opacity-60 active:scale-95 transition-transform"
            >
              Save Changes 🌸
            </button>
          </div>
        </Section>

        {/* Password */}
        <Section title="Change Password">
          <Row label="New Password">
            <input
              type="password"
              value={newPass}
              onChange={e => setNewPass(e.target.value)}
              placeholder="min. 8 characters"
              className="w-full bg-nude-50 border border-nude-200 rounded-2xl px-4 py-2.5 text-nude-800 text-sm font-body focus:outline-none focus:border-nude-400 transition-colors"
            />
          </Row>
          <Row label="Confirm New Password">
            <input
              type="password"
              value={confirmPass}
              onChange={e => setConfirmPass(e.target.value)}
              placeholder="repeat password"
              className="w-full bg-nude-50 border border-nude-200 rounded-2xl px-4 py-2.5 text-nude-800 text-sm font-body focus:outline-none focus:border-nude-400 transition-colors"
            />
          </Row>
          <div className="px-4 py-3">
            <button
              onClick={handleSavePassword}
              disabled={isPending || !newPass}
              className="w-full py-2.5 rounded-2xl bg-nude-100 text-nude-700 font-bold font-body text-sm disabled:opacity-40 active:scale-95 transition-transform hover:bg-nude-200"
            >
              Update Password
            </button>
          </div>
        </Section>

        {/* App info */}
        <Section title="About">
          <div className="px-4 py-3 flex justify-between items-center">
            <p className="font-body text-sm text-nude-600">App Version</p>
            <p className="font-body text-sm text-nude-400">1.0.0</p>
          </div>
          <div className="px-4 py-3 flex justify-between items-center">
            <p className="font-body text-sm text-nude-600">Prayer API</p>
            <p className="font-body text-sm text-nude-400">Aladhan</p>
          </div>
          <div className="px-4 py-3 flex justify-between items-center">
            <p className="font-body text-sm text-nude-600">Install as App</p>
            <p className="font-body text-xs text-nude-400 bg-nude-100 px-3 py-1 rounded-xl">
              Use browser → Add to Home Screen
            </p>
          </div>
        </Section>

        {/* Account actions */}
        <Section title="Account">
          <div className="px-4 py-3">
            <button
              onClick={handleSignOut}
              disabled={isPending}
              className="w-full py-2.5 rounded-2xl bg-nude-100 text-nude-600 font-bold font-body text-sm disabled:opacity-60 active:scale-95 transition-transform hover:bg-nude-200"
            >
              Sign Out
            </button>
          </div>
          <div className="px-4 py-3">
            {!showDelete ? (
              <button
                onClick={() => setShowDelete(true)}
                className="w-full py-2.5 rounded-2xl bg-red-50 text-red-400 font-bold font-body text-sm active:scale-95 transition-transform hover:bg-red-100"
              >
                Delete Account
              </button>
            ) : (
              <div className="space-y-2">
                <p className="font-body text-xs text-red-400 text-center">
                  This will permanently delete all your data. Are you sure?
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowDelete(false)}
                    className="flex-1 py-2.5 rounded-2xl bg-nude-100 text-nude-600 font-bold font-body text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteAccount}
                    disabled={isPending}
                    className="flex-1 py-2.5 rounded-2xl bg-red-100 text-red-500 font-bold font-body text-sm disabled:opacity-60"
                  >
                    Yes, delete
                  </button>
                </div>
              </div>
            )}
          </div>
        </Section>

        <p className="text-center text-xs text-nude-300 font-body pb-4">
          Made with 🌸 for your spiritual journey
        </p>
      </div>
    </div>
  );
}
