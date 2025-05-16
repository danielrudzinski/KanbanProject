import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import '../styles/components/LanguageSwitcher.css';

function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const languages = [
    { code: 'en', label: 'English' },
    { code: 'pl', label: 'Polski' },
    { code: 'de', label: 'Deutsch' },
    { code: 'es', label: 'Español' },
    { code: 'fr', label: 'Français' },
    { code: 'it', label: 'Italiano' },
    { code: 'ja', label: '日本語' },
    { code: 'ru', label: 'Русский' },
    { code: 'ar', label: 'العربية' }
  ];

  const changeLanguage = (e, lng) => {
    e.preventDefault();
    e.stopPropagation();
    i18n.changeLanguage(lng);
    setIsOpen(false);
  };

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const toggleDropdown = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsOpen(!isOpen);
  };

  const getCurrentLanguageLabel = () => {
    const currentLang = languages.find(lang => 
      i18n.language.startsWith(lang.code)
    );
    return currentLang ? currentLang.label : 'English';
  };

  return (
    <div className="language-switcher" ref={dropdownRef}>
      <button 
        className="language-switcher-button"
        onClick={toggleDropdown}
        aria-haspopup="true"
        aria-expanded={isOpen}
        type="button"
      >
        <span className="current-language">{getCurrentLanguageLabel()}</span>
        <span className="dropdown-arrow">{isOpen ? '▲' : '▼'}</span>
      </button>
      
      {isOpen && (
        <div className="language-dropdown">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={(e) => changeLanguage(e, lang.code)}
              className={i18n.language.startsWith(lang.code) ? 'active' : ''}
              type="button"
            >
              {lang.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default LanguageSwitcher;