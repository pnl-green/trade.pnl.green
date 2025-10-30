import { Helmet } from 'react-helmet-async';

import Footer from '../components/Footer';
import Header from '../components/Header';
import Section from '../components/Section';

const socials = [
  { label: 'Discord', url: import.meta.env.VITE_DISCORD_URL },
  { label: 'Twitter / X', url: import.meta.env.VITE_TWITTER_URL },
  { label: 'Telegram', url: import.meta.env.VITE_TELEGRAM_URL },
  { label: 'YouTube', url: import.meta.env.VITE_YOUTUBE_URL },
  { label: 'GitHub', url: import.meta.env.VITE_GITHUB_URL },
];

const Socials = () => {
  const activeSocials = socials.filter((item) => Boolean(item.url));

  return (
    <div className="min-h-screen bg-page">
      <Helmet>
        <title>Intelayer Socials | Connect with the Team</title>
        <meta
          name="description"
          content="Join Intelayer across Discord, Twitter, Telegram, YouTube, and GitHub to follow roadmap updates and trading releases."
        />
        <link rel="canonical" href="https://intelayer.com/socials" />
      </Helmet>
      <Header />
      <main>
        <Section className="pb-20 pt-24">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-heading text-ink">Connect with Intelayer</h1>
            <p className="mt-4 text-lg text-steel">
              Follow roadmap updates, release notes, and community drops. All socials respect your privacy — no telemetry without opt-in.
            </p>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-2">
            {activeSocials.length > 0 ? (
              activeSocials.map((item) => (
                <a
                  key={item.label}
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-xl border border-border bg-surface/60 p-6 text-left transition hover:border-green-500/60 hover:shadow-md"
                >
                  <h2 className="font-heading text-xl text-ink">{item.label}</h2>
                  <p className="mt-2 text-sm text-steel">Tap to open in a new tab.</p>
                </a>
              ))
            ) : (
              <div className="md:col-span-2">
                <p className="rounded-xl border border-border bg-surface/60 p-6 text-center text-sm text-steel">
                  Social links are coming soon. In the meantime, reach us at{' '}
                  <a href="mailto:team@intelayer.com" className="text-green-400">
                    team@intelayer.com
                  </a>
                  .
                </p>
              </div>
            )}
          </div>
          <div className="mt-16 rounded-xl border border-border bg-surface/60 p-6 text-sm text-steel">
            <h2 className="font-heading text-lg text-ink">Community Guidelines</h2>
            <p className="mt-3 text-sm text-steel">
              Intelayer spaces prioritize respectful collaboration. No spam, no shilling, no sharing of sensitive keys or account details. Staff will never ask for your password or seed phrase.
            </p>
          </div>
        </Section>
      </main>
      <Footer />
    </div>
  );
};

export default Socials;
