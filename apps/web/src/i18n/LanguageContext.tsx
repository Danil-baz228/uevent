import {
  ReactNode,
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { Language, TranslationDictionary, translations, translateCategory } from './translations';

type LanguageContextValue = {
  language: Language;
  locale: string;
  copy: TranslationDictionary;
  setLanguage: (language: Language) => void;
  translateCategory: (category: string) => string;
};

const STORAGE_KEY = 'uevent.language';

const LanguageContext = createContext<LanguageContextValue | null>(null);

function readStoredLanguage(): Language {
  const value = localStorage.getItem(STORAGE_KEY);
  return value === 'uk' ? 'uk' : 'en';
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en');

  useEffect(() => {
    setLanguageState(readStoredLanguage());
  }, []);

  function setLanguage(languageValue: Language) {
    setLanguageState(languageValue);
    localStorage.setItem(STORAGE_KEY, languageValue);
  }

  const value = useMemo<LanguageContextValue>(
    () => ({
      language,
      locale: translations[language].locale,
      copy: translations[language],
      setLanguage,
      translateCategory: (category) => translateCategory(category, language),
    }),
    [language],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const value = useContext(LanguageContext);

  if (!value) {
    throw new Error('useLanguage must be used inside LanguageProvider');
  }

  return value;
}
