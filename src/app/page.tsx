import { ChatInterface } from '@/components/ChatInterface';

export const dynamic = 'force-dynamic';

export default function Home() {
  return (
    <main className="h-screen w-screen overflow-hidden">
      <ChatInterface />
    </main>
  );
}
