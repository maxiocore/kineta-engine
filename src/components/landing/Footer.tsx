import { motion, useInView } from "framer-motion";
import { Mail, MapPin, Phone, Send, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";
import { useRef } from "react";

const footerLinks = {
  "الخدمات": [
    { label: "التسويق الرقمي", href: "/digital-marketing-services" },
    { label: "البرمجة والتطوير", href: "/development-services" },
    { label: "التصميم الإبداعي", href: "/design-services" },
    { label: "إدارة السوشيال", href: "/social-media-services" },
  ],
  "الشركة": [
    { label: "من نحن", href: "/about" },
    { label: "الوظائف", href: "/careers" },
    { label: "تواصل معنا", href: "/contact" },
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
];

const contactInfo = [
  { icon: Mail, text: "info@maxiocore.com", href: "mailto:info@maxiocore.com" },
  { icon: Phone, text: "+966 55 123 4567", href: "tel:+966551234567", dir: "ltr" as const },
  { icon: MapPin, text: "المملكة العربية السعودية" },
];

const Footer = () => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <footer ref={ref} className="relative pt-16 sm:pt-20 pb-8 bg-secondary/30">
      <div className="container px-4 sm:px-6">
        {/* Newsletter */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="relative -mt-24 sm:-mt-28 mb-12 sm:mb-16 p-6 sm:p-10 rounded-2xl bg-card border border-border/50 text-center"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            <Sparkles className="w-4 h-4" />
            النشرة البريدية
          </div>
          <h3 className="text-xl sm:text-2xl font-bold mb-2">ابقَ على اطلاع</h3>
          <p className="text-muted-foreground text-sm mb-6">
            احصل على أحدث النصائح والتحديثات مباشرة إلى بريدك
          </p>
          <div className="flex gap-3 flex-col sm:flex-row max-w-md mx-auto">
            <Input
              type="email"
              placeholder="بريدك الإلكتروني"
              className="h-12 rounded-xl text-center sm:text-right"
              dir="ltr"
            />
            <Button className="h-12 px-6 rounded-xl shrink-0">
              <Send className="w-4 h-4 ml-2" />
              اشترك
            </Button>
          </div>
        </motion.div>

        {/* Main Footer */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 mb-12">
          {/* Brand */}
          <div className="col-span-2 sm:col-span-1">
            <Link to="/" className="inline-block mb-4">
              <span className="text-2xl font-bold bg-gradient-to-l from-primary to-accent bg-clip-text text-transparent">
                MaxioCore
              </span>
            </Link>
            <p className="text-sm text-muted-foreground mb-4">
              شريكك الموثوق في رحلة التحول الرقمي
            </p>
            {/* Social Links */}
            <div className="flex gap-3">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-xl bg-secondary/50 flex items-center justify-center text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="font-bold text-sm mb-4">{category}</h4>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.href}
                      className="text-sm text-muted-foreground hover:text-primary transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Contact Info */}
        <div className="flex flex-wrap justify-center gap-4 sm:gap-8 mb-8 py-6 border-t border-b border-border/50">
          {contactInfo.map((info, index) => (
            <div key={index} className="flex items-center gap-2 text-muted-foreground">
              <info.icon className="w-4 h-4 text-primary" />
              {info.href ? (
                <a href={info.href} dir={info.dir} className="text-sm hover:text-primary transition-colors">
                  {info.text}
                </a>
              ) : (
                <span className="text-sm">{info.text}</span>
              )}
            </div>
          ))}
        </div>

        {/* Copyright */}
        <div className="text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} MaxioCore. جميع الحقوق محفوظة.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
