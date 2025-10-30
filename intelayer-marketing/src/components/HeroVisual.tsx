import { motion, useReducedMotion } from 'framer-motion';

const pulse = {
  animate: {
    opacity: [0.3, 1, 0.3],
    transition: {
      repeat: Infinity,
      duration: 4,
      ease: 'easeInOut',
    },
  },
};

const HeroVisual = () => {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return (
      <div className="relative h-full w-full rounded-2xl border border-border bg-elev p-6 text-sm text-steel">
        <p className="font-heading text-lg text-ink">Intelligent Execution</p>
        <p className="mt-3 text-steel">
          Venue connectors, AI-CLI prompts, confirmation tickets, and risk sizing are showcased here.
        </p>
      </div>
    );
  }

  return (
    <div className="relative">
      <motion.div
        className="absolute inset-0 -z-10 rounded-2xl blur-3xl"
        animate={{
          background:
            'radial-gradient(circle at 30% 20%, rgba(63,225,143,0.35), transparent 60%), radial-gradient(circle at 80% 80%, rgba(16,184,115,0.25), transparent 55%)',
        }}
        transition={{ duration: 6, repeat: Infinity, repeatType: 'reverse' }}
      />
      <div className="relative grid gap-4 rounded-2xl border border-border bg-elev/80 p-6 shadow-lg">
        <motion.div
          className="rounded-xl border border-green-500/30 bg-green-500/5 p-4 text-sm text-green-200"
          variants={pulse}
          animate="animate"
        >
          <p className="font-heading text-base text-green-200">Connect Venues</p>
          <p className="mt-1 text-xs text-green-100/80">CEX / DEX / Broker</p>
        </motion.div>
        <motion.div
          className="rounded-xl border border-border bg-[#05080C] p-4 font-mono text-xs text-green-200"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <span className="text-green-400">intelayer&gt;</span> Buy 1 BTC at 4h 50 EMA
        </motion.div>
        <motion.div
          className="rounded-xl border border-border bg-surface/80 p-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <p className="font-heading text-sm text-ink">Order Ticket</p>
          <div className="mt-2 grid grid-cols-2 gap-3 text-xs text-steel">
            <div>
              <p className="text-muted">Side</p>
              <p className="text-green-200">Buy</p>
            </div>
            <div>
              <p className="text-muted">Instrument</p>
              <p>BTC/USD</p>
            </div>
            <div>
              <p className="text-muted">Strategy</p>
              <p>4h 50 EMA</p>
            </div>
            <div>
              <p className="text-muted">Size</p>
              <p>1.00 BTC</p>
            </div>
          </div>
        </motion.div>
        <motion.div
          className="flex items-center justify-between rounded-xl border border-green-500/30 bg-green-500/10 p-4 text-xs text-green-100"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2 }}
        >
          <p>Risk sizing locked to max loss $500</p>
          <p className="font-heading text-green-200">Auto</p>
        </motion.div>
      </div>
    </div>
  );
};

export default HeroVisual;
