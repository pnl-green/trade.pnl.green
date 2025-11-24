import React from 'react';
import HeadMetaData from '../headMetadata';
import Navbar from '../navbar';
import Footer from '../footer';
import { Box, styled } from '@mui/material';

const Shell = styled('main')(() => ({
  minHeight: '100vh',
  backgroundColor: '#0B0E12',
  display: 'flex',
  flexDirection: 'column',
  isolation: 'isolate',
}));

const Content = styled(Box)(() => ({
  flex: 1,
  width: '100%',
  display: 'flex',
  flexDirection: 'column',
}));
interface LayoutProps {
  children: React.ReactNode;
  pageTitle?: string | undefined;
}

const Layout: React.FC<LayoutProps> = ({ children, pageTitle }) => {
  return (
    <>
      <HeadMetaData pageTitle={pageTitle} />
      <Shell>
        <Navbar />
        <Content component="section">{children}</Content>
        <Footer />
      </Shell>
    </>
  );
};

export default Layout;
