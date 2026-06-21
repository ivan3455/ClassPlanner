import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { 
  Cpu, ArrowLeft, ArrowRight, Loader2, AlertCircle, CheckCircle, 
  Layers, School, Clock, Play, Calendar, UserCheck, Landmark
} from 'lucide-react';

const translations = {
  ua: {
    sectionValidation: 'Валідація вхідних даних',
    readyNotice: 'Усі необхідні сутності успішно зібрані та верифіковані.',
    blockNotice: 'Для запуску генерації кожен лічильник повинен мати значення більше 0. Поверніться на незаповнені кроки конструктора розкладу.',
    btnCalcRun: "Йде розрахунок зв'язку...",
    btnCalcSuccess: 'Розклад згенеровано!',
    btnCalcStart: 'Запустити оптимізацію',
    monitorTitle: 'Монітор стану ядра генерації',
    terminalWaiting: 'Очікування запуску обчислювального алгоритму...',
    btnBack: 'Назад до розподілу годин',
    btnOpenGrid: 'Відкрити готову сітку розкладу',
    logInit: 'Ініціалізація математичного ядра...',
    logAuth: 'Авторизація каналу ізоляції Tenant ID:',
    logBells: 'Завантаження часових доменів та конфігурацій дзвінків...',
    logHard: 'Парсинг матриці жорстких обмежень',
    logProfiles: 'Аналіз індивідуальних календарних профілів викладачів...',
    logAlgo: 'Запуск ітераційного алгоритму',
    logSuccess: '[Успіх]: Алгоритм завершено. Сформовано занять:',
    logComplete: '[Завершено]: Координаційна сітка розкладу успішно експортована в оперативну базу даних.',
    errEngine: 'Критична помилка під час виконання математичного алгоритму.',
    logFail: '[Критичний збій]: Ядро генерації зупинено з помилкою:',
    logAdvice: '[Рекомендація]: Перевірте кроки 4 та 6. Можливо, сумарна кількість годин у навчальних планах перевищує доступний фонд аудиторій або ліміти часу викладачів.',

    // Шкільні маркери
    schoolTitle: 'ШІ Оптимізатор розкладу',
    schoolDesc: 'Фінальний крок конфігурації. Наше обчислювальне ядро збалансує плани предметів, кабінети, класи та обмеження вчителів для створення ідеального розкладу без «вікон» та колізій.',
    schoolMetricTeachers: 'Педагогічний склад (Вчителі)',
    schoolMetricGroups: 'Контингент (Навчальні класи)',
    schoolMetricClassrooms: 'Приміщення (Кабінети класів)',
    schoolMetricTime: 'Часова сітка (Шкільні дзвінки)',
    schoolMetricCurriculum: 'Карти розподілу уроків (Години)',

    // Університетські маркери
    uniTitle: 'Генерація розкладу',
    uniDesc: '',
    uniMetricTeachers: 'Професорсько-викладацький склад',
    uniMetricGroups: 'Академічні групи (Контингент)',
    uniMetricClassrooms: 'Аудиторний фонд (Приміщення)',
    uniMetricTime: 'Часові інтервали (Пари)',
    uniMetricCurriculum: 'Картки навантажень дисциплін'
  },
  en: {
    sectionValidation: 'Input Staging Data Validation',
    readyNotice: 'All necessary operational entities have been successfully validated. The AI matrix is primed for calculation.',
    blockNotice: 'Launch blocked: Each parameter must maintain a value strictly greater than 0. Please return to incomplete steps.',
    btnCalcRun: 'Calculating active constraints...',
    btnCalcSuccess: 'Schedule Map Generated!',
    btnCalcStart: 'Execute AI Optimization Core',
    monitorTitle: 'AI Computational Core Live Monitor',
    terminalWaiting: 'Awaiting execution parameters activation pass for CSP algorithm...',
    btnBack: 'Back to Load Matrix',
    btnOpenGrid: 'Open Output Schedule Grid',
    logInit: 'Initializing CSP mathematical engine substrate...',
    logAuth: 'Authorizing tenant isolation layer workspace ID:',
    logBells: 'Loading discrete time domains and bell schedule definitions...',
    logHard: 'Parsing Hard Constraints penalty matrices...',
    logProfiles: 'Evaluating individual calendar constraints from faculty members...',
    logAlgo: 'Deploying deep iterative Backtracking algorithm pipeline...',
    logSuccess: '[Success]: Algorithmic run complete. Generated lesson placement blocks:',
    logComplete: '[Complete]: Coordination schedule matrix successfully committed to persistent DB records.',
    errEngine: 'Critical engine failure inside background mathematical thread execution parameters.',
    logFail: '[Critical Failure]: Generation core halted with error code:',
    logAdvice: '[Recommendation]: Please review Step 4 and Step 6. Summed curriculum hours may exceed auditorium volume or faculty availability thresholds.',

    // Шкільні маркери (EN)
    schoolTitle: 'AI Schedule Optimizer',
    schoolDesc: 'Final staging step. Our cloud optimization core balances curriculum hours, school classrooms, pupil classes, and teacher restrictions to forge an ideal schedule grid.',
    schoolMetricTeachers: 'Pedagogical Faculty Staff',
    schoolMetricGroups: 'Pupil Classes (Contingent)',
    schoolMetricClassrooms: 'Classroom Infrastructure Assets',
    schoolMetricTime: 'Time Slots Matrix (School Bells)',
    schoolMetricCurriculum: 'Lesson Distribution Hourly Maps',

    // Університетські маркери (EN)
    uniTitle: 'CSP Schedule Generation Core',
    uniDesc: 'Final execution pass of the mathematical AI generator. The module runs a exhaustive state-space search satisfying constraints across faculty departments, group courses, and halls.',
    uniMetricTeachers: 'Faculty & Lecturer Ledger Staff',
    uniMetricGroups: 'Academic Groups (Contingent Index)',
    uniMetricClassrooms: 'Auditorium Space Fund',
    uniMetricTime: 'Discrete Time Windows (Pairs)',
    uniMetricCurriculum: 'Discipline Load Specification Cards'
  }
};

