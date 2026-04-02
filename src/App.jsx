import { useState, useEffect, useRef } from "react";

const BLUSH = "#f2d5d0";
const BLUSH_LIGHT = "#faf0ee";
const BLUSH_DEEP = "#e8b4ac";
const ROSE = "#c9908a";
const CREAM = "#fdf8f6";
const GOLD = "#c4a882";
const GOLD_LIGHT = "#dbc7a8";
const TEXT = "#5a3e3a";
const TEXT_LIGHT = "#8a6e69";
const WHITE = "#ffffff";
const RIBBON = "#d4a5a0";

/* ─── reveal hook ─── */
function useReveal(threshold = 0.15) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.unobserve(el); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, visible];
}

function Reveal({ children, delay = 0, style = {} }) {
  const [ref, visible] = useReveal();
  return (
    <div ref={ref} style={{
      opacity: visible ? 1 : 0,
      transform: visible ? "translateY(0)" : "translateY(30px)",
      transition: `all 0.8s cubic-bezier(.25,.46,.45,.94) ${delay}ms`,
      ...style,
    }}>{children}</div>
  );
}

/* ═══════════════════════════════════════════
   FLOATING PETALS — canvas layer
   ═══════════════════════════════════════════ */
function PetalCanvas() {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let animId;
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener("resize", resize);

    const petals = Array.from({ length: 18 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height - canvas.height,
      size: 4 + Math.random() * 8,
      speedY: 0.3 + Math.random() * 0.6,
      speedX: -0.2 + Math.random() * 0.4,
      rotation: Math.random() * 360,
      rotSpeed: (Math.random() - 0.5) * 2,
      opacity: 0.15 + Math.random() * 0.25,
      color: [BLUSH, BLUSH_DEEP, RIBBON, GOLD_LIGHT][Math.floor(Math.random() * 4)],
    }));

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      petals.forEach(p => {
        p.y += p.speedY;
        p.x += p.speedX + Math.sin(p.y * 0.005) * 0.3;
        p.rotation += p.rotSpeed;
        if (p.y > canvas.height + 20) { p.y = -20; p.x = Math.random() * canvas.width; }
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.globalAlpha = p.opacity;
        ctx.beginPath();
        ctx.ellipse(0, 0, p.size * 0.5, p.size, 0, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();
        ctx.restore();
      });
      animId = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(animId); window.removeEventListener("resize", resize); };
  }, []);

  return <canvas ref={canvasRef} style={{ position: "fixed", inset: 0, zIndex: 1, pointerEvents: "none" }} />;
}

/* ═══════════════════════════════════════════
   SPARKLE BURST — on click
   ═══════════════════════════════════════════ */
function SparkleLayer() {
  const [sparkles, setSparkles] = useState([]);
  const id = useRef(0);

  useEffect(() => {
    const handler = (e) => {
      const batch = Array.from({ length: 8 }, () => ({
        id: id.current++,
        x: e.clientX + (Math.random() - 0.5) * 30,
        y: e.clientY + (Math.random() - 0.5) * 30,
        size: 4 + Math.random() * 8,
        color: [BLUSH, GOLD, RIBBON, BLUSH_DEEP, WHITE][Math.floor(Math.random() * 5)],
      }));
      setSparkles(prev => [...prev, ...batch]);
      setTimeout(() => setSparkles(prev => prev.filter(s => !batch.includes(s))), 800);
    };
    window.addEventListener("click", handler);
    return () => window.removeEventListener("click", handler);
  }, []);

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 999, pointerEvents: "none" }}>
      {sparkles.map(s => (
        <div key={s.id} style={{ position: "fixed", left: s.x, top: s.y, width: s.size, height: s.size }}>
          <svg viewBox="0 0 24 24" width={s.size} height={s.size} style={{
            animation: "sparklePop 0.8s ease forwards",
            filter: `drop-shadow(0 0 3px ${s.color})`,
          }}>
            <path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5Z" fill={s.color} />
          </svg>
        </div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════
   CURSOR SPARKLE TRAIL
   ═══════════════════════════════════════════ */
function CursorTrail() {
  const [dots, setDots] = useState([]);
  const id = useRef(0);

  useEffect(() => {
    let last = 0;
    const handler = (e) => {
      const now = Date.now();
      if (now - last < 50) return;
      last = now;
      const dot = { id: id.current++, x: e.clientX, y: e.clientY, size: 3 + Math.random() * 5, color: [BLUSH, GOLD_LIGHT, RIBBON][Math.floor(Math.random() * 3)] };
      setDots(prev => [...prev.slice(-20), dot]);
      setTimeout(() => setDots(prev => prev.filter(d => d.id !== dot.id)), 600);
    };
    window.addEventListener("mousemove", handler);
    return () => window.removeEventListener("mousemove", handler);
  }, []);

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 998, pointerEvents: "none" }}>
      {dots.map(d => (
        <div key={d.id} style={{
          position: "fixed", left: d.x - d.size / 2, top: d.y - d.size / 2,
          width: d.size, height: d.size, borderRadius: "50%",
          background: d.color, opacity: 0.6,
          animation: "trailFade 0.6s ease forwards",
          boxShadow: `0 0 6px ${d.color}`,
        }} />
      ))}
    </div>
  );
}

