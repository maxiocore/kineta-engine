import { motion, useInView } from "framer-motion";
import { Mail, MapPin, Phone, ArrowLeft, Sparkles, Send, Heart, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";
import { useRef, useState } from "react";

const footerLinks = {
  "الخدمات": [
    { label: "البرمجة والتطوير", href: "/development-services" },
    { label: "التصميم الإبداعي", href: "/design-services" },
  ],
  "الشركة": [
    { label: "من نحن", href: "/about" },
    { label: "فريق العمل", href: "/about" },
    { label: "الوظائف", href: "/careers" },
    { label: "تواصل معنا", href: "/contact" },
  ],
  "المدفوعات": [
    { label: "التمويل", href: "/payment-methods" },
    { label: "طرق الدفع", href: "/payment-methods" },
    { label: "سياسة الدفع", href: "/payment-policy" },
    { label: "سياسة الاسترجاع", href: "/refund-policy" },
  ],
  "الدعم": [
    { label: "الأسعار", href: "/pricing" },
    { label: "تتبع الطلب", href: "/track-order" },
    { label: "سياسة الخصوصية", href: "/privacy-policy" },
    { label: "شروط الاستخدام", href: "/terms-of-service" },
  ],
};

const socialLinks = [
  {
    name: "X",
    href: "https://twitter.com",
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
      </svg>
    ),
  },
  {
    name: "Instagram",
    href: "https://instagram.com",
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
      </svg>
    ),
  },
  {
    name: "LinkedIn",
    href: "https://linkedin.com",
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
      </svg>
    ),
  },
  {
    name: "YouTube",
    href: "https://youtube.com",
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
      </svg>
    ),
  },
];

const contactInfo = [
  { icon: Mail, text: "info@ash-holding.sa", href: "mailto:info@ash-holding.sa", label: "البريد الإلكتروني" },
  { icon: Phone, text: "+966 55 123 4567", href: "tel:+966551234567", dir: "ltr" as const, label: "الهاتف" },
  { icon: MapPin, text: "المملكة العربية السعودية", label: "الموقع" },
];

