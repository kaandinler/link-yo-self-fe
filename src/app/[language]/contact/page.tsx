import type { Metadata } from "next";
import {
  Mail,
  MessageCircle,
  Phone,
  MapPin,
  Send,
  Clock,
  Users,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Contact - LinkYoSelf",
  description:
    "Get in touch with the LinkYoSelf team. We're here to help you succeed with your digital presence.",
};

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
      {/* Hero Section */}
      <section className="relative px-4 sm:px-6 lg:px-8 py-20 md:py-32">
        <div className="max-w-7xl mx-auto text-center">
          {/* Hero Content */}
          <div className="max-w-4xl mx-auto mb-12">
            <div className="inline-flex items-center gap-2 bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-full px-4 py-2 mb-8">
              <MessageCircle className="h-4 w-4 text-blue-400" />
              <span className="text-sm text-gray-300">Get in Touch</span>
            </div>

            <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-white mb-6 leading-tight">
              Contact
              <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                {" "}
                Us
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-gray-300 mb-8 leading-relaxed">
              Have questions? We'd love to hear from you. Send us a message and
              we'll respond as soon as possible.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Options Section */}
      <section className="relative px-4 sm:px-6 lg:px-8 py-20">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
            {/* Email */}
            <div className="group bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-8 hover:border-blue-500/50 transition-all duration-300 hover:transform hover:scale-105 text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <Mail className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-4">Email Us</h3>
              <p className="text-gray-300 mb-4">
                Send us an email and we'll get back to you within 24 hours.
              </p>
              <a
                href="mailto:support@linkyoself.com"
                className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
              >
                support@linkyoself.com
              </a>
            </div>

            {/* Live Chat */}
            <div className="group bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-8 hover:border-green-500/50 transition-all duration-300 hover:transform hover:scale-105 text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <MessageCircle className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-4">Live Chat</h3>
              <p className="text-gray-300 mb-4">
                Chat with our support team in real-time for instant help.
              </p>
              <span className="text-green-400 font-medium">
                Available 9AM - 6PM EST
              </span>
            </div>

            {/* Phone */}
            <div className="group bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-8 hover:border-purple-500/50 transition-all duration-300 hover:transform hover:scale-105 text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <Phone className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-4">Call Us</h3>
              <p className="text-gray-300 mb-4">
                Speak directly with our team for complex inquiries.
              </p>
              <a
                href="tel:+1-555-LINKYOU"
                className="text-purple-400 hover:text-purple-300 font-medium transition-colors"
              >
                +1 (555) LINK-YOU
              </a>
            </div>

            {/* Office */}
            <div className="group bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-8 hover:border-orange-500/50 transition-all duration-300 hover:transform hover:scale-105 text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <MapPin className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-4">Visit Us</h3>
              <p className="text-gray-300 mb-4">
                Come say hello at our office headquarters.
              </p>
              <span className="text-orange-400 font-medium">
                San Francisco, CA
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Form Section */}
      <section className="relative px-4 sm:px-6 lg:px-8 py-20">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
            {/* Contact Form */}
            <div>
              <div className="inline-flex items-center gap-2 bg-purple-500/20 backdrop-blur-sm border border-purple-500/30 rounded-full px-4 py-2 mb-6">
                <Send className="h-4 w-4 text-purple-400" />
                <span className="text-sm text-purple-300">Send a Message</span>
              </div>

              <h2 className="text-3xl md:text-4xl font-black text-white mb-6">
                Let's start a conversation
              </h2>

              <p className="text-lg text-gray-300 mb-8 leading-relaxed">
                Whether you have a question about features, pricing, need a
                demo, or anything else, our team is ready to answer all your
                questions.
              </p>

              <form className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      First Name
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                      placeholder="John"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Last Name
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                      placeholder="Doe"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                    placeholder="john@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Subject
                  </label>
                  <select className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors">
                    <option value="">Select a topic</option>
                    <option value="general">General Inquiry</option>
                    <option value="support">Technical Support</option>
                    <option value="billing">Billing Question</option>
                    <option value="feature">Feature Request</option>
                    <option value="partnership">Partnership</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Message
                  </label>
                  <textarea
                    rows={6}
                    className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors resize-none"
                    placeholder="Tell us how we can help you..."
                  ></textarea>
                </div>

                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all duration-200 transform hover:scale-105 shadow-2xl flex items-center justify-center gap-2"
                >
                  Send Message
                  <Send className="h-5 w-5" />
                </button>
              </form>
            </div>

            {/* Contact Info & FAQ */}
            <div className="space-y-8">
              {/* Response Time */}
              <div className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 backdrop-blur-sm border border-gray-700 rounded-2xl p-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center">
                    <Clock className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">
                      Quick Response
                    </h3>
                    <p className="text-blue-300">
                      We typically respond within 2-4 hours
                    </p>
                  </div>
                </div>
                <p className="text-gray-300">
                  Our support team is dedicated to providing fast, helpful
                  responses to all inquiries during business hours.
                </p>
              </div>

              {/* Support Hours */}
              <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 backdrop-blur-sm border border-gray-700 rounded-2xl p-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
                    <Users className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">
                      Support Hours
                    </h3>
                    <p className="text-green-300">
                      Monday - Friday, 9AM - 6PM EST
                    </p>
                  </div>
                </div>
                <div className="space-y-2 text-gray-300">
                  <p>📧 Email Support: 24/7</p>
                  <p>💬 Live Chat: Business Hours</p>
                  <p>📞 Phone Support: Business Hours</p>
                </div>
              </div>

              {/* FAQ */}
              <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 backdrop-blur-sm border border-gray-700 rounded-2xl p-8">
                <h3 className="text-xl font-bold text-white mb-6">
                  Frequently Asked Questions
                </h3>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-white mb-2">
                      How quickly can I get started?
                    </h4>
                    <p className="text-gray-300 text-sm">
                      You can create your LinkYoSelf page in less than 5
                      minutes!
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold text-white mb-2">
                      Is there a free plan?
                    </h4>
                    <p className="text-gray-300 text-sm">
                      Yes! We offer a free plan with basic features to get you
                      started.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold text-white mb-2">
                      Can I customize my page design?
                    </h4>
                    <p className="text-gray-300 text-sm">
                      Absolutely! Choose from multiple themes and customize
                      colors, layouts, and more.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold text-white mb-2">
                      Do you provide analytics?
                    </h4>
                    <p className="text-gray-300 text-sm">
                      Yes, track clicks, views, and audience insights with our
                      built-in analytics.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Office Locations Section */}
      <section className="relative px-4 sm:px-6 lg:px-8 py-20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-orange-500/20 backdrop-blur-sm border border-orange-500/30 rounded-full px-4 py-2 mb-6">
              <MapPin className="h-4 w-4 text-orange-400" />
              <span className="text-sm text-orange-300">Our Locations</span>
            </div>

            <h2 className="text-3xl md:text-5xl font-black text-white mb-6">
              Visit our
              <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                {" "}
                offices
              </span>
            </h2>

            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              We have offices around the world to better serve our global
              community of creators.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* San Francisco */}
            <div className="group bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-8 hover:border-orange-500/50 transition-all duration-300 hover:transform hover:scale-105 text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <MapPin className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-4">
                San Francisco
              </h3>
              <div className="text-gray-300 space-y-2">
                <p>123 Innovation Drive</p>
                <p>San Francisco, CA 94105</p>
                <p>United States</p>
              </div>
              <div className="mt-4 text-orange-400 font-medium">
                Headquarters
              </div>
            </div>

            {/* New York */}
            <div className="group bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-8 hover:border-blue-500/50 transition-all duration-300 hover:transform hover:scale-105 text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <MapPin className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-4">New York</h3>
              <div className="text-gray-300 space-y-2">
                <p>456 Business Avenue</p>
                <p>New York, NY 10001</p>
                <p>United States</p>
              </div>
              <div className="mt-4 text-blue-400 font-medium">
                East Coast Office
              </div>
            </div>

            {/* London */}
            <div className="group bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-8 hover:border-green-500/50 transition-all duration-300 hover:transform hover:scale-105 text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <MapPin className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-4">London</h3>
              <div className="text-gray-300 space-y-2">
                <p>789 Tech Street</p>
                <p>London EC2A 4DP</p>
                <p>United Kingdom</p>
              </div>
              <div className="mt-4 text-green-400 font-medium">
                European Office
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative px-4 sm:px-6 lg:px-8 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 backdrop-blur-sm border border-gray-700 rounded-3xl p-12 shadow-2xl">
            <h2 className="text-3xl md:text-5xl font-black text-white mb-6">
              Ready to get started?
            </h2>
            <p className="text-xl text-gray-300 mb-8 leading-relaxed">
              Don't wait! Join thousands of creators who are already using
              LinkYoSelf to build their digital presence and connect with their
              audience.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/sign-up">
                <button className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all duration-200 transform hover:scale-105 shadow-2xl flex items-center justify-center gap-2">
                  Create Your Page
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
        </div>
      </section>
    </div>
  );
}
