import { motion, useInView } from "framer-motion";
import { Mail, MapPin, Phone, ArrowLeft, Sparkles, Send, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";
import { useRef } from "react";

const footerLinks = {
  "الخدمات": [
    { label: "التسويق الرقمي", href: "/services" },
    { label: "البرمجة والتطوير", href: "/services" },
    { label: "التصميم الإبداعي", href: "/services" },
    { label: "إدارة السوشيال", href: "/services" },
  ],
  "الشركة": [
    { label: "من نحن", href: "/about" },
    { label: "فريق العمل", href: "/about" },
    { label: "الوظائف", href: "/contact" },
    { label: "تواصل معنا", href: "/contact" },
  ],
  "الدعم": [
    { label: "الأسعار", href: "/pricing" },
    { label: "تتبع الطلب", href: "/track-order" },
    { label: "الأسئلة الشائعة", href: "/pricing" },
    { label: "سياسة الخصوصية", href: "#" },
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

const Footer = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: "-100px" });

  return (
    <footer ref={containerRef} className="relative pt-32 pb-8 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-secondary/20 to-secondary/40" />
      
      {/* Decorative Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full"
          style={{
            background: "radial-gradient(circle, hsl(var(--primary) / 0.04) 0%, transparent 50%)",
            filter: "blur(100px)",
          }}
        />
        <motion.div
          className="absolute bottom-0 right-1/4 w-[700px] h-[700px] rounded-full"
          style={{
            background: "radial-gradient(circle, hsl(var(--accent) / 0.03) 0%, transparent 50%)",
            filter: "blur(120px)",
          }}
        />
      </div>

      <div className="container px-4 relative z-10">
        {/* Newsletter Section - Centered & Modern */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="relative -mt-20 md:-mt-32 mb-16 md:mb-24"
        >
          <div className="relative p-8 md:p-12 rounded-3xl bg-gradient-to-br from-card/80 via-card/60 to-card/80 backdrop-blur-2xl border border-border/50 overflow-hidden shadow-2xl">
            {/* Inner Gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10" />
            <motion.div
              className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-px"
              style={{
                background: "linear-gradient(90deg, transparent, hsl(var(--primary) / 0.5), transparent)",
              }}
            />
            
            <div className="relative flex flex-col items-center text-center gap-8">
              <motion.div
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary/15 border border-primary/30"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={isInView ? { opacity: 1, scale: 1 } : {}}
                transition={{ delay: 0.2 }}
              >
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="text-sm font-semibold text-primary">النشرة البريدية</span>
              </motion.div>
              
              <div>
                <h3 className="text-3xl md:text-4xl font-bold mb-4">
                  ابقَ على <span className="text-transparent bg-clip-text bg-gradient-to-l from-primary to-accent">اطلاع</span>
                </h3>
                <p className="text-muted-foreground max-w-md mx-auto text-lg">
                  احصل على أحدث النصائح والتحديثات مباشرة إلى بريدك
                </p>
              </div>
              
              <div className="w-full max-w-lg">
                <div className="flex gap-3 flex-col sm:flex-row">
                  <Input
                    type="email"
                    placeholder="بريدك الإلكتروني"
                    className="flex-1 h-14 bg-background/50 border-border/50 rounded-2xl text-base px-6 text-center sm:text-right"
                    dir="ltr"
                  />
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button className="h-14 px-8 w-full sm:w-auto bg-gradient-to-l from-primary to-accent text-primary-foreground shadow-lg shadow-primary/30 rounded-2xl text-base font-semibold whitespace-nowrap">
                      <Send className="w-5 h-5 ml-2" />
                      اشترك الآن
                    </Button>
                  </motion.div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Main Footer Content */}
        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-12 mb-20">
          {/* Brand Column */}
          <motion.div 
            className="lg:col-span-2"
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.2 }}
          >
            <Link to="/" className="flex items-center gap-3 mb-8 group">
              <motion.span 
                className="text-2xl md:text-3xl font-bold bg-gradient-to-l from-[#14b8a6] via-[#5eead4] to-[#94a3b8] bg-clip-text text-transparent"
                whileHover={{ scale: 1.03 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
                style={{ fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}
              >
                MaxioCore
              </motion.span>
            </Link>
            <p className="text-muted-foreground mb-10 max-w-sm leading-relaxed text-lg">
              شريكك الموثوق في رحلة التحول الرقمي. نقدم حلول متكاملة تساعدك على النمو والتميز.
            </p>
            <div className="space-y-5">
              {[
                { icon: Mail, text: "info@maxiocore.com", href: "mailto:info@maxiocore.com" },
                { icon: Phone, text: "+966 55 123 4567", href: "tel:+966551234567", dir: "ltr" },
                { icon: MapPin, text: "الرياض، المملكة العربية السعودية" },
              ].map((item) => (
                <motion.a 
                  key={item.text}
                  href={item.href}
                  className="flex items-center gap-4 text-muted-foreground hover:text-primary transition-colors group"
                  whileHover={{ x: -5 }}
                >
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <item.icon className="w-5 h-5 text-primary" />
                  </div>
                  <span dir={item.dir}>{item.text}</span>
                </motion.a>
              ))}
            </div>
          </motion.div>

          {/* Links Columns */}
          {Object.entries(footerLinks).map(([category, links], categoryIndex) => (
            <motion.div 
              key={category}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.3 + categoryIndex * 0.1 }}
            >
              <h4 className="font-bold text-xl mb-8">{category}</h4>
              <ul className="space-y-5">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.href}
                      className="text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-2 group text-base"
                    >
                      <ArrowLeft className="w-4 h-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        {/* Bottom Bar */}
        <motion.div 
          className="pt-10 border-t border-border/30 flex flex-col md:flex-row items-center justify-between gap-6"
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: 0.6 }}
        >
          <Link to="/" className="flex items-center">
            <motion.span 
              className="text-xl font-bold bg-gradient-to-l from-[#14b8a6] via-[#5eead4] to-[#94a3b8] bg-clip-text text-transparent"
              whileHover={{ scale: 1.03 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
              style={{ fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}
            >
              MaxioCore
            </motion.span>
          </Link>
          
          <p className="text-muted-foreground flex items-center gap-2 text-sm">
            © {new Date().getFullYear()} MaxioCore. صنع بـ 
            <Heart className="w-4 h-4 text-red-500 fill-red-500 animate-pulse" />
            في السعودية
          </p>
          
          <div className="flex items-center gap-3">
            {socialLinks.map((social) => (
              <motion.a 
                key={social.name}
                href={social.href} 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-11 h-11 rounded-xl bg-secondary/50 border border-border/30 flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 hover:border-primary/30 transition-all"
                whileHover={{ scale: 1.1, y: -3 }}
                whileTap={{ scale: 0.95 }}
              >
                {social.icon}
              </motion.a>
            ))}
          </div>
        </motion.div>
      </div>
    </footer>
  );
};

export default Footer;
