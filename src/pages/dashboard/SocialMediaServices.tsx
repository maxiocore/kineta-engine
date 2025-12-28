import { useState, useMemo, useCallback, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, Link } from "react-router-dom";
import { useExchangeRate } from "@/hooks/useExchangeRate";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, 
  Heart,
  Instagram,
  Facebook,
  Youtube,
  Linkedin,
  Send,
  Globe,
  Loader2,
  Ghost,
  Wallet,
  Star,
  Sparkles,
  RefreshCw,
  Link as LinkIcon,
  Zap,
  CheckCircle2,
  ShoppingCart,
  TrendingUp,
  Clock,
  Shield,
  ChevronDown,
  Info,
  Plus,
  Minus,
  ArrowLeft,
  X,
  Package,
  FileText,
  Grid3X3,
  ArrowRight,
  Flame,
  Target,
  Award,
  Eye,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useFavorites } from "@/hooks/useFavorites";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { notifyNewOrder } from "@/lib/adminNotifyService";
import ClientDashboardLayout from "@/components/dashboard/ClientDashboardLayout";
import PullToRefresh from "@/components/ui/pull-to-refresh";
import ServicesPageSkeleton from "@/components/dashboard/ServicesPageSkeleton";
import { SocialLinkPreview } from "@/components/services/SocialLinkPreview";

interface Service {
  id: string;
  name: string;
  description: string | null;
  category: string;
  category_id: string | null;
  price: number;
  status: string;
  features: any;
  external_service_id: string | null;
  refill_enabled: boolean | null;
  refill_days: number | null;
}

// Platform Icons
const TikTokIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
  </svg>
);

const SpotifyIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
    <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
  </svg>
);

const DiscordIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
  </svg>
);

const TwitchIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
    <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z"/>
  </svg>
);

const ThreadsIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
    <path d="M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.472 12.01v-.017c.028-3.58.879-6.438 2.525-8.496C5.851 1.205 8.598.024 12.18 0h.014c2.746.02 5.043.725 6.826 2.098 1.677 1.29 2.858 3.13 3.509 5.467l-2.04.569c-1.104-3.96-3.898-5.984-8.304-6.015-2.91.022-5.11.936-6.54 2.717C4.307 6.504 3.616 8.914 3.589 12c.027 3.086.718 5.496 2.057 7.164 1.43 1.783 3.631 2.698 6.54 2.717 2.623-.02 4.358-.631 5.8-2.045 1.647-1.613 1.618-3.593 1.09-4.798-.31-.71-.873-1.3-1.634-1.75-.192 1.352-.622 2.446-1.284 3.272-.886 1.102-2.14 1.704-3.73 1.79-1.202.065-2.361-.218-3.259-.801-1.063-.689-1.685-1.74-1.752-2.96-.065-1.17.408-2.253 1.332-3.05.85-.732 2.07-1.194 3.628-1.375 1.337-.154 2.741-.095 4.093.173-.065-1.263-.422-2.211-1.068-2.813-.706-.658-1.758-.986-3.127-.986h-.056c-1.022.009-1.88.252-2.55.722-.645.452-1.057 1.074-1.223 1.85l-2.003-.428c.247-1.161.876-2.12 1.82-2.78 1.016-.712 2.29-1.074 3.792-1.078h.074c1.834 0 3.302.49 4.365 1.456.996.906 1.573 2.191 1.718 3.823.328.134.634.29.918.468 1.089.68 1.89 1.587 2.385 2.7.733 1.647.825 4.318-1.227 6.325-1.82 1.782-4.112 2.613-7.213 2.614Zm-.513-8.038c-.984.114-1.723.396-2.2.839-.436.405-.641.882-.612 1.421.043.77.474 1.664 1.963 1.664.069 0 .14-.002.21-.006 1.966-.104 2.943-1.09 3.238-3.272-1.056-.18-2.081-.247-3.088-.173z"/>
  </svg>
);

const PinterestIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
    <path d="M12 0C5.373 0 0 5.372 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 0 1 .083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12 0-6.628-5.373-12-12-12z"/>
  </svg>
);

const WhatsAppIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

const SoundCloudIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
    <path d="M1.175 12.225c-.051 0-.094.046-.101.1l-.233 2.154.233 2.105c.007.058.05.098.101.098.05 0 .09-.04.099-.098l.255-2.105-.27-2.154c-.009-.06-.052-.1-.084-.1zm-.899 1.02c-.051 0-.09.037-.101.094L0 14.479l.175 1.093c.011.053.05.094.101.094.046 0 .09-.04.094-.093l.199-1.093-.199-1.095c-.009-.053-.05-.094-.094-.094zm1.802-1.025c-.06 0-.101.045-.108.098l-.208 2.16.208 2.101c.007.057.048.098.108.098.052 0 .097-.04.107-.098l.24-2.101-.24-2.16c-.01-.053-.055-.098-.107-.098zm.905-.423c-.062 0-.107.045-.117.1l-.194 2.583.194 2.535c.01.054.055.1.117.1.062 0 .108-.046.116-.1l.219-2.535-.219-2.583c-.008-.055-.054-.1-.116-.1zm.902-.308c-.067 0-.111.047-.12.1l-.181 2.891.181 2.834c.009.053.053.1.12.1.065 0 .111-.047.118-.1l.207-2.834-.207-2.891c-.007-.053-.053-.1-.118-.1zm.906-.189c-.073 0-.119.047-.127.1l-.168 3.08.168 3.022c.008.053.054.1.127.1.07 0 .117-.047.125-.1l.189-3.022-.189-3.08c-.008-.053-.055-.1-.125-.1zm.905-.134c-.076 0-.123.047-.131.1l-.155 3.214.155 3.154c.008.053.055.1.131.1.076 0 .123-.047.131-.1l.175-3.154-.175-3.214c-.008-.053-.055-.1-.131-.1zm.907-.068c-.082 0-.129.047-.137.1l-.142 3.282.142 3.222c.008.053.055.1.137.1.079 0 .127-.047.135-.1l.162-3.222-.162-3.282c-.008-.053-.056-.1-.135-.1zm.906-.043c-.086 0-.133.047-.142.1l-.129 3.325.129 3.264c.009.053.056.1.142.1.086 0 .134-.047.141-.1l.146-3.264-.146-3.325c-.007-.053-.055-.1-.141-.1zm.907-.008c-.092 0-.139.047-.147.1l-.117 3.333.117 3.272c.008.053.055.1.147.1.089 0 .137-.047.146-.1l.131-3.272-.131-3.333c-.009-.053-.057-.1-.146-.1zm1.857-.085c-.141 0-.256.116-.263.256l-.09 3.162.09 3.102c.007.14.122.256.263.256.14 0 .254-.116.263-.256l.102-3.102-.102-3.162c-.009-.14-.123-.256-.263-.256zm-1.131.008c-.097 0-.142.047-.15.1l-.109 3.156.109 3.095c.008.053.053.1.15.1.094 0 .142-.047.15-.1l.121-3.095-.121-3.156c-.008-.053-.056-.1-.15-.1zm2.039-.081c-.146 0-.265.119-.272.265l-.077 3.152.077 3.092c.007.146.126.265.272.265.144 0 .262-.119.271-.265l.086-3.092-.086-3.152c-.009-.146-.127-.265-.271-.265zm.906.016c-.152 0-.276.124-.283.276l-.063 3.136.063 3.076c.007.152.131.276.283.276.151 0 .274-.124.282-.276l.072-3.076-.072-3.136c-.008-.152-.131-.276-.282-.276zm.907.032c-.158 0-.285.128-.293.285l-.051 3.104.051 3.044c.008.157.135.285.293.285.156 0 .282-.128.29-.285l.058-3.044-.058-3.104c-.008-.157-.134-.285-.29-.285zm.906.048c-.163 0-.294.132-.301.294l-.039 3.056.039 2.996c.007.162.138.294.301.294.162 0 .292-.132.3-.294l.045-2.996-.045-3.056c-.008-.162-.138-.294-.3-.294zm.907.064c-.168 0-.302.136-.31.304l-.026 2.992.026 2.932c.008.168.142.304.31.304.167 0 .301-.136.308-.304l.03-2.932-.03-2.992c-.007-.168-.141-.304-.308-.304zm.907.08c-.174 0-.311.14-.318.314l-.014 2.912.014 2.852c.007.173.144.314.318.314.172 0 .31-.14.317-.314l.016-2.852-.016-2.912c-.007-.174-.145-.314-.317-.314zm1.892.224c-.302 0-.545.243-.552.545l-.012 2.328.012 2.269c.007.301.25.545.552.545.3 0 .544-.244.55-.545l.013-2.269-.013-2.328c-.006-.302-.25-.545-.55-.545zm.906-.154c-.308 0-.556.249-.562.556l-.012 2.482.012 2.422c.006.307.254.556.562.556.306 0 .553-.249.56-.556l.013-2.422-.013-2.482c-.007-.307-.254-.556-.56-.556zm.907.069c-.313 0-.566.253-.573.566l0 2.413.012 2.353c.007.313.26.566.573.566.312 0 .564-.253.571-.566l.014-2.353-.014-2.413c-.007-.313-.259-.566-.571-.566zm1.934.264c-.372 0-.674.302-.68.674l-.006 1.909.006 1.85c.006.372.308.674.68.674.371 0 .672-.302.679-.674l.007-1.85-.007-1.909c-.007-.372-.308-.674-.679-.674zm.928-.221c-.38 0-.688.308-.694.688l-.006 2.13.006 2.07c.006.38.314.688.694.688.379 0 .686-.308.693-.688l.007-2.07-.007-2.13c-.007-.38-.314-.688-.693-.688zm.907.134c-.387 0-.699.313-.705.7l-.007 1.996.007 1.936c.006.387.318.7.705.7.386 0 .698-.313.704-.7l.008-1.936-.008-1.996c-.006-.387-.318-.7-.704-.7zm.928-.087c-.394 0-.712.319-.718.713l-.007 2.083.007 2.023c.006.394.324.713.718.713.393 0 .71-.319.717-.713l.008-2.023-.008-2.083c-.007-.394-.324-.713-.717-.713zm.906.087c-.4 0-.724.325-.73.726l-.007 1.996.007 1.936c.006.401.33.726.73.726.399 0 .722-.325.729-.726l.008-1.936-.008-1.996c-.007-.401-.33-.726-.729-.726zm.929-.134c-.408 0-.738.331-.744.74l-.007 2.13.007 2.07c.006.408.336.74.744.74.407 0 .736-.332.743-.74l.008-2.07-.008-2.13c-.007-.409-.336-.74-.743-.74zm.906.221c-.414 0-.75.337-.757.751l-.006 1.909.006 1.85c.007.414.343.751.757.751.413 0 .748-.337.755-.751l.007-1.85-.007-1.909c-.007-.414-.342-.751-.755-.751z"/>
  </svg>
);

const VimeoIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
    <path d="M23.977 6.416c-.105 2.338-1.739 5.543-4.894 9.609-3.268 4.247-6.026 6.37-8.29 6.37-1.409 0-2.578-1.294-3.553-3.881L5.322 11.4C4.603 8.816 3.834 7.522 3.01 7.522c-.179 0-.806.378-1.881 1.132L0 7.197a315.065 315.065 0 0 0 3.501-3.128C5.08 2.701 6.266 1.984 7.055 1.91c1.867-.18 3.016 1.1 3.447 3.838.465 2.953.789 4.789.971 5.507.539 2.45 1.131 3.674 1.776 3.674.502 0 1.256-.796 2.265-2.385 1.004-1.589 1.54-2.797 1.612-3.628.144-1.371-.395-2.061-1.614-2.061-.574 0-1.167.121-1.777.391 1.186-3.868 3.434-5.757 6.762-5.637 2.473.06 3.628 1.664 3.493 4.797l-.013.01z"/>
  </svg>
);

const RedditIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
    <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"/>
  </svg>
);

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

const TrustpilotIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
    <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
  </svg>
);

const AppStoreIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
  </svg>
);

const PlayStoreIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
    <path d="M3 20.5v-17c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5v17c0 .83-.67 1.5-1.5 1.5S3 21.33 3 20.5zm3-8.5l8-8 2 2-8 8zm0 6l8 8 2-2-8-8z"/>
  </svg>
);

const ClubhouseIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
  </svg>
);

const LikeeIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
  </svg>
);

const socialNetworks = [
  { id: 'all', name: 'جميع المنصات', keywords: [], icon: Sparkles, gradient: 'from-primary to-accent', bgColor: 'bg-gradient-to-br from-primary to-accent' },
  { id: 'instagram', name: 'انستقرام', keywords: ['instagram', 'انستقرام', 'انستا', 'insta'], icon: Instagram, gradient: 'from-[#833AB4] via-[#FD1D1D] to-[#F77737]', bgColor: 'bg-gradient-to-br from-[#833AB4] via-[#FD1D1D] to-[#F77737]' },
  { id: 'tiktok', name: 'تيك توك', keywords: ['tiktok', 'تيك توك', 'تيكتوك'], customIcon: TikTokIcon, gradient: 'from-[#000000] via-[#25F4EE] to-[#FE2C55]', bgColor: 'bg-gradient-to-br from-[#000000] via-[#25F4EE] to-[#FE2C55]' },
  { id: 'youtube', name: 'يوتيوب', keywords: ['youtube', 'يوتيوب', 'يوتوب'], icon: Youtube, gradient: 'from-[#FF0000] to-[#CC0000]', bgColor: 'bg-[#FF0000]' },
  { id: 'facebook', name: 'فيسبوك', keywords: ['facebook', 'فيسبوك', 'فيس بوك'], icon: Facebook, gradient: 'from-[#1877F2] to-[#0D65D9]', bgColor: 'bg-[#1877F2]' },
  { id: 'twitter', name: 'تويتر / X', keywords: ['twitter', 'تويتر', 'x ', 'اكس'], icon: X, gradient: 'from-[#000000] to-[#14171A]', bgColor: 'bg-black' },
  { id: 'threads', name: 'ثريدز', keywords: ['threads', 'ثريدز', 'ثردز'], customIcon: ThreadsIcon, gradient: 'from-[#000000] to-[#333333]', bgColor: 'bg-black' },
  { id: 'snapchat', name: 'سناب شات', keywords: ['snapchat', 'سناب شات', 'سناب'], icon: Ghost, gradient: 'from-[#FFFC00] to-[#FFE100]', bgColor: 'bg-[#FFFC00]', textColor: 'text-black' },
  { id: 'telegram', name: 'تيليجرام', keywords: ['telegram', 'تيليجرام', 'تلجرام'], icon: Send, gradient: 'from-[#0088CC] to-[#0077B5]', bgColor: 'bg-[#0088CC]' },
  { id: 'whatsapp', name: 'واتساب', keywords: ['whatsapp', 'واتساب', 'واتس'], customIcon: WhatsAppIcon, gradient: 'from-[#25D366] to-[#128C7E]', bgColor: 'bg-[#25D366]' },
  { id: 'spotify', name: 'سبوتيفاي', keywords: ['spotify', 'سبوتيفاي'], customIcon: SpotifyIcon, gradient: 'from-[#1DB954] to-[#19A349]', bgColor: 'bg-[#1DB954]' },
  { id: 'soundcloud', name: 'ساوند كلاود', keywords: ['soundcloud', 'ساوند كلاود', 'ساوندكلاود'], customIcon: SoundCloudIcon, gradient: 'from-[#FF5500] to-[#FF3300]', bgColor: 'bg-[#FF5500]' },
  { id: 'discord', name: 'ديسكورد', keywords: ['discord', 'ديسكورد'], customIcon: DiscordIcon, gradient: 'from-[#5865F2] to-[#4752C4]', bgColor: 'bg-[#5865F2]' },
  { id: 'twitch', name: 'تويتش', keywords: ['twitch', 'تويتش'], customIcon: TwitchIcon, gradient: 'from-[#9146FF] to-[#7C2FE6]', bgColor: 'bg-[#9146FF]' },
  { id: 'linkedin', name: 'لينكدإن', keywords: ['linkedin', 'لينكدان'], icon: Linkedin, gradient: 'from-[#0A66C2] to-[#0855A5]', bgColor: 'bg-[#0A66C2]' },
  { id: 'pinterest', name: 'بينترست', keywords: ['pinterest', 'بينترست', 'بنترست'], customIcon: PinterestIcon, gradient: 'from-[#E60023] to-[#BD081C]', bgColor: 'bg-[#E60023]' },
  { id: 'reddit', name: 'ريديت', keywords: ['reddit', 'ريديت', 'ريدت'], customIcon: RedditIcon, gradient: 'from-[#FF4500] to-[#FF5700]', bgColor: 'bg-[#FF4500]' },
  { id: 'vimeo', name: 'فيميو', keywords: ['vimeo', 'فيميو'], customIcon: VimeoIcon, gradient: 'from-[#1AB7EA] to-[#162221]', bgColor: 'bg-[#1AB7EA]' },
  { id: 'likee', name: 'لايكي', keywords: ['likee', 'لايكي', 'لايك'], customIcon: LikeeIcon, gradient: 'from-[#00F0FF] via-[#6C5CE7] to-[#EE5A24]', bgColor: 'bg-gradient-to-br from-[#00F0FF] via-[#6C5CE7] to-[#EE5A24]' },
  { id: 'clubhouse', name: 'كلوب هاوس', keywords: ['clubhouse', 'كلوب هاوس', 'كلابهاوس'], customIcon: ClubhouseIcon, gradient: 'from-[#F5E6D3] to-[#D4C4A8]', bgColor: 'bg-[#F5E6D3]', textColor: 'text-black' },
  { id: 'google', name: 'جوجل', keywords: ['google', 'جوجل', 'قوقل', 'gmb', 'google business'], customIcon: GoogleIcon, gradient: 'from-[#4285F4] via-[#34A853] to-[#FBBC05]', bgColor: 'bg-white', textColor: 'text-black' },
  { id: 'trustpilot', name: 'تراست بايلوت', keywords: ['trustpilot', 'تراست بايلوت', 'trust pilot'], customIcon: TrustpilotIcon, gradient: 'from-[#00B67A] to-[#00916B]', bgColor: 'bg-[#00B67A]' },
  { id: 'appstore', name: 'آب ستور', keywords: ['app store', 'appstore', 'آب ستور', 'ابل', 'apple'], customIcon: AppStoreIcon, gradient: 'from-[#0D96F6] to-[#147CE5]', bgColor: 'bg-[#0D96F6]' },
  { id: 'playstore', name: 'بلاي ستور', keywords: ['play store', 'playstore', 'بلاي ستور', 'جوجل بلاي', 'google play'], customIcon: PlayStoreIcon, gradient: 'from-[#00C853] via-[#FFEA00] to-[#FF5252]', bgColor: 'bg-gradient-to-br from-[#00C853] via-[#FFEA00] to-[#FF5252]' },
  { id: 'website', name: 'زيارات المواقع', keywords: ['website', 'زيار', 'visit', 'traffic', 'web'], icon: Globe, gradient: 'from-[#10B981] to-[#059669]', bgColor: 'bg-[#10B981]' },
  { id: 'reviews', name: 'تقييمات', keywords: ['review', 'تقييم', 'rating', 'تقييمات'], icon: Star, gradient: 'from-[#F59E0B] to-[#D97706]', bgColor: 'bg-[#F59E0B]' },
  { id: 'seo', name: 'SEO', keywords: ['seo', 'سيو', 'backlinks', 'باك لينك'], icon: TrendingUp, gradient: 'from-[#8B5CF6] to-[#7C3AED]', bgColor: 'bg-[#8B5CF6]' },
  { id: 'email', name: 'إيميل ماركتنج', keywords: ['email', 'ايميل', 'بريد', 'mail'], icon: Send, gradient: 'from-[#EA4335] to-[#C5221F]', bgColor: 'bg-[#EA4335]' },
];

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring" as const,
      stiffness: 300,
      damping: 24,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring" as const,
      stiffness: 200,
      damping: 20,
    },
  },
};

