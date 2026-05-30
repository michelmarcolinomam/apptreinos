import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Check, RotateCcw, Trophy, Flame, Coffee, Activity, Zap, Wind,
  Dumbbell, BarChart3, Layers, ChevronRight, Target, TrendingUp,
  AlertTriangle, CheckCircle2, Lock, Edit3
} from 'lucide-react';
import {
  PieChart, Pie, Cell, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid
} from 'recharts';

// =====================================================================
// PERIODIZAÇÃO
// =====================================================================
const BLOCK_INFO = {
  hypertrophy: {
    label: 'HIPERTROFIA', short: 'HIP', weeks: '1–5',
    description: '70-75% 1RM · Volume alto · 8-12 reps',
    color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.08)', border: '#422006',
    goal: 'Construir e preservar massa magra com alto volume e cargas moderadas. Faixa clássica de hipertrofia.',
    intensity: '70-75% 1RM', reps: '8-12 reps', sets: '4 séries por exercício',
    rir: 'RIR 2-3 (longe da falha)',
    rest: '60-90s entre séries de isoladores · 90-120s entre compostos',
    expect: 'Sair estimulado, não destruído. Bom pump, queimação muscular. Cargas devem subir levemente ou reps aumentar ao longo das 5 semanas.',
    tips: [
      'Foca na execução perfeita — em déficit, qualidade > quantidade',
      'Tenta subir 1 rep ou 2,5kg semana após semana nos compostos',
      'Se não conseguir progredir, ok — manter já é vitória em déficit',
    ],
  },
  deload: {
    label: 'DELOAD', short: 'DEL', weeks: '6',
    description: '50-55% 1RM · Volume baixo · Longe da falha',
    color: '#60a5fa', bg: 'rgba(96, 165, 250, 0.08)', border: '#1e3a5f',
    goal: 'Recuperar SNC, articulações e tendões. Manter padrão de movimento sem fadiga. Preparar pro bloco pesado.',
    intensity: '50-55% 1RM', reps: '8-12 reps', sets: '2 séries por exercício',
    rir: 'RIR 4-5 (muito longe da falha)',
    rest: 'O que precisar — sem pressa',
    expect: 'Treino fácil, sem dor muscular tardia (DOMS). Vai parecer que está fazendo pouco — é justamente esse o objetivo.',
    tips: [
      'NÃO compense fazendo mais — segue o protocolo à risca',
      'Foco em mobilidade e qualidade de movimento',
      'Use a semana pra dormir mais e melhorar a dieta',
      'A tentação vai ser "mais um pouquinho" — resista',
    ],
  },
  intensification: {
    label: 'INTENSIFICAÇÃO', short: 'INT', weeks: '7–8',
    description: 'Compostos 85-90% · Isoladores 75-80%',
    color: '#ef4444', bg: 'rgba(239, 68, 68, 0.08)', border: '#7f1d1d',
    goal: 'Preservar massa magra com sinal forte de força. Em déficit, ganhar força é difícil — manter já preserva muito músculo.',
    intensity: 'Compostos 85-90% · Isoladores 75-80%',
    reps: 'Compostos 5-6 reps · Isoladores 8 reps',
    sets: '3 séries por exercício',
    rir: 'RIR 1-2 nos compostos · RIR 2-3 nos isoladores',
    rest: '2-3min entre séries de compostos · 60-90s nos isoladores',
    expect: 'Cargas pesadas. Vai precisar de mais aquecimento. Recuperação entre sessões será mais lenta — respeita.',
    tips: [
      'Aquece bem antes dos compostos pesados',
      'Use cintos e munhequeiras se já estiver acostumado',
      'Se o sono ou a dieta estiver ruim, REGREDE a carga em 5% pra evitar lesão',
      '90% 1RM em compostos é território delicado — não tenta PR em dia ruim',
    ],
  },
};

function getBlock(week) {
  if (week >= 1 && week <= 5) return 'hypertrophy';
  if (week === 6) return 'deload';
  return 'intensification';
}

// =====================================================================
// EXERCÍCIOS
// =====================================================================
const compound = (id, name, hyp, dl, intens) => ({
  id, name, type: 'compound', hypertrophy: hyp, deload: dl, intensification: intens,
});
const isolator = (id, name, hyp, dl, intens) => ({
  id, name, type: 'isolator', hypertrophy: hyp, deload: dl, intensification: intens,
});

