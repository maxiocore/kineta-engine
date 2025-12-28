import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { 
  Instagram, 
  Facebook, 
  Youtube, 
  Linkedin,
  Send,
  Globe,
  Sparkles,
  Star,
  Heart,
  ChevronUp,
  ChevronDown,
  type LucideIcon
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface SocialPlatformsGridProps {
  onPlatformChange: (platformId: string | null, platformSlug: string) => void;
  selectedPlatformId: string | null;
  serviceCounts: Record<string, number>;
}

interface Platform {
  id: string;
  name: string;
  name_ar: string;
  slug: string;
  icon: string | null;
  color: string | null;
}

// Custom SVG Icons
const TikTokIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
  </svg>
);

const XIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);

const ThreadsIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path d="M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.472 12.01v-.017c.028-3.58.879-6.438 2.525-8.496C5.851 1.205 8.598.024 12.18 0h.014c2.746.02 5.043.725 6.826 2.098 1.677 1.29 2.858 3.13 3.509 5.467l-2.04.569c-1.104-3.96-3.898-5.984-8.304-6.015-2.91.022-5.11.936-6.54 2.717C4.307 6.504 3.616 8.914 3.589 12c.027 3.086.718 5.496 2.057 7.164 1.43 1.783 3.631 2.698 6.54 2.717 2.623-.02 4.358-.631 5.8-2.045 1.647-1.613 1.618-3.593 1.09-4.798-.31-.71-.873-1.3-1.634-1.75-.192 1.352-.622 2.446-1.284 3.272-.886 1.102-2.14 1.704-3.73 1.79-1.202.065-2.361-.218-3.259-.801-1.063-.689-1.685-1.74-1.752-2.96-.065-1.17.408-2.253 1.332-3.05.85-.732 2.07-1.194 3.628-1.375 1.337-.154 2.741-.095 4.093.173-.065-1.263-.422-2.211-1.068-2.813-.706-.658-1.758-.986-3.127-.986h-.056c-1.022.009-1.88.252-2.55.722-.645.452-1.057 1.074-1.223 1.85l-2.003-.428c.247-1.161.876-2.12 1.82-2.78 1.016-.712 2.29-1.074 3.792-1.078h.074c1.834 0 3.302.49 4.365 1.456.996.906 1.573 2.191 1.718 3.823.328.134.634.29.918.468 1.089.68 1.89 1.587 2.385 2.7.733 1.647.825 4.318-1.227 6.325-1.82 1.782-4.112 2.613-7.213 2.614z"/>
  </svg>
);

const DiscordIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/>
  </svg>
);

const SoundCloudIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path d="M1.175 12.225c-.051 0-.094.046-.101.1l-.233 2.154.233 2.105c.007.058.05.098.101.098.05 0 .09-.04.099-.098l.255-2.105-.27-2.154c-.009-.06-.052-.1-.084-.1z"/>
  </svg>
);

const SpotifyIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2z"/>
  </svg>
);

const WhatsAppIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
  </svg>
);

const SnapchatIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path d="M12.206.793c.99 0 4.347.276 5.93 3.821.529 1.193.403 3.219.299 4.847l-.003.06c-.012.18-.022.345-.03.51.075.045.203.09.401.09.3-.016.659-.12 1.033-.301.165-.088.344-.104.464-.104.182 0 .359.029.509.09.45.149.734.479.734.838.015.449-.39.839-1.213 1.168-.089.029-.209.075-.344.119-.45.135-1.139.36-1.333.81-.09.224-.061.524.12.868l.015.015c.06.136 1.526 3.475 4.791 4.014.255.044.435.27.42.509 0 .075-.015.149-.045.225-.24.569-1.273.988-3.146 1.271-.059.091-.12.375-.164.57-.029.179-.074.36-.134.553-.076.271-.27.405-.555.405h-.03c-.135 0-.313-.031-.538-.074-.36-.075-.765-.135-1.273-.135-.3 0-.599.015-.913.074-.6.104-1.123.464-1.723.884-.853.599-1.826 1.288-3.294 1.288-.06 0-.119-.015-.18-.015h-.149c-1.468 0-2.427-.675-3.279-1.288-.599-.42-1.107-.779-1.707-.884-.314-.045-.614-.074-.928-.074-.51 0-.891.06-1.258.135-.195.03-.42.074-.54.074-.374 0-.523-.224-.583-.42-.061-.192-.09-.389-.135-.567-.046-.181-.105-.494-.166-.57-1.918-.222-2.95-.642-3.189-1.226-.031-.063-.052-.15-.055-.225-.015-.243.165-.465.42-.509 3.264-.54 4.73-3.879 4.791-4.02l.016-.029c.18-.345.224-.645.119-.869-.195-.434-.884-.658-1.332-.809-.121-.029-.24-.074-.346-.119-.732-.271-1.213-.57-1.213-1.065 0-.283.193-.598.685-.746.21-.074.432-.108.676-.108.18 0 .342.016.516.088.333.151.694.272 1.03.301.182.016.315-.016.39-.061-.007-.15-.018-.314-.03-.494l-.003-.06c-.104-1.627-.231-3.654.298-4.847C7.86 1.068 11.216.793 12.206.793z"/>
  </svg>
);

const TwitchIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z"/>
  </svg>
);

const PinterestIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path d="M12 0C5.373 0 0 5.372 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 0 1 .083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12 0-6.628-5.373-12-12-12z"/>
  </svg>
);

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
  </svg>
);

const VimeoIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path d="M23.977 6.416c-.105 2.338-1.739 5.543-4.894 9.609-3.268 4.247-6.026 6.37-8.29 6.37-1.409 0-2.578-1.294-3.553-3.881L5.322 11.4C4.603 8.816 3.834 7.522 3.01 7.522c-.179 0-.806.378-1.881 1.132L0 7.197a315.065 315.065 0 0 0 3.501-3.128C5.08 2.701 6.266 1.984 7.055 1.91c1.867-.18 3.016 1.1 3.447 3.838.465 2.953.789 4.789.971 5.507.539 2.45 1.131 3.674 1.776 3.674.502 0 1.256-.796 2.265-2.385 1.004-1.589 1.54-2.797 1.612-3.628.144-1.371-.395-2.061-1.614-2.061-.574 0-1.167.121-1.777.391 1.186-3.868 3.434-5.757 6.762-5.637 2.473.06 3.628 1.664 3.493 4.797z"/>
  </svg>
);

const RedditIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701z"/>
  </svg>
);

const AppStoreIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
  </svg>
);

const PlayStoreIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.9 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z"/>
  </svg>
);

const TrustpilotIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
  </svg>
);

const SEOIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
  </svg>
);

const ReviewsIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
  </svg>
);

const EmailIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
  </svg>
);

