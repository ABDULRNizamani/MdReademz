import { Zap, UserX, Ban } from 'lucide-react'
import './HeroSection.css'

export default function HeroSection() {
  return (
    <section className="hero-section">
      <div className="hero-container">
        
        {/* Main Headline - Centered */}
        <h1 className="hero-title">
          Welcome to <span className="hero-brand">MdReademz</span>
        </h1>
        
        {/* Subheadline - Centered, Less Bold */}
        <p className="hero-subtitle">
          We understand your pain. You spend weeks writing code, then face the frustration of crafting professional documentation.
        </p>
        
        {/* Left Section - What We Do */}
        <div className="hero-content-left">
          <h2 className="hero-section-title">We help you by:</h2>
          <p className="hero-description">
            Writing professional READMEs that match the quality of your code. Just paste your GitHub repository link, add instructions if you want (or don't—we work either way), and get documentation that actually makes sense.
          </p>
        </div>
        
        {/* Why Us Section - Left Aligned */}
        <div className="hero-why-us">
          <h2 className="hero-section-title-left">why us?</h2>
          <p className="hero-description-left">
            This platform was designed with a singular focus: helping developers generate professional documentation efficiently, allowing you to dedicate more time to what truly matters—building exceptional software.
          </p>
          
          
          {/* Features - Centered Below Line */}
          <ul className="hero-features-centered">
            <li className="hero-feature">
              <Zap className="feature-icon" />
              <div>
                <strong>Lightning Fast</strong>
                <span>Professional README in under 10 seconds</span>
              </div>
            </li>
            
            <li className="hero-feature">
              <UserX className="feature-icon" />
              <div>
                <strong>No Sign-In Required</strong>
                <span>Paste your link and go. No accounts, no friction</span>
              </div>
            </li>
            
            <li className="hero-feature">
              <Ban className="feature-icon" />
              <div>
                <strong>Zero Ads</strong>
                <span>Clean interface, no distractions, always free</span>
              </div>
            </li>
          </ul>
          {/* Horizontal Line */}
          <div className="hero-divider"></div>
        </div>
        
      </div>
    </section>
  )
}