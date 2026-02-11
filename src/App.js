import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { 
  Dumbbell, 
  Utensils, 
  Home, 
  Plus, 
  Flame, 
  CheckCircle2, 
  Trophy,
  ChevronRight,
  ChevronLeft,
  Activity,
  CalendarDays,
  Upload,
  Download,
  Coffee,
  Sun,
  PieChart,
  Trash2,
  Wine,
  XCircle,
  Lock,
  ArrowRight,
  Clock
} from 'lucide-react';

// --- CONSTANTES GLOBALES (Sincronizadas con PDF de Luca) ---
const NUTRITION_GOALS = { 
  calories: 2600, protein: 200, carbs: 300, fat: 70       
};

const FOOD_DATABASE = [
  // Desayunos / Meriendas (Opciones exactas del PDF)
  { id: 'd1', label: 'Opción 1: 4 Tostadas + 4 cdas Queso Untable + 1 Fruta + Leche', calories: 480, protein: 22, carbs: 75, fat: 10, type: 'breakfast' },
  { id: 'd2', label: 'Opción 2: 2 Sandwich Jamón/Lomo + Veg + 2 Frutas + Leche', calories: 550, protein: 30, carbs: 85, fat: 12, type: 'breakfast' },
  { id: 'd3', label: 'Opción 3: 70g Cereales/Avena + Leche + Whey + 1 Fruta', calories: 510, protein: 35, carbs: 70, fat: 8, type: 'breakfast' },
  { id: 'd4', label: 'Opción 4: Tortilla Avena (80g) + 1 Fruta + Leche + 2 Huevos', calories: 560, protein: 32, carbs: 80, fat: 15, type: 'breakfast' },
  
  // Hidratos (Almuerzo/Cena - Cantidades en crudo)
  { id: 'c1', label: 'Arroz / Fideos / Polenta (120g crudo)', calories: 420, protein: 10, carbs: 90, fat: 2, type: 'carb' },
  { id: 'c2', label: 'Papa o Batata (400g)', calories: 350, protein: 8, carbs: 80, fat: 1, type: 'carb' },
  { id: 'c3', label: 'Legumbres (1.5 latas/cajas)', calories: 340, protein: 18, carbs: 60, fat: 2, type: 'carb' },
  { id: 'c4', label: 'Choclo en granos (2 latas)', calories: 360, protein: 10, carbs: 75, fat: 4, type: 'carb' },
  { id: 'c5', label: 'Fajitas o Rapiditas (6 unidades)', calories: 450, protein: 12, carbs: 85, fat: 6, type: 'carb' },
  
  // Proteínas (Almuerzo/Cena - Cantidades en crudo)
  { id: 'p1', label: 'Pollo / Pescado Magro (250g crudo)', calories: 280, protein: 55, carbs: 0, fat: 6, type: 'protein' },
  { id: 'p2', label: 'Carne Roja Magra (250g crudo)', calories: 350, protein: 52, carbs: 0, fat: 14, type: 'protein' },
  { id: 'p3', label: 'Cerdo (Lomo/Solomillo/Carre) (250g crudo)', calories: 320, protein: 48, carbs: 0, fat: 12, type: 'protein' },
  { id: 'p4', label: 'Atún (1 lata) + 1 Huevo + 2 Claras + Queso', calories: 290, protein: 42, carbs: 5, fat: 10, type: 'protein' },
  
  // Verduras
  { id: 'v1', label: 'Vegetales Mixtos (300g)', calories: 100, protein: 4, carbs: 15, fat: 0, type: 'veggie' },
];