// All platforms configuration
const platformsConfig = [
  { id: 'all', slug: 'all', name_ar: 'جميع المنصات', icon: Sparkles, customIcon: null, bgColor: 'bg-gradient-to-br from-primary to-accent', textColor: 'text-white' },
  { id: 'instagram', slug: 'instagram', name_ar: 'انستقرام', icon: Instagram, customIcon: null, bgColor: 'bg-gradient-to-br from-[#833AB4] via-[#FD1D1D] to-[#F77737]', textColor: 'text-white' },
  { id: 'tiktok', slug: 'tiktok', name_ar: 'تيك توك', icon: null, customIcon: TikTokIcon, bgColor: 'bg-gradient-to-br from-[#000000] via-[#25F4EE] to-[#FE2C55]', textColor: 'text-white' },
  { id: 'youtube', slug: 'youtube', name_ar: 'يوتيوب', icon: Youtube, customIcon: null, bgColor: 'bg-[#FF0000]', textColor: 'text-white' },
  { id: 'facebook', slug: 'facebook', name_ar: 'فيسبوك', icon: Facebook, customIcon: null, bgColor: 'bg-[#1877F2]', textColor: 'text-white' },
  { id: 'twitter', slug: 'twitter', name_ar: 'تويتر / X', icon: null, customIcon: XIcon, bgColor: 'bg-black', textColor: 'text-white' },
  { id: 'snapchat', slug: 'snapchat', name_ar: 'سناب شات', icon: null, customIcon: SnapchatIcon, bgColor: 'bg-[#FFFC00]', textColor: 'text-black' },
  { id: 'telegram', slug: 'telegram', name_ar: 'تيليجرام', icon: Send, customIcon: null, bgColor: 'bg-[#0088CC]', textColor: 'text-white' },
  { id: 'whatsapp', slug: 'whatsapp', name_ar: 'واتساب', icon: null, customIcon: WhatsAppIcon, bgColor: 'bg-[#25D366]', textColor: 'text-white' },
  { id: 'spotify', slug: 'spotify', name_ar: 'سبوتيفاي', icon: null, customIcon: SpotifyIcon, bgColor: 'bg-[#1DB954]', textColor: 'text-white' },
  { id: 'soundcloud', slug: 'soundcloud', name_ar: 'ساوند كلاود', icon: null, customIcon: SoundCloudIcon, bgColor: 'bg-[#FF5500]', textColor: 'text-white' },
  { id: 'discord', slug: 'discord', name_ar: 'ديسكورد', icon: null, customIcon: DiscordIcon, bgColor: 'bg-[#5865F2]', textColor: 'text-white' },
  { id: 'twitch', slug: 'twitch', name_ar: 'تويتش', icon: null, customIcon: TwitchIcon, bgColor: 'bg-[#9146FF]', textColor: 'text-white' },
  { id: 'linkedin', slug: 'linkedin', name_ar: 'لينكدان', icon: Linkedin, customIcon: null, bgColor: 'bg-[#0A66C2]', textColor: 'text-white' },
  { id: 'pinterest', slug: 'pinterest', name_ar: 'بينترست', icon: null, customIcon: PinterestIcon, bgColor: 'bg-[#E60023]', textColor: 'text-white' },
  { id: 'reddit', slug: 'reddit', name_ar: 'ريديت', icon: null, customIcon: RedditIcon, bgColor: 'bg-[#FF4500]', textColor: 'text-white' },
  { id: 'vimeo', slug: 'vimeo', name_ar: 'فيميو', icon: null, customIcon: VimeoIcon, bgColor: 'bg-[#1AB7EA]', textColor: 'text-white' },
  { id: 'likee', slug: 'likee', name_ar: 'لايكي', icon: Heart, customIcon: null, bgColor: 'bg-gradient-to-br from-[#FF0050] to-[#00F2EA]', textColor: 'text-white' },
  { id: 'clubhouse', slug: 'clubhouse', name_ar: 'كلوب هاوس', icon: null, customIcon: () => <span className="text-lg">🏠</span>, bgColor: 'bg-[#F2E8D5]', textColor: 'text-black' },
  { id: 'google', slug: 'google', name_ar: 'جوجل', icon: null, customIcon: GoogleIcon, bgColor: 'bg-white border border-border', textColor: 'text-black' },
  { id: 'website-traffic', slug: 'website-traffic', name_ar: 'زيارات المواقع', icon: Globe, customIcon: null, bgColor: 'bg-gradient-to-br from-emerald-500 to-teal-500', textColor: 'text-white' },
  { id: 'reviews', slug: 'reviews', name_ar: 'تقييمات', icon: null, customIcon: ReviewsIcon, bgColor: 'bg-gradient-to-br from-amber-400 to-orange-500', textColor: 'text-white' },
  { id: 'seo', slug: 'seo', name_ar: 'SEO', icon: null, customIcon: SEOIcon, bgColor: 'bg-gradient-to-br from-blue-500 to-indigo-600', textColor: 'text-white' },
  { id: 'playstore', slug: 'play-store', name_ar: 'بلاي ستور', icon: null, customIcon: PlayStoreIcon, bgColor: 'bg-white border border-border', textColor: 'text-black' },
  { id: 'appstore', slug: 'app-store', name_ar: 'آب ستور', icon: null, customIcon: AppStoreIcon, bgColor: 'bg-black', textColor: 'text-white' },
  { id: 'trustpilot', slug: 'trustpilot', name_ar: 'تراست بايلوت', icon: null, customIcon: TrustpilotIcon, bgColor: 'bg-[#00B67A]', textColor: 'text-white' },
  { id: 'email', slug: 'email-marketing', name_ar: 'إيميل ماركتنج', icon: null, customIcon: EmailIcon, bgColor: 'bg-gradient-to-br from-pink-500 to-rose-500', textColor: 'text-white' },
];

