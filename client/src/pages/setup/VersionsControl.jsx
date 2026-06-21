import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { 
  Sliders, Plus, Trash2, CheckCircle2, AlertCircle, 
  Loader2, RefreshCw, Calendar, Sparkles, Check
} from 'lucide-react';

const translations = {
  ua: {
    title: 'Керування ітераційними версіями розкладів',
    subtitle: 'Створення експериментальних чернеток, вибір поточної робочої гілки та ручний деплой канонічного розкладу в Production',
    thName: 'Назва версії розкладу',
    thYear: 'Академічний рік',
    thDays: 'Робочих днів',
    thStatus: 'Статус релізу',
    thActions: 'Операційне керування',
    btnCreate: 'Створити нову чернетку',
    btnDeploy: 'Активувати як канонічний',
    btnActiveBranch: 'Поточна гілка конструктора',
    btnSelectBranch: 'Обрати для редагування',
    badgeProd: 'Active / Production',
    badgeDraft: 'Чернетка',
    confirmDeploy: 'Розгорнути версію "{name}" як єдиний канонічний розклад закладу? Усі інші версії перейдуть у статус чернеток.',
    confirmDelete: 'Ви дійсно бажаєте безповоротно видалити версію розкладу "{name}"? Усі пов’язані аудиторії, дзвінки та матриці навантаження будуть видалені каскадно.',
    successDeploy: 'Версію розкладу успішно опубліковано в Production.',
    successDelete: 'Версію розкладу успішно видалено з реєстру закладу.',
    emptyList: 'Чернетки розкладів відсутні. Натисніть кнопку вище, щоб згенерувати першу робочу сесію.',
    textSaving: 'Оновлення...',
    adviceTitle: 'Архітектурне логування версійності:',
    adviceDesc: 'Поточна гілка конструктора визначає, які саме аудиторії, дзвінки та плани годин ви зараз редагуєте в меню "Управління ресурсами". Статус Active визначає, який розклад бачать викладачі у своїх кабінетах.',
    placeholderNewName: 'напр. Осінній семестр 2026 — Фінал'
  },
  en: {
    title: 'Schedule Version Control System',
    subtitle: 'Generate experimental sandbox drafts, switch current working branches, and deploy the canonical schedule to Production',
    thName: 'Schedule Sandbox Title',
    thYear: 'Academic Year',
    thDays: 'Work Days',
    thStatus: 'Release Status',
    thActions: 'Operational Controls',
    btnCreate: 'Create New Draft',
    btnDeploy: 'Deploy to Prod',
    btnActiveBranch: 'Current Sandbox Active',
    btnSelectBranch: 'Select Sandbox',
    badgeProd: 'Active / Production',
    badgeDraft: 'Draft Staging',
    confirmDeploy: 'Deploy version "{name}" as the single canonical schedule for the entire institution? Alternative drafts will be set to staging status.',
    confirmDelete: 'Are you sure you want to permanently drop schedule version "{name}"? This will cascade-delete all bound classrooms, bells, and load matrices.',
    successDeploy: 'Schedule version successfully pushed to Production environments.',
    successDelete: 'Selected schedule sandbox successfully removed from database schema.',
    emptyList: 'No schedule drafts detected. Click the button above to initialize your first working session.',
    textSaving: 'Syncing...',
    adviceTitle: 'Version Sandbox Policy:',
    adviceDesc: 'The Current Sandbox Version dictates which isolated classrooms, bell schedules, and load matrices are updated inside the "Resource Registry" tab. The Production status locks down the public calendar grid view for teachers.',
    placeholderNewName: 'e.g., Autumn Term 2026 — Final Draft'
  }
};

