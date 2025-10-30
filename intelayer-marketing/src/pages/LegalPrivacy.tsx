import { Helmet } from 'react-helmet-async';

import Footer from '../components/Footer';
import Header from '../components/Header';
import Section from '../components/Section';

const LegalPrivacy = () => (
  <div className="min-h-screen bg-page">
    <Helmet>
      <title>Intelayer Privacy Policy</title>
      <link rel="canonical" href="https://intelayer.com/legal/privacy" />
    </Helmet>
    <Header />
    <main>
      <Section className="pb-24 pt-24">
        <article className="prose prose-invert max-w-3xl text-steel">
          <h1>Privacy Policy</h1>
          <p>
            Intelayer operates a third-party trading terminal and this marketing site. We collect minimal analytics data and only with explicit opt-in; by default, no telemetry scripts are loaded.
          </p>
          <h2>Data Collection</h2>
          <ul>
            <li>Contact form submissions are processed through a serverless endpoint that you configure.</li>
            <li>API keys or OAuth credentials for venues are stored client-side and never transmitted to Intelayer.</li>
            <li>Local storage retains UI preferences and analytics opt-in choices.</li>
          </ul>
          <h2>Security Measures</h2>
          <p>
            We recommend hosting Intelayer behind a strict Content Security Policy (`default-src 'self'`) and enabling frame protections (`frame-ancestors 'none'`). Keys remain encrypted locally using browser storage and are only transmitted directly to venue APIs.
          </p>
          <h2>Third Parties</h2>
          <p>
            Any optional analytics or embeds must respect user consent and the applicable data-protection laws. Intelayer does not sell personal information.
          </p>
          <h2>Updates</h2>
          <p>Updates to this policy will be posted on this page with an amended effective date.</p>
        </article>
      </Section>
    </main>
    <Footer />
  </div>
);

export default LegalPrivacy;
