import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact - LinkYoSelf",
  description:
    "Get in touch with the LinkYoSelf team. We're here to help you build your digital presence.",
};

export default function ContactPage() {
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
                <h1 className="text-white tracking-light text-[32px] font-bold leading-tight md:text-4xl md:font-black md:leading-tight md:tracking-[-0.033em] max-w-[720px]">
                  Contact Us
                </h1>
                <p className="text-white text-base font-normal leading-normal max-w-[720px]">
                  Have questions about LinkYoSelf? Need help with your account?
                  We're here to help! Get in touch with our team.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Contact Form */}
                <div className="flex flex-col gap-6 rounded-lg border border-[#3b4854] bg-[#1c2127] p-6">
                  <h2 className="text-white text-xl font-bold leading-tight">
                    Send us a message
                  </h2>
                  <form className="flex flex-col gap-4">
                    <div className="flex flex-col gap-2">
                      <label className="text-white text-sm font-medium">
                        Name
                      </label>
                      <input
                        type="text"
                        className="bg-[#111518] border border-[#3b4854] rounded-lg px-3 py-2 text-white placeholder-[#9dabb9] focus:border-[#1383eb] focus:outline-none"
                        placeholder="Your name"
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-white text-sm font-medium">
                        Email
                      </label>
                      <input
                        type="email"
                        className="bg-[#111518] border border-[#3b4854] rounded-lg px-3 py-2 text-white placeholder-[#9dabb9] focus:border-[#1383eb] focus:outline-none"
                        placeholder="your.email@example.com"
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-white text-sm font-medium">
                        Subject
                      </label>
                      <input
                        type="text"
                        className="bg-[#111518] border border-[#3b4854] rounded-lg px-3 py-2 text-white placeholder-[#9dabb9] focus:border-[#1383eb] focus:outline-none"
                        placeholder="What's this about?"
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-white text-sm font-medium">
                        Message
                      </label>
                      <textarea
                        rows={5}
                        className="bg-[#111518] border border-[#3b4854] rounded-lg px-3 py-2 text-white placeholder-[#9dabb9] focus:border-[#1383eb] focus:outline-none resize-none"
                        placeholder="Tell us how we can help you..."
                      />
                    </div>
                    <button
                      type="submit"
                      className="bg-[#1383eb] hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                    >
                      Send Message
                    </button>
                  </form>
                </div>

                {/* Contact Info */}
                <div className="flex flex-col gap-6">
                  <div className="flex flex-col gap-3 rounded-lg border border-[#3b4854] bg-[#1c2127] p-6">
                    <h2 className="text-white text-xl font-bold leading-tight">
                      Get in Touch
                    </h2>
                    <div className="flex flex-col gap-4">
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 flex-shrink-0 mt-0.5">
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                            className="text-[#1383eb]"
                          >
                            <path
                              d="M20 4H4C2.9 4 2.01 4.9 2.01 6L2 18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V6C22 4.9 21.1 4 20 4ZM20 8L12 13L4 8V6L12 11L20 6V8Z"
                              fill="currentColor"
                            />
                          </svg>
                        </div>
                        <div>
                          <p className="text-white font-medium">Email</p>
                          <p className="text-[#9dabb9] text-sm">
                            support@linkyoself.com
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 flex-shrink-0 mt-0.5">
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                            className="text-[#1383eb]"
                          >
                            <path
                              d="M12 2C8.13 2 5 5.13 5 9C5 14.25 12 22 12 22S19 14.25 19 9C19 5.13 15.87 2 12 2ZM12 11.5C10.62 11.5 9.5 10.38 9.5 9S10.62 6.5 12 6.5S14.5 7.62 14.5 9S13.38 11.5 12 11.5Z"
                              fill="currentColor"
                            />
                          </svg>
                        </div>
                        <div>
                          <p className="text-white font-medium">Location</p>
                          <p className="text-[#9dabb9] text-sm">
                            Remote Team, Worldwide
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 flex-shrink-0 mt-0.5">
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                            className="text-[#1383eb]"
                          >
                            <path
                              d="M12 2C6.48 2 2 6.48 2 12S6.48 22 12 22S22 17.52 22 12S17.52 2 12 2ZM13 17H11V15H13V17ZM13 13H11V7H13V13Z"
                              fill="currentColor"
                            />
                          </svg>
                        </div>
                        <div>
                          <p className="text-white font-medium">Support Hours</p>
                          <p className="text-[#9dabb9] text-sm">
                            Monday - Friday: 9:00 AM - 6:00 PM UTC
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 rounded-lg border border-[#3b4854] bg-[#1c2127] p-6">
                    <h2 className="text-white text-xl font-bold leading-tight">
                      Frequently Asked Questions
                    </h2>
                    <div className="flex flex-col gap-3">
                      <details className="group">
                        <summary className="text-white cursor-pointer hover:text-[#1383eb] transition-colors">
                          How do I customize my LinkYoSelf page?
                        </summary>
                        <p className="text-[#9dabb9] text-sm mt-2 ml-4">
                          After signing up, you can access the customization
                          options in your dashboard to change themes, colors,
                          and layouts.
                        </p>
                      </details>
                      <details className="group">
                        <summary className="text-white cursor-pointer hover:text-[#1383eb] transition-colors">
                          Is LinkYoSelf free to use?
                        </summary>
                        <p className="text-[#9dabb9] text-sm mt-2 ml-4">
                          Yes! LinkYoSelf offers a free plan with essential
                          features to get you started.
                        </p>
                      </details>
                      <details className="group">
                        <summary className="text-white cursor-pointer hover:text-[#1383eb] transition-colors">
                          Can I track clicks on my links?
                        </summary>
                        <p className="text-[#9dabb9] text-sm mt-2 ml-4">
                          Absolutely! LinkYoSelf provides detailed analytics to
                          track link performance and audience engagement.
                        </p>
                      </details>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}