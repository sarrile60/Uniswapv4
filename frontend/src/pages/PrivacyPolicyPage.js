import React from 'react';
import { Link } from 'react-router-dom';

const S = {
  h2: { fontSize: '1.5rem', fontWeight: 700, color: '#fff', marginBottom: 16 },
  p: { color: '#b1b5c3', marginBottom: 24, lineHeight: 1.7 },
  p3: { color: '#b1b5c3', marginBottom: 12, lineHeight: 1.7 },
  li: { color: '#b1b5c3', lineHeight: 1.7, marginBottom: 8 },
  a: { color: '#3772ff' },
  card: { background: '#222630', borderRadius: 12, padding: 24, marginBottom: 32 },
  cardTitle: { color: '#fff', fontWeight: 500 },
  cardText: { color: '#b1b5c3' },
  sub: { fontSize: '0.875rem', color: '#777e90', marginBottom: 32 },
};

const PrivacyPolicyPage = () => {
  return (
    <div className="min-h-screen" data-testid="privacy-policy-page" style={{ background: '#141416', color: '#b1b5c3' }}>
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
        <p style={S.sub}>Last updated: 1 January 2026</p>

        <h2 style={S.h2}>1. Introduction</h2>
        <p style={S.p}>Uniswap V4 (&ldquo;we&rdquo;, &ldquo;our&rdquo;, &ldquo;us&rdquo;) is committed to protecting and respecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your personal information when you use our digital asset management platform and related services (collectively, the &ldquo;Service&rdquo;). Uniswap V4 is a private limited company registered in England and Wales, with its registered office at 45 Queen Street, Deal, Kent, England, CT14 6EY.</p>

        <h2 style={S.h2}>2. Information We Collect</h2>
        <p style={S.p3}>We may collect and process the following categories of personal data:</p>
        <ul style={{ listStyle: 'disc', paddingLeft: 24, marginBottom: 24 }}>
          <li style={S.li}><strong style={{color:'#fff'}}>Identity Data:</strong> First name, last name, date of birth, and government-issued identification documents submitted as part of our Know Your Customer (KYC) verification process.</li>
          <li style={S.li}><strong style={{color:'#fff'}}>Contact Data:</strong> Email address and, where provided, telephone number.</li>
          <li style={S.li}><strong style={{color:'#fff'}}>Account Data:</strong> Username, password (stored in encrypted form), account preferences, and transaction history.</li>
          <li style={S.li}><strong style={{color:'#fff'}}>Verification Data:</strong> Photographs of identity documents, proof of address, and video selfie recordings required for identity verification.</li>
          <li style={S.li}><strong style={{color:'#fff'}}>Technical Data:</strong> IP address, browser type and version, device information, time zone setting, operating system, and platform.</li>
          <li style={S.li}><strong style={{color:'#fff'}}>Usage Data:</strong> Information about how you use our Service, including pages visited, features accessed, and interaction patterns.</li>
        </ul>

        <h2 style={S.h2}>3. How We Use Your Information</h2>
        <p style={S.p3}>We use your personal data for the following purposes:</p>
        <ul style={{ listStyle: 'disc', paddingLeft: 24, marginBottom: 24 }}>
          <li style={S.li}>To create and manage your account and provide access to the Service.</li>
          <li style={S.li}>To verify your identity in compliance with applicable anti-money laundering (AML) and know your customer (KYC) regulations.</li>
          <li style={S.li}>To process transactions and maintain accurate records.</li>
          <li style={S.li}>To communicate with you regarding your account, including service updates, security alerts, and support messages.</li>
          <li style={S.li}>To detect, prevent, and address fraud, security breaches, and technical issues.</li>
          <li style={S.li}>To comply with our legal and regulatory obligations.</li>
          <li style={S.li}>To improve and optimise the Service based on aggregated usage patterns.</li>
        </ul>

        <h2 style={S.h2}>4. Legal Basis for Processing</h2>
        <p style={S.p}>We process your personal data under the following legal bases as set out in the UK General Data Protection Regulation (UK GDPR) and the Data Protection Act 2018: (a) performance of a contract; (b) compliance with a legal obligation; (c) legitimate interests; and (d) consent.</p>

        <h2 style={S.h2}>5. Data Sharing and Disclosure</h2>
        <p style={S.p3}>We may share your personal data with:</p>
        <ul style={{ listStyle: 'disc', paddingLeft: 24, marginBottom: 24 }}>
          <li style={S.li}><strong style={{color:'#fff'}}>Service Providers:</strong> Third-party companies that perform services on our behalf, such as cloud hosting, email delivery, and identity verification.</li>
          <li style={S.li}><strong style={{color:'#fff'}}>Regulatory Authorities:</strong> Where required by law, regulation, or legal process.</li>
          <li style={S.li}><strong style={{color:'#fff'}}>Professional Advisors:</strong> Including lawyers, auditors, and insurers where necessary.</li>
        </ul>
        <p style={S.p}>We do not sell your personal data to third parties.</p>

        <h2 style={S.h2}>6. Data Retention</h2>
        <p style={S.p}>We retain your personal data only for as long as is necessary to fulfil the purposes for which it was collected, including to satisfy any legal, regulatory, accounting, or reporting requirements.</p>

        <h2 style={S.h2}>7. Data Security</h2>
        <p style={S.p}>We implement appropriate technical and organisational measures to protect your personal data against unauthorised access, alteration, disclosure, or destruction.</p>

        <h2 style={S.h2}>8. Your Rights</h2>
        <p style={S.p3}>Under applicable data protection legislation, you have the right to:</p>
        <ul style={{ listStyle: 'disc', paddingLeft: 24, marginBottom: 24 }}>
          <li style={S.li}>Request access to the personal data we hold about you.</li>
          <li style={S.li}>Request correction of inaccurate or incomplete personal data.</li>
          <li style={S.li}>Request erasure of your personal data in certain circumstances.</li>
          <li style={S.li}>Object to or request restriction of processing of your personal data.</li>
          <li style={S.li}>Request the transfer of your personal data to another service provider (data portability).</li>
          <li style={S.li}>Withdraw consent at any time where processing is based on consent.</li>
        </ul>
        <p style={S.p}>To exercise any of these rights, please contact us at <a href="mailto:info@uniswapv4.com" style={S.a}>info@uniswapv4.com</a>.</p>

        <h2 style={S.h2}>9. Cookies</h2>
        <p style={S.p}>Our Service uses essential cookies to ensure the proper functioning of the platform, including session management and authentication. We do not use third-party tracking or advertising cookies.</p>

        <h2 style={S.h2}>10. Changes to This Policy</h2>
        <p style={S.p}>We may update this Privacy Policy from time to time to reflect changes in our practices or applicable laws. We will notify you of any material changes by posting the updated policy on this page.</p>

        <h2 style={S.h2}>11. Contact Us</h2>
        <p style={S.p3}>If you have any questions about this Privacy Policy or our data practices, please contact us at:</p>
        <div style={S.card}>
          <p style={S.cardTitle}>Uniswap V4</p>
          <p style={S.cardText}>45 Queen Street, Deal, Kent, England, CT14 6EY</p>
          <p style={S.cardText}>Email: <a href="mailto:info@uniswapv4.com" style={S.a}>info@uniswapv4.com</a></p>
        </div>

        <p style={S.p}>You also have the right to lodge a complaint with the Information Commissioner&rsquo;s Office (ICO) at <a href="https://ico.org.uk" target="_blank" rel="noopener noreferrer" style={S.a}>ico.org.uk</a>.</p>
      </main>

      <footer style={{ background: '#18191d', borderTop: '1px solid #23262f', padding: '24px 16px' }}>
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row justify-between items-center" style={{ fontSize: '0.875rem', color: '#777e90' }}>
          <p>&copy; {new Date().getFullYear()} Uniswap V4. All rights reserved.</p>
          <div className="flex space-x-6 mt-2 sm:mt-0">
            <Link to="/terms" style={{ color: '#777e90' }}>Terms of Service</Link>
            <Link to="/about" style={{ color: '#777e90' }}>About Us</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PrivacyPolicyPage;
