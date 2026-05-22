"use client";

import { useState, useTransition } from "react";
import { updateProfile } from "@/lib/actions/settings";

interface Props {
  onComplete: () => void;
}

const STEPS = [
  {
    icon: "🌸",
    title: "Welcome to Salah Tracker",
    body: "Your personal prayer companion. Track your 5 daily prayers, build streaks, earn rewards and grow together with friends.",
    action: "Get Started",
  },
  {
    icon: "🕌",
    title: "Log your prayers",
    body: "Mark each prayer as On Time, Late, or Missed. Earn points for every prayer you complete — more for being on time!",
    action: "Next",
  },
  {
    icon: "🔥",
    title: "Build your streak",
    body: "Pray every day to keep your streak alive. Miss a day and it resets — so make every prayer count!",
    action: "Next",
  },
  {
    icon: "✨",
    title: "Earn badges & rank up",
    body: "Complete challenges to unlock badges and climb from Bronze all the way to Diamond rank.",
    action: "Let's go!",
  },
];

export default function Onboarding({ onComplete }: Props) {
  const [step, setStep]   = useState(0);
  const [city, setCity]   = useState("Islamabad");
  const [isPending, startTransition] = useTransition();

  const isLast = step === STEPS.length - 1;

  const handleNext = () => {
    if (isLast) {
      startTransition(async () => {
        await updateProfile("", city); // save city preference
        onComplete();
      });
    } else {
      setStep(s => s + 1);
    }
  };

  const current = STEPS[step];

  return (
    <div
      className="fixed inset-0 z-50 flex md:items-center items-end justify-center"
      style={{ background: "rgba(122,64,53,0.2)", backdropFilter: "blur(6px)" }}
    >
      <div
        className="w-full max-w-md bg-theme-bg md:rounded-3xl rounded-t-3xl px-6 pb-12 pt-8 md:pb-8 md:shadow-2xl"
        style={{ background: "linear-gradient(160deg, #fdf0eb 0%, #f0c8bc 100%)" }}
      >
        {/* Step dots */}
        <div className="flex justify-center gap-2 mb-10">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`rounded-full transition-all duration-300
                ${i === step ? "w-6 h-2 bg-theme-bg0" : "w-2 h-2 bg-nude-300"}`}
            />
          ))}
        </div>

        {/* Content */}
        <div className="text-center mb-10 animate-fade-up" key={step}>
          <p className="text-6xl mb-6">{current.icon}</p>
          <h1 className="font-display text-3xl font-bold text-theme-text mb-4 leading-tight">
            {current.title}
          </h1>
          <p className="font-body text-sm text-theme-text leading-relaxed">{current.body}</p>
        </div>

        {/* City input on last step */}
        {isLast && (
          <div className="mb-6 animate-fade-up">
            <p className="font-body text-xs font-bold tracking-widest text-theme-muted uppercase mb-2 text-center">
              Your City (for prayer times)
            </p>
            <input
              value={city}
              onChange={e => setCity(e.target.value)}
              placeholder="e.g. Islamabad, London, Dubai"
              className="w-full bg-theme-surface border border-theme-border rounded-2xl px-4 py-3 text-theme-text text-sm font-body text-center focus:outline-none focus:border-nude-400 transition-colors"
            />
          </div>
        )}

        <button
          onClick={handleNext}
          disabled={isPending}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-nude-400 to-nude-500 text-white font-bold font-body text-base shadow-md active:scale-95 transition-transform disabled:opacity-60"
        >
          {isPending ? "Setting up..." : current.action}
        </button>

        {step > 0 && (
          <button
            onClick={() => setStep(s => s - 1)}
            className="w-full mt-3 py-2 font-body text-sm text-theme-muted"
          >
            Back
          </button>
        )}
      </div>
    </div>
  );
}
