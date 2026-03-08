/**
 * OnboardingTour — interactive 7-step guided tour.
 * Triggered on first login or via "?" help button.
 */
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

const STORAGE_KEY = 'alphadata_onboarding_v1';

interface TourStep {
  selector: string;       // CSS selector to highlight
  title: string;
  text: string;
  position?: 'bottom' | 'top' | 'left' | 'right';
}

const TOUR_STEPS: TourStep[] = [
  {
    selector: '[data-tour="kpi-cards"]',
    title: 'Indicadores-Chave',
    text: 'Aqui encontra os indicadores-chave de produção de Angola em tempo real.',
  },
  {
    selector: '[data-tour="production-chart"]',
    title: 'Análise de Produção',
    text: 'Análise detalhada por bloco, operadora e bacia. Use os filtros de data para explorar tendências.',
  },
  {
    selector: '[data-tour="3d-well"]',
    title: 'Simulação de Poços 3D',
    text: 'Visualização 3D interactiva dos poços. Importe ficheiros LAS, SEG-Y ou ECLIPSE para análise avançada.',
  },
  {
    selector: '[data-tour="ai-chat"]',
    title: 'Analista IA',
    text: 'Faça qualquer pergunta em linguagem natural. A IA responde com dados reais e gera gráficos automaticamente.',
  },
  {
    selector: '[data-tour="risk-index"]',
    title: 'Riscos e Geopolítica',
    text: 'Índice multidimensional de risco por bloco, actualizado com eventos regulatórios e geopolíticos.',
  },
  {
    selector: '[data-tour="export-btn"]',
    title: 'Exportação de Dados',
    text: 'Exporte qualquer dado em PDF, Excel ou JSON com um clique.',
  },
  {
    selector: '[data-tour="workspace"]',
    title: 'Workspaces',
    text: 'Crie workspaces personalizados para partilhar análises com a sua equipa.',
  },
];

interface OnboardingTourProps {
  forceShow?: boolean;
  onComplete?: () => void;
}

export function OnboardingTour({ forceShow = false, onComplete }: OnboardingTourProps) {
  const [active, setActive] = useState(false);
  const [step, setStep] = useState(0);
  const [highlightRect, setHighlightRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    if (forceShow) {
      setActive(true);
      setStep(0);
      return;
    }
    const seen = localStorage.getItem(STORAGE_KEY);
    if (!seen) {
      // Delay to let page render
      const timer = setTimeout(() => setActive(true), 1500);
      return () => clearTimeout(timer);
    }
  }, [forceShow]);

  const updateHighlight = useCallback(() => {
    if (!active) return;
    const currentStep = TOUR_STEPS[step];
    if (!currentStep) return;
    const el = document.querySelector(currentStep.selector);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => {
        setHighlightRect(el.getBoundingClientRect());
      }, 400);
    } else {
      setHighlightRect(null);
    }
  }, [active, step]);

  useEffect(() => {
    updateHighlight();
    window.addEventListener('resize', updateHighlight);
    return () => window.removeEventListener('resize', updateHighlight);
  }, [updateHighlight]);

  const finish = useCallback(() => {
    setActive(false);
    localStorage.setItem(STORAGE_KEY, 'true');
    onComplete?.();
  }, [onComplete]);

  const next = () => {
    if (step >= TOUR_STEPS.length - 1) {
      finish();
    } else {
      setStep(s => s + 1);
    }
  };

  const prev = () => {
    if (step > 0) setStep(s => s - 1);
  };

  if (!active) return null;

  const currentStep = TOUR_STEPS[step];
  const pad = 8;

  // Tooltip position
  const tooltipStyle: React.CSSProperties = {};
  if (highlightRect) {
    tooltipStyle.position = 'fixed';
    tooltipStyle.top = highlightRect.bottom + pad + 12;
    tooltipStyle.left = Math.max(16, Math.min(highlightRect.left, window.innerWidth - 340));
    // If tooltip would overflow bottom, place above
    if (highlightRect.bottom + 220 > window.innerHeight) {
      tooltipStyle.top = Math.max(16, highlightRect.top - 200);
    }
  } else {
    tooltipStyle.position = 'fixed';
    tooltipStyle.top = '50%';
    tooltipStyle.left = '50%';
    tooltipStyle.transform = 'translate(-50%, -50%)';
  }

  return (
    <AnimatePresence>
      {active && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9998]"
            style={{ background: 'rgba(0,0,0,0.65)' }}
            onClick={finish}
          />

          {/* Highlight cutout */}
          {highlightRect && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="fixed z-[9999] pointer-events-none rounded-xl"
              style={{
                top: highlightRect.top - pad,
                left: highlightRect.left - pad,
                width: highlightRect.width + pad * 2,
                height: highlightRect.height + pad * 2,
                border: '2px solid rgba(0,163,255,0.8)',
                boxShadow: '0 0 0 9999px rgba(0,0,0,0.65), 0 0 30px rgba(0,163,255,0.3)',
              }}
            />
          )}

          {/* Tooltip card */}
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.25 }}
            className="fixed z-[10000] w-80 rounded-xl p-5 shadow-2xl"
            style={{
              ...tooltipStyle,
              background: '#0D1117',
              border: '1px solid #00A3FF',
            }}
          >
            {/* Step counter */}
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#00A3FF]">
                {currentStep.title}
              </span>
              <span className="text-[10px] font-mono text-[#6B7A99]">
                {step + 1} / {TOUR_STEPS.length}
              </span>
            </div>

            <p className="text-sm text-[#E8EDF5] leading-relaxed mb-5">
              {currentStep.text}
            </p>

            <div className="flex items-center justify-between">
              <button
                onClick={finish}
                className="text-[10px] font-medium text-[#6B7A99] hover:text-[#E8EDF5] transition-colors"
              >
                Saltar tour
              </button>

              <div className="flex items-center gap-2">
                {step > 0 && (
                  <button
                    onClick={prev}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-[#6B7A99] hover:text-[#E8EDF5] hover:bg-[rgba(255,255,255,0.05)] transition-all"
                  >
                    <ChevronLeft className="w-3 h-3" /> Anterior
                  </button>
                )}
                <button
                  onClick={next}
                  className="flex items-center gap-1 px-4 py-1.5 rounded-lg text-xs font-semibold text-white transition-all"
                  style={{ background: '#00A3FF' }}
                >
                  {step === TOUR_STEPS.length - 1 ? 'Concluir' : 'Próximo'}
                  {step < TOUR_STEPS.length - 1 && <ChevronRight className="w-3 h-3" />}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/** Hook to trigger tour from anywhere */
export function useOnboardingTour() {
  const [showTour, setShowTour] = useState(false);
  const trigger = useCallback(() => setShowTour(true), []);
  const reset = useCallback(() => setShowTour(false), []);
  return { showTour, trigger, reset };
}
