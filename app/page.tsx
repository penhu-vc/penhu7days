import type { Metadata } from 'next';
import PenhuLandingPage from '@/components/PenhuLandingPage';

export const metadata: Metadata = {
  title: 'Penhu 交易聯盟 - 新手七天陪跑課',
  description: 'Penhu 交易聯盟的新手入門課程，七天帶你入門加密貨幣交易。',
};

export default function HomePage() {
  return <PenhuLandingPage variant="starter" />;
}
