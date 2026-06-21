import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { ArrowRight, History, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

const translations = {
  ua: {
    labelYear: 'Навчальний / Академічний рік',
    labelDays: 'Робочих днів на тиждень',
    btnSubmit: 'Зберегти версію та перейти далі',
    adviceTitle: 'Архітектурна підказка:',
    adviceDesc: 'Ви можете створювати необмежену кількість паралельних чернеток. Алгоритм ШІ-оптимізації працює абсолютно ізольовано всередині обраної сесії, не зачіпаючи дані інших періодів навчання.',
    days5: '5 днів (Пн - Пт)',
    days6: '6 днів (Пн - Сб)',
    days7: '7 днів (Пн - Нд)',
    yearSuffix: 'н.р.',
    daysSuffix: 'робочих днів',
    
    // Шкільні маркери
    schoolTitle: 'Новий навчальний семестр',
    schoolDesc: 'Вкажіть назву чверті або півріччя та оберіть навчальний рік, щоб розгорнути координаційну сітку для оптимізації шкільних уроків.',
    schoolInput: 'Назва навчального періоду (Семестру)',
    schoolPlaceholder: 'напр. І Півріччя — Початкова школа',
    schoolHistory: 'Продовжити роботу з існуючого періоду',
    schoolHistoryEmpty: 'Реєстр архівних періодів порожній',

    // Університетські маркери
    uniTitle: 'Нова робоча сесія версії',
    uniDesc: 'Вкажіть назву та оберіть академічний рік, щоб розгорнути чисту координаційну сітку для оптимізації розкладу пар ШІ-оптимізатором.',
    uniInput: 'Назва робочої версії розкладу',
    uniPlaceholder: 'напр. Осінній семестр — Факультет КН',
    uniHistory: 'Продовжити роботу з існуючої чернетки',
    uniHistoryEmpty: 'Реєстр архівних версій порожній'
  },
  en: {
    labelYear: 'Academic Year',
    labelDays: 'Working Days per Week',
    btnSubmit: 'Save Version & Continue',
    adviceTitle: 'Architectural Advice:',
    adviceDesc: 'You can maintain an unlimited number of parallel drafts. The AI optimizer runs in full isolation inside the selected sandbox session, keeping alternative contexts completely safe.',
    days5: '5 Days (Mon - Fri)',
    days6: '6 Days (Mon - Sat)',
    days7: '7 Days (Mon - Sun)',
    yearSuffix: 'a.y.',
    daysSuffix: 'working days',

    // Шкільні маркери (EN)
    schoolTitle: 'New Academic Semester',
    schoolDesc: 'Provide a semester or term name and select the target year to deploy the configuration sandbox for school lessons.',
    schoolInput: 'Academic Period Name (Semester)',
    schoolPlaceholder: 'e.g., 1st Term — Elementary School',
    schoolHistory: 'Continue with Existing Period',
    schoolHistoryEmpty: 'No archived periods detected',

    // Університетські маркери (EN)
    uniTitle: 'New Sandbox Version Session',
    uniDesc: 'Specify a title and academic year to launch a clean staging environment for schedule optimization by the AI core.',
    uniInput: 'Schedule Version Workspace Name',
    uniPlaceholder: 'e.g., Fall Semester — CS Faculty',
    uniHistory: 'Continue with Existing Draft',
    uniHistoryEmpty: 'No archived sandbox versions found'
  }
};

const Step1 = () => {
  const lang = localStorage.getItem('lang') || 'ua';
  const t = translations[lang];

  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  
  const user = useMemo(() => JSON.parse(localStorage.getItem('user')) || {}, []);
  const institutionType = user.Institution?.type || 'University';

  const [formData, setFormData] = useState({
    name: '',
    academicYear: '2026/2027', 
    daysPerWeek: '5',
    allowWindows: true
  });

  const navigate = useNavigate();

  useEffect(() => {
    fetchVersions();
  }, []);

  const fetchVersions = async () => {
    try {
      const res = await api.get('/versions');
      setVersions(res.data || []);
    } catch (err) {
      console.error('Failed to sync schedule versions registry:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectVersion = (versionId) => {
    localStorage.setItem('currentScheduleVersion', versionId);
    navigate('/setup/step2'); 
  };

  const handleCreateVersion = async (e) => {
    e.preventDefault();
    setCreating(true);

    const payload = {
      name: formData.name.trim(),
      academicYear: formData.academicYear,
      daysPerWeek: Number(formData.daysPerWeek),
      allowWindows: formData.allowWindows,
      weekendDays: Number(formData.daysPerWeek) === 5 ? 'Saturday,Sunday' : 'Sunday'
    };

    try {
      const res = await api.post('/versions', payload);
      localStorage.setItem('currentScheduleVersion', res.data.id);
      setTimeout(() => navigate('/setup/step2'), 300);
    } catch (err) {
      alert(`Error creating session: ${err.response?.data?.message || err.message}`);
    } finally {
      setCreating(false);
    }
  };

  const contextLabels = useMemo(() => {
    if (institutionType === 'School') {
      return {
        title: t.schoolTitle,
        desc: t.schoolDesc,
        inputLabel: t.schoolInput,
        placeholder: t.schoolPlaceholder,
        historyTitle: t.schoolHistory,
        emptyHistory: t.schoolHistoryEmpty
      };
    }
    return {
      title: t.uniTitle,
      desc: t.uniDesc,
      inputLabel: t.uniInput,
      placeholder: t.uniPlaceholder,
      historyTitle: t.uniHistory,
      emptyHistory: t.uniHistoryEmpty
    };
  }, [institutionType, t]);

  if (loading) {
    return (
      <div className="flex justify-center items-center p-20 w-full bg-white">
        <Loader2 className="animate-spin text-emerald-600" size={32} />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 animate-in fade-in duration-200 select-none text-slate-700 w-full">
      
      {/* LEFT COLUMN: FRESH CONTEXT CONFIGURATION FORM */}
      <div className="space-y-6 text-left">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">{contextLabels.title}</h2>
          <p className="text-slate-400 text-xs mt-1 leading-relaxed">{contextLabels.desc}</p>
        </div>

        <form onSubmit={handleCreateVersion} className="space-y-4">
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5 block pl-0.5">
              {contextLabels.inputLabel}
            </label>
            <input 
              type="text" 
              placeholder={contextLabels.placeholder}
              required
              disabled={creating}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-slate-900 text-sm outline-none focus:border-emerald-500 focus:bg-white transition-colors font-medium disabled:opacity-50"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5 block pl-0.5">{t.labelYear}</label>
              <div className="relative">
                <select
                  disabled={creating}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-slate-900 text-sm outline-none focus:border-emerald-500 focus:bg-white transition-colors font-medium cursor-pointer appearance-none"
                  value={formData.academicYear}
                  onChange={(e) => setFormData({...formData, academicYear: e.target.value})}
                >
                  <option value="2025/2026">2025/2026 {t.yearSuffix}</option>
                  <option value="2026/2027">2026/2027 {t.yearSuffix}</option>
                  <option value="2027/2028">2027/2028 {t.yearSuffix}</option>
                </select>
                <div className="absolute right-4 top-4 pointer-events-none w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[4px] border-t-slate-400"></div>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5 block pl-0.5">{t.labelDays}</label>
              <div className="relative">
                <select
                  disabled={creating}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-slate-900 text-sm outline-none focus:border-emerald-500 focus:bg-white transition-colors font-medium cursor-pointer appearance-none"
                  value={formData.daysPerWeek}
                  onChange={(e) => setFormData({...formData, daysPerWeek: e.target.value})}
                >
                  <option value="5">{t.days5}</option>
                  <option value="6">{t.days6}</option>
                  <option value="7">{t.days7}</option>
                </select>
                <div className="absolute right-4 top-4 pointer-events-none w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[4px] border-t-slate-400"></div>
              </div>
            </div>
          </div>

          <button 
            type="submit"
            disabled={creating}
            className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-100 disabled:text-slate-400 text-white font-bold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm cursor-pointer shadow-sm pt-2"
          >
            {creating ? <Loader2 className="animate-spin" size={16} /> : (
              <>
                <span>{t.btnSubmit}</span>
                <ArrowRight size={14} />
              </>
            )}
          </button>
        </form>
      </div>

      {/* RIGHT COLUMN: REUSE EXISTING TIMELINE HISTORY CHANNELS */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 text-left flex flex-col justify-between h-full">
        <div className="space-y-3.5">
          <div className="flex items-center gap-2 px-0.5">
            <History className="text-slate-400 w-4 h-4" />
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider">{contextLabels.historyTitle}</h3>
          </div>

          <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1 scrollbar-none">
            {versions.length === 0 ? (
              <p className="text-slate-400 text-xs italic text-center py-12">{contextLabels.emptyHistory}</p>
            ) : (
              versions.map((v) => (
                <div 
                  key={v.id} 
                  onClick={() => handleSelectVersion(v.id)}
                  className="bg-white border border-slate-200 p-3.5 rounded-xl flex items-center justify-between hover:border-emerald-500 transition-colors cursor-pointer shadow-sm group"
                >
                  <div className="space-y-0.5 min-w-0">
                    <h4 className="text-slate-900 font-bold text-xs group-hover:text-emerald-600 transition-colors truncate">{v.name}</h4>
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-semibold uppercase tracking-tight">
                      <span className="text-emerald-700">{v.academicYear} {t.yearSuffix}</span>
                      <span className="text-slate-200">•</span>
                      <span>{v.daysPerWeek} {t.daysSuffix}</span>
                    </div>
                  </div>
                  {v.isActive ? (
                    <span className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-[9px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-wider shrink-0">Prod</span>
                  ) : (
                    <span className="bg-slate-50 border border-slate-200 text-slate-500 text-[9px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wider shrink-0">Draft</span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
        
        <div className="p-4 bg-emerald-50/40 border border-emerald-100 rounded-xl flex items-start gap-2.5 mt-5">
          <AlertCircle size={15} className="text-emerald-600 shrink-0 mt-0.5" />
          <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
            <span className="text-emerald-700 font-bold">{t.adviceTitle}</span> {t.adviceDesc}
          </p>
        </div>
      </div>

    </div>
  );
};

export default Step1;