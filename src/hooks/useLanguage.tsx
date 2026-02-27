import React, { createContext, useContext, useState, ReactNode } from 'react';

type Lang = 'ar' | 'en';

interface LanguageContextType {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (ar: string, en: string) => string;
  isRtl: boolean;
}

const LanguageContext = createContext<LanguageContextType>({
  lang: 'ar',
  setLang: () => {},
  t: (ar) => ar,
  isRtl: true,
});

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [lang, setLang] = useState<Lang>(() => {
    try {
      return (localStorage.getItem('app-lang') as Lang) || 'ar';
    } catch {
      return 'ar';
    }
  });

  const handleSetLang = (newLang: Lang) => {
    setLang(newLang);
    try { localStorage.setItem('app-lang', newLang); } catch {}
  };

  const t = (ar: string, en: string) => lang === 'ar' ? ar : en;
  const isRtl = lang === 'ar';

  return (
    <LanguageContext.Provider value={{ lang, setLang: handleSetLang, t, isRtl }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
