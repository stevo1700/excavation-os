import type { Metadata, Viewport } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { SWRegister } from "./sw-register";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Excavation OS",
    template: "%s | Excavation OS",
  },
  description:
    "Standalone operations dashboard for excavation and earthworks contractors.",
  manifest: "/manifest.json",
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
};

export const viewport: Viewport = {
  themeColor: "#f59e0b",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider signInUrl="/sign-in" signUpUrl="/sign-up">
      <html lang="en">
        <body>
          {children}
          <SWRegister />
        </body>
      </html>
    </ClerkProvider>
  );
}