/* ─── ribbon divider ─── */
function RibbonDivider() {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16, margin: "20px 0" }}>
      <span style={{ height: 1, width: 60, background: `linear-gradient(90deg, transparent, ${BLUSH_DEEP}, transparent)` }} />
      <span style={{ fontSize: 16, color: RIBBON, opacity: 0.7, animation: "pulse 3s ease-in-out infinite" }}>✦</span>
      <span style={{ height: 1, width: 60, background: `linear-gradient(90deg, transparent, ${BLUSH_DEEP}, transparent)` }} />
    </div>
  );
}

function SectionHeader({ label, title, italic }) {
  return (
    <div style={{ textAlign: "center" }}>
      <p style={{ fontSize: 10, letterSpacing: 5, textTransform: "uppercase", color: ROSE, marginBottom: 12, fontWeight: 400 }}>{label}</p>
      <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(32px,5vw,50px)", fontWeight: 300, color: TEXT, margin: 0, letterSpacing: 1 }}>
        {title} <em style={{ fontStyle: "italic", color: ROSE, fontWeight: 300 }}>{italic}</em>
      </h2>
      <RibbonDivider />
    </div>
  );
}

function ShimmerText({ children, style = {} }) {
  return (
    <span style={{
      background: `linear-gradient(90deg, ${TEXT} 0%, ${GOLD} 45%, ${ROSE} 55%, ${TEXT} 100%)`,
      backgroundSize: "200% auto",
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent",
      animation: "shimmer 4s linear infinite",
      ...style,
    }}>{children}</span>
  );
}

function FloatingSparkles({ count = 6 }) {
  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} style={{
          position: "absolute",
          left: `${10 + Math.random() * 80}%`,
          top: `${10 + Math.random() * 80}%`,
          width: 6 + Math.random() * 6,
          height: 6 + Math.random() * 6,
          pointerEvents: "none",
          animation: `floatSparkle ${3 + Math.random() * 4}s ease-in-out infinite ${Math.random() * 3}s`,
          zIndex: 0,
        }}>
          <svg viewBox="0 0 24 24" width="100%" height="100%" style={{ filter: `drop-shadow(0 0 4px ${GOLD_LIGHT})` }}>
            <path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5Z"
              fill={[GOLD_LIGHT, BLUSH_DEEP, RIBBON, GOLD][i % 4]} opacity={0.3 + Math.random() * 0.3} />
          </svg>
        </div>
      ))}
    </>
  );
}

function ImagePlaceholder({ width, height, label, style = {}, borderRadius = 0 }) {
  return (
    <div style={{
      width, height, borderRadius, overflow: "hidden",
      background: `linear-gradient(135deg, ${BLUSH_LIGHT} 0%, ${BLUSH} 100%)`,
      border: `1px dashed ${BLUSH_DEEP}`,
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8,
      color: ROSE, fontSize: 12, letterSpacing: 2, textTransform: "uppercase", fontWeight: 400,
      position: "relative", flexShrink: 0, ...style,
    }}>
      <span style={{ fontSize: 28, opacity: 0.5, animation: "pulse 3s ease-in-out infinite" }}>✿</span>
      <span style={{ opacity: 0.7 }}>{label}</span>
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        background: `linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.15) 50%, transparent 70%)`,
        backgroundSize: "200% 200%",
        animation: "shimmerOverlay 3s ease-in-out infinite",
      }} />
    </div>
  );
}

/* ══════════════════════════════════════════
   NAV
   ══════════════════════════════════════════ */
