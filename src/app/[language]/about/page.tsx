import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About - LinkYoSelf',
  description: 'Learn more about LinkYoSelf and our mission to connect creators with their audience.',
};

export default function AboutPage() {
  return (
    <div
      className="relative flex w-full min-h-screen flex-col bg-[#111518] overflow-x-hidden"
      style={{ fontFamily: '"Plus Jakarta Sans", "Noto Sans", sans-serif' }}
    >
      <div className="flex h-full grow flex-col">
        <div className="px-4 md:px-10 lg:px-20 xl:px-40 flex flex-1 justify-center py-5">
          <div className="layout-content-container flex flex-col max-w-[960px] flex-1">
            <div className="flex flex-col gap-10 px-4 py-10 md:py-16">
              <div className="flex flex-col gap-4">
                <h1
                  className="text-white tracking-light text-[32px] font-bold leading-tight md:text-4xl md:font-black md:leading-tight md:tracking-[-0.033em] max-w-[720px]"
                >
                  About LinkYoSelf
                </h1>
                <p className="text-white text-base font-normal leading-normal max-w-[720px]">
                  LinkYoSelf is the ultimate solution for creators, influencers, and professionals who want to share all their important content through one simple link.
                </p>
              </div>

              <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-3 rounded-lg border border-[#3b4854] bg-[#1c2127] p-6">
                  <h2 className="text-white text-xl font-bold leading-tight">Our Mission</h2>
                  <p className="text-[#9dabb9] text-base font-normal leading-normal">
                    We believe that sharing your digital presence shouldn't be complicated. That's why we created LinkYoSelf - 
                    to give you one powerful link that connects your audience to everything you create and share online.
                  </p>
                </div>

                <div className="flex flex-col gap-3 rounded-lg border border-[#3b4854] bg-[#1c2127] p-6">
                  <h2 className="text-white text-xl font-bold leading-tight">What We Offer</h2>
                  <ul className="text-[#9dabb9] text-base font-normal leading-normal space-y-2">
                    <li>• Customizable link-in-bio pages</li>
                    <li>• Analytics and insights</li>
                    <li>• Multiple themes and layouts</li>
                    <li>• Easy content management</li>
                    <li>• Mobile-optimized designs</li>
                  </ul>
                </div>

                <div className="flex flex-col gap-3 rounded-lg border border-[#3b4854] bg-[#1c2127] p-6">
                  <h2 className="text-white text-xl font-bold leading-tight">Why Choose LinkYoSelf?</h2>
                  <p className="text-[#9dabb9] text-base font-normal leading-normal">
                    Unlike other platforms, LinkYoSelf focuses on simplicity without sacrificing functionality. 
                    We provide powerful tools that are easy to use, helping you build meaningful connections with your audience.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
