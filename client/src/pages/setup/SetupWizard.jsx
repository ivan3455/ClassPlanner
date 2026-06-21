import { useMemo, useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { ChevronLeft, Check } from 'lucide-react';

// Step Component Imports
import Step1_Semesters from './Step1';        
import Step2_Classrooms from './Step2';       
import Step3_TimeSlots from './Step3';        
import Step4_Teachers from './Step4';         
import Step5_Groups from './Step5';           
import Step6_Curriculum from './Step6';       
import Step7_AI_Engine from './Step7';        

// Словник локалізації для каркаса майстра
const translations = {
  ua: {
    btnBack: 'Повернутися на Дашборд',
    counterLabel: 'Конструктор: Крок',
    counterOf: 'з',
    schoolStep1: 'Семестр та Час',
    schoolStep2: 'Кабінети класів',
    schoolStep3: 'Розклад дзвінків',
    schoolStep4: 'Кадровий склад',
    schoolStep5: 'Класи та Паралелі',
    schoolStep6: 'Плани предметів',
    schoolStep7: 'ШІ Оптимізатор',
    uniStep1: 'Семестр та Час',
    uniStep2: 'Фонд аудиторій',
    uniStep3: 'Розклад дзвінків',
    uniStep4: 'Викладацький штаб',
    uniStep5: 'Академічні групи',
    uniStep6: 'Матриця навантаження',
    uniStep7: 'Генерація CSP'
  },
  en: {
    btnBack: 'Back to Dashboard',
    counterLabel: 'Wizard: Step',
    counterOf: 'of',
    schoolStep1: 'Semester & Time',
    schoolStep2: 'Classrooms',
    schoolStep3: 'Bell Schedule',
    schoolStep4: 'Teaching Staff',
    schoolStep5: 'Classes & Parallels',
    schoolStep6: 'Subject Plans',
    schoolStep7: 'AI Optimizer',
    uniStep1: 'Semester & Time',
    uniStep2: 'Auditorium Fund',
    uniStep3: 'Bell Schedule',
    uniStep4: 'Faculty Staff',
    uniStep5: 'Academic Groups',
    uniStep6: 'Load Matrix',
    uniStep7: 'CSP Generation'
  }
};

const SetupWizard = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Реактивне зчитування мови з наскрізною підпискою
  const [lang, setLang] = useState(localStorage.getItem('lang') || 'ua');
  const t = translations[lang];

  const user = useMemo(() => JSON.parse(localStorage.getItem('user')) || {}, []);
  const institutionType = user.Institution?.type || 'University';

  useEffect(() => {
    // Відстеження зміни мови через Sidebar.jsx
    const handleLangChange = (e) => {
      setLang(e.detail);
    };
    window.addEventListener('appLangChanged', handleLangChange);
    return () => window.removeEventListener('appLangChanged', handleLangChange);
  }, []);

  // DYNAMIC STEP MAP
  const steps = useMemo(() => {
    const baseline = [
      { id: 1, path: 'step1', School: t.schoolStep1, University: t.uniStep1 },
      { id: 2, path: 'step2', School: t.schoolStep2, University: t.uniStep2 },
      { id: 3, path: 'step3', School: t.schoolStep3, University: t.uniStep3 },
      { id: 4, path: 'step4', School: t.schoolStep4, University: t.uniStep4 },
      { id: 5, path: 'step5', School: t.schoolStep5, University: t.uniStep5 },
      { id: 6, path: 'step6', School: t.schoolStep6, University: t.uniStep6 },
      { id: 7, path: 'step7', School: t.schoolStep7, University: t.uniStep7 },
    ];

    return baseline.map(step => ({
      id: step.id,
      path: step.path,
      name: step[institutionType] || step.University
    }));
  }, [institutionType, t]);

  const currentStepPath = useMemo(() => {
    const segments = location.pathname.split('/').filter(Boolean);
    return segments[segments.length - 1] || 'step1';
  }, [location.pathname]);

  const activeStep = useMemo(() => {
    return steps.find(s => s.path === currentStepPath) || steps[0];
  }, [steps, currentStepPath]);

  const currentStepIndex = activeStep.id;

  return (
    <div className="space-y-6 animate-in fade-in duration-200 text-slate-700 w-full select-none text-left antialiased font-sans">
      
      {/* 1. PROGRESS INTERFACE NAVIGATION */}
      <header className="bg-white border border-slate-200 p-5 rounded-xl flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
        <button 
          type="button"
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 text-slate-400 hover:text-slate-800 transition-colors text-xs font-bold tracking-wide cursor-pointer group shrink-0"
        >
          <ChevronLeft size={16} className="transition-transform duration-150 group-hover:-translate-x-0.5" /> 
          <span>{t.btnBack}</span>
        </button>

        {/* Степер прогресу */}
        <div className="flex flex-wrap items-center justify-center gap-y-3 gap-x-2.5 md:gap-x-3">
          {steps.map((step) => (
            <div key={step.id} className="flex items-center gap-2.5">
              <button
                type="button"
                disabled={step.id > currentStepIndex} 
                onClick={() => navigate(`/setup/${step.path}`)}
                className={`
                  flex items-center justify-center w-8 h-8 rounded-lg border font-bold text-xs transition-all duration-200 select-none
                  ${currentStepIndex === step.id ? 'border-emerald-600 bg-emerald-50 text-emerald-700 font-extrabold scale-105 shadow-sm' : ''}
                  ${currentStepIndex > step.id ? 'border-emerald-600 bg-emerald-600 text-white cursor-pointer hover:bg-emerald-500' : ''}
                  ${step.id > currentStepIndex ? 'border-slate-200 text-slate-400 cursor-not-allowed bg-transparent' : ''}
                `}
              >
                {currentStepIndex > step.id ? <Check size={14} className="stroke-[3]" /> : step.id}
              </button>
              
              {step.id !== steps.length && (
                <div className={`w-3 sm:w-4 lg:w-6 h-[2px] rounded-full transition-colors duration-300 ${currentStepIndex > step.id ? 'bg-emerald-600' : 'bg-slate-200'}`}></div>
              )}
            </div>
          ))}
        </div>

        <div className="text-center md:text-right shrink-0">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">
            {t.counterLabel} {currentStepIndex} {t.counterOf} {steps.length}
          </p>
          <h2 className="text-slate-900 font-black text-sm mt-1.5 tracking-tight">{activeStep.name}</h2>
        </div>
      </header>

      {/* 2. SUB-STEP ROUTING CONTAINER LAYER */}
      <main className="bg-white rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden p-6 sm:p-8 lg:p-10">
        <div className="absolute top-0 left-0 w-full h-[2px] bg-emerald-600"></div>
          
        <Routes>
          <Route path="step1" element={<Step1_Semesters />} />
          <Route path="step2" element={<Step2_Classrooms />} />
          <Route path="step3" element={<Step3_TimeSlots />} />
          <Route path="step4" element={<Step4_Teachers />} />
          <Route path="step5" element={<Step5_Groups />} />
          <Route path="step6" element={<Step6_Curriculum />} />
          <Route path="step7" element={<Step7_AI_Engine />} />
          <Route path="*" element={<Navigate to="step1" replace />} />
        </Routes>
      </main>
    </div>
  );
};

export default SetupWizard;