"use client";

import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";

// Roadmap data
const roadmapItems = [
  {
    title: "Inteliq V2",
    description: "Multi-wallet agent control, voice-mode, and adaptive execution modules",
    date: "May 20, 2025",
    icon: "🚀",
    color: "from-blue-500/20 to-purple-500/20"
  },
  {
    title: "Advanced Portfolio Analyzer",
    description: "Full asset summary, sentiment logic & personalized alerts",
    date: "May 23, 2025",
    icon: "📊",
    color: "from-green-500/20 to-teal-500/20"
  },
  {
    title: "Telegram Command Agent",
    description: "Wallet control directly via Telegram prompts",
    date: "May 25, 2025",
    icon: "💬",
    color: "from-cyan-500/20 to-blue-500/20"
  },
  {
    title: "NFT Analyzer Module",
    description: "Holder map, risk analysis & metadata breakdown",
    date: "May 27, 2025",
    icon: "🖼️",
    color: "from-pink-500/20 to-purple-500/20"
  },
  {
    title: "Smart Prompt Builder",
    description: "One-click actions & prompt suggestion UI",
    date: "May 30, 2025",
    icon: "✨",
    color: "from-amber-500/20 to-orange-500/20"
  },
  {
    title: "Token Utility Dashboard",
    description: "View benefits, unlocks & premium access levels",
    date: "June 1, 2025",
    icon: "🔑",
    color: "from-yellow-500/20 to-amber-500/20"
  }
];

export default function Roadmap() {
  const [scrolled, setScrolled] = useState(false);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Handle scroll effects
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
      
      // Animate cards as they come into view
      cardRefs.current.forEach((ref, index) => {
        if (!ref) return;
        
        const rect = ref.getBoundingClientRect();
        const isInView = rect.top <= window.innerHeight * 0.85;
        
        if (isInView) {
          setTimeout(() => {
            ref.classList.add("opacity-100", "translate-y-0");
            ref.classList.remove("opacity-0", "translate-y-10");
          }, index * 100); // Staggered animation
        }
      });
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll(); // Initial check
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/90">
      {/* Animated background */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-grid-pattern opacity-5"></div>
        <div className="absolute top-10 right-10 w-72 h-72 rounded-full bg-primary/10 blur-3xl animate-float"></div>
        <div className="absolute bottom-10 left-10 w-80 h-80 rounded-full bg-accent/10 blur-3xl animate-float-delay"></div>
      </div>

      {/* Header with animated reveal */}
      <header
        className={`sticky top-0 z-50 w-full border-b backdrop-blur-md transition-all duration-300 ${
          scrolled ? "border-border/60 bg-background/70" : "border-transparent bg-transparent"
        }`}
      >
        <div className="container flex items-center justify-between h-16 px-4">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center space-x-2"
          >
            <Link href="/" className="flex items-center space-x-2">
              <div className="relative w-8 h-8">
                <div className="absolute inset-0 bg-primary rounded-full animate-pulse"></div>
                <div className="absolute inset-1 bg-background rounded-full flex items-center justify-center">
                  <span className="text-primary font-bold">AI</span>
                </div>
              </div>
              <h1 className="text-xl font-bold tracking-tight">
                <span className="text-primary">AI</span> Wallet
              </h1>
            </Link>
          </motion.div>

          <motion.nav
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex items-center space-x-6"
          >
            <Link href="/" className="text-sm font-medium hover:text-primary transition-colors">
              Home
            </Link>
            <Link href="/roadmap" className="text-sm font-medium text-primary">
              Roadmap
            </Link>
          </motion.nav>
        </div>
      </header>

      <main className="container px-4 py-12 mx-auto max-w-7xl">
        {/* Hero section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="text-center mb-16"
        >
          <div className="inline-block mb-4">
            <div className="relative w-20 h-20 mx-auto">
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/30 to-accent/30 rounded-full blur-md"></div>
              <div className="absolute inset-0 flex items-center justify-center text-4xl">🚀</div>
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-6 gradient-text">
            Product Roadmap
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Our vision for the future of AI Wallet. Explore upcoming features and innovations that will revolutionize your crypto experience.
          </p>
        </motion.div>

        {/* Timeline visualization */}
        <div className="hidden md:block w-full h-1 bg-gradient-to-r from-primary/5 via-primary/30 to-primary/5 rounded-full mb-12"></div>

        {/* Roadmap grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative">
          {roadmapItems.map((item, index) => (
            <div
              key={index}
              ref={(el) => cardRefs.current[index] = el}
              className="opacity-0 translate-y-10 transition-all duration-700 ease-out"
            >
              <motion.div
                whileHover={{ scale: 1.03, boxShadow: "0 10px 30px -10px rgba(0,0,0,0.3)" }}
                className={`h-full rounded-xl border border-border/40 bg-gradient-to-br ${item.color} backdrop-blur-sm p-6 shadow-lg relative overflow-hidden`}
              >
                {/* Background glow effect */}
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/5 rounded-full blur-xl"></div>
                <div className="absolute -bottom-16 -left-10 w-40 h-40 bg-white/5 rounded-full blur-xl"></div>
                
                {/* Date badge */}
                <div className="absolute top-4 right-4 text-xs bg-background/80 backdrop-blur-sm border border-border/40 rounded-full px-3 py-1 font-medium">
                  {item.date}
                </div>
                
                {/* Icon */}
                <div className="bg-background/30 backdrop-blur-sm w-14 h-14 rounded-full flex items-center justify-center mb-4 border border-border/40 text-2xl shadow-inner">
                  {item.icon}
                </div>
                
                {/* Content */}
                <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                <p className="text-muted-foreground">{item.description}</p>
                
                {/* Connection line for desktop */}
                <div className="absolute top-1/2 -right-3 w-3 h-1 bg-primary/30 hidden md:block md:even:hidden"></div>
                <div className="absolute top-1/2 -left-3 w-3 h-1 bg-primary/30 hidden md:even:block lg:odd:hidden"></div>
              </motion.div>
            </div>
          ))}
        </div>
        
        {/* Future updates hint */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.8 }}
          className="text-center mt-20 mb-12"
        >
          <div className="inline-block rounded-full border border-primary/30 px-6 py-3 text-sm text-muted-foreground bg-background/50 backdrop-blur-sm">
            More exciting features coming soon! This roadmap is regularly updated.
          </div>
        </motion.div>
        
        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 1 }}
          className="mt-24 text-center"
        >
          <div className="max-w-3xl mx-auto relative overflow-hidden rounded-2xl border border-primary/20 p-8 backdrop-blur-sm">
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/30 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-accent/30 rounded-full blur-3xl"></div>

            <h2 className="text-2xl font-bold mb-4 gradient-text">
              Join Us On This Journey
            </h2>
            <p className="text-lg mb-8 text-muted-foreground">
              Be part of our community to stay updated on our progress and influence future developments.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-6 py-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary/80 transition-all"
              >
                Join Discord
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-6 py-3 rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-all"
              >
                Follow on Twitter
              </motion.button>
            </div>
          </div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/30 bg-background/50 backdrop-blur-sm mt-24">
        <div className="container px-4 py-8 mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                <span className="text-primary font-bold text-xs">AI</span>
              </div>
              <p className="text-sm">© 2023 AI Wallet. All rights reserved.</p>
            </div>

            <div className="flex space-x-6">
              {["Twitter", "Discord", "GitHub", "Documentation"].map((item, i) => (
                <a
                  key={i}
                  href="#"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {item}
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