function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", h);
    return () => window.removeEventListener("scroll", h);
  }, []);

  const navVisible = scrolled;

  const linkStyle = { textDecoration: "none", color: TEXT_LIGHT, fontSize: 11, letterSpacing: 2.5, textTransform: "uppercase", fontWeight: 400, transition: "color 0.3s" };
  const links = ["about", "services", "gallery", "contact"];

  return (
    <nav style={{
      position: "fixed", top: navVisible ? 0 : -80, left: 0, right: 0, zIndex: 100,
      padding: scrolled ? "14px 40px" : "20px 40px",
      display: "flex", justifyContent: "space-between", alignItems: "center",
      background: "rgba(253,248,246,0.88)", backdropFilter: "blur(20px)",
      borderBottom: "1px solid rgba(242,213,208,0.3)",
      boxShadow: scrolled ? "0 2px 30px rgba(201,144,138,0.08)" : "none",
      transition: "all 0.4s ease",
    }}>
      <div style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 300, textTransform: "uppercase", color: TEXT }}>
        <span className="nav-full" style={{ fontSize: 20, letterSpacing: 3 }}>
          <ShimmerText>Celine Grace Sy</ShimmerText> <span style={{ color: ROSE, fontStyle: "italic" }}>Nails</span>
        </span>
        <span className="nav-short" style={{ display: "none", fontSize: 22, letterSpacing: 4 }}>
          <ShimmerText>CGS</ShimmerText>
        </span>
      </div>
      <ul style={{ display: "flex", gap: 36, listStyle: "none", margin: 0, padding: 0 }} className="desktop-nav">
        {links.map(l => (
          <li key={l}><a href={`#${l}`} style={linkStyle} onMouseEnter={e => e.target.style.color = ROSE} onMouseLeave={e => e.target.style.color = TEXT_LIGHT}>{l === "contact" ? "Book" : l}</a></li>
        ))}
      </ul>
      <button onClick={() => setMenuOpen(!menuOpen)} className="mobile-burger" style={{ background: "none", border: "none", cursor: "pointer", padding: 8, display: "none", flexDirection: "column", gap: 5 }} aria-label="Menu">
        {[0, 1, 2].map(i => <span key={i} style={{ display: "block", width: 22, height: 1, background: TEXT }} />)}
      </button>
      {menuOpen && (
        <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "rgba(253,248,246,0.97)", backdropFilter: "blur(20px)", display: "flex", flexDirection: "column", alignItems: "center", padding: "30px 0", gap: 24, borderBottom: "1px solid rgba(242,213,208,0.3)" }}>
          {links.map(l => <a key={l} href={`#${l}`} style={linkStyle} onClick={() => setMenuOpen(false)}>{l === "contact" ? "Book" : l}</a>)}
        </div>
      )}
    </nav>
  );
}

/* ══════════════════════════════════════════
   HERO
   ══════════════════════════════════════════ */
