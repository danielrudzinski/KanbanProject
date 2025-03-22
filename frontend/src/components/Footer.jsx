function Footer() {
    const currentYear = new Date().getFullYear();
    
    return (
      <footer className="app-footer">
        <div className="footer-content">
          <div className="footer-info">
            <p>© {currentYear} Tablica Kanban</p>
          </div>
          <div className="footer-links">
            <a href="#" className="footer-link">Pomoc</a>
            <a href="#" className="footer-link">O nas</a>
            <a href="#" className="footer-link">Kontakt</a>
          </div>
        </div>
      </footer>
    );
  }
  
  export default Footer;