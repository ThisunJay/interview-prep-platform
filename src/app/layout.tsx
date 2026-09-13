import type { Metadata, Viewport } from "next";
import { Fraunces, Sora } from "next/font/google";
import { GeminiKeyModal } from "@/components/GeminiKeyModal";
import { StudyBuddyProvider } from "@/components/StudyBuddyProvider";
import { StudyBuddyWidget } from "@/components/StudyBuddyWidget";
import { UserProfileProvider } from "@/components/UserProfileProvider";
import "./globals.css";

const display = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const body = Sora({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Prep — Interview cards",
  description: "Swipe through interview topics and drill randomly.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#071018",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${body.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <UserProfileProvider>
          <StudyBuddyProvider>
            {children}
            <StudyBuddyWidget />
            <GeminiKeyModal />
          </StudyBuddyProvider>
        </UserProfileProvider>
      </body>
    </html>
  );
}
