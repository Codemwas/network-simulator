// src/pages/LandingPage.jsx
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Network, 
  Shield, 
  Zap, 
  Activity, 
  BarChart3, 
  Users,
  ArrowRight,
  CheckCircle 
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-primary-500/[0.03] bg-[size:50px_50px]" />
        <div className="container mx-auto px-6 py-24 relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-4xl mx-auto"
          >
            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-primary-600 to-blue-600 bg-clip-text text-transparent">
              Real-Time Network Simulation
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
              Build, monitor, and troubleshoot virtual networks in real-time. 
              The ultimate platform for IT students and network administrators.
            </p>
            <div className="flex gap-4 justify-center">
              <Link
                to="/register"
                className="px-8 py-3 bg-primary-500 text-white rounded-xl font-medium hover:bg-primary-600 transition shadow-lg shadow-primary-500/30"
              >
                Get Started Free
              </Link>
              <Link
                to="/login"
                className="px-8 py-3 border border-gray-300 dark:border-gray-600 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition"
              >
                Sign In
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white/50 dark:bg-gray-800/50">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: '10k+', label: 'Active Users' },
              { value: '50k+', label: 'Networks Built' },
              { value: '99.9%', label: 'Uptime' },
              { value: '24/7', label: 'Support' },
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <div className="text-3xl md:text-4xl font-bold text-primary-500">{stat.value}</div>
                <div className="text-gray-600 dark:text-gray-400 mt-2">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">Enterprise-Grade Features</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: Network, title: 'Visual Network Builder', desc: 'Drag-and-drop interface with real-time device configuration' },
              { icon: Activity, title: 'Live Packet Simulation', desc: 'Watch packets travel, monitor latency and congestion' },
              { icon: Shield, title: 'Cybersecurity Lab', desc: 'Simulate attacks, test firewall rules, learn defense' },
              { icon: BarChart3, title: 'Analytics Dashboard', desc: 'Real-time metrics, bandwidth usage, and alerts' },
              { icon: Users, title: 'Multi-User Collaboration', desc: 'Team up on network designs and troubleshooting' },
              { icon: Zap, title: 'AI-Powered Diagnostics', desc: 'Intelligent chatbot for instant network analysis' },
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="glass-card p-6 hover:scale-105 transition-transform duration-300"
              >
                <feature.icon className="w-12 h-12 text-primary-500 mb-4" />
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-600 dark:text-gray-400">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary-500">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Ready to master networking?</h2>
          <p className="text-white/90 mb-8 text-lg">Join thousands of students and professionals</p>
          <Link
            to="/register"
            className="inline-flex items-center gap-2 px-8 py-3 bg-white text-primary-500 rounded-xl font-semibold hover:shadow-xl transition"
          >
            Start Building Now <ArrowRight size={20} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-gray-200 dark:border-gray-800">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="font-bold text-lg mb-4">NetSim Pro</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Enterprise network simulation platform</p>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Product</h4>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li>Features</li>
                <li>Pricing</li>
                <li>Documentation</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Company</h4>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li>About</li>
                <li>Blog</li>
                <li>Careers</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Legal</h4>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li>Privacy</li>
                <li>Terms</li>
                <li>Security</li>
              </ul>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}