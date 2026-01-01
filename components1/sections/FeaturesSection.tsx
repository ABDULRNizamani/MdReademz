import React from 'react';
import { Sparkles, Zap, RefreshCw, FileText, Github, Lock } from 'lucide-react';
import './FeaturesSection.css';

interface FeaturesSectionProps {
  hasOutput?: boolean;
}

const FeaturesSection: React.FC<FeaturesSectionProps> = ({ hasOutput = false }) => {
  return (
    <section className={`features-section ${hasOutput ? 'with-output' : ''}`}>
      <div className="features-container">
        
        {/* Features Title */}
        <h2 className="features-main-title">
          What Makes It <span className="features-brand">Special</span>
        </h2>

        {/* Features Grid */}
        <div className="features-grid">
          <div className="feature-card">
            <Github className="feature-card-icon" />
            <h3 className="feature-card-title">GitHub Integration</h3>
            <p className="feature-card-description">
              Generate professional READMEs from your GitHub repository link instantly
            </p>
          </div>

          <div className="feature-card">
            <FileText className="feature-card-icon" />
            <h3 className="feature-card-title">Custom Templates</h3>
            <p className="feature-card-description">
              Describe your project and get a tailored README that fits your needs
            </p>
          </div>

          <div className="feature-card">
            <Lock className="feature-card-icon" />
            <h3 className="feature-card-title">No Signup Required</h3>
            <p className="feature-card-description">
              Free to use, no accounts, no ads - just pure functionality
            </p>
          </div>

          <div className="feature-card">
            <RefreshCw className="feature-card-icon" />
            <h3 className="feature-card-title">Iterative Refinement</h3>
            <p className="feature-card-description">
              Reshape and refine your README with simple commands until it's perfect
            </p>
          </div>

          <div className="feature-card">
            <Zap className="feature-card-icon" />
            <h3 className="feature-card-title">Lightning Fast</h3>
            <p className="feature-card-description">
              Get your README in seconds, not hours of manual writing
            </p>
          </div>

          <div className="feature-card">
            <Sparkles className="feature-card-icon" />
            <h3 className="feature-card-title">Easy to Use</h3>
            <p className="feature-card-description">
              Simple interface, powerful results - no technical knowledge needed
            </p>
          </div>
        </div>

        {/* Divider */}
        <div className="features-divider"></div>

        {/* Limitations Section */}
        <div className="limitations-section">
          <h2 className="limitations-title">Things to Keep in Mind</h2>
          <p className="limitations-description">
            To keep things simple and fast, we don't store your generated READMEs. 
            This means you won't be able to access previously generated files. If you 
            need to recreate something similar, just describe your last README and 
            we'll help you build something close to it.
          </p>
        </div>

      </div>
    </section>
  );
};

export default FeaturesSection;