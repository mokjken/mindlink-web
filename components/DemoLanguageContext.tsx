import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

export type DemoLanguage = 'zh' | 'en';

type DemoLanguageContextValue = {
  isDemo: boolean;
  language: DemoLanguage;
  setLanguage: (language: DemoLanguage) => void;
};

const DemoLanguageContext = createContext<DemoLanguageContextValue>({
  isDemo: false,
  language: 'zh',
  setLanguage: () => {}
});

const STORAGE_KEY = 'mindlink_demo_language';

export const DemoLanguageProvider: React.FC<{
  isDemo: boolean;
  children: React.ReactNode;
}> = ({ isDemo, children }) => {
  const [language, setLanguage] = useState<DemoLanguage>(() => {
    if (typeof window === 'undefined') return 'zh';
    const saved = window.localStorage.getItem(STORAGE_KEY);
    return saved === 'en' ? 'en' : 'zh';
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (isDemo) {
      window.localStorage.setItem(STORAGE_KEY, language);
    }
  }, [isDemo, language]);

  const value = useMemo(
    () => ({
      isDemo,
      language: isDemo ? language : 'zh',
      setLanguage
    }),
    [isDemo, language]
  );

  return (
    <DemoLanguageContext.Provider value={value}>
      {children}
    </DemoLanguageContext.Provider>
  );
};

export const useDemoLanguage = () => useContext(DemoLanguageContext);

export const useDemoI18n = () => {
  const context = useDemoLanguage();
  const isEnglish = context.isDemo && context.language === 'en';

  return {
    ...context,
    isEnglish,
    t: (zh: string, en: string) => (isEnglish ? en : zh)
  };
};
