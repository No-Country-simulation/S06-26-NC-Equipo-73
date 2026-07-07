import HeroSection from "./components/Hero/HeroSection";
import ProblemSection from "./components/ProblemSection";
import IntelligenceSection from "./components/IntelligenceSection";
import MotorsSection from "./components/MotorsSection";
import HowItWorksSection from "./components/HowItWorksSection";
// import HeartSystemSection from "./components/HeartSystemSection";
import BeforeAfterSection from "./components/BeforeAfterSection";
import CTASection from "./components/CTASection";
import Navbar from "../../components/layout/Navbar";

export default function Home() {
  return (
    <main>
      <Navbar />

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
