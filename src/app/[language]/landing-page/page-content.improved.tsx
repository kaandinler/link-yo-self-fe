"use client";

import React from "react";
import Link from "next/link";

export default function LandingPage() {
  return (
    <div
      className="relative flex w-full min-h-screen flex-col bg-[#111518] overflow-x-hidden"
      style={{ fontFamily: '"Plus Jakarta Sans", "Noto Sans", sans-serif' }}
    >
      <div className="flex h-full grow flex-col">
        <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-b-[#283139] px-4 sm:px-10 py-3 sticky top-0 bg-[#111518] z-10">
          <div className="flex items-center gap-4 text-white">
            <div className="w-4 h-4">
              <svg
                viewBox="0 0 48 48"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M36.7273 44C33.9891 44 31.6043 39.8386 30.3636 33.69C29.123 39.8386 26.7382 44 24 44C21.2618 44 18.877 39.8386 17.6364 33.69C16.3957 39.8386 14.0109 44 11.2727 44C7.25611 44 4 35.0457 4 24C4 12.9543 7.25611 4 11.2727 4C14.0109 4 16.3957 8.16144 17.6364 14.31C18.877 8.16144 21.2618 4 24 4C26.7382 4 29.123 8.16144 30.3636 14.31C31.6043 8.16144 33.9891 4 36.7273 4C40.7439 4 44 12.9543 44 24C44 35.0457 40.7439 44 36.7273 44Z"
                  fill="currentColor"
                ></path>
              </svg>
            </div>
            <h2 className="text-white text-lg font-bold leading-tight tracking-[-0.015em]">
              Connect
            </h2>
          </div>
          <div className="flex flex-1 justify-end gap-4 sm:gap-8">
            <div className="hidden sm:flex items-center gap-4 sm:gap-9">
              <a
                className="text-white hover:text-blue-300 transition-colors text-sm font-medium leading-normal"
                href="#"
              >
                Home
              </a>
              <a
                className="text-white hover:text-blue-300 transition-colors text-sm font-medium leading-normal"
                href="#"
              >
                About
              </a>
              <a
                className="text-white hover:text-blue-300 transition-colors text-sm font-medium leading-normal"
                href="#"
              >
                Contact
              </a>
            </div>
            <div className="flex gap-2">
              <Link href="/sign-up" passHref>
                <button className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-full h-10 px-4 bg-[#1383eb] hover:bg-blue-600 transition-colors text-white text-sm font-bold leading-normal tracking-[0.015em]">
                  <span className="truncate">Sign up</span>
                </button>
              </Link>
              <Link href="/sign-in" passHref>
                <button className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-full h-10 px-4 bg-[#283139] hover:bg-gray-700 transition-colors text-white text-sm font-bold leading-normal tracking-[0.015em]">
                  <span className="truncate">Log in</span>
                </button>
              </Link>
            </div>
          </div>
        </header>
        <div className="px-4 md:px-10 lg:px-20 xl:px-40 flex flex-1 justify-center py-5">
          <div className="layout-content-container flex flex-col max-w-[960px] flex-1">
            <div className="w-full">
              <div className="p-4">
                <div
                  className="flex min-h-[480px] flex-col gap-6 bg-cover bg-center bg-no-repeat md:gap-8 rounded-xl items-center justify-center p-4 md:p-8"
                  style={{
                    backgroundImage:
                      'linear-gradient(rgba(0, 0, 0, 0.1) 0%, rgba(0, 0, 0, 0.4) 100%), url("https://lh3.googleusercontent.com/aida-public/AB6AXuC601svHqjyfQ0xgTj1L6Ti297x9dAPR1CzFv40D15flcyBbx92WcZfsIlE-TmD1XupaHcHM6VZYdhDxQ3U0dnMscqDkSRYJ11kNSN7NElt2WrbyNDlcMRgbrxRpVrYBgVKHcEYJPbP50SATUKRyQQ8qbSqi38pjbS0S8f03OOY3PMALnrErD1c9Kp9wR9rZXxsguaRp6qm-3ePPcbzGbJkWqBM8695MrDGRP83BGfrnBTY8OftttgOrqGaqyzcp2cRxvBl_-t736jw")',
                  }}
                >
                  <div className="flex flex-col gap-2 text-center">
                    <h1 className="text-white text-4xl font-black leading-tight tracking-[-0.033em] md:text-5xl md:font-black md:leading-tight md:tracking-[-0.033em]">
                      Connect with your audience
                    </h1>
                    <h2 className="text-white text-sm font-normal leading-normal md:text-base md:font-normal md:leading-normal">
                      One link to share everything you create
                    </h2>
                  </div>
                  <Link href="/sign-up" passHref>
                    <button className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-full h-10 px-4 md:h-12 md:px-5 bg-[#1383eb] hover:bg-blue-600 transition-colors text-white text-sm font-bold leading-normal tracking-[0.015em] md:text-base md:font-bold md:leading-normal md:tracking-[0.015em]">
                      <span className="truncate">Get started for free</span>
                    </button>
                  </Link>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-10 px-4 py-10 md:py-16">
              <div className="flex flex-col gap-4">
                <h1 className="text-white tracking-light text-[32px] font-bold leading-tight md:text-4xl md:font-black md:leading-tight md:tracking-[-0.033em] max-w-[720px]">
                  Share everything with just one link
                </h1>
                <p className="text-white text-base font-normal leading-normal max-w-[720px]">
                  Connect is the launchpad to your online world. It's the one
                  link that connects your audience to all of your content.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6 p-0">
                <div className="flex flex-1 gap-3 rounded-lg border border-[#3b4854] bg-[#1c2127] p-4 md:p-6 flex-col hover:border-blue-500 transition-colors">
                  <div
                    className="text-white"
                    data-icon="Link"
                    data-size="24px"
                    data-weight="regular"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24px"
                      height="24px"
                      fill="currentColor"
                      viewBox="0 0 256 256"
                    >
                      <path d="M137.54,186.36a8,8,0,0,1,0,11.31l-9.94,10A56,56,0,0,1,48.38,128.4L72.5,104.28A56,56,0,0,1,149.31,102a8,8,0,1,1-10.64,12,40,40,0,0,0-54.85,1.63L59.7,139.72a40,40,0,0,0,56.58,56.58l9.94-9.94A8,8,0,0,1,137.54,186.36Zm70.08-138a56.08,56.08,0,0,0-79.22,0l-9.94,9.95a8,8,0,0,0,11.32,11.31l9.94-9.94a40,40,0,0,1,56.58,56.58L172.18,140.4A40,40,0,0,1,117.33,142,8,8,0,1,0,106.69,154a56,56,0,0,0,76.81-2.26l24.12-24.12A56.08,56.08,0,0,0,207.62,48.38Z"></path>
                    </svg>
                  </div>
                  <div className="flex flex-col gap-1">
                    <h2 className="text-white text-base font-bold leading-tight">
                      Links
                    </h2>
                    <p className="text-[#9dabb9] text-sm font-normal leading-normal">
                      Share all your important links in one place
                    </p>
                  </div>
                </div>
                <div className="flex flex-1 gap-3 rounded-lg border border-[#3b4854] bg-[#1c2127] p-4 md:p-6 flex-col hover:border-blue-500 transition-colors">
                  <div
                    className="text-white"
                    data-icon="Image"
                    data-size="24px"
                    data-weight="regular"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24px"
                      height="24px"
                      fill="currentColor"
                      viewBox="0 0 256 256"
                    >
                      <path d="M216,40H40A16,16,0,0,0,24,56V200a16,16,0,0,0,16,16H216a16,16,0,0,0,16-16V56A16,16,0,0,0,216,40Zm0,16V158.75l-26.07-26.06a16,16,0,0,0-22.63,0l-20,20-44-44a16,16,0,0,0-22.62,0L40,149.37V56ZM40,172l52-52,80,80H40Zm176,28H194.63l-36-36,20-20L216,181.38V200ZM144,100a12,12,0,1,1,12,12A12,12,0,0,1,144,100Z"></path>
                    </svg>
                  </div>
                  <div className="flex flex-col gap-1">
                    <h2 className="text-white text-base font-bold leading-tight">
                      Images
                    </h2>
                    <p className="text-[#9dabb9] text-sm font-normal leading-normal">
                      Showcase your best work with a gallery of images
                    </p>
                  </div>
                </div>
                <div className="flex flex-1 gap-3 rounded-lg border border-[#3b4854] bg-[#1c2127] p-4 md:p-6 flex-col hover:border-blue-500 transition-colors">
                  <div
                    className="text-white"
                    data-icon="Video"
                    data-size="24px"
                    data-weight="regular"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24px"
                      height="24px"
                      fill="currentColor"
                      viewBox="0 0 256 256"
                    >
                      <path d="M164.44,105.34l-48-32A8,8,0,0,0,104,80v64a8,8,0,0,0,12.44,6.66l48-32a8,8,0,0,0,0-13.32ZM120,129.05V95l25.58,17ZM216,40H40A16,16,0,0,0,24,56V168a16,16,0,0,0,16,16H216a16,16,0,0,0,16-16V56A16,16,0,0,0,216,40Zm0,128H40V56H216V168Zm16,40a8,8,0,0,1-8,8H32a8,8,0,0,1,0-16H224A8,8,0,0,1,232,208Z"></path>
                    </svg>
                  </div>
                  <div className="flex flex-col gap-1">
                    <h2 className="text-white text-base font-bold leading-tight">
                      Videos
                    </h2>
                    <p className="text-[#9dabb9] text-sm font-normal leading-normal">
                      Embed videos directly on your Connect page
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-10 px-4 py-10 md:py-16">
              <div className="flex flex-col gap-4">
                <h1 className="text-white tracking-light text-[32px] font-bold leading-tight md:text-4xl md:font-black md:leading-tight md:tracking-[-0.033em] max-w-[720px]">
                  Customize your Connect page
                </h1>
                <p className="text-white text-base font-normal leading-normal max-w-[720px]">
                  Make your Connect page uniquely yours with customizable themes
                  and layouts.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="flex flex-col gap-3 pb-3 group">
                  <div
                    className="w-full bg-center bg-no-repeat aspect-video bg-cover rounded-xl group-hover:scale-105 transition-transform duration-300"
                    style={{
                      backgroundImage:
                        'url("https://lh3.googleusercontent.com/aida-public/AB6AXuAGmvz4gTleBH5W9gOZ4MZKyKWKQi5pJFuwGAJunixVeS7EbRNHyTSV6wj2ynT8w5poc3jnPJQ4ggTTWLA4EboAQ0C9elnDSL6wt6lwwF_QFigj53CPHDHNstQHi4-YlbhV4ER2o5via5jFbJDGxMXfNb9zalJlKsEFUsqCZJeVJrKtVgzx2X5vBbP3X-OxzbEGecpT_XwGawAkRPTCHiC4kCdd27wbabh8JBsDJlTJzlyxUDHGOl6YOzlMxPWApZ-xLS_XemsQvhTO")',
                    }}
                  ></div>
                  <div>
                    <p className="text-white text-base font-medium leading-normal">
                      Themes
                    </p>
                    <p className="text-[#9dabb9] text-sm font-normal leading-normal">
                      Choose from a variety of pre-designed themes
                    </p>
                  </div>
                </div>
                <div className="flex flex-col gap-3 pb-3 group">
                  <div
                    className="w-full bg-center bg-no-repeat aspect-video bg-cover rounded-xl group-hover:scale-105 transition-transform duration-300"
                    style={{
                      backgroundImage:
                        'url("https://lh3.googleusercontent.com/aida-public/AB6AXuBPFqsqmK0gJcOAYE_4A2ngjAA4f-XT5XG689-hE1Eu3jnwQXOSe9Tz37L-VSbFWVq-pyz7iq1NDWBFmtbBb33KGJ_aaOU414JQsNwmI4Pxv44_Bss76-0YIajwfYIdQFcdHMMQ_JY4zKHtlU8Gfiqm3twd3EpfexGjqFa04XkEOlPFmOmG-uZhmwOCgIQoFSepJZCS7nSiqMxEQHDVHodrVZi9vtO50YgSkyfau6OacXL9aCIQGasKLPqD_6uLk20mPiNQ_bEX3JMC")',
                    }}
                  ></div>
                  <div>
                    <p className="text-white text-base font-medium leading-normal">
                      Layouts
                    </p>
                    <p className="text-[#9dabb9] text-sm font-normal leading-normal">
                      Select a layout that best showcases your content
                    </p>
                  </div>
                </div>
                <div className="flex flex-col gap-3 pb-3 group">
                  <div
                    className="w-full bg-center bg-no-repeat aspect-video bg-cover rounded-xl group-hover:scale-105 transition-transform duration-300"
                    style={{
                      backgroundImage:
                        'url("https://lh3.googleusercontent.com/aida-public/AB6AXuCmjDWQ5tPSwjqn5Rog5LS5LeR2sHYqrKSbDbMRLJ7JmX2dgzRVEzkrzF3YgsDUOJDU1Czw5cUnuxL7LxLtwu7q1B5KyOD_uej0obLxjqebihOeqc51cNy5EgE8d85SSKnFJvewv1nUWbfoRAojrLI65W_Ih7np8lsmcVcriOYlGGpsR4j9X8i4Yq89qtt3MLP4m42UcYP0cS_WY9gYhxfZHD-9zfZx0Xlz7ShTymwyTWoOwEzccP_dIQaJ1Plk6oWRL9enJ-R-CkD1")',
                    }}
                  ></div>
                  <div>
                    <p className="text-white text-base font-medium leading-normal">
                      Branding
                    </p>
                    <p className="text-[#9dabb9] text-sm font-normal leading-normal">
                      Add your logo and brand colors to personalize your page
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-10 px-4 py-10 md:py-16">
              <div className="flex flex-col gap-4">
                <h1 className="text-white tracking-light text-[32px] font-bold leading-tight md:text-4xl md:font-black md:leading-tight md:tracking-[-0.033em] max-w-[720px]">
                  Track your performance
                </h1>
                <p className="text-white text-base font-normal leading-normal max-w-[720px]">
                  Understand your audience and optimize your Connect page with
                  detailed analytics.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6 p-0">
                <div className="flex flex-1 gap-3 rounded-lg border border-[#3b4854] bg-[#1c2127] p-4 md:p-6 flex-col hover:border-blue-500 transition-colors">
                  <div
                    className="text-white"
                    data-icon="ChartLine"
                    data-size="24px"
                    data-weight="regular"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24px"
                      height="24px"
                      fill="currentColor"
                      viewBox="0 0 256 256"
                    >
                      <path d="M232,208a8,8,0,0,1-8,8H32a8,8,0,0,1-8-8V48a8,8,0,0,1,16,0v94.37L90.73,98a8,8,0,0,1,10.07-.38l58.81,44.11L218.73,90a8,8,0,1,1,10.54,12l-64,56a8,8,0,0,1-10.07.38L96.39,114.29,40,163.63V200H224A8,8,0,0,1,232,208Z"></path>
                    </svg>
                  </div>
                  <div className="flex flex-col gap-1">
                    <h2 className="text-white text-base font-bold leading-tight">
                      Analytics
                    </h2>
                    <p className="text-[#9dabb9] text-sm font-normal leading-normal">
                      Track clicks, views, and other key metrics
                    </p>
                  </div>
                </div>
                <div className="flex flex-1 gap-3 rounded-lg border border-[#3b4854] bg-[#1c2127] p-4 md:p-6 flex-col hover:border-blue-500 transition-colors">
                  <div
                    className="text-white"
                    data-icon="Users"
                    data-size="24px"
                    data-weight="regular"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24px"
                      height="24px"
                      fill="currentColor"
                      viewBox="0 0 256 256"
                    >
                      <path d="M117.25,157.92a60,60,0,1,0-66.5,0A95.83,95.83,0,0,0,3.53,195.63a8,8,0,1,0,13.4,8.74,80,80,0,0,1,134.14,0,8,8,0,0,0,13.4-8.74A95.83,95.83,0,0,0,117.25,157.92ZM40,108a44,44,0,1,1,44,44A44.05,44.05,0,0,1,40,108Zm210.14,98.7a8,8,0,0,1-11.07-2.33A79.83,79.83,0,0,0,172,168a8,8,0,0,1,0-16,44,44,0,1,0-16.34-84.87,8,8,0,1,1-5.94-14.85,60,60,0,0,1,55.53,105.64,95.83,95.83,0,0,1,47.22,37.71A8,8,0,0,1,250.14,206.7Z"></path>
                    </svg>
                  </div>
                  <div className="flex flex-col gap-1">
                    <h2 className="text-white text-base font-bold leading-tight">
                      Audience Insights
                    </h2>
                    <p className="text-[#9dabb9] text-sm font-normal leading-normal">
                      Learn about your audience demographics and interests
                    </p>
                  </div>
                </div>
                <div className="flex flex-1 gap-3 rounded-lg border border-[#3b4854] bg-[#1c2127] p-4 md:p-6 flex-col hover:border-blue-500 transition-colors">
                  <div
                    className="text-white"
                    data-icon="Bell"
                    data-size="24px"
                    data-weight="regular"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24px"
                      height="24px"
                      fill="currentColor"
                      viewBox="0 0 256 256"
                    >
                      <path d="M221.8,175.94C216.25,166.38,208,139.33,208,104a80,80,0,1,0-160,0c0,35.34-8.26,62.38-13.81,71.94A16,16,0,0,0,48,200H88.81a40,40,0,0,0,78.38,0H208a16,16,0,0,0,13.8-24.06ZM128,216a24,24,0,0,1-22.62-16h45.24A24,24,0,0,1,128,216ZM48,184c7.7-13.24,16-43.92,16-80a64,64,0,1,1,128,0c0,36.05,8.28,66.73,16,80Z"></path>
                    </svg>
                  </div>
                  <div className="flex flex-col gap-1">
                    <h2 className="text-white text-base font-bold leading-tight">
                      Notifications
                    </h2>
                    <p className="text-[#9dabb9] text-sm font-normal leading-normal">
                      Get notified when someone interacts with your Connect page
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <div className="flex flex-col justify-end gap-6 px-4 py-10 md:gap-8 md:px-10 md:py-20">
                <div className="flex flex-col gap-2 text-center">
                  <h1 className="text-white tracking-light text-[32px] font-bold leading-tight md:text-4xl md:font-black md:leading-tight md:tracking-[-0.033em] max-w-[720px] mx-auto">
                    Join thousands of creators using Connect
                  </h1>
                  <p className="text-white text-base font-normal leading-normal max-w-[720px] mx-auto">
                    Sign up today and start sharing your world with one link
                  </p>
                </div>
                <div className="flex flex-1 justify-center">
                  <div className="flex justify-center">
                    <Link href="/sign-up" passHref>
                      <button className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-full h-10 px-6 md:h-12 md:px-8 bg-[#1383eb] hover:bg-blue-600 transition-colors text-white text-sm font-bold leading-normal tracking-[0.015em] md:text-base md:font-bold md:leading-normal md:tracking-[0.015em] grow">
                        <span className="truncate">Get started for free</span>
                      </button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <footer className="flex justify-center bg-[#0d1114] border-t border-[#283139]">
          <div className="flex max-w-[960px] flex-1 flex-col">
            <footer className="flex flex-col gap-6 px-5 py-10 text-center">
              <div className="flex flex-wrap items-center justify-center gap-6 md:flex-row md:justify-around">
                <a
                  className="text-[#9dabb9] hover:text-white transition-colors text-base font-normal leading-normal min-w-40"
                  href="#"
                >
                  Terms of Service
                </a>
                <a
                  className="text-[#9dabb9] hover:text-white transition-colors text-base font-normal leading-normal min-w-40"
                  href="#"
                >
                  Privacy Policy
                </a>
                <a
                  className="text-[#9dabb9] hover:text-white transition-colors text-base font-normal leading-normal min-w-40"
                  href="#"
                >
                  Contact Us
                </a>
              </div>
              <div className="flex flex-wrap justify-center gap-4">
                <a href="#" className="hover:scale-110 transition-transform">
                  <div
                    className="text-[#9dabb9] hover:text-white transition-colors"
                    data-icon="TwitterLogo"
                    data-size="24px"
                    data-weight="regular"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24px"
                      height="24px"
                      fill="currentColor"
                      viewBox="0 0 256 256"
                    >
                      <path d="M247.39,68.94A8,8,0,0,0,240,64H209.57A48.66,48.66,0,0,0,168.1,40a46.91,46.91,0,0,0-33.75,13.7A47.9,47.9,0,0,0,120,88v6.09C79.74,83.47,46.81,50.72,46.46,50.37a8,8,0,0,0-13.65,4.92c-4.31,47.79,9.57,79.77,22,98.18a110.93,110.93,0,0,0,21.88,24.2c-15.23,17.53-39.21,26.74-39.47,26.84a8,8,0,0,0-3.85,11.93c.75,1.12,3.75,5.05,11.08,8.72C53.51,229.7,65.48,232,80,232c70.67,0,129.72-54.42,135.75-124.44l29.91-29.9A8,8,0,0,0,247.39,68.94Zm-45,29.41a8,8,0,0,0-2.32,5.14C196,166.58,143.28,216,80,216c-10.56,0-18-1.4-23.22-3.08,11.51-6.25,27.56-17,37.88-32.48A8,8,0,0,0,92,169.08c-.47-.27-43.91-26.34-44-96,16,13,45.25,33.17,78.67,38.79A8,8,0,0,0,136,104V88a32,32,0,0,1,9.6-22.92A30.94,30.94,0,0,1,167.9,56c12.66.16,24.49,7.88,29.44,19.21A8,8,0,0,0,204.67,80h16Z"></path>
                    </svg>
                  </div>
                </a>
                <a href="#" className="hover:scale-110 transition-transform">
                  <div
                    className="text-[#9dabb9] hover:text-white transition-colors"
                    data-icon="InstagramLogo"
                    data-size="24px"
                    data-weight="regular"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24px"
                      height="24px"
                      fill="currentColor"
                      viewBox="0 0 256 256"
                    >
                      <path d="M128,80a48,48,0,1,0,48,48A48.05,48.05,0,0,0,128,80Zm0,80a32,32,0,1,1,32-32A32,32,0,0,1,128,160ZM176,24H80A56.06,56.06,0,0,0,24,80v96a56.06,56.06,0,0,0,56,56h96a56.06,56.06,0,0,0,56-56V80A56.06,56.06,0,0,0,176,24Zm40,152a40,40,0,0,1-40,40H80a40,40,0,0,1-40-40V80A40,40,0,0,1,80,40h96a40,40,0,0,1,40,40ZM192,76a12,12,0,1,1-12-12A12,12,0,0,1,192,76Z"></path>
                    </svg>
                  </div>
                </a>
                <a href="#" className="hover:scale-110 transition-transform">
                  <div
                    className="text-[#9dabb9] hover:text-white transition-colors"
                    data-icon="FacebookLogo"
                    data-size="24px"
                    data-weight="regular"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24px"
                      height="24px"
                      fill="currentColor"
                      viewBox="0 0 256 256"
                    >
                      <path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm8,191.63V152h24a8,8,0,0,0,0-16H136V112a16,16,0,0,1,16-16h16a8,8,0,0,0,0-16H152a32,32,0,0,0-32,32v24H96a8,8,0,0,0,0,16h24v63.63a88,88,0,1,1,16,0Z"></path>
                    </svg>
                  </div>
                </a>
              </div>
              <p className="text-[#9dabb9] text-base font-normal leading-normal">
                © 2025 LinkYoSelf. All rights reserved.
              </p>
            </footer>
          </div>
        </footer>
      </div>
    </div>
  );
}
