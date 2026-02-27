import type { Metadata } from "next";
import { Inter, DM_Sans } from "next/font/google";
import "./globals.css";
import { WalletProvider } from "@/components/wallet";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Lumina | Onchain Music Social",
  description: "Discover music on Audius, connect on Tapestry, and build your onchain tastemaker reputation.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <script src="https://code.iconify.design/iconify-icon/1.0.7/iconify-icon.min.js" async></script>
      </head>
      <body suppressHydrationWarning className={`${inter.variable} ${dmSans.variable} antialiased bg-zinc-50 text-zinc-900 selection:bg-zinc-900 selection:text-white overflow-x-hidden`}>
        <WalletProvider>
          <div className="grid-lines">
            <div className="grid-line"></div>
            <div className="grid-line hidden md:block"></div>
            <div className="grid-line hidden md:block"></div>
            <div className="grid-line"></div>
          </div>
          <div className="relative z-10">
            {children}
          </div>
        </WalletProvider>
      </body>
    </html>
  );
}
