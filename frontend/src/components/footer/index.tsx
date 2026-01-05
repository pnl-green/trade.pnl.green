import React from 'react';
import { FooterContainer } from '@/styles/footer.styles';
import { FRONTEND_VERSION } from '../../config/version';
import { useVersionContext } from '@/context/versionContext';

const Footer = () => {
  const { version, setVersion } = useVersionContext();
  const isV2 = version === 'v2';

  const handleVersionToggle = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    if (isV2) {
      setVersion('v1');
    } else {
      setVersion('v2');
    }
    // Reload to apply version changes
    window.location.reload();
  };

  return (
    <FooterContainer>
      <div>
        The Chart interface is provided by <a href="tradingview.com" target="_blank"> Tradingview </a> - Keep track the most important cryptos like bitcoin usd, ethusd and much more.
      </div>
      <div style={{ marginTop: '8px', fontSize: '11px', opacity: 0.7 }}>
        Frontend Version: {version}
        {!isV2 && (
          <span style={{ marginLeft: '12px' }}>
            | <a 
              href="#" 
              onClick={handleVersionToggle}
              style={{ 
                color: '#4CAF50', 
                textDecoration: 'none',
                cursor: 'pointer'
              }}
            >
              View the beta version of v2 here
            </a>
          </span>
        )}
        {isV2 && (
          <span style={{ marginLeft: '12px' }}>
            | <a 
              href="#" 
              onClick={handleVersionToggle}
              style={{ 
                color: '#ff9800', 
                textDecoration: 'none',
                cursor: 'pointer'
              }}
            >
              Switch back to v1
            </a>
          </span>
        )}
      </div>
    </FooterContainer>
  );
};

export default Footer;
