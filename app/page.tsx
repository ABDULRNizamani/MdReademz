import Image from "next/image";

import Navbar from '@/components1/sections/Navbar'
import HeroSection from '@/components1/sections/HeroSection'
import GeneratorSection from '@/components1/sections/GeneratorSection'
import Footer from '@/components1/sections/Footer'


export default function HomePage() {
  return (
    <>
      <Navbar />
      
      <div id="home">
        <HeroSection />
      </div>

      <div id="generator">
        <GeneratorSection />
        {/* GeneratorSection includes FeaturesSection with id="features" inside */}
      </div>

      <Footer />
    </>
  )
}