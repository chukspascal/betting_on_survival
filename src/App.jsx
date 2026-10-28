import React, { useState, useEffect, useRef } from 'react'
import {
  ArrowUpRight,
  Eye,
  Check,
  ChevronRight,
  ChevronLeft,
  MessageCircle,
  Images,
  X,
} from 'lucide-react'
import Scene3D from './components/Scene3D'
import { SITE_CONFIG } from './config'

export default function App() {
  const scrollProgress = useRef(0)
  const [percentUI, setPercentUI] = useState(0)
  const [viewMode, setViewMode] = useState('auto')
  const [activeChapterIndex, setActiveChapterIndex] = useState(0)
  const [galleryOpen, setGalleryOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY
      const docHeight =
        document.documentElement.scrollHeight - window.innerHeight
      const p =
        docHeight > 0 ? Math.min(1, Math.max(0, scrollTop / docHeight)) : 0
      scrollProgress.current = p
      setPercentUI(Math.round(p * 100))

      // Sync active chapter index with scroll when in auto scroll mode
      if (p < 0.28) {
        setActiveChapterIndex(0)
      } else if (p < 0.42) {
        setActiveChapterIndex(1)
      } else if (p < 0.56) {
        setActiveChapterIndex(2)
      } else {
        setActiveChapterIndex(3)
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const mockups = [
    {
      src: '/assets/mockup-1.jpg',
      title: 'Front & Back Cover Dual Spread',
      caption: 'Full hardcover exterior showing the front artwork, spine badge, and back synopsis.',
    },
    {
      src: '/assets/mockup-2.jpg',
      title: 'Collector Studio Edition — Open Spread',
      caption: 'Side-by-side view of the matte obsidian front cover and back cover.',
    },
    {
      src: '/assets/mockup-3.jpg',
      title: 'Hardcover Stack & Spine Detail',
      caption: 'Precision spine lettering and hardcover binding.',
    },
  ]

  return (
    <div className="relative min-h-screen text-[#111215]">
      {/* Fixed 3D Studio Stage — Remains Visible & Animating From 0% to 100% Scroll! */}
      <Scene3D
        scrollProgress={scrollProgress}
        viewMode={viewMode}
        activeChapterIndex={activeChapterIndex}
      />

      {/* Minimalist Top Bar + Mobile Scroll Progress Line */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-[#F5F3EE]/75 backdrop-blur-md border-b border-black/[0.06]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 h-15 sm:h-16 flex items-center justify-between">
          <a
            href="#top"
            onClick={() => setViewMode('auto')}
            className="flex items-center gap-2"
          >
            <span className="font-display font-black tracking-tight text-xs sm:text-base text-[#111215]">
              BETTING <span className="bg-orange-500 text-white px-1.5 py-0.5 rounded-xs">ON</span> SURVIVAL
            </span>
          </a>

          <nav className="hidden md:flex items-center gap-7 text-xs font-mono uppercase tracking-wider text-zinc-600">
            <a href="#act-ch1" className="hover:text-black transition-colors">
              01. Chapters
            </a>
            <a href="#act-synopsis" className="hover:text-black transition-colors">
              02. Back Cover
            </a>
            <a href="#act-author" className="hover:text-black transition-colors">
              03. Author
            </a>
            <a href="#act-order" className="hover:text-black transition-colors">
              04. Order
            </a>
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => setGalleryOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-full bg-white/80 hover:bg-white border border-black/10 text-[11px] sm:text-xs font-medium text-zinc-800 transition-colors cursor-pointer"
            >
              <Images className="w-3.5 h-3.5 text-orange-500" />
              <span className="hidden xs:inline">Mockups</span>
            </button>

            <a
              href="#act-order"
              className="inline-flex items-center gap-1 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full bg-[#111215] hover:bg-orange-500 text-white hover:text-black font-semibold text-[11px] sm:text-xs transition-all"
            >
              <span>Order</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Mobile/Tablet Horizontal 0-100% Scroll Progress Bar right along the header bottom edge */}
        <div className="lg:hidden w-full h-0.5 bg-black/5 overflow-hidden">
          <div
            className="h-full bg-orange-500 transition-all duration-150"
            style={{ width: `${percentUI}%` }}
          />
        </div>
      </header>

      {/* Desktop Vertical 0% -> 100% Scroll Progress Rail on Right Edge */}
      <div className="fixed right-5 top-1/2 -translate-y-1/2 z-40 hidden lg:flex flex-col items-center gap-3 pointer-events-none">
        <span className="font-mono text-[10px] text-zinc-500 font-bold">
          {percentUI}%
        </span>
        <div className="w-1 h-44 rounded-full bg-black/10 overflow-hidden relative">
          <div
            className="w-full bg-orange-500 rounded-full transition-all duration-150"
            style={{ height: `${percentUI}%` }}
          />
        </div>
        <span className="font-mono text-[9px] uppercase tracking-widest text-zinc-400 [writing-mode:vertical-rl]">
          Scroll Story
        </span>
      </div>

      {/* Floating Bottom 3D Bar */}
      <div className="fixed bottom-3 sm:bottom-5 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center gap-2 w-full max-w-[96vw] pointer-events-none">
        {viewMode === 'open' && (
          <div className="pointer-events-auto px-2.5 py-1 rounded-full bg-[#111215] text-white shadow-xl flex items-center gap-1.5">
            <button
              disabled={activeChapterIndex === 0}
              onClick={() => setActiveChapterIndex((i) => Math.max(0, i - 1))}
              className="p-1 rounded-full hover:bg-white/15 disabled:opacity-35 cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            {SITE_CONFIG.mockChapters.map((ch, idx) => (
              <button
                key={ch.id}
                onClick={() => setActiveChapterIndex(idx)}
                className={`px-2 py-0.5 rounded-full font-mono text-[10px] sm:text-[11px] cursor-pointer ${
                  activeChapterIndex === idx
                    ? 'bg-orange-500 text-black font-bold'
                    : 'text-zinc-300 hover:text-white'
                }`}
              >
                Ch.{ch.id}
              </button>
            ))}
            <button
              disabled={activeChapterIndex === SITE_CONFIG.mockChapters.length - 1}
              onClick={() =>
                setActiveChapterIndex((i) =>
                  Math.min(SITE_CONFIG.mockChapters.length - 1, i + 1)
                )
              }
              className="p-1 rounded-full hover:bg-white/15 disabled:opacity-35 cursor-pointer"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        <div className="pointer-events-auto px-1.5 sm:px-2 py-1 sm:py-1.5 rounded-full bg-white/92 backdrop-blur-md shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-black/10 flex items-center gap-0.5 sm:gap-1 overflow-x-auto max-w-full">
          <span className="hidden sm:inline-flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wider text-zinc-500 pl-3 pr-2 shrink-0">
            <Eye className="w-3.5 h-3.5 text-orange-500" />
            3D Mode:
          </span>
          {[
            { id: 'auto', label: 'Scroll (0–100%)' },
            { id: 'front', label: 'Front' },
            { id: 'open', label: 'Open Spread' },
            { id: 'spine', label: 'Spine' },
            { id: 'back', label: 'Back Cover' },
          ].map((btn) => (
            <button
              key={btn.id}
              onClick={() => setViewMode(btn.id)}
              className={`px-2.5 sm:px-3 py-1 rounded-full text-[11px] sm:text-xs font-medium transition-all cursor-pointer shrink-0 ${
                viewMode === btn.id
                  ? 'bg-[#111215] text-white font-semibold'
                  : 'text-zinc-600 hover:text-black hover:bg-black/5'
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      {/* ===========================================================================
          8-ACT CONTINUOUS SCROLL JOURNEY (0% TO 100%)
          - On Desktop (lg:): Cards sit on Left, 3D Book sits on Right.
          - On Mobile (< lg): 3D Book sits in Top Half of screen, Cards sit in Bottom Half!
         =========================================================================== */}
      <main id="top" className="relative z-10 pointer-events-none">
        {/* ACT 1 (0% - 12%): PURE 3D BOOK ARRIVAL */}
        <section className="h-[115vh] w-full flex flex-col justify-between pt-20 pb-18 px-4 sm:px-6 lg:px-12 max-w-7xl mx-auto">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-mono text-[10px] sm:text-[11px] uppercase tracking-[0.18em] text-zinc-500">
              {SITE_CONFIG.book.overline}
            </span>
            <span className="font-mono text-[10px] sm:text-[11px] uppercase tracking-[0.18em] text-orange-600 font-semibold">
              Scroll Down to Open Book ↓
            </span>
          </div>

          <div className="max-w-xs bg-white/75 lg:bg-transparent backdrop-blur-md lg:backdrop-blur-none p-3.5 lg:p-0 rounded-2xl border border-black/5 lg:border-none">
            <p className="font-mono text-[10px] sm:text-[11px] uppercase tracking-widest text-orange-600 lg:text-zinc-400 font-semibold">
              Interactive 3D Edition • {percentUI}%
            </p>
            <p className="text-xs text-zinc-600 lg:text-zinc-500 mt-1">
              Keep scrolling—the 3D book will hinge open, turn through every chapter, flip to the back cover, and finish at checkout.
            </p>
          </div>
        </section>

        {/* ACT 2 TO 5 (12% - 62%): THE 4 CHAPTER SPREADS */}
        {SITE_CONFIG.mockChapters.map((ch, idx) => (
          <section
            key={ch.id}
            id={idx === 0 ? 'act-ch1' : undefined}
            className="h-[135vh] flex items-end lg:items-center pb-20 lg:pb-0 px-4 sm:px-6 lg:px-12 max-w-7xl mx-auto"
          >
            <div className="w-full max-w-md lg:max-w-[360px] mx-auto lg:mx-0 bg-white/92 backdrop-blur-xl p-5 sm:p-7 rounded-3xl border border-black/10 shadow-[0_12px_40px_rgba(0,0,0,0.08)] pointer-events-auto">
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                <span className="font-mono text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.2em] text-orange-600">
                  {ch.chapterLabel}
                </span>
                <span className="font-mono text-[10px] sm:text-[11px] text-zinc-400">
                  Pages {ch.leftPageNumber}–{ch.rightPageNumber}
                </span>
              </div>

              <h2 className="font-display font-black text-lg sm:text-2xl text-[#111215] leading-tight mb-2 sm:mb-3">
                {ch.title}
              </h2>

              <p className="italic font-serif text-xs text-orange-700 mb-3 sm:mb-4 pb-3 sm:pb-4 border-b border-black/10">
                {ch.quote}
              </p>

              <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed mb-3 sm:mb-5 line-clamp-4 sm:line-clamp-none">
                {ch.leftLines.slice(0, 4).join(' ')}
              </p>

              <div className="flex items-center justify-between text-[10px] sm:text-[11px] font-mono text-zinc-400 pt-2.5 border-t border-black/5">
                <span>
                  {idx < SITE_CONFIG.mockChapters.length - 1
                    ? `Scroll to turn page to Chapter ${idx + 2} ↓`
                    : 'Scroll to close book & flip to Back Cover ↓'}
                </span>
              </div>
            </div>
          </section>
        ))}

        {/* ACT 6 (62% - 75%): BOOK CLOSES & FLIPS 180° TO THE BACK COVER */}
        <section
          id="act-synopsis"
          className="h-[130vh] flex items-end lg:items-center pb-20 lg:pb-0 px-4 sm:px-6 lg:px-12 max-w-7xl mx-auto"
        >
          <div className="w-full max-w-md lg:max-w-[400px] mx-auto lg:mx-0 bg-white/92 backdrop-blur-xl p-6 sm:p-8 rounded-3xl border border-black/10 shadow-[0_12px_40px_rgba(0,0,0,0.08)] pointer-events-auto">
            <span className="font-mono text-[10px] sm:text-[11px] uppercase tracking-[0.2em] text-orange-600 font-bold block mb-2">
              Back Cover Inspection
            </span>
            <h2 className="font-display font-black text-xl sm:text-3xl text-[#111215] uppercase mb-3 sm:mb-4">
              ABOUT THE BOOK
            </h2>
            <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed mb-4">
              <strong className="text-[#111215]">Betting on Survival</strong> exposes the hidden dangers behind the excitement of winning, the pain of repeated losses, and the psychological traps that keep people betting even when they know the consequences.
            </p>
            <blockquote className="pl-4 border-l-2 border-orange-500 italic text-xs sm:text-sm text-[#111215] font-medium">
              “{SITE_CONFIG.book.coreQuote}”
            </blockquote>
          </div>
        </section>

        {/* ACT 7 (75% - 88%): ABOUT THE AUTHOR */}
        <section
          id="act-author"
          className="h-[130vh] flex items-end lg:items-center pb-20 lg:pb-0 px-4 sm:px-6 lg:px-12 max-w-7xl mx-auto"
        >
          <div className="w-full max-w-md lg:max-w-[400px] mx-auto lg:mx-0 bg-white/92 backdrop-blur-xl p-6 sm:p-8 rounded-3xl border border-black/10 shadow-[0_12px_40px_rgba(0,0,0,0.08)] pointer-events-auto">
            <div className="flex items-center gap-4 mb-4 sm:mb-5">
              <img
                src="/assets/author-portrait.jpg"
                alt="Ogbu Solomon Amuche (Jeffretz)"
                className="w-14 h-18 sm:w-16 sm:h-20 rounded-xl object-cover object-top border border-black/10"
              />
              <div>
                <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-orange-600 font-bold block">
                  The Survivor & Author
                </span>
                <h2 className="font-display font-black text-lg sm:text-xl text-[#111215] uppercase leading-tight">
                  Ogbu Solomon Amuche
                </h2>
                <span className="font-mono text-xs text-zinc-500">
                  Pen Name: Jeffretz
                </span>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed mb-2.5">
              A Nigerian entrepreneur, architect, real estate developer, and author from Aji, Enugu-Ezike, in Igbo-Eze North LGA of Enugu State.
            </p>
            <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed">
              Having experienced sports betting firsthand since 2014, he broke free and wrote this book to protect young people, families, and bettors from the illusion of quick money.
            </p>
          </div>
        </section>

        {/* ACT 8 (88% - 100%): FINAL HEROIC POSE + EDITIONS CHECKOUT */}
        <section
          id="act-order"
          className="min-h-screen flex items-end lg:items-center pt-56 lg:pt-24 pb-24 px-4 sm:px-6 lg:px-12 max-w-7xl mx-auto"
        >
          <div className="w-full max-w-md lg:max-w-[480px] mx-auto lg:mx-0 pointer-events-auto">
            <div className="mb-5">
              <span className="font-mono text-[10px] sm:text-[11px] uppercase tracking-[0.2em] text-orange-600 font-bold block mb-1">
                Final Stage • 100% Scroll
              </span>
              <h2 className="font-display font-black text-2xl sm:text-4xl text-[#111215] uppercase tracking-tight">
                GET YOUR COPY
              </h2>
            </div>

            <div className="space-y-3.5 sm:space-y-4">
              {SITE_CONFIG.pricingTiers.map((tier) => (
                <div
                  key={tier.id}
                  className={`rounded-2xl p-5 sm:p-6 transition-all ${
                    tier.highlighted
                      ? 'bg-[#111215] text-white shadow-xl'
                      : 'bg-white/92 backdrop-blur-xl text-[#111215] border border-black/10'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-display font-bold text-sm sm:text-lg">
                        {tier.name}
                      </h3>
                      <span
                        className={`font-mono text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ${
                          tier.highlighted
                            ? 'bg-orange-500 text-black'
                            : 'bg-zinc-100 text-zinc-600'
                        }`}
                      >
                        {tier.badge}
                      </span>
                    </div>
                    <span className="font-display font-black text-xl sm:text-2xl">
                      {tier.price}
                    </span>
                  </div>

                  <p
                    className={`text-xs leading-relaxed mb-3.5 ${
                      tier.highlighted ? 'text-zinc-300' : 'text-zinc-600'
                    }`}
                  >
                    {tier.description}
                  </p>

                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap gap-x-3 gap-y-1">
                      {tier.features.slice(0, 2).map((feat, i) => (
                        <span
                          key={i}
                          className={`inline-flex items-center gap-1 text-[11px] ${
                            tier.highlighted ? 'text-zinc-300' : 'text-zinc-600'
                          }`}
                        >
                          <Check className="w-3 h-3 text-orange-500" />
                          {feat}
                        </span>
                      ))}
                    </div>

                    <a
                      href={tier.checkoutUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`px-4 py-2.5 rounded-xl font-display font-bold text-xs uppercase tracking-wider inline-flex items-center gap-1.5 shrink-0 transition-all ${
                        tier.highlighted
                          ? 'bg-orange-500 hover:bg-orange-400 text-black'
                          : 'bg-[#111215] hover:bg-orange-500 text-white hover:text-black'
                      }`}
                    >
                      <span>{tier.ctaText}</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-4 px-2 text-xs font-mono text-zinc-500">
              <a
                href={SITE_CONFIG.whatsappSupportUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 hover:text-black"
              >
                <MessageCircle className="w-3.5 h-3.5 text-orange-500" />
                <span>WhatsApp Bulk Orders</span>
              </a>
              <button
                onClick={() => setGalleryOpen(true)}
                className="inline-flex items-center gap-1.5 hover:text-black cursor-pointer"
              >
                <Images className="w-3.5 h-3.5 text-orange-500" />
                <span>View Studio Mockups</span>
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* Studio Print Mockups Modal */}
      {galleryOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setGalleryOpen(false)}
        >
          <div
            className="relative max-w-5xl w-full bg-[#FAF9F5] rounded-3xl p-6 sm:p-8 overflow-y-auto max-h-[88vh] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <span className="font-mono text-xs uppercase tracking-widest text-orange-600 font-bold">
                  Studio Photography
                </span>
                <h3 className="font-display font-black text-xl sm:text-2xl text-[#111215] uppercase">
                  PHYSICAL EDITION MOCKUPS
                </h3>
              </div>
              <button
                onClick={() => setGalleryOpen(false)}
                className="w-9 h-9 rounded-full bg-black/10 hover:bg-orange-500 text-black flex items-center justify-center cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {mockups.map((m, idx) => (
                <div
                  key={idx}
                  className="rounded-2xl overflow-hidden bg-white border border-black/10"
                >
                  <img
                    src={m.src}
                    alt={m.title}
                    className="w-full aspect-4/3 object-cover"
                  />
                  <div className="p-4">
                    <h4 className="font-display font-bold text-sm text-[#111215]">
                      {m.title}
                    </h4>
                    <p className="text-xs text-zinc-500 mt-1">{m.caption}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
