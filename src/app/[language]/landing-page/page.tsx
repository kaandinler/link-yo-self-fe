import LandingPage from './page-content';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'LinkYoSelf - Share everything with one link',
  description:
    'LinkYoSelf is the launchpad to your online world. One link to share everything you create.',
  openGraph: {
    title: 'LinkYoSelf - Share everything with one link',
    description:
      'LinkYoSelf is the launchpad to your online world. One link to share everything you create.',
    images: [
      {
        url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC601svHqjyfQ0xgTj1L6Ti297x9dAPR1CzFv40D15flcyBbx92WcZfsIlE-TmD1XupaHcHM6VZYdhDxQ3U0dnMscqDkSRYJ11kNSN7NElt2WrbyNDlcMRgbrxRpVrYBgVKHcEYJPbP50SATUKRyQQ8qbSqi38pjbS0S8f03OOY3PMALnrErD1c9Kp9wR9rZXxsguaRp6qm-3ePPcbzGbJkWqBM8695MrDGRP83BGfrnBTY8OftttgOrqGaqyzcp2cRxvBl_-t736jw',
        width: 1200,
        height: 630,
        alt: 'LinkYoSelf landing page',
      },
    ],
    type: 'website',
  },
};

export default function Page() {
  return <LandingPage />;
}
