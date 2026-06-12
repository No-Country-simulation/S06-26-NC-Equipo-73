import HeroSection from "./HeroSection";
import ProblemSection from "./ProblemSection";
import IntelligenceSection from "./IntelligenceSection";
import MotorsSection from "./MotorsSection";
import HowItWorksSection from "./HowItWorksSection";
import HeartSystemSection from "./HeartSystemSection";
import BeforeAfterSection from "./BeforeAfterSection";
import CTASection from "./CTASection";

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