const Step7 = () => {
  const lang = localStorage.getItem('lang') || 'ua';
  const t = translations[lang];

  const [readiness, setReadiness] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  
  const [generationLogs, setGenerationLogs] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const navigate = useNavigate();
  const versionId = localStorage.getItem('currentScheduleVersion');
  const user = useMemo(() => JSON.parse(localStorage.getItem('user')) || {}, []);
  const institutionType = user.Institution?.type || 'University';

  useEffect(() => {
    if (!versionId) {
      navigate('/setup/step1');
      return;
    }
    fetchReadinessMetrics();

    const handleLangChange = (e) => setLang(e.detail);
    window.addEventListener('appLangChanged', handleLangChange);
    return () => window.removeEventListener('appLangChanged', handleLangChange);
  }, [versionId]);

  const fetchReadinessMetrics = async () => {
    try {
      const res = await api.get(`/generator/check-readiness/${versionId}`);
      setReadiness(res.data || null);
    } catch (err) {
      console.error('Readiness system validation probe failure:', err.message);
      setError(t.errEngine);
    } finally {
      setLoading(false);
    }
  };

  const pushLog = (message) => {
    setGenerationLogs(prev => [...prev, message]);
  };

  const handleExecuteEngine = async () => {
    setGenerating(true);
    setError('');
    setSuccess(false);
    setGenerationLogs([]);

    const apiPromise = api.post(`/generator/run/${versionId}`);

    pushLog(`[System Intelligence]: ${t.logInit}`);
    await new Promise(r => setTimeout(r, 300));
    pushLog(`[System Intelligence]: ${t.logAuth} [${user.InstitutionId || 'Active_Sandbox'}].`);
    await new Promise(r => setTimeout(r, 300));
    pushLog(`[System Intelligence]: ${t.logBells}`);
    await new Promise(r => setTimeout(r, 400));
    pushLog(`[System Intelligence]: ${t.logHard}`);
    await new Promise(r => setTimeout(r, 300));
    pushLog(`[System Intelligence]: ${t.logProfiles}`);
    await new Promise(r => setTimeout(r, 300));
    pushLog(`[System Intelligence]: ${t.logAlgo}`);

    try {
      const res = await apiPromise;
      
      if (res.data?.success) {
        setGenerationLogs(prev => [
          ...prev, 
          `${t.logSuccess} ${res.data.placedLessons || 0}.`,
          `${t.logComplete}`
        ]);
        setSuccess(true);
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || t.errEngine;
      setError(errorMsg);
      setGenerationLogs(prev => [
        ...prev, 
        `${t.logFail} "${errorMsg}"`,
        `${t.logAdvice}`
      ]);
    } finally {
      setGenerating(false);
    }
  };

  const labels = useMemo(() => {
    if (institutionType === 'School') {
      return {
        title: t.schoolTitle,
        desc: t.schoolDesc,
        teacherMetric: t.schoolMetricTeachers,
        groupMetric: t.schoolMetricGroups,
        classroomMetric: t.schoolMetricClassrooms,
        timeMetric: t.schoolMetricTime,
        curriculumMetric: t.schoolMetricCurriculum
      };
    }
    return {
      title: t.uniTitle,
      desc: t.uniDesc,
      teacherMetric: t.uniMetricTeachers,
      groupMetric: t.uniMetricGroups,
      classroomMetric: t.uniMetricClassrooms,
      timeMetric: t.uniMetricTime,
      curriculumMetric: t.uniMetricCurriculum
    };
  }, [institutionType, t]);

  if (loading) return (
    <div className="flex justify-center p-20 w-full bg-white">
      <Loader2 className="animate-spin text-emerald-600" size={32} />
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-200 text-slate-700 select-none text-left w-full max-w-5xl mx-auto font-sans antialiased">
      
      <div>
        <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
          <Cpu className={`text-emerald-600 ${generating ? 'animate-spin' : ''}`} size={22} />
          <span>{labels.title}</span>
        </h2>
        <p className="text-slate-400 text-xs mt-1 leading-relaxed max-w-3xl">{labels.desc}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-8 items-start">
        
        {/* LEFT CARD: SYSTEM METRICS VERIFICATION */}
        <div className="md:col-span-2 bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4 shadow-sm">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-0.5">{t.sectionValidation}</h3>
          
          <div className="space-y-2">
            {[
              { label: labels.teacherMetric, val: readiness?.stats?.teachersCount || 0, icon: <UserCheck size={14} className="text-blue-600" /> },
              { label: labels.classroomMetric, val: readiness?.stats?.classroomsCount || 0, icon: <Landmark size={14} className="text-emerald-600" /> },
              { label: labels.timeMetric, val: readiness?.stats?.timeSlotsCount || 0, icon: <Clock size={14} className="text-indigo-600" /> },
              { label: labels.groupMetric, val: readiness?.stats?.groupsCount || 0, icon: <School size={14} className="text-cyan-600" /> },
              { label: labels.curriculumMetric, val: readiness?.stats?.curriculumCount || 0, icon: <Layers size={14} className="text-purple-600" /> },
            ].map((metric, i) => (
              <div key={i} className="bg-white border border-slate-200 p-2.5 rounded-lg flex items-center justify-between shadow-xs">
                <div className="flex items-center gap-2 truncate mr-2 text-xs font-semibold text-slate-500">
                  {metric.icon}
                  <span className="truncate">{metric.label}</span>
                </div>
                <span className={`text-xs font-bold px-2 py-0.5 rounded font-mono border ${metric.val > 0 ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-red-50 border-red-100 text-red-600'}`}>
                  {metric.val}
                </span>
              </div>
            ))}
          </div>

          {readiness?.isReady ? (
            <div className="p-3 bg-emerald-50/50 border border-emerald-100 rounded-xl flex items-start gap-2.5">
              <CheckCircle size={15} className="text-emerald-600 shrink-0 mt-0.5" />
              <p className="text-[11px] text-slate-500 leading-relaxed font-semibold">{t.readyNotice}</p>
            </div>
          ) : (
            <div className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-start gap-2.5">
              <AlertCircle size={15} className="text-red-600 shrink-0 mt-0.5" />
              <p className="text-[11px] text-slate-500 leading-relaxed font-semibold">
                <span className="text-red-600 font-bold">{lang === 'ua' ? 'Блокування:' : 'Blocked:'}</span> {t.blockNotice}
              </p>
            </div>
          )}

          <button
            type="button"
            disabled={!readiness?.isReady || generating || success}
            onClick={handleExecuteEngine}
            className={`w-full h-10 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-xs select-none uppercase tracking-wide
              ${success ? 'bg-emerald-600 text-white cursor-not-allowed' : ''}
              ${generating ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200' : ''}
              ${!generating && !success && readiness?.isReady ? 'bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer' : ''}
              ${!readiness?.isReady ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed' : ''}
            `}
          >
            {generating ? (
              <>
                <Loader2 className="animate-spin" size={13} />
                <span>{t.btnCalcRun}</span>
              </>
            ) : success ? (
              <>
                <CheckCircle size={13} />
                <span>{t.btnCalcSuccess}</span>
              </>
            ) : (
              <>
                <Play size={11} className="fill-current" />
                <span>{t.btnCalcStart}</span>
              </>
            )}
          </button>
        </div>

        {/* RIGHT CARD: CLEAN OPERATIONAL LOG MONITOR */}
        <div className="md:col-span-3 flex flex-col bg-slate-50 border border-slate-200 rounded-xl p-5 h-[360px] shadow-sm">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 pl-0.5 flex items-center gap-2">
            <span className={`w-1.5 h-1.5 rounded-full ${generating ? 'bg-amber-500 animate-pulse' : success ? 'bg-emerald-600' : 'bg-slate-300'}`}></span>
            <span>{t.monitorTitle}</span>
          </h3>

          {/* ВІКНО ЛОГІВ: Тепер у чистому, системному світлому стилі */}
          <div className="flex-1 bg-white border border-slate-200 rounded-xl p-4 font-mono text-[11px] text-slate-700 overflow-y-auto space-y-2 shadow-inner select-text">
            {generationLogs.length === 0 && !error && (
              <div className="text-slate-400 italic h-full flex items-center justify-center select-none text-xs">
                {t.terminalWaiting}
              </div>
            )}
            
            {generationLogs.map((log, idx) => {
              let textColor = 'text-slate-600';
              // Успішні фінали підсвічуємо фірмовим зеленим
              if (log.includes('[Успіх]') || log.includes('[Success]') || log.includes('[Завершено]') || log.includes('[Complete]')) {
                textColor = 'text-emerald-600 font-bold bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-md block';
              }
              // Процеси ядра підсвічуємо м'яким синім
              if (log.includes('[System Intelligence]')) {
                textColor = 'text-blue-600 font-semibold';
              }
              return (
                <div key={idx} className={`${textColor} leading-relaxed text-left`}>
                  {log}
                </div>
              );
            })}

            {error && (
              <div className="text-red-600 border border-red-200 bg-red-50 p-3 rounded-lg mt-2 font-sans font-semibold text-xs text-left flex items-start gap-1.5">
                <AlertCircle size={14} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* FOOTER CONTROLS */}
      <div className="flex justify-between items-center pt-5 border-t border-slate-100 mt-2">
        <button 
          type="button" disabled={generating} onClick={() => navigate('/setup/step6')} 
          className="flex items-center gap-1.5 text-slate-400 hover:text-slate-800 font-bold text-xs tracking-wide transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed" 
        >
          <ArrowLeft size={14} /> <span>{t.btnBack}</span>
        </button>
        
        {success && (
          <button 
            type="button" onClick={() => navigate('/my-schedule')} 
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-5 py-2.5 rounded-xl transition-all shadow-sm flex items-center gap-2 text-sm cursor-pointer animate-bounce" 
          >
            <Calendar size={14} />
            <span>{t.btnOpenGrid}</span>
            <ArrowRight size={14} />
          </button>
        )}
      </div>

    </div>
  );
};

export default Step7;