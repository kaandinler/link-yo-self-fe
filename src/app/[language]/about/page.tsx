import type { Metadata } from "next";
import {
  Star,
  Users,
  Target,
  Heart,
  CheckCircle,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About - LinkYoSelf",
  description:
    "Learn more about LinkYoSelf and our mission to connect creators with their audience.",
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
      {/* Hero Section */}
      <section className="relative px-4 sm:px-6 lg:px-8 py-20 md:py-32">
        <div className="max-w-7xl mx-auto text-center">
          {/* Hero Content */}
          <div className="max-w-4xl mx-auto mb-12">
            <div className="inline-flex items-center gap-2 bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-full px-4 py-2 mb-8">
              <Star className="h-4 w-4 text-yellow-400" />
              <span className="text-sm text-gray-300">Our Story</span>
            </div>

            <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-white mb-6 leading-tight">
              About
              <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                {" "}
                LinkYoSelf
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-gray-300 mb-8 leading-relaxed">
              We're on a mission to simplify how creators, influencers, and
              professionals share their digital presence with the world.
            </p>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="relative px-4 sm:px-6 lg:px-8 py-20">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-purple-500/20 backdrop-blur-sm border border-purple-500/30 rounded-full px-4 py-2 mb-6">
                <Target className="h-4 w-4 text-purple-400" />
                <span className="text-sm text-purple-300">Our Mission</span>
              </div>

              <h2 className="text-3xl md:text-4xl font-black text-white mb-6">
                Connecting creators with their audience
              </h2>

              <p className="text-lg text-gray-300 mb-6 leading-relaxed">
                We believe that sharing your digital presence shouldn't be
                complicated. That's why we created LinkYoSelf - to give you one
                powerful link that connects your audience to everything you
                create and share online.
              </p>

              <p className="text-lg text-gray-300 leading-relaxed">
                Our platform empowers creators, influencers, artists,
                entrepreneurs, and professionals to build their personal brand
                and share all their important content through one beautiful,
                customizable page.
              </p>
            </div>

            <div className="relative">
              <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 backdrop-blur-sm border border-gray-700 rounded-2xl p-8 shadow-2xl">
                <div className="bg-gray-800 rounded-xl p-6 space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                      <Users className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <div className="text-white font-semibold">10,000+</div>
                      <div className="text-gray-400 text-sm">Active Users</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center">
                      <Target className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <div className="text-white font-semibold">1M+</div>
                      <div className="text-gray-400 text-sm">Links Shared</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
                      <Heart className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <div className="text-white font-semibold">99%</div>
                      <div className="text-gray-400 text-sm">
                        Satisfaction Rate
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What We Offer Section */}
      <section className="relative px-4 sm:px-6 lg:px-8 py-20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-pink-500/20 backdrop-blur-sm border border-pink-500/30 rounded-full px-4 py-2 mb-6">
              <CheckCircle className="h-4 w-4 text-pink-400" />
              <span className="text-sm text-pink-300">What We Offer</span>
            </div>

            <h2 className="text-3xl md:text-5xl font-black text-white mb-6">
              Everything you need to
              <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                {" "}
                succeed
              </span>
            </h2>

            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              We provide powerful tools that are easy to use, helping you build
              meaningful connections with your audience.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="group bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-8 hover:border-purple-500/50 transition-all duration-300 hover:transform hover:scale-105">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <CheckCircle className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-4">
                Customizable Link Pages
              </h3>
              <p className="text-gray-300 leading-relaxed">
                Create beautiful, personalized pages that reflect your brand and
                style. Choose from multiple themes and layouts.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="group bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-8 hover:border-purple-500/50 transition-all duration-300 hover:transform hover:scale-105">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Target className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-4">
                Analytics & Insights
              </h3>
              <p className="text-gray-300 leading-relaxed">
                Track your performance with detailed analytics. Understand your
                audience and optimize your content strategy.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="group bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-8 hover:border-purple-500/50 transition-all duration-300 hover:transform hover:scale-105">
              <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Users className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-4">
                Mobile-Optimized Designs
              </h3>
              <p className="text-gray-300 leading-relaxed">
                Your pages look perfect on all devices. Mobile-first design
                ensures the best experience for your audience.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="group bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-8 hover:border-purple-500/50 transition-all duration-300 hover:transform hover:scale-105">
              <div className="w-16 h-16 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Star className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-4">
                Easy Content Management
              </h3>
              <p className="text-gray-300 leading-relaxed">
                Add, edit, and organize your links with our intuitive interface.
                No technical skills required.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="group bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-8 hover:border-purple-500/50 transition-all duration-300 hover:transform hover:scale-105">
              <div className="w-16 h-16 bg-gradient-to-r from-red-500 to-pink-500 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Heart className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-4">
                24/7 Support
              </h3>
              <p className="text-gray-300 leading-relaxed">
                Our dedicated support team is here to help you succeed. Get
                assistance whenever you need it.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="group bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-8 hover:border-purple-500/50 transition-all duration-300 hover:transform hover:scale-105">
              <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <CheckCircle className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-4">
                SEO Optimization
              </h3>
              <p className="text-gray-300 leading-relaxed">
                Built-in SEO features help your page rank better in search
                results and social media previews.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="relative px-4 sm:px-6 lg:px-8 py-20">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="order-2 lg:order-1">
              <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 backdrop-blur-sm border border-gray-700 rounded-2xl p-8 shadow-2xl">
                <div className="space-y-6">
                  {[
                    "Simple and intuitive interface",
                    "Unlimited links and customization",
                    "Advanced analytics and insights",
                    "Mobile-responsive designs",
                    "SEO-optimized pages",
                    "Reliable 99.9% uptime",
                  ].map((feature, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <div className="w-6 h-6 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <CheckCircle className="h-4 w-4 text-white" />
                      </div>
                      <span className="text-gray-300">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="order-1 lg:order-2">
              <div className="inline-flex items-center gap-2 bg-green-500/20 backdrop-blur-sm border border-green-500/30 rounded-full px-4 py-2 mb-6">
                <Heart className="h-4 w-4 text-green-400" />
                <span className="text-sm text-green-300">
                  Why Choose LinkYoSelf
                </span>
              </div>

              <h2 className="text-3xl md:text-4xl font-black text-white mb-6">
                The platform creators trust
              </h2>

              <p className="text-lg text-gray-300 mb-6 leading-relaxed">
                Unlike other platforms, LinkYoSelf focuses on simplicity without
                sacrificing functionality. We provide powerful tools that are
                easy to use, helping you build meaningful connections with your
                audience.
              </p>

              <p className="text-lg text-gray-300 mb-8 leading-relaxed">
                Join thousands of successful creators who have chosen LinkYoSelf
                to represent their digital identity and grow their online
                presence.
              </p>

              <Link href="/sign-up">
                <button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all duration-200 transform hover:scale-105 shadow-2xl flex items-center gap-2">
                  Get Started Today
                  <ArrowRight className="h-5 w-5" />
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative px-4 sm:px-6 lg:px-8 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 backdrop-blur-sm border border-gray-700 rounded-3xl p-12 shadow-2xl">
            <h2 className="text-3xl md:text-5xl font-black text-white mb-6">
              Ready to build your digital presence?
            </h2>
            <p className="text-xl text-gray-300 mb-8 leading-relaxed">
              Join our community of creators and start sharing your world with
              one beautiful link.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/sign-up">
                <button className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all duration-200 transform hover:scale-105 shadow-2xl flex items-center justify-center gap-2">
                  Start Your Journey
                  <ArrowRight className="h-5 w-5" />
                </button>
              </Link>
              <Link href="/contact">
                <button className="w-full sm:w-auto bg-gray-800 hover:bg-gray-700 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-200 border border-gray-600 hover:border-gray-500">
                  Contact Us
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
