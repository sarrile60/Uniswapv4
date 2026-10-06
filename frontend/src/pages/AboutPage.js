import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Globe, Users, Lock, Mail, MapPin, Building } from 'lucide-react';

const AboutPage = () => {
  return (
    <div className="min-h-screen" data-testid="about-page" style={{ background: '#141416', color: '#b1b5c3' }}>
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
        {/* Hero section */}
        <div className="text-center mb-16">
          <div style={{ width: 64, height: 64, background: 'linear-gradient(135deg, #ec4899, #7c3aed)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
            <span style={{ fontSize: 32 }}>🦄</span>
          </div>
          <h2 style={{ fontSize: '2.25rem', fontWeight: 700, color: '#fff', marginBottom: 16 }}>
            Trusted Digital Asset Management
          </h2>
          <p style={{ fontSize: '1.125rem', color: '#b1b5c3', maxWidth: 640, margin: '0 auto', lineHeight: 1.6 }}>
            Uniswap V4 provides a secure, reliable platform for managing digital assets. Founded in 2023 and headquartered in the United Kingdom, we are committed to delivering institutional-grade security and a seamless user experience for individuals and businesses alike.
          </p>
        </div>

        {/* Mission */}
        <div className="mb-16">
          <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#fff', marginBottom: 16 }}>Our Mission</h3>
          <p style={{ color: '#b1b5c3', lineHeight: 1.6, marginBottom: 16 }}>
            At Uniswap V4, our mission is to make digital asset management accessible, transparent, and secure. We believe that financial tools should empower users with full control over their assets, backed by robust security measures and clear regulatory compliance.
          </p>
          <p style={{ color: '#b1b5c3', lineHeight: 1.6 }}>
            We are dedicated to building a platform where trust is earned through transparency, where security is built into every layer, and where our users can manage their digital portfolios with confidence.
          </p>
        </div>

        {/* Values */}
        <div className="mb-16">
          <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#fff', marginBottom: 32 }}>What Guides Us</h3>
          <div className="grid sm:grid-cols-2 gap-6">
            {[
              { icon: Shield, title: 'Security First', text: 'Every feature we build starts with security. From encrypted data storage to rigorous identity verification, safeguarding your assets and personal information is our highest priority.' },
              { icon: Lock, title: 'Regulatory Compliance', text: 'We adhere to applicable anti-money laundering (AML) and know your customer (KYC) regulations, ensuring that our platform operates within the bounds of UK and international financial law.' },
              { icon: Users, title: 'User-Centred Design', text: 'We design our platform with real users in mind. From onboarding to daily use, every interaction is crafted for clarity, simplicity, and reliability across all devices.' },
              { icon: Globe, title: 'Transparency', text: 'We believe in open communication with our users. Our fee structures, policies, and operational practices are clearly documented and readily available.' },
            ].map(({ icon: Icon, title, text }, i) => (
              <div key={i} style={{ background: '#222630', borderRadius: 12, padding: 24 }}>
                <Icon style={{ width: 32, height: 32, color: '#3772ff', marginBottom: 12 }} />
                <h4 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#fff', marginBottom: 8 }}>{title}</h4>
                <p style={{ fontSize: '0.875rem', color: '#b1b5c3', lineHeight: 1.6 }}>{text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Company details */}
        <div className="mb-16">
          <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#fff', marginBottom: 24 }}>Company Information</h3>
          <div style={{ background: '#222630', borderRadius: 12, padding: 32 }}>
            <div className="grid sm:grid-cols-2 gap-6">
              <div className="flex items-start space-x-3">
                <Building style={{ width: 20, height: 20, color: '#777e90', marginTop: 2, flexShrink: 0 }} />
                <div>
                  <p style={{ fontSize: '0.875rem', fontWeight: 500, color: '#777e90' }}>Company Name</p>
                  <p style={{ color: '#fff' }}>Uniswap V4</p>
                  <p style={{ fontSize: '0.875rem', color: '#777e90' }}>Private Limited Company</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <MapPin style={{ width: 20, height: 20, color: '#777e90', marginTop: 2, flexShrink: 0 }} />
                <div>
                  <p style={{ fontSize: '0.875rem', fontWeight: 500, color: '#777e90' }}>Registered Office</p>
                  <p style={{ color: '#fff' }}>45 Queen Street</p>
                  <p style={{ fontSize: '0.875rem', color: '#b1b5c3' }}>Deal, Kent, England, CT14 6EY</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Mail style={{ width: 20, height: 20, color: '#777e90', marginTop: 2, flexShrink: 0 }} />
                <div>
                  <p style={{ fontSize: '0.875rem', fontWeight: 500, color: '#777e90' }}>Contact</p>
                  <a href="mailto:info@uniswapv4.com" style={{ color: '#3772ff' }}>info@uniswapv4.com</a>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Shield style={{ width: 20, height: 20, color: '#777e90', marginTop: 2, flexShrink: 0 }} />
                <div>
                  <p style={{ fontSize: '0.875rem', fontWeight: 500, color: '#777e90' }}>Incorporated</p>
                  <p style={{ color: '#fff' }}>2023</p>
                  <p style={{ fontSize: '0.875rem', color: '#777e90' }}>United Kingdom</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Contact CTA */}
        <div style={{ textAlign: 'center', background: 'rgba(55, 114, 255, 0.1)', borderRadius: 12, padding: 32 }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff', marginBottom: 12 }}>Get in Touch</h3>
          <p style={{ color: '#b1b5c3', marginBottom: 16 }}>
            Have questions or need support? Our team is here to help.
          </p>
          <a href="mailto:info@uniswapv4.com" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, background: '#3772ff', color: '#fff', fontWeight: 500, padding: '10px 24px', textDecoration: 'none', transition: 'all 0.3s' }}>
            <Mail style={{ width: 16, height: 16, marginRight: 8 }} />
            Contact Support
          </a>
        </div>
      </main>

      <footer style={{ background: '#18191d', borderTop: '1px solid #23262f', padding: '24px 16px', marginTop: 64 }}>
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row justify-between items-center" style={{ fontSize: '0.875rem', color: '#777e90' }}>
          <p>&copy; {new Date().getFullYear()} Uniswap V4. All rights reserved.</p>
          <div className="flex space-x-6 mt-2 sm:mt-0">
            <Link to="/privacy" style={{ color: '#777e90' }}>Privacy Policy</Link>
            <Link to="/terms" style={{ color: '#777e90' }}>Terms of Service</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default AboutPage;
