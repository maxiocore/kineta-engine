# 📋 توثيق مشروع MaxioCore - التوثيق الكامل

> **آخر تحديث:** 2026-02-07  
> **اسم المشروع:** MaxioCore  
> **الشركة:** Ali Saleh Al-Shehri Holding Company  
> **الوصف:** منصة احترافية متكاملة لإدارة خدمات التسويق الرقمي (SMM) وخدمات التطوير والتصميم مع نظام تمويل خدمات داخلي  
> **الرابط المنشور:** https://kineta-engine.lovable.app  

---

## 📑 فهرس المحتويات

1. [نظرة عامة على المشروع](#1-نظرة-عامة-على-المشروع)
2. [المكدس التقني (Tech Stack)](#2-المكدس-التقني)
3. [هيكل المشروع](#3-هيكل-المشروع)
4. [قائمة الصفحات الكاملة](#4-قائمة-الصفحات-الكاملة)
5. [نظام التخطيط (Layouts)](#5-نظام-التخطيط)
6. [نظام المصادقة (Authentication)](#6-نظام-المصادقة)
7. [هيكل قاعدة البيانات](#7-هيكل-قاعدة-البيانات)
8. [نظام التصميم (Design System)](#8-نظام-التصميم)
9. [دعم RTL والعربية](#9-دعم-rtl-والعربية)
10. [التجاوب مع الأجهزة](#10-التجاوب-مع-الأجهزة)
11. [الأيقونات والأنيميشن](#11-الأيقونات-والأنيميشن)
12. [Backend Functions (Edge Functions)](#12-backend-functions)
13. [أنظمة الأعمال الرئيسية](#13-أنظمة-الأعمال-الرئيسية)
14. [نظام الإشعارات](#14-نظام-الإشعارات)
15. [Hooks المخصصة](#15-hooks-المخصصة)
16. [مكتبات الأعمال (Business Logic Libraries)](#16-مكتبات-الأعمال)
17. [الأمان وسياسات RLS](#17-الأمان-وسياسات-rls)
18. [PWA والميزات المتقدمة](#18-pwa-والميزات-المتقدمة)

---

## 1. نظرة عامة على المشروع

MaxioCore هي **منصة SaaS عربية متكاملة** تقدم:

- **خدمات التسويق الرقمي (SMM):** شراء متابعين، لايكات، مشاهدات عبر مزودي API خارجيين
- **خدمات التطوير البرمجي:** طلب مشاريع تطوير برمجية مع نظام إدارة كامل
- **خدمات التصميم:** طلب خدمات تصميم جرافيكي
- **خدمات التسويق:** حملات تسويقية
- **نظام تمويل خدمات:** تمويل غير نقدي - رصيد خدمات داخل المنصة فقط مع عقود وسندات تنفيذية
- **نظام محفظة رقمية:** إيداع رصيد، كاشباك، مكافآت
- **نظام إحالات ومكافآت:** برنامج ولاء متعدد المستويات
- **API عامة:** واجهة برمجية للتكامل الخارجي
- **لوحة إدارة شاملة:** لإدارة جميع جوانب المنصة

---

## 2. المكدس التقني

### Frontend
| التقنية | الاستخدام |
|---------|-----------|
| **React 18** | إطار الواجهة الأمامية |
| **TypeScript** | لغة البرمجة |
| **Vite** | أداة البناء والتطوير |
| **React Router v6** | التوجيه والتنقل |
| **Tailwind CSS** | نظام التنسيق |
| **shadcn/ui** | مكتبة مكونات UI (مبنية على Radix UI) |
| **Framer Motion** | الأنيميشن والحركات |
| **TanStack React Query** | إدارة الحالة الخادمية والتخزين المؤقت |
| **React Hook Form + Zod** | إدارة النماذج والتحقق |
| **Recharts** | الرسوم البيانية |
| **Lucide React** | مكتبة الأيقونات |
| **next-themes** | إدارة الثيم (فاتح/داكن) |
| **date-fns** | معالجة التواريخ |
| **jsPDF + jspdf-autotable** | إنشاء ملفات PDF |
| **html2canvas** | تحويل HTML إلى صور |
| **xlsx** | معالجة ملفات Excel |
| **canvas-confetti** | تأثيرات احتفالية |
| **Sonner** | إشعارات Toast |
| **vaul** | مكون Drawer |
| **cmdk** | Command Palette |
| **Embla Carousel** | Carousel/Slider |
| **vite-plugin-pwa** | تحويل لـ PWA |

### Backend (Lovable Cloud / Supabase)
| التقنية | الاستخدام |
|---------|-----------|
| **Supabase Database (PostgreSQL)** | قاعدة البيانات الرئيسية |
| **Supabase Auth** | المصادقة وإدارة المستخدمين |
| **Supabase Edge Functions (Deno)** | الوظائف الخلفية |
| **Supabase Realtime** | التحديثات اللحظية |
| **Supabase Storage** | تخزين الملفات |
| **Row Level Security (RLS)** | أمان مستوى الصف |

---

## 3. هيكل المشروع

```
src/
├── assets/                    # الأصول الثابتة (صور)
├── components/
│   ├── admin/                 # مكونات لوحة الإدارة
│   │   ├── dashboard/         # ويدجات لوحة المعلومات
│   │   ├── orders/            # إدارة الطلبات
│   │   ├── services/          # إدارة الخدمات
│   │   ├── settings/          # الإعدادات
│   │   └── wallets/           # إدارة المحافظ
│   ├── auth/                  # مكونات المصادقة
│   ├── badges/                # نظام الشارات
│   ├── dashboard/             # مكونات لوحة العميل + layouts
│   ├── eligibility/           # نظام أهلية التمويل
│   ├── financial/             # المركز المالي
│   ├── financing/             # نظام التمويل (v2 + v3)
│   │   ├── acknowledgment/    # إقرارات التمويل
│   │   ├── application/       # طلبات التمويل
│   │   ├── bond/              # السندات التنفيذية
│   │   ├── contract/          # العقود
│   │   ├── eligibility/       # فحص الأهلية
│   │   ├── journey/           # رحلة التمويل
│   │   ├── v2/                # الإصدار الثاني
│   │   └── v3/                # الإصدار الثالث (الحالي)
│   ├── landing/               # مكونات الصفحة الرئيسية
│   ├── offers/                # العروض المميزة
│   ├── orders/                # مكونات الطلبات
│   ├── pwa/                   # مكونات PWA
│   ├── services/              # مكونات الخدمات
│   ├── support/               # نظام الدعم الفني
│   └── ui/                    # مكونات UI الأساسية (shadcn)
├── hooks/                     # React Hooks مخصصة
├── integrations/
│   └── supabase/              # إعدادات Supabase (تلقائية)
├── lib/                       # مكتبات ومنطق الأعمال
│   ├── auth/                  # منطق المصادقة
│   ├── eligibility/           # محرك الأهلية
│   ├── financing/             # نظام التمويل
│   │   ├── events/            # أحداث التمويل
│   │   ├── notifications/     # إشعارات التمويل
│   │   └── stateMachine/      # آلة حالات التمويل (v2)
│   ├── kyc/                   # التحقق من الهوية
│   └── whatsapp/              # خدمات واتساب
├── pages/                     # صفحات التطبيق
│   ├── admin/                 # صفحات لوحة الإدارة
│   ├── auth/                  # صفحات المصادقة
│   ├── dashboard/             # صفحات لوحة العميل
│   └── developers/            # وثائق المطورين
├── types/                     # تعريفات TypeScript
├── App.tsx                    # المكون الجذري + التوجيه
├── main.tsx                   # نقطة الدخول
└── index.css                  # الأنماط العامة

supabase/
└── functions/                 # Edge Functions (50+ وظيفة)
```

---

## 4. قائمة الصفحات الكاملة

### 4.1 الصفحات العامة (Public Pages) - بدون تسجيل دخول

| المسار | الصفحة | الوصف |
|--------|--------|-------|
| `/` | `Index.tsx` | الصفحة الرئيسية (Landing Page) - Hero, خدمات, شهادات, كيف يعمل, FAQ |
| `/services` | `OurServices.tsx` | عرض جميع الخدمات المتاحة |
| `/about` | `About.tsx` | صفحة من نحن |
| `/contact` | `Contact.tsx` | نموذج التواصل |
| `/pricing` | `Pricing.tsx` | الأسعار والباقات |
| `/track-order` | `TrackOrder.tsx` | تتبع الطلب برقم الطلب (بدون تسجيل دخول) |
| `/development-services` | `DevelopmentServices.tsx` | خدمات التطوير البرمجي |
| `/design-services` | `DesignServices.tsx` | خدمات التصميم |
| `/careers` | `Careers.tsx` | صفحة الوظائف |
| `/privacy-policy` | `PrivacyPolicy.tsx` | سياسة الخصوصية |
| `/terms-of-service` | `TermsOfService.tsx` | الشروط والأحكام |
| `/payment-methods` | `PaymentMethods.tsx` | طرق الدفع المقبولة |
| `/payment-policy` | `PaymentPolicy.tsx` | سياسة الدفع |
| `/refund-policy` | `RefundPolicy.tsx` | سياسة الاسترجاع |
| `/financing` | `FinancingInfo.tsx` | معلومات نظام التمويل |
| `/auth` | `Auth.tsx` | تسجيل الدخول / إنشاء حساب |
| `/auth/reset-password` | `ResetPassword.tsx` | إعادة تعيين كلمة المرور |

### 4.2 صفحات المطورين (Developers) - عامة

| المسار | الصفحة | الوصف |
|--------|--------|-------|
| `/developers/getting-started` | `GettingStarted.tsx` | دليل البدء مع API |
| `/developers/api-reference` | `ApiReference.tsx` | مرجع واجهة البرمجة |
| `/developers/examples` | `CodeExamples.tsx` | أمثلة كود |
| `/developers/sdk` | `SdkDownloads.tsx` | تحميل SDKs |

### 4.3 لوحة تحكم العميل (Client Dashboard) - تتطلب تسجيل دخول

| المسار | الصفحة | الوصف |
|--------|--------|-------|
| `/dashboard` | `ClientDashboard.tsx` | نظرة عامة - رصيد، طلبات أخيرة، إحصائيات |
| `/dashboard/orders` | `UnifiedOrders.tsx` | كل الطلبات (SMM + Dev) موحدة |
| `/dashboard/orders/:orderId` | `UnifiedOrderDetails.tsx` | تفاصيل طلب موحد |
| `/dashboard/smm-orders` | `ClientOrders.tsx` | طلبات SMM فقط |
| `/dashboard/smm-orders/:orderId` | `ClientOrderDetails.tsx` | تفاصيل طلب SMM |
| `/dashboard/our-services` | `ClientServicesHome.tsx` | الصفحة الرئيسية للخدمات |
| `/dashboard/services` | `ClientServicesHome.tsx` | نفس الخدمات (alias) |
| `/dashboard/design-services` | `ClientDesignServices.tsx` | خدمات التصميم |
| `/dashboard/design-services/order` | `DesignServiceOrder.tsx` | طلب خدمة تصميم |
| `/dashboard/marketing-services` | `ClientMarketingServices.tsx` | خدمات التسويق |
| `/dashboard/dev-services` | `DevServicesPage.tsx` | خدمات التطوير |
| `/dashboard/dev-services/:slug` | `DevServiceDetails.tsx` | تفاصيل خدمة تطوير |
| `/dashboard/dev-services/order/:serviceId` | `DevOrderWizard.tsx` | معالج طلب تطوير |
| `/dashboard/my-dev-orders` | `MyDevOrders.tsx` | طلبات التطوير الخاصة بي |
| `/dashboard/my-dev-orders/:orderId` | `DevOrderDetails.tsx` | تفاصيل طلب تطوير |
| `/dashboard/favorites` | `ClientFavorites.tsx` | الخدمات المفضلة |
| `/dashboard/deposit` | `ClientDeposit.tsx` | إيداع رصيد |
| `/dashboard/deposits` | `ClientDeposits.tsx` | سجل الإيداعات |
| `/dashboard/balance-logs` | `ClientBalanceLogs.tsx` | سجل حركات الرصيد |
| `/dashboard/financial` | `ClientFinancialHub.tsx` | المركز المالي الشامل |
| `/dashboard/cashback` | `ClientCashback.tsx` | نظام الكاشباك |
| `/dashboard/referrals` | `ClientReferrals.tsx` | نظام الإحالات |
| `/dashboard/badges` | `ClientRewardsHub.tsx` | الشارات والمكافآت |
| `/dashboard/rewards` | `ClientRewardsHub.tsx` | المكافآت (alias) |
| `/dashboard/challenges` | `ClientChallenges.tsx` | التحديات والأهداف |
| `/dashboard/notifications` | `ClientNotifications.tsx` | الإشعارات |
| `/dashboard/notification-setup` | `NotificationOnboarding.tsx` | إعداد الإشعارات |
| `/dashboard/api` | `ClientAPI.tsx` | إدارة مفاتيح API |
| `/dashboard/support` | `ClientSupport.tsx` | الدعم الفني (تذاكر) |
| `/dashboard/settings` | `ClientSettings.tsx` | إعدادات الحساب |
| `/dashboard/verify-email` | `VerifyEmailPage.tsx` | التحقق من البريد |

### 4.4 صفحات التمويل (Financing) - تتطلب تسجيل دخول

| المسار | الصفحة | الوصف |
|--------|--------|-------|
| `/dashboard/financing` | `FinancingV2.tsx` | لوحة التمويل الرئيسية (V3 UI) |
| `/dashboard/financing/guide` | `FinancingGuide.tsx` | دليل التمويل |
| `/dashboard/financing/calculator` | `FinancingCalculator.tsx` | حاسبة التمويل |
| `/dashboard/financing/eligibility` | `FinancingEligibility.tsx` | فحص الأهلية |
| `/dashboard/financing/apply` | `FinancingApply.tsx` | تقديم طلب تمويل |
| `/dashboard/financing/documents/:id` | `FinancingDocuments.tsx` | وثائق الطلب |
| `/dashboard/financing/sign-contract/:id` | `SignContract.tsx` | توقيع العقد |
| `/dashboard/financing/payment` | `FinancingPayment.tsx` | دفع أقساط |
| `/dashboard/financing/payments` | `ClientFinancingPayments.tsx` | سجل الأقساط |
| `/dashboard/financing/status/:id` | `FinancingV2.tsx` | حالة الطلب (يعيد توجيه لـ V2) |

### 4.5 لوحة تحكم الإدارة (Admin Dashboard) - تتطلب صلاحية Admin

| المسار | الصفحة | الوصف |
|--------|--------|-------|
| `/admin/auth` | `AdminAuth.tsx` | تسجيل دخول الأدمن |
| `/admin` | `AdminDashboard.tsx` | لوحة المعلومات - إحصائيات شاملة |
| `/admin/users` | `AdminUsers.tsx` | إدارة المستخدمين |
| `/admin/users/:userId` | `AdminUserProfile.tsx` | ملف مستخدم تفصيلي |
| `/admin/services` | `AdminServices.tsx` | إدارة الخدمات (SMM) |
| `/admin/orders` | `AdminUnifiedOrders.tsx` | الطلبات الموحدة |
| `/admin/orders/:orderId` | `AdminOrderDetails.tsx` | تفاصيل طلب |
| `/admin/smm-orders` | `AdminOrders.tsx` | طلبات SMM |
| `/admin/dev-orders` | `AdminDevOrders.tsx` | طلبات التطوير |
| `/admin/dev-orders/:orderId` | `AdminDevOrderDetails.tsx` | تفاصيل طلب تطوير |
| `/admin/financing` | `AdminFinancingV2.tsx` | إدارة التمويل |
| `/admin/coupons` | `AdminCoupons.tsx` | إدارة الكوبونات |
| `/admin/badges` | `AdminBadges.tsx` | إدارة الشارات |
| `/admin/challenges` | `AdminChallenges.tsx` | إدارة التحديات |
| `/admin/rewards` | `AdminRewards.tsx` | إدارة المكافآت |
| `/admin/rewards-reports` | `AdminRewardsReports.tsx` | تقارير المكافآت |
| `/admin/referrals` | `AdminReferrals.tsx` | إدارة الإحالات |
| `/admin/wallets` | `AdminWallets.tsx` | إدارة المحافظ |
| `/admin/cashback` | `AdminCashback.tsx` | إدارة الكاشباك |
| `/admin/bank-withdrawals` | `AdminBankWithdrawals.tsx` | طلبات السحب البنكي |
| `/admin/financial` | `AdminFinancialHub.tsx` | المركز المالي للأدمن |
| `/admin/payments` | `AdminPaymentsHub.tsx` | مركز المدفوعات |
| `/admin/payment-methods` | `AdminPaymentMethods.tsx` | إدارة طرق الدفع |
| `/admin/tamara-payments` | `AdminTamaraPayments.tsx` | مدفوعات تمارا |
| `/admin/featured-offers` | `AdminFeaturedOffers.tsx` | العروض المميزة |
| `/admin/support` | `AdminSupport.tsx` | إدارة تذاكر الدعم |
| `/admin/contact-messages` | `AdminContactMessages.tsx` | رسائل التواصل |
| `/admin/careers` | `AdminCareers.tsx` | إدارة طلبات التوظيف |
| `/admin/emails` | `AdminEmails.tsx` | نظام البريد والحملات |
| `/admin/notifications` | `AdminNotifications.tsx` | إدارة الإشعارات |
| `/admin/app-notifications` | `AdminAppNotifications.tsx` | إشعارات التطبيق |
| `/admin/logs` | `AdminLogs.tsx` | سجل العمليات (Audit Log) |
| `/admin/reports` | `AdminReports.tsx` | التقارير والتحليلات |
| `/admin/settings` | `AdminSettings.tsx` | إعدادات النظام |
| `/admin/user-settings` | `AdminUserSettings.tsx` | إعدادات المستخدمين |

---

## 5. نظام التخطيط (Layouts)

### 5.1 الصفحات العامة (Landing Pages)
- **Header:** مكون `Header.tsx` في `src/components/landing/` - شريط علوي ثابت يحتوي على شعار MaxioCore، روابط التنقل الرئيسية، زر تسجيل الدخول
- **Footer:** مكون `Footer.tsx` في `src/components/landing/` - تذييل شامل مع روابط سريعة، وسائل التواصل، سياسات
- **لا يوجد Sidebar**

### 5.2 لوحة تحكم العميل (Client Dashboard Layout)
**ملف:** `src/components/dashboard/ClientDashboardLayout.tsx`

```
┌──────────────────────────────────────────────────────┐
│              Mobile Header (lg:hidden)               │
│  [☰ Menu]    MaxioCore    [🔔] [🌙] [↩]             │
├───────────────┬──────────────────────────────────────┤
│               │                                      │
│   Sidebar     │         Main Content                 │
│   (Right)     │                                      │
│   280px       │    {children}                        │
│   Collapsible │                                      │
│   to 72px     │                                      │
│               │                                      │
│  - نظرة عامة   │                                      │
│  - خدماتنا     │                                      │
│  - الطلبات     │                                      │
│  - المفضلة     │                                      │
│  - الإحالات    │                                      │
│  - المركز المالي│                                      │
│  - التمويل     │                                      │
│  - الشارات     │                                      │
│  - التحديات    │                                      │
│  - الإشعارات   │                                      │
│  - API        │                                      │
│  - الدعم      │                                      │
│  - الإعدادات   │                                      │
│               │                                      │
│  ┌──────────┐ │                                      │
│  │ الرصيد    │ │                                      │
│  │ ★★★ ر.س  │ │                                      │
│  └──────────┘ │                                      │
│               │                                      │
│  [User Info]  │                                      │
│  [تسجيل خروج] │                                      │
└───────────────┴──────────────────────────────────────┘
```

**خصائص:**
- Sidebar ثابت على اليمين (RTL) - عرض 280px قابل للطي إلى 72px
- أنيميشن بـ Framer Motion عند الطي/الفتح
- بادجات (عدد) ديناميكية على الطلبات والإشعارات عبر Supabase Realtime
- عرض الرصيد الحقيقي من جدول `user_balances` مع تحديث لحظي
- على الموبايل: Header علوي ثابت + قائمة جانبية منزلقة (Sheet)
- يتم طي الـ Sidebar تلقائياً على أحجام الشاشات بين 1024px و 1280px

### 5.3 لوحة تحكم الإدارة (Admin Dashboard Layout)
**ملف:** `src/components/dashboard/AdminDashboardLayout.tsx`

```
┌──────────────────────────────────────────────────────┐
│              Mobile Header (lg:hidden)               │
│  [☰ Menu]  🛡️ لوحة الأدمن  [🔔] [🌙] [↩]           │
├───────────────┬──────────────────────────────────────┤
│               │                                      │
│  Admin Sidebar│         Main Content                 │
│  (Right) 260px│                                      │
│  Fixed        │    {children}                        │
│               │                                      │
│  🛡️ لوحة الأدمن│                                      │
│  MaxioCore    │                                      │
│               │                                      │
│  [🔔][🌙][↩]  │                                      │
│  [🔍 بحث]     │                                      │
│               │                                      │
│  - نظرة عامة   │                                      │
│  - المستخدمين  │                                      │
│  - الخدمات     │                                      │
│  - الطلبات     │                                      │
│  - الإحالات    │                                      │
│  - المدفوعات   │                                      │
│  - المركز المالي│                                      │
│  - التمويل     │                                      │
│  - الكوبونات   │                                      │
│  - الشارات     │                                      │
│  - التحديات    │                                      │
│  - المكافآت    │                                      │
│  - الدعم الفني │                                      │
│  - رسائل التواصل│                                      │
│  - الإشعارات   │                                      │
│  - البريد      │                                      │
│  - السجلات     │                                      │
│  - التقارير    │                                      │
│  - الإعدادات   │                                      │
│               │                                      │
│  [🛡️ Admin Info]│                                     │
│  [تسجيل خروج]  │                                      │
└───────────────┴──────────────────────────────────────┘
```

**خصائص:**
- Sidebar ثابت غير قابل للطي - 260px
- ألوان مختلفة: تدرج أحمر/برتقالي بدلاً من الأزرق
- بادج إشعارات مع NotificationBell مخصص
- بحث سريع مدمج
- تحديث لحظي عبر Realtime لعدد الطلبات المعلقة وتذاكر الدعم

---

## 6. نظام المصادقة (Authentication)

### 6.1 نظرة عامة
- **المكون الرئيسي:** `src/hooks/useAuth.tsx` (AuthProvider + useAuth hook)
- **المزود:** Supabase Auth (Email/Password)
- **تأكيد البريد:** مطلوب (ليس auto-confirm)
- **لا يوجد تسجيل دخول مجهول (Anonymous)**

### 6.2 تدفق المصادقة

```
المستخدم الجديد:
1. يدخل /auth → نموذج تسجيل (اسم، بريد، هاتف، كلمة مرور)
2. يُرسل رابط تأكيد عبر البريد
3. يضغط الرابط → يتم تأكيد الحساب
4. إشعار WhatsApp/Email للأدمن عن المستخدم الجديد (notifyNewUser)
5. يتم إنشاء profile تلقائياً في جدول profiles

المستخدم المسجل:
1. يدخل /auth → نموذج تسجيل دخول (بريد + كلمة مرور)
2. يتم التحقق من الحساب
3. يتم جلب الملف الشخصي (profiles) + فحص الدور (user_roles)
4. توجيه إلى /dashboard
```

### 6.3 الأدوار (Roles)

| الدور | الجدول | الوصف |
|-------|--------|-------|
| **user** (افتراضي) | لا يحتاج سجل في `user_roles` | مستخدم عادي |
| **admin** | `user_roles` مع `role = 'admin'` | مدير النظام |

### 6.4 حماية الصفحات (Protected Routes)
**ملف:** `src/components/ProtectedRoute.tsx`

```typescript
// استخدام:
<ProtectedRoute>                    // يتطلب تسجيل دخول فقط
  <ClientDashboard />
</ProtectedRoute>

<ProtectedRoute requireAdmin>       // يتطلب تسجيل دخول + دور admin
  <AdminDashboard />
</ProtectedRoute>
```

**السلوك:**
- غير مسجل → توجيه إلى `/auth` (أو `/admin/auth` إذا كان admin route)
- مسجل بدون admin → توجيه إلى `/dashboard` (إذا حاول الوصول لصفحة admin)
- أثناء التحميل → شاشة تحميل مع Spinner

### 6.5 حالات Auth Context

```typescript
interface AuthContextType {
  user: User | null;          // بيانات المستخدم من Supabase Auth
  session: Session | null;    // جلسة المستخدم
  profile: Profile | null;    // بيانات إضافية من جدول profiles
  isAdmin: boolean;           // هل المستخدم admin
  isLoading: boolean;         // هل يتم تحميل البيانات
  isRoleChecked: boolean;     // هل تم فحص الدور
  refetchProfile: () => Promise<void>;
  signUp: (email, password, fullName, phone?) => Promise<{error}>;
  signIn: (email, password) => Promise<{error}>;
  signOut: () => Promise<void>;
}
```

### 6.6 ميزات أمنية إضافية
- **التحقق من البريد بـ OTP:** `useEmailVerification` hook + Edge Function `email-otp`
- **التحقق من الهاتف:** Edge Function `verify-phone` عبر WhatsApp OTP
- **إعادة تعيين كلمة المرور:** صفحة `/auth/reset-password`
- **نسيان كلمة المرور:** `ForgotPasswordModal.tsx`
- **تنبيه تسجيل الدخول:** Edge Function `login-alert` يرسل إشعار عند تسجيل دخول جديد
- **Fraud Prevention:** `useFraudPrevention` hook - كشف الاحتيال
- **Device Fingerprinting:** تسجيل بصمة الجهاز في `device_fingerprints`

---

## 7. هيكل قاعدة البيانات

### 7.1 نظرة عامة
- **عدد الجداول:** 95 جدول
- **RLS:** مفعل على جميع الجداول
- **Realtime:** مفعل على عدة جداول

### 7.2 الجداول حسب النظام

#### 👤 المستخدمين والمصادقة
| الجدول | الوصف | أبرز الأعمدة |
|--------|-------|--------------|
| `profiles` | الملفات الشخصية | id, email, full_name, avatar_url, phone, is_verified, phone_verified |
| `user_roles` | أدوار المستخدمين | user_id, role (enum: admin/user) |
| `user_settings` | إعدادات المستخدم | user_id, notifications_enabled, two_factor_enabled, theme, language |
| `user_balances` | أرصدة المستخدمين | user_id, balance |
| `device_fingerprints` | بصمات الأجهزة | fingerprint_hash, user_id, ip_address, is_blocked, risk_score |

#### 🛒 الخدمات والطلبات (SMM)
| الجدول | الوصف | أبرز الأعمدة |
|--------|-------|--------------|
| `services` | الخدمات المتاحة | name, name_ar, category_id, price, min_quantity, max_quantity, provider_id, status |
| `categories` | تصنيفات الخدمات | name, name_ar, slug, parent_id, icon, color |
| `orders` | طلبات الخدمات | user_id, service_id, quantity, amount, status, link, external_order_id |
| `api_providers` | مزودي API خارجيين | name, api_url, api_key, profit_margin, is_active |
| `refill_requests` | طلبات إعادة التعبئة | order_id, user_id, status |

#### 💻 خدمات التطوير
| الجدول | الوصف | أبرز الأعمدة |
|--------|-------|--------------|
| `dev_services` | خدمات التطوير | title_ar, slug, category, base_price, eta_days_min/max, requirements |
| `dev_orders` | طلبات التطوير | user_id, service_id, order_no, status, project_title, budget_range |
| `dev_order_events` | أحداث الطلب | order_id, event_type, actor_role, message_text |
| `dev_order_files` | ملفات مرفقة | order_id, file_name, file_path |
| `dev_order_invoices` | فواتير | order_id, invoice_number, amount, status |

#### 💰 المالية والمحفظة
| الجدول | الوصف | أبرز الأعمدة |
|--------|-------|--------------|
| `deposits` | إيداعات | user_id, amount, bonus_amount, status, payment_method_id |
| `balance_logs` | حركات الرصيد | user_id, amount, balance_before, balance_after, action_type |
| `payment_methods` | طرق الدفع | name, name_ar, is_active, payment_type |
| `payment_bonuses` | مكافآت الإيداع | min_amount, bonus_percentage, is_active |
| `bank_withdrawal_requests` | طلبات سحب بنكي | user_id, amount, iban, bank_name, status |
| `tamara_payments` | مدفوعات تمارا | user_id, order_id, amount, status |
| `paylink_payments` | مدفوعات PayLink | user_id, amount, status, transaction_id |

#### 🏦 نظام التمويل
| الجدول | الوصف | أبرز الأعمدة |
|--------|-------|--------------|
| `financing_applications` | طلبات التمويل | user_id, application_number, full_name, national_id, phone, requested_amount, approved_amount, status, workflow_status |
| `financing_plans` | خطط التمويل | name, amount, installments, interest_rate, is_active |
| `financing_contracts` | العقود | application_id, contract_number, contract_data, status, signed_at |
| `financing_contract_documents` | وثائق العقود | application_id, contract_number, pdf_url, status |
| `financing_contract_events` | أحداث العقود | contract_id, event_type, old_status, new_status |
| `financing_acknowledgments` | الإقرارات | application_id, acknowledgment_number, status, signed_at |
| `financing_executive_bonds` | السندات التنفيذية | application_id, bond_number, amount, status |
| `executive_bond_events` | أحداث السندات | bond_id, event_type, from_status, to_status |
| `financing_installments` | الأقساط | application_id, installment_number, amount, due_date, status |
| `financing_installment_payments` | مدفوعات الأقساط | installment_id, amount, payment_method |
| `financing_activity_log` | سجل نشاط التمويل | application_id, event_type, from_status, to_status |
| `financing_admin_audit` | تدقيق الأدمن | admin_id, application_id, action_type, reason |
| `financing_deposit_ledger` | دفتر إيداعات التمويل | application_id, amount, status |
| `financing_service_credits` | رصيد خدمات التمويل | application_id, user_id, total_amount, used_amount, remaining_amount |
| `financing_credit_transactions` | حركات رصيد الخدمات | credit_id, amount, transaction_type |
| `contract_signing_otps` | OTPs توقيع العقود | application_id, otp_hash, phone, status |
| `eligibility_audit_logs` | سجل تدقيق الأهلية | session_id, step_name, status, risk_signals |

#### 🎁 المكافآت والولاء
| الجدول | الوصف | أبرز الأعمدة |
|--------|-------|--------------|
| `badges` | الشارات | name, name_ar, icon, color, min_orders, min_spending, tier |
| `user_badges` | شارات المستخدمين | user_id, badge_id, earned_at |
| `reward_points` | نقاط المكافآت | user_id, points, lifetime_points |
| `points_transactions` | حركات النقاط | user_id, amount, type, description |
| `reward_tiers` | مستويات المكافآت | name, min_points, points_multiplier |
| `challenges` | التحديات | title, target_value, reward_points, challenge_type |
| `user_challenges` | تحديات المستخدمين | user_id, challenge_id, progress, is_completed |
| `cashback_settings` | إعدادات الكاشباك | cashback_percentage, min_deposit_amount |
| `cashback_transactions` | حركات الكاشباك | user_id, amount, type |
| `referral_codes` | أكواد الإحالة | user_id, code, uses_count |
| `referral_rewards` | مكافآت الإحالة | referrer_id, referred_id, reward_amount, status |
| `coupons` | الكوبونات | code, discount_type, discount_value, is_active |
| `coupon_usages` | استخدامات الكوبونات | coupon_id, user_id, order_id |

#### 🔔 الإشعارات والتواصل
| الجدول | الوصف | أبرز الأعمدة |
|--------|-------|--------------|
| `notifications` | إشعارات المستخدمين | user_id, title, message, type, is_read |
| `admin_notifications` | إشعارات الأدمن | title, message, type, is_read |
| `app_notifications` | إشعارات التطبيق (عامة) | title, message, target_audience, type |
| `user_notification_reads` | قراءات الإشعارات | user_id, notification_id |
| `push_subscriptions` | اشتراكات Push | user_id, endpoint, p256dh, auth |
| `contact_messages` | رسائل التواصل | name, email, phone, message, status |

#### 📧 البريد الإلكتروني
| الجدول | الوصف | أبرز الأعمدة |
|--------|-------|--------------|
| `emails` | الرسائل المرسلة | recipient_email, subject, content, status |
| `email_templates` | قوالب البريد | name, subject, content, type |
| `email_campaigns` | الحملات البريدية | name, subject, target_audience, status |
| `email_verifications` | تحقق البريد | email, otp_hash, status, purpose |
| `email_verification_attempts` | محاولات التحقق | verification_id, attempt_number, is_success |
| `email_rate_limits` | حدود الإرسال | email_address, email_count |

#### 🎯 العروض والمحتوى
| الجدول | الوصف | أبرز الأعمدة |
|--------|-------|--------------|
| `featured_offers` | العروض المميزة | title, title_ar, service_id, offer_price, discount_percentage |
| `favorite_services` | الخدمات المفضلة | user_id, service_id |

#### 🎓 التوظيف
| الجدول | الوصف | أبرز الأعمدة |
|--------|-------|--------------|
| `career_applications` | طلبات التوظيف | name, email, phone, position, resume_url |
| `career_positions` | الوظائف المتاحة | title, department, type, is_active |

#### 🔐 الأمان والتدقيق
| الجدول | الوصف | أبرز الأعمدة |
|--------|-------|--------------|
| `audit_logs` | سجل التدقيق العام | action, table_name, user_id, ip_address, risk_level |
| `api_keys` | مفاتيح API | user_id, key_hash, prefix, is_active |
| `api_usage_logs` | سجل استخدام API | api_key_id, endpoint, method, status_code |
| `disposable_email_domains` | نطاقات بريد مؤقتة (محظورة) | domain |
| `whatsapp_templates` | قوالب واتساب | name, template_id, language |

#### ⚙️ إعدادات النظام
| الجدول | الوصف | أبرز الأعمدة |
|--------|-------|--------------|
| `system_settings` | إعدادات عامة | key, value, category |
| `maintenance_schedule` | جدول الصيانة | start_time, end_time, is_active, message |

### 7.3 العلاقات الرئيسية

```
profiles.id ←── user_roles.user_id
profiles.id ←── user_balances.user_id
profiles.id ←── orders.user_id
profiles.id ←── financing_applications.user_id

categories.id ←── services.category_id
categories.id ←── categories.parent_id (self-reference)
api_providers.id ←── services.provider_id

services.id ←── orders.service_id
services.id ←── featured_offers.service_id

orders.id ←── refill_requests.order_id

financing_applications.id ←── financing_contracts.application_id
financing_applications.id ←── financing_acknowledgments.application_id
financing_applications.id ←── financing_executive_bonds.application_id
financing_applications.id ←── financing_installments.application_id
financing_applications.id ←── financing_activity_log.application_id
financing_applications.id ←── financing_service_credits.application_id
financing_applications.plan_id ──→ financing_plans.id

financing_installments.id ←── financing_installment_payments.installment_id
financing_executive_bonds.id ←── executive_bond_events.bond_id
financing_contracts.id ←── financing_contract_events.contract_id

dev_services.id ←── dev_orders.service_id
dev_orders.id ←── dev_order_events.order_id
dev_orders.id ←── dev_order_files.order_id
dev_orders.id ←── dev_order_invoices.order_id

email_templates.id ←── email_campaigns.template_id
badges.id ←── user_badges.badge_id
challenges.id ←── user_challenges.challenge_id
coupons.id ←── coupon_usages.coupon_id
api_keys.id ←── api_usage_logs.api_key_id
```

---

## 8. نظام التصميم (Design System)

### 8.1 الخط
- **الخط الرئيسي:** `IBM Plex Sans Arabic` (يدعم العربية بالكامل)
- **الأوزان المستخدمة:** 300 (Light), 400 (Regular), 500 (Medium), 600 (SemiBold), 700 (Bold)
- **مصدر الخط:** Google Fonts

### 8.2 نظام الألوان (Design Tokens)

```css
/* الوضع الفاتح (Light Mode) */
--background: 210 20% 98%;        /* خلفية عامة */
--foreground: 222 47% 11%;        /* نص أساسي */
--card: 0 0% 100%;                /* خلفية البطاقات */
--primary: 200 98% 39%;           /* اللون الأساسي (أزرق/سماوي) */
--secondary: 210 40% 96%;         /* ثانوي */
--muted: 210 40% 96%;             /* مصمت */
--accent: 217 91% 60%;            /* لون مميز */
--destructive: 0 84% 60%;         /* أحمر/خطر */
--success: 152 76% 36%;           /* أخضر/نجاح */
--warning: 38 92% 50%;            /* أصفر/تحذير */
--brand: 200 98% 39%;             /* لون العلامة */
--brand-light: 188 94% 43%;       /* فاتح */
--brand-dark: 210 98% 45%;        /* داكن */

/* الوضع الداكن (Dark Mode) - نفس المتغيرات بقيم مختلفة */
--background: 222 47% 6%;
--primary: 200 98% 50%;
/* ... إلخ */
```

### 8.3 التدرجات (Gradients)
```css
--gradient-primary: linear-gradient(135deg, primary → accent);
--gradient-brand: linear-gradient(135deg, brand-light → brand → accent);
--gradient-hero: linear-gradient(180deg, background → secondary);
--gradient-card: linear-gradient(145deg, card → card-alt);
--gradient-glow: radial-gradient(ellipse, primary/0.12 → transparent);
--gradient-mesh: multi-layer radial gradients;
```

### 8.4 الظلال (Shadows)
```css
--shadow-xs → --shadow-2xl (7 مستويات)
--shadow-glow: توهج بلون primary
--shadow-brand: ظل مميز
--shadow-card: ظل البطاقات
--shadow-elevated: ظل مرتفع
```

### 8.5 Utility Classes الإضافية
- `.glass` / `.glass-strong` / `.glass-subtle` - تأثيرات زجاجية
- `.card-elevated` / `.card-interactive` - بطاقات محسنة
- `.btn-brand` - زر مميز بتدرج
- `.badge-premium` - شارة مميزة
- `.text-gradient` / `.text-gradient-brand` - نص متدرج
- `.bg-gradient-*` - خلفيات متدرجة
- `.bg-grid` / `.bg-dots` - أنماط خلفية
- `.status-pending/progress/completed/cancelled` - ألوان حالات
- `.stat-glow-*` - توهج إحصائيات

### 8.6 وضع الثيم (Theme)
- **المكتبة:** `next-themes`
- **الافتراضي:** Dark mode
- **التبديل:** مكون `ThemeToggle.tsx` موجود في كل Layout
- **التطبيق:** `<ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>`

---

## 9. دعم RTL والعربية

### 9.1 الإعداد الأساسي
```css
html { direction: rtl; }
body {
  direction: rtl;
  text-align: right;
  unicode-bidi: embed;
}
```

### 9.2 فئات RTL المخصصة
| الفئة | الوصف |
|-------|-------|
| `.admin-rtl` | RTL خاص بلوحة الإدارة |
| `.bidi-isolate-ltr` | عزل نص LTR (أرقام، روابط) |
| `.bidi-isolate-rtl` | عزل نص RTL |
| `.bidi-number` / `.rtl-number` | منع عكس الأرقام |
| `.rtl-currency` | تنسيق العملة |
| `.rtl-flip` | قلب الأيقونات الاتجاهية |
| `.progress-rtl` | شريط تقدم من اليمين |
| `.ms-auto` / `.me-auto` | هوامش منطقية (logical) |
| `.ps-4` / `.pe-4` | حشو منطقي |
| `.text-start` / `.text-end` | محاذاة منطقية |
| `.rounded-s-lg` / `.rounded-e-lg` | حواف منطقية |

### 9.3 معالجة النصوص المختلطة
- استخدام `unicode-bidi: isolate` للنصوص الإنجليزية داخل السياق العربي
- فصل الأرقام والروابط عن الاتجاه العربي
- مكون `rtl-utils.tsx` في `src/components/ui/`

### 9.4 معالجة المكونات في RTL
- Forms: حقول الإدخال تبدأ من اليمين
- Tables: رؤوس وخلايا الجداول محاذاة لليمين
- Select/Dropdown: نص من اليمين، سهم من اليسار
- Progress bars: تبدأ من اليمين
- Steppers: التقدم من اليمين لليسار
- Sidebars: تظهر على اليمين

---

## 10. التجاوب مع الأجهزة

### 10.1 نقاط الكسر (Breakpoints)
```javascript
'xs': '475px',    // إضافي - أجهزة صغيرة جداً
'sm': '640px',    // Tailwind الافتراضي
'md': '768px',    // أجهزة لوحية
'lg': '1024px',   // سطح المكتب
'xl': '1280px',   // شاشات كبيرة
'2xl': '1400px',  // شاشات كبيرة جداً (container max-width)
```

### 10.2 استراتيجية التجاوب

- **Mobile First:** تصميم للموبايل أولاً ثم التوسع
- **Container:** `max-width: 1400px` مع `padding: 1.5rem`

### 10.3 سلوك اللايوت حسب الجهاز

| الجهاز | Sidebar | Header | ملاحظات |
|--------|---------|--------|---------|
| **موبايل** (< 1024px) | مخفي → Sheet منزلق | ثابت علوي 14h (56px) | قائمة هامبرجر |
| **تابلت** (1024-1280px) | مطوي (72px) | لا يوجد | أيقونات فقط |
| **سطح المكتب** (> 1280px) | مفتوح (280px) | لا يوجد | كامل مع النصوص |

### 10.4 Utility Classes للتجاوب
```css
.table-responsive    /* جدول قابل للتمرير أفقياً */
.mobile-grid         /* شبكة متجاوبة */
.hide-mobile         /* إخفاء على الموبايل */
.hide-desktop        /* إخفاء على سطح المكتب */
.text-responsive     /* نص متجاوب sm→base */
.text-responsive-lg  /* نص كبير متجاوب */
.text-responsive-xl  /* نص أكبر متجاوب */
.p-responsive        /* حشو متجاوب */
.flex-responsive     /* flex عمودي→أفقي */
```

### 10.5 Hook الموبايل
```typescript
// src/hooks/use-mobile.tsx
const isMobile = useIsMobile(); // يكشف إذا كانت الشاشة < 768px
```

---

## 11. الأيقونات والأنيميشن

### 11.1 مكتبة الأيقونات
- **المكتبة الرئيسية:** `lucide-react` (v0.462.0)
- **عدد الأيقونات المستخدمة:** 100+ أيقونة
- **مكون LazyIcon:** `src/components/ui/lazy-icon.tsx` لتحميل الأيقونات بشكل كسول

### 11.2 أنيميشن (Framer Motion)
| الأنيميشن | الاستخدام |
|-----------|-----------|
| `fade-in` | ظهور عناصر تدريجي |
| `fade-in-up` | ظهور مع حركة للأعلى |
| `fade-in-down` | ظهور مع حركة للأسفل |
| `slide-in-left` / `slide-in-right` | انزلاق جانبي |
| `slide-in-rtl` / `slide-out-rtl` | انزلاق RTL |
| `scale-in` | تكبير تدريجي |
| `scale-up` | نبض تكبير |
| `float` | طفو (حركة عمودية بطيئة) |
| `pulse-soft` | نبض خفيف |
| `bounce-soft` | ارتداد خفيف |
| `wiggle` | اهتزاز |
| `spin-slow` | دوران بطيء (12s) |
| `shimmer` | تأثير لمعان |
| `glow-pulse` | توهج نابض |
| `gradient-shift` | تحريك التدرج |

### 11.3 تأثيرات Framer Motion في المكونات
- **Sidebar:** أنيميشن فتح/إغلاق مع spring physics
- **Nav Items:** staggered animation عند التحميل
- **Cards:** hover scale + translateY
- **Mobile Menu:** slide from right مع spring
- **Page Transitions:** Suspense + PageLoader
- **Icons:** hover rotate wiggle
- **Active Indicator:** layoutId animation بين عناصر القائمة
- **Balance Card:** shimmer effect متكرر
- **Confetti:** `canvas-confetti` للاحتفالات

### 11.4 تأثيرات CSS إضافية
- `.icon-hover` - تكبير + توهج عند hover
- `.icon-bounce` / `.icon-pulse` / `.icon-float` - حركات متكررة
- `.noise-texture` - تأثير نسيج بصري
- `.perspective-1000` - تأثير 3D
- `.custom-scrollbar` - شريط تمرير مخصص

---

## 12. Backend Functions (Edge Functions)

### 12.1 قائمة الوظائف (50+ وظيفة)

#### المصادقة والإشعارات
| الوظيفة | الوصف |
|---------|-------|
| `admin-notify` | إرسال إشعار للأدمن |
| `auth-notify` | إشعار عند أحداث المصادقة |
| `login-alert` | تنبيه تسجيل الدخول |
| `send-welcome-email` | بريد ترحيبي |

#### البريد الإلكتروني
| الوظيفة | الوصف |
|---------|-------|
| `send-email` | إرسال بريد عام |
| `email-otp` | إرسال OTP بالبريد |
| `verify-email` | التحقق من البريد |
| `send-app-notification` | إشعارات التطبيق |

#### المدفوعات
| الوظيفة | الوصف |
|---------|-------|
| `paylink-payment` | تكامل PayLink |
| `tamara-payment` | تكامل Tamara (تقسيط) |
| `notify-deposit-success` | إشعار نجاح الإيداع |
| `notify-balance-change` | إشعار تغيير الرصيد |
| `wallet-internal-transfer` | تحويل داخلي |
| `get-exchange-rate` | سعر الصرف |

#### الطلبات
| الوظيفة | الوصف |
|---------|-------|
| `provider-order` | إرسال طلب لمزود API |
| `track-order` | تتبع حالة الطلب |
| `sync-orders-status` | مزامنة حالات الطلبات |
| `get-order-provider-status` | حالة الطلب من المزود |
| `notify-order-status` | إشعار تغيير حالة طلب |

#### التمويل
| الوظيفة | الوصف |
|---------|-------|
| `eligibility-evaluate` | تقييم الأهلية |
| `financing-activity-log` | تسجيل نشاط التمويل |
| `financing-bond-notification` | إشعار السند التنفيذي |
| `financing-completion-notify` | إشعار اكتمال التمويل |
| `financing-credit-deposit` | إيداع رصيد خدمات |
| `financing-installment-paid` | إشعار دفع قسط |
| `financing-reconciliation` | تسوية مالية |
| `financing-status-email` | بريد حالة التمويل |
| `generate-acknowledgment-pdf` | إنشاء PDF إقرار |
| `generate-contract-pdf` | إنشاء PDF عقد |
| `contract-signing-otp` | OTP لتوقيع العقد |
| `executive-bond-workflow` | سير عمل السند التنفيذي |

#### التواصل
| الوظيفة | الوصف |
|---------|-------|
| `whatsapp-notify` | إشعار واتساب |
| `whatsapp-otp` | OTP عبر واتساب |
| `whatsapp-send` | إرسال رسالة واتساب |
| `sms-notify` | إشعار SMS |
| `unified-notification` | إشعار موحد (متعدد القنوات) |
| `contact-form` | معالجة نموذج التواصل |
| `career-notification` | إشعار طلب وظيفة |
| `notify-ticket-update` | إشعار تحديث تذكرة |

#### KYC والتحقق
| الوظيفة | الوصف |
|---------|-------|
| `kyc-document` | التحقق من وثائق الهوية |
| `kyc-facematch` | مطابقة الوجه |
| `kyc-liveness` | فحص حيوية الوجه |
| `verify-phone` | التحقق من الهاتف |

#### أخرى
| الوظيفة | الوصف |
|---------|-------|
| `user-api` | واجهة API العامة |
| `translate-service` | ترجمة خدمة |
| `social-oembed` | استخراج بيانات وسائط اجتماعية |
| `digitalocean-api` | تكامل DigitalOcean |
| `weekly-admin-report` | تقرير أسبوعي |
| `check-maintenance-schedule` | فحص جدول الصيانة |

---

## 13. أنظمة الأعمال الرئيسية

### 13.1 نظام الطلبات (SMM Orders)

```
العميل يختار خدمة → يحدد الكمية والرابط → يتم خصم الرصيد →
يُرسل للمزود الخارجي عبر API → يتم تتبع الحالة تلقائياً →
إشعار عند الاكتمال/الفشل
```

**الحالات:**
`pending` → `processing` → `in_progress` → `completed` / `cancelled` / `partial` / `refunded`

### 13.2 نظام التمويل (Financing System V2)

**⚠️ تنبيه مهم:** التمويل **غير نقدي** - رصيد خدمات داخل المنصة فقط

```
فحص أهلية → تقديم طلب → مراجعة الأدمن →
إعداد العرض (خطة + مبلغ) → إرسال العقد → توقيع العقد (OTP) →
إنشاء السند التنفيذي → توقيع السند →
إرسال الإقرار → توقيع الإقرار →
إيداع رصيد الخدمات → إنشاء أقساط → متابعة السداد
```

**آلة الحالات (State Machine V2):**
```
src/lib/financing/stateMachine/v2/
├── types.ts              # أنواع الحالات والانتقالات
├── applicationStates.ts  # تعريف كل حالة ومرحلتها
├── transitions.ts        # قواعد الانتقال بين الحالات
├── adminActions.ts       # إجراءات الأدمن المتاحة لكل حالة
├── validator.ts          # التحقق من صحة الانتقالات
├── bondStates.ts         # حالات السند التنفيذي
├── timeline.ts           # الجدول الزمني
└── index.ts              # التصدير
```

**المراحل:**
1. **submission** - تقديم الطلب
2. **review** - المراجعة
3. **offer** - العرض والعقد
4. **execution** - التنفيذ (سند + إقرار)
5. **active** - نشط (أقساط)
6. **completion** - اكتمال

### 13.3 نظام المحفظة والرصيد

```
إيداع (Deposit) → مكافأة إيداع (Bonus) → رصيد المحفظة →
استخدام في طلبات / سحب بنكي
```

- **جدول الرصيد:** `user_balances` (رصيد واحد لكل مستخدم)
- **سجل الحركات:** `balance_logs` (كل عملية مسجلة)
- **طرق الإيداع:** PayLink, Tamara, تحويل بنكي
- **كاشباك:** نسبة مئوية تلقائية على الإيداعات

### 13.4 نظام المكافآت والولاء

- **النقاط:** يكسب نقاط عند كل طلب وإيداع
- **الشارات:** تُمنح تلقائياً حسب عدد الطلبات والإنفاق
- **المستويات (Tiers):** مستويات ولاء بمضاعفات نقاط مختلفة
- **التحديات:** أهداف يومية/أسبوعية/شهرية مع مكافآت
- **الإحالات:** رابط إحالة فريد + مكافآت للطرفين
- **الكوبونات:** خصومات نسبية أو ثابتة

### 13.5 نظام الأهلية (Eligibility)

```
src/lib/eligibility/
├── stateMachine.ts          # آلة حالات الأهلية
├── decisionEngine.ts        # محرك القرار
├── advancedDecisionEngine.ts # محرك متقدم
├── employmentVerification.ts # التحقق من الوظيفة
├── fraudPrevention.ts       # كشف الاحتيال
├── config.ts                # إعدادات
└── types.ts                 # الأنواع
```

**الخطوات:**
1. المعلومات الشخصية (هوية، عنوان)
2. معلومات التوظيف
3. المعلومات المالية
4. التحقق من الهوية (KYC)
5. القرار النهائي

### 13.6 نظام الدعم الفني

- **تذاكر الدعم:** `support_tickets` + `support_messages`
- **الحالات:** `open` → `in_progress` → `resolved` / `closed`
- **إشعارات:** واتساب + بريد عند تحديث التذكرة

### 13.7 نظام API العامة

- **مفاتيح API:** إنشاء وإدارة من لوحة العميل
- **التوثيق:** صفحات المطورين العامة
- **Rate Limiting:** حدود استخدام
- **Endpoints:** طلبات خدمات، تتبع، رصيد

---

## 14. نظام الإشعارات

### 14.1 قنوات الإشعارات
1. **إشعارات داخلية (In-App):** جدول `notifications` + Bell في الـ Header
2. **بريد إلكتروني:** عبر Edge Functions
3. **واتساب:** عبر Edge Functions (قوالب مخصصة)
4. **SMS:** عبر Edge Functions
5. **Push Notifications:** PWA Push عبر `push_subscriptions`
6. **إشعارات موحدة:** `unified-notification` Edge Function تجمع عدة قنوات

### 14.2 مكونات PWA
- `NotificationListener.tsx` - يستمع للإشعارات
- `NotificationPermissionPrompt.tsx` - يطلب إذن الإشعارات
- `InAppNotification.tsx` - عرض إشعارات داخل التطبيق
- `usePushNotifications.tsx` - Hook لإدارة Push

---

## 15. Hooks المخصصة

| Hook | الملف | الوصف |
|------|-------|-------|
| `useAuth` | `useAuth.tsx` | المصادقة والأدوار |
| `useIsMobile` | `use-mobile.tsx` | كشف الموبايل |
| `useToast` | `use-toast.ts` | رسائل Toast |
| `useAuditLogger` | `useAuditLogger.tsx` | تسجيل التدقيق |
| `useAuditLogs` | `useAuditLogs.tsx` | قراءة سجل التدقيق |
| `useChallenges` | `useChallenges.tsx` | نظام التحديات |
| `useContractApproval` | `useContractApproval.tsx` | الموافقة على العقد |
| `useEligibilityGate` | `useEligibilityGate.tsx` | بوابة الأهلية |
| `useEligibilityMachine` | `useEligibilityMachine.tsx` | آلة حالات الأهلية |
| `useEmailVerification` | `useEmailVerification.tsx` | التحقق من البريد |
| `useExchangeRate` | `useExchangeRate.tsx` | سعر الصرف |
| `useFavorites` | `useFavorites.tsx` | المفضلة |
| `useFinancingEligibility` | `useFinancingEligibility.tsx` | أهلية التمويل |
| `useFraudPrevention` | `useFraudPrevention.tsx` | كشف الاحتيال |
| `useInfiniteScroll` | `useInfiniteScroll.ts` | تمرير لانهائي |
| `useKYCVerification` | `useKYCVerification.tsx` | التحقق من الهوية |
| `useMaintenanceMode` | `useMaintenanceMode.tsx` | وضع الصيانة |
| `useMonthlyAchievements` | `useMonthlyAchievements.tsx` | إنجازات شهرية |
| `usePWAInstall` | `usePWAInstall.tsx` | تثبيت PWA |
| `usePushNotifications` | `usePushNotifications.tsx` | إشعارات Push |
| `useReferral` | `useReferral.tsx` | نظام الإحالات |
| `useRewardPoints` | `useRewardPoints.tsx` | نقاط المكافآت |
| `useServerContractPdf` | `useServerContractPdf.ts` | PDF العقود |
| `useServiceCredit` | `useServiceCredit.ts` | رصيد خدمات التمويل |
| `useSupportSystem` | `useSupportSystem.tsx` | نظام الدعم |
| `useSystemSettings` | `useSystemSettings.tsx` | إعدادات النظام |
| `useUnifiedOrders` | `useUnifiedOrders.tsx` | الطلبات الموحدة |
| `useUserBadges` | `useUserBadges.tsx` | شارات المستخدم |
| `useUserSettings` | `useUserSettings.tsx` | إعدادات المستخدم |

---

## 16. مكتبات الأعمال (Business Logic Libraries)

### `src/lib/`

| الملف/المجلد | الوصف |
|--------------|-------|
| `utils.ts` | أدوات عامة (cn, formatters) |
| `adminNotifyService.ts` | إشعار الأدمن عبر Edge Function |
| `emailService.ts` | خدمة البريد الإلكتروني |
| `pdfTemplates.ts` | قوالب PDF عامة |
| `billOfExchangePdf.ts` | إنشاء PDF الكمبيالة |

### `src/lib/financing/`

| الملف | الوصف |
|-------|-------|
| `contractPdfGenerator.ts` | إنشاء عقد PDF |
| `serverContractPdf.ts` | إنشاء PDF من الخادم |
| `contractService.ts` | خدمات العقود |
| `legalContractContent.ts` | محتوى العقد القانوني |
| `serviceFinancingContract.ts` | عقد تمويل الخدمات |
| `serviceFinancingPolicy.ts` | سياسة تمويل الخدمات |
| `eligibilityContract.ts` | عقد الأهلية |
| `serviceCreditService.ts` | خدمة رصيد الخدمات |
| `journeyConfig.ts` | إعداد رحلة التمويل |
| `arabicPdfUtils.ts` | أدوات PDF عربية |
| `emailService.ts` | بريد التمويل |

### `src/lib/eligibility/`
- محرك قرار الأهلية المتقدم
- آلة حالات الفحص
- كشف الاحتيال
- التحقق من التوظيف

### `src/lib/kyc/`
- خدمات التحقق من الهوية (KYC)
- مطابقة الوجه
- فحص حيوية

### `src/lib/whatsapp/`
- تكامل واتساب
- قوالب الرسائل

---

## 17. الأمان وسياسات RLS

### 17.1 سياسة RLS العامة
- **كل جدول** عليه RLS مفعل
- **المستخدم العادي:** يرى فقط بياناته (user_id = auth.uid())
- **الأدمن:** يرى كل شيء عبر `has_role(auth.uid(), 'admin'::app_role)`
- **بيانات عامة:** بعض الجداول لها قراءة عامة (services, categories, badges)

### 17.2 أمثلة على السياسات

```sql
-- المستخدم يقرأ طلباته فقط
CREATE POLICY "Users view own orders"
ON orders FOR SELECT
USING (user_id = auth.uid());

-- الأدمن يدير كل شيء
CREATE POLICY "Admins manage all orders"
ON orders FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- أي شخص يقرأ الخدمات النشطة
CREATE POLICY "Anyone can view active services"
ON services FOR SELECT
USING (status = 'active');
```

### 17.3 ميزات أمنية
- **Audit Logging:** تسجيل كل العمليات الحساسة
- **Device Fingerprinting:** تتبع الأجهزة
- **IP Tracking:** تسجيل عناوين IP
- **Rate Limiting:** حدود على البريد والعمليات
- **Fraud Detection:** كشف الأنماط المشبوهة
- **OTP Verification:** تحقق ثنائي للعمليات الحساسة
- **Contract Signing Security:** OTP + IP + User Agent + Device Info

---

## 18. PWA والميزات المتقدمة

### 18.1 PWA (Progressive Web App)
- **Plugin:** `vite-plugin-pwa`
- **Push Notifications:** عبر Service Worker
- **Install Prompt:** مكون تثبيت مخصص
- **Offline Support:** أساسي

### 18.2 Realtime Features
- تحديث فوري لعدد الطلبات والإشعارات في الـ Sidebar
- تحديث لحظي للرصيد
- إشعارات فورية عند تغيير حالة الطلبات/التذاكر

### 18.3 ميزات متقدمة أخرى
- **Lazy Loading:** جميع الصفحات محملة بـ `React.lazy` + `Suspense`
- **Virtualized Lists:** `@tanstack/react-virtual` للقوائم الطويلة
- **Infinite Scroll:** `useInfiniteScroll` hook
- **Drag & Drop:** `@dnd-kit` لترتيب العناصر
- **Excel Export:** `xlsx` لتصدير البيانات
- **PDF Generation:** `jsPDF` لإنشاء المستندات
- **Maintenance Mode:** وضع صيانة مع MaintenanceGuard

### 18.4 Query Configuration
```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,      // 5 دقائق
      gcTime: 1000 * 60 * 30,         // 30 دقيقة
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});
```

### 18.5 Provider Hierarchy
```
BrowserRouter
  └── QueryClientProvider
      └── ThemeProvider (defaultTheme="dark")
          └── AuthProvider
              └── MaintenanceProvider
                  └── TooltipProvider
                      └── MaintenanceGuard
                          └── Suspense (PageLoader)
                              └── Routes
```

---

## 📌 ملاحظات مهمة للنقل

1. **قاعدة البيانات:** يجب نقل جميع الجداول (95 جدول) مع سياسات RLS والـ Triggers والـ Functions
2. **Edge Functions:** يجب نقل جميع الـ 50+ Edge Function مع أسرارها (Secrets)
3. **Storage:** يجب نقل ملفات التخزين (عقود، وثائق، صور)
4. **Auth:** يجب نقل بيانات المستخدمين مع كلمات المرور المشفرة
5. **Environment Variables:** يجب إعداد المتغيرات البيئية (API keys, WhatsApp tokens, إلخ)
6. **DNS:** تحديث الروابط والدومين
7. **الثيم الافتراضي:** Dark Mode
8. **اللغة الافتراضية:** العربية (RTL)

---

> تم إنشاء هذا التوثيق تلقائياً في 2026-02-07
> المشروع: MaxioCore by Ali Saleh Al-Shehri Holding Company
