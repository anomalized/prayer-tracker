"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { verifyMagicLink } from "@/lib/actions/auth";

export default function MagicLinkCallback() {
  const router = useRouter();
  const [state, setState] = useState<"verifying" | "success" | "error">("verifying");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const verify = async () => {
      try {
        const result = await verifyMagicLink();

        if (result.success) {
          setState("success");
          setMessage("Welcome! Signing you in...");
          
          // Redirect after 1.5 seconds
          setTimeout(() => {
            router.push("/dashboard/today");
            router.refresh();
          }, 1500);
        } else {
          setState("error");
          setMessage("Magic link expired or invalid. Please try again.");
          
          // Redirect to magic link page after 3 seconds
          setTimeout(() => {
            router.push("/auth/magiclink");
          }, 3000);
        }
      } catch (error) {
        if (process.env.NODE_ENV === "development") console.error("[MagicLinkCallback]", error);
        setState("error");
        setMessage("Something went wrong. Please try again.");
        
        setTimeout(() => {
          router.push("/auth/magiclink");
        }, 3000);
      }
    };

    verify();
  }, [router]);

  return (
    <div className="animate-fade-up text-center">
      {state === "verifying" && (
        <>
          <div className="mb-5 animate-spin">
            <p className="text-4xl">✨</p>
          </div>
          <h1 className="font-display text-3xl font-bold text-nude-800 mb-3">
            Verifying your magic link...
          </h1>
          <p className="text-nude-600 text-sm">Please wait while we securely sign you in.</p>
        </>
      )}

      {state === "success" && (
        <>
          <p className="text-5xl mb-5 animate-bounce">✨</p>
          <h1 className="font-display text-3xl font-bold text-nude-800 mb-3">
            Magic worked! 🎉
          </h1>
          <div className="bg-white rounded-3xl shadow-sm border border-nude-200 p-6">
            <p className="font-body text-sm text-nude-600 leading-relaxed">
              {message}
            </p>
          </div>
        </>
      )}

      {state === "error" && (
        <>
          <p className="text-5xl mb-5">⚠️</p>
          <h1 className="font-display text-3xl font-bold text-nude-800 mb-3">
            Oops! Something went wrong
          </h1>
          <div className="bg-red-50 border border-red-200 rounded-3xl shadow-sm p-6">
            <p className="font-body text-sm text-red-700 leading-relaxed mb-4">
              {message}
            </p>
            <p className="font-body text-xs text-red-600">
              Redirecting you back...
            </p>
          </div>
        </>
      )}
    </div>
  );
}
