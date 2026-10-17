import React from 'react';
import { motion } from 'framer-motion';

interface AnimatedTitleProps {
  lines: string[][];
  className?: string;
  highlightWords?: string[];
  as?: 'h1' | 'h2' | 'h3';
}

export const AnimatedTitle: React.FC<AnimatedTitleProps> = ({
  lines,
  className = '',
  highlightWords = [],
  as = 'h1',
}) => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.1,
      },
    },
  };

  const wordVariants: any = {
    hidden: {
      y: '108%',
      opacity: 0,
    },
    visible: {
      y: '0%',
      opacity: 1,
      transition: {
        duration: 0.7,
        ease: [0.16, 1, 0.3, 1],
      },
    },
  };

  const MotionTag = as === 'h2' ? motion.h2 : as === 'h3' ? motion.h3 : motion.h1;

  return (
    <MotionTag
      className={className}
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-40px' }}
    >
      <span style={{ display: 'block' }}>
        {lines.map((lineWords, lineIdx) => (
          <span
            key={lineIdx}
            style={{
              display: 'block',
              overflow: 'hidden',
              paddingBottom: '0.08em',
            }}
          >
            {lineWords.map((word, wordIdx) => {
              const isHighlight = highlightWords.includes(word.trim().replace(/[.,]/g, ''));
              return (
                <motion.span
                  key={wordIdx}
                  variants={wordVariants}
                  style={{
                    display: 'inline-block',
                    willChange: 'transform',
                  }}
                  className={isHighlight ? 'text-gradient-orange' : undefined}
                >
                  {word}&nbsp;
                </motion.span>
              );
            })}
          </span>
        ))}
      </span>
    </MotionTag>
  );
};
