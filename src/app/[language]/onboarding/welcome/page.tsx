import React from 'react';
import { ArrowRight, CheckCircle, Palette, Link2, BarChart3 } from 'lucide-react';

const OnboardingWelcome = () => {
  const steps = [
    {
      icon: CheckCircle,
      title: "Complete Your Profile",
      description: "Add your photo, bio, and basic information"
    },
    {
      icon: Link2,
      title: "Add Your First Links", 
      description: "Connect your social media and important links"
    },
    {
      icon: Palette,
      title: "Customize Your Page",
      description: "Choose colors, themes, and layout options"
    },
    {
      icon: BarChart3,
      title: "Share & Track",
      description: "Share your page and monitor performance"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center p-4">
      <div className="max-w-4xl mx-auto text-center">
        
        {/* Welcome Header */}
        <div className="mb-12">
          <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-2xl">
            <CheckCircle className="h-10 w-10 text-white" />
          </div>
          
          <h1 className="text-4xl md:text-6xl font-black text-white mb-4">
            Welcome to
            <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              {" "}LinkYoSelf
            </span>
            ! 🎉
          </h1>
          
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Let's get you set up with your personalized link page in just a few simple steps.
            It will only take a couple of minutes!
          </p>
        </div>

        {/* Steps Preview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {steps.map((step, index) => (
            <div key={index} className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-6 hover:border-purple-500/50 transition-all">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                <step.icon className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">{step.title}</h3>
              <p className="text-gray-300 text-sm">{step.description}</p>
              
              {/* Step Number */}
              <div className="mt-4">
                <span className="inline-flex items-center justify-center w-6 h-6 bg-purple-600 text-white text-xs font-bold rounded-full">
                  {index + 1}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="w-8 h-2 bg-purple-600 rounded-full"></div>
            <div className="w-8 h-2 bg-gray-600 rounded-full"></div>
            <div className="w-8 h-2 bg-gray-600 rounded-full"></div>
            <div className="w-8 h-2 bg-gray-600 rounded-full"></div>
          </div>
          <p className="text-gray-400 text-sm">Step 1 of 4</p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
          <button className="flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all duration-200 transform hover:scale-105 shadow-2xl">
            Let's Get Started
            <ArrowRight className="h-5 w-5" />
          </button>
          
          <button className="bg-gray-800 hover:bg-gray-700 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-200 border border-gray-600 hover:border-gray-500">
            Skip Setup
          </button>
        </div>

        {/* Skip Note */}
        <p className="text-gray-500 text-sm mt-4">
          You can always complete these steps later from your dashboard
        </p>

        {/* Feature Highlights */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Link2 className="h-8 w-8 text-blue-400" />
            </div>
            <h4 className="text-white font-semibold mb-2">Unlimited Links</h4>
            <p className="text-gray-400 text-sm">Add as many links as you want - social media, websites, portfolios, and more</p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-purple-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Palette className="h-8 w-8 text-purple-400" />
            </div>
            <h4 className="text-white font-semibold mb-2">Full Customization</h4>
            <p className="text-gray-400 text-sm">Choose from beautiful themes and customize every aspect of your page</p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-green-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <BarChart3 className="h-8 w-8 text-green-400" />
            </div>
            <h4 className="text-white font-semibold mb-2">Detailed Analytics</h4>
            <p className="text-gray-400 text-sm">Track clicks, views, and engagement to understand your audience</p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default OnboardingWelcome;