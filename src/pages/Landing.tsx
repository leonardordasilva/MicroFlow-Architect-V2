import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Box,
  Database,
  Radio,
  Globe,
  Move,
  GitBranch,
  Undo2,
  Download,
  Shield,
  Lock,
  Code,
  Zap,
  Heart,
  ChevronRight,
} from 'lucide-react';
import heroImg from '../img/High-quality_technical_diagram_of_microservices_ar-1772109807434.avif';
import logoIcon from '../img/MicroFlow_Icon_Low.avif';

// ─── i18n copy ────────────────────────────────────────────────────────────────

const copy = {
  pt: {
    nav: {
      cta: 'Login',
      lang: 'EN',
    },
    hero: {
      headline: 'Projete arquiteturas de microsserviços visualmente',
      sub: 'Crie diagramas profissionais com drag-and-drop, colaboração em tempo real e exportação para PNG, SVG, Mermaid e JSON. Sem instalação.',
      ctaPrimary: 'Login',
      pills: ['Undo/Redo', 'Dark Mode', 'AES-256', '11 Protocolos'],
    },
    nodes: {
      title: 'Quatro tipos de nós especializados',
      items: [
        {
          name: 'Microserviço',
          desc: 'Serviços independentes com bancos embarcados e bibliotecas internas',
        },
        {
          name: 'Banco de Dados',
          desc: '8 variantes: Oracle, PostgreSQL, MySQL, Redis, MongoDB e mais',
        },
        {
          name: 'Fila/Mensageria',
          desc: 'IBM MQ, Kafka e RabbitMQ com conexões tracejadas',
        },
        {
          name: 'Sistema Externo',
          desc: 'APIs externas: REST, gRPC, GraphQL, WebSocket, HTTPS',
        },
      ],
    },
    features: {
      title: 'Funcionalidades profissionais',
      items: [
        {
          heading: 'Editor Visual Drag-and-Drop',
          desc: 'Canvas interativo com zoom, pan, minimap, snap-guides e grid de encaixe. Layout automático inteligente.',
        },
        {
          heading: 'Conexões com Protocolos',
          desc: '11 protocolos visuais com cores distintas. Conexões ortogonais editáveis com rótulos de protocolo.',
        },
        {
          heading: 'Undo/Redo + Auto-save',
          desc: '50 estados de histórico com Ctrl+Z. Auto-save a cada 1.5s com compressão gzip em IndexedDB.',
        },
        {
          heading: 'Exportação Profissional',
          desc: 'PNG, SVG, Mermaid e JSON. Importe de volta com validação Zod. Compartilhe com link público.',
        },
      ],
    },
    protocols: {
      title: '11 protocolos suportados',
      sub: 'Visual com cores distintas para síncronos e assíncronos',
      sync: 'Síncrono',
      async: 'Assíncrono',
    },
    security: {
      title: 'Segurança enterprise',
      items: [
        {
          name: 'AES-256-GCM',
          desc: 'Todos os diagramas criptografados antes de chegar ao banco de dados',
        },
        {
          name: 'Row Level Security',
          desc: 'Políticas de acesso granulares no PostgreSQL via Supabase RLS',
        },
        {
          name: 'Validação Zod',
          desc: 'Todos os inputs validados com schema rigoroso antes de persistir',
        },
        {
          name: 'CSP Restritiva',
          desc: 'Content Security Policy configurada no HTML para bloquear XSS',
        },
      ],
    },
    howItWorks: {
      title: 'Como funciona',
      steps: [
        {
          title: 'Crie sua conta',
          desc: 'Cadastro com e-mail e senha. Acesse imediatamente após o login.',
        },
        {
          title: 'Monte seu diagrama',
          desc: 'Arraste nós, conecte serviços, defina protocolos. Layout automático disponível.',
        },
        {
          title: 'Compartilhe e exporte',
          desc: 'Compartilhe com colegas, exporte em PNG, SVG, Mermaid ou JSON.',
        },
      ],
    },
    shortcuts: {
      title: 'Produtividade com atalhos',
      headers: ['Atalho', 'Ação'],
      rows: [
        ['Ctrl + Z', 'Desfazer'],
        ['Ctrl + Y', 'Refazer'],
        ['Delete', 'Deletar selecionado'],
        ['Ctrl + S', 'Salvar na nuvem'],
        ['Ctrl + A', 'Selecionar todos'],
        ['Escape', 'Fechar modais'],
        ['?', 'Abrir atalhos'],
      ],
    },
    finalCta: {
      headline: 'Pronto para visualizar sua arquitetura?',
      sub: 'Comece gratuitamente hoje. Sem cartão de crédito.',
      btn: 'Login',
    },
    footer: {
      tagline: 'Editor visual de arquiteturas de microsserviços',
      madeWith: 'Feito com',
      forArchitects: 'para arquitetos de software',
      copy: '© 2026 MicroFlow Architect. Todos os direitos reservados.',
    },
  },
  en: {
    nav: {
      cta: 'Login',
      lang: 'PT',
    },
    hero: {
      headline: 'Design microservices architectures visually',
      sub: 'Create professional diagrams with drag-and-drop, real-time collaboration, and export to PNG, SVG, Mermaid and JSON. No install needed.',
      ctaPrimary: 'Login',
      pills: ['Undo/Redo', 'Dark Mode', 'AES-256', '11 Protocols'],
    },
    nodes: {
      title: 'Four specialized node types',
      items: [
        {
          name: 'Microservice',
          desc: 'Independent services with embedded databases and internal libraries',
        },
        {
          name: 'Database',
          desc: '8 variants: Oracle, PostgreSQL, MySQL, Redis, MongoDB and more',
        },
        {
          name: 'Queue/Messaging',
          desc: 'IBM MQ, Kafka and RabbitMQ with dashed connections',
        },
        {
          name: 'External System',
          desc: 'External APIs: REST, gRPC, GraphQL, WebSocket, HTTPS',
        },
      ],
    },
    features: {
      title: 'Professional features',
      items: [
        {
          heading: 'Drag-and-Drop Visual Editor',
          desc: 'Interactive canvas with zoom, pan, minimap, snap-guides and snap grid. Smart auto-layout.',
        },
        {
          heading: 'Protocol Connections',
          desc: '11 visual protocols with distinct colors. Editable orthogonal connections with protocol labels.',
        },
        {
          heading: 'Undo/Redo + Auto-save',
          desc: '50 history states with Ctrl+Z. Auto-save every 1.5s with gzip compression in IndexedDB.',
        },
        {
          heading: 'Professional Export',
          desc: 'PNG, SVG, Mermaid and JSON. Import back with Zod validation. Share with public link.',
        },
      ],
    },
    protocols: {
      title: '11 supported protocols',
      sub: 'Visually distinct colors for synchronous and asynchronous',
      sync: 'Synchronous',
      async: 'Asynchronous',
    },
    security: {
      title: 'Enterprise security',
      items: [
        {
          name: 'AES-256-GCM',
          desc: 'All diagrams encrypted before reaching the database',
        },
        {
          name: 'Row Level Security',
          desc: 'Granular access policies in PostgreSQL via Supabase RLS',
        },
        {
          name: 'Zod Validation',
          desc: 'All inputs validated with strict schema before persisting',
        },
        {
          name: 'Strict CSP',
          desc: 'Content Security Policy configured in HTML to block XSS',
        },
      ],
    },
    howItWorks: {
      title: 'How it works',
      steps: [
        {
          title: 'Create your account',
          desc: 'Sign up with email and password. Access immediately after login.',
        },
        {
          title: 'Build your diagram',
          desc: 'Drag nodes, connect services, define protocols. Auto-layout available.',
        },
        {
          title: 'Share and export',
          desc: 'Share with colleagues, export to PNG, SVG, Mermaid or JSON.',
        },
      ],
    },
    shortcuts: {
      title: 'Productivity with shortcuts',
      headers: ['Shortcut', 'Action'],
      rows: [
        ['Ctrl + Z', 'Undo'],
        ['Ctrl + Y', 'Redo'],
        ['Delete', 'Delete selected'],
        ['Ctrl + S', 'Save to cloud'],
        ['Ctrl + A', 'Select all'],
        ['Escape', 'Close modals'],
        ['?', 'Open shortcuts'],
      ],
    },
    finalCta: {
      headline: 'Ready to visualize your architecture?',
      sub: 'Start free today. No credit card required.',
      btn: 'Login',
    },
    footer: {
      tagline: 'Visual editor for microservices architectures',
      madeWith: 'Made with',
      forArchitects: 'for software architects',
      copy: '© 2026 MicroFlow Architect. All rights reserved.',
    },
  },
} as const;

