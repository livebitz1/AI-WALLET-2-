'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import emailjs from '@emailjs/browser';
import { CheckCircle, AlertCircle, Loader, X } from 'lucide-react';

interface ContactFormPopupProps {
  onClose: () => void;
}

export const ContactFormPopup = ({ onClose }: ContactFormPopupProps) => {
  const [formState, setFormState] = useState({
    name: '',
    email: '',
    message: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const formRef = useRef<HTMLFormElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formState.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formState.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formState.email)) {
      newErrors.email = 'Invalid email format';
    }

    if (!formState.message.trim()) {
      newErrors.message = 'Message is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormState(prev => ({ ...prev, [name]: value }));
    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      // Initialize EmailJS with your public key
      emailjs.init("YOUR_PUBLIC_KEY"); // Replace with your actual public key

      const templateParams = {
        to_email: "himanshumeena2572005@gmail.com",
        from_name: formState.name,
        from_email: formState.email,
        message: formState.message,
      };

      await emailjs.send(
        "YOUR_SERVICE_ID", // Replace with your EmailJS service ID
        "YOUR_TEMPLATE_ID", // Replace with your EmailJS template ID
        templateParams
      );

      setSubmitStatus('success');
      setFormState({ name: '', email: '', message: '' });
      // Reset form after 3 seconds
      setTimeout(() => {
        setSubmitStatus('idle');
      }, 3000);
    } catch (error) {
      console.error("Failed to send email:", error);
      setSubmitStatus('error');
      // Reset error state after 3 seconds
      setTimeout(() => {
        setSubmitStatus('idle');
      }, 3000);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      ref={popupRef}
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className="absolute top-full mt-2 right-0 z-50 w-80 bg-card border border-border/40 rounded-xl shadow-xl backdrop-blur-md p-4"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center mr-2">
            <motion.div 
              initial={{ rotate: 0 }}
              animate={{ rotate: 360 }}
              transition={{ duration: 2, ease: "linear", repeat: Infinity }}
            >
              <Loader className="w-4 h-4 text-primary" />
            </motion.div>
          </div>
          <h3 className="font-medium">Contact Us</h3>
        </div>

        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={onClose}
          className="w-6 h-6 rounded-full bg-background/80 flex items-center justify-center hover:bg-background transition-colors"
        >
          <X className="w-4 h-4" />
        </motion.button>
      </div>

      {submitStatus === 'success' ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-6 text-center"
        >
          <CheckCircle className="w-12 h-12 text-green-500 mb-3" />
          <h4 className="font-medium mb-1">Message Sent!</h4>
          <p className="text-sm text-muted-foreground">Thank you for contacting us. We'll get back to you soon.</p>
        </motion.div>
      ) : submitStatus === 'error' ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-6 text-center"
        >
          <AlertCircle className="w-12 h-12 text-red-500 mb-3" />
          <h4 className="font-medium mb-1">Failed to Send</h4>
          <p className="text-sm text-muted-foreground">Something went wrong. Please try again later.</p>
        </motion.div>
      ) : (
        <form ref={formRef} onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-1">Name</label>
            <input
              id="name"
              name="name"
              type="text"
              value={formState.name}
              onChange={handleChange}
              className={`w-full px-3 py-2 bg-background/60 border ${errors.name ? 'border-red-500' : 'border-border/40'} rounded-md focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors text-sm`}
              placeholder="Your name"
            />
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              value={formState.email}
              onChange={handleChange}
              className={`w-full px-3 py-2 bg-background/60 border ${errors.email ? 'border-red-500' : 'border-border/40'} rounded-md focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors text-sm`}
              placeholder="your.email@example.com"
            />
            {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
          </div>

          <div>
            <label htmlFor="message" className="block text-sm font-medium mb-1">Message</label>
            <textarea
              id="message"
              name="message"
              value={formState.message}
              onChange={handleChange}
              rows={3}
              className={`w-full px-3 py-2 bg-background/60 border ${errors.message ? 'border-red-500' : 'border-border/40'} rounded-md focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors text-sm resize-none`}
              placeholder="How can we help you?"
            />
            {errors.message && <p className="text-xs text-red-500 mt-1">{errors.message}</p>}
          </div>

          <motion.button
            type="submit"
            disabled={isSubmitting}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full py-2 px-4 bg-primary text-primary-foreground rounded-md font-medium transition-colors hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-70 flex items-center justify-center"
          >
            {isSubmitting ? (
              <>
                <Loader className="w-4 h-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : 'Submit'}
          </motion.button>
        </form>
      )}

      <div className="mt-3 pt-3 border-t border-border/30 text-xs text-muted-foreground text-center">
        <p>Your information is secure and will not be shared with third parties.</p>
      </div>
    </motion.div>
  );
};
