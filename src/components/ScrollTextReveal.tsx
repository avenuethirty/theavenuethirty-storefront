import React, { useRef } from 'react';
import { motion, useScroll, useTransform, MotionValue } from 'motion/react';

interface WordProps {
  children: React.ReactNode;
  progress: MotionValue<number>;
  range: [number, number];
  isBold?: boolean;
}

const Word: React.FC<WordProps> = ({ children, progress, range, isBold }) => {
  const opacity = useTransform(progress, range, [0.2, 1]);

  return (
    <motion.span
      style={{ opacity }}
      className={`inline-block mr-[0.28em] whitespace-nowrap ${isBold ? 'font-normal text-black' : ''}`}
    >
      {children}
    </motion.span>
  );
};

interface ScrollTextRevealProps {
  text: string;
  boldWords?: string[];
  className?: string;
}

export const ScrollTextReveal: React.FC<ScrollTextRevealProps> = ({
  text,
  boldWords = [],
  className = '',
}) => {
  const containerRef = useRef<HTMLParagraphElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start 85%', 'start 25%'],
  });

  const words = text.split(' ');

  return (
    <p ref={containerRef} className={className}>
      {words.map((word, i) => {
        const start = i / words.length;
        const end = Math.min(1, start + 1.2 / words.length);
        const cleanWord = word.replace(/[^a-zA-Z]/g, '').toLowerCase();
        const isBold = boldWords.some(
          (bw) => bw.toLowerCase().replace(/[^a-zA-Z]/g, '') === cleanWord
        );

        return (
          <Word
            key={`${word}-${i}`}
            progress={scrollYProgress}
            range={[start, end]}
            isBold={isBold}
          >
            {word}
          </Word>
        );
      })}
    </p>
  );
};
