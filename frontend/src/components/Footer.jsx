import React from 'react';
import { useTranslation } from 'react-i18next';
function Footer() {
    const currentYear = new Date().getFullYear();
  const { t } = useTranslation();
    
    return (
      <footer className="app-footer">
        <div className="footer-content">
          <div className="footer-info">
            <p>© {currentYear} Tablica Kanban</p>
          </div>
          <div className="footer-links">
      <a href="#" className="footer-link">{t('footer.help')}</a>
      <a href="#" className="footer-link">{t('footer.about')}</a>
      <a href="#" className="footer-link">{t('footer.contact')}</a>
          </div>
        </div>
      </footer>
    );
  }
  
  export default Footer;