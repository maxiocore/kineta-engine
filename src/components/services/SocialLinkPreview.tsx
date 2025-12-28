import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, User, Globe, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';

interface SocialLinkPreviewProps {
  url: string;
  onValidation?: (isValid: boolean, platform: string | null, username: string | null) => void;
}

interface PlatformInfo {
  name: string;
  nameAr: string;
  color: string;
  icon: string;
  patterns: RegExp[];
  extractUsername: (url: string) => string | null;
  supportsOEmbed: boolean;
}

interface OEmbedData {
  title?: string;
  author_name?: string;
  author_url?: string;
  thumbnail_url?: string;
  provider_name?: string;
}

const platforms: Record<string, PlatformInfo> = {
  instagram: {
    name: 'Instagram',
    nameAr: 'انستقرام',
    color: 'from-purple-500 via-pink-500 to-orange-500',
    icon: '📸',
    patterns: [
      /instagram\.com\/([^/?]+)/i,
      /instagr\.am\/([^/?]+)/i,
    ],
    extractUsername: (url: string) => {
      const match = url.match(/instagram\.com\/(?:p\/|reel\/|stories\/)?([^/?]+)/i) ||
                    url.match(/instagr\.am\/([^/?]+)/i);
      if (match && !['p', 'reel', 'stories', 'explore', 'direct'].includes(match[1])) {
        return match[1];
      }
      return null;
    },
    supportsOEmbed: false
  },
  tiktok: {
    name: 'TikTok',
    nameAr: 'تيك توك',
    color: 'from-black via-gray-800 to-pink-500',
    icon: '🎵',
    patterns: [
      /tiktok\.com\/@([^/?]+)/i,
      /tiktok\.com\/([^/?]+)/i,
    ],
    extractUsername: (url: string) => {
      const match = url.match(/tiktok\.com\/@([^/?]+)/i);
      return match ? match[1] : null;
    },
    supportsOEmbed: true
  },
  youtube: {
    name: 'YouTube',
    nameAr: 'يوتيوب',
    color: 'from-red-600 to-red-700',
    icon: '▶️',
    patterns: [
      /youtube\.com\/(c\/|channel\/|@)?([^/?]+)/i,
      /youtu\.be\/([^/?]+)/i,
    ],
    extractUsername: (url: string) => {
      const channelMatch = url.match(/youtube\.com\/(?:c\/|channel\/|@)([^/?]+)/i);
      if (channelMatch) return channelMatch[1];
      
      const videoMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&/?]+)/i);
      if (videoMatch) return `video: ${videoMatch[1]}`;
      
      return null;
    },
    supportsOEmbed: true
  },
  twitter: {
    name: 'X (Twitter)',
    nameAr: 'إكس (تويتر)',
    color: 'from-black to-gray-800',
    icon: '𝕏',
    patterns: [
      /twitter\.com\/([^/?]+)/i,
      /x\.com\/([^/?]+)/i,
    ],
    extractUsername: (url: string) => {
      const match = url.match(/(?:twitter|x)\.com\/([^/?]+)/i);
      if (match && !['home', 'explore', 'search', 'messages', 'notifications', 'i'].includes(match[1])) {
        return match[1];
      }
      return null;
    },
    supportsOEmbed: true
  },
  facebook: {
    name: 'Facebook',
    nameAr: 'فيسبوك',
    color: 'from-blue-600 to-blue-700',
    icon: '👤',
    patterns: [
      /facebook\.com\/([^/?]+)/i,
      /fb\.com\/([^/?]+)/i,
    ],
    extractUsername: (url: string) => {
      const match = url.match(/(?:facebook|fb)\.com\/(?:profile\.php\?id=)?([^/?&]+)/i);
      if (match && !['watch', 'marketplace', 'groups', 'gaming', 'events'].includes(match[1])) {
        return match[1];
      }
      return null;
    },
    supportsOEmbed: false
  },
  snapchat: {
    name: 'Snapchat',
    nameAr: 'سناب شات',
    color: 'from-yellow-400 to-yellow-500',
    icon: '👻',
    patterns: [
      /snapchat\.com\/add\/([^/?]+)/i,
    ],
    extractUsername: (url: string) => {
      const match = url.match(/snapchat\.com\/add\/([^/?]+)/i);
      return match ? match[1] : null;
    },
    supportsOEmbed: false
  },
  telegram: {
    name: 'Telegram',
    nameAr: 'تيليجرام',
    color: 'from-blue-400 to-blue-500',
    icon: '✈️',
    patterns: [
      /t\.me\/([^/?]+)/i,
      /telegram\.me\/([^/?]+)/i,
    ],
    extractUsername: (url: string) => {
      const match = url.match(/(?:t\.me|telegram\.me)\/([^/?]+)/i);
      return match ? match[1] : null;
    },
    supportsOEmbed: false
  },
  twitch: {
    name: 'Twitch',
    nameAr: 'تويتش',
    color: 'from-purple-600 to-purple-700',
    icon: '🎮',
    patterns: [
      /twitch\.tv\/([^/?]+)/i,
    ],
    extractUsername: (url: string) => {
      const match = url.match(/twitch\.tv\/([^/?]+)/i);
      if (match && !['directory', 'downloads', 'jobs'].includes(match[1])) {
        return match[1];
      }
      return null;
    },
    supportsOEmbed: false
  },
  spotify: {
    name: 'Spotify',
    nameAr: 'سبوتيفاي',
    color: 'from-green-500 to-green-600',
    icon: '🎧',
    patterns: [
      /open\.spotify\.com\/(?:user|artist|playlist)\/([^/?]+)/i,
    ],
    extractUsername: (url: string) => {
      const match = url.match(/open\.spotify\.com\/(user|artist|playlist)\/([^/?]+)/i);
      return match ? `${match[1]}: ${match[2]}` : null;
    },
    supportsOEmbed: false
  },
  threads: {
    name: 'Threads',
    nameAr: 'ثريدز',
    color: 'from-black to-gray-700',
    icon: '🧵',
    patterns: [
      /threads\.net\/@([^/?]+)/i,
    ],
    extractUsername: (url: string) => {
      const match = url.match(/threads\.net\/@([^/?]+)/i);
      return match ? match[1] : null;
    },
    supportsOEmbed: false
  },
};

