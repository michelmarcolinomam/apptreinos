import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Check, RotateCcw, Trophy, Flame, Coffee, Activity, Zap, Wind,
  Dumbbell, BarChart3, Layers, ChevronRight, Target, TrendingUp,
  AlertTriangle, CheckCircle2, Lock, Edit3, Footprints, Timer, Flame as FlameIcon,
  User, ArrowDown, ArrowUp, Minus
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
// CARDIO PLAN
// =====================================================================
const CARDIO_PLAN = {
  monday:    { type: 'Corrida', distance: 6, pace: 6 },
  tuesday:   { type: 'Corrida', distance: 6, pace: 6 },
  wednesday: { type: 'Corrida', distance: 6, pace: 6 },
  thursday:  { type: 'Caminhada', distance: 6, pace: 8 },
  // friday, saturday: tênis | sunday: off
};

// =====================================================================
// EVOLUÇÃO — Estrutura de medidas corporais
// =====================================================================
const MEASUREMENTS = [
  { id: 'waist',            label: 'Cintura (umbigo)', highlight: true },
  { id: 'chest',            label: 'Peito' },
  { id: 'shoulders',        label: 'Ombros (circunf.)' },
  { id: 'neck',             label: 'Pescoço' },
  { id: 'hip',              label: 'Quadril' },
  { id: 'armLeftRelaxed',   label: 'Braço esq. (relaxado)' },
  { id: 'armRightRelaxed',  label: 'Braço dir. (relaxado)' },
  { id: 'armLeftFlexed',    label: 'Braço esq. (contraído)' },
  { id: 'armRightFlexed',   label: 'Braço dir. (contraído)' },
  { id: 'forearmLeft',      label: 'Antebraço esq.' },
  { id: 'forearmRight',     label: 'Antebraço dir.' },
  { id: 'thighLeft',        label: 'Coxa esq.' },
  { id: 'thighRight',       label: 'Coxa dir.' },
  { id: 'calfLeft',         label: 'Panturrilha esq.' },
  { id: 'calfRight',        label: 'Panturrilha dir.' },
];

const BF_METHODS = [
  { id: 'scale',    label: 'Balança bioimpedância' },
  { id: 'inbody',   label: 'InBody / clínica' },
  { id: 'skinfold', label: 'Dobras cutâneas' },
  { id: 'dexa',     label: 'DEXA scan' },
];

function emptyProfile() {
  const measurements = {};
  MEASUREMENTS.forEach(m => {
    measurements[m.id] = { start: '', end: '' };
  });
  return {
    cycleNumber: 1,
    startDate: '2026-06-01',
    endDate: '2026-07-26',
    age: '',
    height: '',
    weight: { start: '', end: '' },
    bodyFat: { start: '', end: '', method: 'scale' },
    vo2max: { start: '', end: '' },
    measurements,
    // Timestamps de quando os dados iniciais/finais foram salvos
    startSavedAt: null,
    endSavedAt: null,
  };
}

// Goals (definição: queremos REDUZIR essas medidas)
const SHOULD_REDUCE = ['waist', 'hip', 'bodyFat'];
// Estas devem MANTER ou aumentar levemente (massa muscular)
const SHOULD_MAINTAIN = ['chest', 'shoulders', 'neck',
  'armLeftRelaxed', 'armRightRelaxed', 'armLeftFlexed', 'armRightFlexed',
  'forearmLeft', 'forearmRight', 'thighLeft', 'thighRight',
  'calfLeft', 'calfRight'];

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

