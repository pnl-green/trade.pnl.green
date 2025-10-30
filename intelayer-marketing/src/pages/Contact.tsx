import { Helmet } from 'react-helmet-async';

import ContactForm from '../components/ContactForm';
import Footer from '../components/Footer';
import Header from '../components/Header';
import Section from '../components/Section';

const Contact = () => (
  <div className="min-h-screen bg-page">
    <Helmet>
      <title>Contact Intelayer | Talk to the Team</title>
      <meta
        name="description"
        content="Reach the Intelayer team for support, partnerships, or onboarding. Secure, accessible form with spam protection."
      />
      <link rel="canonical" href="https://intelayer.com/contact" />
    </Helmet>
    <Header />
    <main>
      <Section className="pb-24 pt-24">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.1fr]">
          <div className="space-y-6">
            <h1 className="text-4xl font-heading text-ink">Let’s build your edge.</h1>
            <p className="text-lg text-steel">
              Intelayer routes to the venues you already trust. Tell us how we can help with execution, automation, or onboarding.
            </p>
            <div className="rounded-xl border border-border bg-surface/70 p-6 text-sm text-steel">
              <h2 className="font-heading text-lg text-ink">Security First</h2>
              <p className="mt-3 text-sm text-steel">
                We’ll never ask for API keys or sensitive credentials in this form. For production integrations, reference the Docs → Security page for handling patterns and CSP guidance.
              </p>
            </div>
          </div>
          <ContactForm />
        </div>
      </Section>
    </main>
    <Footer />
  </div>
);

export default Contact;