const detectPlatform = (url: string): { platform: PlatformInfo | null; username: string | null; platformKey: string | null } => {
  for (const [key, platform] of Object.entries(platforms)) {
    for (const pattern of platform.patterns) {
      if (pattern.test(url)) {
        const username = platform.extractUsername(url);
        return { platform, username, platformKey: key };
      }
    }
  }
  return { platform: null, username: null, platformKey: null };
};

export const SocialLinkPreview = ({ url, onValidation }: SocialLinkPreviewProps) => {
  const [result, setResult] = useState<{
    platform: PlatformInfo | null;
    username: string | null;
    isValid: boolean;
    oembedData: OEmbedData | null;
    loading: boolean;
  }>({ platform: null, username: null, isValid: false, oembedData: null, loading: false });

  const fetchOEmbedData = useCallback(async (processedUrl: string, platform: PlatformInfo) => {
    if (!platform.supportsOEmbed) return null;
    
    try {
      const { data, error } = await supabase.functions.invoke('social-oembed', {
        body: { url: processedUrl }
      });
      
      if (error) {
        console.error('oEmbed fetch error:', error);
        return null;
      }
      
      if (data?.success) {
        return {
          title: data.title,
          author_name: data.author_name,
          author_url: data.author_url,
          thumbnail_url: data.thumbnail_url,
          provider_name: data.provider_name,
        } as OEmbedData;
      }
      return null;
    } catch (error) {
      console.error('oEmbed error:', error);
      return null;
    }
  }, []);

  useEffect(() => {
    if (!url || url.trim().length < 5) {
      setResult({ platform: null, username: null, isValid: false, oembedData: null, loading: false });
      onValidation?.(false, null, null);
      return;
    }

    // Add https if missing for better parsing
    let processedUrl = url.trim();
    if (!processedUrl.startsWith('http://') && !processedUrl.startsWith('https://')) {
      processedUrl = 'https://' + processedUrl;
    }

    const { platform, username, platformKey } = detectPlatform(processedUrl);
    const isValid = platform !== null && username !== null;
    
    setResult(prev => ({ ...prev, platform, username, isValid, loading: platform?.supportsOEmbed || false }));
    onValidation?.(isValid, platformKey, username);

    // Fetch oEmbed data for supported platforms
    if (platform?.supportsOEmbed && isValid) {
      fetchOEmbedData(processedUrl, platform).then(oembedData => {
        setResult(prev => ({ ...prev, oembedData, loading: false }));
      });
    }
  }, [url, onValidation, fetchOEmbedData]);

  if (!url || url.trim().length < 5) {
    return null;
  }

  return (
    <AnimatePresence mode="wait">
      {result.platform && result.username ? (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          <Card className="overflow-hidden border-0 shadow-lg">
            <div className={`h-2 bg-gradient-to-r ${result.platform.color}`} />
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                {/* Platform Icon / Thumbnail */}
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${result.platform.color} flex items-center justify-center text-2xl shadow-md overflow-hidden`}>
                  {result.loading ? (
                    <Loader2 className="w-6 h-6 text-white animate-spin" />
                  ) : result.oembedData?.thumbnail_url ? (
                    <img 
                      src={result.oembedData.thumbnail_url} 
                      alt={result.oembedData.author_name || result.username || ''} 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.parentElement!.innerHTML = result.platform?.icon || '📱';
                      }}
                    />
                  ) : (
                    result.platform.icon
                  )}
                </div>

                {/* Account Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="secondary" className="text-xs">
                      {result.platform.nameAr}
                    </Badge>
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    {result.platform.supportsOEmbed && (
                      <Badge variant="outline" className="text-xs text-green-600 border-green-300">
                        بيانات مباشرة
                      </Badge>
                    )}
                  </div>
                  
                  {/* Author Name from oEmbed */}
                  {result.oembedData?.author_name && (
                    <p className="text-sm font-medium text-foreground truncate mb-0.5">
                      {result.oembedData.author_name}
                    </p>
                  )}
                  
                  {/* Title from oEmbed */}
                  {result.oembedData?.title && (
                    <p className="text-xs text-muted-foreground truncate mb-1">
                      {result.oembedData.title.length > 50 
                        ? result.oembedData.title.substring(0, 50) + '...' 
                        : result.oembedData.title}
                    </p>
                  )}
                  
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <span className="font-semibold text-foreground truncate" dir="ltr">
                      @{result.username}
                    </span>
                  </div>
                </div>

                {/* External Link */}
                <a
                  href={url.startsWith('http') ? url : `https://${url}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg hover:bg-muted transition-colors"
                >
                  <ExternalLink className="w-5 h-5 text-muted-foreground" />
                </a>
              </div>

              {/* Additional Info */}
              <div className="mt-3 pt-3 border-t border-border/50">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Globe className="w-3 h-3" />
                  <span>سيتم تنفيذ الخدمة على هذا الحساب</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ) : url.length > 10 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 dark:bg-amber-950/30 p-3 rounded-lg"
        >
          <AlertCircle className="w-4 h-4" />
          <span>لم نتمكن من التعرف على المنصة. تأكد من صحة الرابط.</span>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
};
