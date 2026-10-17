import type { Metadata } from "next";
import { Roboto } from "next/font/google";
import { auth } from "@/auth";
import { Providers } from "@/components/Providers";
import { siteConfig, siteVariant } from "@/lib/site-variant";

const roboto = Roboto({
  variable: "--font-roboto",
  subsets: ["latin", "cyrillic"],
  weight: ["300", "400", "500", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: siteConfig.title,
  description: siteConfig.description,
  icons: { icon: siteConfig.favicon },
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const session = await auth();
  return (
    <html
      lang={
        siteVariant === "languages" && session?.user.siteType === "languages"
          ? session.user.uiLanguage
          : siteConfig.defaultLocale
      }
      className={roboto.variable}
    >
      <body suppressHydrationWarning>
        <Providers session={session}>{children}</Providers>
      </body>
    </html>
  );
}
