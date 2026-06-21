import { useState, useMemo, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, Settings, Users, BookOpen, MapPin, 
  Calendar, LogOut, CalendarDays, ChevronDown, Wrench, Clock, Cpu, Landmark, Sliders, Languages
} from 'lucide-react';

const translations = {
  ua: {
    workspace: 'Робочий простір:',
    roleMethodist: 'Методист Координатор',
    roleTeacher: 'Викладач',
    navMain: 'Головна',
    navMySchedule: 'Мій Розклад',
    navConfigurator: 'Конструктор розкладу',
    navClaims: 'Запити викладачів',
    navStaff: 'Штат закладу',
    navTeachersRegistry: 'Реєстр викладачів',
    navResources: 'Управління ресурсами',
    navVersionsControl: 'Керування версіями',
    btnLogout: 'Вихід з кабінету',
    
    // Кроки для шкіл
    schoolStep1: '1. Версії та Семестри',
    schoolStep2: '2. Кабінети класів',
    schoolStep3: '3. Розклад дзвінків',
    schoolStep4: '4. Кадровий склад',
    schoolStep5: '5. Класи та Паралелі',
    schoolStep6: '6. Плани предметів',
    schoolStep7: '7. ШІ Оптимізатор',

    // Кроки для університетів
    uniStep1: '1. Тектоніка версій',
    uniStep2: '2. Фонд аудиторій',
    uniStep3: '3. Розклад дзвінків',
    uniStep4: '4. Викладацький штаб',
    uniStep5: '5. Академічні групи',
    uniStep6: '6. Матриця навантаження',
    uniStep7: '7. Генерація CSP'
  },
  en: {
    workspace: 'Workspace:',
    roleMethodist: 'Methodist Coordinator',
    roleTeacher: 'Faculty Teacher',
    navMain: 'Dashboard',
    navMySchedule: 'My Schedule',
    navConfigurator: 'Schedule Constructor',
    navClaims: 'Teacher Claims',
    navStaff: 'Institution Staff',
    navTeachersRegistry: 'Faculty Members',
    navResources: 'Resource Registry',
    navVersionsControl: 'Version Sandbox Management',
    btnLogout: 'Sign Out',

    // Кроки для шкіл (EN)
    schoolStep1: '1. Versions & Semesters',
    schoolStep2: '2. Classrooms',
    schoolStep3: '3. Bell Schedule',
    schoolStep4: '4. Teaching Staff',
    schoolStep5: '5. Classes & Parallels',
    schoolStep6: '6. Subject Plans',
    schoolStep7: '7. AI Optimizer',

    // Кроки для університетів (EN)
    uniStep1: '1. Version Control',
    uniStep2: '2. Auditorium Fund',
    uniStep3: '3. Bell Schedule',
    uniStep4: '4. Faculty Staff',
    uniStep5: '5. Academic Groups',
    uniStep6: '6. Load Matrix',
    uniStep7: '7. CSP Generation'
  }
};

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Зчитуємо базову мову з реактивним відстеженням стану
  const [lang, setLang] = useState(localStorage.getItem('lang') || 'ua');
  const t = translations[lang];

  const user = useMemo(() => JSON.parse(localStorage.getItem('user')) || {}, []);
  const userRole = user.role;
  const institutionType = user.Institution?.type || 'University';

  const [isWizardOpen, setIsWizardOpen] = useState(false);

  useEffect(() => {
    if (location.pathname.startsWith('/setup/')) {
      setIsWizardOpen(true);
    }
  }, [location.pathname]);

  // Глобальний тригер зміни мови для всього додатку
  const toggleLang = () => {
    const nextLang = lang === 'ua' ? 'en' : 'ua';
    setLang(nextLang);
    localStorage.setItem('lang', nextLang);
    
    // Створюємо та викликаємо глобальну подію оновлення мови у вікні браузера
    const langEvent = new CustomEvent('appLangChanged', { detail: nextLang });
    window.dispatchEvent(langEvent);
  };

  const wizardSteps = useMemo(() => {
    const baseline = [
      { path: '/setup/step1', icon: <Settings size={14} />, School: t.schoolStep1, University: t.uniStep1 },
      { path: '/setup/step2', icon: <MapPin size={14} />, School: t.schoolStep2, University: t.uniStep2 },
      { path: '/setup/step3', icon: <Clock size={14} />, School: t.schoolStep3, University: t.uniStep3 },
      { path: '/setup/step4', icon: <Users size={14} />, School: t.schoolStep4, University: t.uniStep4 },
      { path: '/setup/step5', icon: <Calendar size={14} />, School: t.schoolStep5, University: t.uniStep5 },
      { path: '/setup/step6', icon: <BookOpen size={14} />, School: t.schoolStep6, University: t.uniStep6 },
      { path: '/setup/step7', icon: <Cpu size={14} />, School: t.schoolStep7, University: t.uniStep7 },
    ];

    return baseline.map(step => ({
      path: step.path,
      icon: step.icon,
      name: step[institutionType] || step.University
    }));
  }, [institutionType, t]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div className="w-full md:w-64 bg-white h-auto md:h-screen text-slate-700 flex flex-col border-b md:border-b-0 md:border-r border-slate-200 shadow-sm select-none shrink-0 text-left">
      
      {/* BRANDING HEADER */}
      <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-row md:flex-col justify-between items-center md:items-start gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center text-xs font-black text-white shadow-sm">CP</div>
          <h1 className="text-lg font-black text-slate-900 tracking-tight">ClassPlanner</h1>
        </div>

        {/* Кнопка зміни локалізації інтегрована в шапку меню з авто-відступом */}
        <div className="md:mt-1">
          <button 
            type="button"
            onClick={toggleLang}
            className="flex items-center gap-1.5 text-[11px] text-slate-500 hover:text-slate-900 border border-slate-200 px-2 py-1 rounded-lg bg-white transition-colors cursor-pointer shadow-xs"
          >
            <Languages size={12} />
            <span className="uppercase font-bold">{lang === 'ua' ? 'en' : 'ua'}</span>
          </button>
        </div>
        
        {user.fullName && (
          <div className="hidden md:block md:mt-2 px-0.5 max-w-[180px]">
            <p className="text-xs text-slate-800 font-bold truncate">{user.fullName}</p>
            <p className="text-[9px] text-emerald-700 font-bold tracking-wider uppercase mt-0.5">
              {userRole === 'Methodist' ? t.roleMethodist : t.roleTeacher}
            </p>
          </div>
        )}
      </div>

      {/* CORE NAVIGATION CONTAINER */}
      <nav className="flex-1 px-3 py-3 md:py-4 space-y-1 overflow-y-auto md:overflow-x-hidden flex flex-row md:flex-col gap-1 md:gap-0 overflow-x-auto md:w-full items-center md:items-stretch scrollbar-none">
        
        {/* LINK: DASHBOARD */}
        <button
          type="button" onClick={() => navigate('/dashboard')}
          className={`flex items-center gap-2.5 px-3.5 py-2 md:py-2.5 rounded-xl transition-all duration-150 shrink-0 md:w-full text-left cursor-pointer font-semibold ${
            location.pathname === '/dashboard' ? 'bg-emerald-600 text-white shadow-sm' : 'hover:bg-slate-50 text-slate-500 hover:text-slate-900'
          }`}
        >
          <LayoutDashboard size={16} className={location.pathname === '/dashboard' ? 'text-white' : 'text-slate-400'} />
          <span className="text-xs tracking-wide">{t.navMain}</span>
        </button>

        {/* МЕНЮ МЕТОДИСТА */}
        {userRole === 'Methodist' && (
          <>
            <button
              type="button" onClick={() => navigate('/teachers-registry')}
              className={`flex items-center gap-2.5 px-3.5 py-2 md:py-2.5 rounded-xl transition-all duration-150 shrink-0 md:w-full text-left cursor-pointer font-semibold ${
                location.pathname === '/teachers-registry' ? 'bg-emerald-600 text-white shadow-sm' : 'hover:bg-slate-50 text-slate-500 hover:text-slate-900'
              }`}
            >
              <Users size={16} className={location.pathname === '/teachers-registry' ? 'text-white' : 'text-slate-400'} />
              <span className="text-xs tracking-wide">{t.navTeachersRegistry}</span>
            </button>

            <button
              type="button" onClick={() => navigate('/resources-management')}
              className={`flex items-center gap-2.5 px-3.5 py-2 md:py-2.5 rounded-xl transition-all duration-150 shrink-0 md:w-full text-left cursor-pointer font-semibold ${
                location.pathname === '/resources-management' ? 'bg-emerald-600 text-white shadow-sm' : 'hover:bg-slate-50 text-slate-500 hover:text-slate-900'
              }`}
            >
              <Landmark size={16} className={location.pathname === '/resources-management' ? 'text-white' : 'text-slate-400'} />
              <span className="text-xs tracking-wide">{t.navResources}</span>
            </button>

            <button
              type="button" onClick={() => navigate('/versions-control')}
              className={`flex items-center gap-2.5 px-3.5 py-2 md:py-2.5 rounded-xl transition-all duration-150 shrink-0 md:w-full text-left cursor-pointer font-semibold ${
                location.pathname === '/versions-control' ? 'bg-emerald-600 text-white shadow-sm' : 'hover:bg-slate-50 text-slate-500 hover:text-slate-900'
              }`}
            >
              <Sliders size={16} className={location.pathname === '/versions-control' ? 'text-white' : 'text-slate-400'} />
              <span className="text-xs tracking-wide">{t.navVersionsControl}</span>
            </button>

            <button
              type="button" onClick={() => navigate('/teacher-claims')}
              className={`flex items-center gap-2.5 px-3.5 py-2 md:py-2.5 rounded-xl transition-all duration-150 shrink-0 md:w-full text-left cursor-pointer font-semibold ${
                location.pathname === '/teacher-claims' ? 'bg-emerald-600 text-white shadow-sm' : 'hover:bg-slate-50 text-slate-500 hover:text-slate-900'
              }`}
            >
              <Calendar size={16} className={location.pathname === '/teacher-claims' ? 'text-white' : 'text-slate-400'} />
              <span className="text-xs tracking-wide">{t.navClaims}</span>
            </button>
          </>
        )}

        {/* LINK: SHARED TIMELINE GRID (Викладачі) */}
        {userRole === 'Teacher' && (
          <button
            type="button" onClick={() => navigate('/my-schedule')}
            className={`flex items-center gap-2.5 px-3.5 py-2 md:py-2.5 rounded-xl transition-all duration-150 shrink-0 md:w-full text-left cursor-pointer font-semibold ${
              location.pathname === '/my-schedule' ? 'bg-emerald-600 text-white shadow-sm' : 'hover:bg-slate-50 text-slate-500 hover:text-slate-900'
            }`}
          >
            <CalendarDays size={16} className={location.pathname === '/my-schedule' ? 'text-white' : 'text-slate-400'} />
            <span className="text-xs tracking-wide">{t.navMySchedule}</span>
          </button>
        )}

        {/* DROPDOWN BLOCK: WIZARD CONFIGURATOR MODULE */}
        {userRole === 'Methodist' && (
          <div className="flex md:flex-col gap-1 md:gap-0.5 pt-0 md:pt-1 md:w-full shrink-0">
            <button
              type="button" onClick={() => setIsWizardOpen(!isWizardOpen)}
              className={`flex items-center justify-between px-3.5 py-2 md:py-2.5 rounded-xl transition-all duration-150 md:w-full cursor-pointer font-semibold ${
                location.pathname.startsWith('/setup/') ? 'bg-slate-100 border border-slate-200 text-slate-800' : 'hover:bg-slate-50 text-slate-500 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Wrench size={16} className={location.pathname.startsWith('/setup/') ? 'text-emerald-600' : 'text-slate-400'} />
                <span className="text-xs tracking-wide whitespace-nowrap">{t.navConfigurator}</span>
              </div>
              <ChevronDown size={12} className={`text-slate-400 transition-transform duration-200 hidden md:block ${isWizardOpen ? 'rotate-180 text-slate-600' : ''}`} />
            </button>

            {isWizardOpen && (
              <div className="absolute md:relative top-14 md:top-0 left-0 md:left-0 bg-white md:bg-slate-50/50 border border-slate-200 p-1.5 md:p-1 mt-1 space-y-1 rounded-xl md:w-full flex md:flex-col shadow-lg md:shadow-none z-20 overflow-x-auto">
                {wizardSteps.map((step) => {
                  const isCurrent = location.pathname === step.path;
                  return (
                    <button
                      key={step.path} type="button" onClick={() => navigate(step.path)}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all cursor-pointer whitespace-nowrap shrink-0 md:w-full text-left ${
                        isCurrent ? 'bg-emerald-50 border border-emerald-100 text-emerald-700 font-bold' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100/50'
                      }`}
                    >
                      <div className={isCurrent ? 'text-emerald-600' : 'text-slate-400'}>{step.icon}</div>
                      <span className="truncate">{step.name}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* LINK: STAFF MANAGEMENT SYSTEM */}
        {userRole === 'Methodist' && (
          <button
            type="button" onClick={() => navigate('/staff')}
            className={`flex items-center gap-2.5 px-3.5 py-2 md:py-2.5 rounded-xl transition-all duration-150 shrink-0 md:w-full text-left cursor-pointer font-semibold ${
              location.pathname === '/staff' ? 'bg-emerald-600 text-white shadow-sm font-bold' : 'hover:bg-slate-50 text-slate-500 hover:text-slate-900'
          }`}
          >
            <Users size={16} className={location.pathname === '/staff' ? 'text-white' : 'text-slate-400'} />
            <span className="text-xs tracking-wide">{t.navStaff}</span>
          </button>
        )}
      </nav>

      {/* FOOTER PURGE SESSION PANEL */}
      <div className="p-3 border-t border-slate-100 bg-slate-50/50 hidden md:block">
        <button 
          type="button" onClick={handleLogout}
          className="w-full flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-red-600 hover:bg-red-50 font-bold transition-all text-xs cursor-pointer group"
        >
          <LogOut size={14} className="text-red-400 group-hover:text-red-600 transition-colors" />
          <span>{t.btnLogout}</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;