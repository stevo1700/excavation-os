import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Excavation OS",
  description:
    "Standalone operations dashboard for excavation and earthworks contractors.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
