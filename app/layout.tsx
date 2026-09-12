import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DentalCare Clinic Management System",
  description: "Professional Dental Clinic Management System",
  icons: {
    icon: "/favicon.ico",
  },
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