const INITIAL_WORKOUT_PLAN = [
  { week: 1, day: 1, title: 'Empuje (Pecho/Hombro)', exercises: [{ id: 'w1d1e1', name: 'Press Banca', sets: '4x8', rest: '90s', completed: false, weight: '' }, { id: 'w1d1e2', name: 'Press Militar', sets: '3x10', rest: '60s', completed: false, weight: '' }] },
  { week: 1, day: 2, title: 'Tracción (Espalda)', exercises: [{ id: 'w1d2e1', name: 'Dominadas', sets: '4xMax', rest: '120s', completed: false, weight: '' }, { id: 'w1d2e2', name: 'Remo con Barra', sets: '4x10', rest: '90s', completed: false, weight: '' }] },
];

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const scrollContainerRef = useRef(null);

  // --- ESTADOS ---
  const [showAddMealModal, setShowAddMealModal] = useState(false);
  const [selectedMealType, setSelectedMealType] = useState('desayuno'); 
  const [showImportModal, setShowImportModal] = useState(false);
  const [importType, setImportType] = useState(null); 
  const [detailTab, setDetailTab] = useState('nutrition');

  // Tiempo
  const [currentDate, setCurrentDate] = useState(new Date(2026, 1, 11)); 
  const [viewDate, setViewDate] = useState(new Date(2026, 1, 11)); 
  const formatDateKey = (date) => date.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });

  // Datos Diarios
  const [dailyLog, setDailyLog] = useState({ desayuno: [], almuerzo: [], merienda: [], cena: [] });
  const [consumed, setConsumed] = useState({ calories: 0, protein: 0, carbs: 0, fat: 0 });
  const [alcoholLog, setAlcoholLog] = useState({ consumed: false, fernet: 0, beer: 0, wine: 0 });
  const [dailyStatus, setDailyStatus] = useState('active'); 
  const [nutritionStatus, setNutritionStatus] = useState('active');
  
  // Historial
  const [history, setHistory] = useState([]);
  const [selectedHistoryDay, setSelectedHistoryDay] = useState(null);

  // Entrenamiento
  const [workoutPlan, setWorkoutPlan] = useState(INITIAL_WORKOUT_PLAN); 
  const [currentSessionIndex, setCurrentSessionIndex] = useState(0); 
  const [exercises, setExercises] = useState(INITIAL_WORKOUT_PLAN[0].exercises); 
  const [workoutProgress, setWorkoutProgress] = useState(0);

  // --- FUNCIONES AUXILIARES ---
  const getStatusLabel = (status) => {
    if (status === 'perfect') return 'COMPLETADO';
    if (status === 'good') return 'INCOMPLETO';
    if (status === 'rest') return 'DESCANSO';
    return 'SIN DATOS';
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const lastDay = new Date(year, month + 1, 0).getDate();
    const firstDayIndex = new Date(year, month, 1).getDay(); 
    const startOffset = firstDayIndex === 0 ? 6 : firstDayIndex - 1; 
    const days = [];
    for (let i = 0; i < startOffset; i++) days.push(null);
    for (let i = 1; i <= lastDay; i++) days.push(new Date(year, month, i));
    return days;
  };

  // --- EFECTOS ---
  
  // Scroll automático al inicio al cambiar de pestaña
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
    window.scrollTo(0, 0);
  }, [activeTab]);

  // Recalcular Macros
  useEffect(() => {
    let total = { calories: 0, protein: 0, carbs: 0, fat: 0 };
    Object.values(dailyLog).forEach(arr => arr.forEach(f => {
      total.calories += (Number(f.calories) || 0);
      total.protein += (Number(f.protein) || 0);
      total.carbs += (Number(f.carbs) || 0);
      total.fat += (Number(f.fat) || 0);
    }));
    setConsumed(total);
  }, [dailyLog]);

  useEffect(() => {
    if (exercises.length === 0) { setWorkoutProgress(0); return; }
    const done = exercises.filter(e => e.completed).length;
    setWorkoutProgress(Math.round((done / exercises.length) * 100));
  }, [exercises]);

  // --- MANEJADORES ---

  const handleAddFoodToLog = (food) => {
    if (nutritionStatus !== 'active') return;
    setDailyLog(prev => ({ 
      ...prev, 
      [selectedMealType]: [...prev[selectedMealType], { ...food, logId: Date.now() }] 
    }));
    setShowAddMealModal(false);
  };

  const removeFoodFromLog = (meal, id) => {
    if (nutritionStatus !== 'active') return;
    setDailyLog(prev => ({ ...prev, [meal]: prev[meal].filter(i => i.logId !== id) }));
  };

  const updateAlcohol = (type, delta) => {
    if (nutritionStatus !== 'active') return;
    setAlcoholLog(prev => ({ ...prev, [type]: Math.max(0, prev[type] + delta) }));
  };

  const saveHistory = useCallback((eventType) => {
    const todayStr = formatDateKey(currentDate);
    const alcData = alcoholLog.consumed ? { ...alcoholLog } : null;
    const isRest = eventType === 'rest' || dailyStatus === 'rest';
    
    const entry = {
      dateStr: todayStr,
      date: new Date(currentDate),
      calories: consumed.calories,
      macros: { p: consumed.protein, c: consumed.carbs, f: consumed.fat },
      workoutProg: isRest ? 0 : workoutProgress,
      status: isRest ? 'rest' : (workoutProgress === 100 ? 'perfect' : 'good'),
      type: isRest ? 'rest' : 'workout',
      details: exercises.map(e => ({ ...e })),
      alcohol: alcData,
      nutritionLog: JSON.parse(JSON.stringify(dailyLog))
    };

    setHistory(prev => [entry, ...prev.filter(h => h.dateStr !== todayStr)]);
  }, [currentDate, alcoholLog, dailyLog, consumed, workoutProgress, dailyStatus, exercises]);

  const handleFinishNutritionDay = () => {
    saveHistory('nutrition_update');
    setNutritionStatus('completed');
  };

  const handleFinishWorkout = () => {
    saveHistory('workout');
    setDailyStatus('completed');
  };

  const handleRestDay = () => {
    saveHistory('rest');
    setDailyStatus('rest');
  };

  const toggleExercise = (id) => {
    if (dailyStatus !== 'active') return;
    setExercises(prev => prev.map(ex => ex.id === id ? { ...ex, completed: !ex.completed } : ex));
  };

  const updateWeight = (id, weight) => {
    if (dailyStatus !== 'active') return;
    setExercises(prev => prev.map(ex => ex.id === id ? { ...ex, weight } : ex));
  };

  const simulateNextDay = () => {
    const next = new Date(currentDate);
    next.setDate(next.getDate() + 1);
    setCurrentDate(next);
    setViewDate(next);

    if (dailyStatus === 'completed') {
      const idx = (currentSessionIndex + 1) % workoutPlan.length;
      setCurrentSessionIndex(idx);
      setExercises(workoutPlan[idx].exercises.map(e => ({ ...e, completed: false, weight: '' })));
    }
    
    setDailyStatus('active');
    setNutritionStatus('active');
    setWorkoutProgress(0);
    setDailyLog({ desayuno: [], almuerzo: [], merienda: [], cena: [] });
    setAlcoholLog({ consumed: false, fernet: 0, beer: 0, wine: 0 }); 
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const lines = event.target.result.split(/\r\n|\n/);
      const newPlanMap = {};
      for (let i = 1; i < lines.length; i++) {
        const c = lines[i].split(',');
        if (c.length < 3) continue;
        const key = `w${c[0]}d${c[1]}`;
        if (!newPlanMap[key]) newPlanMap[key] = { week: c[0], day: c[1], title: `Semana ${c[0]} - Día ${c[1]}`, exercises: [] };
        newPlanMap[key].exercises.push({ id: `${key}_${i}`, name: c[2], sets: `${c[3]||3}x${c[4]||10}`, rest: c[5]||'', completed: false, weight: '' });
      }
      const sorted = Object.values(newPlanMap).sort((a,b) => Number(a.week) - Number(b.week) || Number(a.day) - Number(b.day));
      if (sorted.length > 0) {
        setWorkoutPlan(sorted);
        setExercises(sorted[0].exercises);
        setCurrentSessionIndex(0);
        setShowImportModal(false);
      }
    };
    reader.readAsText(file);
  };

  const downloadWorkoutTemplate = () => {
    const csvContent = "Semana,Dia,Ejercicio,Series,Repeticiones,Pausa\n1,1,Press Banca,4,8,90s";
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'plantilla.csv'; a.click();
  };

  const selectedDayData = useMemo(() => {
    if (!selectedHistoryDay) return null;
    return history.find(h => h.dateStr === formatDateKey(selectedHistoryDay));
  }, [selectedHistoryDay, history]);

  // --- RENDER HELPERS ---
  const renderProgressBar = (cur, max, color, label) => {
    const per = Math.min(100, Math.max(0, (cur / max) * 100));
    return (
      <div className="mb-3 text-left">
        <div className="flex justify-between text-[10px] font-black mb-1 text-gray-500 uppercase tracking-tighter">
          <span>{label}</span>
          <span>{cur} / {max}g</span>
        </div>
        <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
          <div className={`h-full ${color} transition-all duration-700`} style={{ width: `${per}%` }}></div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center">
      <div className="max-w-md w-full h-screen bg-white shadow-2xl overflow-hidden flex flex-col relative">
        
        {/* CONTENEDOR SCROLLABLE */}
        <main ref={scrollContainerRef} className="flex-1 overflow-y-auto p-6 pb-24 bg-white relative scroll-smooth">
          
          {/* HOME */}
          {activeTab === 'home' && (
            <div className="space-y-8 animate-in fade-in duration-500">
              <header className="flex justify-between items-center">
                <div className="text-left">
                  <h1 className="text-2xl font-black text-gray-800 tracking-tight">Luca 👋</h1>
                  <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">{formatDateKey(currentDate)}</p>
                </div>
                <div className="h-12 w-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white font-black shadow-lg">LM</div>
              </header>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gradient-to-br from-orange-500 to-red-600 p-6 rounded-[2rem] text-white shadow-xl">
                  <Flame size={20} className="mb-3 opacity-80" />
                  <div className="text-3xl font-black">{Math.max(0, NUTRITION_GOALS.calories - consumed.calories)}</div>
                  <div className="text-[10px] opacity-70 font-bold uppercase mt-1 tracking-widest">kcal restantes</div>
                </div>
                <div className="bg-gradient-to-br from-indigo-500 to-blue-700 p-6 rounded-[2rem] text-white shadow-xl">
                  <Activity size={20} className="mb-3 opacity-80" />
                  <div className="text-3xl font-black">{dailyStatus === 'active' ? `${workoutProgress}%` : '¡Hecho!'}</div>
                  <div className="text-[10px] opacity-70 font-bold uppercase mt-1 tracking-widest">progreso hoy</div>
                </div>
              </div>

              <div className="pt-4 text-left">
                <h3 className="font-black text-gray-800 mb-4 flex items-center text-xs uppercase tracking-widest">Tu Plan de Hoy</h3>
                <div onClick={() => setActiveTab('workout')} className={`p-6 rounded-[2rem] border border-gray-100 shadow-sm flex items-center justify-between cursor-pointer active:scale-[0.97] transition-all bg-white hover:bg-gray-50 ${dailyStatus !== 'active' ? 'opacity-50 grayscale' : ''}`}>
                  <div className="flex items-center space-x-5">
                    <div className="bg-indigo-50 p-4 rounded-2xl text-indigo-600 shadow-inner"><CalendarDays size={24} /></div>
                    <div>
                      <h4 className="font-bold text-gray-800 text-sm tracking-tight">{workoutPlan[currentSessionIndex]?.title || 'Entrenamiento'}</h4>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1 tracking-tighter">Toca para abrir ejercicios</p>
                    </div>
                  </div>
                  <ChevronRight size={20} className="text-gray-300" />
                </div>
              </div>
            </div>
          )}

          {/* NUTRICIÓN */}
          {activeTab === 'nutrition' && (
            <div className="space-y-6 relative animate-in fade-in duration-500">
              {nutritionStatus === 'completed' && (
                <div className="absolute inset-0 z-[10] bg-white/95 backdrop-blur-[4px] flex flex-col items-center justify-center p-8 text-center rounded-3xl border-2 border-emerald-100 h-full">
                  <div className="bg-emerald-500 p-6 rounded-full mb-6 text-white shadow-2xl animate-bounce"><Lock size={56} /></div>
                  <h2 className="text-2xl font-black text-gray-800 tracking-tight">Día Cerrado</h2>
                  <p className="text-sm text-gray-400 font-bold mb-8">El registro ha sido enviado al historial.</p>
                  <button onClick={simulateNextDay} className="bg-indigo-600 text-white px-10 py-4 rounded-[2rem] font-black text-xs uppercase shadow-xl tracking-widest active:scale-95 transition-all flex items-center"><Sun size={14} className="mr-2"/> Siguiente Día</button>
                </div>
              )}

              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-black text-gray-800 tracking-tight">Nutrición</h2>
                <button onClick={() => {setImportType('nutrition'); setShowImportModal(true);}} className="p-2.5 bg-indigo-50 text-indigo-600 rounded-2xl hover:bg-indigo-100 transition-colors"><Upload size={20} /></button>
              </div>

              <div className="p-6 rounded-[2rem] border border-indigo-100 bg-white shadow-sm">
                <div className="flex items-end justify-between mb-6 text-left">
                  <div><p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Calorías Totales</p><span className="text-4xl font-black text-gray-800">{consumed.calories}</span><span className="text-sm text-gray-300 font-bold ml-1">/ {NUTRITION_GOALS.calories}</span></div>
                  <div className="text-xs font-black bg-indigo-50 text-indigo-600 px-4 py-1.5 rounded-full">{Math.round((consumed.calories / NUTRITION_GOALS.calories) * 100)}%</div>
                </div>
                {renderProgressBar(consumed.protein, NUTRITION_GOALS.protein, "bg-indigo-500", "Proteína")}
                {renderProgressBar(consumed.carbs, NUTRITION_GOALS.carbs, "bg-emerald-500", "Hidratos")}
                {renderProgressBar(consumed.fat, NUTRITION_GOALS.fat, "bg-orange-500", "Grasas")}
              </div>

              {['desayuno', 'almuerzo', 'merienda', 'cena'].map(meal => (
                <div key={meal} className="space-y-2">
                  <div className="flex justify-between items-center px-4">
                    <h4 className="font-black text-gray-800 uppercase tracking-widest text-[10px]">{meal}</h4>
                    <span className="text-[10px] font-black text-gray-300 uppercase">{dailyLog[meal].reduce((a, b) => a + (Number(b.calories) || 0), 0)} kcal</span>
                  </div>
                  <div className="p-4 rounded-[2rem] border border-dashed border-gray-200 bg-gray-50/50 flex flex-col justify-center">
                    {dailyLog[meal].map(item => (
                      <div key={item.logId} className="flex justify-between items-center bg-white p-4 rounded-2xl border border-gray-100 mb-2 shadow-sm">
                        <div className="text-left"><p className="font-bold text-xs text-gray-700">{item.label}</p><p className="text-[9px] text-gray-400 font-bold uppercase mt-0.5">{item.calories} kcal</p></div>
                        <Trash2 size={16} className="text-gray-300 hover:text-red-500 cursor-pointer" onClick={() => removeFoodFromLog(meal, item.logId)} />
                      </div>
                    ))}
                    <button onClick={() => { setSelectedMealType(meal); setShowAddMealModal(true); }} className="w-full py-3 text-[10px] text-indigo-600 font-black border-2 border-indigo-50 rounded-2xl bg-white hover:bg-indigo-50 transition-all uppercase tracking-widest">+ Registrar</button>
                  </div>
                </div>
              ))}

              <div className={`p-6 rounded-[2rem] border border-gray-100 bg-white shadow-sm transition-all ${alcoholLog.consumed ? 'bg-purple-50 border-purple-100' : ''}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center"><Wine size={18} className={`mr-2 ${alcoholLog.consumed ? 'text-purple-600' : 'text-gray-400'}`} /><span className="text-xs font-black text-gray-600 uppercase tracking-tighter">¿Hubo alcohol hoy?</span></div>
                  <button onClick={() => setAlcoholLog(p => ({...p, consumed: !p.consumed}))} className={`w-12 h-6 rounded-full relative transition-all duration-500 ${alcoholLog.consumed ? 'bg-purple-600' : 'bg-gray-200'}`}><div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-all duration-300 ${alcoholLog.consumed ? 'left-7' : 'left-1'}`} /></button>
                </div>
                {alcoholLog.consumed && (
                  <div className="grid grid-cols-3 gap-4 mt-6 animate-in zoom-in-95 text-center">
                    {['fernet', 'beer', 'wine'].map(d => (
                      <div key={d}><span className="text-[9px] font-black text-gray-400 capitalize mb-1 block">{d === 'beer' ? 'Birra' : d}</span><div className="flex items-center justify-center space-x-2 bg-white rounded-xl border border-purple-100 p-1 shadow-sm"><button onClick={() => updateAlcohol(d, -1)} className="w-6 h-6 bg-gray-50 rounded-lg text-xs font-black">-</button><span className="font-black text-xs w-4">{alcoholLog[d]}</span><button onClick={() => updateAlcohol(d, 1)} className="w-6 h-6 bg-purple-100 text-purple-600 rounded-lg text-xs font-black">+</button></div></div>
                    ))}
                  </div>
                )}
              </div>

              <button onClick={handleFinishNutritionDay} className="w-full py-5 bg-emerald-500 text-white rounded-[2rem] font-black shadow-xl uppercase tracking-widest text-xs flex items-center justify-center active:scale-95 transition-all"><Trophy size={20} className="mr-3" /> Finalizar Registro</button>
            </div>
          )}

          {/* ENTRENAMIENTO */}
          {activeTab === 'workout' && (
            <div className="space-y-6 relative animate-in fade-in duration-500">
              {dailyStatus !== 'active' && (
                <div className="absolute inset-0 z-[10] bg-white/95 backdrop-blur-[6px] flex flex-col items-center justify-center p-8 text-center rounded-[2rem] border-2 border-emerald-100 h-full">
                  <div className="bg-emerald-500 p-6 rounded-full mb-6 text-white animate-bounce shadow-2xl"><Trophy size={56} /></div>
                  <h2 className="text-3xl font-black text-gray-800 tracking-tight">¡Logrado!</h2>
                  <button onClick={simulateNextDay} className="bg-indigo-600 text-white px-12 py-4 rounded-[2rem] font-black text-xs uppercase shadow-xl tracking-widest active:scale-95 transition-all">Siguiente Día</button>
                </div>
              )}

              <div className="flex justify-between items-center text-left">
                <div>
                  <h2 className="text-2xl font-black text-gray-800 tracking-tight">Entrenamiento</h2>
                  <p className="text-xs font-bold text-indigo-600 uppercase tracking-[0.2em] mt-1">
                    Semana {workoutPlan[currentSessionIndex]?.week || '1'} — Día {workoutPlan[currentSessionIndex]?.day || '1'}
                  </p>
                </div>
                <button onClick={() => {setImportType('workout'); setShowImportModal(true);}} className="p-2.5 bg-indigo-50 text-indigo-600 rounded-2xl hover:bg-indigo-100 transition-colors"><Upload size={20} /></button>
              </div>

              <div className="space-y-5">
                {exercises.map(ex => (
                  <div key={ex.id} className={`p-6 rounded-[2.5rem] border transition-all duration-300 ${ex.completed ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-gray-100 shadow-sm'}`}>
                    <div className="flex justify-between items-start cursor-pointer" onClick={() => toggleExercise(ex.id)}>
                      <div className="flex space-x-5 text-left text-gray-800 flex-1">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xs font-black ${ex.completed ? 'bg-emerald-200 text-emerald-700 shadow-inner' : 'bg-gray-100 text-gray-400'}`}>{ex.sets.split('x')[0]}</div>
                        <div className="flex-1">
                          <h4 className={`font-black text-base tracking-tight ${ex.completed ? 'line-through text-gray-300' : ''}`}>{ex.name}</h4>
                          <div className="flex items-center space-x-3 mt-1.5"><span className="text-[10px] text-gray-400 font-black uppercase tracking-widest">{ex.sets} REPS</span>{ex.rest && <span className="flex items-center text-[9px] text-orange-600 bg-orange-100 px-2.5 py-1 rounded-full font-black tracking-tighter"><Clock size={12} className="mr-1"/> {ex.rest}</span>}</div>
                        </div>
                      </div>
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center border-2 transition-all duration-500 ${ex.completed ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-gray-100 bg-gray-50'}`}>{ex.completed ? <CheckCircle2 size={18} /> : <div className="w-2 h-2 rounded-full bg-white shadow-sm" />}</div>
                    </div>
                    {!ex.completed && (
                      <div className="mt-5 pt-5 border-t border-gray-50 flex items-center justify-between">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Carga hoy:</span>
                        <div className="flex items-center space-x-3"><input type="number" placeholder="0" value={ex.weight} onChange={(e) => updateWeight(ex.id, e.target.value)} className="w-24 border-none bg-gray-100 p-3 rounded-2xl text-center text-sm font-black text-gray-800 focus:ring-4 focus:ring-indigo-100 outline-none shadow-inner" /><span className="text-xs font-black text-gray-300 uppercase">kg</span></div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-4 mt-8">
                <button onClick={handleRestDay} className="py-5 rounded-[2rem] border-2 border-gray-50 text-gray-300 font-black flex flex-col items-center text-[10px] uppercase tracking-widest active:bg-gray-50 transition-all hover:text-indigo-400"><Coffee size={28} className="mb-1 opacity-40" /><span>Descanso</span></button>
                <button onClick={handleFinishWorkout} className="py-5 rounded-[2rem] bg-gray-900 text-white font-black flex flex-col items-center text-[10px] uppercase tracking-widest active:bg-black shadow-2xl transition-all flex justify-center"><ArrowRight size={28} className="mb-1" /><span>Finalizar</span></button>
              </div>
            </div>
          )}

          {/* HISTORIAL */}
          {activeTab === 'calendar' && (
            <div className="space-y-6 animate-in fade-in duration-500 text-left">
              <header>
                <h2 className="text-2xl font-black text-gray-800 tracking-tight">Historial</h2>
                <div className="flex justify-between items-center bg-gray-100 p-2.5 rounded-[1.5rem] mt-5">
                  <button onClick={() => setViewDate(new Date(viewDate.setMonth(viewDate.getMonth()-1)))} className="p-2 hover:bg-white rounded-xl transition-all shadow-sm"><ChevronLeft size={22} className="text-gray-400"/></button>
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-gray-600">{viewDate.toLocaleDateString('es-ES', {month:'short', year:'numeric'})}</p>
                  <button onClick={() => setViewDate(new Date(viewDate.setMonth(viewDate.getMonth()+1)))} className="p-2 hover:bg-white rounded-xl transition-all shadow-sm"><ChevronRight size={22} className="text-gray-400"/></button>
                </div>
              </header>

              <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 p-6">
                <div className="grid grid-cols-7 gap-1 mb-4 text-center text-[9px] font-black text-gray-300 tracking-[0.3em]">{['L','M','X','J','V','S','D'].map(d => <div key={d}>{d}</div>)}</div>
                <div className="grid grid-cols-7 gap-3">
                  {getDaysInMonth(viewDate).map((date, i) => {
                    if(!date) return <div key={i}/>;
                    const dateStr = formatDateKey(date);
                    const h = history.find(item => item.dateStr === dateStr);
                    const isSelected = selectedHistoryDay && formatDateKey(selectedHistoryDay) === dateStr;
                    const isToday = dateStr === formatDateKey(currentDate);
                    
                    let bgStyle = 'bg-gray-50 text-gray-400';
                    if (h) {
                      if (h.type === 'rest') bgStyle = 'bg-orange-100 text-orange-600 font-black';
                      else if (h.status === 'perfect') bgStyle = 'bg-emerald-100 text-emerald-600 font-black';
                      else bgStyle = 'bg-indigo-50 text-indigo-600 font-black';
                    }
                    if (isSelected) bgStyle += ' ring-2 ring-indigo-500 ring-offset-4 scale-110 z-10';

                    return (
                      <button key={i} onClick={() => setSelectedHistoryDay(new Date(date))} className={`aspect-square rounded-2xl flex flex-col items-center justify-center text-xs relative transition-all duration-300 ${bgStyle} ${isToday ? 'border border-indigo-200' : ''}`}>
                        {date.getDate()}
                        {h && <div className="w-1.5 h-1.5 bg-current rounded-full mt-1.5 animate-pulse"/>}
                      </button>
                    );
                  })}
                </div>
              </div>

              {selectedDayData ? (
                <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm animate-in slide-in-from-bottom-6 duration-500 text-left">
                   <header className="mb-6"><p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">{selectedDayData.dateStr}</p><h3 className="text-xl font-black text-gray-800 tracking-tight">Resumen Diario</h3></header>
                   <div className="flex space-x-2 bg-gray-100 p-1.5 rounded-2xl mb-6">
                    <button onClick={() => setDetailTab('nutrition')} className={`flex-1 py-3 rounded-xl text-xs font-black transition-all uppercase tracking-widest ${detailTab === 'nutrition' ? 'bg-white text-indigo-600 shadow-md' : 'text-gray-400'}`}>Comidas</button>
                    <button onClick={() => setDetailTab('workout')} className={`flex-1 py-3 rounded-xl text-xs font-black transition-all uppercase tracking-widest ${detailTab === 'workout' ? 'bg-white text-indigo-600 shadow-md' : 'text-gray-400'}`}>Rutina</button>
                  </div>
                  
                  {detailTab === 'nutrition' ? (
                    <div className="space-y-6">
                      <div className="flex justify-between items-center border-b border-gray-50 pb-5">
                         <div><p className="text-[10px] text-gray-300 font-black uppercase tracking-widest mb-1">Total</p><p className="text-2xl font-black text-gray-800">{selectedDayData.calories} kcal</p></div>
                         <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600 shadow-inner"><PieChart size={22} /></div>
                      </div>
                      
                      {selectedDayData.alcohol ? (
                        <div className="bg-purple-50 p-4 rounded-2xl border border-purple-100 shadow-sm">
                          <p className="text-[10px] font-black text-purple-400 uppercase mb-3 flex items-center text-left"><Wine size={12} className="mr-1"/> Alcohol registrado</p>
                          <div className="flex flex-wrap gap-2">
                             {Object.entries(selectedDayData.alcohol).map(([k, v]) => (k !== 'consumed' && Number(v) > 0) ? (
                               <span key={k} className="px-3 py-1 bg-white text-purple-600 text-[10px] font-black rounded-full shadow-sm uppercase">{v} {k === 'beer' ? 'Birras' : k}</span>
                             ) : null)}
                          </div>
                        </div>
                      ) : (
                        <div className="bg-emerald-50 p-3 rounded-2xl border border-emerald-100 flex items-center text-left"><Wine size={12} className="text-emerald-400 mr-2"/><p className="text-[10px] font-black text-emerald-600 uppercase tracking-tighter">Sin alcohol registrado</p></div>
                      )}

                      <div className="space-y-4 text-left">
                        {Object.keys(selectedDayData.nutritionLog).map(meal => {
                          const items = selectedDayData.nutritionLog[meal];
                          if (items.length === 0) return null;
                          return (
                            <div key={meal} className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                              <h5 className="text-[9px] font-black text-gray-400 uppercase mb-2 tracking-[0.1em]">{meal}</h5>
                              {items.map((it, idx) => (<div key={idx} className="flex justify-between items-center text-xs py-2 border-b border-white last:border-0"><span className="font-bold text-gray-700 flex-1 text-left">{it.label}</span><span className="font-black text-gray-400 ml-2">{it.calories}</span></div>))}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4 text-left">
                      <div className="flex justify-between items-center mb-2"><span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Estado Final:</span><span className="text-xs font-black px-4 py-1.5 bg-indigo-50 text-indigo-600 rounded-full uppercase tracking-tighter">{getStatusLabel(selectedDayData.status)}</span></div>
                      <div className="divide-y divide-gray-100">
                        {selectedDayData.details?.map((ex, idx) => (<div key={idx} className="flex justify-between items-center py-4 text-xs font-black text-gray-700 tracking-tight text-left"><span>{ex.name}</span><span className="text-indigo-600">{ex.weight || '-'} kg</span></div>))}
                      </div>
                    </div>
                  )}
                </div>
              ) : selectedHistoryDay && (
                <div className="p-12 text-center bg-gray-50 rounded-[2.5rem] border border-dashed border-gray-200">
                  <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.3em]">{formatDateKey(selectedHistoryDay)}</p>
                  <p className="text-xs text-gray-400 mt-1 font-black uppercase">Sin registros</p>
                </div>
              )}
            </div>
          )}
        </main>

        {/* NAVEGACIÓN INFERIOR (Z-INDEX ALTO) */}
        <nav className="bg-white/95 backdrop-blur-2xl border-t border-gray-100 flex justify-around items-center px-4 py-6 z-[100] rounded-t-[2.5rem] shadow-2xl">
          <button onClick={() => setActiveTab('home')} className={`flex flex-col items-center space-y-1 transition-all duration-300 transform ${activeTab === 'home' ? 'text-indigo-600 scale-125' : 'text-gray-300'}`}>
            <Home size={22} strokeWidth={3}/><span className="text-[8px] font-black uppercase tracking-widest">Inicio</span>
          </button>
          <button onClick={() => setActiveTab('workout')} className={`flex flex-col items-center space-y-1 transition-all duration-300 transform ${activeTab === 'workout' ? 'text-indigo-600 scale-125' : 'text-gray-300'}`}>
            <Dumbbell size={22} strokeWidth={3}/><span className="text-[8px] font-black uppercase tracking-widest">Rutina</span>
          </button>
          <button onClick={() => setActiveTab('nutrition')} className={`flex flex-col items-center space-y-1 transition-all duration-300 transform ${activeTab === 'nutrition' ? 'text-indigo-600 scale-125' : 'text-gray-300'}`}>
            <Utensils size={22} strokeWidth={3}/><span className="text-[8px] font-black uppercase tracking-widest">Comidas</span>
          </button>
          <button onClick={() => setActiveTab('calendar')} className={`flex flex-col items-center space-y-1 transition-all duration-300 transform ${activeTab === 'calendar' ? 'text-indigo-600 scale-125' : 'text-gray-300'}`}>
            <CalendarDays size={22} strokeWidth={3}/><span className="text-[8px] font-black uppercase tracking-widest">Historial</span>
          </button>
        </nav>

        {/* MODALES */}
        {showAddMealModal && (
          <div className="fixed inset-0 z-[1000] bg-black/60 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-300 text-left">
            <div className="bg-white w-full max-w-sm rounded-[3rem] p-8 shadow-2xl animate-in zoom-in-95 duration-300">
              <div className="flex justify-between items-center mb-8"><h3 className="text-xl font-black text-gray-800 capitalize tracking-tight">Registrar {selectedMealType}</h3><button onClick={() => setShowAddMealModal(false)} className="text-gray-300 hover:text-gray-900"><XCircle size={32} /></button></div>
              <div className="space-y-4 max-h-[450px] overflow-y-auto pr-2">
                <div className="grid grid-cols-2 gap-2">
                   <button onClick={() => {
                     const newItem = { logId: Date.now(), label: 'Comida Salteada', calories: 0, protein: 0, carbs: 0, fat: 0, type: 'skipped' };
                     setDailyLog(prev => ({ ...prev, [selectedMealType]: [...prev[selectedMealType], newItem] }));
                     setShowAddMealModal(false);
                   }} className="p-3 bg-gray-100 text-gray-500 text-[10px] font-black rounded-xl uppercase tracking-widest active:bg-gray-200 shadow-sm">Saltar Comida</button>
                   
                   <button onClick={() => {
                     const cal = prompt("Kcal aproximadas?", "800");
                     const newItem = { logId: Date.now(), label: 'Comida fuera del plan', calories: parseInt(cal) || 800, protein: 0, carbs: 0, fat: 0, type: 'cheat' };
                     setDailyLog(prev => ({ ...prev, [selectedMealType]: [...prev[selectedMealType], newItem] }));
                     setShowAddMealModal(false);
                   }} className="p-3 bg-red-50 text-red-600 text-[10px] font-black rounded-xl uppercase tracking-widest active:bg-red-100 shadow-sm text-center">Comida fuera del plan</button>
                </div>
                <div className="h-px bg-gray-100 my-6" />
                {FOOD_DATABASE
                  .filter(food => (selectedMealType === 'desayuno' || selectedMealType === 'merienda') ? food.type === 'breakfast' : (food.type === 'protein' || food.type === 'carb' || food.type === 'veggie'))
                  .map(food => (
                    <button key={food.id} onClick={() => handleAddFoodToLog(food)} className="w-full text-left p-5 border border-gray-50 rounded-[1.5rem] text-sm font-bold flex justify-between items-center hover:bg-indigo-50 transition-all text-gray-800 shadow-sm active:bg-indigo-100">
                      <div className="flex-1 text-left"><p className="tracking-tight">{food.label}</p><p className="text-[10px] text-gray-300 font-black uppercase mt-1 tracking-widest">{food.calories} kcal • P:{food.protein}g C:{food.carbs}g</p></div>
                      <div className="bg-indigo-50 p-2 rounded-xl text-indigo-600"><Plus size={16} strokeWidth={3} /></div>
                    </button>
                  ))}
              </div>
            </div>
          </div>
        )}

        {showImportModal && (
          <div className="fixed inset-0 z-[1000] bg-black/60 backdrop-blur-md flex items-center justify-center p-8 animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-xs rounded-[3rem] p-10 text-center shadow-2xl animate-in zoom-in-95 duration-300">
              <h3 className="text-2xl font-black text-gray-800 mb-2 tracking-tighter">Importar Plan</h3>
              {importType === 'workout' && (
                <button onClick={downloadWorkoutTemplate} className="text-indigo-600 text-[10px] font-black mb-8 block w-full hover:underline uppercase tracking-widest flex items-center justify-center"><Download size={14} className="mr-1"/> Plantilla .CSV</button>
              )}
              <div className="border-2 border-dashed border-indigo-100 p-8 rounded-[2rem] mb-10 bg-gray-50 flex flex-col items-center relative">
                <Upload size={40} className="text-indigo-200 mb-4" />
                <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest text-center leading-tight">Subir archivo .CSV con rutina</span>
                <input type="file" accept=".csv" onChange={handleFileUpload} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" />
              </div>
              <button onClick={() => setShowImportModal(false)} className="text-gray-300 text-[10px] font-black uppercase tracking-[0.3em] hover:text-gray-600 transition-colors">Cerrar</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}