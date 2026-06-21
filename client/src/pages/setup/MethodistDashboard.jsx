import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { 
  Users, FolderTree, CalendarDays, ChevronRight, Plus, 
  Sparkles, Loader2, Landmark, Calendar, ClipboardList, UserCheck
} from 'lucide-react';

const translations = {
  ua: {
    loading: 'Синхронізація аналітики закладу...',
    workspace: 'Робочий простір закладу:',
    coordinator: 'Координатор платформи',
    typeSchool: 'Школа / Ліцей',
    typeUni: 'Університет / ВНЗ',
    statusTitle: 'Поточний статус розкладу семестру',
    activeTitle: 'Активний затверджений розклад:',
    activeDesc: 'Ця версія активована як публічний канонічний розклад.',
    btnOpenGrid: 'Відкрити інтерактивну сітку',
    btnCreateNew: 'Створити нову версію розкладу',
    noActiveTitle: 'Затверджений розклад відсутній або прихований',
    noActiveDesc: 'У системі вашого закладу ще немає розгорнутої діючої сітки занять. Розгорніть бічне меню "Конструктор розкладу", щоб заповнити базу даних та ініціювати запуск математичного ШІ-генератора.',
    btnStartZero: 'Розпочати проектування з нуля',
    statTeachersSchool: 'Вчителі закладу',
    statTeachersUni: 'Викладачі',
    statGroupsSchool: 'Класи навчання',
    statGroupsUni: 'Студ. Групи',
    statDrafts: 'Чернетки розкладів',
    statClassroomsSchool: 'Кабінети (Класи)',
    statClassroomsUni: 'Аудиторії закладу',
    archiveTitle: 'Архів експериментальних версій та чернеток',
    archiveEmpty: 'Усі розроблені версії порожні або відсутні експериментальні чернетки.',
    gridLabel: 'Календарна сітка:',
    days: 'днів',
    badgeDraft: 'Чернетка',
    btnDeploy: 'Опублікувати розклад',
    currentBranch: 'Поточна гілка конструктора:'
  },
  en: {
    loading: 'Synchronizing institution analytics...',
    workspace: 'Institution Workspace:',
    coordinator: 'Platform Coordinator',
    typeSchool: 'School / Lyceum',
    typeUni: 'University / Higher Ed',
    statusTitle: 'Current semester schedule status',
    activeTitle: 'Active Approved Schedule:',
    activeDesc: 'This version is activated as the public canonical schedule. All CSP algorithms and manual corrections are successfully committed to the database.',
    btnOpenGrid: 'Open Interactive Grid',
    btnCreateNew: 'Create New Schedule Version',
    noActiveTitle: 'Approved schedule is missing or hidden',
    noActiveDesc: 'There is no deployed active class grid in your institution system yet. Expand the "Schedule Constructor" sidebar menu to populate the database and initiate the mathematical AI generator.',
    btnStartZero: 'Start Designing From Scratch',
    statTeachersSchool: 'School Teachers',
    statTeachersUni: 'Faculty Staff',
    statGroupsSchool: 'Study Classes',
    statGroupsUni: 'Student Groups',
    statDrafts: 'Draft Schedules',
    statClassroomsSchool: 'Classrooms',
    statClassroomsUni: 'Institution Auditoriums',
    archiveTitle: 'Archive of Experimental Versions and Drafts',
    archiveEmpty: 'All designed versions are empty or no experimental drafts found.',
    gridLabel: 'Calendar Grid:',
    days: 'days',
    badgeDraft: 'Draft',
    btnDeploy: 'Deploy Schedule to Prod',
    currentBranch: 'Current Sandbox Version:'
  }
};

