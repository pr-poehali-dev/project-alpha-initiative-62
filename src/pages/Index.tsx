import { useState } from "react";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Featured from "@/components/Featured";
import Promo from "@/components/Promo";
import Footer from "@/components/Footer";
import CarCompare from "@/components/CarCompare";

const Index = () => {
  const [compareOpen, setCompareOpen] = useState(false);

  return (
    <main className="min-h-screen">
      <Header />
      <Hero onCompareClick={() => setCompareOpen(true)} />
      <Featured />
      <Promo />
      <Footer />
      {compareOpen && <CarCompare onClose={() => setCompareOpen(false)} />}
    </main>
  );
};

export default Index;