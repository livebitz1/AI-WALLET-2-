"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useConnection } from "@solana/wallet-adapter-react";
import { AIMessage } from "@/lib/utils";
import { parseUserIntent } from "@/lib/enhanced-ai";
import { useWalletStore } from "@/lib/wallet-store";
import { formatWalletAddress } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import * as RxIcons from "react-icons/rx";
import * as FaIcons from "react-icons/fa";
import * as MdIcons from "react-icons/md";
import * as HiIcons from "react-icons/hi";
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import { SwapExecutor } from '@/components/SwapExecutor';

// SuggestionChip component for interactive suggestion buttons
const SuggestionChip = ({ suggestion, onSelect }: { suggestion: string; onSelect: (s: string) => void }) => (
  <motion.button
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    whileHover={{ scale: 1.05, backgroundColor: "rgb(var(--secondary) / 0.8)" }}
    whileTap={{ scale: 0.95 }}
    onClick={() => onSelect(suggestion)}
    className="px-3 py-1.5 text-sm bg-secondary/60 text-secondary-foreground rounded-full transition-colors backdrop-blur-sm border border-secondary/20"
  >
    {suggestion}
  </motion.button>
);

// Message component with support for markdown, code highlighting, and copy functionality
const ChatMessage = ({ message, isLast }: { message: AIMessage; isLast: boolean }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`py-6 px-4 md:px-6 group flex gap-4 ${
        message.role === "assistant" ? "bg-card/30 backdrop-blur-sm" : ""
      }`}
    >
      {/* Avatar */}
      <div className="flex-shrink-0 mt-1">
        {message.role === "assistant" ? (
          <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center">
            <MdIcons.MdSmartToy className="text-primary/80 text-lg" />
          </div>
        ) : (
          <div className="w-8 h-8 rounded-full bg-secondary/20 border border-secondary/30 flex items-center justify-center">
            <FaIcons.FaUser className="text-secondary/80 text-sm" />
          </div>
        )}
      </div>

      {/* Message content */}
      <div className="flex-1 overflow-hidden">
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <ReactMarkdown
            components={{
              code({ node, inline, className, children, ...props }) {
                const match = /language-(\w+)/.exec(className || "");
                return !inline && match ? (
                  <div className="relative rounded-md overflow-hidden">
                    <div className="absolute right-2 top-2 z-10">
                      <button
                        onClick={handleCopy}
                        className="p-1.5 rounded-md bg-secondary/40 hover:bg-secondary/60 text-secondary-foreground transition-colors"
                        aria-label="Copy code"
                      >
                        {copied ? <RxIcons.RxCheck size={18} /> : <RxIcons.RxCopy size={18} />}
                      </button>
                    </div>
                    <SyntaxHighlighter
                      style={atomDark}
                      language={match[1]}
                      PreTag="div"
                      className="!bg-black/80 !mt-0 text-xs md:text-sm"
                      {...props}
                    >
                      {String(children).replace(/\n$/, "")}
                    </SyntaxHighlighter>
                  </div>
                ) : (
                  <code className={`${className} px-1 py-0.5 rounded bg-muted`} {...props}>
                    {children}
                  </code>
                );
              }
            }}
          >
            {message.content}
          </ReactMarkdown>
        </div>
      </div>

      {/* Copy button for assistant messages */}
      {message.role === "assistant" && (
        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
          <button
            onClick={handleCopy}
            className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Copy message"
          >
            {copied ? <RxIcons.RxCheck size={18} /> : <RxIcons.RxCopy size={18} />}
          </button>
        </div>
      )}
    </motion.div>
  );
};

