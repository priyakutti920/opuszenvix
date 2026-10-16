import React from 'react';
import { motion } from 'framer-motion';

interface AnimatedTitleProps {
  lines: string[][];
  className?: string;
  highlightWords?: string[];
}

export const AnimatedTitle: React.FC<AnimatedTitleProps> = ({
  lines,
  className = '',
  highlightWords = [],
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

  return (
    <motion.h1
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
    </motion.h1>
  );
};
