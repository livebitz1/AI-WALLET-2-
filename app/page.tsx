"use client";

import { useState, useEffect, useRef } from "react";
import { ChatInterface } from "@/components/ChatInterface";
import { TransactionHistory } from "@/components/TransactionHistory";
import { WalletButton } from "@/components/WalletButton";
import { TokenDisplay } from "@/components/TokenDisplay";
import { MarketTrends } from "@/components/MarketTrends"; // Import our new component
import { HeroSection } from "@/components/HeroSection";
import { FeatureShowcase } from "@/components/FeatureShowcase";
import { SubscriptionCards } from "@/components/SubscriptionCards";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletStore } from "@/lib/wallet-store";
import { motion } from "framer-motion";

export default function Home() {
  const { publicKey, connected } = useWallet();
  const { walletData } = useWalletStore();
  const [scrolled, setScrolled] = useState(false);
  const sectionRefs = useRef<HTMLDivElement[]>([]);
  const [commandHover, setCommandHover] = useState(false);

  // Animation timeline effects
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);

      // Animate sections as they come into view
      sectionRefs.current.forEach((ref) => {
        if (!ref) return;

        const rect = ref.getBoundingClientRect();
        const isInView = rect.top <= window.innerHeight * 0.75;

        if (isInView) {
          ref.classList.add("animate-appear");
        }
      });
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/90">
      {/* Animated background elements */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-grid-pattern opacity-5"></div>

        <div className="absolute top-10 right-10 w-72 h-72 rounded-full bg-primary/10 blur-3xl animate-float"></div>
        <div className="absolute bottom-10 left-10 w-80 h-80 rounded-full bg-accent/10 blur-3xl animate-float-delay"></div>

        {/* 3D-like floating orbs */}
        <div className="orb orb-1"></div>
        <div className="orb orb-2"></div>
        <div className="orb orb-3"></div>
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
            <div className="relative w-8 h-8">
              <div className="absolute inset-0 bg-primary rounded-full animate-pulse"></div>
              <div className="absolute inset-1 bg-background rounded-full flex items-center justify-center">
                <span className="text-primary font-bold">AI</span>
              </div>
            </div>
            <h1 className="text-xl font-bold tracking-tight">
              <span className="text-primary">AI</span> Wallet
            </h1>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex items-center ml-auto"
          >
            <WalletButton />
          </motion.div>
        </div>
      </header>

      <main className="container px-4 py-6 mx-auto max-w-7xl">
        {/* Hero section with 3D wallet visualization */}
        <HeroSection
          ref={(el) => el && (sectionRefs.current[0] = el)}
          walletConnected={connected}
        />

        {/* Subscription Cards */}
     

        {/* Main interface container - restructured for optimal space usage */}
        <div className="my-12 grid grid-cols-12 gap-4">
          {/* Left sidebar */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="col-span-12 lg:col-span-3 flex flex-col gap-4"
            ref={(el) => el && (sectionRefs.current[1] = el)}
          >
            {connected && publicKey ? (
              <TokenDisplay />
            ) : (
              <div className="rounded-xl border border-border/40 bg-card p-4 text-center shadow-lg transition-all hover:shadow-xl hover:border-primary/20 h-full min-h-[200px] flex flex-col items-center justify-center backdrop-blur-sm">
                <div className="relative w-16 h-16 mb-4">
                  <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping-slow"></div>
                  <div className="absolute inset-3 bg-primary/40 rounded-full animate-ping-slow animation-delay-300"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <svg
                      className="w-10 h-10 text-primary"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M19 5H5C3.89543 5 3 5.89543 3 7V17C3 18.1046 3.89543 19 5 19H19C20.1046 19 21 18.1046 21 17V7C21 5.89543 20.1046 5 19 5Z"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M3 7L12 13L21 7"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                </div>
                <h2 className="text-lg font-bold mb-2">Connect Wallet</h2>
                <p className="text-sm text-muted-foreground mb-4">Connect to see your tokens</p>
                <WalletButton />
              </div>
            )}

            {/* Replace the hardcoded Market trends card with our new component */}
            <MarketTrends />
          </motion.div>

          {/* Center panel - ChatInterface - This is where the AI functionality is */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="col-span-12 lg:col-span-6 flex flex-col"
            ref={(el) => el && (sectionRefs.current[2] = el)}
          >
            <div className="chat-interface h-full">
              <ChatInterface />
              {/* Voice input button removed */}
            </div>
          </motion.div>

          {/* Right sidebar */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="col-span-12 lg:col-span-3 flex flex-col gap-4"
            ref={(el) => el && (sectionRefs.current[3] = el)}
          >
            {connected && publicKey ? (
              <TransactionHistory />
            ) : (
              <div className="rounded-xl border border-border/40 bg-card p-4 text-center shadow-lg transition-all hover:shadow-xl hover:border-primary/20 h-full min-h-[200px] flex flex-col items-center justify-center backdrop-blur-sm">
                <div className="relative w-16 h-16 mb-4">
                  <div className="absolute inset-0 bg-accent/20 rounded-full animate-ping-slow"></div>
                  <div className="absolute inset-3 bg-accent/40 rounded-full animate-ping-slow animation-delay-300"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <svg
                      className="w-10 h-10 text-accent"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"
                        stroke="currentColor"
                        strokeWidth="2"
                      />
                      <path
                        d="M12 7V12L15 15"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                    </svg>
                  </div>
                </div>
                <h2 className="text-lg font-bold mb-2">Transaction History</h2>
                <p className="text-sm text-muted-foreground mb-4">
                  Connect to view your activity
                </p>
                <WalletButton />
              </div>
            )}

            {/* Quick actions card */}
            <div className="rounded-xl border border-border/40 bg-card p-4 shadow-lg hover:shadow-xl transition-all">
              <h3 className="text-base font-medium mb-3">Quick Actions</h3>
              <div className="grid grid-cols-2 gap-2">
                {["Send", "Receive", "Swap", "Buy"].map((action, i) => (
                  <button
                    key={action}
                    className="p-2 text-sm rounded-lg border border-border/50 hover:border-primary/50 hover:bg-primary/5 transition-all flex flex-col items-center justify-center"
                  >
                    <div className="w-6 h-6 mb-1 flex items-center justify-center text-primary">
                      {i === 0 && <span>↗</span>}
                      {i === 1 && <span>↘</span>}
                      {i === 2 && <span>⇄</span>}
                      {i === 3 && <span>$</span>}
                    </div>
                    {action}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Feature showcase section */}
        <FeatureShowcase ref={(el) => el && (sectionRefs.current[4] = el)} />

        {/* Security section with subtle 3D rotation */}
        <section
          className="py-12 my-12 border-t border-b border-border/30"
          ref={(el) => el && (sectionRefs.current[5] = el)}
        >
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-4 gradient-text">
              Security You Can Trust
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Your security is our priority. Our AI assistant handles your
              instructions while keeping your keys safely in your wallet.
            </p>
          </div>

          <div className="perspective-container">
            <div className="security-card">
              <div className="grid md:grid-cols-3 gap-6">
                {[
                  {
                    title: "Non-Custodial",
                    description:
                      "Your keys always stay safely in your wallet. We never have access to your funds.",
                    icon: "🔐",
                  },
                  {
                    title: "AI-Powered Safety",
                    description:
                      "Our AI verifies transactions match your intent and prevents malicious actions.",
                    icon: "🛡️",
                  },
                  {
                    title: "Transaction Preview",
                    description:
                      "Always see what you're sending before signing any transaction.",
                    icon: "👁️",
                  },
                ].map((item, i) => (
                  <div key={i} className="security-feature">
                    <div className="text-4xl mb-4">{item.icon}</div>
                    <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                    <p className="text-muted-foreground">{item.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials section with floating cards */}
        <section
          className="py-12 my-12"
          ref={(el) => el && (sectionRefs.current[6] = el)}
        >
          <h2 className="text-3xl font-bold mb-12 text-center gradient-text">
            What Users Are Saying
          </h2>

          <div className="testimonials-container">
            {[
              {
                quote:
                  "The AI actually understood what I wanted to do with my crypto. No more fumbling through DEX interfaces!",
                name: "Alex K.",
                role: "DeFi Enthusiast",
              },
              {
                quote:
                  "Being able to ask questions about my own wallet and get meaningful answers is a game-changer.",
                name: "Sophia L.",
                role: "Solana Developer",
              },
              {
                quote:
                  "As a newcomer to Web3, this wallet makes everything so much more accessible. The AI is like having a guide.",
                name: "Marco T.",
                role: "Crypto Beginner",
              },
            ].map((testimonial, i) => (
              <div key={i} className="testimonial-card">
                <div className="relative">
                  <div className="absolute -top-4 -left-2 text-4xl text-primary/20">
                    "
                  </div>
                  <p className="mb-4 relative z-10">{testimonial.quote}</p>
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center mr-3">
                      {testimonial.name[0]}
                    </div>
                    <div>
                      <p className="font-medium">{testimonial.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {testimonial.role}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Call to action */}
        <section
          className="py-16 my-12 text-center"
          ref={(el) => el && (sectionRefs.current[7] = el)}
        >
          <div className="max-w-3xl mx-auto relative overflow-hidden rounded-2xl border border-primary/20 p-8 backdrop-blur-sm">
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/30 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-accent/30 rounded-full blur-3xl"></div>

            <h2 className="text-3xl font-bold mb-4 gradient-text">
              Experience the Future of Crypto
            </h2>
            <p className="text-xl mb-8 text-muted-foreground">
              Interact with your wallet through natural language. No more
              complex interfaces.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
              {!connected && <WalletButton />}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-6 py-3 rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-all"
                onClick={() =>
                  document
                    .querySelector(".chat-interface")
                    ?.scrollIntoView({ behavior: "smooth" })
                }
              >
                Try the AI Assistant
              </motion.button>
            </div>
          </div>
        </section>

        {/* Add the diagnostics at the bottom of the page */}
        <div className="mt-8">
        </div>
      </main>

      {/* Command Menu */}
      <motion.div 
        className="fixed bottom-6 right-6 z-50"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1, duration: 0.3 }}
        onHoverStart={() => setCommandHover(true)}
        onHoverEnd={() => setCommandHover(false)}
      >
        <motion.div
          className="relative"
          animate={{ width: commandHover ? "auto" : "auto" }}
        >
          {/* Command button */}
          <motion.button 
            className={`w-12 h-12 rounded-full ${
              commandHover ? "bg-primary" : "bg-primary/80"
            } text-primary-foreground flex items-center justify-center shadow-lg hover:shadow-xl transition-all`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
            </svg>
          </motion.button>
          
          {/* Command menu */}
          <motion.div 
            className="absolute bottom-14 right-0 w-64 bg-card rounded-lg shadow-xl border border-border/50 backdrop-blur-sm overflow-hidden"
            initial={{ opacity: 0, y: 10, height: 0 }}
            animate={{ 
              opacity: commandHover ? 1 : 0,
              y: commandHover ? 0 : 10,
              height: commandHover ? "auto" : 0,
              pointerEvents: commandHover ? "auto" : "none"
            }}
            transition={{ duration: 0.2 }}
          >
            <div className="p-3 border-b border-border/50">
              <h3 className="font-medium text-sm">Get Started</h3>
            </div>
            <div className="p-2">
              {[
                { command: "Check balance", description: "View your current tokens", icon: "💰" },
                { command: "Send 0.01 SOL to address", description: "Transfer to another wallet", icon: "📤" },
                { command: "Swap 0.1 SOLto USDC", description: "Swap the coins", icon: "📜" },
                { command: "Get help", description: "Chat with AI assistant", icon: "🤖" },
              ].map((item, i) => (
                <motion.div 
                  key={i}
                  className="flex items-center p-2 hover:bg-primary/10 rounded-md cursor-pointer transition-colors"
                  whileHover={{ x: 3 }}
                  initial={{ opacity: 0, x: -5 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 * i }}
                >
                  <div className="w-8 h-8 mr-3 rounded-md bg-primary/10 flex items-center justify-center text-lg">
                    {item.icon}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{item.command}</p>
                    <p className="text-xs text-muted-foreground">{item.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
            <div className="p-2 bg-muted/30 border-t border-border/50">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Press <kbd className="px-2 py-0.5 rounded bg-muted">?</kbd> for shortcuts</span>
                <span>v1.0</span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </motion.div>

      {/* 3D Floating Icons - Fixed position - Performance Optimized */}
      <div className="fixed right-4 top-1/4 hidden xl:block h-screen pointer-events-none">
        <div className="relative h-full w-48">
          {[
            { icon: "₿", color: "bg-yellow-500/80", size: "w-12 h-12", delay: 0, path: [10, -20, 15] },
            { icon: "Ξ", color: "bg-blue-500/80", size: "w-10 h-10", delay: 2, path: [-15, 25, -10] },
            { icon: "◎", color: "bg-purple-500/80", size: "w-14 h-14", delay: 1, path: [5, -15, 20] },
            { icon: "$", color: "bg-green-500/80", size: "w-8 h-8", delay: 3, path: [-20, 5, -25] },
            { icon: "Ⓝ", color: "bg-red-500/80", size: "w-9 h-9", delay: 2.5, path: [25, -10, 5] },
            { icon: "⟠", color: "bg-indigo-500/80", size: "w-11 h-11", delay: 1.5, path: [-5, 20, -15] }
          ].map((item, i) => (
            <motion.div
              key={i}
              className={`absolute ${item.size} rounded-full ${item.color} backdrop-blur-sm shadow-lg flex items-center justify-center text-white font-bold text-xl`}
              style={{ 
                willChange: "transform, opacity",
                transform: "translate3d(0, 0, 0)", // Hardware acceleration
                position: "absolute",
                top: 50 + i * 60,
                left: i % 2 === 0 ? 0 : 20
              }}
              initial={{ opacity: 0, scale: 0 }}
              animate={{
                opacity: 0.9,
                scale: 1,
                y: [item.path[0], item.path[1], item.path[0]],
                x: [item.path[2], -item.path[2], item.path[2]],
                rotateY: [0, 180, 360]
              }}
              transition={{
                duration: 15,
                repeat: Infinity,
                repeatType: "reverse",
                ease: "easeInOut",
                delay: item.delay,
                rotateY: {
                  duration: 20,
                  ease: "linear",
                  repeat: Infinity
                }
              }}
              aria-hidden="true"
            >
              {item.icon}
            </motion.div>
          ))}
        </div>
      </div>

      {/* 3D Crypto Cards Floating - Performance Optimized */}
      <div className="fixed right-0 bottom-1/3 hidden xl:block pointer-events-none">
        <div className="relative h-96 w-40">
          {[
            { name: "SOL", bgClass: "bg-gradient-to-br from-purple-500/20 to-blue-500/20" },
            { name: "USDC", bgClass: "bg-gradient-to-br from-blue-500/20 to-indigo-500/20" },
            { name: "BTC", bgClass: "bg-gradient-to-br from-yellow-500/20 to-orange-500/20" }
          ].map((coin, i) => (
            <motion.div
              key={i}
              className={`absolute w-32 h-48 rounded-xl backdrop-blur-sm border border-white/10 shadow-xl overflow-hidden ${coin.bgClass}`}
              style={{ 
                willChange: "transform, opacity",
                transform: "translate3d(0, 0, 0)", // Hardware acceleration
                position: "absolute",
                top: i * 60
              }}
              initial={{ 
                opacity: 0, 
                rotateY: 45,
                x: 50
              }}
              animate={{
                opacity: 0.8,
                rotateY: [45, 25, 45],
                rotateX: [15, 5, 15],
                x: [50, 30, 50],
                y: [0, 10, 0]
              }}
              transition={{
                duration: 10,
                repeat: Infinity,
                repeatType: "reverse",
                ease: "easeInOut",
                delay: i * 1.5
              }}
              aria-hidden="true"
            >
              <div className="p-4 h-full flex flex-col justify-between">
                <div className="flex justify-between items-start">
                  <div className={`w-10 h-10 rounded-full bg-${coin.name === "SOL" ? "purple" : coin.name === "USDC" ? "blue" : "yellow"}-400/30 flex items-center justify-center`}>
                    <span className="text-white font-bold">{coin.name.charAt(0)}</span>
                  </div>
                  <span className="text-xs font-medium text-white">
                    {coin.name}
                  </span>
                </div>
                
                <div>
                  <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full bg-white/40 rounded-full"
                      initial={{ width: "20%" }}
                      animate={{ width: ["20%", "80%", "20%"] }}
                      transition={{
                        duration: 8,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: i * 1.2
                      }}
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* 3D Network Nodes Animation - Performance Optimized */}
      <div className="fixed right-12 top-12 hidden 2xl:block">
        <motion.div
          className="w-48 h-48 relative"
          style={{ 
            willChange: "transform",
            transform: "translate3d(0, 0, 0)" // Hardware acceleration
          }}
          animate={{ rotateY: 360 }}
          transition={{
            duration: 30,
            repeat: Infinity,
            ease: "linear"
          }}
          aria-hidden="true"
        >
          {Array.from({ length: 6 }).map((_, i) => { // Reduced from 8 to 6 for performance
            const angle = (i / 6) * Math.PI * 2;
            const x = Math.cos(angle) * 60;
            const y = Math.sin(angle) * 60;
            return (
              <motion.div
                key={i}
                className="absolute w-3 h-3 bg-primary/50 rounded-full"
                style={{
                  left: "50%",
                  top: "50%",
                  x,
                  y,
                  boxShadow: "0 0 10px rgba(255,255,255,0.2)",
                  willChange: "transform, opacity"
                }}
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.5, 0.8, 0.5]
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  repeatType: "reverse",
                  ease: "easeInOut",
                  delay: i * 0.3
                }}
              >
                {/* Pre-determined connections instead of random ones */}
                {i % 2 === 0 && (
                  <motion.div
                    className="absolute left-1/2 top-1/2 h-[1px] bg-primary/20 origin-left"
                    style={{
                      width: 60,
                      rotate: `${(i + 1) * 60}deg`
                    }}
                    animate={{ opacity: [0.1, 0.5, 0.1] }}
                    transition={{
                      duration: 4,
                      repeat: Infinity,
                      repeatType: "reverse",
                      ease: "easeInOut",
                      delay: i * 0.5
                    }}
                  />
                )}
              </motion.div>
            );
          })}
          <motion.div
            className="absolute left-1/2 top-1/2 w-6 h-6 -ml-3 -mt-3 bg-primary/30 rounded-full"
            style={{ willChange: "transform, box-shadow" }}
            animate={{ 
              scale: [1, 1.2, 1]
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              repeatType: "reverse",
              ease: "easeInOut"
            }}
          />
        </motion.div>
      </div>
      <section className="py-16 my-8">
          <SubscriptionCards />
        </section>

      {/* Footer */}
      <footer className="border-t border-border/30 bg-background/50 backdrop-blur-sm">
        <div className="container px-4 py-8 mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                <span className="text-primary font-bold text-xs">AI</span>
              </div>
              <p className="text-sm">© 2023 AI Wallet. All rights reserved.</p>
            </div>

            <div className="flex space-x-6">
              {["Twitter", "Discord", "GitHub", "Documentation"].map(
                (item, i) => (
                  <a
                    key={i}
                    href="#"
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {item}
                  </a>
                )
              )}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