// =====================================================================
// CICLO ATUAL — datas fixas (atualize aqui quando criar um novo ciclo)
// =====================================================================
const CURRENT_CYCLE = {
  number: 1,
  startDate: '2026-06-01',  // 01/06/2026
  endDate: '2026-07-26',    // 26/07/2026 (56 dias = 8 semanas)
};

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
  const [completions, setCompletions] = useState({});
  const [sessions, setSessions] = useState({});
  const [profile, setProfile] = useState(emptyProfile);
  const [loaded, setLoaded] = useState(false);
  const [currentWeek, setCurrentWeek] = useState(1);
  const [currentDay, setCurrentDay] = useState(todayKey);
  const [showReset, setShowReset] = useState(false);
  const [tab, setTab] = useState('training');
  const [confirmComplete, setConfirmComplete] = useState(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const p = JSON.parse(raw);
        if (p.log) setLog(p.log);
        if (p.completions) setCompletions(p.completions);
        if (p.sessions) setSessions(p.sessions);
        if (p.profile) {
          // merge com emptyProfile pra garantir todos os campos
          const empty = emptyProfile();
          setProfile({
            ...empty,
            ...p.profile,
            // FORÇA as datas e número do ciclo a sempre virem do código (CURRENT_CYCLE)
            cycleNumber: CURRENT_CYCLE.number,
            startDate: CURRENT_CYCLE.startDate,
            endDate: CURRENT_CYCLE.endDate,
            measurements: { ...empty.measurements, ...(p.profile.measurements || {}) },
          });
        }
        if (p.currentWeek) setCurrentWeek(p.currentWeek);
      }
    } catch (e) {}
    finally { setLoaded(true); }
  }, []);

  useEffect(() => {
    if (!loaded) return;
    const t = setTimeout(() => {
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ log, completions, sessions, profile, currentWeek })); }
      catch (e) { console.error('save fail', e); }
    }, 400);
    return () => clearTimeout(t);
  }, [log, completions, sessions, profile, currentWeek, loaded]);

  const dayLocked = useCallback((week, day) => !!completions[completionKey(week, day)], [completions]);

  const updateSet = useCallback((w, d, ex, i, field, val) => {
    setLog(prev => ({ ...prev, [setKey(w,d,ex,i)]: { ...(prev[setKey(w,d,ex,i)] || {}), [field]: val } }));
  }, []);

  const toggleDone = useCallback((w, d, ex, i) => {
    setLog(prev => ({ ...prev, [setKey(w,d,ex,i)]: { ...(prev[setKey(w,d,ex,i)] || {}), done: !prev[setKey(w,d,ex,i)]?.done } }));
  }, []);

  const fillTargets = useCallback((week, day, exercise) => {
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
  }, []);

  // ====== CARDIO + SESSION STATS ======
  const updateSession = useCallback((week, day, area, field, val) => {
    const k = completionKey(week, day);
    setSessions(prev => ({
      ...prev,
      [k]: {
        ...(prev[k] || {}),
        [area]: { ...(prev[k]?.[area] || {}), [field]: val },
      },
    }));
  }, []);

  const toggleCardioDone = useCallback((week, day) => {
    const k = completionKey(week, day);
    setSessions(prev => ({
      ...prev,
      [k]: {
        ...(prev[k] || {}),
        cardio: { ...(prev[k]?.cardio || {}), done: !prev[k]?.cardio?.done },
      },
    }));
  }, []);

  const fillCardioTargets = useCallback((week, day) => {
    const plan = CARDIO_PLAN[day];
    if (!plan) return;
    const totalTime = Math.round(plan.distance * plan.pace);
    const k = completionKey(week, day);
    setSessions(prev => ({
      ...prev,
      [k]: {
        ...(prev[k] || {}),
        cardio: {
          distance: String(plan.distance),
          pace: String(plan.pace),
          time: String(totalTime),
          calories: prev[k]?.cardio?.calories || '',
          done: true,
        },
      },
    }));
  }, []);

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
    // inclui cardio se houver plano
    if (CARDIO_PLAN[day]) {
      total++;
      if (sessions[completionKey(week, day)]?.cardio?.done) done++;
    }
    const missing = total - done;
    if (missing > 0) {
      setConfirmComplete({ week, day, missing, total });
    } else {
      completeDay(week, day);
    }
  }, [log, sessions, completeDay]);

  const resetAll = useCallback(() => {
    setLog({}); setCompletions({}); setSessions({}); setProfile(emptyProfile()); setCurrentWeek(1); setShowReset(false);
    try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}
  }, []);

  // Profile handlers
  const updateProfile = useCallback((path, value) => {
    setProfile(prev => {
      // path é array tipo ['weight', 'start'] ou ['measurements', 'waist', 'end'] ou ['age']
      if (path.length === 1) {
        return { ...prev, [path[0]]: value };
      }
      if (path.length === 2) {
        return { ...prev, [path[0]]: { ...prev[path[0]], [path[1]]: value } };
      }
      if (path.length === 3) {
        return {
          ...prev,
          [path[0]]: {
            ...prev[path[0]],
            [path[1]]: { ...prev[path[0]][path[1]], [path[2]]: value },
          },
        };
      }
      return prev;
    });
  }, []);

  // STATS — agora inclui cardio, tempo e calorias
  const weekStats = useMemo(() => {
    const s = {};
    for (let w = 1; w <= TOTAL_WEEKS; w++) {
      let total = 0, done = 0, tonnage = 0;
      let kmTotal = 0, timeTotal = 0, calTotal = 0;
      DAY_ORDER.forEach(d => {
        const day = WORKOUT_PLAN[d];
        // séries de musculação
        if (day.exercises) {
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
        }
        // cardio
        if (CARDIO_PLAN[d]) {
          total++;
          const cardio = sessions[completionKey(w, d)]?.cardio;
          if (cardio?.done) {
            done++;
            kmTotal += parseFloat(cardio.distance) || 0;
            timeTotal += parseFloat(cardio.time) || 0;
            calTotal += parseFloat(cardio.calories) || 0;
          }
        }
        // strength time + cals
        const strength = sessions[completionKey(w, d)]?.strength;
        if (strength) {
          timeTotal += parseFloat(strength.duration) || 0;
          calTotal += parseFloat(strength.calories) || 0;
        }
        // tennis time + cals (sexta e sábado)
        const tennis = sessions[completionKey(w, d)]?.tennis;
        if (tennis) {
          timeTotal += parseFloat(tennis.duration) || 0;
          calTotal += parseFloat(tennis.calories) || 0;
        }
      });
      s[w] = {
        total, done,
        pct: total > 0 ? Math.round((done/total)*100) : 0,
        tonnage: Math.round(tonnage),
        km: Math.round(kmTotal * 10) / 10,
        time: Math.round(timeTotal),
        calories: Math.round(calTotal),
      };
    }
    return s;
  }, [log, sessions]);

  const overallStats = useMemo(() => {
    let total = 0, done = 0, tonnage = 0, calories = 0, km = 0, time = 0;
    for (let w = 1; w <= TOTAL_WEEKS; w++) {
      total += weekStats[w]?.total || 0;
      done += weekStats[w]?.done || 0;
      tonnage += weekStats[w]?.tonnage || 0;
      calories += weekStats[w]?.calories || 0;
      km += weekStats[w]?.km || 0;
      time += weekStats[w]?.time || 0;
    }
    return {
      total, done, tonnage, calories,
      km: Math.round(km * 10) / 10,
      time,
      pct: total > 0 ? Math.round((done/total)*100) : 0,
    };
  }, [weekStats]);

  const dayCompletion = useCallback((week, dayKey) => {
    const day = WORKOUT_PLAN[dayKey];
    let total = 0, done = 0;
    if (day.exercises) {
      day.exercises.forEach(ex => {
        const cfg = getConfig(ex, week);
        if (!cfg) return;
        for (let i = 0; i < cfg.sets; i++) {
          total++;
          if (log[setKey(week, dayKey, ex.id, i)]?.done) done++;
        }
      });
    }
    if (CARDIO_PLAN[dayKey]) {
      total++;
      if (sessions[completionKey(week, dayKey)]?.cardio?.done) done++;
    }
    return total > 0 ? Math.round((done/total)*100) : null;
  }, [log, sessions]);

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
            { id: 'evolution', label: 'EVOLUÇÃO', icon: User },
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
          log={log} completions={completions} sessions={sessions}
          onUpdate={updateSet} onToggle={toggleDone} onFill={fillTargets}
          onUpdateSession={updateSession}
          onToggleCardio={toggleCardioDone}
          onFillCardio={fillCardioTargets}
          onComplete={tryCompleteDay} onUnlock={unlockDay}
          blockInfo={blockInfo} block={block}
        />
      )}
      {tab === 'progress' && (
        <ProgressTab weekStats={weekStats} overallStats={overallStats} log={log} sessions={sessions} currentWeek={currentWeek} completions={completions}/>
      )}
      {tab === 'phases' && (
        <PhasesTab currentWeek={currentWeek} setCurrentWeek={(w) => { setCurrentWeek(w); setTab('training'); }}/>
      )}
      {tab === 'evolution' && (
        <EvolutionTab profile={profile} onUpdate={updateProfile} blockColor={blockInfo.color}/>
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
              Faltam <strong style={{ color: '#f59e0b' }}>{confirmComplete.missing} de {confirmComplete.total}</strong> séries/itens não marcados.
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
  weekStats, dayCompletion, log, completions, sessions,
  onUpdate, onToggle, onFill,
  onUpdateSession, onToggleCardio, onFillCardio,
  onComplete, onUnlock,
  blockInfo, block
}) {
  const day = WORKOUT_PLAN[currentDay];
  const cardio = CARDIO_PLAN[currentDay];
  const completion = completions[completionKey(currentWeek, currentDay)];
  const isLocked = !!completion;
  const sessionData = sessions[completionKey(currentWeek, currentDay)] || {};

  // Info do ciclo atual
  const formatBR = (iso) => {
    if (!iso) return '';
    const [y, m, d] = iso.split('-');
    return `${d}/${m}/${y}`;
  };

  return (
    <>
      {/* BANNER DO CICLO */}
      <div style={S.cycleBanner}>
        <div style={S.cycleBannerInner}>
          <div style={S.cycleNumberWrap}>
            <div style={S.cycleNumberLabel}>CICLO</div>
            <div style={S.cycleNumber}>{String(CURRENT_CYCLE.number).padStart(2, '0')}</div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={S.cycleDates}>
              {formatBR(CURRENT_CYCLE.startDate)} → {formatBR(CURRENT_CYCLE.endDate)}
            </div>
            <div style={S.cycleSubtitle}>8 semanas · 3 blocos</div>
          </div>
        </div>
      </div>

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
              <span>DESMARCAR</span>
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
          {(day.exercises || cardio) && (
            <div style={S.dayHeaderStat}>
              <div style={{ ...S.statBig, color: isLocked ? '#22c55e' : blockInfo.color }}>
                {dayCompletion(currentWeek, currentDay) ?? 0}%
              </div>
              <div style={S.statLabel}>completo</div>
            </div>
          )}
        </div>

        {day.isRest && <RestCard/>}
        {day.sportOnly && <SportCard description={day.description}/>}

        {/* CARDIO CARD */}
        {cardio && (
          <CardioCard
            cardioPlan={cardio}
            week={currentWeek}
            day={currentDay}
            data={sessionData.cardio || {}}
            locked={false}
            blockColor={blockInfo.color}
            onUpdate={onUpdateSession}
            onToggle={onToggleCardio}
            onFill={onFillCardio}
          />
        )}

        {/* CARD DE TÊNIS — sexta (sportOnly) ou sábado (sportNote) */}
        {(day.sportOnly || day.sportNote) && (
          <TennisStatsCard
            week={currentWeek}
            day={currentDay}
            data={sessionData.tennis || {}}
            locked={false}
            onUpdate={onUpdateSession}
          />
        )}

        {day.exercises && (
          <>
            <div style={{ ...S.sectionHeader, marginTop: 20 }}>
              <Dumbbell size={14} style={{ color: '#737373' }}/>
              <span style={S.sectionHeaderText}>MUSCULAÇÃO</span>
            </div>
            <div style={S.exercises}>
              {day.exercises.map(ex => (
                <ExerciseCard key={ex.id} exercise={ex}
                  week={currentWeek} day={currentDay} blockColor={blockInfo.color}
                  log={log} locked={false}
                  onUpdate={onUpdate} onToggle={onToggle} onFill={onFill}/>
              ))}
            </div>

            {/* TEMPO + CALORIAS DO TREINO DE FORÇA */}
            <StrengthStatsCard
              week={currentWeek}
              day={currentDay}
              data={sessionData.strength || {}}
              locked={false}
              onUpdate={onUpdateSession}
            />
          </>
        )}

        {/* Botão CONCLUIR — aparece em qualquer dia que não seja OFF */}
        {!day.isRest && (
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
                <CheckCircle2 size={12} style={{ color: '#22c55e' }}/>
                <span>Treino marcado como concluído · Continua editável</span>
              </div>
            )}
          </div>
        )}
      </main>
    </>
  );
}