function Hero() {
  const a = (d) => ({ opacity: 0, animation: `fadeUp 1s ease forwards ${d}s` });
  const [scrollOpacity, setScrollOpacity] = useState(1);
  useEffect(() => {
    const h = () => {
      const y = window.scrollY;
      setScrollOpacity(Math.max(0, 1 - y / 120));
    };
    window.addEventListener("scroll", h, { passive: true });
    return () => window.removeEventListener("scroll", h);
  }, []);
  return (
    <section style={{
      position: "relative", minHeight: "100vh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", textAlign: "center",
      padding: "80px 24px", overflow: "hidden", background: CREAM,
    }}>
      <div style={{
        position: "absolute", inset: 0, zIndex: 0,
        background: `radial-gradient(ellipse at 30% 30%, rgba(242,213,208,0.3) 0%, transparent 40%),
          radial-gradient(ellipse at 70% 60%, rgba(212,165,160,0.2) 0%, transparent 35%),
          radial-gradient(ellipse at 50% 80%, rgba(196,168,130,0.12) 0%, transparent 40%)`,
        animation: "floatBg 20s ease-in-out infinite",
      }} />

      <FloatingSparkles count={10} />

      <div style={{ position: "relative", zIndex: 2 }}>
        <p style={{ fontSize: 11, letterSpacing: 5, textTransform: "uppercase", color: ROSE, marginBottom: 24, fontWeight: 400, ...a(0.3) }}>
          ✧ Licensed Cosmetologist · South Bay ✧
        </p>
        <h1 style={{
          fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(48px,8vw,90px)",
          fontWeight: 300, lineHeight: 1.05, letterSpacing: 2, color: TEXT, margin: "0 0 12px", ...a(0.5),
        }}>
          <ShimmerText>Celine</ShimmerText>{" "}
          <em style={{ fontStyle: "italic", color: ROSE, fontWeight: 300 }}>Grace</em>{" "}
          <ShimmerText>Sy</ShimmerText>
        </h1>
        <p style={{
          fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(28px,4.5vw,52px)",
          fontWeight: 300, fontStyle: "italic", color: ROSE, letterSpacing: 4, margin: "0 0 20px", ...a(0.6),
        }}>
          Nails
        </p>
        <a href="#contact" style={{
          display: "inline-flex", alignItems: "center", gap: 10,
          padding: "16px 44px", border: `1px solid ${BLUSH_DEEP}`,
          color: TEXT, textDecoration: "none", fontSize: 11, letterSpacing: 3,
          textTransform: "uppercase", fontWeight: 400, background: "transparent",
          transition: "all 0.4s ease", position: "relative", overflow: "hidden", ...a(0.9),
        }}
          onMouseEnter={e => { e.currentTarget.style.background = BLUSH; e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 30px rgba(201,144,138,0.2)"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "none"; }}
        >
          <span style={{ position: "relative", zIndex: 1 }}>✧ Book Your Set ✧</span>
        </a>
      </div>

      <div style={{
        position: "absolute", bottom: 36, left: "50%", transform: "translateX(-50%)",
        opacity: scrollOpacity, transition: "opacity 0.1s linear",
        display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
        zIndex: 2, pointerEvents: "none",
      }}>
        <span style={{ fontSize: 9, letterSpacing: 3, textTransform: "uppercase", color: ROSE, fontWeight: 400 }}>Scroll</span>
        <div style={{
          width: 1, height: 48, background: `linear-gradient(to bottom, ${ROSE}, transparent)`,
          animation: "scrollPulse 2s ease-in-out infinite",
        }} />
      </div>

    </section>
  );
}

/* ══════════════════════════════════════════
   ABOUT
   ══════════════════════════════════════════ */
function About() {
  return (
    <section id="about" style={{ padding: "100px 24px", position: "relative", overflow: "hidden", background: `linear-gradient(180deg, ${CREAM} 0%, ${BLUSH_LIGHT} 50%, ${CREAM} 100%)` }}>
      <FloatingSparkles count={4} />
      <div style={{ maxWidth: 960, margin: "0 auto", position: "relative", zIndex: 2 }}>
        <Reveal><SectionHeader label="✧ Get to know Celine ✧" title="About"/></Reveal>
        <Reveal delay={150}>
          <div style={{ display: "flex", gap: 48, alignItems: "center", marginTop: 48, flexWrap: "wrap", justifyContent: "center" }}>
            <div style={{ position: "relative" }}>
              <img src="/celine.jpg" alt="Celine Grace Sy" style={{ width: 280, height: 370, objectFit: "cover", borderRadius: 8, boxShadow: `14px 14px 0 ${BLUSH}` }} />
              <div style={{ position: "absolute", top: -10, right: -10, animation: "floatSparkle 3s ease-in-out infinite" }}>
                <svg viewBox="0 0 24 24" width="16" height="16"><path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5Z" fill={GOLD} opacity="0.5" /></svg>
              </div>
              <div style={{ position: "absolute", bottom: -6, left: -8, animation: "floatSparkle 4s ease-in-out infinite 1s" }}>
                <svg viewBox="0 0 24 24" width="12" height="12"><path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5Z" fill={RIBBON} opacity="0.4" /></svg>
              </div>
            </div>

            <div style={{ flex: 1, minWidth: 280, maxWidth: 480 }}>
              <p style={{ fontSize: 15, lineHeight: 2, color: TEXT_LIGHT, fontWeight: 300, marginBottom: 20 }}>
                Hi, I'm Celine — a licensed cosmetologist based in the South Bay with a love for creating beautiful, lasting nail sets. Since becoming licensed in 2024, I've been dedicated to perfecting my craft, specializing in Gel-X extensions, builder gel sculpting, and unique specialty finishes.
              </p>
              <p style={{ fontSize: 15, lineHeight: 2, color: TEXT_LIGHT, fontWeight: 300 }}>
                Every set I create is made with care, precision, and a whole lot of love. Whether you're looking for something classic and clean or bold and eye-catching, I'm here to bring your nail vision to life ♡
              </p>
              <div style={{ display: "flex", gap: 28, marginTop: 36, flexWrap: "wrap" }}>
                {[
                  { icon: "✿", text: "Licensed 2024" },
                  { icon: "♡", text: "South Bay" },
                  { icon: "✧", text: "Detail Focused" },
                ].map((b, i) => (
                  <div key={b.text} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, animation: `fadeUp 0.6s ease forwards ${0.3 + i * 0.15}s`, opacity: 0 }}>
                    <div style={{
                      width: 52, height: 52, borderRadius: "50%", border: `1px solid ${BLUSH_DEEP}`,
                      display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20,
                      background: WHITE, boxShadow: `0 4px 20px rgba(201,144,138,0.08), 0 0 12px rgba(242,213,208,0.3)`,
                      transition: "transform 0.3s, box-shadow 0.3s",
                    }}
                      onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.15) rotate(5deg)"; e.currentTarget.style.boxShadow = `0 6px 25px rgba(201,144,138,0.15), 0 0 20px rgba(242,213,208,0.5)`; }}
                      onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = `0 4px 20px rgba(201,144,138,0.08), 0 0 12px rgba(242,213,208,0.3)`; }}
                    >{b.icon}</div>
                    <span style={{ fontSize: 9, letterSpacing: 2, textTransform: "uppercase", color: TEXT_LIGHT }}>{b.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════
   SERVICES
   ══════════════════════════════════════════ */
const SERVICES = [
  { icon: "✿", name: "Gel-X Extensions", desc: "Full-coverage soft gel extensions for a natural, lightweight feel with salon-quality length and shape.", tag: "Most Popular" },
  { icon: "❋", name: "Builder Gel", desc: "Sculpted overlays and extensions using builder gel for added strength, structure, and a flawless finish.", tag: "Strength & Shape" },
  { icon: "✧", name: "Cat Eye Gel", desc: "Specialty magnetic cat eye gel for a mesmerizing, dimensional shimmer that shifts with the light.", tag: "Specialty" },
];

function ServiceCard({ icon, name, desc, tag, delay }) {
  const [hovered, setHovered] = useState(false);
  return (
    <Reveal delay={delay}>
      <div onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
        style={{
          background: WHITE, border: `1px solid ${hovered ? BLUSH_DEEP : "rgba(242,213,208,0.4)"}`,
          padding: "40px 28px", textAlign: "center", position: "relative", overflow: "hidden",
          transition: "all 0.4s ease",
          transform: hovered ? "translateY(-6px)" : "none",
          boxShadow: hovered ? `0 16px 50px rgba(201,144,138,0.15), 0 0 20px rgba(242,213,208,0.2)` : "none",
        }}
      >
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.5) 50%, transparent 60%)",
          backgroundSize: "200% 200%",
          animation: hovered ? "shimmerOverlay 1s ease forwards" : "none",
          pointerEvents: "none",
        }} />
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, height: 3,
          background: `linear-gradient(90deg, transparent, ${BLUSH_DEEP}, ${GOLD}, ${BLUSH_DEEP}, transparent)`,
          opacity: hovered ? 1 : 0, transition: "opacity 0.4s",
        }} />
        <span style={{ fontSize: 28, display: "block", marginBottom: 18, transition: "transform 0.4s", transform: hovered ? "scale(1.2) rotate(10deg)" : "none" }}>{icon}</span>
        <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 21, fontWeight: 400, color: TEXT, marginBottom: 12 }}>{name}</h3>
        <p style={{ fontSize: 13, color: TEXT_LIGHT, lineHeight: 1.8, fontWeight: 300 }}>{desc}</p>
        <span style={{
          display: "inline-block", marginTop: 16, fontSize: 9, letterSpacing: 2, textTransform: "uppercase",
          color: ROSE, border: `1px solid ${BLUSH}`, padding: "4px 14px", borderRadius: 20,
          transition: "all 0.3s", background: hovered ? BLUSH_LIGHT : "transparent",
        }}>{tag}</span>
      </div>
    </Reveal>
  );
}

