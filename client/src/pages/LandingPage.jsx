import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { School, Cpu, Calendar, ShieldCheck, ArrowRight, Mail, Phone, Languages } from 'lucide-react';

const translations = {
  ua: {
    loginBtn: 'Увійти в кабінет',
    requestBtn: 'Підключити заклад',
    badgeText: 'Автоматизація вашого розкладу',
    heroTitlePre: 'Розумне планування',
    heroTitlePost: 'академічного розкладу.',
    heroDesc: 'ClassPlanner інтегрує сучасні алгоритми для миттєвого прорахунку тижневих сіток занять. Забудьте про накладки у викладачів та конфлікти суміжних підгруп.',
    ctaSubmit: 'Подати заявку на доступ',
    ctaLogin: 'Вхід для викладачів та методистів',
    footerRights: 'ClassPlanner Platform. Всі права захищено.',
    
    // Спрощені картки переваг
    card1Title: 'Швидкий розрахунок',
    card1Desc: 'Система автоматично прораховує тисячі комбінацій та створює готовий розклад за лічені секунди.',
    card2Title: 'Гнучкі налаштування',
    card2Desc: 'Враховує побажання викладачів, вільні дні, завантаженість груп та кабінетів.',
    card3Title: 'Надійний захист',
    card3Desc: 'Дані вашої установи повністю ізольовані, захищені та доступні лише вашим співробітникам.',
    card4Title: 'Зручний конструктор',
    card4Desc: 'Покроковий помічник допоможе легко налаштувати семестр, дзвінки та плани занять.'
  },
  en: {
    loginBtn: 'Sign In',
    requestBtn: 'Register Institution',
    badgeText: 'Automation of your schedule',
    heroTitlePre: 'Smart Scheduling',
    heroTitlePost: 'for Academic Timetables.',
    heroDesc: 'ClassPlanner integrates advanced algorithms for instant calculation of weekly class grids. Forget about teacher overlaps and subgroup scheduling conflicts.',
    ctaSubmit: 'Submit Access Request',
    ctaLogin: 'Login for Teachers & Coordinators',
    footerRights: 'ClassPlanner Platform. All rights reserved.',
    
    // Спрощені картки переваг (EN)
    card1Title: 'Fast Calculation',
    card1Desc: 'The system automatically processes thousands of combinations to create a ready schedule in seconds.',
    card2Title: 'Flexible Settings',
    card2Desc: 'Takes into account teacher preferences, days off, group workloads, and available classrooms.',
    card3Title: 'Reliable Protection',
    card3Desc: 'Your institution data is fully isolated, secured, and accessible only to your authorized staff.',
    card4Title: 'Easy Constructor',
    card4Desc: 'A step-by-step wizard helps you easily configure semesters, bell schedules, and course loads.'
  }
};

