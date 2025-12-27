-- إنشاء الأقسام الفرعية لتويتر
INSERT INTO categories (name, name_ar, slug, parent_id, icon, color, display_order) VALUES
('Twitter Followers', 'متابعين تويتر', 'twitter-followers', 'e562fb01-d5ae-4579-b2a0-8f4abc10cd2b', 'Users', 'from-blue-400 to-blue-600', 1),
('Twitter Likes', 'لايكات تويتر', 'twitter-likes', 'e562fb01-d5ae-4579-b2a0-8f4abc10cd2b', 'Heart', 'from-red-400 to-red-600', 2),
('Twitter Retweets', 'ريتويت تويتر', 'twitter-retweets', 'e562fb01-d5ae-4579-b2a0-8f4abc10cd2b', 'Repeat', 'from-green-400 to-green-600', 3),
('Twitter Views', 'مشاهدات تويتر', 'twitter-views', 'e562fb01-d5ae-4579-b2a0-8f4abc10cd2b', 'Eye', 'from-purple-400 to-purple-600', 4),
('Twitter Comments', 'تعليقات تويتر', 'twitter-comments', 'e562fb01-d5ae-4579-b2a0-8f4abc10cd2b', 'MessageCircle', 'from-yellow-400 to-yellow-600', 5);

-- إنشاء الأقسام الفرعية لانستقرام
INSERT INTO categories (name, name_ar, slug, parent_id, icon, color, display_order) VALUES
('Instagram Followers', 'متابعين انستقرام', 'instagram-followers', '6242aba4-643c-4d79-b775-fccee46764b0', 'Users', 'from-pink-400 to-pink-600', 1),
('Instagram Likes', 'لايكات انستقرام', 'instagram-likes', '6242aba4-643c-4d79-b775-fccee46764b0', 'Heart', 'from-red-400 to-red-600', 2),
('Instagram Views', 'مشاهدات انستقرام', 'instagram-views', '6242aba4-643c-4d79-b775-fccee46764b0', 'Eye', 'from-purple-400 to-purple-600', 3),
('Instagram Comments', 'تعليقات انستقرام', 'instagram-comments', '6242aba4-643c-4d79-b775-fccee46764b0', 'MessageCircle', 'from-yellow-400 to-yellow-600', 4),
('Instagram Reels', 'ريلز انستقرام', 'instagram-reels', '6242aba4-643c-4d79-b775-fccee46764b0', 'Video', 'from-orange-400 to-orange-600', 5),
('Instagram Story', 'ستوري انستقرام', 'instagram-story', '6242aba4-643c-4d79-b775-fccee46764b0', 'Circle', 'from-blue-400 to-blue-600', 6);

-- إنشاء الأقسام الفرعية ليوتيوب
INSERT INTO categories (name, name_ar, slug, parent_id, icon, color, display_order) VALUES
('Youtube Subscribers', 'مشتركين يوتيوب', 'youtube-subscribers', '39af0597-04b1-431f-8f63-0eb82f7b59fa', 'Users', 'from-red-500 to-red-700', 1),
('Youtube Views', 'مشاهدات يوتيوب', 'youtube-views', '39af0597-04b1-431f-8f63-0eb82f7b59fa', 'Eye', 'from-red-400 to-red-600', 2),
('Youtube Likes', 'لايكات يوتيوب', 'youtube-likes', '39af0597-04b1-431f-8f63-0eb82f7b59fa', 'ThumbsUp', 'from-green-400 to-green-600', 3),
('Youtube Comments', 'تعليقات يوتيوب', 'youtube-comments', '39af0597-04b1-431f-8f63-0eb82f7b59fa', 'MessageCircle', 'from-yellow-400 to-yellow-600', 4),
('Youtube Shorts', 'شورتس يوتيوب', 'youtube-shorts', '39af0597-04b1-431f-8f63-0eb82f7b59fa', 'Video', 'from-orange-400 to-orange-600', 5);

-- إنشاء الأقسام الفرعية لتيك توك
INSERT INTO categories (name, name_ar, slug, parent_id, icon, color, display_order) VALUES
('TikTok Followers', 'متابعين تيك توك', 'tiktok-followers', '59cae1b8-1d21-4c8a-88e1-b0d13207fa9c', 'Users', 'from-black to-gray-800', 1),
('TikTok Likes', 'لايكات تيك توك', 'tiktok-likes', '59cae1b8-1d21-4c8a-88e1-b0d13207fa9c', 'Heart', 'from-red-400 to-pink-600', 2),
('TikTok Views', 'مشاهدات تيك توك', 'tiktok-views', '59cae1b8-1d21-4c8a-88e1-b0d13207fa9c', 'Eye', 'from-purple-400 to-purple-600', 3),
('TikTok Comments', 'تعليقات تيك توك', 'tiktok-comments', '59cae1b8-1d21-4c8a-88e1-b0d13207fa9c', 'MessageCircle', 'from-yellow-400 to-yellow-600', 4),
('TikTok Shares', 'مشاركات تيك توك', 'tiktok-shares', '59cae1b8-1d21-4c8a-88e1-b0d13207fa9c', 'Share2', 'from-blue-400 to-blue-600', 5);