function Services() {
  return (
    <section id="services" style={{ padding: "100px 24px", background: CREAM, position: "relative", overflow: "hidden" }}>
      <FloatingSparkles count={5} />
      <div style={{ maxWidth: 900, margin: "0 auto", position: "relative", zIndex: 2 }}>
        <Reveal><SectionHeader label="✧ What I offer ✧" title="Nail" italic="Services" /></Reveal>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 24, marginTop: 48 }}>
          {SERVICES.map((s, i) => <ServiceCard key={s.name} {...s} delay={i * 120} />)}
        </div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════
   GALLERY
   ══════════════════════════════════════════ */
function GalleryItem({ h, icon, i, span }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div style={{ gridColumn: "auto" }}>
      <div onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
        style={{
          borderRadius: 8, overflow: "hidden", position: "relative",
          background: `linear-gradient(135deg, ${BLUSH_LIGHT} 0%, ${BLUSH} 100%)`,
          border: `1px dashed ${BLUSH_DEEP}`, height: h,
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8,
          color: ROSE, fontSize: 11, letterSpacing: 2, textTransform: "uppercase", fontWeight: 400,
          transition: "all 0.5s cubic-bezier(.25,.46,.45,.94)",
          transform: hovered ? "scale(1.03)" : "none",
          boxShadow: hovered ? "0 12px 40px rgba(201,144,138,0.15), 0 0 25px rgba(242,213,208,0.3)" : "none",
        }}
      >
        <img src={`/nail${i + 1}.jpg`} alt={`Nail set ${i + 1}`} style={{ position: "absolute", inset: 0, width: "100%", 
          height: "100%", objectFit: "cover", transition: "transform 0.5s", transform: hovered ? "scale(1.05)" : "none" }} />
        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none",
          background: "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.3) 50%, transparent 60%)",
          backgroundSize: "200% 200%",
          animation: hovered ? "shimmerOverlay 1.2s ease forwards" : "none",
        }} />
      </div>
    </div>
  );
}

