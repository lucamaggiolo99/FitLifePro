import React, { useState, useEffect, useCallback } from 'react';
import { 
  Dumbbell, 
  Utensils, 
  Home, 
  Plus, 
  Flame, 
  CheckCircle2, 
  Circle, 
  Trophy,
  ChevronRight,
  ChevronLeft,
  Activity,
  CalendarDays,
  Upload,
  FileText,
  Download,
  Coffee,
  Sun,
  PieChart,
  Trash2,
  Wine,
  Beer,
  AlertTriangle,
  XCircle,
  AlertCircle,
  Lock,
  ArrowRight,
  Clock
} from 'lucide-react';

const App = () => {
  const [activeTab, setActiveTab] = useState('home');
  const [showAddMealModal, setShowAddMealModal] = useState(false);
  const [selectedMealType, setSelectedMealType] = useState('desayuno'); 
  const [showImportModal, setShowImportModal] = useState(false);
  const [importType, setImportType] = useState(null); 
  const [isLoadingFile, setIsLoadingFile] = useState(false);
  const [showRestConfetti, setShowRestConfetti] = useState(false);
  const [detailTab, setDetailTab] = useState('nutrition');

  // Helper para formato de fecha consistente (DD/MM/AAAA)
  const formatDateKey = (date) => {
    return date.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  // Helper para traducir el estado del entrenamiento
  const getStatusLabel = (status) => {
    switch(status) {
      case 'perfect': return 'Completado';
      case 'good': return 'Incompleto';
      case 'rest': return 'Descanso';
      default: return 'Sin Datos';
    }
  };

  // --- ESTADOS DE TIEMPO (Configurado en Feb 2026) ---
  const [currentDate, setCurrentDate] = useState(new Date(2026, 1, 11)); 
  const [viewDate, setViewDate] = useState(new Date(2026, 1, 11)); 

  // --- PLAN NUTRICIONAL ---
  const [nutritionGoals] = useState({ 
    calories: 2600, 
    protein: 200, 
    carbs: 300,   
    fat: 70       
  });

  const [foodDatabase] = useState([
    { id: 'd1', label: 'Opción 1: Tostadas + Queso + Fruta', calories: 450, protein: 15, carbs: 60, fat: 10, type: 'breakfast' },
    { id: 'd2', label: 'Opción 2: Sándwiches Jamón/Queso', calories: 500, protein: 25, carbs: 55, fat: 15, type: 'breakfast' },
    { id: 'd3', label: 'Opción 3: Cereales + Whey + Fruta', calories: 480, protein: 30, carbs: 65, fat: 8, type: 'breakfast' },
    { id: 'd4', label: 'Opción 4: Tortilla Avena + Huevo', calories: 520, protein: 25, carbs: 50, fat: 18, type: 'breakfast' },
    { id: 'p1', label: 'Pollo (Pechuga) 250g', calories: 275, protein: 55, carbs: 0, fat: 5, type: 'protein' },
    { id: 'p2', label: 'Carne Magra (Lomo/Nalga) 250g', calories: 350, protein: 52, carbs: 0, fat: 12, type: 'protein' },
    { id: 'c1', label: 'Arroz/Fideos/Polenta (120g crudo)', calories: 420, protein: 8, carbs: 90, fat: 2, type: 'carb' },
    { id: 'c2', label: 'Papa/Batata (400g)', calories: 350, protein: 6, carbs: 80, fat: 0, type: 'carb' },
  ]);

  const [dailyLog, setDailyLog] = useState({ desayuno: [], almuerzo: [], merienda: [], cena: [] });
  const [consumed, setConsumed] = useState({ calories: 0, protein: 0, carbs: 0, fat: 0 });
  const [alcoholLog, setAlcoholLog] = useState({ consumed: false, fernet: 0, beer: 0, wine: 0 });

  // --- ESTADOS DE PROGRESO ---
  const [dailyStatus, setDailyStatus] = useState('active'); 
  const [nutritionStatus, setNutritionStatus] = useState('active');
  const [history, setHistory] = useState([]);
  const [selectedHistoryDay, setSelectedHistoryDay] = useState(null);

  // Entrenamiento
  const [workoutPlan, setWorkoutPlan] = useState([]); 
  const [currentSessionIndex, setCurrentSessionIndex] = useState(0); 
  const [exercises, setExercises] = useState([]); 
  const [workoutProgress, setWorkoutProgress] = useState(0);

  // --- EFECTOS INICIALES ---
  useEffect(() => {
    const initialPlan = [
      { week: 1, day: 1, title: 'Empuje (Pecho/Hombro/Tríceps)', exercises: [{ id: 'w1d1e1', name: 'Press Banca', sets: '4x8', rest: '90s', completed: false, weight: '' }, { id: 'w1d1e2', name: 'Press Militar', sets: '3x10', rest: '60s', completed: false, weight: '' }] },
      { week: 1, day: 2, title: 'Tracción (Espalda/Bíceps)', exercises: [{ id: 'w1d2e1', name: 'Dominadas', sets: '4xMax', rest: '120s', completed: false, weight: '' }, { id: 'w1d2e2', name: 'Remo con Barra', sets: '4x10', rest: '90s', completed: false, weight: '' }] },
      { week: 1, day: 3, title: 'Pierna (Cuádriceps)', exercises: [{ id: 'w1d3e1', name: 'Sentadilla Libre', sets: '4x8', rest: '120s', completed: false, weight: '' }] }
    ];
    setWorkoutPlan(initialPlan);
    setExercises(initialPlan[0].exercises);
  }, []);

  useEffect(() => {
    let total = { calories: 0, protein: 0, carbs: 0, fat: 0 };
    Object.values(dailyLog).forEach(mealArray => {
      mealArray.forEach(food => {
        total.calories += food.calories;
        total.protein += food.protein;
        total.carbs += food.carbs;
        total.fat += food.fat;
      });
    });
    setConsumed(total);
  }, [dailyLog]);

  useEffect(() => {
    if (exercises.length === 0) { setWorkoutProgress(0); return; }
    const completedCount = exercises.filter(e => e.completed).length;
    setWorkoutProgress(Math.round((completedCount / exercises.length) * 100));
  }, [exercises]);

  // --- LÓGICA DE GUARDADO ---
  const saveHistory = useCallback((eventType) => {
    const todayStr = formatDateKey(currentDate);
    
    let alcoholSummary = null;
    if (alcoholLog.consumed) {
      alcoholSummary = { fernet: alcoholLog.fernet, beer: alcoholLog.beer, wine: alcoholLog.wine };
    }

    const specialMeals = [];
    Object.keys(dailyLog).forEach(key => {
      dailyLog[key].forEach(item => {
        if (item.type === 'skipped') specialMeals.push({ meal: key, type: 'skipped' });
        if (item.type === 'cheat') specialMeals.push({ meal: key, type: 'cheat' });
      });
    });

    const isRestDay = eventType === 'rest' || dailyStatus === 'rest';
    const finalWorkoutProgress = isRestDay ? 0 : workoutProgress;
    const finalStatus = isRestDay ? 'rest' : (finalWorkoutProgress === 100 ? 'perfect' : 'good');
    const finalType = isRestDay ? 'rest' : 'workout';

    const newEntry = {
      dateStr: todayStr,
      date: new Date(currentDate),
      calories: consumed.calories,
      goal: nutritionGoals.calories,
      workout: finalWorkoutProgress,
      status: finalStatus,
      type: finalType,
      details: exercises.map(e => ({ ...e })),
      alcohol: alcoholSummary,
      specialMeals: specialMeals,
      nutritionLog: JSON.parse(JSON.stringify(dailyLog)) 
    };

    setHistory(prev => {
      const filtered = prev.filter(h => h.dateStr !== todayStr);
      return [newEntry, ...filtered];
    });
  }, [currentDate, alcoholLog, dailyLog, consumed, workoutProgress, dailyStatus, exercises, nutritionGoals]);

  const handleFinishNutritionDay = () => {
    saveHistory('nutrition_update'); 
    setNutritionStatus('completed'); 
    setShowRestConfetti(true);
    setTimeout(() => setShowRestConfetti(false), 2000);
  };

  const handleFinishWorkout = () => {
    saveHistory('workout');
    setDailyStatus('completed');
  };

  const handleRestDay = () => {
    saveHistory('rest');
    setDailyStatus('rest');
  };

  const simulateNextDay = () => {
    const nextDay = new Date(currentDate);
    nextDay.setDate(nextDay.getDate() + 1);
    setCurrentDate(nextDay);
    setViewDate(nextDay);

    if (dailyStatus === 'completed') {
      const nextIndex = (currentSessionIndex + 1) % workoutPlan.length;
      setCurrentSessionIndex(nextIndex);
      setExercises(workoutPlan[nextIndex].exercises.map(e => ({ ...e, completed: false, weight: '' })));
    }
    
    setDailyStatus('active');
    setNutritionStatus('active'); 
    setWorkoutProgress(0);
    setDailyLog({ desayuno: [], almuerzo: [], merienda: [], cena: [] });
    setAlcoholLog({ consumed: false, fernet: 0, beer: 0, wine: 0 }); 
  };

  // --- MANEJADORES DE UI ---
  const handleAddFoodToLog = (foodItem) => {
    if (nutritionStatus !== 'active') return;
    const newFoodEntry = { ...foodItem, logId: Date.now() };
    setDailyLog(prev => ({ ...prev, [selectedMealType]: [...prev[selectedMealType], newFoodEntry] }));
    setShowAddMealModal(false);
  };

  const addSpecialMeal = (type) => {
    if (nutritionStatus !== 'active') return;
    let newItem;
    if (type === 'skip') {
      newItem = { logId: Date.now(), label: 'Comida Salteada', calories: 0, protein: 0, carbs: 0, fat: 0, type: 'skipped' };
    } else {
      const cal = prompt("¿Estimado de calorías?", "800");
      newItem = { logId: Date.now(), label: 'Comida Fuera de Plan', calories: parseInt(cal) || 800, protein: 0, carbs: 0, fat: 0, type: 'cheat' };
    }
    setDailyLog(prev => ({ ...prev, [selectedMealType]: [...prev[selectedMealType], newItem] }));
    setShowAddMealModal(false);
  };

  const removeFoodFromLog = (mealType, logId) => {
    if (nutritionStatus !== 'active') return;
    setDailyLog(prev => ({ ...prev, [mealType]: prev[mealType].filter(item => item.logId !== logId) }));
  };

  const updateAlcohol = (type, delta) => {
    if (nutritionStatus !== 'active') return;
    setAlcoholLog(prev => ({ ...prev, [type]: Math.max(0, prev[type] + delta) }));
  };

  const toggleExercise = (id) => {
    if (dailyStatus !== 'active') return;
    setExercises(exercises.map(ex => ex.id === id ? { ...ex, completed: !ex.completed } : ex));
  };

  const updateWeight = (id, weight) => {
    if (dailyStatus !== 'active') return;
    setExercises(prev => prev.map(ex => ex.id === id ? { ...ex, weight: weight } : ex));
  };

  const handlePrevMonth = () => {
    const newDate = new Date(viewDate);
    newDate.setMonth(newDate.getMonth() - 1);
    if (newDate < new Date(2026, 1, 1)) return; 
    setViewDate(newDate);
  };

  const handleNextMonth = () => {
    const newDate = new Date(viewDate);
    newDate.setMonth(newDate.getMonth() + 1);
    setViewDate(newDate);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsLoadingFile(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      // Lógica de procesamiento simplificada para la demo
      setIsLoadingFile(false);
      setShowImportModal(false);
    };
    reader.readAsText(file);
  };

  // --- RENDER HELPERS ---
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay(); 
    const startingDay = firstDay === 0 ? 6 : firstDay - 1; 
    const days = [];
    for (let i = 0; i < startingDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(new Date(year, month, i));
    return days;
  };

  const renderProgressBar = (current, max, color, label) => {
    const percentage = Math.min(100, Math.max(0, (current / max) * 100));
    return (
      <div className="mb-2 text-left">
        <div className="flex justify-between text-[10px] font-medium mb-1 text-gray-500">
          <span>{label}</span>
          <span>{current} / {max}g</span>
        </div>
        <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
          <div className={`h-full ${color} transition-all duration-500`} style={{ width: `${percentage}%` }}></div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 overflow-x-hidden">
      <div className="max-w-md mx-auto min-h-screen relative shadow-2xl bg-white overflow-hidden">
        
        {/* CONTENIDO PRINCIPAL */}
        <main className="p-5 h-full overflow-y-auto">
          {activeTab === 'home' && (
            <div className="space-y-6 pb-24">
              <div className="flex justify-between items-center">
                <div className="text-left"><h1 className="text-2xl font-bold text-gray-800">Hola, Luca 👋</h1><p className="text-gray-500 text-sm capitalize">{formatDateKey(currentDate)}</p></div>
                <div className="h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold">LM</div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gradient-to-br from-orange-500 to-red-500 p-5 rounded-2xl text-white text-left">
                  <div className="flex items-center space-x-2 mb-2 opacity-90"><Flame size={18} /><span className="text-sm font-medium">Calorías</span></div>
                  <div className="text-2xl font-bold">{Math.max(0, nutritionGoals.calories - consumed.calories)}</div>
                  <div className="text-[10px] opacity-80">restantes</div>
                </div>
                <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-5 rounded-2xl text-white text-left">
                  <div className="flex items-center space-x-2 mb-2 opacity-90"><Dumbbell size={18} /><span className="text-sm font-medium">Entreno</span></div>
                  <div className="text-2xl font-bold">{dailyStatus === 'active' ? `${workoutProgress}%` : 'Cerrado'}</div>
                  <div className="text-[10px] opacity-80">progreso diario</div>
                </div>
              </div>
              <div className="text-left">
                <h3 className="font-bold text-gray-800 mb-3">Rutina Activa</h3>
                <div onClick={() => setActiveTab('workout')} className={`p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between cursor-pointer ${dailyStatus !== 'active' ? 'opacity-50 grayscale' : ''}`}>
                  <div className="flex items-center space-x-4"><div className="bg-indigo-50 p-3 rounded-xl text-indigo-600"><CalendarDays size={24} /></div><div className="text-left"><h4 className="font-bold text-gray-800 text-sm">{workoutPlan[currentSessionIndex]?.title}</h4><p className="text-[10px] text-gray-500">Toca para entrenar</p></div></div><ChevronRight className="text-gray-300" />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'nutrition' && (
            <div className="space-y-6 pb-24 relative">
              {nutritionStatus === 'completed' && (
                <div className="absolute inset-0 z-40 bg-white/80 backdrop-blur-[1px] flex flex-col items-center justify-center p-6 text-center rounded-3xl h-full">
                  <Lock size={48} className="text-gray-400 mb-2" />
                  <p className="font-bold text-gray-700 text-lg">Día Cerrado</p>
                  <button onClick={simulateNextDay} className="mt-4 bg-indigo-600 text-white px-6 py-2 rounded-xl text-xs font-bold">Simular Mañana</button>
                </div>
              )}
              <div className="flex justify-between items-start">
                <div className="text-left"><h2 className="text-2xl font-bold text-gray-800 mb-1">Nutrición</h2><p className="text-gray-500 text-xs font-medium">Plan Personalizado</p></div>
                <button onClick={() => {setImportType('nutrition'); setShowImportModal(true);}} className="text-indigo-600 bg-indigo-50 p-2 rounded-lg"><Upload size={20} /></button>
              </div>
              <div className="p-5 rounded-2xl border border-indigo-100 bg-white shadow-sm">
                <div className="flex items-end justify-between mb-4"><div className="text-left"><span className="text-3xl font-bold text-gray-800">{consumed.calories}</span><span className="text-sm text-gray-400"> / {nutritionGoals.calories} kcal</span></div><div className="text-xs font-bold bg-indigo-50 text-indigo-600 px-2 py-1 rounded-lg">{Math.round((consumed.calories / nutritionGoals.calories) * 100)}%</div></div>
                {renderProgressBar(consumed.protein, nutritionGoals.protein, "bg-indigo-500", "Proteína")}
                {renderProgressBar(consumed.carbs, nutritionGoals.carbs, "bg-emerald-500", "Carbohidratos")}
                {renderProgressBar(consumed.fat, nutritionGoals.fat, "bg-orange-500", "Grasas")}
              </div>
              {['desayuno', 'almuerzo', 'merienda', 'cena'].map(type => (
                <div key={type} className="space-y-2 text-left">
                  <div className="flex justify-between items-center px-2"><h4 className="font-bold text-gray-700 capitalize text-sm">{type}</h4><span className="text-[10px] text-gray-400">{dailyLog[type].reduce((a, b) => a + b.calories, 0)} kcal</span></div>
                  <div className="p-3 min-h-[60px] rounded-2xl border border-dashed border-gray-200 bg-gray-50/50 flex flex-col justify-center">
                    {dailyLog[type].map(item => (
                      <div key={item.logId} className="flex justify-between items-center bg-white p-2 rounded-xl border border-gray-100 mb-2 last:mb-0">
                        <div className="text-left"><p className={`font-bold text-xs ${item.type === 'cheat' ? 'text-red-600' : 'text-gray-700'}`}>{item.label}</p><p className="text-[9px] text-gray-400">{item.calories} kcal</p></div>
                        <button onClick={() => removeFoodFromLog(type, item.logId)} className="text-gray-300 hover:text-red-500"><Trash2 size={14} /></button>
                      </div>
                    ))}
                    <button onClick={() => { setSelectedMealType(type); setShowAddMealModal(true); }} className="w-full py-2 text-[10px] text-indigo-600 font-bold border border-indigo-100 rounded-lg bg-white">+ Agregar</button>
                  </div>
                </div>
              ))}
              <div className="pt-4 text-left">
                <h3 className="font-bold text-gray-800 mb-2 text-sm flex items-center"><Wine size={16} className="mr-2 text-purple-600" /> Alcohol</h3>
                <div className={`p-5 rounded-2xl border border-gray-100 bg-white ${alcoholLog.consumed ? 'bg-purple-50/30 border-purple-100' : ''}`}>
                  <div className="flex items-center justify-between"><span className="text-xs font-bold text-gray-600">¿Consumiste hoy?</span><button onClick={() => setAlcoholLog(p => ({...p, consumed: !p.consumed}))} className={`w-10 h-5 rounded-full relative transition-all ${alcoholLog.consumed ? 'bg-purple-600' : 'bg-gray-200'}`}><div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${alcoholLog.consumed ? 'left-6' : 'left-1'}`} /></button></div>
                  {alcoholLog.consumed && (
                    <div className="grid grid-cols-3 gap-2 mt-4 text-center">
                      {['fernet', 'beer', 'wine'].map(d => (
                        <div key={d}><span className="text-[9px] font-bold text-gray-400 capitalize">{d === 'beer' ? 'Cerveza' : d}</span><div className="flex items-center justify-center space-x-2 mt-1"><button onClick={() => updateAlcohol(d, -1)} className="w-5 h-5 bg-gray-100 rounded text-xs">-</button><span className="font-bold text-xs">{alcoholLog[d]}</span><button onClick={() => updateAlcohol(d, 1)} className="w-5 h-5 bg-purple-100 text-purple-600 rounded text-xs">+</button></div></div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <button onClick={handleFinishNutritionDay} className="w-full py-4 bg-emerald-500 text-white rounded-2xl font-bold shadow-lg shadow-emerald-200 mt-6 active:scale-95 transition-all flex items-center justify-center"><Trophy size={20} className="mr-2" /> Finalizar Día de Comidas</button>
            </div>
          )}

          {activeTab === 'workout' && (
            <div className="space-y-6 pb-24 relative">
              {dailyStatus !== 'active' && (
                <div className="absolute inset-0 z-40 bg-white/80 backdrop-blur-[1px] flex flex-col items-center justify-center p-6 text-center rounded-3xl h-full">
                  <Trophy size={64} className="text-emerald-500 mb-4 animate-bounce" /><h2 className="text-xl font-bold text-gray-800">¡Rutina Completada!</h2>
                  <button onClick={simulateNextDay} className="mt-6 bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center shadow-lg"><Sun size={18} className="mr-2" /> Simular Mañana</button>
                </div>
              )}
              <div className="flex justify-between items-end"><div className="text-left"><h2 className="text-2xl font-bold text-gray-800 mb-1">Rutina</h2><p className="text-gray-500 text-xs font-bold uppercase">{workoutPlan[currentSessionIndex]?.title}</p></div><button onClick={() => {setImportType('workout'); setShowImportModal(true);}} className="text-indigo-600 bg-indigo-50 p-2 rounded-lg"><Upload size={20} /></button></div>
              <div className="flex items-center justify-between bg-white p-4 rounded-2xl shadow-sm border border-gray-100"><div className="text-left"><span className="text-[10px] text-gray-400 font-bold uppercase">Progreso Sesión</span><div className="text-2xl font-bold text-emerald-600">{workoutProgress}%</div></div><div className="h-12 w-12 rounded-full border-4 border-emerald-100 flex items-center justify-center text-emerald-600"><Dumbbell size={20} /></div></div>
              <div className="space-y-4">
                {exercises.map(ex => (
                  <div key={ex.id} className={`p-4 rounded-2xl border transition-all ${ex.completed ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-gray-100 shadow-sm'}`}>
                    <div className="flex items-start justify-between mb-3 cursor-pointer" onClick={() => toggleExercise(ex.id)}>
                      <div className="flex items-center space-x-3 text-left">
                        <div className={`h-8 w-8 rounded-lg flex items-center justify-center text-xs font-bold ${ex.completed ? 'bg-emerald-200 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>{ex.sets.split('x')[0]}</div>
                        <div>
                          <h4 className={`font-bold text-sm ${ex.completed ? 'text-emerald-800 line-through' : 'text-gray-800'}`}>{ex.name}</h4>
                          <div className="flex items-center space-x-2 text-[10px] text-gray-500"><span>{ex.sets} Reps</span>{ex.rest && <span className="flex items-center text-orange-500 bg-orange-50 px-1.5 py-0.5 rounded"><Clock size={10} className="mr-1"/>{ex.rest}</span>}</div>
                        </div>
                      </div>
                      {ex.completed ? <CheckCircle2 className="text-emerald-500" size={24} /> : <Circle className="text-gray-300" size={24} />}
                    </div>
                    <div className="flex items-center space-x-2 pl-11">
                      <span className="text-[9px] font-bold text-gray-400 uppercase">Carga:</span>
                      <input type="number" placeholder="kg" value={ex.weight} onChange={(e) => updateWeight(ex.id, e.target.value)} className={`w-16 p-1 text-xs text-center rounded border focus:outline-none focus:border-indigo-500 ${ex.completed ? 'bg-transparent border-emerald-100' : 'bg-gray-50'}`} />
                      <span className="text-[10px] text-gray-400">kg</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-4 mt-6">
                <button onClick={handleRestDay} className="py-4 rounded-2xl border border-gray-200 text-gray-500 font-bold flex flex-col items-center text-xs space-y-2"><Coffee size={24} /> <span>HOY DESCANSO</span></button>
                <button onClick={handleFinishWorkout} className="py-4 rounded-2xl bg-gray-900 text-white font-bold flex flex-col items-center text-xs space-y-2 shadow-xl"><ArrowRight size={24} /> <span>FINALIZAR</span></button>
              </div>
            </div>
          )}

          {activeTab === 'calendar' && (
            <div className="space-y-6 pb-24 text-left">
              <header><h2 className="text-2xl font-bold text-gray-800 mb-1">Historial</h2><div className="flex justify-between items-center bg-gray-100 p-2 rounded-xl mt-2"><button onClick={handlePrevMonth} className="p-1 hover:bg-gray-200 rounded-lg"><ChevronLeft size={20} className="text-gray-600" /></button><p className="text-gray-700 font-bold capitalize text-xs">{viewDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}</p><button onClick={handleNextMonth} className="p-1 hover:bg-gray-200 rounded-lg"><ChevronRight size={20} className="text-gray-600" /></button></div></header>
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                <div className="grid grid-cols-7 gap-2 mb-2 text-center text-[10px] text-gray-400 font-bold">{['L','M','X','J','V','S','D'].map(d=><div key={d}>{d}</div>)}</div>
                <div className="grid grid-cols-7 gap-2">
                  {getDaysInMonth(viewDate).map((date, i) => {
                    if (!date) return <div key={i}></div>;
                    const dateStr = formatDateKey(date);
                    const item = history.find(h => h.dateStr === dateStr);
                    const isSelected = selectedHistoryDay && formatDateKey(selectedHistoryDay) === dateStr;
                    const isToday = formatDateKey(date) === formatDateKey(currentDate);
                    let bgColor = 'bg-gray-50 text-gray-700';
                    if (item) { 
                      if (item.type === 'rest') bgColor = 'bg-orange-100 text-orange-700'; 
                      else if (item.workout === 100) bgColor = 'bg-emerald-100 text-emerald-700'; 
                      else bgColor = 'bg-blue-100 text-blue-700'; 
                    }
                    if (isSelected) bgColor = 'ring-2 ring-indigo-600 ring-offset-2 ' + bgColor;
                    return (
                      <button key={i} onClick={() => setSelectedHistoryDay(date)} className={`aspect-square rounded-lg flex flex-col items-center justify-center text-xs transition-all relative ${bgColor} ${isToday ? 'font-bold border-2 border-indigo-200' : ''}`}>
                        <span>{date.getDate()}</span>
                        {item && <div className="flex space-x-0.5 mt-1"><div className={`w-1 h-1 rounded-full ${item.type === 'rest' ? 'bg-orange-500' : 'bg-emerald-500'}`}></div>{item.alcohol && <div className="w-1 h-1 rounded-full bg-purple-500"></div>}</div>}
                      </button>
                    );
                  })}
                </div>
              </div>
              {selectedHistoryDay && history.find(h => h.dateStr === formatDateKey(selectedHistoryDay)) && (
                <div className="animate-in slide-in-from-bottom-5">
                  <div className="flex items-center space-x-2 mb-4 bg-gray-100 p-1 rounded-xl">
                    <button onClick={() => setDetailTab('nutrition')} className={`flex-1 py-1.5 rounded-lg text-xs font-bold ${detailTab === 'nutrition' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500'}`}>Comidas</button>
                    <button onClick={() => setDetailTab('workout')} className={`flex-1 py-1.5 rounded-lg text-xs font-bold ${detailTab === 'workout' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500'}`}>Entreno</button>
                  </div>
                  {detailTab === 'nutrition' ? (
                    <div className="space-y-4">
                      <div className="bg-gray-50 p-4 rounded-xl flex justify-between items-center text-left"><div><p className="text-[10px] text-gray-400 font-bold uppercase">Consumo Total</p><p className="text-xl font-bold text-gray-800">{history.find(h => h.dateStr === formatDateKey(selectedHistoryDay)).calories} kcal</p></div><PieChart size={24} className="text-indigo-400" /></div>
                      {history.find(h => h.dateStr === formatDateKey(selectedHistoryDay)).alcohol ? <div className="bg-purple-50 border border-purple-100 p-3 rounded-xl flex justify-between text-xs text-purple-700 font-bold"><span><Wine size={14} className="inline mr-1"/> Alcohol registrado</span><span>{Object.entries(history.find(h => h.dateStr === formatDateKey(selectedHistoryDay)).alcohol).filter(([k, v]) => k !== 'consumed' && v > 0).map(([k, v]) => `${v}${k[0].toUpperCase()}`).join(' · ')}</span></div> : <div className="bg-emerald-50 border border-emerald-100 p-3 rounded-xl text-xs text-emerald-700 font-bold flex items-center"><Wine size={14} className="mr-2" /> Sin consumo de alcohol</div>}
                      {Object.keys(history.find(h => h.dateStr === formatDateKey(selectedHistoryDay)).nutritionLog).map(m => history.find(h => h.dateStr === formatDateKey(selectedHistoryDay)).nutritionLog[m].length > 0 && <div key={m} className="bg-white rounded-xl border border-gray-100 overflow-hidden text-left"><div className="bg-gray-50 px-3 py-1.5 border-b border-gray-100 text-[9px] font-bold text-gray-400 uppercase">{m}</div>{history.find(h => h.dateStr === formatDateKey(selectedHistoryDay)).nutritionLog[m].map((f, i) => <div key={i} className="px-3 py-2 border-b border-gray-50 last:border-0 flex justify-between text-xs"><span>{f.label}</span><span className="font-bold text-gray-500">{f.calories}</span></div>)}</div>)}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="bg-gray-50 p-4 rounded-xl flex justify-between items-center text-left"><div><p className="text-[10px] text-gray-400 font-bold uppercase">Estado</p><p className="text-xl font-bold text-gray-800">{getStatusLabel(history.find(h => h.dateStr === formatDateKey(selectedHistoryDay)).status)}</p></div><Dumbbell size={24} className="text-emerald-400" /></div>
                      {history.find(h => h.dateStr === formatDateKey(selectedHistoryDay)).details?.map((ex, idx) => <div key={idx} className="bg-white p-3 rounded-xl border border-gray-100 flex justify-between items-center text-xs text-left"><div><p className="font-bold text-gray-800">{ex.name}</p><p className="text-[9px] text-gray-400">{ex.sets}</p></div><span className="font-bold text-gray-700">{ex.weight || '-'} kg</span></div>)}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </main>

        {/* NAVEGACIÓN INFERIOR */}
        <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t border-gray-200 px-6 py-3 flex justify-between items-center z-50">
          <button onClick={() => setActiveTab('home')} className={`flex flex-col items-center space-y-1 ${activeTab === 'home' ? 'text-indigo-600' : 'text-gray-400'}`}><Home size={20} /><span className="text-[9px] font-bold">Inicio</span></button>
          <button onClick={() => setActiveTab('workout')} className={`flex flex-col items-center space-y-1 ${activeTab === 'workout' ? 'text-indigo-600' : 'text-gray-400'}`}><Dumbbell size={20} /><span className="text-[9px] font-bold">Rutina</span></button>
          <button onClick={() => setActiveTab('nutrition')} className={`flex flex-col items-center space-y-1 ${activeTab === 'nutrition' ? 'text-indigo-600' : 'text-gray-400'}`}><Utensils size={20} /><span className="text-[9px] font-bold">Comidas</span></button>
          <button onClick={() => setActiveTab('calendar')} className={`flex flex-col items-center space-y-1 ${activeTab === 'calendar' ? 'text-indigo-600' : 'text-gray-400'}`}><CalendarDays size={20} /><span className="text-[9px] font-bold">Historial</span></button>
        </nav>

        {/* MODAL AGREGAR COMIDA */}
        {showAddMealModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-3xl w-full max-w-xs max-h-[70vh] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95">
              <div className="p-4 border-b flex justify-between items-center bg-gray-50"><h3 className="font-bold text-gray-800 text-sm capitalize">{selectedMealType}</h3><button onClick={() => setShowAddMealModal(false)} className="text-gray-400 hover:text-gray-600"><XCircle size={20} /></button></div>
              <div className="p-4 overflow-y-auto space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => addSpecialMeal('skip')} className="p-2 bg-gray-50 rounded-xl border border-gray-200 text-[10px] font-bold">Saltada</button>
                  <button onClick={() => addSpecialMeal('cheat')} className="p-2 bg-red-50 rounded-xl border border-red-100 text-[10px] font-bold text-red-600">Libre</button>
                </div>
                <div className="h-px bg-gray-100 my-2" />
                {foodDatabase.map(f => <button key={f.id} onClick={() => handleAddFoodToLog(f)} className="w-full text-left p-3 rounded-xl border border-gray-100 flex justify-between items-center group active:bg-indigo-50"><div className="text-left"><p className="font-bold text-xs">{f.label}</p><p className="text-[9px] text-gray-400">{f.calories} kcal</p></div><Plus size={16} className="text-indigo-300" /></button>)}
              </div>
            </div>
          </div>
        )}

        {/* MODAL IMPORTAR */}
        {showImportModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-6">
            <div className="bg-white rounded-3xl p-6 w-full max-w-xs shadow-2xl text-left">
              <h3 className="font-bold text-gray-800 mb-2">Cargar {importType === 'nutrition' ? 'Plan' : 'Rutina'}</h3>
              <p className="text-[10px] text-gray-500 mb-4">Usa un archivo CSV para actualizar masivamente.</p>
              {importType === 'workout' && <button onClick={downloadWorkoutTemplate} className="text-indigo-600 text-[10px] font-bold flex items-center mb-4"><Download size={14} className="mr-1" /> Descargar Plantilla</button>}
              <div className="border-2 border-dashed border-gray-200 rounded-2xl p-4 text-center cursor-pointer hover:bg-indigo-50 transition-all relative">
                <Upload size={24} className="mx-auto mb-1 text-gray-400" />
                <span className="text-[10px] font-bold text-gray-400">Seleccionar CSV</span>
                <input type="file" accept=".csv" onChange={handleFileUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
              </div>
              <button onClick={() => setShowImportModal(false)} className="w-full py-3 mt-4 text-gray-400 font-bold text-[10px]">CANCELAR</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;