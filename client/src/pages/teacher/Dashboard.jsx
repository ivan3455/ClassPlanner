import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { 
  Calendar, Clock, AlertCircle, CheckCircle, Loader2, Send, 
  Plus, ClipboardList, FileText, User
} from 'lucide-react';

const daysTranslation = {
  'Monday': 'Понеділок', 'Tuesday': 'Вівторок', 'Wednesday': 'Середа',
  'Thursday': 'Четвер', 'Friday': 'П’ятниця', 'Saturday': 'Субота', 'Sunday': 'Неділя'
};

const Dashboard = () => {
  const navigate = useNavigate();
  
  // Безпечний парсинг сесії користувача
  const user = useMemo(() => {
    try {
      const raw = localStorage.getItem('user') || sessionStorage.getItem('user');
      const parsed = raw ? JSON.parse(raw) : {};
      parsed.resolvedId = parsed.id || parsed.ID || parsed.id || '';
      return parsed;
    } catch {
      return { resolvedId: '' };
    }
  }, []);

  const currentVersionId = localStorage.getItem('currentScheduleVersion') || '';

  // Глобальні стани
  const [activeTab, setActiveTab] = useState('constraints'); 
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Дані з бекенду
  const [constraints, setConstraints] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [teachers, setTeachers] = useState([]); 

  // Форма створення обмежень (Адаптовано під очікування контролера timeSlot = "HH:MM - HH:MM")
  const [newConstraint, setNewConstraint] = useState({
    dayOfWeek: 'Monday',
    startTime: '08:30',
    endTime: '10:00'
  });

  // Форма створення нового запиту
  const [requestType, setRequestType] = useState('DayOff');
  const [dayOffDate, setDayOffDate] = useState('');
  const [dayOffReason, setDayOffReason] = useState('');
  
  const [substituteTeacherId, setSubstituteTeacherId] = useState('');
  const [subNotes, setSubNotes] = useState('');
  
  const [rescheduleDay, setRescheduleDay] = useState('Monday');
  const [rescheduleSlot, setRescheduleSlot] = useState('');
  const [rescheduleNotes, setRescheduleNotes] = useState('');

  useEffect(() => {
    if (user.resolvedId && currentVersionId) {
      fetchDashboardData();
    }
  }, [activeTab, user.resolvedId, currentVersionId]);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError('');
    try {
      if (activeTab === 'constraints') {
        // ФІКС 400 ERROR: Передаємо ОДНОЧАСНО і teacherId, і обов'язковий versionId
        const res = await api.get(`/teacher-constraints?teacherId=${user.resolvedId}&versionId=${currentVersionId}`);
        setConstraints(res.data || []);
      } else {
        const reqRes = await api.get('/teachers/leave-requests/my');
        setMyRequests(reqRes.data || []);
        
        const teachersRes = await api.get('/public/teachers?versionId=' + currentVersionId).catch(() => ({ data: [] }));
        setTeachers(teachersRes.data?.filter(t => t.id !== user.resolvedId) || []);
      }
    } catch (err) {
      console.error('Teacher dashboard hydration error:', err);
      setError('Не вдалося завантажити дані контурів. Можливо, відсутня активна версія розкладу.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddConstraint = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setError('');
    setSuccess('');
    try {
      // Склеюємо години у формат "HH:MM - HH:MM", який очікує ваш контролер у полі timeSlot
      const formattedSlot = `${newConstraint.startTime.trim()} - ${newConstraint.endTime.trim()}`;
      
      const preparedNewConstraint = {
        dayOfWeek: newConstraint.dayOfWeek,
        timeSlot: formattedSlot,
        reason: 'Особисті обмеження викладача'
      };

      // Мапимо існуючі записи (приводимо до спільного формату для відправки bulk-масиву)
      const mappedExisting = constraints.map(c => ({
        dayOfWeek: c.dayOfWeek,
        timeSlot: c.timeSlot || `${c.startTime} - ${c.endTime}`,
        reason: c.reason || 'Особисті обмеження викладача'
      }));

      const updatedConstraints = [...mappedExisting, preparedNewConstraint];
      
      // Надсилаємо дані за структурою req.body контролера: TeacherId, versionId, constraints
      await api.post('/teacher-constraints', { 
        TeacherId: user.resolvedId, 
        versionId: currentVersionId,
        constraints: updatedConstraints 
      });
      
      setSuccess('Вікно недоступності успішно додано.');
      fetchDashboardData();
    } catch (err) {
      setError(err.response?.data?.message || 'Помилка валідації часових меж на бекенді.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteConstraint = async (indexToDelete) => {
    if (!window.confirm('Видалити це обмеження з вашого профілю?')) return;
    setActionLoading(true);
    try {
      const mappedExisting = constraints.map(c => ({
        dayOfWeek: c.dayOfWeek,
        timeSlot: c.timeSlot || `${c.startTime} - ${c.endTime}`,
        reason: c.reason || 'Особисті обмеження викладача'
      }));

      const updatedConstraints = mappedExisting.filter((_, idx) => idx !== indexToDelete);
      
      await api.post('/teacher-constraints', { 
        TeacherId: user.resolvedId, 
        versionId: currentVersionId,
        constraints: updatedConstraints 
      });
      setSuccess('Обмеження успішно вилучено.');
      fetchDashboardData();
    } catch (err) {
      setError('Не вдалося оновити карту обмежень.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSendTeacherRequest = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setError('');
    setSuccess('');

    let details = {};
    if (requestType === 'DayOff') {
      if (!dayOffDate || !dayOffReason) {
        setError('Будь ласка, вкажіть дату відсутності та причину.');
        setActionLoading(false);
        return;
      }
      details = { date: dayOffDate, reason: dayOffReason };
    } else if (requestType === 'Substitution') {
      details = { substituteTeacherId, notes: subNotes };
    } else if (requestType === 'Reschedule') {
      details = { desiredDay: rescheduleDay, desiredSlot: rescheduleSlot, notes: rescheduleNotes };
    }

    try {
      await api.post('/teachers/leave-requests', {
        requestType,
        details
      });
      setSuccess('Запит успішно надіслано методисту на розгляд.');
      setDayOffDate(''); setDayOffReason(''); setSubstituteTeacherId(''); setSubNotes(''); setRescheduleSlot(''); setRescheduleNotes('');
      fetchDashboardData();
    } catch (err) {
      setError(err.response?.data?.message || 'Помилка надсилання клопотання.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6 text-left text-slate-700 font-sans antialiased box-border w-full p-2">
      
      {/* 1. TOP INFO HERO PANEL */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-md font-bold uppercase tracking-wider font-mono">
            Авторизований Профіль: Викладач
          </span>
          <h1 className="text-xl font-black text-slate-900 tracking-tight mt-1.5 flex items-center gap-2">
            <User className="text-emerald-600" size={20} /> {user.fullName}
          </h1>
          <p className="text-slate-400 text-xs mt-0.5">{user.email}</p>
        </div>

        <button
          type="button"
          onClick={() => navigate('/my-schedule')}
          className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-xs flex items-center gap-2 cursor-pointer w-full sm:w-auto justify-center"
        >
          <Calendar size={14} /> <span>Мій розклад занять</span>
        </button>
      </div>

      {/* STATUS CHANNELS */}
      {(error || success) && (
        <div className={`p-3.5 border text-xs font-semibold rounded-xl flex items-center gap-2 ${error ? 'bg-red-50 border-red-200 text-red-600' : 'bg-emerald-50 border-emerald-200 text-emerald-700'}`}>
          {error ? <AlertCircle size={15} className="shrink-0" /> : <CheckCircle size={15} className="shrink-0" />}
          <p>{error || success}</p>
        </div>
      )}

      {/* NAVIGATION TABS SECTION */}
      <div className="flex border-b border-slate-200 gap-2">
        <button
          onClick={() => setActiveTab('constraints')}
          className={`pb-2.5 px-4 font-black text-xs uppercase tracking-wider border-b-2 transition-all cursor-pointer ${activeTab === 'constraints' ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
        >
          Обмеження та вікна часу
        </button>
        <button
          onClick={() => setActiveTab('requests')}
          className={`pb-2.5 px-4 font-black text-xs uppercase tracking-wider border-b-2 transition-all cursor-pointer ${activeTab === 'requests' ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
        >
          Запити (Лікарняні / Заміни)
        </button>
      </div>

      {/* 2. DYNAMIC WORKSPACE CONTROLLER */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-400">
          <Loader2 className="animate-spin text-emerald-600 mb-2" size={24} />
          <span className="text-[10px] uppercase font-bold tracking-widest">Зчитування параметрів...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 sm:gap-8 items-start">
          
          {/* TAB CONTENT A: CONSTRAINTS WORKFLOW */}
          {activeTab === 'constraints' && (
            <>
              <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm lg:col-span-2 space-y-4">
                <div>
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-1.5">
                    <Clock size={14} className="text-emerald-600" /> Зафіксувати вікно зайнятості
                  </h3>
                  <p className="text-[10px] text-slate-400 font-medium mt-0.5">Вкажіть час, коли ви фізично не можете проводити заняття.</p>
                </div>

                <form onSubmit={handleAddConstraint} className="space-y-4">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase block mb-1.5">День тижня</label>
                    <select
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 outline-none focus:bg-white font-medium cursor-pointer"
                      value={newConstraint.dayOfWeek}
                      onChange={(e) => setNewConstraint({ ...newConstraint, dayOfWeek: e.target.value })}
                    >
                      {Object.keys(daysTranslation).map(d => <option key={d} value={d}>{daysTranslation[d]}</option>)}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase block mb-1.5">Початок (HH:MM)</label>
                      <input
                        type="text" required placeholder="08:30" disabled={actionLoading}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 outline-none focus:border-emerald-500 focus:bg-white transition-colors font-mono font-bold"
                        value={newConstraint.startTime}
                        onChange={(e) => setNewConstraint({ ...newConstraint, startTime: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase block mb-1.5">Кінець (HH:MM)</label>
                      <input
                        type="text" required placeholder="10:00" disabled={actionLoading}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 outline-none focus:border-emerald-500 focus:bg-white transition-colors font-mono font-bold"
                        value={newConstraint.endTime}
                        onChange={(e) => setNewConstraint({ ...newConstraint, endTime: e.target.value })}
                      />
                    </div>
                  </div>

                  <button
                    type="submit" disabled={actionLoading}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 uppercase tracking-wide cursor-pointer shadow-xs"
                  >
                    {actionLoading ? <Loader2 size={13} className="animate-spin" /> : <Plus size={14} />}
                    <span>Додати до профілю</span>
                  </button>
                </form>
              </div>

              <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm lg:col-span-3 space-y-3">
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-1.5 pb-2 border-b border-slate-100">
                  <ClipboardList size={14} className="text-emerald-600" /> Ваші заблоковані часові інтервали
                </h3>

                {constraints.length === 0 ? (
                  <p className="text-slate-400 italic text-xs py-8 text-center">Ви не зафіксували жодного обмеження. Графік повністю вільний.</p>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {constraints.map((c, index) => (
                      <div key={index} className="py-3 flex justify-between items-center group font-medium text-xs">
                        <div>
                          <span className="font-bold text-slate-900">{daysTranslation[c.dayOfWeek] || c.dayOfWeek}</span>
                          <span className="ml-3 bg-slate-100 px-2 py-0.5 rounded-md font-mono font-bold text-slate-500">
                            {c.timeSlot || `${c.startTime} - ${c.endTime}`}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteConstraint(index)}
                          className="text-slate-400 hover:text-red-600 p-1 rounded-md hover:bg-red-50 transition-colors cursor-pointer"
                        >
                          Вилучити
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {/* TAB CONTENT B: REQUESTS */}
          {activeTab === 'requests' && (
            <>
              <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm lg:col-span-2 space-y-4">
                <div>
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-1.5">
                    <Send size={14} className="text-emerald-600" /> Подати нову заяву
                  </h3>
                  <p className="text-[10px] text-slate-400 font-medium mt-0.5">Оберіть категорію закладу для автоматичної передачі методисту.</p>
                </div>

                <form onSubmit={handleSendTeacherRequest} className="space-y-4">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase block mb-1.5">Тип звернення</label>
                    <select
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 outline-none focus:bg-white font-bold cursor-pointer"
                      value={requestType}
                      onChange={(e) => setRequestType(e.target.value)}
                    >
                      <option value="DayOff">Лікарняний / Відгул (DayOff)</option>
                      <option value="Substitution">Запит на заміну колегою (Substitution)</option>
                      <option value="Reschedule">Пропозиція переносу заняття (Reschedule)</option>
                    </select>
                  </div>

                  {requestType === 'DayOff' && (
                    <div className="space-y-3.5 animate-in fade-in duration-100">
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase block mb-1">Цільова дата відсутності</label>
                        <input
                          type="date" required className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs text-slate-900 font-medium outline-none"
                          value={dayOffDate} onChange={(e) => setDayOffDate(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase block mb-1">Причина або медичне обґрунтування</label>
                        <textarea
                          placeholder="За станом здоров'я (лікарняний ліст)..." required rows={2}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 font-medium outline-none focus:bg-white"
                          value={dayOffReason} onChange={(e) => setDayOffReason(e.target.value)}
                        />
                      </div>
                    </div>
                  )}

                  {requestType === 'Substitution' && (
                    <div className="space-y-3.5 animate-in fade-in duration-100">
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase block mb-1">Рекомендований колега для заміни</label>
                        <select
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 outline-none font-medium cursor-pointer"
                          value={substituteTeacherId} onChange={(e) => setSubstituteTeacherId(e.target.value)}
                          required
                        >
                          <option value="">— Оберіть викладача з кадрового складу —</option>
                          {teachers.map(t => <option key={t.id} value={t.id}>{t.fullName}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase block mb-1">Яку пару замінити / Примітка</label>
                        <input
                          type="text" placeholder="Пара №3 Алгебра у гр. КН-301" required
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 font-medium outline-none"
                          value={subNotes} onChange={(e) => setSubNotes(e.target.value)}
                        />
                      </div>
                    </div>
                  )}

                  {requestType === 'Reschedule' && (
                    <div className="space-y-3.5 animate-in fade-in duration-100">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[10px] font-black text-slate-400 uppercase block mb-1">Бажаний день</label>
                          <select
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs text-slate-800 outline-none font-medium"
                            value={rescheduleDay} onChange={(e) => setRescheduleDay(e.target.value)}
                          >
                            {Object.keys(daysTranslation).map(d => <option key={d} value={d}>{daysTranslation[d]}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] font-black text-slate-400 uppercase block mb-1">Бажаний № слоту</label>
                          <input
                            type="number" placeholder="Напр. 3" required
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs text-slate-900 font-medium outline-none"
                            value={rescheduleSlot} onChange={(e) => setRescheduleSlot(e.target.value)}
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase block mb-1">Яку дисципліну переносимо</label>
                        <input
                          type="text" placeholder="Перенести лекцію з Понеділка 1 слоту..." required
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 font-medium outline-none"
                          value={rescheduleNotes} onChange={(e) => setRescheduleNotes(e.target.value)}
                        />
                      </div>
                    </div>
                  )}

                  <button
                    type="submit" disabled={actionLoading}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 uppercase tracking-wide cursor-pointer shadow-xs"
                  >
                    {actionLoading ? <Loader2 size={13} className="animate-spin" /> : <Send size={12} />}
                    <span>Подати клопотання</span>
                  </button>
                </form>
              </div>

              <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm lg:col-span-3 space-y-3">
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-1.5 pb-2 border-b border-slate-100">
                  <FileText size={14} className="text-emerald-600" /> Реєстр ваших звернень та рішень
                </h3>

                {myRequests.length === 0 ? (
                  <p className="text-slate-400 italic text-xs py-8 text-center">Історія звернень порожня. Ви не надсилали замовлень.</p>
                ) : (
                  <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                    {myRequests.map((req) => (
                      <div key={req.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs font-medium text-left">
                        <div className="flex justify-between items-center">
                          <span className="font-black text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200 uppercase text-[10px] tracking-wide">
                            {req.requestType === 'DayOff' ? '💊 Лікарняний / Відгул' : req.requestType === 'Substitution' ? '👥 Заміна' : '🔄 Перенос'}
                          </span>
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase ${
                            req.status === 'Approved' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                            req.status === 'Rejected' ? 'bg-red-50 text-red-600 border border-red-200' :
                            'bg-amber-50 text-amber-700 border border-amber-200 animate-pulse'
                          }`}>
                            {req.status === 'Approved' ? 'Схвалено ✓' : req.status === 'Rejected' ? 'Відхилено ✗' : 'Очікує'}
                          </span>
                        </div>

                        <div className="text-slate-600 text-[11px] leading-relaxed bg-white border border-slate-100 p-2 rounded-lg">
                          {req.requestType === 'DayOff' && (
                            <p><strong>Дата відсутності:</strong> {req.details?.date} <br/> <strong>Причина:</strong> {req.details?.reason}</p>
                          )}
                          {req.requestType === 'Substitution' && (
                            <p><strong>Контекст заміни:</strong> {req.details?.notes}</p>
                          )}
                          {req.requestType === 'Reschedule' && (
                            <p><strong>Бажане перенесення на:</strong> {daysTranslation[req.details?.desiredDay]} (слот №{req.details?.desiredSlot}) <br/> <strong>Деталі:</strong> {req.details?.notes}</p>
                          )}
                        </div>

                        {req.commentFromMethodist && (
                          <div className="text-[11px] bg-amber-50/50 border border-amber-100 p-2 rounded-lg text-amber-900">
                            <strong>Рішення методиста:</strong> {req.commentFromMethodist}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

        </div>
      )}
    </div>
  );
};

export default Dashboard;