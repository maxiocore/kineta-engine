// Category translation utility for translating provider category names from English to Arabic

const translations: Record<string, string> = {
  // Telegram categories
  'Telegram': 'تيليجرام',
  'Comments': 'تعليقات',
  'Bot Accounts': 'حسابات بوت',
  'Premium Accounts': 'حسابات مميزة',
  'Premium': 'مميز',
  'Vote': 'تصويت',
  'Other': 'أخرى',
  'Invite': 'دعوة',
  'Report': 'إبلاغ',
  'SPAM': 'سبام',
  'TAG': 'إشارة',
  'Members': 'أعضاء',
  'Channel': 'قناة',
  'Group': 'مجموعة',
  'Targeted': 'مستهدف',
  'High Quality': 'جودة عالية',
  'Natural': 'طبيعي',
  'account': 'حساب',
  'accounts': 'حسابات',
  'crypto': 'كريبتو',
  'thematics': 'موضوعات',
  'Marketplace': 'سوق',
  'No Drop': 'بدون نقص',
  'No DROP': 'بدون نقص',
  'Traffic': 'زيارات',
  'Real User': 'مستخدم حقيقي',
  'NEW': 'جديد',
  'Post': 'منشور',
  'Reactions': 'تفاعلات',
  'Future posts': 'منشورات مستقبلية',
  'Positive': 'إيجابية',
  'Share': 'مشاركة',
  'View': 'مشاهدة',
  'Views': 'مشاهدات',
  'Cheapest': 'أرخص',
  'Boost': 'تعزيز',
  'From Search': 'من البحث',
  'Robot': 'روبوت',
  'Bot Start': 'بدء بوت',
  'SEO': 'سيو',
  'Story': 'قصة',
  
  // Instagram
  'Instagram': 'انستقرام',
  'Followers': 'متابعين',
  'Likes': 'إعجابات',
  'Reel': 'ريلز',
  'Reels': 'ريلز',
  'IGTV': 'IGTV',
  'Live': 'بث مباشر',
  'Saves': 'حفظ',
  'Impressions': 'انطباعات',
  'Reach': 'وصول',
  
  // Facebook
  'Facebook': 'فيسبوك',
  'Page': 'صفحة',
  'Profile': 'ملف شخصي',
  'Photo': 'صورة',
  'Video': 'فيديو',
  'Event': 'حدث',
  
  // YouTube
  'YouTube': 'يوتيوب',
  'Youtube': 'يوتيوب',
  'Subscribers': 'مشتركين',
  'Watch': 'مشاهدة',
  'Hours': 'ساعات',
  'Shorts': 'شورتس',
  
  // Twitter / X
  'Twitter': 'تويتر',
  'Retweets': 'إعادة تغريد',
  'Quote': 'اقتباس',
  'Tweet': 'تغريدة',
  'Tweets': 'تغريدات',
  'Poll': 'استطلاع',
  
  // TikTok
  'TikTok': 'تيك توك',
  'Tiktok': 'تيك توك',
  'TIKTOK': 'تيك توك',
  
  // LinkedIn
  'LinkedIn': 'لينكدإن',
  'Linkedin': 'لينكدإن',
  'Connections': 'اتصالات',
  'Endorsements': 'تأييدات',
  'Recommendations': 'توصيات',
  
  // Spotify
  'Spotify': 'سبوتيفاي',
  'Plays': 'تشغيلات',
  'Monthly Listeners': 'مستمعين شهريًا',
  'Playlist': 'قائمة تشغيل',
  
  // SoundCloud
  'SoundCloud': 'ساوند كلاود',
  'Soundcloud': 'ساوند كلاود',
  
  // Snapchat
  'Snapchat': 'سناب شات',
  'Snap': 'سناب',
  
  // Discord
  'Discord': 'ديسكورد',
  'Server': 'سيرفر',
  
  // Twitch
  'Twitch': 'تويتش',
  'Clip': 'كليب',
  
  // Pinterest
  'Pinterest': 'بينتريست',
  'Pins': 'بنات',
  'Boards': 'لوحات',
  
  // Reddit
  'Reddit': 'ريديت',
  'Upvotes': 'تصويتات',
  'Karma': 'كارما',
  
  // Threads
  'Threads': 'ثريدز',
  
  // Google
  'Google': 'جوجل',
  'Reviews': 'مراجعات',
  'Maps': 'خرائط',
  
  // Website
  'Website': 'موقع',
  'Web': 'ويب',
  
  // General
  'Accounts': 'حسابات',
  'Service': 'خدمة',
  'Services': 'خدمات',
  'design': 'تصميم',
  'Design': 'تصميم',
  'development': 'تطوير',
  'Development': 'تطوير',
  'Quality': 'جودة',
  'Fast': 'سريع',
  'Instant': 'فوري',
  'Refill': 'تعويض',
  'REFILL': 'تعويض',
  'Guaranteed': 'مضمون',
  'Lifetime': 'مدى الحياة',
  'Real': 'حقيقي',
  'Active': 'نشط',
  'Cheap': 'رخيص',
  'Best': 'أفضل',
};

export const translateCategory = (category: string): string => {
  if (!category) return category;
  
  let translatedCategory = category;
  
  // Apply translations from longest to shortest to avoid partial replacements
  const sortedTranslations = Object.entries(translations).sort(
    (a, b) => b[0].length - a[0].length
  );
  
  sortedTranslations.forEach(([eng, ar]) => {
    const regex = new RegExp(`\\b${eng}\\b`, 'gi');
    translatedCategory = translatedCategory.replace(regex, ar);
  });
  
  // Clean up extra spaces, emojis and special characters
  translatedCategory = translatedCategory
    .replace(/[❖💥🔥⩥👁️✨💎🌟⭐🚀💫]/g, '')
    .replace(/\s*-\s*/g, ' - ')
    .replace(/\s+/g, ' ')
    .replace(/[\[\]]/g, '')
    .trim();
  
  return translatedCategory || category;
};

export const translateServiceName = (name: string): string => {
  if (!name) return name;
  
  let translatedName = name;
  
  // Apply translations
  const sortedTranslations = Object.entries(translations).sort(
    (a, b) => b[0].length - a[0].length
  );
  
  sortedTranslations.forEach(([eng, ar]) => {
    const regex = new RegExp(`\\b${eng}\\b`, 'gi');
    translatedName = translatedName.replace(regex, ar);
  });
  
  return translatedName;
};