const VersionsControl = () => {
  const [lang, setLang] = useState(localStorage.getItem('lang') || 'ua');
  const t = translations[lang];

  const [versions, setAllVersions] = useState([]);
  const [selectedVersionId, setSelectedVersionId] = useState('');
  const [loading, setLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState('idle'); // idle | saving

  useEffect(() => {
    const storedVersion = localStorage.getItem('currentScheduleVersion');
    if (storedVersion) setSelectedVersionId(storedVersion);
    fetchVersions();

    const handleLangChange = (e) => setLang(e.detail);
    window.addEventListener('appLangChanged', handleLangChange);
    return () => window.removeEventListener('appLangChanged', handleLangChange);
  }, []);

  const fetchVersions = async () => {
    try {
      const res = await api.get('/versions');
      setAllVersions(res.data || []);
    } catch (err) {
      console.error('Failed to sync versions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSwitchBranch = (id) => {
    setSyncStatus('saving');
    setSelectedVersionId(id);
    localStorage.setItem('currentScheduleVersion', id);
    
    // Елегантно імітуємо синхронізацію для UX відгуку
    setTimeout(() => {
      setSyncStatus('idle');
      // Оновлюємо глобальну подію у вікні додатка, щоб інші вкладки перечитали заголовки (headers)
      const branchEvent = new CustomEvent('appBranchChanged', { detail: id });
      window.dispatchEvent(branchEvent);
    }, 400);
  };

  const handleDeployProd = async (id, name) => {
    if (!window.confirm(t.confirmDeploy.replace('{name}', name))) return;
    setLoading(true);
    try {
      await api.put(`/methodist/versions/${id}/activate`);
      alert(t.successDeploy);
      await fetchVersions();
    } catch (err) {
      alert('Помилка розгортання релізу.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNewDraft = async () => {
    const draftName = window.prompt(t.placeholderNewName, `Draft_v${versions.length + 1}`);
    if (!draftName || !draftName.trim()) return;

    setLoading(true);
    const payload = {
      name: draftName.trim(),
      academicYear: '2026/2027',
      daysPerWeek: 5,
      allowWindows: true,
      weekendDays: 'Saturday,Sunday'
    };

    try {
      const res = await api.post('/versions', payload);
      localStorage.setItem('currentScheduleVersion', res.data.id);
      setSelectedVersionId(res.data.id);
      await fetchVersions();
    } catch (err) {
      alert('Помилка генерації нової чернетки.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteVersion = async (id, name) => {
    if (!window.confirm(t.confirmDelete.replace('{name}', name))) return;
    setLoading(true);
    try {
      await api.delete(`/versions/${id}`); // Якщо у вас на бекенді є роут видалення версії
      alert(t.successDelete);
      if (selectedVersionId === id) {
        localStorage.removeItem('currentScheduleVersion');
        setSelectedVersionId('');
      }
      await fetchVersions();
    } catch (err) {
      alert('Не вдалося видалити версію через канонічні обмеження або відсутність роуту.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center bg-slate-50 antialiased font-sans">
      <Loader2 className="text-emerald-600 animate-spin w-8 h-8 mb-2" />
    </div>
  );

  return (
    <div className="space-y-6 select-none text-left antialiased font-sans w-full text-slate-700 p-1 animate-in fade-in duration-150">
      
      {/* ERP HEADER */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b border-slate-200 pb-4 gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <Sliders className="text-emerald-600" size={24} /> 
            <span>{t.title}</span>
          </h1>
          <p className="text-slate-500 text-xs mt-1 leading-relaxed max-w-4xl">
            {t.subtitle}
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
          {syncStatus === 'saving' && <span className="text-xs text-amber-600 font-semibold flex items-center gap-1"><Loader2 size={12} className="animate-spin" /> {t.textSaving}</span>}
          <button 
            type="button" onClick={handleCreateNewDraft}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm uppercase tracking-wide"
          >
            <Plus size={14} /> {t.btnCreate}
          </button>
        </div>
      </div>

      {/* VERSTIONS INTERACTIVE DATA TABLE */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-400 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">{t.thName}</th>
                <th className="px-4 py-3 w-40">{t.thYear}</th>
                <th className="px-4 py-3 w-32">{t.thDays}</th>
                <th className="px-4 py-3 w-44">{t.thStatus}</th>
                <th className="px-4 py-3 text-right w-80">{t.thActions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-medium">
              {versions.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-20 text-slate-400 italic">{t.emptyList}</td>
                </tr>
              ) : (
                versions.map(v => {
                  const isCurrentBranch = selectedVersionId === v.id;
                  return (
                    <tr key={v.id} className={`transition-colors ${isCurrentBranch ? 'bg-emerald-50/20' : 'hover:bg-slate-50/50'}`}>
                      {/* Назва версії */}
                      <td className="px-4 py-3.5">
                        <span className="font-bold text-slate-900 text-sm">{v.name}</span>
                      </td>
                      
                      {/* Академічний рік */}
                      <td className="px-4 py-3.5 text-slate-500 font-mono font-bold">
                        {v.academicYear || '2026/2027'}
                      </td>
                      
                      {/* Робочих днів */}
                      <td className="px-4 py-3.5 text-slate-600 font-bold">
                        {v.daysPerWeek} {lang === 'ua' ? 'днів' : 'days'}
                      </td>
                      
                      {/* Статус Релізу */}
                      <td className="px-4 py-3.5">
                        {v.isActive ? (
                          <span className="inline-flex items-center gap-1 bg-emerald-100 border border-emerald-200 text-emerald-800 text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider">
                            <Sparkles size={10} /> {t.badgeProd}
                          </span>
                        ) : (
                          <span className="inline-flex items-center bg-slate-100 border border-slate-200 text-slate-500 text-[9px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider">
                            {t.badgeDraft}
                          </span>
                        )}
                      </td>
                      
                      {/* Набір ERP операцій */}
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          
                          {/* Світч поточної гілки */}
                          {isCurrentBranch ? (
                            <span className="h-8 px-3 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 font-bold text-[10px] uppercase tracking-wide flex items-center gap-1">
                              <Check size={12} className="stroke-[3]" /> {t.btnActiveBranch}
                            </span>
                          ) : (
                            <button
                              type="button" onClick={() => handleSwitchBranch(v.id)}
                              className="h-8 px-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 font-bold text-[10px] uppercase tracking-wide transition-colors cursor-pointer"
                            >
                              {t.btnSelectBranch}
                            </button>
                          )}

                          {/* Деплой в Production */}
                          {!v.isActive && (
                            <button
                              type="button" onClick={() => handleDeployProd(v.id, v.name)}
                              className="h-8 px-3 rounded-lg bg-slate-900 hover:bg-emerald-600 text-white font-bold text-[10px] uppercase tracking-wider transition-colors cursor-pointer shadow-xs flex items-center gap-1"
                            >
                              <CheckCircle2 size={12} /> {t.btnDeploy}
                            </button>
                          )}

                          {/* Кнопка видалення чернетки */}
                          {!v.isActive && (
                            <button 
                              type="button" onClick={() => handleDeleteVersion(v.id, v.name)}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all cursor-pointer"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ARCHITECTURAL FOOTNOTE ADVICE */}
      <div className="p-4 bg-emerald-50/40 border border-emerald-100 rounded-xl flex items-start gap-2.5 mt-2">
        <AlertCircle size={15} className="text-emerald-600 shrink-0 mt-0.5" />
        <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
          <span className="text-emerald-700 font-bold">{t.adviceTitle}</span> {t.adviceDesc}
        </p>
      </div>

    </div>
  );
};

export default VersionsControl;