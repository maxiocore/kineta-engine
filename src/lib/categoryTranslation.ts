// Category translation utility for translating provider category names from English to Arabic

const translations: Record<string, string> = {
  // Telegram categories
  'Telegram': 'تيليجرام',
  'Comments': 'تعليقات',
  'Comment': 'تعليق',
  'Bot Accounts': 'حسابات بوت',
  'Premium Accounts': 'حسابات مميزة',
  'Premium': 'مميز',
  'Vote': 'تصويت',
  'Votes': 'تصويتات',
  'Other': 'أخرى',
  'Invite': 'دعوة',
  'Report': 'إبلاغ',
  'SPAM': 'سبام',
  'TAG': 'إشارة',
  'Members': 'أعضاء',
  'Member': 'عضو',
  'Channel': 'قناة',
  'Channels': 'قنوات',
  'Group': 'مجموعة',
  'Groups': 'مجموعات',
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
  'New': 'جديد',
  'Post': 'منشور',
  'Posts': 'منشورات',
  'Reactions': 'تفاعلات',
  'Reaction': 'تفاعل',
  'Future posts': 'منشورات مستقبلية',
  'Positive': 'إيجابية',
  'Negative': 'سلبية',
  'Share': 'مشاركة',
  'Shares': 'مشاركات',
  'View': 'مشاهدة',
  'Views': 'مشاهدات',
  'Cheapest': 'أرخص',
  'Boost': 'تعزيز',
  'From Search': 'من البحث',
  'Robot': 'روبوت',
  'Bot Start': 'بدء بوت',
  'Bot': 'بوت',
  'SEO': 'سيو',
  'Story': 'قصة',
  'Stories': 'قصص',
  'High Ou': 'جودة عالية',
  'High Out': 'جودة عالية',
  'Speed': 'سرعة',
  'Slow': 'بطيء',
  'Medium': 'متوسط',
  'Min': 'الحد الأدنى',
  'Max': 'الحد الأقصى',
  
  // Instagram
  'Instagram': 'انستقرام',
  'Followers': 'متابعين',
  'Follower': 'متابع',
  'Likes': 'إعجابات',
  'Like': 'إعجاب',
  'Reel': 'ريلز',
  'Reels': 'ريلز',
  'IGTV': 'IGTV',
  'Live': 'بث مباشر',
  'Saves': 'حفظ',
  'Save': 'حفظ',
  'Impressions': 'انطباعات',
  'Reach': 'وصول',
  
  // Facebook
  'Facebook': 'فيسبوك',
  'FB': 'فيسبوك',
  'Page': 'صفحة',
  'Pages': 'صفحات',
  'Profile': 'ملف شخصي',
  'Profiles': 'ملفات شخصية',
  'Photo': 'صورة',
  'Photos': 'صور',
  'Video': 'فيديو',
  'Videos': 'فيديوهات',
  'Event': 'حدث',
  'Events': 'أحداث',
  
  // YouTube
  'YouTube': 'يوتيوب',
  'Youtube': 'يوتيوب',
  'YOUTUBE': 'يوتيوب',
  'Subscribers': 'مشتركين',
  'Subscriber': 'مشترك',
  'Watch': 'مشاهدة',
  'Hours': 'ساعات',
  'Hour': 'ساعة',
  'Shorts': 'شورتس',
  'Short': 'شورت',
  
  // Twitter / X
  'Twitter': 'تويتر',
  'X': 'إكس',
  'Retweets': 'إعادة تغريد',
  'Retweet': 'إعادة تغريد',
  'Quote': 'اقتباس',
  'Quotes': 'اقتباسات',
  'Tweet': 'تغريدة',
  'Tweets': 'تغريدات',
  'Poll': 'استطلاع',
  'Polls': 'استطلاعات',
  
  // TikTok
  'TikTok': 'تيك توك',
  'Tiktok': 'تيك توك',
  'TIKTOK': 'تيك توك',
  
  // LinkedIn
  'LinkedIn': 'لينكدإن',
  'Linkedin': 'لينكدإن',
  'LINKEDIN': 'لينكدإن',
  'Connections': 'اتصالات',
  'Connection': 'اتصال',
  'Endorsements': 'تأييدات',
  'Endorsement': 'تأييد',
  'Recommendations': 'توصيات',
  'Recommendation': 'توصية',
  
  // Spotify
  'Spotify': 'سبوتيفاي',
  'SPOTIFY': 'سبوتيفاي',
  'Plays': 'تشغيلات',
  'Play': 'تشغيل',
  'Monthly Listeners': 'مستمعين شهريًا',
  'Playlist': 'قائمة تشغيل',
  'Playlists': 'قوائم تشغيل',
  
  // SoundCloud
  'SoundCloud': 'ساوند كلاود',
  'Soundcloud': 'ساوند كلاود',
  'SOUNDCLOUD': 'ساوند كلاود',
  
  // Snapchat
  'Snapchat': 'سناب شات',
  'SNAPCHAT': 'سناب شات',
  'Snap': 'سناب',
  
  // Discord
  'Discord': 'ديسكورد',
  'DISCORD': 'ديسكورد',
  'Server': 'سيرفر',
  'Servers': 'سيرفرات',
  
  // Twitch
  'Twitch': 'تويتش',
  'TWITCH': 'تويتش',
  'Clip': 'كليب',
  'Clips': 'كليبات',
  
  // Pinterest
  'Pinterest': 'بينتريست',
  'PINTEREST': 'بينتريست',
  'Pins': 'بنات',
  'Pin': 'بن',
  'Boards': 'لوحات',
  'Board': 'لوحة',
  
  // Reddit
  'Reddit': 'ريديت',
  'REDDIT': 'ريديت',
  'Upvotes': 'تصويتات',
  'Upvote': 'تصويت',
  'Karma': 'كارما',
  
  // Threads
  'Threads': 'ثريدز',
  'THREADS': 'ثريدز',
  
  // Google
  'Google': 'جوجل',
  'GOOGLE': 'جوجل',
  'Reviews': 'مراجعات',
  'Review': 'مراجعة',
  'Maps': 'خرائط',
  'Map': 'خريطة',
  
  // Website
  'Website': 'موقع',
  'Websites': 'مواقع',
  'Web': 'ويب',
  
  // Vkontakte / VK
  'VK': 'فكونتاكتي',
  'Vkontakte': 'فكونتاكتي',
  'VKontakte': 'فكونتاكتي',
  
  // Clubhouse
  'Clubhouse': 'كلوب هاوس',
  
  // Mixcloud
  'Mixcloud': 'ميكس كلاود',
  
  // Dailymotion
  'Dailymotion': 'ديلي موشن',
  
  // Vimeo
  'Vimeo': 'فيميو',
  
  // Tumblr
  'Tumblr': 'تمبلر',
  
  // WhatsApp
  'WhatsApp': 'واتساب',
  'Whatsapp': 'واتساب',
  
  // General
  'Accounts': 'حسابات',
  'Account': 'حساب',
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
  'Package': 'باقة',
  'Packages': 'باقات',
  'Random': 'عشوائي',
  'Custom': 'مخصص',
  'Female': 'أنثى',
  'Male': 'ذكر',
  'Mixed': 'مختلط',
  'Worldwide': 'عالمي',
  'World': 'عالم',
  'Arab': 'عربي',
  'Arabic': 'عربي',
  'USA': 'أمريكا',
  'UK': 'بريطانيا',
  'Europe': 'أوروبا',
  'Asia': 'آسيا',
  'Middle East': 'الشرق الأوسط',
  'Saudi': 'سعودي',
  'Saudi Arabia': 'السعودية',
  'UAE': 'الإمارات',
  'Egypt': 'مصر',
  'Kuwait': 'الكويت',
  'Qatar': 'قطر',
  'Bahrain': 'البحرين',
  'Oman': 'عُمان',
  'Jordan': 'الأردن',
  'Lebanon': 'لبنان',
  'Morocco': 'المغرب',
  'Algeria': 'الجزائر',
  'Tunisia': 'تونس',
  'Iraq': 'العراق',
  'Syria': 'سوريا',
  'Palestine': 'فلسطين',
  'Libya': 'ليبيا',
  'Sudan': 'السودان',
  'Yemen': 'اليمن',
  'Turkey': 'تركيا',
  'India': 'الهند',
  'Pakistan': 'باكستان',
  'Bangladesh': 'بنغلاديش',
  'Indonesia': 'إندونيسيا',
  'Malaysia': 'ماليزيا',
  'Philippines': 'الفلبين',
  'Brazil': 'البرازيل',
  'Mexico': 'المكسيك',
  'Germany': 'ألمانيا',
  'France': 'فرنسا',
  'Italy': 'إيطاليا',
  'Spain': 'إسبانيا',
  'Russia': 'روسيا',
  'China': 'الصين',
  'Japan': 'اليابان',
  'Korea': 'كوريا',
  'Australia': 'أستراليا',
  'Canada': 'كندا',
  'Nigeria': 'نيجيريا',
  'South Africa': 'جنوب أفريقيا',
  'GCC': 'دول الخليج',
  'MENA': 'الشرق الأوسط وشمال أفريقيا',
  'Drip Feed': 'تغذية تدريجية',
  'Drip-Feed': 'تغذية تدريجية',
  'Start': 'بدء',
  'Cancel': 'إلغاء',
  'Auto': 'تلقائي',
  'Manual': 'يدوي',
  'Verified': 'موثق',
  'Unverified': 'غير موثق',
  'Public': 'عام',
  'Private': 'خاص',
  'Open': 'مفتوح',
  'Closed': 'مغلق',
  'Online': 'متصل',
  'Offline': 'غير متصل',
  'Days': 'أيام',
  'Day': 'يوم',
  'Week': 'أسبوع',
  'Weeks': 'أسابيع',
  'Month': 'شهر',
  'Months': 'شهور',
  'Year': 'سنة',
  'Years': 'سنوات',
  'Forever': 'للأبد',
  'Permanent': 'دائم',
  'Temporary': 'مؤقت',
  'Limited': 'محدود',
  'Unlimited': 'غير محدود',
  'Basic': 'أساسي',
  'Standard': 'قياسي',
  'Pro': 'محترف',
  'VIP': 'VIP',
  'Gold': 'ذهبي',
  'Silver': 'فضي',
  'Bronze': 'برونزي',
  'Diamond': 'ماسي',
  'Platinum': 'بلاتيني',
  'Super': 'سوبر',
  'Ultra': 'ألترا',
  'Mega': 'ميغا',
  'Plus': 'بلس',
  'Extra': 'إكسترا',
  'Special': 'مميز',
  'Exclusive': 'حصري',
  'Hot': 'ساخن',
  'Trending': 'رائج',
  'Popular': 'شائع',
  'Top': 'أعلى',
  'Affordable': 'بأسعار معقولة',
  'Budget': 'اقتصادي',
  'Economy': 'اقتصادي',
  'Starter': 'مبتدئ',
  'Beginner': 'مبتدئ',
  'Advanced': 'متقدم',
  'Expert': 'خبير',
  'Master': 'ماستر',
  'Elite': 'نخبة',
  'Only': 'فقط',
  'Per': 'لكل',
  'Per K': 'لكل ألف',
  'K': 'ألف',
  '1000': '1000',
  'Emoji': 'إيموجي',
  'Emojis': 'إيموجيز',
  'Text': 'نص',
  'Link': 'رابط',
  'Links': 'روابط',
  'URL': 'رابط',
  'Username': 'اسم مستخدم',
  'Usernames': 'أسماء مستخدمين',
  'Email': 'بريد إلكتروني',
  'Emails': 'بريد إلكتروني',
  'Phone': 'هاتف',
  'Number': 'رقم',
  'Numbers': 'أرقام',
  'Code': 'كود',
  'Codes': 'أكواد',
  'Token': 'توكن',
  'Tokens': 'توكنات',
  'API': 'API',
  'Key': 'مفتاح',
  'Keys': 'مفاتيح',
  'ID': 'معرف',
  'IDs': 'معرفات',
  'UID': 'معرف',
  'UIDs': 'معرفات',
  'PID': 'معرف',
  'SID': 'معرف',
  'CID': 'معرف',
  'OTP': 'رمز تحقق',
  '2FA': 'مصادقة ثنائية',
  'CAPTCHA': 'كابتشا',
  'reCAPTCHA': 'ريكابتشا',
  'SMS': 'رسالة نصية',
  'SMM': 'تسويق اجتماعي',
  'SEM': 'تسويق محركات البحث',
  'PPC': 'الدفع لكل نقرة',
  'CPC': 'تكلفة النقرة',
  'CPM': 'تكلفة الألف',
  'CPA': 'تكلفة الاكتساب',
  'CTR': 'نسبة النقر',
  'ROI': 'عائد الاستثمار',
  'KPI': 'مؤشر أداء',
  'HQ': 'جودة عالية',
  'LQ': 'جودة منخفضة',
  'MQ': 'جودة متوسطة',
  'HR': 'دقة عالية',
  'HD': 'عالي الدقة',
  'SD': 'دقة قياسية',
  'UHD': 'فائق الدقة',
  '4K': '4K',
  '8K': '8K',
  '1080p': '1080p',
  '720p': '720p',
  '480p': '480p',
  '360p': '360p',
  '240p': '240p',
  '144p': '144p',
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
