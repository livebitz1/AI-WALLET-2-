"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Search, Twitter as TwitterIcon, Calendar, Filter, Star, RefreshCw, ArrowRight } from "lucide-react";

export default function TwitterFeed() {
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [highlightedTweet, setHighlightedTweet] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Handle scroll effects
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);

      const scrollY = window.scrollY;
      document.querySelectorAll(".parallax-slow").forEach((el: any) => {
        el.style.transform = `translateY(${scrollY * 0.02}px)`;
      });

      document.querySelectorAll(".parallax-fast").forEach((el: any) => {
        el.style.transform = `translateY(${scrollY * -0.03}px)`;
      });
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Mock tweet data - in a real application, this would come from an API or backend
  const tweets = [
    {
      id: 1,
      content: "Excited to announce the upcoming release of AI Wallet v2.0 with new features including multi-chain support and advanced portfolio analytics! #AIWallet #Crypto",
      date: "April 15, 2025",
      likes: 245,
      retweets: 87,
      category: "announcement",
      isPinned: true,
    },
    {
      id: 2,
      content: "Our AI-powered portfolio suggestion feature has just been rolled out to all Pro users. Simply ask the assistant for recommendations based on your risk profile! #AIWallet #PortfolioManagement",
      date: "April 12, 2025",
      likes: 198,
      retweets: 53,
      category: "update",
      isPinned: false,
    },
    {
      id: 3,
      content: "Community AMA happening next Friday at 2PM UTC. Join us to discuss our roadmap for Q2 and get all your questions answered by our team! #AIWallet #AMA #CryptoTech",
      date: "April 10, 2025",
      likes: 135,
      retweets: 41,
      category: "community",
      isPinned: false,
    },
    {
      id: 4,
      content: "Just published our deep dive into blockchain interoperability and how AI Wallet is preparing to support cross-chain transactions seamlessly. Read now on our blog! #Blockchain #Interoperability",
      date: "April 7, 2025",
      likes: 172,
      retweets: 63,
      category: "education",
      isPinned: false,
    },
    {
      id: 5,
      content: "Seeing incredible growth in our user base this month - over 50k new wallets connected! Thanks to our amazing community for spreading the word. #AIWallet #Growth #Web3",
      date: "April 3, 2025",
      likes: 301,
      retweets: 92,
      category: "milestone",
      isPinned: false,
    },
    {
      id: 6,
      content: "💡 Tip: Use the voice command feature by clicking the mic button to quickly swap tokens or check your balance without typing. #AIWallet #VoiceCommands #UX",
      date: "March 29, 2025",
      likes: 118,
      retweets: 31,
      category: "tip",
      isPinned: false,
    },
    {
      id: 7,
      content: "We're listening! Based on your feedback, we've added support for custom token alerts. Set price thresholds and get notified when they're reached. #AIWallet #NewFeature",
      date: "March 25, 2025",
      likes: 226,
      retweets: 58,
      category: "update",
      isPinned: false,
    },
    {
      id: 8,
      content: "Security alert: Be aware of phishing attempts claiming to be from AI Wallet. We never DM you first or ask for your seed phrase. Stay safe! #CryptoSecurity #Phishing",
      date: "March 21, 2025",
      likes: 419,
      retweets: 187,
      category: "security",
      isPinned: true,
    },
    {
      id: 9,
      content: "Did you know our AI assistant can compare tokenomics of different projects? Just ask \"Compare tokenomics of SOL and JUP\" to get a detailed analysis! #AIWallet #Tokenomics",
      date: "March 18, 2025",
      likes: 156,
      retweets: 47,
      category: "tip",
      isPinned: false,
    },
    {
      id: 10,
      content: "Happy to announce our partnership with @SolanaFoundation to improve wallet infrastructure and provide better services to the Solana ecosystem! #Partnership #Solana",
      date: "March 15, 2025",
      likes: 587,
      retweets: 203,
      category: "announcement",
      isPinned: false,
    },
  ];

  // Filter tweets based on category and search query
  const filteredTweets = tweets
    .filter(tweet => {
      if (activeCategory === "all") return true;
      if (activeCategory === "pinned") return tweet.isPinned;
      return tweet.category === activeCategory;
    })
    .filter(tweet => {
      if (!searchQuery) return true;
      return tweet.content.toLowerCase().includes(searchQuery.toLowerCase());
    });

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } },
  };

  const cardVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    show: { opacity: 1, scale: 1, transition: { type: "spring", stiffness: 200, damping: 20 } },
  };

  // Category UI elements
  const categories = [
    { id: "all", name: "All Tweets", icon: <TwitterIcon className="w-4 h-4" /> },
    { id: "pinned", name: "Pinned", icon: <Star className="w-4 h-4" /> },
    { id: "announcement", name: "Announcements", icon: <ArrowRight className="w-4 h-4" /> },
    { id: "update", name: "Updates", icon: <RefreshCw className="w-4 h-4" /> },
    { id: "community", name: "Community", icon: <TwitterIcon className="w-4 h-4" /> },
    { id: "education", name: "Education", icon: <ArrowRight className="w-4 h-4" /> },
    { id: "tip", name: "Tips", icon: <Star className="w-4 h-4" /> },
    { id: "security", name: "Security", icon: <ArrowRight className="w-4 h-4" /> },
  ];

  // Helper functions for tweet categorization
  const getCategoryColor = (category: string) => {
    switch (category) {
      case "announcement":
        return "bg-blue-500/15 text-blue-500";
      case "update":
        return "bg-green-500/15 text-green-500";
      case "community":
        return "bg-purple-500/15 text-purple-500";
      case "education":
        return "bg-amber-500/15 text-amber-500";
      case "milestone":
        return "bg-indigo-500/15 text-indigo-500";
      case "tip":
        return "bg-cyan-500/15 text-cyan-500";
      case "security":
        return "bg-red-500/15 text-red-500";
      default:
        return "bg-primary/15 text-primary";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/90" ref={containerRef}>
      {/* Animated background elements */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-grid-pattern opacity-5"></div>
        <div className="absolute top-10 right-10 w-72 h-72 rounded-full bg-primary/10 blur-3xl animate-float"></div>
        <div className="absolute bottom-10 left-10 w-80 h-80 rounded-full bg-accent/10 blur-3xl animate-float-delay"></div>
      </div>

      {/* Header */}
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
                <div className="absolute inset-0 bg-primary/30 rounded-full animate-pulse"></div>
                <motion.div 
                  className="absolute inset-0 flex items-center justify-center"
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                >
                  <Image 
                    src="/logo.webp" 
                    alt="AI Wallet Logo" 
                    width={32} 
                    height={32} 
                    className="rounded-full object-cover z-10"
                  />
                </motion.div>
              </div>
              <h1 className="text-xl font-bold tracking-tight">
                <span className="text-primary">AI</span> Wallet
              </h1>
            </Link>
          </motion.div>

          <motion.nav
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="hidden md:flex items-center space-x-1 mx-4"
          >
            <NavLink href="/" active={pathname === "/"}>
              Home
            </NavLink>
            <NavLink href="/past-updates" active={pathname === "/past-updates"}>
              Updates
            </NavLink>
            <NavLink href="/twitter-feed" active={pathname === "/twitter-feed"}>
              <div className="flex items-center">
                <span className="mr-1.5">Twitter Feed</span>
                <span className="inline-flex items-center justify-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-primary/20 text-primary">
                  New
                </span>
              </div>
            </NavLink>
          </motion.nav>
        </div>
      </header>

      <main className="container px-4 py-12 mx-auto max-w-7xl">
        {/* Page title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-4 relative inline-block">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#1da1f2] to-primary">Twitter Feed</span>
            <div className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-[#1da1f2]/50 to-primary/50 rounded-full"></div>
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Stay up to date with our latest announcements, updates, and community interactions
          </p>
        </motion.div>

        {/* Search and filter section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mb-8"
        >
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Search box */}
            <div className="relative w-full md:w-auto md:min-w-[300px]">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Search className="w-4 h-4 text-muted-foreground" />
              </div>
              <input
                type="text"
                placeholder="Search tweets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-background/60 border border-border/40 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            {/* Category filters - horizontal scrolling on mobile */}
            <div className="flex items-center space-x-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 no-scrollbar">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setActiveCategory(category.id)}
                  className={`px-3 py-2 rounded-lg text-sm whitespace-nowrap flex items-center ${
                    activeCategory === category.id
                      ? "bg-primary text-primary-foreground"
                      : "bg-card/30 hover:bg-card/50"
                  }`}
                >
                  <span className="mr-1.5">{category.icon}</span>
                  {category.name}
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Tweets display */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="space-y-6"
        >
          {filteredTweets.length > 0 ? (
            <div className="grid grid-cols-1 gap-6">
              {filteredTweets.map((tweet) => (
                <motion.div
                  key={tweet.id}
                  variants={cardVariants}
                  onMouseEnter={() => setHighlightedTweet(tweet.id)}
                  onMouseLeave={() => setHighlightedTweet(null)}
                  className={`rounded-xl border backdrop-blur-sm overflow-hidden
                    ${tweet.isPinned ? "border-[#1da1f2]/40 bg-[#1da1f2]/5" : "border-border/40 bg-card/30"}
                    ${highlightedTweet === tweet.id ? "shadow-md" : ""}
                    transition-all hover:border-[#1da1f2]/40 hover:bg-card/40 hover:shadow-md`}
                >
                  <div className="p-5">
                    {/* Tweet header */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="relative w-10 h-10">
                          <div className="absolute inset-0 bg-[#1da1f2]/30 rounded-full"></div>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <TwitterIcon className="w-5 h-5 text-[#1da1f2]" />
                          </div>
                        </div>
                        <div>
                          <div className="font-bold">AI Wallet</div>
                          <div className="text-xs text-muted-foreground">@AIWallet</div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                        <Calendar className="w-3 h-3 mr-1" />
                        <span>{tweet.date}</span>
                      </div>
                    </div>

                    {/* Tweet content */}
                    <div className="mb-4">
                      <p className="text-sm md:text-base">{tweet.content}</p>
                    </div>

                    {/* Tweet footer */}
                    <div className="flex items-center justify-between pt-3 border-t border-border/30">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center space-x-1">
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                          </svg>
                          <span className="text-xs">{tweet.likes}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-[#1da1f2]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                          </svg>
                          <span className="text-xs">{tweet.retweets}</span>
                        </div>
                      </div>

                      <span className={`text-xs px-2.5 py-0.5 rounded-full ${getCategoryColor(tweet.category)}`}>
                        {tweet.category}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <motion.div
              variants={itemVariants}
              className="text-center py-12 bg-card/20 rounded-xl border border-border/30"
            >
              <div className="text-4xl mb-4">🔍</div>
              <h3 className="text-xl font-medium mb-2">No tweets found</h3>
              <p className="text-muted-foreground">
                Try changing your search or filter criteria
              </p>
            </motion.div>
          )}
        </motion.div>

        {/* Follow call to action */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.7 }}
          className="mt-16 p-6 md:p-8 rounded-xl border border-[#1da1f2]/20 bg-card/30 backdrop-blur-md relative overflow-hidden"
        >
          <div className="absolute -top-20 -right-20 w-60 h-60 bg-[#1da1f2]/10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-[#1da1f2]/10 rounded-full blur-3xl"></div>

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="md:max-w-md">
              <h3 className="text-xl font-bold mb-2">Follow Us on Twitter</h3>
              <p className="text-sm text-muted-foreground">
                Get real-time updates, announcements, and engage with our community directly on Twitter.
              </p>
            </div>

            <div>
              <motion.a
                href="https://twitter.com/AIWallet"
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="px-6 py-3 rounded-lg flex items-center space-x-2 bg-[#1da1f2] text-white hover:bg-[#1a91da] transition-colors"
              >
                <TwitterIcon className="w-5 h-5" />
                <span>Follow @AIWallet</span>
              </motion.a>
            </div>
          </div>
        </motion.div>
      </main>

      <footer className="border-t border-border/30 bg-background/50 backdrop-blur-md mt-16">
        <div className="container px-4 py-8 mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="flex items-center space-x-2">
              <div className="relative w-6 h-6">
                <motion.div 
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.7 }}
                >
                  <Image 
                    src="/logo.webp" 
                    alt="AI Wallet Logo" 
                    width={24} 
                    height={24} 
                    className="rounded-full object-cover"
                  />
                </motion.div>
              </div>
              <p className="text-sm">© 2023 AI Wallet. All rights reserved.</p>
            </div>

            <div className="flex space-x-6">
              {["Twitter", "Discord", "GitHub", "Documentation"].map((item, i) => (
                <a key={i} href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
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

// NavLink component for consistent navigation styling
function NavLink({ href, children, active = false }: { href: string; children: React.ReactNode; active?: boolean }) {
  return (
    <Link href={href}>
      <motion.div
        className={`relative px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
          active ? "text-primary" : "text-foreground hover:text-primary"
        }`}
        whileHover={{
          backgroundColor: "rgba(var(--primary), 0.08)",
        }}
      >
        {children}
        {active && (
          <motion.div
            layoutId="activeNavIndicator"
            className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary mx-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          />
        )}
      </motion.div>
    </Link>
  );
}
