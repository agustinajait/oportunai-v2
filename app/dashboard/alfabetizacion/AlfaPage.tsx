'use client';

import { useRouter } from 'next/navigation';
import AlfaQuiz from '@/components/ui/AlfaQuiz';

export default function AlfaPage() {
  const router = useRouter();

  async function handleComplete(score: number, badge: string) {
    await fetch('/api/user/alfa', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ score, badge }),
    });
    router.push('/dashboard');
  }

  function handleSkip() {
    router.push('/dashboard');
  }

  return (
    <div className="min-h-screen bg-[#f5f4f0] flex items-center justify-center py-10">
      <AlfaQuiz onComplete={handleComplete} onSkip={handleSkip} />
    </div>
  );
}
