'use client'

import React from 'react';
import { Heart, Github, Mail, Coffee, Linkedin } from 'lucide-react';

import './Footer.css';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-container">
        
        {/* Top Section */}
        <div className="footer-top">
          <div className="footer-brand">
           <img src="/Logo.png" alt="README Generator Logo" className="footer-logo-img" />
           <p className="footer-tagline">
              Create professional README files in seconds
            </p>
       </div>

          <div className="footer-links">
            <div className="footer-column">
              <h4 className="footer-column-title">Product</h4>
              <ul className="footer-list">
                <li><a href="#home">Home</a></li>
                <li><a href="#generator">Generator</a></li>
                <li><a href="#features">Features</a></li>
              </ul>
            </div>



            <div className="footer-column">
              <h4 className="footer-column-title">Connect</h4>
              <ul className="footer-list">
                <li>
                  <a href="https://github.com/ABDULRNizamani" target="_blank" rel="noopener noreferrer" className="footer-icon-link">
                    <Github size={18} />
                    <span>GitHub</span>
                  </a>
                </li>
                <li>
                  <a href="https://www.linkedin.com/in/abdul-rehman-nizamani-6a5068351/" target="_blank" rel="noopener noreferrer" className="footer-icon-link">
                    <Linkedin size={18} />
                    <span>LinkedIn</span>
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="footer-divider"></div>

        {/* Bottom Section */}
        <div className="footer-bottom">
          <p className="footer-copyright">
            © {currentYear} README Generator. Built by Abdul Rehman Nizamani
          </p>
          
          <div className="footer-support">
            <Coffee size={18} className="footer-coffee" />
            <span>Free & Open Source</span>
          </div>
        </div>

      </div>
    </footer>
  );
};

export default Footer;