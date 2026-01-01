'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Menu, X } from 'lucide-react'
import './Navbar.css'

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleLinkClick = () => {
    setMobileMenuOpen(false)
  }

  return (
    <nav className="navbar">
      <div className="navbar-container">
        
        {/* Logo */}
         <a href="#home" className="navbar-logo" onClick={handleLinkClick}>
           <img src="/Logo.png" alt="README Generator Logo" className="Nav-logo-img" />
          </a>
        
        {/* Nav Links */}
        <div className={`navbar-links ${mobileMenuOpen ? 'mobile-open' : ''}`}>
          <a href="#home" className="navbar-link" onClick={handleLinkClick}>
            Home
          </a>
          <a href="#generator" className="navbar-link" onClick={handleLinkClick}>
            Generator
          </a>
          <a href="#features" className="navbar-link" onClick={handleLinkClick}>
            Features
          </a>
        </div>

        {/* Mobile Menu Toggle */}
        <button 
          className="mobile-menu-toggle"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
        
      </div>
    </nav>
  )
}