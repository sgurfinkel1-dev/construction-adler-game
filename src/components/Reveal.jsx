import { motion } from 'framer-motion'

// Scroll-triggered fade/rise used across the site. Honours reduced-motion via
// framer-motion's defaults; animates once when the element enters the viewport.
export default function Reveal({ children, delay = 0, y = 28, className, as = 'div' }) {
  const MotionTag = motion[as] || motion.div
  return (
    <MotionTag
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </MotionTag>
  )
}
