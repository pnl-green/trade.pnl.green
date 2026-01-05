import React from 'react';
import { FooterContainer } from '@/styles/footer.styles';
import { FRONTEND_VERSION } from '../../config/version';

const Footer = () => {
  return (
    <FooterContainer>
      <div>
        The Chart interface is provided by <a href="tradingview.com" target="_blank"> Tradingview </a> - Keep track the most important cryptos like bitcoin usd, ethusd and much more.
      </div>
      <div style={{ marginTop: '8px', fontSize: '11px', opacity: 0.7 }}>
        Frontend Version: {FRONTEND_VERSION}
      </div>
    </FooterContainer>
  );
};

export default Footer;
