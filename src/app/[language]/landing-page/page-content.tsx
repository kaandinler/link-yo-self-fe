'use client';

import React from 'react';
import Link from 'next/link';
import {
  Link as LinkIcon,
  Users,
  BarChart3,
  Palette,
  Star,
  ArrowRight,
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
      {/* Hero Section */}
      <section className="relative px-4 sm:px-6 lg:px-8 py-20 md:py-32">
        <div className="max-w-7xl mx-auto text-center">
          {/* Hero Content */}
          <div className="max-w-4xl mx-auto mb-12">
            <div className="inline-flex items-center gap-2 bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-full px-4 py-2 mb-8">
              <Star className="h-4 w-4 text-yellow-400" />
              <span className="text-sm text-gray-300">
                Join thousands of creators
              </span>
            </div>

            <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-white mb-6 leading-tight">
              Connect with your
              <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                {' '}
                audience
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-gray-300 mb-8 leading-relaxed">
              One link to share everything you create. Build your personal brand
              and share all your important links in one beautiful, customizable
              page.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link href="/sign-up">
                <button className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all duration-200 transform hover:scale-105 shadow-2xl flex items-center gap-2">
                  Get Started for Free
                  <ArrowRight className="h-5 w-5" />
                </button>
              </Link>
              <Link href="/about">
                <button className="w-full sm:w-auto bg-gray-800 hover:bg-gray-700 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-200 border border-gray-600 hover:border-gray-500">
                  Learn More
                </button>
              </Link>
            </div>
          </div>

          {/* Hero Visual */}
          <div className="relative max-w-4xl mx-auto">
            <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 backdrop-blur-sm border border-gray-700 rounded-2xl p-8 shadow-2xl">
              <div className="bg-gray-800 rounded-xl p-6 space-y-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"></div>
                  <div>
                    <div className="h-3 bg-gray-600 rounded w-24 mb-1"></div>
                    <div className="h-2 bg-gray-700 rounded w-16"></div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="bg-purple-600 h-12 rounded-lg flex items-center justify-center">
                    <span className="text-white font-medium">Instagram</span>
                  </div>
                  <div className="bg-pink-600 h-12 rounded-lg flex items-center justify-center">
                    <span className="text-white font-medium">Twitter</span>
                  </div>
                  <div className="bg-blue-600 h-12 rounded-lg flex items-center justify-center">
                    <span className="text-white font-medium">LinkedIn</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative px-4 sm:px-6 lg:px-8 py-20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black text-white mb-6">
              Everything you need to
              <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                {' '}
                connect
              </span>
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              LinkYoSelf provides all the tools you need to create a beautiful,
              functional link-in-bio page that represents your brand.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="group bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-8 hover:border-purple-500/50 transition-all duration-300 hover:transform hover:scale-105">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <LinkIcon className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-4">
                Unlimited Links
              </h3>
              <p className="text-gray-300 leading-relaxed">
                Add all your social media profiles, websites, and important
                links in one place. No limits, complete control.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="group bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-8 hover:border-purple-500/50 transition-all duration-300 hover:transform hover:scale-105">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Palette className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-4">
                Custom Design
              </h3>
              <p className="text-gray-300 leading-relaxed">
                Customize your page with themes, colors, and layouts that match
                your personal brand and style.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="group bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-8 hover:border-purple-500/50 transition-all duration-300 hover:transform hover:scale-105">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <BarChart3 className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-4">Analytics</h3>
              <p className="text-gray-300 leading-relaxed">
                Track your link performance with detailed analytics and insights
                to understand your audience better.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="group bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-8 hover:border-purple-500/50 transition-all duration-300 hover:transform hover:scale-105">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Users className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-4">
                Mobile Optimized
              </h3>
              <p className="text-gray-300 leading-relaxed">
                Your page looks perfect on all devices. Mobile-first design
                ensures the best experience for your audience.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="group bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-8 hover:border-purple-500/50 transition-all duration-300 hover:transform hover:scale-105">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Star className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-4">Easy Setup</h3>
              <p className="text-gray-300 leading-relaxed">
                Get started in minutes. Our intuitive interface makes it easy to
                create and customize your link page.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="group bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-8 hover:border-purple-500/50 transition-all duration-300 hover:transform hover:scale-105">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <LinkIcon className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-4">
                SEO Friendly
              </h3>
              <p className="text-gray-300 leading-relaxed">
                Optimized for search engines with custom meta tags,
                descriptions, and social media previews.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative px-4 sm:px-6 lg:px-8 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 backdrop-blur-sm border border-gray-700 rounded-3xl p-12 shadow-2xl">
            <h2 className="text-3xl md:text-5xl font-black text-white mb-6">
              Ready to connect with your audience?
            </h2>
            <p className="text-xl text-gray-300 mb-8 leading-relaxed">
              Join thousands of creators, influencers, and professionals who use
              LinkYoSelf to share their digital presence in one beautiful link.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/sign-up">
                <button className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all duration-200 transform hover:scale-105 shadow-2xl flex items-center justify-center gap-2">
                  Start Building Your Page
                  <ArrowRight className="h-5 w-5" />
                </button>
              </Link>
              <Link href="/sign-in">
                <button className="w-full sm:w-auto bg-gray-800 hover:bg-gray-700 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-200 border border-gray-600 hover:border-gray-500">
                  Sign In
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative px-4 sm:px-6 lg:px-8 py-12 border-t border-gray-800">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                <LinkIcon className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white">LinkYoSelf</span>
            </div>

            {/* Links */}
            <div className="flex items-center gap-8">
              <a
                href="/about"
                className="text-gray-400 hover:text-white transition-colors"
              >
                About
              </a>
              <a
                href="/privacy-policy"
                className="text-gray-400 hover:text-white transition-colors"
              >
                Privacy
              </a>
              <a
                href="/terms"
                className="text-gray-400 hover:text-white transition-colors"
              >
                Terms
              </a>
              <a
                href="/contact"
                className="text-gray-400 hover:text-white transition-colors"
              >
                Contact
              </a>
            </div>

            {/* Copyright */}
            <div className="text-gray-400 text-sm">
              © 2025 LinkYoSelf. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