// ─── Protocol data ─────────────────────────────────────────────────────────────

const protocols = [
  { name: 'REST', type: 'sync', color: '#3b82f6' },
  { name: 'gRPC', type: 'sync', color: '#8b5cf6' },
  { name: 'GraphQL', type: 'sync', color: '#ec4899' },
  { name: 'WebSocket', type: 'async', color: '#f97316' },
  { name: 'Kafka', type: 'async', color: '#16a34a' },
  { name: 'AMQP', type: 'async', color: '#0d9488' },
  { name: 'MQTT', type: 'async', color: '#eab308' },
  { name: 'HTTPS', type: 'sync', color: '#22c55e' },
  { name: 'TCP', type: 'sync', color: '#6b7280' },
  { name: 'UDP', type: 'async', color: '#9ca3af' },
  { name: 'SQL', type: 'sync', color: '#ca8a04' },
] as const;

// ─── Node type data ─────────────────────────────────────────────────────────────

const nodeIcons = [Box, Database, Radio, Globe];
const nodeColors = ['#3b82f6', '#22c55e', '#10b981', '#6b7280'];

// ─── Feature icons ──────────────────────────────────────────────────────────────

const featureIcons = [Move, GitBranch, Undo2, Download];

// ─── Security icons ─────────────────────────────────────────────────────────────