-- إنشاء الأقسام الفرعية لفيسبوك
INSERT INTO categories (name, name_ar, slug, parent_id, icon, color, display_order) VALUES
('Facebook Followers', 'متابعين فيسبوك', 'facebook-followers', '88b2263c-2849-485b-be24-9731afcfe8f7', 'Users', 'from-blue-500 to-blue-700', 1),
('Facebook Likes', 'لايكات فيسبوك', 'facebook-likes', '88b2263c-2849-485b-be24-9731afcfe8f7', 'ThumbsUp', 'from-blue-400 to-blue-600', 2),
('Facebook Views', 'مشاهدات فيسبوك', 'facebook-views', '88b2263c-2849-485b-be24-9731afcfe8f7', 'Eye', 'from-purple-400 to-purple-600', 3),
('Facebook Comments', 'تعليقات فيسبوك', 'facebook-comments', '88b2263c-2849-485b-be24-9731afcfe8f7', 'MessageCircle', 'from-yellow-400 to-yellow-600', 4),
('Facebook Shares', 'مشاركات فيسبوك', 'facebook-shares', '88b2263c-2849-485b-be24-9731afcfe8f7', 'Share2', 'from-green-400 to-green-600', 5);

-- إنشاء الأقسام الفرعية لتليجرام
INSERT INTO categories (name, name_ar, slug, parent_id, icon, color, display_order) VALUES
('Telegram Members', 'أعضاء تليجرام', 'telegram-members', '360e13a1-f91a-407a-b9a6-fe453b1c2ee5', 'Users', 'from-blue-400 to-blue-600', 1),
('Telegram Views', 'مشاهدات تليجرام', 'telegram-views', '360e13a1-f91a-407a-b9a6-fe453b1c2ee5', 'Eye', 'from-purple-400 to-purple-600', 2),
('Telegram Reactions', 'تفاعلات تليجرام', 'telegram-reactions', '360e13a1-f91a-407a-b9a6-fe453b1c2ee5', 'Heart', 'from-red-400 to-red-600', 3);

-- إنشاء الأقسام الفرعية للينكد إن
INSERT INTO categories (name, name_ar, slug, parent_id, icon, color, display_order) VALUES
('LinkedIn Followers', 'متابعين لينكد إن', 'linkedin-followers', 'beb98ca8-036f-4933-9eb0-a37523bbde42', 'Users', 'from-blue-600 to-blue-800', 1),
('LinkedIn Likes', 'لايكات لينكد إن', 'linkedin-likes', 'beb98ca8-036f-4933-9eb0-a37523bbde42', 'ThumbsUp', 'from-blue-400 to-blue-600', 2),
('LinkedIn Comments', 'تعليقات لينكد إن', 'linkedin-comments', 'beb98ca8-036f-4933-9eb0-a37523bbde42', 'MessageCircle', 'from-yellow-400 to-yellow-600', 3);

-- إنشاء الأقسام الفرعية لسبوتيفاي
INSERT INTO categories (name, name_ar, slug, parent_id, icon, color, display_order) VALUES
('Spotify Followers', 'متابعين سبوتيفاي', 'spotify-followers', '0b2246e6-1e19-4413-a8a8-a06dc2f63ebb', 'Users', 'from-green-500 to-green-700', 1),
('Spotify Plays', 'استماعات سبوتيفاي', 'spotify-plays', '0b2246e6-1e19-4413-a8a8-a06dc2f63ebb', 'Play', 'from-green-400 to-green-600', 2),
('Spotify Saves', 'حفظ سبوتيفاي', 'spotify-saves', '0b2246e6-1e19-4413-a8a8-a06dc2f63ebb', 'Bookmark', 'from-green-300 to-green-500', 3);

-- إنشاء الأقسام الفرعية لسناب شات (إذا كان موجود)
INSERT INTO categories (name, name_ar, slug, parent_id, icon, color, display_order) VALUES
('Snapchat Followers', 'متابعين سناب شات', 'snapchat-followers', NULL, 'Users', 'from-yellow-400 to-yellow-600', 1),
('Snapchat Views', 'مشاهدات سناب شات', 'snapchat-views', NULL, 'Eye', 'from-yellow-300 to-yellow-500', 2)
ON CONFLICT DO NOTHING;