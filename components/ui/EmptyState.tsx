"use client";

interface Props {
  icon: string;
  title: string;
  body: string;
  action?: { label: string; onClick: () => void };
}

export default function EmptyState({ icon, title, body, action }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <p className="text-5xl mb-4">{icon}</p>
      <p className="font-display text-xl font-bold text-nude-700 mb-2">{title}</p>
      <p className="font-body text-sm text-nude-400 leading-relaxed mb-6">{body}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="px-6 py-3 rounded-2xl bg-gradient-to-r from-nude-400 to-nude-500 text-white font-bold font-body text-sm active:scale-95 transition-transform"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
