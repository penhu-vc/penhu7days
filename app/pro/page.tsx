import type { Metadata } from 'next';
import ProV2LandingPage from './prov2-client';

export const metadata: Metadata = {
  title: 'PENHU 交易聯盟 - 7天實戰班（一階） V2',
  description: 'PENHU 交易聯盟 7 天實戰班（一階）高轉化新版單頁，本地提案版。',
  openGraph: {
    title: 'PENHU 交易聯盟 - 7天實戰班（一階） V2',
    description: 'PENHU 交易聯盟 7 天實戰班（一階）高轉化新版單頁，本地提案版。',
    url: 'https://penhu.xyz/prov2',
    siteName: 'PENHU 交易聯盟',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PENHU 交易聯盟 - 7天實戰班（一階） V2',
    description: 'PENHU 交易聯盟 7 天實戰班（一階）高轉化新版單頁，本地提案版。',
  },
};

export default function ProV2Page() {
  return <ProV2LandingPage />;
}
