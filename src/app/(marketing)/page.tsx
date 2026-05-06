import { Nav } from "@/components/landing/nav";
import { Hero } from "@/components/landing/hero";
import { Marquee } from "@/components/landing/marquee";
import { Steps } from "@/components/landing/steps";
import { Benefits } from "@/components/landing/benefits";
import { Pricing } from "@/components/landing/pricing";
import { Testimonials } from "@/components/landing/testimonials";
import { Faq } from "@/components/landing/faq";
import { FinalCta } from "@/components/landing/final-cta";
import { Footer } from "@/components/landing/footer";

export default function LandingPage() {
  return (
    <>
      <Nav />
      <Hero />
      <Marquee />
      <Steps />
      <Benefits />
      <Pricing />
      <Testimonials />
      <Faq />
      <FinalCta />
      <Footer />
    </>
  );
}
