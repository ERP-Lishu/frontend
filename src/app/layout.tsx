import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import { AppLayout } from "@/components/layout/AppLayout";
import { QueryProvider } from "@/lib/providers/QueryProvider";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-poppins",
  display: "swap",
});

export const metadata: Metadata = {
  title: "GarmentFlow ERP — Karobar",
  description: "Karobar Garment Business ERP",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`h-full ${poppins.variable}`}>
      <body className="h-full">
        <QueryProvider>
          <AppLayout>{children}</AppLayout>
        </QueryProvider>
      </body>
    </html>
  );
}