const WORKOUT_PLAN = {
  monday: {
    name: 'Segunda', short: 'SEG', focus: 'Costas',
    exercises: [
      { id: 'mon-warm', name: 'Ativação', isWarmup: true },
      compound('mon-barra-fixa', 'Barra fixa',
        { sets: 4, reps: 8, weight: null }, { sets: 2, reps: 8, weight: null }, { sets: 3, reps: 5, weight: null }),
      compound('mon-remada-sent', 'Remada sentado',
        { sets: 4, reps: 10, weight: 60 }, { sets: 2, reps: 10, weight: 45 }, { sets: 3, reps: 6, weight: 75 }),
      isolator('mon-puxada-uni', 'Puxada Unilateral Polia',
        { sets: 4, reps: 10, weight: 25 }, { sets: 2, reps: 10, weight: 17.5 }, { sets: 3, reps: 8, weight: 27.5 }),
      compound('mon-remada-curv', 'Remada curvada pegada invertida',
        { sets: 4, reps: 10, weight: 50 }, { sets: 2, reps: 10, weight: 37.5 }, { sets: 3, reps: 6, weight: 60 }),
      compound('mon-puxador', 'Puxador frontal',
        { sets: 4, reps: 10, weight: 60 }, { sets: 2, reps: 10, weight: 45 }, { sets: 3, reps: 6, weight: 75 }),
      isolator('mon-pulldown', 'Pull-down corda',
        { sets: 4, reps: 10, weight: 30 }, { sets: 2, reps: 10, weight: 22.5 }, { sets: 3, reps: 8, weight: 35 }),
      isolator('mon-voador-inv', 'Voador Invertido',
        { sets: 4, reps: 10, weight: 30 }, { sets: 2, reps: 10, weight: 22.5 }, { sets: 3, reps: 8, weight: 35 }),
    ],
  },
  tuesday: {
    name: 'Terça', short: 'TER', focus: 'Peito',
    exercises: [
      { id: 'tue-warm', name: 'Ativação', isWarmup: true },
      compound('tue-supino-reto', 'Supino Reto Barra',
        { sets: 4, reps: 10, weight: 70 }, { sets: 2, reps: 10, weight: 55 }, { sets: 3, reps: 6, weight: 85 }),
      compound('tue-supino-inc', 'Supino Inclinado Halteres',
        { sets: 4, reps: 10, weight: 45 }, { sets: 2, reps: 10, weight: 35 }, { sets: 3, reps: 6, weight: 55 }),
      compound('tue-supino-dec', 'Supino Declinado',
        { sets: 4, reps: 10, weight: 50 }, { sets: 2, reps: 10, weight: 37.5 }, { sets: 3, reps: 6, weight: 60 }),
      isolator('tue-cross-alta', 'Crossover Polia Alta',
        { sets: 4, reps: 10, weight: 40 }, { sets: 2, reps: 10, weight: 30 }, { sets: 3, reps: 8, weight: 45 }),
      isolator('tue-cross-media', 'Crossover Polia Média',
        { sets: 4, reps: 10, weight: 40 }, { sets: 2, reps: 10, weight: 30 }, { sets: 3, reps: 8, weight: 45 }),
      isolator('tue-cross-baixa', 'Crossover Polia Baixa',
        { sets: 4, reps: 10, weight: 30 }, { sets: 2, reps: 10, weight: 22.5 }, { sets: 3, reps: 8, weight: 35 }),
    ],
  },
  wednesday: {
    name: 'Quarta', short: 'QUA', focus: 'Cadeia Posterior',
    exercises: [
      { id: 'wed-warm', name: 'Ativação', isWarmup: true },
      compound('wed-deadlift', 'Deadlift hexagonal',
        { sets: 4, reps: 10, weight: 130 }, { sets: 2, reps: 10, weight: 100 }, { sets: 3, reps: 6, weight: 160 }),
      compound('wed-stiff', 'Stiff',
        { sets: 4, reps: 10, weight: 60 }, { sets: 2, reps: 10, weight: 45 }, { sets: 3, reps: 6, weight: 75 }),
      compound('wed-pelvica', 'Elevação pélvica',
        { sets: 4, reps: 8, weight: 100 }, { sets: 2, reps: 8, weight: 75 }, { sets: 3, reps: 6, weight: 115 }),
      isolator('wed-flexora', 'Cadeira Flexora',
        { sets: 4, reps: 10, weight: 60 }, { sets: 2, reps: 10, weight: 45 }, { sets: 3, reps: 8, weight: 65 }),
      isolator('wed-extensora', 'Cadeira Extensora',
        { sets: 4, reps: 10, weight: 70 }, { sets: 2, reps: 10, weight: 52.5 }, { sets: 3, reps: 8, weight: 80 }),
      isolator('wed-panturrilha', 'Panturrilha',
        { sets: 3, reps: 12, weight: 50 }, { sets: 2, reps: 12, weight: 37.5 }, { sets: 3, reps: 10, weight: 57.5 }),
    ],
  },
  thursday: {
    name: 'Quinta', short: 'QUI', focus: 'Ombro + Braço',
    exercises: [
      { id: 'thu-warm', name: 'Ativação', isWarmup: true },
      compound('thu-desenv', 'Desenvolvimento Smith',
        { sets: 4, reps: 10, weight: 40 }, { sets: 2, reps: 10, weight: 30 }, { sets: 3, reps: 6, weight: 50 }),
      isolator('thu-elev-lat', 'Elevação lateral halteres',
        { sets: 4, reps: 10, weight: 24 }, { sets: 2, reps: 10, weight: 18 }, { sets: 3, reps: 8, weight: 28 }),
      isolator('thu-elev-front', 'Elevação frontal polia corda',
        { sets: 4, reps: 10, weight: 25 }, { sets: 2, reps: 10, weight: 17.5 }, { sets: 3, reps: 8, weight: 27.5 }),
      isolator('thu-voador-inv', 'Voador invertido',
        { sets: 4, reps: 10, weight: 30 }, { sets: 2, reps: 10, weight: 22.5 }, { sets: 3, reps: 8, weight: 35 }),
      isolator('thu-rosca-conc', 'Rosca concentrada banco',
        { sets: 4, reps: 10, weight: 12 }, { sets: 2, reps: 10, weight: 9 }, { sets: 3, reps: 8, weight: 14 }),
      isolator('thu-bi-polia', 'Bíceps polia',
        { sets: 4, reps: 10, weight: 35 }, { sets: 2, reps: 10, weight: 25 }, { sets: 3, reps: 8, weight: 40 }),
      isolator('thu-bi-martelo', 'Bíceps martelo',
        { sets: 4, reps: 10, weight: 25 }, { sets: 2, reps: 10, weight: 18 }, { sets: 3, reps: 8, weight: 28 }),
      isolator('thu-tri-corda', 'Tríceps corda',
        { sets: 4, reps: 10, weight: 30 }, { sets: 2, reps: 10, weight: 22.5 }, { sets: 3, reps: 8, weight: 35 }),
      isolator('thu-tri-coice', 'Tríceps coice unilateral polia',
        { sets: 4, reps: 10, weight: 12 }, { sets: 2, reps: 10, weight: 9 }, { sets: 3, reps: 8, weight: 14 }),
      isolator('thu-tri-frances', 'Tríceps francês polia',
        { sets: 4, reps: 10, weight: 25 }, { sets: 2, reps: 10, weight: 18 }, { sets: 3, reps: 8, weight: 28 }),
    ],
  },
  friday: { name: 'Sexta', short: 'SEX', focus: 'Tênis', sportOnly: true, description: 'Aula de tênis 16h–18h' },
  saturday: {
    name: 'Sábado', short: 'SAB', focus: 'Tênis + Mescla',
    sportNote: 'Aula de tênis 08h–10h',
    exercises: [
      compound('sat-supino-dec', 'Supino Declinado',
        { sets: 4, reps: 10, weight: 50 }, { sets: 2, reps: 10, weight: 37.5 }, { sets: 3, reps: 6, weight: 60 }),
      compound('sat-supino-reto', 'Supino Reto Barra',
        { sets: 4, reps: 10, weight: 70 }, { sets: 2, reps: 10, weight: 55 }, { sets: 3, reps: 6, weight: 85 }),
      isolator('sat-pulldown', 'Pull-down corda',
        { sets: 4, reps: 10, weight: 30 }, { sets: 2, reps: 10, weight: 22.5 }, { sets: 3, reps: 8, weight: 35 }),
      compound('sat-remada-sent', 'Remada sentado',
        { sets: 4, reps: 10, weight: 60 }, { sets: 2, reps: 10, weight: 45 }, { sets: 3, reps: 6, weight: 75 }),
      isolator('sat-voador-inv', 'Voador Invertido',
        { sets: 4, reps: 10, weight: 30 }, { sets: 2, reps: 10, weight: 22.5 }, { sets: 3, reps: 8, weight: 35 }),
    ],
  },
  sunday: { name: 'Domingo', short: 'DOM', focus: 'OFF', isRest: true },
};

const DAY_ORDER = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const STORAGE_KEY = 'tracker-periodized-v3';
const TOTAL_WEEKS = 8;

function getConfig(exercise, week) {
  if (exercise.isWarmup) return null;
  return exercise[getBlock(week)];
}

const setKey = (w, d, ex, i) => `${w}:${d}:${ex}:${i}`;
const completionKey = (w, d) => `${w}:${d}`;
const todayKey = () => ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'][new Date().getDay()];

