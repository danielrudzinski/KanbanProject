import React from 'react';
import { useTranslation } from 'react-i18next';
import '../styles/components/LanguageSwitcher.css';

function LanguageSwitcher() {
  const { i18n } = useTranslation();

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };

  return (
    <div className="language-switcher">
      <button 
        onClick={() => changeLanguage('en')} 
        className={i18n.language.startsWith('en') ? 'active' : ''}
      >
        EN
      </button>
      <button 
        onClick={() => changeLanguage('pl')} 
        className={i18n.language.startsWith('pl') ? 'active' : ''}
      >
        PL
      </button>
    </div>
  );
}

export default LanguageSwitcher;