// =====================================================================
// CARDIO CARD
// =====================================================================
function CardioCard({ cardioPlan, week, day, data, locked, blockColor, onUpdate, onToggle, onFill }) {
  const done = !!data.done;
  return (
    <>
      <div style={S.sectionHeader}>
        <Footprints size={14} style={{ color: '#737373' }}/>
        <span style={S.sectionHeaderText}>CARDIO</span>
      </div>
      <div style={{ ...S.exCard, ...(done ? { borderColor: '#14532d', background: 'rgba(34, 197, 94, 0.04)' } : {}) }}>
        <div style={S.exHeader}>
          <div style={S.exNameWrap}>
            <div style={S.exNameRow}>
              <span style={S.exName}>{cardioPlan.type}</span>
              <span style={{ ...S.exTypeTag, color: '#60a5fa', borderColor: '#1e3a5f' }}>AERÓBICO</span>
            </div>
            <div style={{ ...S.exTarget, color: blockColor }}>
              {cardioPlan.distance}km · pace {cardioPlan.pace}min/km
            </div>
          </div>
          {!locked && (
            <button onClick={() => onFill(week, day)} style={S.fillBtn}>AUTO</button>
          )}
        </div>

        <div style={S.cardioGrid}>
          <CardioField
            label="KM" placeholder={String(cardioPlan.distance)}
            value={data.distance ?? ''} locked={locked}
            onChange={v => onUpdate(week, day, 'cardio', 'distance', v)}
          />
          <CardioField
            label="PACE" placeholder={String(cardioPlan.pace)}
            value={data.pace ?? ''} locked={locked}
            onChange={v => onUpdate(week, day, 'cardio', 'pace', v)}
          />
          <CardioField
            label="MIN" placeholder={String(Math.round(cardioPlan.distance * cardioPlan.pace))}
            value={data.time ?? ''} locked={locked}
            onChange={v => onUpdate(week, day, 'cardio', 'time', v)}
          />
          <CardioField
            label="KCAL" placeholder="—"
            value={data.calories ?? ''} locked={locked}
            onChange={v => onUpdate(week, day, 'cardio', 'calories', v)}
          />
          <button
            onClick={() => onToggle(week, day)}
            disabled={locked}
            style={{ ...S.checkBtnWide, ...(done ? S.checkBtnDone : {}), ...(locked ? { cursor: 'not-allowed' } : {}) }}
          >
            {done ? <Check size={14} strokeWidth={3}/> : <span style={{ fontSize: 9, letterSpacing: '0.15em', fontWeight: 700 }}>FEITO</span>}
          </button>
        </div>
      </div>
    </>
  );
}

function CardioField({ label, placeholder, value, locked, onChange }) {
  return (
    <div style={S.cardioFieldWrap}>
      <div style={S.cardioFieldLabel}>{label}</div>
      <input
        type="text" inputMode="decimal"
        value={value} disabled={locked}
        placeholder={placeholder}
        onChange={e => onChange(e.target.value)}
        style={{ ...S.input, ...(locked ? S.inputLocked : {}) }}
      />
    </div>
  );
}

// =====================================================================
// SESSION STATS (Tempo + Calorias por sessão — strength, tennis, etc)
// =====================================================================
function SessionStatsCard({ week, day, data, locked, area, title, icon: Icon, color, onUpdate, hint }) {
  return (
    <>
      <div style={{ ...S.sectionHeader, marginTop: 20 }}>
        <Icon size={14} style={{ color: color || '#737373' }}/>
        <span style={{ ...S.sectionHeaderText, ...(color ? { color } : {}) }}>{title}</span>
      </div>
      <div style={S.exCard}>
        <div style={S.statsCardGrid}>
          <CardioField
            label="TEMPO (MIN)" placeholder="—"
            value={data.duration ?? ''} locked={locked}
            onChange={v => onUpdate(week, day, area, 'duration', v)}
          />
          <CardioField
            label="CALORIAS (KCAL)" placeholder="—"
            value={data.calories ?? ''} locked={locked}
            onChange={v => onUpdate(week, day, area, 'calories', v)}
          />
        </div>
        {hint && <div style={S.statsCardHint}>{hint}</div>}
      </div>
    </>
  );
}

// Compatibilidade: mantém StrengthStatsCard como wrapper
function StrengthStatsCard({ week, day, data, locked, onUpdate }) {
  return (
    <SessionStatsCard
      week={week} day={day} data={data} locked={locked}
      area="strength" title="RESUMO DA SESSÃO · FORÇA"
      icon={Timer} onUpdate={onUpdate}
      hint="Anote depois do treino. Use a fonte que preferir (Apple Watch, esteira, estimativa) — só mantenha a mesma ao longo das semanas pra ter consistência."
    />
  );
}

// Card específico do tênis
function TennisStatsCard({ week, day, data, locked, onUpdate }) {
  return (
    <SessionStatsCard
      week={week} day={day} data={data} locked={locked}
      area="tennis" title="RESUMO DA SESSÃO · TÊNIS"
      icon={Activity} color="#fbbf24" onUpdate={onUpdate}
      hint="Anote o tempo total da aula e as calorias gastas. Use o relógio ou estimativa — só mantenha a mesma fonte."
    />
  );
}