function Gallery() {
  const items = [
    { h: 380, },
    { h: 380, },
    { h: 380, },
    { h: 380, },
    { h: 380, },
  ];
  return (
    <section id="gallery" style={{ padding: "100px 24px", position: "relative", overflow: "hidden", background: `linear-gradient(180deg, ${CREAM} 0%, ${BLUSH_LIGHT} 100%)` }}>
      <FloatingSparkles count={6} />
      <div style={{ maxWidth: 1200, margin: "0 auto", position: "relative", zIndex: 2 }}>
        <Reveal><SectionHeader label="✧ My work ✧" title="Nail" italic="Gallery" /></Reveal>
        <Reveal delay={150}>
          <div className="gallery-grid" style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 16, marginTop: 48 }}>
            {items.map((item, i) => <GalleryItem key={i} {...item} i={i} />)}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════
   CONTACT
   ══════════════════════════════════════════ */
function Contact() {
  const [btnHover, setBtnHover] = useState(false);
  return (
    <section id="contact" style={{ padding: "100px 24px 60px", background: `linear-gradient(180deg, ${BLUSH_LIGHT} 0%, ${CREAM} 100%)`, textAlign: "center", position: "relative", overflow: "hidden" }}>
      <FloatingSparkles count={4} />
      <div style={{ maxWidth: 500, margin: "0 auto", position: "relative", zIndex: 2 }}>
        <Reveal><SectionHeader label="✧ Let's connect ✧" title="Book Your" italic="Appointment" /></Reveal>
        <Reveal delay={150}>
          <p style={{ fontSize: 14, lineHeight: 1.9, color: TEXT_LIGHT, fontWeight: 300, margin: "24px 0 36px" }}>
            Ready for a new set? Send me a DM on Instagram to book your appointment. I'd love to hear your nail inspo and create something beautiful for you ♡
          </p>
          <a href="https://www.instagram.com/celinegracesynails/" target="_blank" rel="noopener noreferrer"
            onMouseEnter={() => setBtnHover(true)} onMouseLeave={() => setBtnHover(false)}
            style={{
              display: "inline-flex", alignItems: "center", gap: 12,
              padding: "18px 48px", position: "relative", overflow: "hidden",
              background: `linear-gradient(135deg, ${BLUSH_DEEP}, ${ROSE})`,
              color: WHITE, textDecoration: "none", fontSize: 12, letterSpacing: 3,
              textTransform: "uppercase", fontWeight: 400, border: "none",
              transition: "all 0.4s ease",
              transform: btnHover ? "translateY(-3px)" : "none",
              boxShadow: btnHover ? "0 14px 45px rgba(201,144,138,0.35), 0 0 30px rgba(242,213,208,0.4)" : "0 6px 30px rgba(201,144,138,0.25)",
            }}
          >
            <div style={{
              position: "absolute", inset: 0,
              background: "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.25) 50%, transparent 60%)",
              backgroundSize: "200% 200%",
              animation: btnHover ? "shimmerOverlay 1.5s ease infinite" : "none",
            }} />
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style={{ position: "relative", zIndex: 1 }}>
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
            </svg>
            <span style={{ position: "relative", zIndex: 1 }}>✧ Send a DM ✧</span>
          </a>
          <p style={{ marginTop: 24, fontSize: 11, color: TEXT_LIGHT, fontWeight: 300, letterSpacing: 1 }}>
            Booking via Instagram DM only
          </p>
        </Reveal>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════
   FOOTER
   ══════════════════════════════════════════ */
function Footer() {
  return (
    <footer style={{ textAlign: "center", padding: "40px 24px", background: BLUSH_LIGHT, borderTop: "1px solid rgba(242,213,208,0.3)" }}>
      <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 18, fontWeight: 300, letterSpacing: 4, color: TEXT, textTransform: "uppercase", marginBottom: 8 }}>
        <ShimmerText>Celine Grace Sy</ShimmerText>
      </p>
      <p style={{ fontSize: 10, letterSpacing: 3, textTransform: "uppercase", color: TEXT_LIGHT, fontWeight: 300, marginBottom: 5 }}>
        ✧ Licensed Cosmetologist · South Bay · Est. 2024 ✧
      </p>
      <p style={{ fontSize: 8, letterSpacing: 3, textTransform: "uppercase", color: TEXT_LIGHT, fontWeight: 300 }}>
        Built with ❥ by Justine Alexa Dinglas
      </p>
    </footer>
  );
}