const INITIAL_VISIBLE_COUNT = 20;

const SocialPlatformsGrid = ({
  onPlatformChange,
  selectedPlatformId,
  serviceCounts,
}: SocialPlatformsGridProps) => {
  const [showAll, setShowAll] = useState(false);
  
  const visiblePlatforms = showAll 
    ? platformsConfig 
    : platformsConfig.slice(0, INITIAL_VISIBLE_COUNT);
  
  const totalServices = Object.values(serviceCounts).reduce((a, b) => a + b, 0);

  const handlePlatformClick = (platform: typeof platformsConfig[0]) => {
    if (platform.slug === 'all') {
      onPlatformChange(null, 'all');
    } else {
      onPlatformChange(platform.id, platform.slug);
    }
  };

  const getCount = (slug: string) => {
    if (slug === 'all') return totalServices;
    return serviceCounts[slug] || 0;
  };

  return (
    <div className="space-y-4">
      {/* Platforms Grid */}
      <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-3 sm:gap-4">
        {visiblePlatforms.map((platform, index) => {
          const isSelected = platform.slug === 'all' 
            ? !selectedPlatformId 
            : selectedPlatformId === platform.id;
          const count = getCount(platform.slug);
          
          return (
            <motion.button
              key={platform.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.02, duration: 0.2 }}
              whileHover={{ scale: 1.08, y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handlePlatformClick(platform)}
              className="flex flex-col items-center gap-2 group"
            >
              {/* Icon Circle */}
              <div 
                className={cn(
                  "relative w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center transition-all duration-300",
                  platform.bgColor,
                  platform.textColor,
                  isSelected 
                    ? "ring-2 ring-primary ring-offset-2 ring-offset-background shadow-lg scale-105" 
                    : "hover:shadow-xl"
                )}
              >
                {/* Shine effect */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/20 via-transparent to-black/10 pointer-events-none" />
                
                {/* Icon */}
                <div className="relative z-10">
                  {platform.customIcon ? (
                    <platform.customIcon />
                  ) : platform.icon ? (
                    <platform.icon className="w-5 h-5 sm:w-6 sm:h-6" />
                  ) : (
                    <Sparkles className="w-5 h-5 sm:w-6 sm:h-6" />
                  )}
                </div>

                {/* Selection indicator */}
                {isSelected && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center border-2 border-background"
                  >
                    <svg className="w-3 h-3 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </motion.div>
                )}
              </div>
              
              {/* Platform Name */}
              <span 
                className={cn(
                  "text-[10px] sm:text-xs font-medium text-center leading-tight transition-colors duration-200 max-w-[70px]",
                  isSelected ? "text-primary font-bold" : "text-muted-foreground group-hover:text-foreground"
                )}
              >
                {platform.name_ar}
              </span>
            </motion.button>
          );
        })}
      </div>

      {/* Show More/Less Button */}
      {platformsConfig.length > INITIAL_VISIBLE_COUNT && (
        <div className="flex justify-center pt-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAll(!showAll)}
            className="text-muted-foreground hover:text-foreground gap-2"
          >
            {showAll ? (
              <>
                <ChevronUp className="w-4 h-4" />
                عرض أقل
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4" />
                عرض المزيد ({platformsConfig.length - INITIAL_VISIBLE_COUNT})
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
};

export default SocialPlatformsGrid;