// =====================================================================
// PROGRESS TAB
// =====================================================================
function ProgressTab({ weekStats, overallStats, log, sessions, currentWeek, completions }) {
  // Seletor de período: 'all' (geral), 'currentWeek' (semana atual), 'last7days' (últimos 7 dias)
  const [period, setPeriod] = useState('all');

  // Calcula stats filtrados por período
  const periodStats = useMemo(() => {
    if (period === 'all') {
      return {
        ...overallStats,
        completedDays: Object.keys(completions).length,
        label: 'TUDO',
        subtitle: '8 semanas do ciclo',
      };
    }

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    let total = 0, done = 0, tonnage = 0, km = 0, time = 0, calories = 0, completedDays = 0;

    for (let w = 1; w <= TOTAL_WEEKS; w++) {
      for (const d of DAY_ORDER) {
        const key = completionKey(w, d);
        const completion = completions[key];

        // Aplica filtro
        if (period === 'currentWeek' && w !== currentWeek) continue;
        if (period === 'last7days') {
          if (!completion) continue;
          const compDate = new Date(completion.completedAt);
          if (compDate < sevenDaysAgo) continue;
        }

        if (completion) completedDays++;

        const day = WORKOUT_PLAN[d];

        // Séries de musculação
        if (day.exercises) {
          for (const ex of day.exercises) {
            const cfg = getConfig(ex, w);
            if (!cfg) continue;
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
          }
        }

        // Cardio
        if (CARDIO_PLAN[d]) {
          total++;
          const cardio = sessions[key]?.cardio;
          if (cardio?.done) {
            done++;
            km += parseFloat(cardio.distance) || 0;
            time += parseFloat(cardio.time) || 0;
            calories += parseFloat(cardio.calories) || 0;
          }
        }

        // Strength stats
        const strength = sessions[key]?.strength;
        if (strength) {
          time += parseFloat(strength.duration) || 0;
          calories += parseFloat(strength.calories) || 0;
        }

        // Tennis stats
        const tennis = sessions[key]?.tennis;
        if (tennis) {
          time += parseFloat(tennis.duration) || 0;
          calories += parseFloat(tennis.calories) || 0;
        }
      }
    }

    const pct = total > 0 ? Math.round((done / total) * 100) : 0;
    const labels = {
      currentWeek: { label: `SEMANA ${String(currentWeek).padStart(2, '0')}`, subtitle: `Semana selecionada do ciclo` },
      last7days: { label: 'ÚLTIMOS 7 DIAS', subtitle: 'Dias concluídos na última semana' },
    };

    return {
      total, done, tonnage,
      km: Math.round(km * 10) / 10,
      time: Math.round(time),
      calories: Math.round(calories),
      completedDays, pct,
      ...labels[period],
    };
  }, [period, overallStats, completions, sessions, log, currentWeek]);

  // Médias por dia de treino (útil pra nutri)
  const avgPerDay = useMemo(() => {
    if (periodStats.completedDays === 0) return null;
    return {
      calories: Math.round(periodStats.calories / periodStats.completedDays),
      time: Math.round(periodStats.time / periodStats.completedDays),
    };
  }, [periodStats]);

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

  const cardioData = Array.from({ length: TOTAL_WEEKS }, (_, i) => ({
    week: `S${i+1}`, km: weekStats[i+1]?.km || 0,
  }));

  const caloriesData = Array.from({ length: TOTAL_WEEKS }, (_, i) => ({
    week: `S${i+1}`, calories: weekStats[i+1]?.calories || 0,
  }));

  const timeData = Array.from({ length: TOTAL_WEEKS }, (_, i) => ({
    week: `S${i+1}`, time: weekStats[i+1]?.time || 0,
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
      {/* SELETOR DE PERÍODO */}
      <div style={S.periodSelector}>
        {[
          { id: 'all', label: 'TUDO', sublabel: '8 sem' },
          { id: 'currentWeek', label: 'SEMANA', sublabel: `S${currentWeek}` },
          { id: 'last7days', label: 'ÚLTIMOS', sublabel: '7 dias' },
        ].map(p => (
          <button key={p.id}
            onClick={() => setPeriod(p.id)}
            style={{
              ...S.periodBtn,
              ...(period === p.id ? S.periodBtnActive : {}),
            }}>
            <span style={S.periodBtnLabel}>{p.label}</span>
            <span style={S.periodBtnSublabel}>{p.sublabel}</span>
          </button>
        ))}
      </div>

      <div style={S.periodHeader}>
        <div style={S.periodHeaderLabel}>{periodStats.label}</div>
        <div style={S.periodHeaderSubtitle}>{periodStats.subtitle}</div>
      </div>

      <div style={S.statsRow}>
        <StatCard label="DIAS" value={periodStats.completedDays} subvalue="concluídos" color="#22c55e"/>
        <StatCard label="VOLUME" value={`${(periodStats.tonnage/1000).toFixed(1)}t`} subvalue="kg movidos" color="#f59e0b"/>
        <StatCard label="CARDIO" value={`${periodStats.km}`} subvalue="km totais" color="#60a5fa"/>
      </div>
      <div style={S.statsRow}>
        <StatCard label="TEMPO" value={`${Math.floor(periodStats.time/60)}h`} subvalue={`${periodStats.time}min`} color="#a78bfa"/>
        <StatCard label="CALORIAS" value={`${(periodStats.calories/1000).toFixed(1)}k`} subvalue="kcal" color="#ef4444"/>
        <StatCard label="SÉRIES" value={periodStats.done} subvalue={period === 'all' ? `de ${periodStats.total}` : 'feitas'} color="#fafafa"/>
      </div>

      {/* MÉDIAS POR DIA DE TREINO (útil pra nutri) */}
      {avgPerDay && periodStats.completedDays > 0 && (
        <div style={S.avgCard}>
          <div style={S.avgCardHeader}>
            <span style={S.avgCardLabel}>MÉDIA POR DIA DE TREINO</span>
            <span style={S.avgCardCount}>{periodStats.completedDays} {periodStats.completedDays === 1 ? 'dia' : 'dias'}</span>
          </div>
          <div style={S.avgCardGrid}>
            <div style={S.avgItem}>
              <div style={S.avgItemValue}>{avgPerDay.calories}</div>
              <div style={S.avgItemLabel}>kcal por dia</div>
            </div>
            <div style={S.avgItemDivider}/>
            <div style={S.avgItem}>
              <div style={S.avgItemValue}>{avgPerDay.time}</div>
              <div style={S.avgItemLabel}>min por dia</div>
            </div>
            <div style={S.avgItemDivider}/>
            <div style={S.avgItem}>
              <div style={S.avgItemValue}>{Math.round(avgPerDay.calories * 7)}</div>
              <div style={S.avgItemLabel}>kcal · proj. semana</div>
            </div>
          </div>
        </div>
      )}

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
            <div style={S.chartSubtitle}>% de itens feitos em cada semana</div>
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
          Esperado: sobe nas semanas 1-5, cai na 6 (deload), sobe em 7-8
        </div>
      </div>

      <div style={S.chartCard}>
        <div style={S.chartHeader}>
          <div>
            <div style={S.chartTitle}>CARDIO POR SEMANA</div>
            <div style={S.chartSubtitle}>Distância acumulada (km)</div>
          </div>
          <Footprints size={20} style={{ color: '#525252' }}/>
        </div>
        <div style={{ height: 200 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={cardioData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="2 4" stroke="#1f1f1f" vertical={false}/>
              <XAxis dataKey="week" stroke="#525252" fontSize={10} tickLine={false}/>
              <YAxis stroke="#525252" fontSize={10} tickLine={false}/>
              <Tooltip contentStyle={chartTooltipStyle} formatter={(v) => [`${v} km`, 'Distância']} cursor={{ fill: 'rgba(255,255,255,0.03)' }}/>
              <Bar dataKey="km" radius={[4, 4, 0, 0]} fill="#60a5fa"/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={S.chartCard}>
        <div style={S.chartHeader}>
          <div>
            <div style={S.chartTitle}>CALORIAS POR SEMANA</div>
            <div style={S.chartSubtitle}>Cardio + musculação somados</div>
          </div>
          <FlameIcon size={20} style={{ color: '#525252' }}/>
        </div>
        <div style={{ height: 200 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={caloriesData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="2 4" stroke="#1f1f1f" vertical={false}/>
              <XAxis dataKey="week" stroke="#525252" fontSize={10} tickLine={false}/>
              <YAxis stroke="#525252" fontSize={10} tickLine={false}/>
              <Tooltip contentStyle={chartTooltipStyle} formatter={(v) => [`${v} kcal`, 'Calorias']}/>
              <Line type="monotone" dataKey="calories" stroke="#ef4444" strokeWidth={2}
                dot={{ fill: '#ef4444', r: 4 }} activeDot={{ r: 6 }}/>
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={S.chartCard}>
        <div style={S.chartHeader}>
          <div>
            <div style={S.chartTitle}>TEMPO POR SEMANA</div>
            <div style={S.chartSubtitle}>Minutos de treino (cardio + força)</div>
          </div>
          <Timer size={20} style={{ color: '#525252' }}/>
        </div>
        <div style={{ height: 200 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={timeData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="2 4" stroke="#1f1f1f" vertical={false}/>
              <XAxis dataKey="week" stroke="#525252" fontSize={10} tickLine={false}/>
              <YAxis stroke="#525252" fontSize={10} tickLine={false}/>
              <Tooltip contentStyle={chartTooltipStyle} formatter={(v) => [`${v} min`, 'Tempo']} cursor={{ fill: 'rgba(255,255,255,0.03)' }}/>
              <Bar dataKey="time" radius={[4, 4, 0, 0]} fill="#a78bfa"/>
            </BarChart>
          </ResponsiveContainer>
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
// EVOLUTION TAB — Dados do atleta, medidas e comparação
// =====================================================================
function EvolutionTab({ profile, onUpdate, blockColor }) {
  // Datas vêm do CURRENT_CYCLE (não editáveis aqui)
  const startDate = CURRENT_CYCLE.startDate;
  const endDate = CURRENT_CYCLE.endDate;

  const startSaved = !!profile.startSavedAt;
  const endSaved = !!profile.endSavedAt;

  const formatBR = (iso) => {
    if (!iso) return '—';
    try {
      const [y, m, d] = iso.split('-');
      return `${d}/${m}/${y}`;
    } catch { return iso; }
  };

  const formatDateTime = (iso) => {
    if (!iso) return '';
    try {
      const d = new Date(iso);
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const hour = String(d.getHours()).padStart(2, '0');
      const min = String(d.getMinutes()).padStart(2, '0');
      return `${day}/${month} · ${hour}:${min}`;
    } catch { return ''; }
  };

  const daysRemaining = useMemo(() => {
    if (!endDate) return null;
    const now = new Date();
    now.setHours(0,0,0,0);
    const end = new Date(endDate);
    return Math.ceil((end - now) / (1000 * 60 * 60 * 24));
  }, [endDate]);

  const daysFromStart = useMemo(() => {
    if (!startDate) return null;
    const now = new Date();
    now.setHours(0,0,0,0);
    const start = new Date(startDate);
    return Math.floor((now - start) / (1000 * 60 * 60 * 24));
  }, [startDate]);

  const saveStart = () => onUpdate(['startSavedAt'], new Date().toISOString());
  const unsaveStart = () => onUpdate(['startSavedAt'], null);
  const saveEnd = () => onUpdate(['endSavedAt'], new Date().toISOString());
  const unsaveEnd = () => onUpdate(['endSavedAt'], null);

  // Conta quantas medidas iniciais foram preenchidas
  const startFilledCount = useMemo(() => {
    let c = 0;
    if (profile.weight.start) c++;
    if (profile.bodyFat.start) c++;
    if (profile.vo2max.start) c++;
    MEASUREMENTS.forEach(m => {
      if (profile.measurements[m.id]?.start) c++;
    });
    return c;
  }, [profile]);

  const endFilledCount = useMemo(() => {
    let c = 0;
    if (profile.weight.end) c++;
    if (profile.bodyFat.end) c++;
    if (profile.vo2max.end) c++;
    MEASUREMENTS.forEach(m => {
      if (profile.measurements[m.id]?.end) c++;
    });
    return c;
  }, [profile]);

  const totalFields = 3 + MEASUREMENTS.length;

  return (
    <div style={S.evoWrap}>
      <div style={S.evoIntro}>
        <div style={S.evoIntroTitle}>EVOLUÇÃO · CICLO {String(CURRENT_CYCLE.number).padStart(2, '0')}</div>
        <div style={S.evoIntroText}>
          Registra suas medidas no início e no fim das 8 semanas pra comparar a evolução real do ciclo.
        </div>
      </div>

      {/* DADOS DO CICLO */}
      <div style={S.evoCard}>
        <div style={S.evoCardTitle}>
          <span style={{ color: blockColor }}>DADOS DO CICLO</span>
          <span style={S.cycleLinkBadge}>🔗 sincronizado</span>
        </div>
        <div style={S.evoFieldGrid}>
          <div>
            <div style={S.evoFieldLabel}>INÍCIO DO CICLO</div>
            <div style={S.evoFieldStatic}>{formatBR(startDate)}</div>
          </div>
          <div>
            <div style={S.evoFieldLabel}>FIM DO CICLO</div>
            <div style={S.evoFieldStatic}>{formatBR(endDate)}</div>
          </div>
          <EvoField
            label="IDADE" placeholder="anos"
            value={profile.age}
            onChange={v => onUpdate(['age'], v)}
          />
          <EvoField
            label="ALTURA" placeholder="cm"
            value={profile.height}
            onChange={v => onUpdate(['height'], v)}
          />
        </div>
        {daysRemaining != null && (
          <div style={S.evoCountdown}>
            {daysRemaining > 0 && daysFromStart >= 0
              ? <><span style={{ color: blockColor, fontWeight: 700 }}>{daysRemaining} dias</span> até o fim do ciclo · Dia {daysFromStart + 1} de 56</>
              : daysRemaining > 0 && daysFromStart < 0
                ? <><span style={{ color: '#737373' }}>O ciclo começa em {-daysFromStart} dias</span></>
                : daysRemaining === 0
                  ? <span style={{ color: '#22c55e', fontWeight: 700 }}>Hoje é o último dia do ciclo!</span>
                  : <span style={{ color: '#737373' }}>Ciclo encerrado há {-daysRemaining} dias · preencha os dados de FIM</span>
            }
          </div>
        )}
      </div>

      {/* MÉTRICAS PRINCIPAIS */}
      <div style={S.evoCard}>
        <div style={S.evoCardTitle}>
          <span style={{ color: blockColor }}>MÉTRICAS PRINCIPAIS</span>
        </div>

        <MetricRow
          label="PESO" unit="kg"
          startValue={profile.weight.start} endValue={profile.weight.end}
          onStartChange={v => onUpdate(['weight', 'start'], v)}
          onEndChange={v => onUpdate(['weight', 'end'], v)}
          startLocked={startSaved} endLocked={endSaved}
          shouldReduce={false} highlight
        />

        <MetricRow
          label="% GORDURA" unit="%"
          startValue={profile.bodyFat.start} endValue={profile.bodyFat.end}
          onStartChange={v => onUpdate(['bodyFat', 'start'], v)}
          onEndChange={v => onUpdate(['bodyFat', 'end'], v)}
          startLocked={startSaved} endLocked={endSaved}
          shouldReduce={true} highlight
        />
        <div style={S.evoMethodSelect}>
          <div style={S.evoFieldLabel}>MÉTODO DE MEDIÇÃO</div>
          <select
            value={profile.bodyFat.method}
            onChange={e => onUpdate(['bodyFat', 'method'], e.target.value)}
            style={S.evoSelect}
          >
            {BF_METHODS.map(m => (
              <option key={m.id} value={m.id} style={{ background: '#0a0a0a' }}>{m.label}</option>
            ))}
          </select>
          <div style={S.evoMethodHint}>
            ⚠️ Use o mesmo método nas duas pontas pra ter dados comparáveis
          </div>
        </div>

        <MetricRow
          label="VO2 MAX" unit="ml/kg/min"
          startValue={profile.vo2max.start} endValue={profile.vo2max.end}
          onStartChange={v => onUpdate(['vo2max', 'start'], v)}
          onEndChange={v => onUpdate(['vo2max', 'end'], v)}
          startLocked={startSaved} endLocked={endSaved}
          shouldReduce={false}
        />
      </div>

      {/* MEDIDAS CORPORAIS */}
      <div style={S.evoCard}>
        <div style={S.evoCardTitle}>
          <span style={{ color: blockColor }}>MEDIDAS (cm)</span>
        </div>
        <div style={S.evoMeasurementsHeader}>
          <span style={S.evoMeasureLabel}></span>
          <span style={S.evoMeasureColHeader}>INÍCIO</span>
          <span style={S.evoMeasureColHeader}>FIM</span>
          <span style={S.evoMeasureColHeader}>Δ</span>
        </div>
        {MEASUREMENTS.map(m => (
          <MeasurementRow
            key={m.id}
            label={m.label}
            highlight={m.highlight}
            startValue={profile.measurements[m.id]?.start ?? ''}
            endValue={profile.measurements[m.id]?.end ?? ''}
            shouldReduce={SHOULD_REDUCE.includes(m.id)}
            onStartChange={v => onUpdate(['measurements', m.id, 'start'], v)}
            onEndChange={v => onUpdate(['measurements', m.id, 'end'], v)}
            startLocked={startSaved} endLocked={endSaved}
          />
        ))}
      </div>

      {/* BOTÕES DE SALVAR */}
      <div style={S.evoCard}>
        <div style={S.evoCardTitle}>
          <span style={{ color: blockColor }}>SALVAR SNAPSHOTS</span>
        </div>
        <div style={S.evoSaveText}>
          Quando terminar de preencher os dados, salve pra travar os valores e criar um marco do ciclo.
        </div>

        {/* SNAPSHOT INICIAL */}
        <div style={S.evoSaveBlock}>
          <div style={S.evoSaveHeader}>
            <div>
              <div style={S.evoSaveLabel}>DADOS INICIAIS</div>
              <div style={S.evoSaveCount}>{startFilledCount} de {totalFields} preenchidos</div>
            </div>
            {startSaved && (
              <div style={S.evoSavedBadge}>
                <CheckCircle2 size={12}/>
                <span>SALVO {formatDateTime(profile.startSavedAt)}</span>
              </div>
            )}
          </div>
          {!startSaved ? (
            <button
              onClick={saveStart}
              disabled={startFilledCount === 0}
              style={{
                ...S.evoSaveBtn,
                background: startFilledCount === 0 ? '#1f1f1f' : blockColor,
                color: startFilledCount === 0 ? '#525252' : '#0a0a0a',
                cursor: startFilledCount === 0 ? 'not-allowed' : 'pointer',
              }}
            >
              SALVAR DADOS INICIAIS
            </button>
          ) : (
            <button onClick={unsaveStart} style={S.evoUnsaveBtn}>
              <Edit3 size={12}/>
              <span>EDITAR DADOS INICIAIS</span>
            </button>
          )}
        </div>

        {/* SNAPSHOT FINAL */}
        <div style={S.evoSaveBlock}>
          <div style={S.evoSaveHeader}>
            <div>
              <div style={S.evoSaveLabel}>DADOS FINAIS</div>
              <div style={S.evoSaveCount}>{endFilledCount} de {totalFields} preenchidos</div>
            </div>
            {endSaved && (
              <div style={S.evoSavedBadge}>
                <CheckCircle2 size={12}/>
                <span>SALVO {formatDateTime(profile.endSavedAt)}</span>
              </div>
            )}
          </div>
          {!endSaved ? (
            <button
              onClick={saveEnd}
              disabled={endFilledCount === 0}
              style={{
                ...S.evoSaveBtn,
                background: endFilledCount === 0 ? '#1f1f1f' : '#22c55e',
                color: endFilledCount === 0 ? '#525252' : '#0a0a0a',
                cursor: endFilledCount === 0 ? 'not-allowed' : 'pointer',
              }}
            >
              SALVAR DADOS FINAIS
            </button>
          ) : (
            <button onClick={unsaveEnd} style={S.evoUnsaveBtn}>
              <Edit3 size={12}/>
              <span>EDITAR DADOS FINAIS</span>
            </button>
          )}
        </div>
      </div>

      {/* RELATÓRIO FINAL */}
      <FinalReport profile={profile} blockColor={blockColor}/>
    </div>
  );
}

function EvoField({ label, value, onChange, placeholder, type = 'text', locked = false }) {
  return (
    <div>
      <div style={S.evoFieldLabel}>{label}</div>
      <input
        type={type}
        inputMode={type === 'date' ? undefined : 'decimal'}
        value={value}
        placeholder={placeholder}
        disabled={locked}
        onChange={e => onChange(e.target.value)}
        style={{ ...S.evoInput, ...(locked ? S.inputLocked : {}) }}
      />
    </div>
  );
}

function MetricRow({ label, unit, startValue, endValue, onStartChange, onEndChange, shouldReduce, highlight, startLocked, endLocked }) {
  const start = parseFloat(startValue);
  const end = parseFloat(endValue);
  const hasComparison = !isNaN(start) && !isNaN(end);
  const diff = hasComparison ? end - start : null;
  const pctChange = hasComparison && start !== 0 ? ((end - start) / start) * 100 : null;

  let diffColor = '#737373';
  if (hasComparison && diff !== 0) {
    if (shouldReduce) {
      diffColor = diff < 0 ? '#22c55e' : '#ef4444';
    } else {
      diffColor = label === 'PESO' ? '#a3a3a3' : (diff > 0 ? '#22c55e' : '#ef4444');
    }
  }

  return (
    <div style={{ ...S.metricRow, ...(highlight ? S.metricRowHighlight : {}) }}>
      <div style={S.metricLabel}>
        <span>{label}</span>
        <span style={S.metricUnit}>{unit}</span>
      </div>
      <div style={S.metricInputs}>
        <div>
          <div style={S.metricColLabel}>INÍCIO</div>
          <input
            type="text" inputMode="decimal"
            value={startValue}
            disabled={startLocked}
            onChange={e => onStartChange(e.target.value)}
            placeholder="—"
            style={{ ...S.evoInput, ...(startLocked ? S.inputLocked : {}) }}
          />
        </div>
        <div>
          <div style={S.metricColLabel}>FIM</div>
          <input
            type="text" inputMode="decimal"
            value={endValue}
            disabled={endLocked}
            onChange={e => onEndChange(e.target.value)}
            placeholder="—"
            style={{ ...S.evoInput, ...(endLocked ? S.inputLocked : {}) }}
          />
        </div>
        <div>
          <div style={S.metricColLabel}>Δ</div>
          <div style={{ ...S.metricDiff, color: diffColor }}>
            {hasComparison ? (
              <>
                {diff === 0 ? <Minus size={12}/> : diff > 0 ? <ArrowUp size={12}/> : <ArrowDown size={12}/>}
                <span>{Math.abs(diff).toFixed(1)}</span>
              </>
            ) : <span style={{ color: '#404040' }}>—</span>}
          </div>
          {pctChange !== null && (
            <div style={{ ...S.metricDiffPct, color: diffColor }}>
              {pctChange > 0 ? '+' : ''}{pctChange.toFixed(1)}%
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MeasurementRow({ label, startValue, endValue, onStartChange, onEndChange, shouldReduce, highlight, startLocked, endLocked }) {
  const start = parseFloat(startValue);
  const end = parseFloat(endValue);
  const hasComparison = !isNaN(start) && !isNaN(end);
  const diff = hasComparison ? end - start : null;

  let diffColor = '#737373';
  if (hasComparison && diff !== 0) {
    if (shouldReduce) {
      diffColor = diff < 0 ? '#22c55e' : '#ef4444';
    } else {
      diffColor = diff > 0 ? '#22c55e' : (diff < 0 ? '#fbbf24' : '#737373');
    }
  }

  return (
    <div style={{ ...S.measureRow, ...(highlight ? S.measureRowHighlight : {}) }}>
      <span style={{ ...S.evoMeasureLabel, ...(highlight ? { color: '#fafafa', fontWeight: 600 } : {}) }}>{label}</span>
      <input
        type="text" inputMode="decimal"
        value={startValue}
        disabled={startLocked}
        onChange={e => onStartChange(e.target.value)}
        placeholder="—"
        style={{ ...S.evoInputSmall, ...(startLocked ? S.inputLocked : {}) }}
      />
      <input
        type="text" inputMode="decimal"
        value={endValue}
        disabled={endLocked}
        onChange={e => onEndChange(e.target.value)}
        placeholder="—"
        style={{ ...S.evoInputSmall, ...(endLocked ? S.inputLocked : {}) }}
      />
      <div style={{ ...S.measureDiff, color: diffColor }}>
        {hasComparison ? (
          <>
            {diff === 0 ? <Minus size={10}/> : diff > 0 ? <ArrowUp size={10}/> : <ArrowDown size={10}/>}
            <span>{Math.abs(diff).toFixed(1)}</span>
          </>
        ) : <span style={{ color: '#404040', fontSize: 11 }}>—</span>}
      </div>
    </div>
  );
}

function FinalReport({ profile, blockColor }) {
  // Conta quantas medidas tem dados completos (start + end)
  const completeCount = useMemo(() => {
    let count = 0;
    if (profile.weight.start && profile.weight.end) count++;
    if (profile.bodyFat.start && profile.bodyFat.end) count++;
    if (profile.vo2max.start && profile.vo2max.end) count++;
    MEASUREMENTS.forEach(m => {
      const v = profile.measurements[m.id];
      if (v?.start && v?.end) count++;
    });
    return count;
  }, [profile]);

  const totalFields = 3 + MEASUREMENTS.length; // peso, bf, vo2max + medidas

  // Destaque: maior redução em medida que deveria reduzir
  const highlights = useMemo(() => {
    const list = [];

    const weight = { start: parseFloat(profile.weight.start), end: parseFloat(profile.weight.end) };
    if (!isNaN(weight.start) && !isNaN(weight.end) && weight.start !== weight.end) {
      list.push({ label: 'Peso', diff: weight.end - weight.start, unit: 'kg', shouldReduce: true });
    }

    const bf = { start: parseFloat(profile.bodyFat.start), end: parseFloat(profile.bodyFat.end) };
    if (!isNaN(bf.start) && !isNaN(bf.end) && bf.start !== bf.end) {
      list.push({ label: '% Gordura', diff: bf.end - bf.start, unit: '%', shouldReduce: true });
    }

    MEASUREMENTS.forEach(m => {
      const v = profile.measurements[m.id];
      const s = parseFloat(v?.start);
      const e = parseFloat(v?.end);
      if (!isNaN(s) && !isNaN(e) && s !== e) {
        const sr = SHOULD_REDUCE.includes(m.id);
        list.push({ label: m.label, diff: e - s, unit: 'cm', shouldReduce: sr });
      }
    });

    // Ordena por impacto absoluto
    return list.sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff));
  }, [profile]);

  if (completeCount === 0) {
    return (
      <div style={S.evoCard}>
        <div style={S.evoCardTitle}>
          <span style={{ color: blockColor }}>RELATÓRIO FINAL</span>
        </div>
        <div style={S.reportEmpty}>
          Preencha INÍCIO e FIM de pelo menos uma métrica pra ver a comparação aqui.
        </div>
      </div>
    );
  }

  return (
    <div style={S.evoCard}>
      <div style={S.evoCardTitle}>
        <span style={{ color: blockColor }}>RELATÓRIO FINAL</span>
        <span style={S.reportCount}>{completeCount}/{totalFields} preenchidas</span>
      </div>
      <div style={S.reportList}>
        {highlights.slice(0, 8).map((h, i) => {
          const isPositive = h.shouldReduce ? h.diff < 0 : h.diff > 0;
          const color = isPositive ? '#22c55e' : '#ef4444';
          return (
            <div key={i} style={S.reportRow}>
              <span style={S.reportLabel}>{h.label}</span>
              <div style={{ ...S.reportDiff, color }}>
                {h.diff < 0 ? <ArrowDown size={12}/> : <ArrowUp size={12}/>}
                <span>{Math.abs(h.diff).toFixed(1)} {h.unit}</span>
              </div>
            </div>
          );
        })}
      </div>
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

  sectionHeader: { display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, marginBottom: 10 },
  sectionHeaderText: { fontSize: 10, color: '#737373', letterSpacing: '0.3em', fontWeight: 700 },

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
  checkBtnWide: {
    background: '#0a0a0a', border: '1px solid #262626', borderRadius: 4, padding: '10px 16px',
    display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fafafa',
    transition: 'all 0.15s', gridColumn: 'span 4', marginTop: 4,
  },

  cardioGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: 8,
    marginTop: 8,
  },
  cardioFieldWrap: { display: 'flex', flexDirection: 'column', gap: 4 },
  cardioFieldLabel: { fontSize: 9, color: '#525252', letterSpacing: '0.2em', fontWeight: 600, textAlign: 'center' },

  statsCardGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 12,
  },
  statsCardHint: {
    fontSize: 10, color: '#525252', marginTop: 10,
    lineHeight: 1.5, fontStyle: 'italic',
  },

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

  // Seletor de período (PROGRESSO)
  periodSelector: {
    display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6,
    padding: 4, background: '#0f0f0f', border: '1px solid #1f1f1f', borderRadius: 8,
  },
  periodBtn: {
    background: 'transparent', border: 'none', borderRadius: 6,
    padding: '10px 6px', color: '#737373',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
    transition: 'all 0.15s',
  },
  periodBtnActive: {
    background: '#1f1f1f', color: '#fafafa',
  },
  periodBtnLabel: { fontSize: 10, fontWeight: 700, letterSpacing: '0.2em' },
  periodBtnSublabel: { fontSize: 10, fontFamily: "'JetBrains Mono', monospace", color: '#525252' },
  periodHeader: { padding: '4px 0' },
  periodHeaderLabel: { fontFamily: "'Anton', sans-serif", fontSize: 22, letterSpacing: '0.04em', lineHeight: 1 },
  periodHeaderSubtitle: { fontSize: 11, color: '#737373', marginTop: 4, fontFamily: "'JetBrains Mono', monospace" },

  // Card de média por dia (pra nutri)
  avgCard: {
    background: 'rgba(239, 68, 68, 0.04)', border: '1px solid #7f1d1d',
    borderRadius: 10, padding: 16,
  },
  avgCardHeader: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 14,
  },
  avgCardLabel: { fontSize: 10, fontWeight: 700, letterSpacing: '0.2em', color: '#ef4444' },
  avgCardCount: { fontSize: 10, color: '#737373', fontFamily: "'JetBrains Mono', monospace" },
  avgCardGrid: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-around',
  },
  avgItem: { textAlign: 'center', flex: 1 },
  avgItemValue: { fontFamily: "'Anton', sans-serif", fontSize: 28, color: '#fafafa', lineHeight: 1 },
  avgItemLabel: { fontSize: 9, color: '#737373', letterSpacing: '0.15em', marginTop: 6, textTransform: 'uppercase' },
  avgItemDivider: { width: 1, height: 32, background: '#262626' },

  statCard: { background: '#141414', border: '1px solid #1f1f1f', borderRadius: 8, padding: '14px 8px', textAlign: 'center' },
  statCardLabel: { fontSize: 9, color: '#525252', letterSpacing: '0.2em', fontWeight: 600, marginBottom: 6 },
  statCardValue: { fontFamily: "'Anton', sans-serif", fontSize: 24, letterSpacing: '0.02em', lineHeight: 1 },
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

  // EVOLUÇÃO
  evoWrap: { position: 'relative', zIndex: 1, padding: '20px', maxWidth: 720, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 12 },
  evoIntro: { padding: '0 0 8px' },
  evoIntroTitle: { fontFamily: "'Anton', sans-serif", fontSize: 28, letterSpacing: '0.04em', lineHeight: 1, marginBottom: 8 },
  evoIntroText: { fontSize: 12, color: '#a3a3a3', lineHeight: 1.5 },

  // BANNER DO CICLO (aba TREINO)
  cycleBanner: {
    position: 'relative', zIndex: 1, maxWidth: 680,
    margin: '16px 20px 0', padding: '12px 16px',
    border: '1px solid #1f1f1f', borderRadius: 8, background: '#0f0f0f',
  },
  cycleBannerInner: { display: 'flex', alignItems: 'center', gap: 16 },
  cycleNumberWrap: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    padding: '6px 14px', borderRight: '1px solid #262626',
  },
  cycleNumberLabel: { fontSize: 9, color: '#525252', letterSpacing: '0.25em', fontWeight: 700, marginBottom: 2 },
  cycleNumber: { fontFamily: "'Anton', sans-serif", fontSize: 26, letterSpacing: '0.04em', lineHeight: 1, color: '#fafafa' },
  cycleDates: { fontSize: 13, color: '#fafafa', fontFamily: "'JetBrains Mono', monospace", fontWeight: 600 },
  cycleSubtitle: { fontSize: 10, color: '#737373', letterSpacing: '0.15em', textTransform: 'uppercase', marginTop: 4 },
  cycleLinkBadge: {
    fontSize: 9, color: '#737373', fontWeight: 500,
    letterSpacing: '0.1em', textTransform: 'lowercase',
  },
  evoCard: { background: '#141414', border: '1px solid #1f1f1f', borderRadius: 10, padding: 16, display: 'flex', flexDirection: 'column', gap: 12 },
  evoCardTitle: { display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', fontSize: 11, fontWeight: 700, letterSpacing: '0.2em', marginBottom: 4 },
  evoFieldGrid: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 },
  evoFieldLabel: { fontSize: 9, color: '#525252', letterSpacing: '0.2em', fontWeight: 600, marginBottom: 4 },
  evoFieldStatic: { background: '#0a0a0a', border: '1px dashed #262626', borderRadius: 4, padding: '8px 10px', fontSize: 14, fontWeight: 500, color: '#a3a3a3', textAlign: 'center', fontFamily: "'JetBrains Mono', monospace" },
  evoInput: { background: '#0a0a0a', border: '1px solid #262626', borderRadius: 4, padding: '8px 10px', color: '#fafafa', fontSize: 14, fontWeight: 500, textAlign: 'center', width: '100%', fontFamily: "'JetBrains Mono', monospace" },
  evoInputSmall: { background: '#0a0a0a', border: '1px solid #262626', borderRadius: 4, padding: '6px 6px', color: '#fafafa', fontSize: 12, fontWeight: 500, textAlign: 'center', width: '100%', fontFamily: "'JetBrains Mono', monospace" },
  evoCountdown: { fontSize: 12, color: '#a3a3a3', textAlign: 'center', padding: '8px', background: '#0a0a0a', borderRadius: 6, marginTop: 4 },
  evoSelect: { background: '#0a0a0a', border: '1px solid #262626', borderRadius: 4, padding: '8px 10px', color: '#fafafa', fontSize: 13, width: '100%', fontFamily: "'IBM Plex Sans', sans-serif" },
  evoMethodSelect: { padding: '8px 0' },
  evoMethodHint: { fontSize: 10, color: '#525252', marginTop: 6, fontStyle: 'italic' },

  metricRow: { padding: '12px 0', borderBottom: '1px solid #1f1f1f' },
  metricRowHighlight: { background: 'rgba(245, 158, 11, 0.03)', margin: '0 -16px', padding: '12px 16px' },
  metricLabel: { display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 },
  metricUnit: { fontSize: 10, color: '#525252', fontFamily: "'JetBrains Mono', monospace" },
  metricInputs: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 },
  metricColLabel: { fontSize: 9, color: '#525252', letterSpacing: '0.2em', fontWeight: 600, marginBottom: 4, textAlign: 'center' },
  metricDiff: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, fontSize: 14, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", height: 34, border: '1px solid #1f1f1f', borderRadius: 4, background: '#0a0a0a' },
  metricDiffPct: { fontSize: 9, textAlign: 'center', marginTop: 3, fontFamily: "'JetBrains Mono', monospace", fontWeight: 600 },

  evoMeasurementsHeader: { display: 'grid', gridTemplateColumns: '1.6fr 1fr 1fr 0.8fr', gap: 8, paddingBottom: 6, borderBottom: '1px solid #1f1f1f' },
  evoMeasureColHeader: { fontSize: 9, color: '#525252', letterSpacing: '0.2em', fontWeight: 600, textAlign: 'center' },
  evoMeasureLabel: { fontSize: 12, color: '#a3a3a3', display: 'flex', alignItems: 'center' },
  measureRow: { display: 'grid', gridTemplateColumns: '1.6fr 1fr 1fr 0.8fr', gap: 8, alignItems: 'center', padding: '6px 0' },
  measureRowHighlight: { background: 'rgba(245, 158, 11, 0.04)', margin: '0 -8px', padding: '6px 8px', borderRadius: 4 },
  measureDiff: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3, fontSize: 12, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" },

  reportEmpty: { fontSize: 12, color: '#525252', textAlign: 'center', padding: 16, fontStyle: 'italic' },
  reportList: { display: 'flex', flexDirection: 'column', gap: 6 },
  reportRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: '#0a0a0a', borderRadius: 4 },
  reportLabel: { fontSize: 12, color: '#d4d4d4' },
  reportDiff: { display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" },
  reportCount: { fontSize: 10, color: '#525252', letterSpacing: '0.1em', fontWeight: 500 },

  // Botões de salvar snapshot
  evoSaveText: { fontSize: 11, color: '#a3a3a3', lineHeight: 1.5, marginBottom: 4 },
  evoSaveBlock: {
    background: '#0a0a0a', border: '1px solid #1f1f1f', borderRadius: 8, padding: 14,
    display: 'flex', flexDirection: 'column', gap: 12,
  },
  evoSaveHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 },
  evoSaveLabel: { fontSize: 11, fontWeight: 700, letterSpacing: '0.2em', color: '#fafafa' },
  evoSaveCount: { fontSize: 10, color: '#737373', fontFamily: "'JetBrains Mono', monospace", marginTop: 4 },
  evoSavedBadge: {
    display: 'flex', alignItems: 'center', gap: 4,
    fontSize: 9, color: '#22c55e', fontWeight: 700, letterSpacing: '0.1em',
    fontFamily: "'JetBrains Mono', monospace",
    padding: '4px 8px', border: '1px solid #14532d', borderRadius: 3,
    background: 'rgba(34, 197, 94, 0.08)',
  },
  evoSaveBtn: {
    width: '100%', border: 'none', borderRadius: 6, padding: '12px 16px',
    fontSize: 12, fontWeight: 800, letterSpacing: '0.2em',
    fontFamily: "'IBM Plex Sans', sans-serif",
    transition: 'all 0.15s',
  },
  evoUnsaveBtn: {
    width: '100%', background: 'transparent', border: '1px solid #262626',
    color: '#a3a3a3', padding: '10px 16px', borderRadius: 6,
    fontSize: 11, fontWeight: 700, letterSpacing: '0.2em',
    fontFamily: "'JetBrains Mono', monospace",
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
};
