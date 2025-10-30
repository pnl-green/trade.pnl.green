import { Link } from 'react-router-dom';

const Footer = () => (
  <footer className="border-t border-border bg-[#0B0E12] py-10 text-sm text-steel">
    <div className="container flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
      <div className="max-w-md space-y-3">
        <div className="flex items-center gap-3 text-base font-heading text-ink">
          <img src="/intelayer-logo.svg" alt="Intelayer logo" className="h-7 w-7" />
          Intelayer
        </div>
        <p className="text-muted">
          Intelayer is not a broker-dealer, exchange, or investment advisor. Market risk applies.
          ‘Robinhood’ and ‘Coinbase’ are trademarks of their respective owners.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
        <div className="space-y-3">
          <h4 className="font-heading text-sm uppercase tracking-widest text-ink">Navigate</h4>
          <ul className="space-y-2">
            <li>
              <Link to="/" className="transition hover:text-ink">
                Home
              </Link>
            </li>
            <li>
              <Link to="/docs" className="transition hover:text-ink">
                Docs
              </Link>
            </li>
            <li>
              <Link to="/socials" className="transition hover:text-ink">
                Socials
              </Link>
            </li>
            <li>
              <Link to="/contact" className="transition hover:text-ink">
                Contact
              </Link>
            </li>
          </ul>
        </div>
        <div className="space-y-3">
          <h4 className="font-heading text-sm uppercase tracking-widest text-ink">Legal</h4>
          <ul className="space-y-2">
            <li>
              <Link to="/legal/privacy" className="transition hover:text-ink">
                Privacy
              </Link>
            </li>
            <li>
              <Link to="/legal/terms" className="transition hover:text-ink">
                Terms
              </Link>
            </li>
          </ul>
        </div>
        <div className="space-y-3">
          <h4 className="font-heading text-sm uppercase tracking-widest text-ink">Support</h4>
          <ul className="space-y-2">
            <li>
              <a href="mailto:team@intelayer.com" className="transition hover:text-ink">
                team@intelayer.com
              </a>
            </li>
            <li>
              <Link to="/docs/security" className="transition hover:text-ink">
                Security
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </div>
    <div className="container mt-10 border-t border-border/60 pt-6 text-xs text-muted">
      © {new Date().getFullYear()} Intelayer. All rights reserved.
    </div>
  </footer>
);

export default Footer;
