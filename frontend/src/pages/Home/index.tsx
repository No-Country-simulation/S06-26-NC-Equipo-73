import HeroSection from "./components/HeroSection";
import ProblemSection from "./components/ProblemSection";
import IntelligenceSection from "./components/IntelligenceSection";
import MotorsSection from "./components/MotorsSection";
import HowItWorksSection from "./components/HowItWorksSection";
// import HeartSystemSection from "./components/HeartSystemSection";
import BeforeAfterSection from "./components/BeforeAfterSection";
import CTASection from "./components/CTASection";

export default function Home() {
  return (
    <main>
      <HeroSection />
      <ProblemSection />
      <IntelligenceSection />
      <MotorsSection />
      <HowItWorksSection />
      <BeforeAfterSection />
      <CTASection />
    </main>
  );
}
