import type { Metadata } from "next";
import { Roboto } from "next/font/google";
import { auth } from "@/auth";
import { Providers } from "@/components/Providers";

const roboto = Roboto({
  variable: "--font-roboto",
  subsets: ["latin", "cyrillic"],
  weight: ["300", "400", "500", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Математика з Анастасією",
  description: "Платформа для репетитора з математики",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const session = await auth();
  return (
    <html lang="uk" className={roboto.variable}>
      <body suppressHydrationWarning>
        <Providers session={session}>{children}</Providers>
      </body>
    </html>
  );
}