const securityIcons = [Shield, Lock, Code, Zap];

// ─── Scroll reveal (fixed: re-runs when lang changes) ───────────────────────

function useScrollReveal(lang: string) {
  useEffect(() => {
    let observer: IntersectionObserver | undefined;
    const raf = requestAnimationFrame(() => {
      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              (entry.target as HTMLElement).classList.add('sr-visible');
              observer?.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.07, rootMargin: '0px 0px -40px 0px' }
      );
      document.querySelectorAll('[data-sr]').forEach((el) => {
        (el as HTMLElement).classList.remove('sr-visible');
        observer!.observe(el);
      });
    });
    return () => {
      cancelAnimationFrame(raf);
      observer?.disconnect();
    };
  }, [lang]);
}

const navLinks = {
  pt: ['Nós', 'Funcionalidades', 'Protocolos', 'Segurança', 'Como Funciona'],
  en: ['Nodes', 'Features', 'Protocols', 'Security', 'How It Works'],
};
const navHrefs = ['#nodes', '#features', '#protocols', '#security', '#how-it-works'];
const backToTopLabel = { pt: '↑ Topo', en: '↑ Top' };

// ─── Main Component ─────────────────────────────────────────────────────────────

export default function Landing() {
  const [lang, setLang] = useState<'pt' | 'en'>('pt');
  const navRef = useRef<HTMLElement>(null);

  const c = copy[lang];

  // Load Google Fonts
  useEffect(() => {
    if (document.getElementById('landing-fonts')) return;
    const link = document.createElement('link');
    link.id = 'landing-fonts';
    link.rel = 'stylesheet';
    link.href =
      'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=DM+Sans:wght@300;400;500;700&display=swap';
    document.head.appendChild(link);
  }, []);

  // Navbar scroll effect
  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;
    const handler = () => {
      if (window.scrollY > 20) {
        nav.classList.add('nav-scrolled');
      } else {
        nav.classList.remove('nav-scrolled');
      }
    };
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  useScrollReveal(lang);

  const glassCard = 'rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 p-6';
  const sectionWrapper = 'py-20 px-6 max-w-6xl mx-auto';

  return (
    <div
      style={{
        background: '#0f1520',
        color: '#e2e8f0',
        fontFamily: "'DM Sans', sans-serif",
        minHeight: '100vh',
        overflowX: 'hidden',
      }}
    >
      <style>{`
        /* ── Smooth scroll ── */
        html { scroll-behavior: smooth; }

        /* ── Scroll reveal ── */
        [data-sr] {
          opacity: 0;
          transform: translateY(22px);
          transition: opacity 0.55s cubic-bezier(0.4,0,0.2,1),
                      transform 0.55s cubic-bezier(0.4,0,0.2,1);
        }
        [data-sr].sr-visible { opacity: 1; transform: translateY(0); }
        [data-sr][data-delay="100"] { transition-delay: 0.10s; }
        [data-sr][data-delay="150"] { transition-delay: 0.15s; }
        [data-sr][data-delay="200"] { transition-delay: 0.20s; }
        [data-sr][data-delay="250"] { transition-delay: 0.25s; }
        [data-sr][data-delay="300"] { transition-delay: 0.30s; }
        [data-sr][data-delay="350"] { transition-delay: 0.35s; }

        /* ── Keyframes ── */
        @keyframes float {
          0%,100% { transform: translateY(0px) scale(1); }
          50% { transform: translateY(-18px) scale(1.04); }
        }
        @keyframes floatSlow {
          0%,100% { transform: translateY(0px) scale(1); }
          50% { transform: translateY(-28px) scale(1.06); }
        }
        @keyframes shimmer {
          0% { background-position: -400% center; }
          100% { background-position: 400% center; }
        }
        @keyframes pulseRing {
          0% { transform: scale(1); opacity: 0.6; }
          100% { transform: scale(1.55); opacity: 0; }
        }
        @keyframes gradientBorder {
          0%,100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        @keyframes fadeInDown {
          from { opacity: 0; transform: translateY(-12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes glowPulse {
          0%,100% { opacity: 0.5; }
          50%     { opacity: 1; }
        }
        @keyframes rotateSlow {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }

        /* ── Navbar ── */
        .nav-scrolled { box-shadow: 0 4px 32px rgba(0,0,0,0.5); }
        .nav-logo { animation: fadeInDown 0.5s ease both; }
        .nav-cta  { animation: fadeInDown 0.5s 0.15s ease both; }

        /* ── Hero headline shimmer ── */
        .headline-shimmer {
          background: linear-gradient(
            90deg,
            #f1f5f9 0%, #f1f5f9 30%,
            #93c5fd 45%, #c4b5fd 55%,
            #f1f5f9 70%, #f1f5f9 100%
          );
          background-size: 300% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: shimmer 4s linear infinite;
        }

        /* ── Hero badge bounce-in ── */
        .hero-badge {
          animation: fadeInDown 0.6s cubic-bezier(0.34,1.56,0.64,1) both;
        }

        /* ── Floating blobs ── */
        .blob-1 {
          animation: float 7s ease-in-out infinite;
        }
        .blob-2 {
          animation: floatSlow 10s ease-in-out infinite 2s;
        }
        .blob-3 {
          animation: float 8s ease-in-out infinite 4s;
        }

        /* ── Hero image glow animation ── */
        .hero-glow {
          background: linear-gradient(135deg, rgba(59,130,246,0.5), rgba(139,92,246,0.3), rgba(16,185,129,0.3));
          background-size: 200% 200%;
          animation: gradientBorder 4s ease infinite;
        }

        /* ── Buttons ── */
        .btn-primary {
          position: relative;
          transition: all 0.2s ease !important;
        }
        .btn-primary:hover {
          background: #ea6c00 !important;
          box-shadow: 0 0 36px rgba(249,115,22,0.45), 0 8px 24px rgba(249,115,22,0.2);
          transform: translateY(-1px);
        }
        .btn-outline:hover {
          background: rgba(255,255,255,0.09) !important;
          border-color: rgba(255,255,255,0.3) !important;
          transform: translateY(-1px);
        }

        /* ── Node cards ── */
        .node-card {
          transition: transform 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease !important;
        }
        .node-card:hover {
          transform: translateY(-4px) scale(1.01) !important;
        }

        /* ── Feature cards ── */
        .feature-card {
          transition: background 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease !important;
        }
        .feature-card:hover {
          background: rgba(59,130,246,0.07) !important;
          border-color: rgba(59,130,246,0.35) !important;
          box-shadow: 0 0 0 1px rgba(59,130,246,0.15), 0 8px 32px rgba(59,130,246,0.12) !important;
        }

        /* ── Security cards ── */
        .security-card {
          transition: background 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease !important;
        }
        .security-card:hover {
          background: rgba(16,185,129,0.07) !important;
          border-color: rgba(16,185,129,0.35) !important;
          box-shadow: 0 0 0 1px rgba(16,185,129,0.15), 0 8px 32px rgba(16,185,129,0.1) !important;
        }

        /* ── Step cards ── */
        .step-card {
          transition: border-color 0.2s ease, background 0.2s ease, transform 0.2s ease !important;
        }
        .step-card:hover {
          border-color: rgba(59,130,246,0.45) !important;
          background: rgba(59,130,246,0.06) !important;
          transform: translateY(-3px) !important;
        }

        /* ── Protocol chips ── */
        .protocol-chip {
          transition: background 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease !important;
        }
        .protocol-chip:hover {
          background: rgba(255,255,255,0.1) !important;
          transform: translateY(-2px) !important;
        }

        /* ── Section title gradient accent ── */
        .section-accent {
          display: inline-block;
          background: linear-gradient(90deg, #3b82f6, #8b5cf6);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        /* ── Shortcut kbd ── */
        .kbd-key {
          transition: background 0.15s ease, color 0.15s ease !important;
        }
        .kbd-key:hover {
          background: rgba(59,130,246,0.25) !important;
          color: #93c5fd !important;
        }

        /* ── Responsive ── */
        @media (max-width: 768px) {
          .hero-grid { grid-template-columns: 1fr !important; }
          .feature-alt-grid { grid-template-columns: 1fr !important; }
          .feature-alt-grid .order-first { order: -1 !important; }
        }

        /* ── Nav section links ── */
        .nav-section-link {
          color: #94a3b8;
          text-decoration: none;
          font-size: 14px;
          font-weight: 500;
          padding: 6px 10px;
          border-radius: 8px;
          transition: color 0.15s ease, background 0.15s ease;
          white-space: nowrap;
        }
        .nav-section-link:hover {
          color: #e2e8f0;
          background: rgba(255,255,255,0.06);
        }
        .nav-section-links {
          display: flex;
          gap: 2px;
          align-items: center;
        }
        @media (max-width: 900px) {
          .nav-section-links { display: none !important; }
        }

        /* ── Back to top button ── */
        .back-to-top {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          margin-top: 48px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 100px;
          padding: 7px 18px;
          font-size: 13px;
          font-weight: 500;
          color: #64748b;
          cursor: pointer;
          transition: color 0.2s ease, background 0.2s ease, border-color 0.2s ease;
        }
        .back-to-top:hover {
          color: #94a3b8;
          background: rgba(255,255,255,0.08);
          border-color: rgba(255,255,255,0.18);
        }
      `}</style>

      {/* ── Navbar ── */}
      <nav
        ref={navRef}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          background: 'rgba(15,21,32,0.85)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          transition: 'box-shadow 0.3s ease',
        }}
      >
        <div
          style={{
            maxWidth: '1200px',
            margin: '0 auto',
            padding: '0 24px',
            height: '64px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          {/* Logo */}
          <div className="nav-logo" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <img
              src={logoIcon}
              alt="MicroFlow Architect logo"
              style={{ width: '32px', height: '32px', borderRadius: '8px', objectFit: 'cover' }}
            />
            <span
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontWeight: 700,
                fontSize: '18px',
                color: '#e2e8f0',
                letterSpacing: '-0.3px',
              }}
            >
              MicroFlow Architect
            </span>
          </div>

          {/* Section links */}
          <nav className="nav-section-links">
            {navLinks[lang].map((label, i) => (
              <a key={navHrefs[i]} href={navHrefs[i]} className="nav-section-link">
                {label}
              </a>
            ))}
          </nav>

          {/* Right side */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              onClick={() => setLang(lang === 'pt' ? 'en' : 'pt')}
              aria-label="Toggle language"
              style={{
                background: 'rgba(255,255,255,0.07)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: '8px',
                color: '#94a3b8',
                fontSize: '13px',
                fontWeight: 600,
                padding: '6px 14px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                letterSpacing: '0.5px',
              }}
            >
              {c.nav.lang}
            </button>
            <Link
              to="/app"
              style={{
                background: '#f97316',
                color: '#fff',
                borderRadius: '10px',
                padding: '8px 20px',
                fontWeight: 600,
                fontSize: '14px',
                textDecoration: 'none',
                transition: 'all 0.2s ease',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer',
              }}
              className="btn-primary nav-cta"
            >
              {c.nav.cta}
              <ChevronRight size={14} />
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero Section ── */}
      <section
        style={{
          paddingTop: '120px',
          paddingBottom: '80px',
          paddingLeft: '24px',
          paddingRight: '24px',
          background:
            'radial-gradient(ellipse at 60% 0%, rgba(37,99,235,0.15) 0%, transparent 70%), #0f1520',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Animated background blobs */}
        <div className="blob-1" style={{
          position: 'absolute', top: '10%', left: '5%', width: '400px', height: '400px',
          borderRadius: '50%', background: 'radial-gradient(circle, rgba(37,99,235,0.18) 0%, transparent 70%)',
          filter: 'blur(40px)', pointerEvents: 'none',
        }} />
        <div className="blob-2" style={{
          position: 'absolute', top: '20%', right: '10%', width: '500px', height: '500px',
          borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%)',
          filter: 'blur(60px)', pointerEvents: 'none',
        }} />
        <div className="blob-3" style={{
          position: 'absolute', bottom: '5%', left: '40%', width: '350px', height: '350px',
          borderRadius: '50%', background: 'radial-gradient(circle, rgba(16,185,129,0.1) 0%, transparent 70%)',
          filter: 'blur(50px)', pointerEvents: 'none',
        }} />

        {/* Decorative glow */}
        <div
          style={{
            position: 'absolute',
            top: '-200px',
            right: '-200px',
            width: '600px',
            height: '600px',
            background: 'radial-gradient(circle, rgba(37,99,235,0.08) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />

        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          {/* Hero grid */}
          <div
            className="hero-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '64px',
              alignItems: 'center',
            }}
          >
            {/* Left: text */}
            <div data-sr>
              <h1
                style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontWeight: 700,
                  fontSize: 'clamp(32px, 5vw, 56px)',
                  lineHeight: 1.15,
                  letterSpacing: '-1px',
                  color: '#f1f5f9',
                  marginBottom: '20px',
                }}
              >
                <span className="headline-shimmer">{c.hero.headline}</span>
              </h1>
              <p
                style={{
                  fontSize: '18px',
                  lineHeight: 1.7,
                  color: '#94a3b8',
                  marginBottom: '36px',
                  fontWeight: 300,
                }}
              >
                {c.hero.sub}
              </p>

              {/* CTA buttons */}
              <div
                style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '40px' }}
              >
                <Link
                  to="/app"
                  className="btn-primary"
                  style={{
                    background: '#f97316',
                    color: '#fff',
                    borderRadius: '12px',
                    padding: '14px 28px',
                    fontWeight: 700,
                    fontSize: '16px',
                    textDecoration: 'none',
                    transition: 'all 0.2s ease',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    cursor: 'pointer',
                    border: 'none',
                  }}
                >
                  {c.hero.ctaPrimary}
                  <ChevronRight size={18} />
                </Link>
              </div>

              {/* Pills */}
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {c.hero.pills.map((pill) => (
                  <span
                    key={pill}
                    style={{
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '100px',
                      padding: '5px 14px',
                      fontSize: '13px',
                      color: '#94a3b8',
                      fontWeight: 500,
                    }}
                  >
                    {pill}
                  </span>
                ))}
              </div>
            </div>

            {/* Right: hero image */}
            <div data-sr data-delay="200" style={{ position: 'relative' }}>
              {/* Glow behind image */}
              <div
                className="hero-glow"
                style={{
                  position: 'absolute',
                  inset: '-2px',
                  borderRadius: '20px',
                  filter: 'blur(12px)',
                  zIndex: 0,
                }}
              />
              <div
                style={{
                  position: 'relative',
                  zIndex: 1,
                  borderRadius: '18px',
                  overflow: 'hidden',
                  border: '1px solid rgba(255,255,255,0.12)',
                  boxShadow:
                    '0 32px 64px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)',
                  background: 'rgba(255,255,255,0.03)',
                }}
              >
                {/* Window chrome bar */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '10px 16px',
                    background: 'rgba(255,255,255,0.04)',
                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                  }}
                >
                  {['#ff5f57', '#febc2e', '#28c840'].map((c) => (
                    <div
                      key={c}
                      style={{ width: '10px', height: '10px', borderRadius: '50%', background: c }}
                    />
                  ))}
                </div>
                <img
                  src={heroImg}
                  alt="MicroFlow Architect — diagrama de arquitetura de microsserviços"
                  style={{ width: '100%', display: 'block', objectFit: 'cover' }}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Node Types Section ── */}
      <section id="nodes" style={{ padding: '80px 24px', background: 'rgba(255,255,255,0.02)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h2
            data-sr
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontWeight: 700,
              fontSize: 'clamp(26px, 4vw, 40px)',
              textAlign: 'center',
              marginBottom: '12px',
              color: '#f1f5f9',
              letterSpacing: '-0.5px',
            }}
          >
            {c.nodes.title}
          </h2>
          <p
            data-sr
            data-delay="100"
            style={{
              textAlign: 'center',
              color: '#64748b',
              fontSize: '16px',
              marginBottom: '52px',
            }}
          >
            {lang === 'pt'
              ? 'Cada tipo com comportamentos e conexões específicos'
              : 'Each type with specific behaviors and connections'}
          </p>

          <div
            data-sr
            data-delay="200"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: '20px',
            }}
          >
            {c.nodes.items.map((node, i) => {
              const Icon = nodeIcons[i];
              const color = nodeColors[i];
              return (
                <div
                  key={node.name}
                  className="node-card"
                  style={{
                    borderRadius: '16px',
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    padding: '28px 24px',
                    transition: 'all 0.2s ease',
                    cursor: 'default',
                  }}
                >
                  <div
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '12px',
                      background: `${color}18`,
                      border: `1px solid ${color}40`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: '16px',
                    }}
                  >
                    <Icon size={22} color={color} />
                  </div>
                  <h3
                    style={{
                      fontFamily: "'Space Grotesk', sans-serif",
                      fontWeight: 600,
                      fontSize: '17px',
                      color: '#f1f5f9',
                      marginBottom: '8px',
                    }}
                  >
                    {node.name}
                  </h3>
                  <p style={{ fontSize: '14px', color: '#64748b', lineHeight: 1.6 }}>
                    {node.desc}
                  </p>
                </div>
              );
            })}
          </div>
          {/* Back to top */}
          <div style={{ textAlign: 'center' }}>
            <button
              className="back-to-top"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            >
              {backToTopLabel[lang]}
            </button>
          </div>
        </div>
      </section>

      {/* ── Feature Highlights ── */}
      <section id="features" style={{ padding: '80px 24px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h2
            data-sr
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontWeight: 700,
              fontSize: 'clamp(26px, 4vw, 40px)',
              textAlign: 'center',
              marginBottom: '56px',
              color: '#f1f5f9',
              letterSpacing: '-0.5px',
            }}
          >
            {c.features.title}
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '64px' }}>
            {c.features.items.map((feat, i) => {
              const Icon = featureIcons[i];
              const isEven = i % 2 === 0;
              const delays = ['0', '100', '200', '300'] as const;
              return (
                <div
                  key={feat.heading}
                  data-sr
                  data-delay={delays[i]}
                  className="feature-alt-grid"
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '48px',
                    alignItems: 'center',
                  }}
                >
                  {/* Text side */}
                  <div style={{ order: isEven ? 0 : 1 }}>
                    <div
                      style={{
                        width: '52px',
                        height: '52px',
                        borderRadius: '14px',
                        background: 'rgba(59,130,246,0.12)',
                        border: '1px solid rgba(59,130,246,0.25)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: '20px',
                      }}
                    >
                      <Icon size={24} color="#3b82f6" />
                    </div>
                    <h3
                      style={{
                        fontFamily: "'Space Grotesk', sans-serif",
                        fontWeight: 700,
                        fontSize: 'clamp(20px, 3vw, 28px)',
                        color: '#f1f5f9',
                        marginBottom: '14px',
                        letterSpacing: '-0.3px',
                      }}
                    >
                      {feat.heading}
                    </h3>
                    <p
                      style={{
                        fontSize: '17px',
                        color: '#94a3b8',
                        lineHeight: 1.75,
                        fontWeight: 300,
                      }}
                    >
                      {feat.desc}
                    </p>
                  </div>

                  {/* Visual side */}
                  <div
                    style={{
                      order: isEven ? 1 : 0,
                      borderRadius: '16px',
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      padding: '40px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      minHeight: '200px',
                      position: 'relative',
                      overflow: 'hidden',
                    }}
                  >
                    {/* Decorative background dots */}
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        backgroundImage:
                          'radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)',
                        backgroundSize: '24px 24px',
                      }}
                    />
                    <div
                      style={{
                        position: 'relative',
                        width: '80px',
                        height: '80px',
                        borderRadius: '20px',
                        background: 'rgba(59,130,246,0.08)',
                        border: '1px solid rgba(59,130,246,0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 0 40px rgba(59,130,246,0.1)',
                      }}
                    >
                      <Icon size={36} color="#3b82f6" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          {/* Back to top */}
          <div style={{ textAlign: 'center' }}>
            <button
              className="back-to-top"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            >
              {backToTopLabel[lang]}
            </button>
          </div>
        </div>
      </section>

      {/* ── Protocols Grid ── */}
      <section
        id="protocols"
        style={{
          padding: '80px 24px',
          background: 'rgba(255,255,255,0.02)',
        }}
      >
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h2
            data-sr
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontWeight: 700,
              fontSize: 'clamp(26px, 4vw, 40px)',
              textAlign: 'center',
              marginBottom: '10px',
              color: '#f1f5f9',
              letterSpacing: '-0.5px',
            }}
          >
            {c.protocols.title}
          </h2>
          <p
            data-sr
            data-delay="100"
            style={{
              textAlign: 'center',
              color: '#64748b',
              fontSize: '16px',
              marginBottom: '48px',
            }}
          >
            {c.protocols.sub}
          </p>

          <div
            data-sr
            data-delay="200"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: '12px',
            }}
          >
            {protocols.map((proto) => (
              <div
                key={proto.name}
                className="protocol-chip"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  borderRadius: '12px',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  padding: '14px 16px',
                  transition: 'background 0.2s ease',
                  cursor: 'default',
                  borderLeft: `3px solid ${proto.color}`,
                }}
              >
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontFamily: "'Space Grotesk', sans-serif",
                      fontWeight: 600,
                      fontSize: '15px',
                      color: '#e2e8f0',
                      marginBottom: '3px',
                    }}
                  >
                    {proto.name}
                  </div>
                  <div
                    style={{
                      fontSize: '12px',
                      color: proto.color,
                      fontWeight: 500,
                    }}
                  >
                    {proto.type === 'sync' ? c.protocols.sync : c.protocols.async}
                  </div>
                </div>
                <div
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: proto.color,
                    flexShrink: 0,
                    boxShadow: `0 0 6px ${proto.color}80`,
                  }}
                />
              </div>
            ))}
          </div>
          {/* Back to top */}
          <div style={{ textAlign: 'center' }}>
            <button
              className="back-to-top"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            >
              {backToTopLabel[lang]}
            </button>
          </div>
        </div>
      </section>

      {/* ── Security Section ── */}
      <section id="security" style={{ padding: '80px 24px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h2
            data-sr
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontWeight: 700,
              fontSize: 'clamp(26px, 4vw, 40px)',
              textAlign: 'center',
              marginBottom: '48px',
              color: '#f1f5f9',
              letterSpacing: '-0.5px',
            }}
          >
            {c.security.title}
          </h2>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: '20px',
            }}
          >
            {c.security.items.map((item, i) => {
              const Icon = securityIcons[i];
              const secDelays = ['0', '100', '200', '300'] as const;
              return (
                <div
                  key={item.name}
                  data-sr
                  data-delay={secDelays[i]}
                  className="security-card"
                  style={{
                    borderRadius: '16px',
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    padding: '28px 24px',
                    transition: 'all 0.2s ease',
                    cursor: 'default',
                  }}
                >
                  <div
                    style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '12px',
                      background: 'rgba(34,197,94,0.1)',
                      border: '1px solid rgba(34,197,94,0.25)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: '16px',
                    }}
                  >
                    <Icon size={20} color="#22c55e" />
                  </div>
                  <h3
                    style={{
                      fontFamily: "'Space Grotesk', sans-serif",
                      fontWeight: 600,
                      fontSize: '16px',
                      color: '#f1f5f9',
                      marginBottom: '8px',
                    }}
                  >
                    {item.name}
                  </h3>
                  <p style={{ fontSize: '14px', color: '#64748b', lineHeight: 1.65 }}>
                    {item.desc}
                  </p>
                </div>
              );
            })}
          </div>
          {/* Back to top */}
          <div style={{ textAlign: 'center' }}>
            <button
              className="back-to-top"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            >
              {backToTopLabel[lang]}
            </button>
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section
        id="how-it-works"
        style={{
          padding: '80px 24px',
          background: 'rgba(255,255,255,0.02)',
        }}
      >
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <h2
            data-sr
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontWeight: 700,
              fontSize: 'clamp(26px, 4vw, 40px)',
              textAlign: 'center',
              marginBottom: '56px',
              color: '#f1f5f9',
              letterSpacing: '-0.5px',
            }}
          >
            {c.howItWorks.title}
          </h2>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '24px',
              position: 'relative',
            }}
          >
            {c.howItWorks.steps.map((step, i) => {
              const stepDelays = ['100', '200', '300'] as const;
              return (
              <div
                key={step.title}
                data-sr
                data-delay={stepDelays[i]}
                className="step-card"
                style={{
                  borderRadius: '16px',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  padding: '32px 24px',
                  textAlign: 'center',
                  transition: 'all 0.2s ease',
                  cursor: 'default',
                  position: 'relative',
                }}
              >
                {/* Step number */}
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #2563eb, #3b82f6)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 20px',
                    fontFamily: "'Space Grotesk', sans-serif",
                    fontWeight: 700,
                    fontSize: '16px',
                    color: '#fff',
                    boxShadow: '0 4px 16px rgba(37,99,235,0.4)',
                  }}
                >
                  {i + 1}
                </div>
                <h3
                  style={{
                    fontFamily: "'Space Grotesk', sans-serif",
                    fontWeight: 600,
                    fontSize: '18px',
                    color: '#f1f5f9',
                    marginBottom: '10px',
                  }}
                >
                  {step.title}
                </h3>
                <p style={{ fontSize: '15px', color: '#64748b', lineHeight: 1.65 }}>
                  {step.desc}
                </p>
              </div>
              );
            })}
          </div>
          {/* Back to top */}
          <div style={{ textAlign: 'center' }}>
            <button
              className="back-to-top"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            >
              {backToTopLabel[lang]}
            </button>
          </div>
        </div>
      </section>

      {/* ── Keyboard Shortcuts ── */}
      {/* ── Final CTA ── */}
      <section
        style={{
          padding: '100px 24px',
          background:
            'radial-gradient(ellipse at 50% 100%, rgba(37,99,235,0.12) 0%, transparent 70%), rgba(255,255,255,0.02)',
          textAlign: 'center',
        }}
      >
        <div data-sr style={{ maxWidth: '700px', margin: '0 auto' }}>
          <h2
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontWeight: 700,
              fontSize: 'clamp(28px, 5vw, 52px)',
              color: '#f1f5f9',
              marginBottom: '16px',
              letterSpacing: '-0.8px',
              lineHeight: 1.2,
            }}
          >
            {c.finalCta.headline}
          </h2>
          <p
            style={{
              fontSize: '18px',
              color: '#64748b',
              marginBottom: '40px',
              fontWeight: 300,
            }}
          >
            {c.finalCta.sub}
          </p>
          <div>
            <Link
              to="/app"
              className="btn-primary"
              style={{
                background: '#f97316',
                color: '#fff',
                borderRadius: '14px',
                padding: '18px 40px',
                fontWeight: 700,
                fontSize: '18px',
                textDecoration: 'none',
                transition: 'all 0.2s ease',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '10px',
                cursor: 'pointer',
                boxShadow: '0 8px 32px rgba(249,115,22,0.3)',
              }}
            >
              {c.finalCta.btn}
              <ChevronRight size={20} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer
        style={{
          background: '#0a0f1a',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          padding: '40px 24px',
        }}
      >
        <div
          style={{
            maxWidth: '1200px',
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '20px',
          }}
        >
          {/* Logo + tagline */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
              <img
                src={logoIcon}
                alt="MicroFlow Architect logo"
                style={{ width: '28px', height: '28px', borderRadius: '6px', objectFit: 'cover' }}
              />
              <span
                style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontWeight: 700,
                  fontSize: '16px',
                  color: '#e2e8f0',
                }}
              >
                MicroFlow Architect
              </span>
            </div>
            <p style={{ fontSize: '13px', color: '#475569' }}>{c.footer.tagline}</p>
          </div>

          {/* Right side */}
          <div style={{ textAlign: 'right' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                justifyContent: 'flex-end',
                marginBottom: '6px',
                fontSize: '13px',
                color: '#475569',
              }}
            >
              <span>{c.footer.madeWith}</span>
              <Heart size={13} color="#f97316" fill="#f97316" aria-label="love" />
              <span>{c.footer.forArchitects}</span>
            </div>
            <p style={{ fontSize: '13px', color: '#334155' }}>{c.footer.copy}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