const Footer = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: "-50px" });
  const [hoveredLink, setHoveredLink] = useState<string | null>(null);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring" as const,
        stiffness: 100,
        damping: 12,
      },
    },
  };

  return (
    <footer ref={containerRef} className="relative pt-20 sm:pt-28 md:pt-36 pb-8 overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-secondary/10 to-secondary/30" />
        
        {/* Floating Orbs */}
        <motion.div
          className="absolute top-20 right-[10%] w-72 h-72 rounded-full opacity-20"
          style={{
            background: "radial-gradient(circle, hsl(var(--primary)) 0%, transparent 70%)",
            filter: "blur(80px)",
          }}
          animate={{
            y: [0, -30, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-40 left-[15%] w-96 h-96 rounded-full opacity-15"
          style={{
            background: "radial-gradient(circle, hsl(var(--accent)) 0%, transparent 70%)",
            filter: "blur(100px)",
          }}
          animate={{
            y: [0, 20, 0],
            scale: [1, 1.15, 1],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        />
        
        {/* Grid Pattern */}
        <div 
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `linear-gradient(hsl(var(--primary)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)`,
            backgroundSize: '50px 50px',
          }}
        />
      </div>

      <div className="container px-4 sm:px-6 relative z-10">
        {/* Newsletter Section */}
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={isInView ? { opacity: 1, y: 0, scale: 1 } : {}}
          transition={{ duration: 0.8, type: "spring", stiffness: 80 }}
          className="relative -mt-16 sm:-mt-24 md:-mt-32 mb-16 sm:mb-20 md:mb-28"
        >
          <div className="relative p-6 sm:p-10 md:p-14 rounded-3xl overflow-hidden">
            {/* Glass Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-card/90 via-card/70 to-card/90 backdrop-blur-2xl" />
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
            
            {/* Animated Border */}
            <motion.div
              className="absolute inset-0 rounded-3xl"
              style={{
                background: "linear-gradient(90deg, hsl(var(--primary) / 0.3), hsl(var(--accent) / 0.3), hsl(var(--primary) / 0.3))",
                backgroundSize: "200% 100%",
                padding: "1px",
              }}
              animate={{
                backgroundPosition: ["0% 0%", "200% 0%"],
              }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            >
              <div className="w-full h-full bg-card rounded-3xl" />
            </motion.div>
            
            {/* Sparkle Effects */}
            {[...Array(5)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 bg-primary rounded-full"
                style={{
                  left: `${15 + i * 20}%`,
                  top: `${20 + (i % 3) * 30}%`,
                }}
                animate={{
                  opacity: [0, 1, 0],
                  scale: [0, 1.5, 0],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: i * 0.4,
                }}
              />
            ))}
            
            <div className="relative flex flex-col items-center text-center gap-6 sm:gap-8">
              <motion.div
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary/15 border border-primary/30"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={isInView ? { opacity: 1, scale: 1 } : {}}
                transition={{ delay: 0.3, type: "spring" }}
                whileHover={{ scale: 1.05 }}
              >
                <motion.div
                  animate={{ rotate: [0, 15, -15, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Sparkles className="w-4 h-4 text-primary" />
                </motion.div>
                <span className="text-sm font-semibold text-primary">النشرة البريدية</span>
              </motion.div>
              
              <div>
                <motion.h3 
                  className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4"
                  initial={{ opacity: 0, y: 20 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ delay: 0.4 }}
                >
                  ابقَ على{" "}
                  <span className="relative">
                    <span className="text-transparent bg-clip-text bg-gradient-to-l from-primary via-accent to-primary bg-[length:200%_100%] animate-[shimmer_3s_linear_infinite]">
                      اطلاع
                    </span>
                    <motion.span
                      className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-l from-primary to-accent"
                      initial={{ scaleX: 0 }}
                      animate={isInView ? { scaleX: 1 } : {}}
                      transition={{ delay: 0.8, duration: 0.6 }}
                    />
                  </span>
                </motion.h3>
                <motion.p 
                  className="text-muted-foreground max-w-md mx-auto text-sm sm:text-base md:text-lg"
                  initial={{ opacity: 0 }}
                  animate={isInView ? { opacity: 1 } : {}}
                  transition={{ delay: 0.5 }}
                >
                  احصل على أحدث النصائح والتحديثات مباشرة إلى بريدك
                </motion.p>
              </div>
              
              <motion.div 
                className="w-full max-w-lg"
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.6 }}
              >
                <div className="flex gap-3 flex-col sm:flex-row">
                  <div className="relative flex-1">
                    <Input
                      type="email"
                      placeholder="بريدك الإلكتروني"
                      className="h-12 sm:h-14 bg-background/50 border-border/50 rounded-2xl text-base px-6 text-center sm:text-right transition-all focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
                      dir="ltr"
                    />
                  </div>
                  <motion.div 
                    whileHover={{ scale: 1.03 }} 
                    whileTap={{ scale: 0.97 }}
                  >
                    <Button className="h-12 sm:h-14 px-8 w-full sm:w-auto bg-gradient-to-l from-primary to-accent hover:opacity-90 text-primary-foreground shadow-lg shadow-primary/30 rounded-2xl text-base font-semibold group">
                      <motion.span
                        animate={{ x: [0, -3, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      >
                        <Send className="w-5 h-5 ml-2 group-hover:rotate-12 transition-transform" />
                      </motion.span>
                      اشترك الآن
                    </Button>
                  </motion.div>
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Main Footer Content */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="grid grid-cols-1 gap-10 sm:gap-12 md:gap-16 mb-12 sm:mb-16"
        >
          {/* Top Section - Brand & Contact */}
          <motion.div 
            variants={itemVariants}
            className="flex flex-col items-center text-center"
          >
            <Link to="/" className="inline-block mb-6">
              <motion.span 
                className="text-3xl sm:text-4xl font-bold bg-gradient-to-l from-[#14b8a6] via-[#5eead4] to-[#94a3b8] bg-clip-text text-transparent"
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
                style={{ fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}
              >
                ASH HOLDING
              </motion.span>
            </Link>
            <p className="text-muted-foreground max-w-md leading-relaxed text-sm sm:text-base mb-8">
              شريكك الموثوق في رحلة التحول الرقمي. نقدم حلول متكاملة تساعدك على النمو والتميز.
            </p>
            
            {/* Contact Cards - Mobile Optimized */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-2xl">
              {contactInfo.map((item, index) => (
                <motion.a
                  key={item.label}
                  href={item.href}
                  variants={itemVariants}
                  whileHover={{ scale: 1.03, y: -5 }}
                  whileTap={{ scale: 0.98 }}
                  className="group relative p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-secondary/50 to-secondary/30 border border-border/30 hover:border-primary/30 transition-all overflow-hidden"
                >
                  {/* Hover Glow */}
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/0 to-primary/0 group-hover:from-primary/5 group-hover:to-accent/5 transition-all duration-300" />
                  
                  <div className="relative flex flex-col items-center gap-3">
                    <motion.div 
                      className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors"
                      whileHover={{ rotate: [0, -10, 10, 0] }}
                      transition={{ duration: 0.5 }}
                    >
                      <item.icon className="w-5 h-5 text-primary" />
                    </motion.div>
                    <div className="text-center">
                      <span className="block text-xs text-muted-foreground mb-1">{item.label}</span>
                      <span dir={item.dir} className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                        {item.text}
                      </span>
                    </div>
                  </div>
                </motion.a>
              ))}
            </div>
          </motion.div>

          {/* Links Section - Horizontal on Mobile */}
          <motion.div 
            variants={itemVariants}
            className="grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-8 md:gap-12"
          >
            {Object.entries(footerLinks).map(([category, links], categoryIndex) => (
              <motion.div 
                key={category}
                variants={itemVariants}
                className="text-center"
              >
                <motion.h4 
                  className="font-bold text-sm sm:text-base md:text-lg mb-4 sm:mb-6 text-transparent bg-clip-text bg-gradient-to-l from-primary to-accent"
                  whileHover={{ scale: 1.05 }}
                >
                  {category}
                </motion.h4>
                <ul className="space-y-2.5 sm:space-y-3">
                  {links.map((link) => (
                    <li key={link.label}>
                      <Link
                        to={link.href}
                        className="relative text-muted-foreground hover:text-primary transition-colors inline-block text-xs sm:text-sm md:text-base group"
                        onMouseEnter={() => setHoveredLink(link.label)}
                        onMouseLeave={() => setHoveredLink(null)}
                      >
                        <span className="relative">
                          {link.label}
                          <motion.span
                            className="absolute -bottom-0.5 left-0 right-0 h-px bg-gradient-to-l from-primary to-accent"
                            initial={{ scaleX: 0 }}
                            animate={{ scaleX: hoveredLink === link.label ? 1 : 0 }}
                            transition={{ duration: 0.2 }}
                          />
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </motion.div>

          {/* Social Links */}
          <motion.div 
            variants={itemVariants}
            className="flex flex-col items-center gap-6"
          >
            <motion.p 
              className="text-sm text-muted-foreground"
              initial={{ opacity: 0 }}
              animate={isInView ? { opacity: 1 } : {}}
            >
              تابعنا على
            </motion.p>
            <div className="flex items-center justify-center gap-3 sm:gap-4">
              {socialLinks.map((social, index) => (
                <motion.a 
                  key={social.name}
                  href={social.href} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="relative w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-secondary/50 border border-border/30 flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/30 transition-all overflow-hidden group"
                  initial={{ opacity: 0, y: 20 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ delay: 0.5 + index * 0.1 }}
                  whileHover={{ scale: 1.1, y: -5 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/0 to-accent/0 group-hover:from-primary/10 group-hover:to-accent/10 transition-all duration-300" />
                  <span className="relative z-10">{social.icon}</span>
                </motion.a>
              ))}
            </div>
          </motion.div>
        </motion.div>

        {/* Bottom Bar */}
        <motion.div 
          className="pt-8 border-t border-border/30"
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: 0.8 }}
        >
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <Link to="/" className="order-2 sm:order-1">
              <motion.span 
                className="text-lg font-bold bg-gradient-to-l from-[#14b8a6] via-[#5eead4] to-[#94a3b8] bg-clip-text text-transparent"
                whileHover={{ scale: 1.05 }}
              >
                ASH HOLDING
              </motion.span>
            </Link>
            
            <motion.p 
              className="text-muted-foreground flex items-center gap-2 text-xs sm:text-sm order-3 sm:order-2"
              whileHover={{ scale: 1.02 }}
            >
              © {new Date().getFullYear()} ASH HOLDING. صنع بـ 
              <motion.span
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                <Heart className="w-4 h-4 text-red-500 fill-red-500" />
              </motion.span>
              في السعودية
            </motion.p>
            
            <motion.a
              href="#top"
              onClick={(e) => {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="order-1 sm:order-3 w-10 h-10 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center text-primary hover:bg-primary hover:text-primary-foreground transition-all"
              whileHover={{ scale: 1.1, y: -3 }}
              whileTap={{ scale: 0.95 }}
            >
              <motion.svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                animate={{ y: [0, -3, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </motion.svg>
            </motion.a>
          </div>
        </motion.div>
      </div>
    </footer>
  );
};

export default Footer;