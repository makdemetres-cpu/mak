import { Navbar } from '../components/Navbar';
import { Hero } from '../components/Hero';
import { Marquee } from '../components/Marquee';
import { Story } from '../components/Story';
import { SignatureCuts } from '../components/SignatureCuts';
import { Gallery } from '../components/Gallery';
import { Testimonials } from '../components/Testimonials';
import { Location } from '../components/Location';
import { Footer } from '../components/Footer';

export function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <Marquee />
        <Story />
        <SignatureCuts />
        <Gallery />
        <Testimonials />
        <Location />
      </main>
      <Footer />
    </>
  );
}
