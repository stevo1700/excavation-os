import type { Appearance } from "@clerk/types";

// Shared Clerk appearance for the sign-in / sign-up flows, matching the app's
// dark sidebar + amber accent theme (see tailwind.config.ts).
export const authAppearance: Appearance = {
  variables: {
    colorPrimary: "#f59e0b", // brand-500
    colorBackground: "#171a21", // surface-800
    colorText: "#f1f5f9", // slate-100
    colorTextSecondary: "#94a3b8", // slate-400
    colorInputBackground: "#0f1115", // surface-900
    colorInputText: "#f1f5f9",
    colorTextOnPrimaryBackground: "#0f1115",
    borderRadius: "0.5rem",
  },
  elements: {
    card: "bg-surface-800 border border-surface-600 shadow-xl",
    headerTitle: "text-slate-100",
    headerSubtitle: "text-slate-400",
    socialButtonsBlockButton:
      "border-surface-600 text-slate-200 hover:bg-surface-700",
    dividerLine: "bg-surface-600",
    dividerText: "text-slate-500",
    formFieldLabel: "text-slate-300",
    formButtonPrimary:
      "bg-brand-500 text-surface-900 hover:bg-brand-400 font-semibold",
    footerActionText: "text-slate-400",
    footerActionLink: "text-brand-400 hover:text-brand-300",
    formFieldInputShowPasswordButton: "text-slate-400",
  },
};
