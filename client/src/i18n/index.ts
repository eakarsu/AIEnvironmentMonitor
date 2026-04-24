import React, { createContext, useContext, useState } from 'react';
import en from './en';

type Translations = typeof en;

interface I18nContextType {
  t: Translations;
  language: string;
  setLanguage: (lang: string) => void;
}

const translations: Record<string, Translations> = { en };

export const I18nContext = createContext<I18nContextType>({
  t: en,
  language: 'en',
  setLanguage: () => {},
});

export const useI18n = () => useContext(I18nContext);

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState(localStorage.getItem('language') || 'en');

  const handleSetLanguage = (lang: string) => {
    setLanguage(lang);
    localStorage.setItem('language', lang);
  };

  const t = translations[language] || en;

  return React.createElement(
    I18nContext.Provider,
    { value: { t, language, setLanguage: handleSetLanguage } },
    children
  );
};