// Main ChatInterface component
export function ChatInterface() {
  const { publicKey, signTransaction, connected } = useWallet();
  const { connection } = useConnection();
  const { walletData, setWalletAddress } = useWalletStore();
  const [messages, setMessages] = useState<AIMessage[]>([
    {
      role: "assistant",
      content: "Hi! I'm your Web3 AI assistant. How can I help you with Solana transactions today?"
    }
  ]);
  const [suggestions, setSuggestions] = useState<string[]>([
    "Check my balance",
    "What can you help me with?",
    "How do I swap tokens?",
    "Tell me about Solana"
  ]);
  const [input, setInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  
  // New state variables to control scroll behavior
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [lastMessageCount, setLastMessageCount] = useState(messages.length);

  // Add state for pending swap intent
  const [pendingSwapIntent, setPendingSwapIntent] = useState<SwapIntent | null>(null);
  const [autoExecuteSwap, setAutoExecuteSwap] = useState<boolean>(false);

  // Determine if user is at bottom of chat
  const isNearBottom = useCallback(() => {
    const container = chatContainerRef.current;
    if (!container) return true;
    
    const threshold = 100; // px from bottom to trigger auto-scroll
    return container.scrollHeight - container.scrollTop - container.clientHeight < threshold;
  }, []);

  // Scroll to bottom function
  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ 
        behavior, 
        block: "end" 
      });
    }
  }, []);

  // Handle scroll events to determine if we're near bottom
  useEffect(() => {
    const container = chatContainerRef.current;
    if (!container) return;
    
    const handleScroll = () => {
      const nearBottom = isNearBottom();
      setShouldAutoScroll(nearBottom);
      setShowScrollButton(!nearBottom && messages.length > 1);
    };
    
    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [isNearBottom, messages.length]);

  // Smart auto-scroll that respects user scrolling behavior
  useEffect(() => {
    // Check if messages were added
    if (messages.length > lastMessageCount) {
      // If user was previously at the bottom or this is AI response to user message
      // (last two messages would be user then AI), auto scroll
      const isResponseToUserMessage = 
        messages.length >= 2 && 
        messages[messages.length - 1].role === 'assistant' && 
        messages[messages.length - 2].role === 'user';
        
      const shouldScroll = shouldAutoScroll || isResponseToUserMessage;
      
      if (shouldScroll) {
        // Use a small timeout to ensure the DOM has updated with new content
        setTimeout(() => {
          scrollToBottom(messages.length === 1 ? "auto" : "smooth");
        }, 100);
      } else {
        // Show scroll button if we're not auto-scrolling
        setShowScrollButton(true);
      }
    }
    
    // Update the message count
    setLastMessageCount(messages.length);
  }, [messages, lastMessageCount, shouldAutoScroll, scrollToBottom]);

  // Set wallet address when connected
  useEffect(() => {
    if (publicKey) {
      setWalletAddress(publicKey.toString());
    }
  }, [publicKey, connected, setWalletAddress]);

  // Display welcome message when wallet is connected
  useEffect(() => {
    if (connected && publicKey) {
      // Only add welcome message if it doesn't exist yet
      if (!messages.some(m => m.content.includes("wallet is connected"))) {
        setMessages(prev => [...prev, {
          role: "assistant",
          content: `Great! Your wallet is connected. Your address is ${formatWalletAddress(publicKey.toString())}. How can I assist you with your Solana transactions?`
        }]);
      }
      
      // Set welcome message once data is loaded
      if (walletData.solBalance > 0 &&
          !messages.some(m => m.content.includes("wallet has")) &&
          messages.length < 3) {
        setMessages(prev => [...prev, {
          role: "assistant",
          content: `I see your wallet has ${walletData.solBalance.toFixed(4)} SOL and ${walletData.tokens.length} other tokens. What would you like to do today?`
        }]);
      }
    }
  }, [connected, publicKey, walletData, messages]);

  // Auto-grow textarea as user types
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = `${inputRef.current.scrollHeight}px`;
    }
  }, [input]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
  };

  const handleSendMessage = async () => {
    if (input.trim() === "" || isProcessing) return;

    const userMessage = input.trim();
    setInput("");
    
    // Add user message to chat
    setMessages(prev => [...prev, { role: "user", content: userMessage }]);
    
    // Set auto-scroll to true when user sends message
    setShouldAutoScroll(true);
    
    // Show loading state
    setIsProcessing(true);

    try {
      // Send message to AI
      const aiResponse = await parseUserIntent(userMessage, {
        walletConnected: connected,
        walletAddress: publicKey?.toString() || null,
        balance: walletData.solBalance || 0,
      });

      // Handle AI response
      handleAIResponse(aiResponse);

      // Add AI response to chat
      setMessages(prev => [
        ...prev,
        { role: "assistant", content: aiResponse.message }
      ]);
      
      // Update suggestions if provided
      if (aiResponse.suggestions && aiResponse.suggestions.length > 0) {
        setSuggestions(aiResponse.suggestions);
      }
    } catch (error) {
      console.error("Error processing message:", error);
      setMessages(prev => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, I encountered an error processing your request. Please try again."
        }
      ]);
    } finally {
      setIsProcessing(false);
      // Reset height after sending
      if (inputRef.current) {
        inputRef.current.style.height = 'auto';
      }
      // Focus back on input
      inputRef.current?.focus();
    }
  };

  const handleAIResponse = (response: any) => {
    // Check if the response has a swap intent
    if (response.intent && response.intent.action === 'swap') {
      // Automatically set the intent for execution
      setPendingSwapIntent(response.intent);
      setAutoExecuteSwap(true);
    } else {
      // Clear any pending swap intents
      setPendingSwapIntent(null);
      setAutoExecuteSwap(false);
    }
  };

  const handleSwapSuccess = (result: any) => {
    // Add a system message about the successful swap
    const successMessage = {
      role: 'system',
      content: `✅ ${result.message}`
    };
    
    setMessages(prev => [...prev, successMessage]);
    setPendingSwapIntent(null);
    setAutoExecuteSwap(false);
  };

  const handleSwapError = (error: any) => {
    // Add a system message about the failed swap
    const errorMessage = {
      role: 'system',
      content: `❌ ${error.message || "Swap failed. Please try again."}`
    };
    
    setMessages(prev => [...prev, errorMessage]);
    setPendingSwapIntent(null);
    setAutoExecuteSwap(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
    // Focus and move cursor to end
    if (inputRef.current) {
      inputRef.current.focus();
      inputRef.current.setSelectionRange(suggestion.length, suggestion.length);
    }
    // Set auto-scroll to true when user selects a suggestion
    setShouldAutoScroll(true);
  };

  return (
    <div className="chat-interface flex flex-col h-[calc(100vh-9rem)] md:h-[calc(100vh-12rem)] rounded-xl border border-border/40 overflow-hidden shadow-lg bg-card/50 backdrop-blur-sm">
      {/* Chat header */}
      <div className="border-b border-border/40 p-4 flex items-center justify-between bg-card/80">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
            <MdIcons.MdSmartToy className="text-primary text-lg" />
          </div>
          <div>
            <h2 className="font-medium">AI Assistant</h2>
            <p className="text-xs text-muted-foreground">
              {connected 
                ? `Connected to ${formatWalletAddress(publicKey!.toString())}` 
                : "Wallet not connected"}
            </p>
          </div>
        </div>
        <button 
          onClick={() => {
            setMessages([{
              role: "assistant",
              content: "Hi! I'm your Web3 AI assistant. How can I help you with Solana transactions today?"
            }]);
            setShouldAutoScroll(true);
            setShowScrollButton(false);
          }}
          className="p-2 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Reset conversation"
        >
          <MdIcons.MdRefresh size={20} />
        </button>
      </div>
      
      {/* Messages container with proper scrolling */}
      <div 
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent relative"
      >
        <div className="pb-4">
          {messages.map((message, index) => (
            <ChatMessage 
              key={index} 
              message={message} 
              isLast={index === messages.length - 1} 
            />
          ))}
          
          {/* Loading indicator */}
          {isProcessing && (
            <div className="py-6 px-6 flex gap-4">
              <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center">
                <MdIcons.MdSmartToy className="text-primary/80 text-lg" />
              </div>
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          )}
          
          {/* Invisible element to scroll to */}
          <div ref={messagesEndRef} />
        </div>

        {/* Scroll to bottom button */}
        <AnimatePresence>
          {showScrollButton && (
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.2 }}
              className="absolute bottom-4 right-4 p-3 rounded-full bg-primary shadow-lg text-primary-foreground hover:bg-primary/90 transition-all"
              onClick={() => {
                scrollToBottom();
                setShouldAutoScroll(true);
                setShowScrollButton(false);
              }}
              aria-label="Scroll to bottom"
            >
              <HiIcons.HiArrowDown size={20} />
            </motion.button>
          )}
        </AnimatePresence>
      </div>
      
      {/* Suggestions */}
      <div className="px-4 py-3 border-t border-border/40 bg-muted/20 backdrop-blur-sm">
        <AnimatePresence mode="wait">
          <motion.div 
            key={suggestions.join('-')} // Force re-render on suggestion change
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex flex-wrap gap-2"
          >
            {suggestions.map((suggestion, index) => (
              <SuggestionChip
                key={index}
                suggestion={suggestion}
                onSelect={handleSuggestionClick}
              />
            ))}
          </motion.div>
        </AnimatePresence>
      </div>
      
      {/* Input area */}
      <div className="p-4 border-t border-border/40 bg-card/80">
        <div className="relative flex items-end">
          <textarea
            ref={inputRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onClick={() => {
              // When user clicks input, we don't want to auto-scroll anymore
              // if they've intentionally scrolled up to read history
              if (!isNearBottom()) {
                setShouldAutoScroll(false);
              }
            }}
            placeholder="Message AI Wallet Assistant..."
            className="min-h-[44px] max-h-[200px] w-full rounded-lg pl-4 pr-12 py-3 bg-muted resize-none focus:outline-none focus:ring-1 focus:ring-primary/50"
            rows={1}
          />
          <button
            onClick={handleSendMessage}
            disabled={isProcessing || input.trim() === ""}
            className={`absolute right-2 bottom-2 p-2 rounded-md transition-colors ${
              isProcessing || input.trim() === "" 
                ? "text-muted-foreground" 
                : "text-primary hover:bg-primary/10"
            }`}
            aria-label="Send message"
          >
            <RxIcons.RxPaperPlane size={18} />
          </button>
        </div>
      </div>

      {/* Add the swap executor component */}
      <SwapExecutor
        intent={pendingSwapIntent}
        onSuccess={handleSwapSuccess}
        onError={handleSwapError}
        autoExecute={autoExecuteSwap}
      />
    </div>
  );
}