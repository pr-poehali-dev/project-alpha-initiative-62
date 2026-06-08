import { useScroll, useTransform, motion } from "framer-motion";
import { useRef } from "react";

interface HeroProps {
  onCompareClick: () => void;
}

export default function Hero({ onCompareClick }: HeroProps) {
  const container = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: container,
    offset: ["start start", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], ["0vh", "50vh"]);

  return (
    <div
      ref={container}
      className="relative flex items-center justify-center h-screen overflow-hidden"
    >
      <motion.div
        style={{ y }}
        className="absolute inset-0 w-full h-full"
      >
        <img
          src="https://cdn.poehali.dev/projects/9a85191e-b4bc-49e2-8281-211475113d8b/files/409292af-d026-40ce-af79-bcfd0eddcfb6.jpg"
          alt="Luxury cars on mountain road"
          className="w-full h-full object-cover"
        />
      </motion.div>

      <div className="relative z-10 text-center text-white">
        <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-6">
          СРАВНИ
        </h1>
        <p className="text-lg md:text-xl max-w-2xl mx-auto px-6 opacity-90">
          Найди своё идеальное авто — сравни характеристики, цены и отзывы в одном месте
        </p>
        <button
          onClick={onCompareClick}
          className="inline-block mt-8 px-8 py-3 border border-white text-white uppercase text-sm tracking-wide hover:bg-white hover:text-black transition-all duration-300 cursor-pointer"
        >
          Начать сравнение
        </button>
      </div>
    </div>
  );
}