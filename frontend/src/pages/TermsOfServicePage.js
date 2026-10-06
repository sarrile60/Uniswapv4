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

const TermsOfServicePage = () => {
  return (
    <div className="min-h-screen" data-testid="terms-of-service-page" style={{ background: '#141416', color: '#b1b5c3' }}>
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
        <p style={S.sub}>Last updated: 1 January 2026</p>

        <h2 style={S.h2}>1. Agreement to Terms</h2>
        <p style={S.p}>These Terms of Service (&ldquo;Terms&rdquo;) govern your access to and use of the Uniswap V4 digital asset management platform and related services (the &ldquo;Service&rdquo;) operated by Uniswap V4, a private limited company registered in England and Wales with its registered office at 45 Queen Street, Deal, Kent, England, CT14 6EY (&ldquo;we&rdquo;, &ldquo;our&rdquo;, &ldquo;us&rdquo;). By accessing or using the Service, you agree to be bound by these Terms. If you do not agree to these Terms, you must not use the Service.</p>

        <h2 style={S.h2}>2. Eligibility</h2>
        <p style={S.p}>To use the Service, you must be at least 18 years of age and have the legal capacity to enter into a binding agreement. By registering for an account, you represent and warrant that you meet these eligibility requirements. We reserve the right to request proof of age or identity at any time.</p>

        <h2 style={S.h2}>3. Account Registration</h2>
        <p style={S.p}>To access certain features of the Service, you must create an account by providing accurate and complete information. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You must notify us immediately at <a href="mailto:info@uniswapv4.com" style={S.a}>info@uniswapv4.com</a> if you become aware of any unauthorised use of your account.</p>

        <h2 style={S.h2}>4. Identity Verification (KYC)</h2>
        <p style={S.p}>In order to comply with applicable anti-money laundering (AML) and know your customer (KYC) regulations, we may require you to submit identity verification documents. This may include government-issued identification, proof of address, and a video selfie for liveness verification. You agree to provide truthful and accurate documentation. Failure to complete verification may result in restricted access to certain features of the Service.</p>

        <h2 style={S.h2}>5. Use of the Service</h2>
        <p style={S.p3}>You agree to use the Service only for lawful purposes and in accordance with these Terms. You shall not:</p>
        <ul style={{ listStyle: 'disc', paddingLeft: 24, marginBottom: 24 }}>
          <li style={S.li}>Use the Service for any fraudulent, illegal, or unauthorised purpose.</li>
          <li style={S.li}>Attempt to gain unauthorised access to any part of the Service, other users&rsquo; accounts, or our systems.</li>
          <li style={S.li}>Interfere with or disrupt the integrity or performance of the Service.</li>
          <li style={S.li}>Upload or transmit any malicious code, viruses, or harmful data.</li>
          <li style={S.li}>Impersonate any person or entity, or misrepresent your affiliation with any person or entity.</li>
          <li style={S.li}>Use the Service to launder money, finance terrorism, or engage in any form of financial crime.</li>
        </ul>

        <h2 style={S.h2}>6. Digital Assets and Transactions</h2>
        <p style={S.p}>The Service provides tools for managing digital assets, including viewing balances, initiating transfers, and tracking transaction history. All transactions are subject to applicable fees, which will be disclosed to you prior to confirmation. You acknowledge that digital asset values are volatile and may fluctuate significantly. Uniswap V4 does not provide financial, investment, or tax advice.</p>

        <h2 style={S.h2}>7. Fees</h2>
        <p style={S.p}>Certain features of the Service may be subject to fees. All applicable fees will be displayed before you confirm a transaction. We reserve the right to modify our fee structure at any time, with notice provided to you in advance of any changes taking effect.</p>

        <h2 style={S.h2}>8. Account Suspension and Termination</h2>
        <p style={S.p}>We reserve the right to suspend or terminate your account at our discretion if we reasonably believe that you have violated these Terms, engaged in fraudulent or illegal activity, or if required to do so by law or regulation. We may also suspend your account temporarily for security purposes, such as when we detect unusual or suspicious activity.</p>

        <h2 style={S.h2}>9. Intellectual Property</h2>
        <p style={S.p}>All content, features, and functionality of the Service, including but not limited to text, graphics, logos, icons, software, and the overall design, are the property of Uniswap V4 or its licensors and are protected by copyright, trademark, and other intellectual property laws. You may not reproduce, distribute, or create derivative works from any part of the Service without our prior written consent.</p>

        <h2 style={S.h2}>10. Limitation of Liability</h2>
        <p style={S.p}>To the fullest extent permitted by applicable law, Uniswap V4 shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to loss of profits, data, or digital assets, arising out of or in connection with your use of the Service. Our total aggregate liability shall not exceed the total fees paid by you to Uniswap V4 in the twelve (12) months preceding the claim.</p>

        <h2 style={S.h2}>11. Disclaimer of Warranties</h2>
        <p style={S.p}>The Service is provided on an &ldquo;as is&rdquo; and &ldquo;as available&rdquo; basis without warranties of any kind, whether express or implied, including but not limited to implied warranties of merchantability, fitness for a particular purpose, and non-infringement. We do not warrant that the Service will be uninterrupted, error-free, or completely secure.</p>

        <h2 style={S.h2}>12. Indemnification</h2>
        <p style={S.p}>You agree to indemnify, defend, and hold harmless Uniswap V4, its directors, officers, employees, and agents from and against any claims, liabilities, damages, losses, and expenses arising out of or in connection with your use of the Service or your violation of these Terms.</p>

        <h2 style={S.h2}>13. Governing Law and Jurisdiction</h2>
        <p style={S.p}>These Terms shall be governed by and construed in accordance with the laws of England and Wales. Any disputes arising out of or in connection with these Terms shall be subject to the exclusive jurisdiction of the courts of England and Wales.</p>

        <h2 style={S.h2}>14. Changes to These Terms</h2>
        <p style={S.p}>We may revise these Terms at any time by updating this page. Material changes will be communicated to you via email or through the Service. Your continued use of the Service after such changes constitutes your acceptance of the revised Terms.</p>

        <h2 style={S.h2}>15. Contact Us</h2>
        <p style={S.p3}>If you have any questions about these Terms, please contact us at:</p>
        <div style={S.card}>
          <p style={S.cardTitle}>Uniswap V4</p>
          <p style={S.cardText}>45 Queen Street, Deal, Kent, England, CT14 6EY</p>
          <p style={S.cardText}>Email: <a href="mailto:info@uniswapv4.com" style={S.a}>info@uniswapv4.com</a></p>
        </div>
      </main>

      <footer style={{ background: '#18191d', borderTop: '1px solid #23262f', padding: '24px 16px' }}>
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row justify-between items-center" style={{ fontSize: '0.875rem', color: '#777e90' }}>
          <p>&copy; {new Date().getFullYear()} Uniswap V4. All rights reserved.</p>
          <div className="flex space-x-6 mt-2 sm:mt-0">
            <Link to="/privacy" style={{ color: '#777e90' }}>Privacy Policy</Link>
            <Link to="/about" style={{ color: '#777e90' }}>About Us</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default TermsOfServicePage;