const pulseVariants = {
  pulse: {
    scale: [1, 1.02, 1],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: "easeInOut" as const,
    },
  },
};

const glowVariants = {
  glow: {
    boxShadow: [
      "0 0 20px hsl(var(--primary) / 0.2)",
      "0 0 40px hsl(var(--primary) / 0.4)",
      "0 0 20px hsl(var(--primary) / 0.2)",
    ],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: "easeInOut" as const,
    },
  },
};

// Floating particles component
const FloatingParticles = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    {[...Array(6)].map((_, i) => (
      <motion.div
        key={i}
        className="absolute w-2 h-2 rounded-full bg-primary/20"
        initial={{ 
          x: Math.random() * 100 + "%",
          y: Math.random() * 100 + "%",
          scale: Math.random() * 0.5 + 0.5,
        }}
        animate={{
          y: [null, "-20%", "120%"],
          x: [null, `${Math.random() * 20 - 10}%`],
          opacity: [0, 1, 0],
        }}
        transition={{
          duration: Math.random() * 4 + 4,
          repeat: Infinity,
          delay: Math.random() * 2,
          ease: "linear",
        }}
      />
    ))}
  </div>
);

// Interactive Service Card for Browse Tab
const BrowseServiceCard = ({ 
  service, 
  onOrder, 
  isFavorite,
  onToggleFavorite,
  parseFeatures,
  convertToSAR,
  index,
}: { 
  service: Service; 
  onOrder: (service: Service) => void;
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
  parseFeatures: (features: any) => { min: number; max: number; refill: boolean };
  convertToSAR: (price: number) => number;
  index: number;
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const features = parseFeatures(service.features);
  const pricePerK = convertToSAR(service.price);

  const getPlatform = () => {
    const text = `${service.name} ${service.category}`.toLowerCase();
    for (const network of socialNetworks) {
      if (network.id !== 'all' && network.keywords.some(k => text.includes(k))) {
        return network;
      }
    }
    return socialNetworks[1];
  };
  
  const platform = getPlatform();
  const Icon = platform.icon;
  const CustomIcon = (platform as any).customIcon;

  return (
    <motion.div
      variants={itemVariants}
      initial="hidden"
      animate="visible"
      whileHover={{ scale: 1.02, y: -4 }}
      whileTap={{ scale: 0.98 }}
      transition={{ delay: index * 0.03 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      <Card className={cn(
        "relative border border-border/50 bg-card/80 backdrop-blur-sm overflow-hidden transition-all duration-300 rounded-xl group cursor-pointer",
        isHovered && "border-primary/50 shadow-lg shadow-primary/10"
      )}>
        {/* Animated gradient background on hover */}
        <motion.div 
          className={cn(
            "absolute inset-0 bg-gradient-to-r opacity-0 transition-opacity duration-300",
            platform.gradient
          )}
          animate={{ opacity: isHovered ? 0.05 : 0 }}
        />
        
        {/* Glow effect */}
        <motion.div 
          className="absolute inset-0 bg-gradient-radial from-primary/10 to-transparent opacity-0"
          animate={{ opacity: isHovered ? 1 : 0 }}
          transition={{ duration: 0.3 }}
        />

        <CardContent className="p-4 relative z-10">
          <div className="flex items-center gap-4">
            {/* Platform Icon with animation */}
            <motion.div 
              className={`w-12 h-12 rounded-xl ${platform.bgColor} flex items-center justify-center shrink-0 relative overflow-hidden`}
              whileHover={{ rotate: [0, -5, 5, 0] }}
              transition={{ duration: 0.4 }}
            >
              {CustomIcon ? (
                <div className={platform.textColor || "text-white"}>
                  <CustomIcon />
                </div>
              ) : Icon && (
                <Icon className={cn("w-6 h-6", platform.textColor || "text-white")} />
              )}
              {/* Shine effect */}
              <motion.div 
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                initial={{ x: "-100%" }}
                animate={isHovered ? { x: "100%" } : {}}
                transition={{ duration: 0.6 }}
              />
            </motion.div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm line-clamp-1 group-hover:text-primary transition-colors duration-300">
                {service.name}
              </h3>
              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                {service.external_service_id && (
                  <span className="font-mono">#{service.external_service_id}</span>
                )}
                <span className="flex items-center gap-1">
                  <Target className="w-3 h-3" />
                  {features.min.toLocaleString()}-{features.max.toLocaleString()}
                </span>
              </div>
              {/* Badges */}
              <div className="flex items-center gap-1.5 mt-2">
                {(service.refill_enabled || features.refill) && (
                  <Badge className="bg-green-500/15 text-green-600 border-0 text-[10px] px-2 py-0.5 gap-1">
                    <RefreshCw className="w-2.5 h-2.5" />
                    ضمان
                  </Badge>
                )}
                {service.refill_days && (
                  <Badge className="bg-blue-500/15 text-blue-600 border-0 text-[10px] px-2 py-0.5">
                    {service.refill_days} يوم
                  </Badge>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col items-end gap-2 shrink-0">
              {/* Price with animation */}
              <motion.div 
                className="text-left"
                animate={isHovered ? { scale: 1.05 } : { scale: 1 }}
              >
                <span className="text-lg font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  {pricePerK.toFixed(2)}
                </span>
                <span className="text-[10px] text-muted-foreground mr-1">ر.س</span>
              </motion.div>
              
              <div className="flex items-center gap-2">
                {/* Favorite button */}
                <motion.button
                  onClick={(e) => { e.stopPropagation(); onToggleFavorite(service.id); }}
                  className={cn(
                    "h-9 w-9 rounded-lg flex items-center justify-center transition-colors",
                    isFavorite ? "bg-rose-500/15 text-rose-500" : "bg-muted hover:bg-rose-500/10 hover:text-rose-500"
                  )}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Heart className={cn("w-4 h-4", isFavorite && "fill-current")} />
                </motion.button>
                
                {/* Order button */}
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    size="sm"
                    onClick={() => onOrder(service)}
                    className={cn(
                      "bg-gradient-to-r text-white rounded-lg h-9 px-4 text-xs font-semibold gap-1.5",
                      platform.gradient
                    )}
                  >
                    <ShoppingCart className="w-3.5 h-3.5" />
                    اطلب الآن
                  </Button>
                </motion.div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
// Platform selector with animations - Enhanced Grid Design with Subcategories
const PlatformSelector = ({ 
  networks, 
  selected, 
  onSelect, 
  getServiceCount 
}: { 
  networks: typeof socialNetworks;
  selected: string;
  onSelect: (id: string) => void;
  getServiceCount: (id: string) => number;
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activePlatform, setActivePlatform] = useState<string | null>(null);
  const [subcategories, setSubcategories] = useState<any[]>([]);
  const [loadingSubcategories, setLoadingSubcategories] = useState(false);
  
  const initialCount = 14;
  const displayedNetworks = isExpanded ? networks : networks.slice(0, initialCount);
  const hasMore = networks.length > initialCount;

  // Fetch subcategories when a platform is clicked
  const fetchSubcategories = async (platformSlug: string) => {
    if (platformSlug === 'all') {
      setActivePlatform(null);
      setSubcategories([]);
      return;
    }
    
    setLoadingSubcategories(true);
    try {
      // First get the parent category ID
      const { data: parentCat } = await supabase
        .from('categories')
        .select('id')
        .ilike('slug', `%${platformSlug}%`)
        .is('parent_id', null)
        .single();
      
      if (parentCat) {
        // Then get subcategories
        const { data: subs } = await supabase
          .from('categories')
          .select('id, name, name_ar, slug, icon, color')
          .eq('parent_id', parentCat.id)
          .eq('is_active', true)
          .order('display_order');
        
        setSubcategories(subs || []);
        setActivePlatform(platformSlug);
      } else {
        setSubcategories([]);
        setActivePlatform(platformSlug);
      }
    } catch (error) {
      console.error('Error fetching subcategories:', error);
      setSubcategories([]);
    } finally {
      setLoadingSubcategories(false);
    }
  };

  const handlePlatformClick = (networkId: string) => {
    onSelect(networkId);
    fetchSubcategories(networkId);
  };

  const getSubcategoryIcon = (iconName: string | null) => {
    const icons: Record<string, any> = {
      Users: () => <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
      Heart: () => <Heart className="w-4 h-4" />,
      Eye: () => <Eye className="w-4 h-4" />,
      ThumbsUp: () => <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M7 10v12"/><path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2h0a3.13 3.13 0 0 1 3 3.88Z"/></svg>,
      MessageCircle: () => <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>,
      Play: () => <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>,
      Repeat: () => <RefreshCw className="w-4 h-4" />,
      Share2: () => <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" x2="15.42" y1="13.51" y2="17.49"/><line x1="15.41" x2="8.59" y1="6.51" y2="10.49"/></svg>,
      Bookmark: () => <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/></svg>,
    };
    return icons[iconName || 'Users'] || icons.Users;
  };

  return (
    <div className="space-y-4">
      {/* Platforms Grid - Responsive and Consistent */}
      <motion.div 
        className="grid grid-cols-7 gap-2 sm:gap-3"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {displayedNetworks.map((network, index) => {
          const Icon = network.icon;
          const CustomIcon = (network as any).customIcon;
          const isSelected = selected === network.id;
          const isActive = activePlatform === network.id;

          return (
            <motion.button
              key={network.id}
              variants={itemVariants}
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handlePlatformClick(network.id)}
              className="flex flex-col items-center gap-1.5 group"
            >
              {/* Platform Icon */}
              <div className="relative">
                <motion.div 
                  className={cn(
                    "w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-xl sm:rounded-2xl flex items-center justify-center transition-all duration-300 relative overflow-hidden",
                    network.bgColor,
                    isSelected || isActive
                      ? "ring-2 ring-primary ring-offset-2 ring-offset-background shadow-lg" 
                      : "hover:shadow-lg hover:scale-105"
                  )}
                >
                  {/* Shine effect */}
                  <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-black/10 pointer-events-none" />
                  
                  {/* Icon */}
                  <div className="relative z-10">
                    {CustomIcon ? (
                      <div className={network.textColor || "text-white"}>
                        <CustomIcon />
                      </div>
                    ) : Icon && (
                      <Icon className={cn("w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6", network.textColor || "text-white")} />
                    )}
                  </div>
                </motion.div>

                {/* Selection indicator */}
                <AnimatePresence>
                  {(isSelected || isActive) && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-primary flex items-center justify-center border-2 border-background"
                    >
                      <CheckCircle2 className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-primary-foreground" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              
              {/* Platform Name */}
              <span className={cn(
                "text-[9px] sm:text-[10px] md:text-xs font-medium text-center leading-tight transition-colors duration-200 max-w-[60px] sm:max-w-[70px] line-clamp-1",
                isSelected || isActive ? "text-primary font-bold" : "text-muted-foreground group-hover:text-foreground"
              )}>
                {network.name}
              </span>
            </motion.button>
          );
        })}
      </motion.div>
      
      {/* Expand/Collapse button */}
      {hasMore && (
        <motion.button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full py-2 px-4 rounded-xl border border-border/50 bg-card/50 hover:bg-card transition-all duration-300 flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
        >
          <motion.span
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.3 }}
          >
            <ChevronDown className="w-4 h-4" />
          </motion.span>
          <span>{isExpanded ? "عرض أقل" : `عرض المزيد`}</span>
        </motion.button>
      )}

      {/* Subcategories Section */}
      <AnimatePresence mode="wait">
        {activePlatform && activePlatform !== 'all' && (
          <motion.div
            key={activePlatform}
            initial={{ opacity: 0, height: 0, y: -10 }}
            animate={{ opacity: 1, height: "auto", y: 0 }}
            exit={{ opacity: 0, height: 0, y: -10 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div className="bg-card/60 backdrop-blur-sm rounded-xl border border-border/40 p-3 sm:p-4">
              {/* Subcategories Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center",
                    networks.find(n => n.id === activePlatform)?.bgColor || "bg-primary"
                  )}>
                    {(() => {
                      const network = networks.find(n => n.id === activePlatform);
                      if (!network) return <Sparkles className="w-4 h-4 text-white" />;
                      const CustomIcon = (network as any).customIcon;
                      const Icon = network.icon;
                      if (CustomIcon) return <div className={network.textColor || "text-white"}><CustomIcon /></div>;
                      if (Icon) return <Icon className={cn("w-4 h-4", network.textColor || "text-white")} />;
                      return <Sparkles className="w-4 h-4 text-white" />;
                    })()}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm">{networks.find(n => n.id === activePlatform)?.name}</h4>
                    <p className="text-[10px] text-muted-foreground">
                      {loadingSubcategories ? "جاري التحميل..." : `${subcategories.length} قسم فرعي`}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => { setActivePlatform(null); setSubcategories([]); }}
                  className="h-7 px-2"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {/* Subcategories Grid */}
              {loadingSubcategories ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-12 rounded-lg bg-muted/50 animate-pulse" />
                  ))}
                </div>
              ) : subcategories.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {/* All in this platform */}
                  <motion.button
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => onSelect(activePlatform)}
                    className={cn(
                      "p-2.5 sm:p-3 rounded-lg border transition-all duration-200 text-right flex items-center gap-2",
                      selected === activePlatform
                        ? "bg-primary/15 border-primary text-primary"
                        : "bg-card/80 border-border/50 hover:border-primary/40 hover:bg-muted/30"
                    )}
                  >
                    <div className="w-8 h-8 rounded-lg bg-muted/60 flex items-center justify-center shrink-0">
                      <Grid3X3 className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-xs truncate">الكل</p>
                    </div>
                  </motion.button>

                  {/* Subcategories */}
                  {subcategories.map((sub, idx) => {
                    const SubIcon = getSubcategoryIcon(sub.icon);
                    return (
                      <motion.button
                        key={sub.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: idx * 0.03 }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => onSelect(sub.slug)}
                        className={cn(
                          "p-2.5 sm:p-3 rounded-lg border transition-all duration-200 text-right flex items-center gap-2",
                          selected === sub.slug
                            ? "bg-primary/15 border-primary text-primary"
                            : "bg-card/80 border-border/50 hover:border-primary/40 hover:bg-muted/30"
                        )}
                      >
                        <div className={cn(
                          "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                          selected === sub.slug ? "bg-primary/20" : "bg-muted/60"
                        )}>
                          <SubIcon />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-xs truncate">{sub.name_ar}</p>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              ) : (
                <p className="text-center text-sm text-muted-foreground py-4">
                  لا توجد أقسام فرعية لهذه المنصة
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const SocialMediaServices = () => {
  const { user } = useAuth();
  const { favorites, toggleFavorite } = useFavorites();
  const navigate = useNavigate();
  const { convertToSAR } = useExchangeRate();
  
  const [activeTab, setActiveTab] = useState("new-order");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [link, setLink] = useState("");
  const [quantity, setQuantity] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [browseSearchQuery, setBrowseSearchQuery] = useState("");
  const [balance, setBalance] = useState(0);
  const [serviceSearchOpen, setServiceSearchOpen] = useState(false);
  const [serviceSearchQuery, setServiceSearchQuery] = useState("");
  const [showOrderSuccess, setShowOrderSuccess] = useState(false);

  // Fetch balance
  const { data: userBalance, refetch: refetchBalance } = useQuery({
    queryKey: ["user-balance", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase.from("user_balances").select("*").eq("user_id", user.id).single();
      return data;
    },
    enabled: !!user?.id,
  });

  useEffect(() => {
    if (userBalance) setBalance(userBalance.balance);
  }, [userBalance]);

  // Fetch services
  const { data: services = [], isLoading, refetch } = useQuery({
    queryKey: ["services-social"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("services")
        .select("*")
        .eq("status", "active")
        .order("price", { ascending: true });
      if (error) throw error;
      return data as Service[];
    },
  });

  const handleRefresh = async () => {
    await refetch();
    toast.success("تم تحديث الخدمات");
  };

  // Filter social media services
  const designDevKeywords = ['تصميم', 'شعار', 'لوجو', 'design', 'logo', 'بنر', 'banner', 'هوية', 'برمجة', 'تطوير', 'dev', 'development', 'app'];
  
  const socialMediaServices = useMemo(() => {
    return services.filter(service => {
      const text = `${service.category} ${service.name}`.toLowerCase();
      return !designDevKeywords.some(k => text.includes(k));
    });
  }, [services]);

  // Get services by category
  const getServicesByCategory = useCallback((categoryId: string) => {
    if (categoryId === 'all') return socialMediaServices;
    const network = socialNetworks.find(n => n.id === categoryId);
    if (!network || network.keywords.length === 0) return socialMediaServices;
    return socialMediaServices.filter(s => {
      const text = `${s.name} ${s.category}`.toLowerCase();
      return network.keywords.some(k => text.includes(k));
    });
  }, [socialMediaServices]);

  // Filtered services
  const categoryServices = useMemo(() => {
    let filtered = getServicesByCategory(selectedCategory);
    if (serviceSearchQuery) {
      const query = serviceSearchQuery.toLowerCase();
      filtered = filtered.filter(s =>
        s.name.toLowerCase().includes(query) ||
        s.external_service_id?.includes(query)
      );
    }
    return filtered;
  }, [selectedCategory, serviceSearchQuery, getServicesByCategory]);

  const browseServices = useMemo(() => {
    let filtered = socialMediaServices;
    if (browseSearchQuery) {
      const query = browseSearchQuery.toLowerCase();
      filtered = filtered.filter(s =>
        s.name.toLowerCase().includes(query) ||
        s.category.toLowerCase().includes(query) ||
        s.external_service_id?.includes(query)
      );
    }
    return filtered;
  }, [browseSearchQuery, socialMediaServices]);

  // Parse features
  const parseFeatures = (features: any) => {
    const defaults = { min: 10, max: 100000, refill: false };
    if (!features) return defaults;
    try {
      const f = typeof features === 'string' ? JSON.parse(features) : features;
      return {
        min: parseInt(f.min || f.minQuantity) || defaults.min,
        max: parseInt(f.max || f.maxQuantity) || defaults.max,
        refill: f.refill === true || f.refill === 'true',
      };
    } catch {
      return defaults;
    }
  };

  // Calculate total price
  const totalPrice = useMemo(() => {
    if (!selectedService || !quantity) return 0;
    const qty = parseInt(quantity) || 0;
    const priceInUSD = (selectedService.price / 1000) * qty;
    return convertToSAR(priceInUSD);
  }, [selectedService, quantity, convertToSAR]);

  // Get link placeholder
  const getLinkPlaceholder = () => {
    if (!selectedService) return "https://...";
    const name = selectedService.name.toLowerCase();
    if (name.includes('instagram') || name.includes('انستقرام')) return "https://instagram.com/username";
    if (name.includes('tiktok') || name.includes('تيك توك')) return "https://tiktok.com/@username";
    if (name.includes('youtube') || name.includes('يوتيوب')) return "https://youtube.com/watch?v=...";
    if (name.includes('twitter') || name.includes('تويتر')) return "https://twitter.com/username";
    if (name.includes('facebook') || name.includes('فيسبوك')) return "https://facebook.com/...";
    return "https://...";
  };

  // Handle service selection
  const handleSelectService = (service: Service) => {
    setSelectedService(service);
    const features = parseFeatures(service.features);
    setQuantity(features.min.toString());
    setServiceSearchOpen(false);
    setServiceSearchQuery("");
  };

  // Quantity controls
  const incrementQuantity = () => {
    if (!selectedService) return;
    const features = parseFeatures(selectedService.features);
    const current = parseInt(quantity) || features.min;
    const step = Math.max(100, Math.floor(features.min));
    const newQty = Math.min(current + step, features.max);
    setQuantity(newQty.toString());
  };

  const decrementQuantity = () => {
    if (!selectedService) return;
    const features = parseFeatures(selectedService.features);
    const current = parseInt(quantity) || features.min;
    const step = Math.max(100, Math.floor(features.min));
    const newQty = Math.max(current - step, features.min);
    setQuantity(newQty.toString());
  };

  // Submit order
  const handleSubmit = async () => {
    if (!user) { toast.error("يجب تسجيل الدخول"); return; }
    if (!selectedService || !link || !quantity) { toast.error("يرجى ملء جميع الحقول"); return; }
    
    const features = parseFeatures(selectedService.features);
    const qty = parseInt(quantity);
    
    if (qty < features.min || qty > features.max) {
      toast.error(`الكمية يجب أن تكون بين ${features.min} و ${features.max}`);
      return;
    }
    if (!link.startsWith('http')) {
      toast.error("الرابط يجب أن يبدأ بـ http أو https");
      return;
    }
    if (!userBalance || userBalance.balance < totalPrice) { 
      toast.error("رصيدك غير كافي"); 
      return; 
    }

    setIsSubmitting(true);
    try {
      const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      const { data: orderData, error: orderError } = await supabase.from("orders").insert({
        user_id: user.id, 
        service_id: selectedService.id, 
        order_number: orderNumber, 
        quantity: qty, 
        link, 
        total_price: totalPrice, 
        status: "pending",
      }).select().single();
      
      if (orderError) throw orderError;
      
      await supabase.from("user_balances").update({ 
        balance: userBalance.balance - totalPrice, 
        total_spent: userBalance.total_spent + totalPrice 
      }).eq("user_id", user.id);
      
      await supabase.from("balance_logs").insert({
        user_id: user.id,
        action_type: 'order',
        amount: -totalPrice,
        balance_before: userBalance.balance,
        balance_after: userBalance.balance - totalPrice,
        reference_type: 'order',
        reference_id: orderData.id,
        notes: `خصم للطلب رقم ${orderData.order_number}`
      });
      
      if (selectedService.external_service_id) {
        try {
          await supabase.functions.invoke('provider-order', {
            body: { orderId: orderData.id, serviceId: selectedService.id, link, quantity: qty }
          });
        } catch {}
      }
      
      setShowOrderSuccess(true);
      setTimeout(() => setShowOrderSuccess(false), 3000);
      
      toast.success("تم إرسال الطلب بنجاح!", {
        description: `رقم الطلب: ${orderNumber}`,
        action: { label: "عرض الطلبات", onClick: () => navigate('/dashboard/orders') }
      });
      
      notifyNewOrder({
        orderNumber: orderData.order_number,
        userName: user.user_metadata?.full_name,
        userEmail: user.email || '',
        serviceName: selectedService.name,
        quantity: qty,
        totalPrice,
      });
      
      setLink("");
      setQuantity("");
      setSelectedService(null);
      refetchBalance();
      
    } catch { 
      toast.error("حدث خطأ أثناء إرسال الطلب"); 
    } finally { 
      setIsSubmitting(false); 
    }
  };

  // Get platform for service
  const getServicePlatform = (service: Service) => {
    const text = `${service.name} ${service.category}`.toLowerCase();
    for (const network of socialNetworks) {
      if (network.id !== 'all' && network.keywords.some(k => text.includes(k))) {
        return network;
      }
    }
    return socialNetworks[1];
  };

  if (isLoading) {
    return (
      <ClientDashboardLayout>
        <ServicesPageSkeleton title="خدمات السوشيال ميديا" color="blue" />
      </ClientDashboardLayout>
    );
  }

  const currentFeatures = selectedService ? parseFeatures(selectedService.features) : null;
  const selectedPlatform = selectedService ? getServicePlatform(selectedService) : null;

  return (
    <ClientDashboardLayout>
      <PullToRefresh onRefresh={handleRefresh} className="h-full w-full overflow-x-hidden overflow-y-auto">
        <div className="w-full min-w-0 max-w-full pb-8 px-2 sm:px-4 relative" dir="rtl">
          {/* Background decoration */}
          <div className="absolute inset-0 bg-gradient-mesh opacity-30 pointer-events-none" />
          <FloatingParticles />
          
          {/* Order Success Animation */}
          <AnimatePresence>
            {showOrderSuccess && (
              <motion.div
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: [0, 1.2, 1] }}
                  className="bg-green-500 rounded-full p-8"
                >
                  <CheckCircle2 className="w-24 h-24 text-white" />
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Header with animation */}
          <motion.div 
            className="flex items-center justify-between mb-6 pt-2 relative z-10"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center gap-3">
              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                <Link to="/dashboard/our-services">
                  <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl bg-muted/50 backdrop-blur-sm">
                    <ArrowLeft className="w-5 h-5" />
                  </Button>
                </Link>
              </motion.div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  خدمات التواصل الاجتماعي
                </h1>
                <p className="text-xs text-muted-foreground hidden sm:block">
                  زد متابعيك وتفاعلك على جميع المنصات بأسعار منافسة
                </p>
              </div>
            </div>
            
            {/* Balance Card with glow */}
            <motion.div 
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20 backdrop-blur-sm"
              whileHover={{ scale: 1.02 }}
              variants={glowVariants}
              animate="glow"
            >
              <motion.div
                animate={{ rotate: [0, 15, -15, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Wallet className="w-5 h-5 text-primary" />
              </motion.div>
              <span className="text-base font-bold text-primary">{balance.toFixed(2)}</span>
              <span className="text-xs text-muted-foreground">ر.س</span>
            </motion.div>
          </motion.div>

          {/* Tabs with animation */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full relative z-10">
              <TabsList className="w-full grid grid-cols-2 h-12 mb-6 bg-muted/50 backdrop-blur-sm rounded-xl p-1">
                <TabsTrigger 
                  value="new-order" 
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-accent data-[state=active]:text-primary-foreground gap-2 text-sm font-semibold rounded-lg transition-all duration-300"
                >
                  <ShoppingCart className="w-4 h-4" />
                  طلب جديد
                </TabsTrigger>
                <TabsTrigger 
                  value="browse" 
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-accent data-[state=active]:text-primary-foreground gap-2 text-sm font-semibold rounded-lg transition-all duration-300"
                >
                  <Grid3X3 className="w-4 h-4" />
                  تصفح الخدمات
                  <Badge variant="secondary" className="mr-1 text-[10px]">
                    {socialMediaServices.length}
                  </Badge>
                </TabsTrigger>
              </TabsList>

              {/* New Order Tab */}
              <TabsContent value="new-order" className="mt-0">
                <motion.div 
                  className="grid lg:grid-cols-[1fr_380px] gap-6"
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                >
                  {/* Order Form */}
                  <motion.div variants={cardVariants}>
                    <Card className="border-border/50 bg-card/80 backdrop-blur-sm overflow-hidden">
                      <CardHeader className="pb-4 border-b border-border/50">
                        <CardTitle className="text-lg font-bold flex items-center gap-3">
                          <motion.div 
                            className="w-10 h-10 rounded-xl bg-gradient-to-r from-primary to-accent flex items-center justify-center"
                            animate={{ rotate: [0, 5, -5, 0] }}
                            transition={{ duration: 2, repeat: Infinity }}
                          >
                            <Package className="w-5 h-5 text-primary-foreground" />
                          </motion.div>
                          نموذج الطلب
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-6 p-6">
                        {/* Platform Selector */}
                        <PlatformSelector
                          networks={socialNetworks}
                          selected={selectedCategory}
                          onSelect={(id) => { setSelectedCategory(id); setSelectedService(null); }}
                          getServiceCount={(id) => getServicesByCategory(id).length}
                        />

                        {/* Service Selection */}
                        <motion.div 
                          className="space-y-2"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.3 }}
                        >
                          <Label className="text-sm font-semibold flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-primary" />
                            الخدمة
                          </Label>
                          <Popover open={serviceSearchOpen} onOpenChange={setServiceSearchOpen}>
                            <PopoverTrigger asChild>
                              <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                                <Button
                                  variant="outline"
                                  role="combobox"
                                  aria-expanded={serviceSearchOpen}
                                  className="w-full h-14 justify-between rounded-xl bg-muted/50 border-2 border-border hover:border-primary/50 text-right transition-all duration-300"
                                >
                                  {selectedService ? (
                                    <div className="flex items-center gap-3 text-right flex-1 min-w-0">
                                      {selectedPlatform && (
                                        <div className={`w-8 h-8 rounded-lg ${selectedPlatform.bgColor} flex items-center justify-center shrink-0`}>
                                          {(() => {
                                            const CustomIcon = (selectedPlatform as any).customIcon;
                                            const Icon = selectedPlatform.icon;
                                            if (CustomIcon) return <div className={selectedPlatform.textColor || "text-white"}><CustomIcon /></div>;
                                            if (Icon) return <Icon className={cn("w-4 h-4", selectedPlatform.textColor || "text-white")} />;
                                            return null;
                                          })()}
                                        </div>
                                      )}
                                      <span className="truncate font-medium">{selectedService.name}</span>
                                      <Badge className="bg-primary/15 text-primary border-0 text-xs shrink-0 ml-auto">
                                        {convertToSAR(selectedService.price).toFixed(2)} ر.س
                                      </Badge>
                                    </div>
                                  ) : (
                                    <span className="text-muted-foreground flex items-center gap-2">
                                      <Search className="w-4 h-4" />
                                      ابحث واختر الخدمة...
                                    </span>
                                  )}
                                  <ChevronDown className="w-5 h-5 shrink-0 opacity-50" />
                                </Button>
                              </motion.div>
                            </PopoverTrigger>
                            <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 bg-popover/95 backdrop-blur-xl border-border z-50 rounded-xl" align="start">
                              <Command className="bg-transparent">
                                <CommandInput 
                                  placeholder="ابحث عن خدمة..." 
                                  value={serviceSearchQuery}
                                  onValueChange={setServiceSearchQuery}
                                  className="h-12"
                                />
                                <CommandList className="max-h-72">
                                  <CommandEmpty className="py-8 text-center text-sm text-muted-foreground">
                                    <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                    لا توجد خدمات مطابقة
                                  </CommandEmpty>
                                  <CommandGroup>
                                    {categoryServices.slice(0, 50).map((service, index) => {
                                      const features = parseFeatures(service.features);
                                      const platform = getServicePlatform(service);
                                      return (
                                        <CommandItem
                                          key={service.id}
                                          value={service.name}
                                          onSelect={() => handleSelectService(service)}
                                          className="flex items-center gap-3 py-3 px-3 cursor-pointer rounded-lg m-1 hover:bg-primary/10"
                                        >
                                          <div className={`w-9 h-9 rounded-lg ${platform.bgColor} flex items-center justify-center shrink-0`}>
                                            {(() => {
                                              const CustomIcon = (platform as any).customIcon;
                                              const Icon = platform.icon;
                                              if (CustomIcon) return <div className={platform.textColor || "text-white"}><CustomIcon /></div>;
                                              if (Icon) return <Icon className={cn("w-4 h-4", platform.textColor || "text-white")} />;
                                              return null;
                                            })()}
                                          </div>
                                          <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate">{service.name}</p>
                                            <p className="text-[11px] text-muted-foreground">
                                              {service.external_service_id && `#${service.external_service_id} • `}
                                              {features.min.toLocaleString()}-{features.max.toLocaleString()}
                                            </p>
                                          </div>
                                          <Badge className="bg-primary/15 text-primary border-0 text-xs shrink-0">
                                            {convertToSAR(service.price).toFixed(2)}
                                          </Badge>
                                        </CommandItem>
                                      );
                                    })}
                                  </CommandGroup>
                                </CommandList>
                              </Command>
                            </PopoverContent>
                          </Popover>
                        </motion.div>

                        {/* Link Input */}
                        <motion.div 
                          className="space-y-3"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.4 }}
                        >
                          <Label className="text-sm font-semibold flex items-center gap-2">
                            <LinkIcon className="w-4 h-4 text-primary" />
                            الرابط
                          </Label>
                          <div className="relative">
                            <Input
                              value={link}
                              onChange={(e) => setLink(e.target.value)}
                              placeholder={getLinkPlaceholder()}
                              className="h-14 rounded-xl bg-muted/50 border-2 border-border hover:border-primary/50 focus:border-primary pr-12 transition-all duration-300"
                              dir="ltr"
                            />
                            <div className="absolute right-4 top-1/2 -translate-y-1/2">
                              <Globe className="w-5 h-5 text-muted-foreground" />
                            </div>
                          </div>
                          
                          {/* Social Link Preview */}
                          <SocialLinkPreview url={link} />
                        </motion.div>

                        {/* Quantity Input */}
                        <motion.div 
                          className="space-y-2"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.5 }}
                        >
                          <Label className="text-sm font-semibold flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-primary" />
                            الكمية
                          </Label>
                          <div className="flex items-center gap-3">
                            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={decrementQuantity}
                                disabled={!selectedService}
                                className="h-14 w-14 rounded-xl border-2 shrink-0 hover:bg-destructive/10 hover:border-destructive/50 hover:text-destructive"
                              >
                                <Minus className="w-5 h-5" />
                              </Button>
                            </motion.div>
                            <Input
                              type="number"
                              value={quantity}
                              onChange={(e) => setQuantity(e.target.value)}
                              placeholder="أدخل الكمية"
                              className="h-14 rounded-xl bg-muted/50 border-2 border-border hover:border-primary/50 text-center text-lg font-bold flex-1 transition-all duration-300"
                              dir="ltr"
                            />
                            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={incrementQuantity}
                                disabled={!selectedService}
                                className="h-14 w-14 rounded-xl border-2 shrink-0 hover:bg-green-500/10 hover:border-green-500/50 hover:text-green-500"
                              >
                                <Plus className="w-5 h-5" />
                              </Button>
                            </motion.div>
                          </div>
                          {currentFeatures && (
                            <motion.div 
                              className="flex items-center justify-between text-xs text-muted-foreground bg-muted/30 p-2 rounded-lg"
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                            >
                              <span className="flex items-center gap-1">
                                <Target className="w-3 h-3" />
                                الحد الأدنى: {currentFeatures.min.toLocaleString()}
                              </span>
                              <span className="flex items-center gap-1">
                                <Flame className="w-3 h-3" />
                                الحد الأقصى: {currentFeatures.max.toLocaleString()}
                              </span>
                            </motion.div>
                          )}
                        </motion.div>

                        {/* Price Summary Card */}
                        <motion.div 
                          className="p-5 rounded-2xl bg-gradient-to-br from-primary/5 to-accent/5 border-2 border-primary/20 space-y-4"
                          variants={pulseVariants}
                          animate={totalPrice > 0 ? "pulse" : ""}
                        >
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-muted-foreground flex items-center gap-2">
                              <Award className="w-4 h-4" />
                              السعر / 1000:
                            </span>
                            <span className="font-semibold">{selectedService ? convertToSAR(selectedService.price).toFixed(2) : '0.00'} ر.س</span>
                          </div>
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-muted-foreground flex items-center gap-2">
                              <Eye className="w-4 h-4" />
                              الكمية:
                            </span>
                            <span className="font-semibold">{parseInt(quantity) ? parseInt(quantity).toLocaleString() : 0}</span>
                          </div>
                          <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-lg">الإجمالي:</span>
                            <motion.span 
                              className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent"
                              key={totalPrice}
                              initial={{ scale: 1.2, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                            >
                              {totalPrice.toFixed(2)} ر.س
                            </motion.span>
                          </div>
                          
                          {userBalance && (
                            <div className="flex items-center justify-between text-sm pt-2 border-t border-border/50">
                              <span className="text-muted-foreground">رصيدك الحالي:</span>
                              <span className={cn(
                                "font-bold",
                                userBalance.balance >= totalPrice ? "text-green-500" : "text-destructive"
                              )}>
                                {userBalance.balance.toFixed(2)} ر.س
                              </span>
                            </div>
                          )}
                          
                          {userBalance && userBalance.balance < totalPrice && totalPrice > 0 && (
                            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                              <Button
                                variant="outline"
                                onClick={() => navigate('/dashboard/deposit')}
                                className="w-full gap-2 border-amber-500/50 text-amber-600 hover:bg-amber-500/10 rounded-xl h-12"
                              >
                                <Wallet className="w-4 h-4" />
                                شحن الرصيد الآن
                                <ArrowRight className="w-4 h-4" />
                              </Button>
                            </motion.div>
                          )}
                        </motion.div>

                        {/* Submit Button */}
                        <motion.div 
                          whileHover={{ scale: 1.02 }} 
                          whileTap={{ scale: 0.98 }}
                        >
                          <Button
                            onClick={handleSubmit}
                            disabled={isSubmitting || !selectedService || !link || !quantity || (userBalance && userBalance.balance < totalPrice)}
                            className="w-full h-14 text-lg font-bold rounded-xl gap-3 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 transition-all duration-300 shadow-lg shadow-primary/25"
                          >
                            {isSubmitting ? (
                              <>
                                <Loader2 className="w-6 h-6 animate-spin" />
                                جاري تنفيذ الطلب...
                              </>
                            ) : (
                              <>
                                <CheckCircle2 className="w-6 h-6" />
                                تنفيذ الطلب
                                <motion.div
                                  animate={{ x: [0, 5, 0] }}
                                  transition={{ duration: 1.5, repeat: Infinity }}
                                >
                                  <ArrowLeft className="w-5 h-5" />
                                </motion.div>
                              </>
                            )}
                          </Button>
                        </motion.div>
                      </CardContent>
                    </Card>
                  </motion.div>

                  {/* Service Details Card */}
                  <motion.div variants={cardVariants}>
                    <Card className="border-border/50 bg-card/80 backdrop-blur-sm h-fit lg:sticky lg:top-4 overflow-hidden">
                      <CardHeader className="pb-3 border-b border-border/50">
                        <CardTitle className="text-lg font-bold flex items-center gap-3">
                          <motion.div 
                            className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center"
                            animate={{ rotate: [0, 10, -10, 0] }}
                            transition={{ duration: 3, repeat: Infinity }}
                          >
                            <Info className="w-5 h-5 text-primary" />
                          </motion.div>
                          تفاصيل الخدمة
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-5">
                        <AnimatePresence mode="wait">
                          {selectedService ? (
                            <motion.div 
                              key={selectedService.id}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -20 }}
                              className="space-y-5"
                            >
                              {/* Service Name with Platform Icon */}
                              <motion.div 
                                className="p-4 rounded-xl bg-gradient-to-r from-muted/50 to-muted/30 border border-border"
                                whileHover={{ scale: 1.01 }}
                              >
                                <div className="flex items-start gap-3">
                                  {selectedPlatform && (
                                    <div className={`w-12 h-12 rounded-xl ${selectedPlatform.bgColor} flex items-center justify-center shrink-0`}>
                                      {(() => {
                                        const CustomIcon = (selectedPlatform as any).customIcon;
                                        const Icon = selectedPlatform.icon;
                                        if (CustomIcon) return <div className={selectedPlatform.textColor || "text-white"}><CustomIcon /></div>;
                                        if (Icon) return <Icon className={cn("w-6 h-6", selectedPlatform.textColor || "text-white")} />;
                                        return null;
                                      })()}
                                    </div>
                                  )}
                                  <div>
                                    <h3 className="font-bold text-sm leading-relaxed">{selectedService.name}</h3>
                                    {selectedService.external_service_id && (
                                      <p className="text-xs text-muted-foreground mt-1 font-mono">#{selectedService.external_service_id}</p>
                                    )}
                                  </div>
                                </div>
                              </motion.div>

                              {/* Stats Grid with animations */}
                              <div className="grid grid-cols-2 gap-3">
                                <motion.div 
                                  className="p-4 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 text-center"
                                  whileHover={{ scale: 1.03, y: -2 }}
                                >
                                  <p className="text-xs text-muted-foreground mb-1">السعر / 1000</p>
                                  <p className="text-2xl font-bold text-primary">{convertToSAR(selectedService.price).toFixed(2)}</p>
                                  <p className="text-[10px] text-muted-foreground">ر.س</p>
                                </motion.div>
                                <motion.div 
                                  className="p-4 rounded-xl bg-muted/50 border border-border text-center"
                                  whileHover={{ scale: 1.03, y: -2 }}
                                >
                                  <p className="text-xs text-muted-foreground mb-1">الحد الأدنى</p>
                                  <p className="text-2xl font-bold">{currentFeatures?.min.toLocaleString()}</p>
                                </motion.div>
                                <motion.div 
                                  className="p-4 rounded-xl bg-muted/50 border border-border text-center"
                                  whileHover={{ scale: 1.03, y: -2 }}
                                >
                                  <p className="text-xs text-muted-foreground mb-1">الحد الأقصى</p>
                                  <p className="text-2xl font-bold">{currentFeatures?.max.toLocaleString()}</p>
                                </motion.div>
                                <motion.div 
                                  className="p-4 rounded-xl bg-muted/50 border border-border text-center"
                                  whileHover={{ scale: 1.03, y: -2 }}
                                >
                                  <p className="text-xs text-muted-foreground mb-1">وقت البدء</p>
                                  <div className="flex items-center justify-center gap-1">
                                    <Clock className="w-4 h-4 text-muted-foreground" />
                                    <p className="text-sm font-bold">0-1 ساعة</p>
                                  </div>
                                </motion.div>
                              </div>

                              {/* Speed indicator */}
                              <motion.div 
                                className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20"
                                whileHover={{ scale: 1.02 }}
                              >
                                <motion.div
                                  animate={{ rotate: [0, 360] }}
                                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                                >
                                  <Zap className="w-6 h-6 text-amber-500" />
                                </motion.div>
                                <div>
                                  <p className="text-sm font-bold">سرعة التنفيذ</p>
                                  <p className="text-xs text-muted-foreground">100 - 10K / يوم</p>
                                </div>
                              </motion.div>

                              {/* Badges with animation */}
                              <motion.div 
                                className="flex flex-wrap gap-2"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.3 }}
                              >
                                {(selectedService.refill_enabled || currentFeatures?.refill) && (
                                  <motion.div whileHover={{ scale: 1.05 }}>
                                    <Badge className="bg-green-500/15 text-green-600 border-green-500/30 gap-1.5 px-3 py-1.5">
                                      <RefreshCw className="w-3.5 h-3.5" />
                                      ضمان تعويض
                                    </Badge>
                                  </motion.div>
                                )}
                                {selectedService.refill_days && (
                                  <motion.div whileHover={{ scale: 1.05 }}>
                                    <Badge className="bg-blue-500/15 text-blue-600 border-blue-500/30 gap-1.5 px-3 py-1.5">
                                      <Shield className="w-3.5 h-3.5" />
                                      {selectedService.refill_days} يوم
                                    </Badge>
                                  </motion.div>
                                )}
                                <motion.div whileHover={{ scale: 1.05 }}>
                                  <Badge className="bg-primary/15 text-primary border-primary/30 gap-1.5 px-3 py-1.5">
                                    <Zap className="w-3.5 h-3.5" />
                                    تنفيذ فوري
                                  </Badge>
                                </motion.div>
                              </motion.div>

                              {/* Description */}
                              {selectedService.description && (
                                <motion.div 
                                  className="space-y-2"
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: "auto" }}
                                >
                                  <Label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                                    <FileText className="w-3.5 h-3.5" />
                                    الوصف
                                  </Label>
                                  <ScrollArea className="h-28 rounded-xl border border-border p-4 bg-muted/30">
                                    <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">
                                      {selectedService.description}
                                    </p>
                                  </ScrollArea>
                                </motion.div>
                              )}
                            </motion.div>
                          ) : (
                            <motion.div 
                              key="empty"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              className="text-center py-12"
                            >
                              <motion.div 
                                className="w-20 h-20 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-4"
                                animate={{ 
                                  rotate: [0, 5, -5, 0],
                                  y: [0, -5, 0],
                                }}
                                transition={{ duration: 3, repeat: Infinity }}
                              >
                                <Package className="w-10 h-10 text-muted-foreground" />
                              </motion.div>
                              <p className="text-sm text-muted-foreground font-medium">اختر خدمة لعرض التفاصيل</p>
                              <p className="text-xs text-muted-foreground mt-1">ستظهر هنا جميع معلومات الخدمة</p>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </CardContent>
                    </Card>
                  </motion.div>
                </motion.div>
              </TabsContent>

              {/* Browse Services Tab */}
              <TabsContent value="browse" className="mt-0">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5 }}
                >
                  {/* Search with animation */}
                  <motion.div 
                    className="mb-6"
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                  >
                    <div className="relative">
                      <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        placeholder="ابحث عن خدمة..."
                        value={browseSearchQuery}
                        onChange={(e) => setBrowseSearchQuery(e.target.value)}
                        className="pr-12 h-14 rounded-xl bg-muted/50 border-2 border-border hover:border-primary/50 focus:border-primary text-base transition-all duration-300"
                      />
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <p className="text-sm text-muted-foreground">
                        <span className="font-bold text-foreground">{browseServices.length}</span> خدمة متاحة
                      </p>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="gap-1">
                          <Flame className="w-3 h-3 text-orange-500" />
                          الأكثر طلباً
                        </Badge>
                      </div>
                    </div>
                  </motion.div>

                  {/* Services List */}
                  <motion.div 
                    className="space-y-3"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    {browseServices.length === 0 ? (
                      <motion.div 
                        className="text-center py-16"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                      >
                        <motion.div 
                          className="w-20 h-20 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4"
                          animate={{ rotate: [0, 10, -10, 0] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        >
                          <Search className="w-10 h-10 text-muted-foreground" />
                        </motion.div>
                        <h3 className="text-lg font-bold mb-2">لا توجد خدمات</h3>
                        <p className="text-muted-foreground text-sm">
                          {browseSearchQuery ? "لم يتم العثور على خدمات مطابقة" : "سيتم إضافة الخدمات قريباً"}
                        </p>
                      </motion.div>
                    ) : (
                      browseServices.slice(0, 50).map((service, index) => (
                        <BrowseServiceCard
                          key={service.id}
                          service={service}
                          onOrder={(s) => {
                            handleSelectService(s);
                            setActiveTab("new-order");
                          }}
                          isFavorite={favorites.includes(service.id)}
                          onToggleFavorite={toggleFavorite}
                          parseFeatures={parseFeatures}
                          convertToSAR={convertToSAR}
                          index={index}
                        />
                      ))
                    )}
                    {browseServices.length > 50 && (
                      <motion.p 
                        className="text-center text-sm text-muted-foreground py-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                      >
                        يتم عرض أول 50 خدمة، استخدم البحث لإيجاد المزيد
                      </motion.p>
                    )}
                  </motion.div>
                </motion.div>
              </TabsContent>
            </Tabs>
          </motion.div>
        </div>
      </PullToRefresh>
    </ClientDashboardLayout>
  );
};

export default SocialMediaServices;
