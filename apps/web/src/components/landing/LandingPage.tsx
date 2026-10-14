"use client";

import React from 'react';
import { Navbar } from '../layout/Navbar';
import { HeroSection } from './HeroSection';
import { ValuePropSection } from './ValuePropSection';
import { HowItWorksSection } from './HowItWorksSection';
import { FeaturesSection } from './FeaturesSection';
import { ShowcaseSection } from './ShowcaseSection';
import { GamifiedSection } from './GamifiedSection';
import { CtaSection } from './CtaSection';
import { AboutUsSection } from './AboutUsSection';
import { Footer } from './Footer';

interface LandingPageProps {
  onNavigateToApp?: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigateToApp }) => {
  return (
    <div className="min-h-screen bg-[#F8F6FF] text-[#24213A] font-nunito flex flex-col relative selection:bg-[#6847FF]/20 selection:text-[#252046]">
      {/* Top Navigation */}
      <Navbar
        currentPage="home"
        isLandingPage={true}
        onNavigate={(page) => {
          if (page === 'home') {
            window.scrollTo({ top: 0, behavior: 'smooth' });
          } else if (onNavigateToApp) {
            onNavigateToApp();
          } else {
            window.location.hash = `/${page}`;
          }
        }}
      />

      {/* Main Landing Sections */}
      <main className="flex-1">
        {/* Section 1: Hero */}
        <HeroSection onNavigateToApp={onNavigateToApp} />

        {/* Section 2: Value Proposition */}
        <ValuePropSection />

        {/* Section 3: How It Works */}
        <HowItWorksSection />

        {/* Section 4: Features */}
        <FeaturesSection />

        {/* Section 5: Personalized Learning Showcase */}
        <ShowcaseSection />

        {/* Section 6: Gamified Learning */}
        <GamifiedSection />

        {/* Section 7: Call to Action */}
        <CtaSection onNavigateToApp={onNavigateToApp} />

        {/* Section 8: About Us (Founders) */}
        <AboutUsSection />
      </main>

      {/* Section 9: Footer */}
      <Footer />
    </div>
  );
};
export default LandingPage;