const MethodistDashboard = () => {
  const [lang, setLang] = useState(localStorage.getItem('lang') || 'ua');
  const t = translations[lang];

  const [stats, setStats] = useState({ teachers: 0, groups: 0, versions: 0, classrooms: 0, pendingRequestsCount: 0 });
  const [allVersions, setAllVersions] = useState([]);
  const [selectedVersionId, setSelectedVersionId] = useState('');
  const [instNameText, setInstNameText] = useState(''); 
  const [instTypeText, setInstTypeText] = useState('University'); 
  const [loading, setLoading] = useState(true);
  
  const user = JSON.parse(localStorage.getItem('user')) || {};
  const navigate = useNavigate();

  useEffect(() => {
    const storedVersion = localStorage.getItem('currentScheduleVersion');
    if (storedVersion) setSelectedVersionId(storedVersion);
    fetchDashboardData(storedVersion);

    // Слухач глобальної події зміни мови через Sidebar
    const handleLangChange = (e) => {
      setLang(e.detail);
    };

    window.addEventListener('appLangChanged', handleLangChange);
    return () => window.removeEventListener('appLangChanged', handleLangChange);
  }, []);

  const fetchDashboardData = async (versionId) => {
    try {
      const config = {
        headers: versionId ? { 'x-schedule-version-id': versionId } : {}
      };
      
      const statsRes = await api.get('/methodist/dashboard-stats', config);
      const versionsRes = await api.get('/versions').catch(() => ({ data: [] }));
      const versionsList = versionsRes.data || [];
      
      const { 
        teachers, groups, versions, classrooms, 
        pendingRequestsCount, institutionName, institutionType 
      } = statsRes.data;
      
      setStats({ teachers, groups, versions, classrooms, pendingRequestsCount });
      setInstNameText(institutionName || 'Institution Name');
      setInstTypeText(institutionType || 'University');
      setAllVersions(versionsList);

      if (!versionId && versionsList.length > 0) {
        const activeVersion = versionsList.find(v => v.isActive) || versionsList[0];
        setSelectedVersionId(activeVersion.id);
        localStorage.setItem('currentScheduleVersion', activeVersion.id);
      }
    } catch (err) {
      console.error('Methodist Dashboard Sync Critical Error:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectVersionChange = (id) => {
    setSelectedVersionId(id);
    localStorage.setItem('currentScheduleVersion', id);
    setLoading(true);
    fetchDashboardData(id);
  };

  const handleDeployToProduction = async (versionId) => {
    try {
      await api.put(`/methodist/versions/${versionId}/activate`);
      fetchDashboardData(versionId);
    } catch (err) {
      alert(err.response?.data?.message || 'Deploy error');
    }
  };

  const activeProductionVersion = useMemo(() => {
    return allVersions.find(v => v.isActive) || null;
  }, [allVersions]);

  const draftScheduleVersions = useMemo(() => {
    return allVersions.filter(v => !v.isActive);
  }, [allVersions]);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center select-none antialiased font-sans bg-slate-50">
        <Loader2 className="text-emerald-600 animate-spin w-10 h-10 mb-3" />
        <p className="text-slate-500 font-bold text-xs uppercase tracking-widest">{t.loading}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-200 select-none text-slate-700 w-full antialiased font-sans p-1 sm:p-2">
      
      {/* 1. TOP INTERACTIVE PROFILE PANEL */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 px-0.5">
          <Landmark className="text-emerald-600 w-5 h-5" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            {t.workspace} <span className="text-slate-900 font-black">{instNameText}</span>
          </span>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded border bg-slate-50 text-slate-600 uppercase">
            {instTypeText === 'School' ? t.typeSchool : t.typeUni}
          </span>
        </div>
        
        <div className="flex flex-wrap items-center justify-between sm:justify-end gap-3 w-full sm:w-auto border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100">
          
          {/* Свичування пісочниці розкладу */}
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-2 py-1 rounded-lg">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{t.currentBranch}</span>
            <select 
              value={selectedVersionId} 
              onChange={(e) => handleSelectVersionChange(e.target.value)}
              className="text-xs font-bold bg-transparent outline-none text-slate-800 cursor-pointer"
            >
              {allVersions.map(v => (
                <option key={v.id} value={v.id}>{v.name} {v.isActive ? '(Prod)' : ''}</option>
              ))}
            </select>
          </div>

          {/* Лічильник нерозглянутих кадрових запитів викладачів */}
          <button 
            onClick={() => navigate('/teacher-claims')}
            className="relative p-2 text-slate-400 hover:text-emerald-600 border border-slate-200 rounded-lg transition-colors cursor-pointer bg-white shadow-sm"
          >
            <UserCheck size={18} />
            {stats.pendingRequestsCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 min-w-4 h-4 px-1 bg-red-500 text-white font-mono text-[9px] font-bold rounded-full flex items-center justify-center border border-white animate-bounce">
                {stats.pendingRequestsCount}
              </span>
            )}
          </button>
            
          <div className="flex items-center gap-2.5 bg-slate-50 p-1 pr-3 rounded-lg border border-slate-200">
            <div className="w-7 h-7 bg-emerald-600 rounded-md flex items-center justify-center font-black text-xs text-white shadow-sm">
              {user.fullName?.charAt(0).toUpperCase() || 'M'}
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900 leading-none">{user.fullName}</p>
              <p className="text-[9px] text-emerald-700 font-bold uppercase tracking-widest mt-1">{t.coordinator}</p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. CORE WORKSPACE INFRASTRUCTURE: BANNER */}
      <section className="relative rounded-2xl p-0.5 bg-gradient-to-br from-slate-200 via-transparent to-slate-200 overflow-hidden shadow-sm text-left">
        <div className="bg-white rounded-[1.15rem] p-6 lg:p-8 flex flex-col lg:flex-row justify-between items-center gap-8">
          <div className="max-w-xl w-full space-y-4">
            <div className="flex items-center gap-2 text-emerald-600 text-xs font-black uppercase tracking-widest">
              <Sparkles size={14} className="shrink-0" /> {t.statusTitle}
            </div>
            
            {activeProductionVersion ? (
              <div className="space-y-3.5">
                <h1 className="text-2xl lg:text-3xl font-black text-slate-900 tracking-tight leading-tight">
                  {t.activeTitle} <br />
                  <span className="text-emerald-600 font-extrabold">
                    "{activeProductionVersion.name}"
                  </span>
                </h1>
                <p className="text-slate-500 text-xs sm:text-sm leading-relaxed">
                  {t.activeDesc}
                </p>
                <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
                  <button 
                    onClick={() => {
                      localStorage.setItem('currentScheduleVersion', activeProductionVersion.id);
                      navigate('/my-schedule');
                    }}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-sm"
                  >
                    <Calendar size={14} /> {t.btnOpenGrid}
                  </button>
                  <button 
                    onClick={() => navigate('/setup/step1')}
                    className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <Plus size={14} /> {t.btnCreateNew}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3.5">
                <h1 className="text-2xl lg:text-3xl font-black text-slate-900 tracking-tight leading-tight">
                  {t.noActiveTitle}
                </h1>
                <p className="text-slate-500 text-xs sm:text-sm leading-relaxed">
                  {t.noActiveDesc}
                </p>
                <button 
                  onClick={() => navigate('/setup/step1')}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-colors cursor-pointer w-full sm:w-fit justify-center shadow-sm"
                >
                  <Plus size={14} /> {t.btnStartZero}
                </button>
              </div>
            )}
          </div>
          
          {/* Quick Analytics Counters */}
          <div className="grid grid-cols-2 gap-3 w-full lg:w-auto shrink-0">
            {[
              { label: instTypeText === 'School' ? t.statTeachersSchool : t.statTeachersUni, val: stats.teachers || 0, style: 'border-l-blue-500 text-blue-600', icon: <Users size={14} /> },
              { label: instTypeText === 'School' ? t.statGroupsSchool : t.statGroupsUni, val: stats.groups || 0, style: 'border-l-indigo-500 text-indigo-600', icon: <CalendarDays size={14} /> },
              { label: t.statDrafts, val: allVersions.length, style: 'border-l-amber-500 text-amber-600', icon: <FolderTree size={14} /> },
              { label: instTypeText === 'School' ? t.statClassroomsSchool : t.statClassroomsUni, val: stats.classrooms || 0, style: 'border-l-teal-500 text-teal-600', icon: <Landmark size={14} /> },
            ].map((s, i) => (
              <div key={i} className={`bg-slate-50 border border-slate-200 border-l-4 ${s.style.split(' ')[0]} p-4 rounded-xl w-full lg:w-40 flex flex-col justify-between h-20 shadow-inner`}>
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <span className={s.style.split(' ')[1]}>{s.icon}</span> 
                  <span className="truncate">{s.label}</span>
                </p>
                <span className="text-2xl font-black tracking-tight text-slate-900">{s.val}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. LOWER OPERATIONAL REPOSITORIES: ARCHIVE OVERVIEW */}
      <div className="space-y-5 text-left w-full">
        <div className="space-y-4">
          <div className="flex items-center justify-between px-0.5">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <div className="w-1 h-5 bg-emerald-600 rounded-full shadow-sm"></div> 
              <span>{t.archiveTitle}</span>
            </h2>
          </div>
            
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {draftScheduleVersions.length === 0 ? (
              <div className="col-span-1 md:col-span-2 bg-white border border-slate-200 p-10 rounded-xl text-center text-xs text-slate-400 italic shadow-sm">
                {t.archiveEmpty}
              </div>
            ) : (
              draftScheduleVersions.map((version) => (
                <div 
                  key={version.id}
                  className="group bg-white border border-slate-200 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-emerald-500 transition-colors duration-150 shadow-sm"
                >
                  <div 
                    onClick={() => handleSelectVersionChange(version.id)}
                    className="flex items-center gap-3.5 min-w-0 cursor-pointer flex-1"
                  >
                    <div className="w-10 h-10 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-center text-slate-400 group-hover:text-emerald-600 group-hover:border-emerald-200 transition-colors shrink-0">
                      <ClipboardList size={18} />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-slate-900 font-bold text-sm tracking-tight group-hover:text-emerald-600 transition-colors truncate">{version.name}</h4>
                      <p className="text-[11px] text-slate-400 mt-0.5 font-medium flex items-center gap-2">
                        <span>{t.gridLabel} {version.daysPerWeek || 5} {t.days}</span>
                        <span>•</span>
                        <span className="bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 text-[9px] uppercase tracking-wide text-amber-700 font-mono font-bold">{t.badgeDraft}</span>
                      </p>
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => handleDeployToProduction(version.id)}
                    className="bg-slate-900 hover:bg-emerald-600 text-white font-bold text-[10px] uppercase tracking-wider px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1 shadow-sm"
                  >
                    <Sparkles size={11} /> {t.btnDeploy}
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MethodistDashboard;