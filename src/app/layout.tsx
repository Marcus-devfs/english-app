import type { Metadata, Viewport } from "next";
import { Hanken_Grotesk } from "next/font/google";
import { ServiceWorkerProvider } from "@/components/pwa/service-worker-provider";
import "./globals.css";

const hanken = Hanken_Grotesk({
  variable: "--font-hanken",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const APP_NAME = "Norte";
const APP_TITLE = "Norte — Inglês com IA";
const APP_DESCRIPTION =
  "Aprenda inglês com professor IA. Trilha personalizada, lições diárias e conversação.";

export const metadata: Metadata = {
  applicationName: APP_NAME,
  title: {
    default: APP_TITLE,
    template: `%s — ${APP_NAME}`,
  },
  description: APP_DESCRIPTION,
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: APP_NAME,
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/icons/norte-icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/norte-icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/norte-icon-192.png", sizes: "192x192", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#2F48E0",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${hanken.variable} h-full antialiased`}>
      <body className="min-h-full">
        <ServiceWorkerProvider>{children}</ServiceWorkerProvider>
      </body>
    </html>
  );
}
