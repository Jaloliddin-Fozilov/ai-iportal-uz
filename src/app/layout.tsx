import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'iportal-ai — ai.iportal.uz | Taqsimlangan Bepul AI Platformasi',
  description: 'Groq, Gemini 2.0, SambaNova, Cerebras va ko\'p hostingli bepul AI klasteri. OpenAI-mos API va zamonaviy web chat.',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="uz" className="dark h-full">
      <body className="h-full bg-[#090b10] text-[#f0f4f8] antialiased select-auto">
        {children}
      </body>
    </html>
  );
}
