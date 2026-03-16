import type { Metadata } from 'next';
import PenhuLandingPage from '@/components/PenhuLandingPage';

export const metadata: Metadata = {
  title: 'Penhu 交易聯盟 - 高階實戰班',
  description: 'Penhu 交易聯盟高階實戰班，機構級交易框架與策略實作。',
};

export default function ProClassPage() {
  return <PenhuLandingPage variant="pro" />;
}