/* ══════════════════════════════════════════
   APP
   ══════════════════════════════════════════ */
export default function App() {
  useEffect(() => {
    const loader = document.getElementById('loader');
    if (loader) {
      setTimeout(() => loader.classList.add('hidden'), 3500);
    }
  }, []);

  return (
    <div style={{ background: CREAM, color: TEXT, overflowX: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&family=Quicksand:wght@300;400;500&display=swap');
        *,*::before,*::after{margin:0;padding:0;box-sizing:border-box}
        html{scroll-behavior:smooth}
        body{font-family:'Quicksand',sans-serif;overflow-x:hidden}
        @keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        @keyframes shimmer{to{background-position:-200% center}}
        @keyframes shimmerOverlay{from{background-position:200% center}to{background-position:-200% center}}
        @keyframes pulse{0%,100%{opacity:.7;transform:scale(1)}50%{opacity:1;transform:scale(1.1)}}
        @keyframes float{0%,100%{transform:translateY(0) rotate(0deg)}50%{transform:translateY(-12px) rotate(3deg)}}
        @keyframes floatSparkle{0%,100%{transform:translateY(0) scale(1);opacity:.3}50%{transform:translateY(-10px) scale(1.2);opacity:.6}}
        @keyframes floatBg{0%,100%{transform:translate(0,0) rotate(0deg)}33%{transform:translate(2%,-1%) rotate(.5deg)}66%{transform:translate(-1%,2%) rotate(-.3deg)}}
        @keyframes bounce{0%,100%{transform:translateY(0);opacity:.4}50%{transform:translateY(6px);opacity:.7}}
        @keyframes sparklePop{0%{transform:scale(0) rotate(0deg);opacity:1}50%{transform:scale(1.2) rotate(90deg);opacity:.8}100%{transform:scale(0) rotate(180deg);opacity:0}}
        @keyframes trailFade{from{transform:scale(1);opacity:.6}to{transform:scale(0);opacity:0}}
        @media(max-width:768px){.desktop-nav{display:none!important}.mobile-burger{display:flex!important}.gallery-grid{grid-template-columns:1fr!important}.gallery-grid>div>div{height:420px!important}.nav-full{display:none!important}.nav-short{display:block!important}}
      `}</style>
      <PetalCanvas />
      <SparkleLayer />
      <CursorTrail />
      <Navbar />
      <Hero />
      <About />
      <Services />
      <Gallery />
      <Contact />
      <Footer />
    </div>
  );
}