function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const hour = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${day}/${month} · ${hour}:${min}`;
}

// =====================================================================
// MAIN APP
// =====================================================================
export default function App() {
  const [log, setLog] = useState({});
  const [completions, setCompletions] = useState({}); // {weekDayKey: {completedAt: iso}}
  const [loaded, setLoaded] = useState(false);
  const [currentWeek, setCurrentWeek] = useState(1);
  const [currentDay, setCurrentDay] = useState(todayKey);
  const [showReset, setShowReset] = useState(false);
  const [tab, setTab] = useState('training');
  const [confirmComplete, setConfirmComplete] = useState(null); // {missing: n}

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const p = JSON.parse(raw);
        if (p.log) setLog(p.log);
        if (p.completions) setCompletions(p.completions);
        if (p.currentWeek) setCurrentWeek(p.currentWeek);
      }
    } catch (e) {}
    finally { setLoaded(true); }
  }, []);

  useEffect(() => {
    if (!loaded) return;
    const t = setTimeout(() => {
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ log, completions, currentWeek })); }
      catch (e) { console.error('save fail', e); }
    }, 400);
    return () => clearTimeout(t);
  }, [log, completions, currentWeek, loaded]);

  const dayLocked = useCallback((week, day) => !!completions[completionKey(week, day)], [completions]);

  const updateSet = useCallback((w, d, ex, i, field, val) => {
    if (dayLocked(w, d)) return;
    setLog(prev => ({ ...prev, [setKey(w,d,ex,i)]: { ...(prev[setKey(w,d,ex,i)] || {}), [field]: val } }));
  }, [dayLocked]);

  const toggleDone = useCallback((w, d, ex, i) => {
    if (dayLocked(w, d)) return;
    setLog(prev => ({ ...prev, [setKey(w,d,ex,i)]: { ...(prev[setKey(w,d,ex,i)] || {}), done: !prev[setKey(w,d,ex,i)]?.done } }));
  }, [dayLocked]);

  const fillTargets = useCallback((week, day, exercise) => {
    if (dayLocked(week, day)) return;
    const cfg = getConfig(exercise, week);
    if (!cfg) return;
    setLog(prev => {
      const next = { ...prev };
      for (let i = 0; i < cfg.sets; i++) {
        next[setKey(week, day, exercise.id, i)] = {
          reps: String(cfg.reps),
          weight: cfg.weight != null ? String(cfg.weight) : '',
          done: true,
        };
      }
      return next;
    });
  }, [dayLocked]);

  const completeDay = useCallback((week, day) => {
    setCompletions(prev => ({ ...prev, [completionKey(week, day)]: { completedAt: new Date().toISOString() } }));
    setConfirmComplete(null);
  }, []);

  const unlockDay = useCallback((week, day) => {
    setCompletions(prev => {
      const next = { ...prev };
      delete next[completionKey(week, day)];
      return next;
    });
  }, []);

  const tryCompleteDay = useCallback((week, day) => {
    const dInfo = WORKOUT_PLAN[day];
    if (!dInfo.exercises) {
      completeDay(week, day);
      return;
    }
    let total = 0, done = 0;
    dInfo.exercises.forEach(ex => {
      const cfg = getConfig(ex, week);
      if (!cfg) return;
      for (let i = 0; i < cfg.sets; i++) {
        total++;
        if (log[setKey(week, day, ex.id, i)]?.done) done++;
      }
    });
    const missing = total - done;
    if (missing > 0) {
      setConfirmComplete({ week, day, missing, total });
    } else {
      completeDay(week, day);
    }
  }, [log, completeDay]);

  const resetAll = useCallback(() => {
    setLog({}); setCompletions({}); setCurrentWeek(1); setShowReset(false);
    try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}
  }, []);

  // STATS
  const weekStats = useMemo(() => {
    const s = {};
    for (let w = 1; w <= TOTAL_WEEKS; w++) {
      let total = 0, done = 0, tonnage = 0;
      DAY_ORDER.forEach(d => {
        const day = WORKOUT_PLAN[d];
        if (!day.exercises) return;
        day.exercises.forEach(ex => {
          const cfg = getConfig(ex, w);
          if (!cfg) return;
          for (let i = 0; i < cfg.sets; i++) {
            total++;
            const entry = log[setKey(w, d, ex.id, i)];
            if (entry?.done) {
              done++;
              const wt = parseFloat(entry.weight) || 0;
              const rp = parseFloat(entry.reps) || 0;
              tonnage += wt * rp;
            }
          }
        });
      });
      s[w] = { total, done, pct: total > 0 ? Math.round((done/total)*100) : 0, tonnage: Math.round(tonnage) };
    }
    return s;
  }, [log]);

  const overallStats = useMemo(() => {
    let total = 0, done = 0, tonnage = 0;
    for (let w = 1; w <= TOTAL_WEEKS; w++) {
      total += weekStats[w]?.total || 0;
      done += weekStats[w]?.done || 0;
      tonnage += weekStats[w]?.tonnage || 0;
    }
    return { total, done, tonnage, pct: total > 0 ? Math.round((done/total)*100) : 0 };
  }, [weekStats]);

  const dayCompletion = useCallback((week, dayKey) => {
    const day = WORKOUT_PLAN[dayKey];
    if (!day.exercises) return null;
    let total = 0, done = 0;
    day.exercises.forEach(ex => {
      const cfg = getConfig(ex, week);
      if (!cfg) return;
      for (let i = 0; i < cfg.sets; i++) {
        total++;
        if (log[setKey(week, dayKey, ex.id, i)]?.done) done++;
      }
    });
    return total > 0 ? Math.round((done/total)*100) : 0;
  }, [log]);

  if (!loaded) return <div style={S.loadingScreen}><div style={S.loadingDot}/></div>;

  const block = getBlock(currentWeek);
  const blockInfo = BLOCK_INFO[block];

  return (
    <div style={S.app}>
      <style>{globalCSS}</style>
      <div style={S.grain}/>

      <header style={S.header}>
        <div style={S.headerInner}>
          <div>
            <div style={S.tagline}>PROTOCOLO · 8 SEMANAS · 3 BLOCOS</div>
            <h1 style={S.title}>DEFINIÇÃO</h1>
            <div style={S.subtitle}>Periodização linear</div>
          </div>
          <button onClick={() => setShowReset(true)} style={S.resetBtn} title="Resetar tudo">
            <RotateCcw size={14}/>
          </button>
        </div>
      </header>

      <div style={S.tabBar}>
        <div style={S.tabBarInner}>
          {[
            { id: 'training', label: 'TREINO', icon: Dumbbell },
            { id: 'progress', label: 'PROGRESSO', icon: BarChart3 },
            { id: 'phases', label: 'FASES', icon: Layers },
          ].map(t => {
            const TIcon = t.icon;
            const active = tab === t.id;
            return (
              <button key={t.id} onClick={() => setTab(t.id)}
                style={{ ...S.tabBtn, ...(active ? { ...S.tabBtnActive, color: blockInfo.color, borderBottomColor: blockInfo.color } : {}) }}>
                <TIcon size={14}/>
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {tab === 'training' && (
        <TrainingTab
          currentWeek={currentWeek} setCurrentWeek={setCurrentWeek}
          currentDay={currentDay} setCurrentDay={setCurrentDay}
          weekStats={weekStats} dayCompletion={dayCompletion}
          log={log} completions={completions}
          onUpdate={updateSet} onToggle={toggleDone} onFill={fillTargets}
          onComplete={tryCompleteDay} onUnlock={unlockDay}
          blockInfo={blockInfo} block={block}
        />
      )}
      {tab === 'progress' && (
        <ProgressTab weekStats={weekStats} overallStats={overallStats} log={log} currentWeek={currentWeek} completions={completions}/>
      )}
      {tab === 'phases' && (
        <PhasesTab currentWeek={currentWeek} setCurrentWeek={(w) => { setCurrentWeek(w); setTab('training'); }}/>
      )}

      <footer style={S.footer}>Salva automaticamente · Dados ficam no seu dispositivo</footer>

      {showReset && (
        <div style={S.modalOverlay} onClick={() => setShowReset(false)}>
          <div style={S.modal} onClick={e => e.stopPropagation()}>
            <div style={S.modalTitle}>Resetar tudo?</div>
            <div style={S.modalText}>Apaga todos os registros das 8 semanas. Não dá pra desfazer.</div>
            <div style={S.modalBtns}>
              <button onClick={() => setShowReset(false)} style={S.modalCancel}>Cancelar</button>
              <button onClick={resetAll} style={S.modalConfirm}>Resetar</button>
            </div>
          </div>
        </div>
      )}

      {confirmComplete && (
        <div style={S.modalOverlay} onClick={() => setConfirmComplete(null)}>
          <div style={S.modal} onClick={e => e.stopPropagation()}>
            <div style={S.modalTitle}>Concluir mesmo assim?</div>
            <div style={S.modalText}>
              Faltam <strong style={{ color: '#f59e0b' }}>{confirmComplete.missing} de {confirmComplete.total}</strong> séries não marcadas. Você pode concluir agora ou voltar e marcar as restantes.
            </div>
            <div style={S.modalBtns}>
              <button onClick={() => setConfirmComplete(null)} style={S.modalCancel}>Voltar</button>
              <button onClick={() => completeDay(confirmComplete.week, confirmComplete.day)} style={S.modalConfirmGreen}>
                Concluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// =====================================================================
// TRAINING TAB
// =====================================================================
function TrainingTab({
  currentWeek, setCurrentWeek, currentDay, setCurrentDay,
  weekStats, dayCompletion, log, completions,
  onUpdate, onToggle, onFill, onComplete, onUnlock,
  blockInfo, block
}) {
  const day = WORKOUT_PLAN[currentDay];
  const completion = completions[completionKey(currentWeek, currentDay)];
  const isLocked = !!completion;

  return (
    <>
      <div style={{ ...S.blockBanner, borderColor: blockInfo.color + '60' }}>
        <div style={S.blockBannerInner}>
          <div style={S.blockIconWrap}>
            {block === 'hypertrophy' && <Flame size={18} style={{ color: blockInfo.color }}/>}
            {block === 'deload' && <Wind size={18} style={{ color: blockInfo.color }}/>}
            {block === 'intensification' && <Zap size={18} style={{ color: blockInfo.color }}/>}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ ...S.blockLabel, color: blockInfo.color }}>BLOCO · {blockInfo.label}</div>
            <div style={S.blockDesc}>{blockInfo.description}</div>
          </div>
        </div>
      </div>

      <section style={S.section}>
        <div style={S.sectionLabel}>SEMANA</div>
        <div style={S.weeks}>
          {Array.from({ length: TOTAL_WEEKS }, (_, i) => i + 1).map(w => {
            const isActive = w === currentWeek;
            const wBlock = getBlock(w);
            const pct = weekStats[w]?.pct ?? 0;
            const blockColor = BLOCK_INFO[wBlock].color;
            return (
              <button key={w} onClick={() => setCurrentWeek(w)}
                style={{
                  ...S.weekBtn,
                  ...(isActive ? { background: blockColor, borderColor: blockColor, color: '#0a0a0a' } : { borderTop: `2px solid ${blockColor}` }),
                }}>
                <span style={S.weekNum}>{String(w).padStart(2, '0')}</span>
                <span style={{ ...S.weekPct, color: isActive ? '#0a0a0a' : pct > 0 ? blockColor : '#525252' }}>{pct}%</span>
              </button>
            );
          })}
        </div>
        <div style={S.weekLegend}>
          <span><span style={{ ...S.legendDot, background: BLOCK_INFO.hypertrophy.color }}/>1-5 Hipertrofia</span>
          <span><span style={{ ...S.legendDot, background: BLOCK_INFO.deload.color }}/>6 Deload</span>
          <span><span style={{ ...S.legendDot, background: BLOCK_INFO.intensification.color }}/>7-8 Intensif.</span>
        </div>
      </section>

      <section style={S.section}>
        <div style={S.sectionLabel}>DIA</div>
        <div style={S.days}>
          {DAY_ORDER.map(d => {
            const dInfo = WORKOUT_PLAN[d];
            const isActive = d === currentDay;
            const dCompletion = completions[completionKey(currentWeek, d)];
            const isDayLocked = !!dCompletion;
            return (
              <button key={d} onClick={() => setCurrentDay(d)}
                style={{
                  ...S.dayBtn,
                  ...(isActive ? { ...S.dayBtnActive, borderColor: blockInfo.color } : {}),
                  ...(dInfo.isRest || dInfo.sportOnly ? S.dayBtnRest : {}),
                  ...(isDayLocked ? S.dayBtnDone : {}),
                }}>
                <span style={S.dayShort}>{dInfo.short}</span>
                <span style={S.dayFocus}>{dInfo.focus}</span>
                {isDayLocked && (
                  <span style={S.dayCheckMark}>
                    <Check size={9} strokeWidth={4}/>
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </section>

      {/* COMPLETION BANNER */}
      {isLocked && (
        <div style={S.completionBanner}>
          <div style={S.completionBannerInner}>
            <CheckCircle2 size={20} style={{ color: '#22c55e', flexShrink: 0 }}/>
            <div style={{ flex: 1 }}>
              <div style={S.completionTitle}>TREINO CONCLUÍDO</div>
              <div style={S.completionDate}>{formatDate(completion.completedAt)}</div>
            </div>
            <button onClick={() => onUnlock(currentWeek, currentDay)} style={S.unlockBtn}>
              <Edit3 size={12}/>
              <span>EDITAR</span>
            </button>
          </div>
        </div>
      )}

      <main style={S.main}>
        <div style={S.dayHeader}>
          <div>
            <div style={S.dayHeaderLabel}>{day.name}</div>
            <div style={S.dayHeaderTitle}>{day.focus}</div>
          </div>
          {day.exercises && (
            <div style={S.dayHeaderStat}>
              <div style={{ ...S.statBig, color: isLocked ? '#22c55e' : blockInfo.color }}>
                {dayCompletion(currentWeek, currentDay)}%
              </div>
              <div style={S.statLabel}>completo</div>
            </div>
          )}
        </div>

        {day.isRest && <RestCard/>}
        {day.sportOnly && <SportCard description={day.description}/>}
        {day.exercises && (
          <div style={S.exercises}>
            {day.sportNote && (
              <div style={S.sportNote}><Activity size={14} style={{ color: '#f59e0b' }}/><span>{day.sportNote}</span></div>
            )}
            {day.exercises.map(ex => (
              <ExerciseCard key={ex.id} exercise={ex}
                week={currentWeek} day={currentDay} blockColor={blockInfo.color}
                log={log} locked={isLocked}
                onUpdate={onUpdate} onToggle={onToggle} onFill={onFill}/>
            ))}
          </div>
        )}

        {/* CONCLUIR / EDITAR — só pra dias com exercícios */}
        {day.exercises && (
          <div style={S.completeWrap}>
            {!isLocked ? (
              <button
                onClick={() => onComplete(currentWeek, currentDay)}
                style={{ ...S.completeBtn, background: blockInfo.color }}
              >
                <CheckCircle2 size={18}/>
                <span>CONCLUIR TREINO</span>
              </button>
            ) : (
              <div style={S.completedLine}>
                <Lock size={12} style={{ color: '#525252' }}/>
                <span>Treino trancado · Toque em EDITAR no topo para alterar</span>
              </div>
            )}
          </div>
        )}
      </main>
    </>
  );
}

// =====================================================================
// PROGRESS TAB
// =====================================================================
function ProgressTab({ weekStats, overallStats, log, currentWeek, completions }) {
  const donutData = [
    { name: 'Feito', value: overallStats.done, color: '#22c55e' },
    { name: 'Pendente', value: Math.max(0, overallStats.total - overallStats.done), color: '#1f1f1f' },
  ];

  const weeklyPctData = Array.from({ length: TOTAL_WEEKS }, (_, i) => {
    const w = i + 1;
    const blockKey = getBlock(w);
    return { week: `S${w}`, pct: weekStats[w]?.pct || 0, fill: BLOCK_INFO[blockKey].color };
  });

  const tonnageData = Array.from({ length: TOTAL_WEEKS }, (_, i) => ({
    week: `S${i+1}`, tonnage: weekStats[i+1]?.tonnage || 0,
  }));

  const KEY_EXERCISES = [
    { id: 'tue-supino-reto', name: 'Supino Reto', day: 'tuesday' },
    { id: 'wed-deadlift', name: 'Deadlift Hex', day: 'wednesday' },
    { id: 'thu-desenv', name: 'Desenv Smith', day: 'thursday' },
  ];

  const progressionData = useMemo(() => {
    return Array.from({ length: TOTAL_WEEKS }, (_, i) => {
      const w = i + 1;
      const row = { week: `S${w}` };
      KEY_EXERCISES.forEach(kex => {
        const ex = WORKOUT_PLAN[kex.day].exercises.find(e => e.id === kex.id);
        if (!ex) return;
        const cfg = getConfig(ex, w);
        if (!cfg) return;
        let maxWeight = 0;
        for (let i = 0; i < cfg.sets; i++) {
          const entry = log[setKey(w, kex.day, ex.id, i)];
          if (entry?.done && entry.weight) {
            const wt = parseFloat(entry.weight);
            if (wt > maxWeight) maxWeight = wt;
          }
        }
        if (maxWeight > 0) row[kex.name] = maxWeight;
      });
      return row;
    });
  }, [log]);

  const totalCompletedDays = Object.keys(completions).length;
  const hasAnyData = overallStats.done > 0;

  return (
    <div style={S.progressWrap}>
      <div style={S.statsRow}>
        <StatCard label="DIAS CONCLUÍDOS" value={totalCompletedDays} subvalue="treinos trancados" color="#22c55e"/>
        <StatCard label="SÉRIES FEITAS" value={overallStats.done} subvalue={`de ${overallStats.total}`} color="#f59e0b"/>
        <StatCard label="VOLUME TOTAL" value={`${(overallStats.tonnage/1000).toFixed(1)}t`} subvalue="kg movidos" color="#60a5fa"/>
      </div>

      <div style={S.chartCard}>
        <div style={S.chartHeader}>
          <div>
            <div style={S.chartTitle}>PROGRESSO GERAL</div>
            <div style={S.chartSubtitle}>{overallStats.pct}% das 8 semanas</div>
          </div>
          <Target size={20} style={{ color: '#525252' }}/>
        </div>
        <div style={{ height: 200, position: 'relative' }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={donutData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} dataKey="value" stroke="none">
                {donutData.map((entry, i) => <Cell key={i} fill={entry.color}/>)}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div style={S.donutCenter}>
            <div style={S.donutCenterPct}>{overallStats.pct}%</div>
            <div style={S.donutCenterLabel}>completo</div>
          </div>
        </div>
      </div>

      <div style={S.chartCard}>
        <div style={S.chartHeader}>
          <div>
            <div style={S.chartTitle}>COMPLETUDE POR SEMANA</div>
            <div style={S.chartSubtitle}>% de séries feitas em cada semana</div>
          </div>
          <BarChart3 size={20} style={{ color: '#525252' }}/>
        </div>
        <div style={{ height: 220 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weeklyPctData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="2 4" stroke="#1f1f1f" vertical={false}/>
              <XAxis dataKey="week" stroke="#525252" fontSize={10} tickLine={false}/>
              <YAxis stroke="#525252" fontSize={10} tickLine={false} domain={[0, 100]}/>
              <Tooltip contentStyle={chartTooltipStyle} cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                formatter={(v) => [`${v}%`, 'Completo']}/>
              <Bar dataKey="pct" radius={[4, 4, 0, 0]}>
                {weeklyPctData.map((entry, i) => <Cell key={i} fill={entry.fill}/>)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={S.chartCard}>
        <div style={S.chartHeader}>
          <div>
            <div style={S.chartTitle}>VOLUME SEMANAL</div>
            <div style={S.chartSubtitle}>Tonelagem total (kg × reps)</div>
          </div>
          <TrendingUp size={20} style={{ color: '#525252' }}/>
        </div>
        <div style={{ height: 200 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={tonnageData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="2 4" stroke="#1f1f1f" vertical={false}/>
              <XAxis dataKey="week" stroke="#525252" fontSize={10} tickLine={false}/>
              <YAxis stroke="#525252" fontSize={10} tickLine={false}/>
              <Tooltip contentStyle={chartTooltipStyle} formatter={(v) => [`${v} kg`, 'Volume']}/>
              <Line type="monotone" dataKey="tonnage" stroke="#f59e0b" strokeWidth={2}
                dot={{ fill: '#f59e0b', r: 4 }} activeDot={{ r: 6 }}/>
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div style={S.chartFootnote}>
          Esperado: volume sobe nas semanas 1-5, cai na 6 (deload), sobe novamente em 7-8
        </div>
      </div>

      <div style={S.chartCard}>
        <div style={S.chartHeader}>
          <div>
            <div style={S.chartTitle}>PROGRESSÃO DE CARGA</div>
            <div style={S.chartSubtitle}>Carga máx por sessão · compostos principais</div>
          </div>
          <Dumbbell size={20} style={{ color: '#525252' }}/>
        </div>
        <div style={{ height: 220 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={progressionData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="2 4" stroke="#1f1f1f" vertical={false}/>
              <XAxis dataKey="week" stroke="#525252" fontSize={10} tickLine={false}/>
              <YAxis stroke="#525252" fontSize={10} tickLine={false}/>
              <Tooltip contentStyle={chartTooltipStyle} formatter={(v, n) => [`${v} kg`, n]}/>
              <Line type="monotone" dataKey="Supino Reto" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} connectNulls/>
              <Line type="monotone" dataKey="Deadlift Hex" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} connectNulls/>
              <Line type="monotone" dataKey="Desenv Smith" stroke="#60a5fa" strokeWidth={2} dot={{ r: 3 }} connectNulls/>
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div style={S.chartLegendRow}>
          <span><span style={{ ...S.legendDot, background: '#f59e0b' }}/>Supino Reto</span>
          <span><span style={{ ...S.legendDot, background: '#ef4444' }}/>Deadlift Hex</span>
          <span><span style={{ ...S.legendDot, background: '#60a5fa' }}/>Desenv Smith</span>
        </div>
      </div>

      {!hasAnyData && (
        <div style={S.emptyState}>
          <AlertTriangle size={20} style={{ color: '#525252' }}/>
          <div>Os gráficos vão preencher conforme você registra os treinos. Volte aqui depois da primeira sessão.</div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, subvalue, color }) {
  return (
    <div style={S.statCard}>
      <div style={S.statCardLabel}>{label}</div>
      <div style={{ ...S.statCardValue, color }}>{value}</div>
      <div style={S.statCardSub}>{subvalue}</div>
    </div>
  );
}

// =====================================================================
// PHASES TAB
// =====================================================================
function PhasesTab({ currentWeek, setCurrentWeek }) {
  const [expanded, setExpanded] = useState(getBlock(currentWeek));

  return (
    <div style={S.phasesWrap}>
      <div style={S.phasesIntro}>
        <div style={S.phasesIntroTitle}>OS 3 BLOCOS</div>
        <div style={S.phasesIntroText}>
          Cada bloco tem objetivo, intensidade e volume diferentes. Tocar em um card abre os detalhes.
        </div>
      </div>

      {['hypertrophy', 'deload', 'intensification'].map(key => {
        const phase = BLOCK_INFO[key];
        const isExpanded = expanded === key;
        const isCurrent = getBlock(currentWeek) === key;
        return (
          <div key={key} style={{
            ...S.phaseCard,
            borderColor: isExpanded ? phase.color : '#262626',
            background: isExpanded ? phase.bg : '#141414',
          }}>
            <button onClick={() => setExpanded(isExpanded ? null : key)} style={S.phaseHeader}>
              <div style={{ ...S.phaseIconBig, background: phase.bg, borderColor: phase.border }}>
                {key === 'hypertrophy' && <Flame size={22} style={{ color: phase.color }}/>}
                {key === 'deload' && <Wind size={22} style={{ color: phase.color }}/>}
                {key === 'intensification' && <Zap size={22} style={{ color: phase.color }}/>}
              </div>
              <div style={{ flex: 1, textAlign: 'left' }}>
                <div style={S.phaseHeaderRow}>
                  <div style={{ ...S.phaseLabel, color: phase.color }}>{phase.label}</div>
                  {isCurrent && <div style={{ ...S.phaseBadge, color: phase.color, borderColor: phase.color }}>ATUAL</div>}
                </div>
                <div style={S.phaseWeeks}>SEMANAS {phase.weeks}</div>
                <div style={S.phaseDesc}>{phase.description}</div>
              </div>
              <ChevronRight size={18} style={{
                color: '#525252',
                transform: isExpanded ? 'rotate(90deg)' : 'none',
                transition: 'transform 0.2s'
              }}/>
            </button>

            {isExpanded && (
              <div style={S.phaseDetail}>
                <PhaseRow label="OBJETIVO" value={phase.goal}/>
                <div style={S.phaseGrid}>
                  <PhaseMini label="INTENSIDADE" value={phase.intensity}/>
                  <PhaseMini label="REPS" value={phase.reps}/>
                  <PhaseMini label="SÉRIES" value={phase.sets}/>
                  <PhaseMini label="RIR" value={phase.rir}/>
                </div>
                <PhaseRow label="DESCANSO" value={phase.rest}/>
                <PhaseRow label="O QUE ESPERAR" value={phase.expect}/>

                <div style={S.phaseTipsBox}>
                  <div style={{ ...S.phaseTipsLabel, color: phase.color }}>DICAS</div>
                  <ul style={S.phaseTipsList}>
                    {phase.tips.map((tip, i) => (
                      <li key={i} style={S.phaseTipItem}>
                        <span style={{ ...S.phaseTipDot, background: phase.color }}/>
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  onClick={() => {
                    const targetWeek = key === 'hypertrophy' ? 1 : key === 'deload' ? 6 : 7;
                    setCurrentWeek(targetWeek);
                  }}
                  style={{ ...S.phaseGoBtn, background: phase.color, color: '#0a0a0a' }}
                >
                  IR PARA {key === 'hypertrophy' ? 'SEMANA 1' : key === 'deload' ? 'SEMANA 6' : 'SEMANA 7'}
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function PhaseRow({ label, value }) {
  return (
    <div style={S.phaseRowBlock}>
      <div style={S.phaseRowLabel}>{label}</div>
      <div style={S.phaseRowValue}>{value}</div>
    </div>
  );
}
function PhaseMini({ label, value }) {
  return (
    <div style={S.phaseMini}>
      <div style={S.phaseRowLabel}>{label}</div>
      <div style={S.phaseMiniValue}>{value}</div>
    </div>
  );
}

// =====================================================================
// EXERCISE CARD
// =====================================================================
function ExerciseCard({ exercise, week, day, blockColor, log, locked, onUpdate, onToggle, onFill }) {
  if (exercise.isWarmup) {
    return (
      <div style={S.warmupCard}>
        <Flame size={14} style={{ color: '#f59e0b' }}/>
        <span style={S.warmupText}>{exercise.name}</span>
      </div>
    );
  }

  const cfg = getConfig(exercise, week);
  const sets = cfg.sets;
  const isCompound = exercise.type === 'compound';

  const allDone = useMemo(() => {
    for (let i = 0; i < sets; i++) {
      if (!log[setKey(week, day, exercise.id, i)]?.done) return false;
    }
    return sets > 0;
  }, [log, week, day, exercise.id, sets]);

  const lastWeekBest = useMemo(() => {
    if (week === 1) return null;
    const prevCfg = getConfig(exercise, week - 1);
    if (!prevCfg) return null;
    let best = null;
    for (let i = 0; i < prevCfg.sets; i++) {
      const entry = log[setKey(week - 1, day, exercise.id, i)];
      if (entry?.done && entry.weight) {
        const w = parseFloat(entry.weight);
        const r = parseFloat(entry.reps) || 0;
        if (!best || w > best.weight || (w === best.weight && r > best.reps)) {
          best = { weight: w, reps: r };
        }
      }
    }
    return best;
  }, [log, week, day, exercise.id]);

  return (
    <div style={{
      ...S.exCard,
      ...(allDone ? { borderColor: '#14532d', background: 'rgba(34, 197, 94, 0.04)' } : {}),
      ...(locked ? { opacity: 0.85 } : {}),
    }}>
      <div style={S.exHeader}>
        <div style={S.exNameWrap}>
          <div style={S.exNameRow}>
            <span style={S.exName}>{exercise.name}</span>
            <span style={{
              ...S.exTypeTag,
              color: isCompound ? '#f59e0b' : '#737373',
              borderColor: isCompound ? '#422006' : '#262626',
            }}>{isCompound ? 'COMP' : 'ISO'}</span>
          </div>
          <div style={{ ...S.exTarget, color: blockColor }}>
            {cfg.sets}×{cfg.reps}{cfg.weight != null && ` · ${cfg.weight}kg`}
          </div>
        </div>
        {!locked && (
          <button onClick={() => onFill(week, day, exercise)} style={S.fillBtn}>AUTO</button>
        )}
      </div>

      {lastWeekBest && (
        <div style={S.lastWeek}>
          <Trophy size={11} style={{ color: '#737373' }}/>
          <span>Sem. {week - 1}: {lastWeekBest.reps} reps × {lastWeekBest.weight}kg</span>
        </div>
      )}

      <div style={S.setsGrid}>
        <div style={S.setsHeader}>
          <span style={S.setsHeaderCell}>SET</span>
          <span style={S.setsHeaderCell}>REPS</span>
          <span style={S.setsHeaderCell}>KG</span>
          <span style={S.setsHeaderCell}>✓</span>
        </div>
        {Array.from({ length: sets }, (_, i) => {
          const k = setKey(week, day, exercise.id, i);
          const entry = log[k] || {};
          const done = !!entry.done;
          return (
            <div key={i} style={S.setRow}>
              <span style={S.setIdx}>{i + 1}</span>
              <input type="text" inputMode="numeric"
                value={entry.reps ?? ''} disabled={locked}
                onChange={e => onUpdate(week, day, exercise.id, i, 'reps', e.target.value)}
                placeholder={String(cfg.reps)}
                style={{ ...S.input, ...(locked ? S.inputLocked : {}) }}/>
              <input type="text" inputMode="decimal"
                value={entry.weight ?? ''} disabled={locked}
                onChange={e => onUpdate(week, day, exercise.id, i, 'weight', e.target.value)}
                placeholder={cfg.weight != null ? String(cfg.weight) : '—'}
                style={{ ...S.input, ...(locked ? S.inputLocked : {}) }}/>
              <button onClick={() => onToggle(week, day, exercise.id, i)} disabled={locked}
                style={{ ...S.checkBtn, ...(done ? S.checkBtnDone : {}), ...(locked ? { cursor: 'not-allowed' } : {}) }}>
                {done && <Check size={14} strokeWidth={3}/>}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function RestCard() {
  return (
    <div style={S.restCard}>
      <Coffee size={40} style={{ color: '#525252' }}/>
      <div style={S.restTitle}>RECUPERAÇÃO</div>
      <div style={S.restText}>Sem treino. Sem cardio. Sono e comida.</div>
    </div>
  );
}
function SportCard({ description }) {
  return (
    <div style={S.sportCard}>
      <Activity size={32} style={{ color: '#f59e0b' }}/>
      <div style={S.sportTitle}>TÊNIS</div>
      <div style={S.sportText}>{description}</div>
    </div>
  );
}

// =====================================================================
// STYLES
// =====================================================================
const globalCSS = `
  @import url('https://fonts.googleapis.com/css2?family=Anton&family=IBM+Plex+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@500;700&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body, #root { background: #0a0a0a; }
  body { font-family: 'IBM Plex Sans', system-ui, sans-serif; color: #fafafa; -webkit-font-smoothing: antialiased; }
  input { font-family: 'JetBrains Mono', monospace; }
  input:focus { outline: none; border-color: #f59e0b !important; }
  input:disabled { cursor: not-allowed; }
  button { font-family: 'IBM Plex Sans', sans-serif; cursor: pointer; }
  button:disabled { cursor: not-allowed; }
  ul { list-style: none; }
  ::-webkit-scrollbar { height: 0; width: 0; }
`;

const chartTooltipStyle = {
  background: '#141414', border: '1px solid #262626', borderRadius: 6,
  fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: '#fafafa',
};

const S = {
  app: { minHeight: '100vh', background: '#0a0a0a', color: '#fafafa', paddingBottom: 80, position: 'relative' },
  grain: {
    position: 'fixed', inset: 0, pointerEvents: 'none', opacity: 0.35,
    backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence baseFrequency='0.9' numOctaves='3'/></filter><rect width='200' height='200' filter='url(%23n)' opacity='0.35'/></svg>")`,
    mixBlendMode: 'overlay', zIndex: 0,
  },
  loadingScreen: { minHeight: '100vh', background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  loadingDot: { width: 12, height: 12, borderRadius: '50%', background: '#f59e0b' },
  header: { position: 'relative', zIndex: 1, padding: '28px 20px 20px', borderBottom: '1px solid #1f1f1f' },
  headerInner: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', maxWidth: 720, margin: '0 auto' },
  tagline: { fontSize: 10, letterSpacing: '0.25em', color: '#f59e0b', fontWeight: 600, marginBottom: 4 },
  title: { fontFamily: "'Anton', sans-serif", fontSize: 52, letterSpacing: '0.04em', lineHeight: 1, color: '#fafafa' },
  subtitle: { fontSize: 11, color: '#737373', letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 6 },
  resetBtn: { background: 'transparent', border: '1px solid #262626', color: '#525252', padding: 8, borderRadius: 6, display: 'flex' },

  tabBar: { position: 'relative', zIndex: 1, borderBottom: '1px solid #1f1f1f', background: '#0a0a0a' },
  tabBarInner: { display: 'flex', maxWidth: 720, margin: '0 auto' },
  tabBtn: {
    flex: 1, background: 'transparent', border: 'none', borderBottom: '2px solid transparent',
    color: '#737373', padding: '14px 8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    fontSize: 11, fontWeight: 700, letterSpacing: '0.15em', transition: 'all 0.15s',
  },
  tabBtnActive: { color: '#fafafa', background: 'rgba(245, 158, 11, 0.04)' },

  blockBanner: {
    position: 'relative', zIndex: 1, maxWidth: 680,
    margin: '16px 20px 0', padding: '12px 16px',
    border: '1px solid', borderRadius: 8, background: '#0f0f0f',
  },
  blockBannerInner: { display: 'flex', alignItems: 'center', gap: 12 },
  blockIconWrap: { width: 36, height: 36, borderRadius: 6, background: '#141414', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  blockLabel: { fontSize: 11, fontWeight: 700, letterSpacing: '0.2em', marginBottom: 2 },
  blockDesc: { fontSize: 11, color: '#a3a3a3', fontFamily: "'JetBrains Mono', monospace" },

  section: { position: 'relative', zIndex: 1, padding: '20px 20px 0', maxWidth: 720, margin: '0 auto' },
  sectionLabel: { fontSize: 9, color: '#525252', letterSpacing: '0.3em', fontWeight: 600, marginBottom: 10 },
  weeks: { display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 6 },
  weekBtn: { background: '#141414', border: '1px solid #262626', borderRadius: 6, padding: '10px 4px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, transition: 'all 0.15s', color: '#fafafa' },
  weekNum: { fontFamily: "'JetBrains Mono', monospace", fontSize: 13, fontWeight: 700 },
  weekPct: { fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fontWeight: 500 },
  weekLegend: { display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 10, fontSize: 10, color: '#737373' },
  legendDot: { display: 'inline-block', width: 8, height: 8, borderRadius: '50%', marginRight: 4, verticalAlign: 'middle' },
  days: { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6 },
  dayBtn: { position: 'relative', background: '#141414', border: '1px solid #262626', borderRadius: 6, padding: '12px 4px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, color: '#fafafa', transition: 'all 0.15s' },
  dayBtnActive: { background: '#1f1f1f' },
  dayBtnRest: { opacity: 0.55 },
  dayBtnDone: { background: 'rgba(34, 197, 94, 0.08)', borderColor: '#14532d' },
  dayShort: { fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 700, letterSpacing: '0.1em' },
  dayFocus: { fontSize: 9, color: '#737373', textAlign: 'center', lineHeight: 1.2 },
  dayCheckMark: {
    position: 'absolute', top: 4, right: 4, width: 14, height: 14, borderRadius: '50%',
    background: '#22c55e', color: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center',
  },

  completionBanner: {
    position: 'relative', zIndex: 1, maxWidth: 680, margin: '16px 20px 0',
    padding: '14px 16px', borderRadius: 8,
    background: 'rgba(34, 197, 94, 0.08)', border: '1px solid #14532d',
  },
  completionBannerInner: { display: 'flex', alignItems: 'center', gap: 12 },
  completionTitle: { fontSize: 11, fontWeight: 700, letterSpacing: '0.2em', color: '#22c55e' },
  completionDate: { fontSize: 11, color: '#a3a3a3', fontFamily: "'JetBrains Mono', monospace", marginTop: 2 },
  unlockBtn: {
    background: 'transparent', border: '1px solid #262626', color: '#a3a3a3',
    padding: '6px 10px', borderRadius: 4, fontSize: 10, fontWeight: 700, letterSpacing: '0.15em',
    display: 'flex', alignItems: 'center', gap: 6, fontFamily: "'JetBrains Mono', monospace",
  },

  main: { position: 'relative', zIndex: 1, padding: '24px 20px 0', maxWidth: 720, margin: '0 auto' },
  dayHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', paddingBottom: 16, marginBottom: 16, borderBottom: '1px solid #1f1f1f' },
  dayHeaderLabel: { fontSize: 10, color: '#737373', letterSpacing: '0.25em', marginBottom: 4 },
  dayHeaderTitle: { fontFamily: "'Anton', sans-serif", fontSize: 32, letterSpacing: '0.02em', lineHeight: 1 },
  dayHeaderStat: { textAlign: 'right' },
  statBig: { fontFamily: "'JetBrains Mono', monospace", fontSize: 26, fontWeight: 700, lineHeight: 1 },
  statLabel: { fontSize: 9, color: '#525252', letterSpacing: '0.2em', textTransform: 'uppercase', marginTop: 4 },

  exercises: { display: 'flex', flexDirection: 'column', gap: 10 },
  warmupCard: { background: 'rgba(245, 158, 11, 0.06)', border: '1px dashed #422006', borderRadius: 6, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8 },
  warmupText: { fontSize: 11, color: '#a3a3a3', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 500 },
  sportNote: { background: 'rgba(245, 158, 11, 0.06)', border: '1px solid #422006', borderRadius: 6, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#fbbf24' },

  exCard: { background: '#141414', border: '1px solid #1f1f1f', borderRadius: 8, padding: 14, transition: 'all 0.2s' },
  exHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 8 },
  exNameWrap: { flex: 1, minWidth: 0 },
  exNameRow: { display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 2 },
  exName: { fontSize: 14, fontWeight: 600, color: '#fafafa' },
  exTypeTag: { fontSize: 9, fontWeight: 700, letterSpacing: '0.15em', padding: '2px 6px', borderRadius: 3, border: '1px solid', fontFamily: "'JetBrains Mono', monospace" },
  exTarget: { fontFamily: "'JetBrains Mono', monospace", fontSize: 12, fontWeight: 700, letterSpacing: '0.05em' },
  fillBtn: { background: 'transparent', border: '1px solid #262626', color: '#a3a3a3', padding: '5px 10px', borderRadius: 4, fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', fontFamily: "'JetBrains Mono', monospace" },
  lastWeek: { display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px', background: '#0f0f0f', borderRadius: 4, fontSize: 10, color: '#737373', fontFamily: "'JetBrains Mono', monospace", marginBottom: 10 },
  setsGrid: { display: 'flex', flexDirection: 'column', gap: 4 },
  setsHeader: { display: 'grid', gridTemplateColumns: '36px 1fr 1fr 44px', gap: 6, paddingBottom: 4 },
  setsHeaderCell: { fontSize: 9, color: '#525252', letterSpacing: '0.2em', fontWeight: 600, textAlign: 'center' },
  setRow: { display: 'grid', gridTemplateColumns: '36px 1fr 1fr 44px', gap: 6, alignItems: 'center', padding: '4px 0' },
  setIdx: { fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: '#525252', textAlign: 'center', fontWeight: 700 },
  input: { background: '#0a0a0a', border: '1px solid #262626', borderRadius: 4, padding: '8px 10px', color: '#fafafa', fontSize: 14, fontWeight: 500, textAlign: 'center', width: '100%', transition: 'border-color 0.15s' },
  inputLocked: { background: '#0a0a0a', color: '#737373', opacity: 0.7 },
  checkBtn: { background: '#0a0a0a', border: '1px solid #262626', borderRadius: 4, width: '100%', height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fafafa', transition: 'all 0.15s' },
  checkBtnDone: { background: '#22c55e', border: '1px solid #22c55e', color: '#0a0a0a' },

  completeWrap: { marginTop: 20, marginBottom: 8 },
  completeBtn: {
    width: '100%', border: 'none', borderRadius: 8, padding: '16px 20px',
    fontSize: 13, fontWeight: 800, letterSpacing: '0.2em', color: '#0a0a0a',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
    fontFamily: "'IBM Plex Sans', sans-serif", transition: 'transform 0.1s',
    boxShadow: '0 4px 12px rgba(245, 158, 11, 0.15)',
  },
  completedLine: {
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    padding: '14px', background: '#0f0f0f', borderRadius: 6, border: '1px dashed #1f1f1f',
    fontSize: 11, color: '#525252', letterSpacing: '0.05em',
  },

  restCard: { border: '1px dashed #262626', borderRadius: 8, padding: '48px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, textAlign: 'center' },
  restTitle: { fontFamily: "'Anton', sans-serif", fontSize: 28, letterSpacing: '0.1em', color: '#737373' },
  restText: { fontSize: 13, color: '#525252', maxWidth: 280 },
  sportCard: { background: 'rgba(245, 158, 11, 0.04)', border: '1px solid #422006', borderRadius: 8, padding: '32px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, textAlign: 'center' },
  sportTitle: { fontFamily: "'Anton', sans-serif", fontSize: 28, letterSpacing: '0.1em', color: '#fbbf24' },
  sportText: { fontSize: 13, color: '#a3a3a3' },

  progressWrap: { position: 'relative', zIndex: 1, padding: '20px', maxWidth: 720, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 12 },
  statsRow: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 },
  statCard: { background: '#141414', border: '1px solid #1f1f1f', borderRadius: 8, padding: '14px 10px', textAlign: 'center' },
  statCardLabel: { fontSize: 9, color: '#525252', letterSpacing: '0.2em', fontWeight: 600, marginBottom: 6 },
  statCardValue: { fontFamily: "'Anton', sans-serif", fontSize: 26, letterSpacing: '0.02em', lineHeight: 1 },
  statCardSub: { fontSize: 10, color: '#737373', marginTop: 4, fontFamily: "'JetBrains Mono', monospace" },
  chartCard: { background: '#141414', border: '1px solid #1f1f1f', borderRadius: 10, padding: 16 },
  chartHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
  chartTitle: { fontSize: 11, fontWeight: 700, letterSpacing: '0.2em', color: '#fafafa', marginBottom: 2 },
  chartSubtitle: { fontSize: 11, color: '#737373', fontFamily: "'JetBrains Mono', monospace" },
  chartFootnote: { fontSize: 10, color: '#525252', marginTop: 10, fontStyle: 'italic', lineHeight: 1.5 },
  chartLegendRow: { display: 'flex', flexWrap: 'wrap', gap: 14, marginTop: 10, fontSize: 10, color: '#a3a3a3' },
  donutCenter: { position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' },
  donutCenterPct: { fontFamily: "'Anton', sans-serif", fontSize: 32, color: '#22c55e', lineHeight: 1 },
  donutCenterLabel: { fontSize: 9, color: '#525252', letterSpacing: '0.2em', marginTop: 4 },
  emptyState: { display: 'flex', alignItems: 'center', gap: 12, padding: 16, background: '#141414', border: '1px dashed #262626', borderRadius: 8, fontSize: 12, color: '#a3a3a3', lineHeight: 1.5 },

  phasesWrap: { position: 'relative', zIndex: 1, padding: '20px', maxWidth: 720, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 12 },
  phasesIntro: { padding: '0 0 8px' },
  phasesIntroTitle: { fontFamily: "'Anton', sans-serif", fontSize: 32, letterSpacing: '0.04em', lineHeight: 1, marginBottom: 8 },
  phasesIntroText: { fontSize: 12, color: '#a3a3a3', lineHeight: 1.5 },
  phaseCard: { border: '1px solid', borderRadius: 10, overflow: 'hidden', transition: 'all 0.2s' },
  phaseHeader: { width: '100%', background: 'transparent', border: 'none', padding: 16, display: 'flex', alignItems: 'center', gap: 14, color: '#fafafa' },
  phaseIconBig: { width: 44, height: 44, borderRadius: 8, border: '1px solid', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  phaseHeaderRow: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 },
  phaseLabel: { fontSize: 13, fontWeight: 700, letterSpacing: '0.15em' },
  phaseBadge: { fontSize: 8, fontWeight: 700, letterSpacing: '0.2em', padding: '2px 6px', border: '1px solid', borderRadius: 3, fontFamily: "'JetBrains Mono', monospace" },
  phaseWeeks: { fontSize: 10, color: '#737373', letterSpacing: '0.2em', fontWeight: 600, marginBottom: 4 },
  phaseDesc: { fontSize: 11, color: '#a3a3a3', fontFamily: "'JetBrains Mono', monospace" },
  phaseDetail: { padding: '0 16px 16px', display: 'flex', flexDirection: 'column', gap: 12 },
  phaseRowBlock: { display: 'flex', flexDirection: 'column', gap: 4 },
  phaseRowLabel: { fontSize: 9, color: '#525252', letterSpacing: '0.25em', fontWeight: 700 },
  phaseRowValue: { fontSize: 13, color: '#fafafa', lineHeight: 1.5 },
  phaseGrid: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 },
  phaseMini: { background: 'rgba(255,255,255,0.02)', border: '1px solid #1f1f1f', borderRadius: 6, padding: 10 },
  phaseMiniValue: { fontSize: 12, color: '#fafafa', marginTop: 4, fontFamily: "'JetBrains Mono', monospace", fontWeight: 500 },
  phaseTipsBox: { background: 'rgba(255,255,255,0.02)', border: '1px solid #1f1f1f', borderRadius: 6, padding: 14 },
  phaseTipsLabel: { fontSize: 9, fontWeight: 700, letterSpacing: '0.25em', marginBottom: 10 },
  phaseTipsList: { display: 'flex', flexDirection: 'column', gap: 8 },
  phaseTipItem: { display: 'flex', gap: 10, fontSize: 12, color: '#d4d4d4', lineHeight: 1.5 },
  phaseTipDot: { width: 4, height: 4, borderRadius: '50%', flexShrink: 0, marginTop: 7 },
  phaseGoBtn: { border: 'none', borderRadius: 6, padding: '10px 16px', fontSize: 11, fontWeight: 700, letterSpacing: '0.2em', fontFamily: "'IBM Plex Sans', sans-serif", cursor: 'pointer', marginTop: 4 },

  footer: { textAlign: 'center', fontSize: 10, color: '#404040', letterSpacing: '0.1em', padding: '32px 20px 20px', position: 'relative', zIndex: 1 },
  modalOverlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, zIndex: 100 },
  modal: { background: '#141414', border: '1px solid #262626', borderRadius: 8, padding: 24, maxWidth: 360, width: '100%' },
  modalTitle: { fontFamily: "'Anton', sans-serif", fontSize: 24, letterSpacing: '0.04em', marginBottom: 8 },
  modalText: { fontSize: 13, color: '#a3a3a3', lineHeight: 1.5, marginBottom: 20 },
  modalBtns: { display: 'flex', gap: 8 },
  modalCancel: { flex: 1, background: 'transparent', border: '1px solid #262626', color: '#fafafa', padding: '10px 16px', borderRadius: 6, fontSize: 13, fontWeight: 600 },
  modalConfirm: { flex: 1, background: '#ef4444', border: '1px solid #ef4444', color: '#0a0a0a', padding: '10px 16px', borderRadius: 6, fontSize: 13, fontWeight: 700 },
  modalConfirmGreen: { flex: 1, background: '#22c55e', border: '1px solid #22c55e', color: '#0a0a0a', padding: '10px 16px', borderRadius: 6, fontSize: 13, fontWeight: 700 },
};
