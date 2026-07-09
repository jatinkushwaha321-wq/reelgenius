'use client';

import { motion } from 'framer-motion';
import { Sparkles, TrendingUp, Film, Palette, LayoutGrid, Brain } from 'lucide-react';
import Link from 'next/link';

const features = [
  {
    icon: Sparkles,
    title: 'AI Profile Analysis',
    description:
      'Enter any Instagram username and get instant AI-powered insights into content niche, audience persona, and brand identity.',
  },
  {
    icon: TrendingUp,
    title: 'Content Strategy Planner',
    description:
      'Generate weekly and monthly content strategies with personalized ideas that never repeat, powered by AI memory.',
  },
  {
    icon: Film,
    title: 'Script Studio',
    description:
      'Turn any idea into a production-ready script with hooks, shot lists, camera angles, B-roll suggestions, and captions.',
  },
  {
    icon: Palette,
    title: 'Cover Designer',
    description:
      'Get detailed thumbnail concepts with layouts, color palettes, composition guidelines, and copy-pasteable AI prompts.',
  },
  {
    icon: LayoutGrid,
    title: 'Content Pipeline',
    description:
      'Track every piece of content from idea to published with a visual Kanban board across 7 production stages.',
  },
  {
    icon: Brain,
    title: 'AI Memory',
    description:
      'ReelGenius learns your style, remembers past content, and ensures every new idea is fresh and on-brand.',
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.3,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: 'easeOut' },
  },
};

export default function LandingPage() {
  return (
    <main className="relative min-h-screen overflow-hidden noise-bg">
      {/* Animated background gradient glow orbs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-80 w-80 rounded-full bg-purple-600/20 blur-[120px] animate-pulse-glow" />
        <div className="absolute -right-40 top-1/3 h-96 w-96 rounded-full bg-cyan-500/15 blur-[120px] animate-pulse-glow" style={{ animationDelay: '1s' }} />
        <div className="absolute -bottom-40 left-1/3 h-80 w-80 rounded-full bg-amber-500/10 blur-[120px] animate-pulse-glow" style={{ animationDelay: '2s' }} />
      </div>

      {/* Content wrapper */}
      <div className="relative z-10">
        {/* Navigation Header */}
        <nav className="flex items-center justify-between px-6 py-6 md:px-12">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg gradient-primary">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white tracking-tight">ReelGenius</span>
          </div>
          <Link
            href="/login"
            className="rounded-lg border border-white/10 bg-white/5 px-5 py-2 text-sm font-medium text-white transition-all hover:bg-white/10 hover:border-white/20"
          >
            Sign In
          </Link>
        </nav>

        {/* Hero Section */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="mx-auto max-w-4xl px-6 pb-12 pt-20 text-center md:pt-32"
        >
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm text-muted-foreground">
            <Sparkles className="h-4 w-4 text-amber" />
            <span>AI-Powered Content Intelligence</span>
          </div>

          <h1 className="mb-6 text-5xl font-bold leading-tight tracking-tight md:text-7xl">
            Your Content,{' '}
            <span className="gradient-text">Supercharged</span>
          </h1>

          <p className="mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-muted-foreground md:text-xl">
            ReelGenius analyzes your Instagram presence, generates personalized content
            strategies, writes production-ready scripts, and tracks your entire creative
            pipeline — all powered by AI that learns your unique style.
          </p>

          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-xl gradient-primary px-8 py-3.5 text-base font-semibold text-white shadow-lg transition-all hover:opacity-90 glow-primary"
            >
              Get Started Free
              <TrendingUp className="h-5 w-5" />
            </Link>
            <Link
              href="#features"
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-8 py-3.5 text-base font-medium text-white transition-all hover:bg-white/10"
            >
              See Features
            </Link>
          </div>
        </motion.section>

        {/* Features Grid */}
        <motion.section
          id="features"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          className="mx-auto max-w-6xl px-6 pb-24 pt-12"
        >
          <motion.div variants={itemVariants} className="mb-12 text-center">
            <h2 className="mb-3 text-3xl font-bold md:text-4xl">Everything You Need to Create</h2>
            <p className="text-muted-foreground">
              From analysis to published content — one intelligent platform.
            </p>
          </motion.div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <motion.div
                key={feature.title}
                variants={itemVariants}
                className="group rounded-xl glass glass-hover p-6 transition-all duration-300"
              >
                <div className="mb-4 inline-flex rounded-lg bg-primary/10 p-2.5">
                  <feature.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-white">{feature.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Footer */}
        <footer className="border-t border-white/5 py-8 text-center text-sm text-muted-foreground">
          <p>Built with Next.js, Tailwind CSS, and Google Gemini AI</p>
        </footer>
      </div>
    </main>
  );
}