const LandingPage = () => {
  const navigate = useNavigate();

  // Зчитуємо або встановлюємо поточну мову системи
  const [lang, setLang] = useState(localStorage.getItem('lang') || 'ua');
  const t = translations[lang];

  const toggleLang = () => {
    const nextLang = lang === 'ua' ? 'en' : 'ua';
    setLang(nextLang);
    localStorage.setItem('lang', nextLang);
    
    // Сповіщаємо інші компоненти про зміну мови
    const langEvent = new CustomEvent('appLangChanged', { detail: nextLang });
    window.dispatchEvent(langEvent);
  };

  return (
    <div className="h-screen w-screen bg-slate-950 text-slate-300 select-none text-left relative overflow-hidden flex flex-col justify-between">
      
      {/* Dynamic emerald ambient neon glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[130px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-teal-500/10 rounded-full blur-[130px] pointer-events-none"></div>

      {/* 1. HEADER */}
      <header className="border-b border-white/5 bg-slate-900/40 backdrop-blur-md z-50 shrink-0">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
            <div className="w-10 h-10 rounded-xl bg-emerald-600/10 border border-emerald-500/20 flex items-center justify-center">
              <School className="text-emerald-500 w-5 h-5" />
            </div>
            <span className="text-xl font-black text-white tracking-tight">ClassPlanner</span>
          </div>

          <div className="flex items-center gap-4">
            {/* Кнопка зміни мови */}
            <button 
              type="button"
              onClick={toggleLang}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white border border-white/10 px-2.5 py-1.5 rounded-xl bg-white/5 transition-colors cursor-pointer"
            >
              <Languages size={14} />
              <span className="uppercase font-semibold">{lang === 'ua' ? 'en' : 'ua'}</span>
            </button>

            <button 
              type="button"
              onClick={() => navigate('/login')}
              className="text-xs font-bold text-slate-400 hover:text-white transition-colors cursor-pointer px-4 py-2.5 rounded-xl hover:bg-white/5"
            >
              {t.loginBtn}
            </button>
            <button 
              type="button"
              onClick={() => navigate('/request-access')}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-all shadow-md shadow-emerald-950/20 cursor-pointer"
            >
              {t.requestBtn}
            </button>
          </div>
        </div>
      </header>

      {/* 2. HERO CONTENT GRID */}
      <main className="max-w-7xl mx-auto px-6 w-full flex-1 grid grid-cols-1 lg:grid-cols-5 gap-12 items-center relative z-10 overflow-hidden py-6">
        
        {/* LEFT COLUMN: HERO CALL TO ACTIONS */}
        <div className="lg:col-span-3 space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-[11px] font-black uppercase tracking-widest text-emerald-400">
            <Cpu size={12} className="animate-pulse" /> {t.badgeText}
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tighter leading-none">
            {t.heroTitlePre} <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400">{t.heroTitlePost}</span>
          </h1>
          <p className="text-slate-400 text-sm sm:text-base lg:text-lg max-w-xl leading-relaxed">
            {t.heroDesc}
          </p>
          <div className="flex flex-wrap gap-4 pt-2">
            <button 
              type="button"
              onClick={() => navigate('/request-access')}
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-7 py-4 rounded-xl font-bold text-xs flex items-center gap-2.5 shadow-lg shadow-emerald-950/40 transition-all cursor-pointer group"
            >
              <span>{t.ctaSubmit}</span>
              <ArrowRight size={14} className="transition-transform duration-150 group-hover:translate-x-0.5" />
            </button>
            <button 
              type="button"
              onClick={() => navigate('/login')}
              className="bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 hover:border-slate-700 px-6 py-4 rounded-xl font-bold text-xs transition-all cursor-pointer"
            >
              {t.ctaLogin}
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: INTERACTIVE MATRIX CARDS */}
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
          {[
            { icon: <Cpu className="text-emerald-400" size={22} />, title: t.card1Title, desc: t.card1Desc },
            { icon: <Calendar className="text-teal-400" size={22} />, title: t.card2Title, desc: t.card2Desc },
            { icon: <ShieldCheck className="text-cyan-400" size={22} />, title: t.card3Title, desc: t.card3Desc },
            { icon: <School className="text-emerald-400" size={22} />, title: t.card4Title, desc: t.card4Desc },
          ].map((item, i) => (
            <div key={i} className="bg-slate-900/40 border border-white/5 p-5 rounded-2xl shadow-xl flex flex-col justify-center h-40 backdrop-blur-sm hover:border-white/10 transition-colors">
              <div className="w-9 h-9 bg-slate-950 border border-slate-800/80 rounded-xl flex items-center justify-center shadow-inner mb-3 shrink-0">
                {item.icon}
              </div>
              <div>
                <h3 className="text-white font-bold text-xs tracking-tight mb-1">{item.title}</h3>
                <p className="text-slate-500 text-[10px] leading-relaxed font-medium">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* 3. FLOATING LOWER FOOTER TRACK BAR */}
      <footer className="border-t border-white/5 bg-slate-950/60 backdrop-blur-sm shrink-0">
        <div className="max-w-7xl mx-auto px-6 h-14 flex flex-col sm:flex-row justify-between items-center gap-2 text-[11px]">
          <div>
            <p className="text-slate-600 font-bold uppercase tracking-wider">
              &copy; {t.footerRights}
            </p>
          </div>

          <div className="flex items-center gap-x-6 text-slate-500 font-semibold">
            <a href="mailto:support@classplanner.ua" className="flex items-center gap-1.5 hover:text-slate-300 transition-colors">
              <Mail size={12} /> <span>support@classplanner.ua</span>
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;