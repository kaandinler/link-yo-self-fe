'use client';
import React, { useState } from 'react';
import {
  Plus,
  Eye,
  Edit3,
  BarChart3,
  Share2,
  Settings,
  Link2,
  Users,
  TrendingUp,
  Copy,
  ExternalLink,
} from 'lucide-react';

const Dashboard = () => {
  const [copied, setCopied] = useState(false);

  // Mock user data - gerçek projede context'ten gelecek
  const user = {
    username: 'johndoe',
    displayName: 'John Doe',
    profileImage: null,
    totalClicks: 1247,
    totalLinks: 8,
    profileViews: 342,
    profileUrl: 'linkyoself.com/johndoe',
  };

  const handleCopyProfile = () => {
    navigator.clipboard.writeText(`https://${user.profileUrl}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const recentLinks = [
    {
      id: 1,
      title: 'Instagram Profile',
      url: 'instagram.com/johndoe',
      clicks: 324,
      isActive: true,
    },
    {
      id: 2,
      title: 'Twitter Account',
      url: 'twitter.com/johndoe',
      clicks: 256,
      isActive: true,
    },
    {
      id: 3,
      title: 'Personal Website',
      url: 'johndoe.dev',
      clicks: 189,
      isActive: true,
    },
    {
      id: 4,
      title: 'YouTube Channel',
      url: 'youtube.com/@johndoe',
      clicks: 167,
      isActive: false,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">
              Welcome back, {user.displayName}! 👋
            </h1>
            <p className="text-gray-400 mt-1">
              Manage your links and track your performance
            </p>
          </div>

          <div className="flex gap-3">
            <button className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg border border-gray-600 transition-colors">
              <Eye className="h-4 w-4" />
              Preview Page
            </button>
            <button className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-4 py-2 rounded-lg transition-all">
              <Plus className="h-4 w-4" />
              Add Link
            </button>
          </div>
        </div>

        {/* Profile URL Card */}
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">
                Your Profile URL
              </h3>
              <div className="flex items-center gap-2 text-purple-400 font-mono">
                <Link2 className="h-4 w-4" />
                {user.profileUrl}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleCopyProfile}
                className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <Copy className="h-4 w-4" />
                {copied ? 'Copied!' : 'Copy'}
              </button>
              <button className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors">
                <Share2 className="h-4 w-4" />
                Share
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 backdrop-blur-sm border border-blue-500/30 rounded-2xl p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
                <BarChart3 className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-gray-400 text-sm">Total Clicks</p>
                <p className="text-2xl font-bold text-white">
                  {user.totalClicks.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 backdrop-blur-sm border border-purple-500/30 rounded-2xl p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center">
                <Link2 className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-gray-400 text-sm">Active Links</p>
                <p className="text-2xl font-bold text-white">
                  {user.totalLinks}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 backdrop-blur-sm border border-green-500/30 rounded-2xl p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-gray-400 text-sm">Profile Views</p>
                <p className="text-2xl font-bold text-white">
                  {user.profileViews}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">
            Quick Actions
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button className="flex flex-col items-center gap-2 p-4 bg-gray-700/50 hover:bg-gray-600/50 rounded-xl transition-colors group">
              <Plus className="h-6 w-6 text-purple-400 group-hover:scale-110 transition-transform" />
              <span className="text-sm text-gray-300">Add Link</span>
            </button>
            <button className="flex flex-col items-center gap-2 p-4 bg-gray-700/50 hover:bg-gray-600/50 rounded-xl transition-colors group">
              <Edit3 className="h-6 w-6 text-blue-400 group-hover:scale-110 transition-transform" />
              <span className="text-sm text-gray-300">Edit Profile</span>
            </button>
            <button className="flex flex-col items-center gap-2 p-4 bg-gray-700/50 hover:bg-gray-600/50 rounded-xl transition-colors group">
              <Settings className="h-6 w-6 text-green-400 group-hover:scale-110 transition-transform" />
              <span className="text-sm text-gray-300">Customize</span>
            </button>
            <button className="flex flex-col items-center gap-2 p-4 bg-gray-700/50 hover:bg-gray-600/50 rounded-xl transition-colors group">
              <BarChart3 className="h-6 w-6 text-orange-400 group-hover:scale-110 transition-transform" />
              <span className="text-sm text-gray-300">Analytics</span>
            </button>
          </div>
        </div>

        {/* Recent Links */}
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-white">Your Links</h3>
            <button className="text-purple-400 hover:text-purple-300 transition-colors">
              View All
            </button>
          </div>

          <div className="space-y-3">
            {recentLinks.map((link) => (
              <div
                key={link.id}
                className="flex items-center justify-between p-4 bg-gray-700/30 hover:bg-gray-700/50 rounded-xl transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-3 h-3 rounded-full ${link.isActive ? 'bg-green-400' : 'bg-gray-500'}`}
                  ></div>
                  <div>
                    <p className="text-white font-medium">{link.title}</p>
                    <p className="text-gray-400 text-sm">{link.url}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-white font-medium">{link.clicks}</p>
                    <p className="text-gray-400 text-xs">clicks</p>
                  </div>
                  <button className="text-gray-400 hover:text-white transition-colors">
                    <ExternalLink className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">
            Recent Activity
          </h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-gray-700/30 rounded-lg">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-white text-sm">
                  Your Instagram link got 25 new clicks
                </p>
                <p className="text-gray-400 text-xs">2 hours ago</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-700/30 rounded-lg">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <Users className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-white text-sm">
                  12 people viewed your profile
                </p>
                <p className="text-gray-400 text-xs">5 hours ago</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-700/30 rounded-lg">
              <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                <Link2 className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-white text-sm">
                  You added a new link: "Portfolio Website"
                </p>
                <p className="text-gray-400 text-xs">1 day ago</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
