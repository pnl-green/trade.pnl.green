import { useMemo } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';

import Button from './Button';

const tradeUrl = import.meta.env.VITE_TRADE_URL ?? 'https://trade.intelayer.com';

const navItems = [
  { to: '/', label: 'Home' },
  { to: '/docs', label: 'Docs' },
  { to: '/socials', label: 'Socials' },
  { to: '/contact', label: 'Contact' },
];

const Header = () => {
  const location = useLocation();
  const isHome = location.pathname === '/';

  const learnMoreHref = useMemo(() => (isHome ? '#features' : '/docs'), [isHome]);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-[#0B0E12]/80 backdrop-blur">
      <div className="container flex items-center justify-between py-4">
        <Link to="/" className="flex items-center gap-3 text-lg font-heading font-semibold text-ink">
          <img src="/intelayer-logo.svg" alt="Intelayer logo" className="h-8 w-8" />
          Intelayer
        </Link>
        <nav className="hidden items-center gap-6 text-sm font-medium text-steel md:flex">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `transition hover:text-ink ${isActive ? 'text-ink' : 'text-steel'}`
              }
            >
              {item.label}
            </NavLink>
          ))}
          <a href={learnMoreHref} className="text-green-400 transition hover:text-green-200">
            Learn More
          </a>
        </nav>
        <div className="flex items-center gap-3">
          <Button onClick={() => window.open(tradeUrl, '_blank', 'noopener,noreferrer')}>
            Trade Now
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;
