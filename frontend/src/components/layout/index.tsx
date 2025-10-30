import React from "react";
import HeadMetaData from "../headMetadata";
import Navbar from "../navbar";
import Footer from "../footer";
interface LayoutProps {
  children: React.ReactNode;
  pageTitle?: string | undefined;
}

const Layout: React.FC<LayoutProps> = ({ children, pageTitle }) => {
  return (
    <>
      <HeadMetaData pageTitle={pageTitle} />
      <Navbar />
      {children}
      <Footer />
    </>
  );
};

export default Layout;
