import { useState, useEffect, useMemo } from 'react';
import api from '../../api/axios';
import { 
  Users, UserPlus, Shield, Key, Mail, Edit3, 
  Loader2, AlertCircle, CheckCircle, UserCheck, School, Landmark 
} from 'lucide-react';

const translations = {
  ua: {
    title: 'Керування штатом та особистим профілем',
    subtitle: 'Оновлення власних даних, модифікація параметрів закладу та підключення додаткових координаторів',
    selfProfileTitle: 'Мій особистий профіль',
    selfProfileDesc: 'Редагування ваших особистих реєстраційних даних та пароля доступу',
    labelFullName: 'Повне ім’я (ПІБ)',
    labelEmail: 'Адреса електронної пошти',
    labelPassword: 'Новий пароль (залиште порожнім, щоб не змінювати)',
    placeholderPassword: 'Введіть новий безпечний пароль',
    btnSaveProfile: 'Зберегти зміни профілю',
    
    instTitle: 'Параметри навчального закладу',
    instDesc: 'Зміна фундаментальних метаданих вашої установи',
    labelInstName: 'Офіційна назва закладу',
    btnSaveInst: 'Оновити дані установи',

    teamTitle: 'Діючий штат методистів закладу',
    teamDesc: 'Координатори, що мають доступ до поточної бази даних',
    teamLimitLabel: 'Штат:',
    teamSuffix: 'чол.',
    selfBadge: 'Я',
    
    addTitle: 'Підключити нового колегу до штату',
    addPlhName: 'Повне ПІБ методиста',
    addPlhEmail: 'Електронна пошта (Логін)',
    addPlhPwd: 'Тимчасовий пароль для першого входу',
    btnOnboard: 'Активувати методиста',
    
    successProfile: 'Ваш профіль та параметри безпеки успішно оновлено.',
    successInst: 'Workspace метадані закладу успішно оновлено.',
    successOnboard: 'Нового методиста успішно додано до штату вашого закладу.',
    errProfile: 'Помилка оновлення даних профілю.',
    errInst: 'Помилка модифікації назви установи.',
    errOnboard: 'Помилка реєстрації нового співробітника.',
    loadingLabel: 'Завантаження кадрового реєстру...'
  },
  en: {
    title: 'Staff Management & Workspace Settings',
    subtitle: 'Update personal identity data, modify institution profile parameters, and onboard coordinators',
    selfProfileTitle: 'My Personal Profile',
    selfProfileDesc: 'Modify your core authentication profile credentials and password',
    labelFullName: 'Full Identity Name',
    labelEmail: 'Email Address / System Login',
    labelPassword: 'New Password (leave blank to keep current)',
    placeholderPassword: 'Enter new secure password',
    btnSaveProfile: 'Save Profile Changes',
    
    instTitle: 'Institution Settings',
    instDesc: 'Modify core structural brand identifiers of your institution',
    labelInstName: 'Official Institution Name',
    btnSaveInst: 'Update Workspace Metadata',

    teamTitle: 'Active Methodists Staff',
    teamDesc: 'Coordinators possessing active clearance to the persistent multi-version data scope',
    teamLimitLabel: 'Staff:',
    teamSuffix: 'pers.',
    selfBadge: 'Me',
    
    addTitle: 'Onboard New Assistant Methodist',
    addPlhName: 'Full Name of Coordinator',
    addPlhEmail: 'Email Address (System Login)',
    addPlhPwd: 'Temporary credential security key',
    btnOnboard: 'Activate Assistant',
    
    successProfile: 'Personal profile variables and security metrics updated successfully.',
    successInst: 'Institution brand metadata successfully committed.',
    successOnboard: 'Assistant coordinator successfully added to institution rosters.',
    errProfile: 'Failed to write profile mutation changes.',
    errInst: 'Failed to balance institution database cells.',
    errOnboard: 'Failed to complete assistant authentication initialization pass.',
    loadingLabel: 'Downloading personnel registry charts...'
  }
};

const StaffManagement = () => {
  const [lang, setLang] = useState(localStorage.getItem('lang') || 'ua');
  const t = translations[lang];

  const currentUser = JSON.parse(localStorage.getItem('user')) || {};
  
  // States для особистого профілю та закладу
  const [selfName, setSelfName] = useState(currentUser.fullName || '');
  const [selfEmail, setSelfEmail] = useState(currentUser.email || '');
  const [selfPassword, setSelfPassword] = useState(''); // Додано для безпечної зміни пароля

  const [instName, setInstName] = useState('');

  // Team states
  const [team, setTeam] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // New coordinator sub-form state
  const [newMethodistName, setNewMethodistName] = useState('');
  const [newMethodistEmail, setNewMethodistEmail] = useState('');
  const [newMethodistPassword, setNewMethodistPassword] = useState('');

  useEffect(() => {
    fetchTeamData();

    const handleLangChange = (e) => {
      setLang(e.detail);
    };
    window.addEventListener('appLangChanged', handleLangChange);
    return () => window.removeEventListener('appLangChanged', handleLangChange);
  }, []);

  const fetchTeamData = async () => {
    try {
      const res = await api.get('/methodist/team');
      setTeam(res.data || []);
      
      const statsRes = await api.get('/methodist/dashboard-stats');
      setInstName(statsRes.data?.institutionName || '');
    } catch (err) {
      console.error('Error fetching team context:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSelfProfile = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setError(''); 
    setSuccess('');
    
    try {
      const payload = {
        fullName: selfName.trim(),
        email: selfEmail.trim().toLowerCase(),
        isActive: true
      };

      // Якщо користувач ввів щось у поле пароля — додаємо його до запиту
      if (selfPassword.trim() !== '') {
        payload.password = selfPassword;
      }

      await api.put(`/superadmin/methodists/${currentUser.id}`, payload);

      const updatedUser = { ...currentUser, fullName: selfName.trim(), email: selfEmail.trim().toLowerCase() };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      setSuccess(t.successProfile);
      setSelfPassword(''); // Очищуємо поле після успішного збереження
      await fetchTeamData();
    } catch (err) {
      setError(err.response?.data?.message || t.errProfile);
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateInstitution = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setError(''); 
    setSuccess('');
    try {
      await api.put('/methodist/profile-setup', {
        fullName: selfName.trim(),
        institutionName: instName.trim()
      });
      setSuccess(t.successInst);
      await fetchTeamData();
    } catch (err) {
      setError(err.response?.data?.message || t.errInst);
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddCoordinator = async (e) => {
    e.preventDefault();
    if (team.length >= 10) {
      alert('Threshold reached: Ліміт закладу вичерпано (макс. 10 методистів).');
      return;
    }
    setActionLoading(true);
    setError(''); 
    setSuccess('');
    try {
      await api.post('/methodist/team/add', {
        fullName: newMethodistName.trim(),
        email: newMethodistEmail.trim().toLowerCase(),
        password: newMethodistPassword
      });

      setSuccess(t.successOnboard);
      setNewMethodistName('');
      setNewMethodistEmail('');
      setNewMethodistPassword('');
      await fetchTeamData();
    } catch (err) {
      setError(err.response?.data?.message || t.errOnboard);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center bg-slate-50 antialiased font-sans">
      <Loader2 className="text-emerald-600 animate-spin w-8 h-8 mb-2" />
      <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">{t.loadingLabel}</p>
    </div>
  );

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-150 select-none text-left w-full text-slate-700 antialiased font-sans p-1">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
          <Users className="text-emerald-600" size={24} /> <span>{t.title}</span>
        </h1>
        <p className="text-slate-500 text-xs mt-1 leading-relaxed max-w-3xl">{t.subtitle}</p>
      </div>

      {/* ALERT CHANNEL BLOCK */}
      {(error || success) && (
        <div className={`p-3.5 border text-xs font-semibold rounded-xl flex items-center gap-2 animate-in slide-in-from-top-2 ${error ? 'bg-red-50 border-red-200 text-red-600' : 'bg-emerald-50 border-emerald-200 text-emerald-700'}`}>
          {error ? <AlertCircle size={15} className="shrink-0" /> : <CheckCircle size={15} className="shrink-0" />}
          <p>{error || success}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 sm:gap-8 items-start">
        
        {/* LEFT COMPONENT: EDIT SELF & INSTITUTION SETTINGS */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Блок 1: Особистий Профіль */}
          <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm space-y-4">
            <div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Shield size={14} className="text-emerald-600" /> {t.selfProfileTitle}
              </h3>
              <p className="text-[10px] text-slate-400 font-medium mt-0.5">{t.selfProfileDesc}</p>
            </div>

            <form onSubmit={handleUpdateSelfProfile} className="space-y-3.5">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1 block pl-0.5">{t.labelFullName}</label>
                <input 
                  type="text" required disabled={actionLoading}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 outline-none focus:border-emerald-500 focus:bg-white transition-colors font-medium"
                  value={selfName} onChange={(e) => setSelfName(e.target.value)}
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1 block pl-0.5">{t.labelEmail}</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3.5 text-slate-300" size={14} />
                  <input 
                    type="email" required disabled={actionLoading}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-8 pr-3 text-xs text-slate-900 font-mono outline-none focus:border-emerald-500 focus:bg-white transition-colors font-medium"
                    value={selfEmail} onChange={(e) => setSelfEmail(e.target.value)}
                  />
                </div>
              </div>

              {/* НОВЕ ПОЛЕ: ЗМІНА ПАРОЛЯ МЕТОДИСТА */}
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1 block pl-0.5">{t.labelPassword}</label>
                <div className="relative">
                  <Key className="absolute left-3 top-3.5 text-slate-300" size={14} />
                  <input 
                    type="password" disabled={actionLoading} placeholder={t.placeholderPassword}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-8 pr-3 text-xs text-slate-900 font-mono outline-none focus:border-emerald-500 focus:bg-white transition-colors font-medium placeholder:text-slate-300"
                    value={selfPassword} onChange={(e) => setSelfPassword(e.target.value)}
                  />
                </div>
              </div>

              <button 
                type="submit" disabled={actionLoading}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2  text-xs rounded-xl transition-colors cursor-pointer shadow-sm flex items-center justify-center gap-1.5 uppercase tracking-wide"
              >
                {actionLoading ? <Loader2 size={13} className="animate-spin" /> : <UserCheck size={13} />}
                <span>{t.btnSaveProfile}</span>
              </button>
            </form>
          </div>

          {/* Блок 2: Налаштування Навчального Закладу */}
          <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm space-y-4">
            <div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Landmark size={14} className="text-emerald-600" /> {t.instTitle}
              </h3>
              <p className="text-[10px] text-slate-400 font-medium mt-0.5">{t.instDesc}</p>
            </div>

            <form onSubmit={handleUpdateInstitution} className="space-y-3.5">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1 block pl-0.5">{t.labelInstName}</label>
                <input 
                  type="text" required disabled={actionLoading}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 outline-none focus:border-emerald-500 focus:bg-white transition-colors font-medium"
                  value={instName} onChange={(e) => setInstName(e.target.value)}
                />
              </div>

              <button 
                type="submit" disabled={actionLoading}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2 text-xs rounded-xl transition-colors cursor-pointer shadow-sm flex items-center justify-center gap-1.5 uppercase tracking-wide"
              >
                {actionLoading ? <Loader2 size={13} className="animate-spin" /> : <School size={13} />}
                <span>{t.btnSaveInst}</span>
              </button>
            </form>
          </div>

        </div>

        {/* RIGHT COMPONENT: TEAM ROSTER MANAGEMENT */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* ROSTER MONITOR PANEL */}
          <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
              <div>
                <h3 className="text-sm font-black text-slate-900 tracking-tight uppercase">{t.teamTitle}</h3>
                <p className="text-[10px] text-slate-400 font-medium mt-0.5">{t.teamDesc}</p>
              </div>
              <span className="bg-slate-50 border border-slate-200 text-slate-500 text-[10px] font-mono font-bold px-2.5 py-1 rounded-xl self-start sm:self-center">
                {t.teamLimitLabel} {team.length} / 10 {t.teamSuffix}
              </span>
            </div>

            <div className="space-y-2 max-h-52 overflow-y-auto pr-1 scrollbar-none content-start grid grid-cols-1 sm:grid-cols-2 gap-2">
              {team.map(m => {
                const isMe = m.id === currentUser.id;
                return (
                  <div key={m.id} className={`p-3 rounded-xl border flex items-center justify-between gap-2 shadow-xs transition-colors ${isMe ? 'bg-emerald-50/40 border-emerald-200' : 'bg-white border-slate-200 hover:border-slate-300'}`}>
                    <div className="truncate text-left">
                      <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5 truncate">
                        <span className="truncate">{m.fullName}</span>
                        {isMe && <span className="bg-emerald-600 text-white text-[9px] px-1 rounded font-mono font-black">{t.selfBadge}</span>}
                      </h4>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5 truncate">{m.email}</p>
                    </div>
                    <span className={`text-[9px] font-black px-1.5 py-0.5 rounded border font-mono uppercase shrink-0 ${m.isActive ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-red-50 border-red-100 text-red-600'}`}>
                      {m.isActive ? 'Active' : 'Muted'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ADD NEW COORDINATOR BLOCK */}
          {team.length < 10 && (
            <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm space-y-4">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <UserPlus size={14} className="text-emerald-600" /> {t.addTitle}
              </h3>
              
              <form onSubmit={handleAddCoordinator} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1 block pl-0.5">{t.addPlhName}</label>
                    <input 
                      type="text" required placeholder="e.g., Kovalenko O. M." disabled={actionLoading}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 outline-none focus:border-emerald-500 focus:bg-white font-medium"
                      value={newMethodistName} onChange={(e) => setNewMethodistName(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1 block pl-0.5">{t.addPlhEmail}</label>
                    <input 
                      type="email" required placeholder="assistant@edu.ua" disabled={actionLoading}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 font-mono outline-none focus:border-emerald-500 focus:bg-white font-medium"
                      value={newMethodistEmail} onChange={(e) => setNewMethodistEmail(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1 block pl-0.5">{t.addPlhUserPwd || t.addPlhResultPwd || t.addPlhPwd}</label>
                  <div className="relative flex flex-col sm:flex-row gap-3 items-center">
                    <div className="relative w-full">
                      <Key className="absolute left-3 top-3 text-slate-300" size={14} />
                      <input 
                        type="password" required placeholder="Password777" disabled={actionLoading}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-8 pr-3 text-xs text-slate-900 font-mono outline-none focus:border-emerald-500 focus:bg-white font-medium"
                        value={newMethodistPassword} onChange={(e) => setNewMethodistPassword(e.target.value)}
                      />
                    </div>
                    <button 
                      type="submit" disabled={actionLoading}
                      className="w-full sm:w-48 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 shrink-0 transition-colors cursor-pointer shadow-sm uppercase tracking-wide"
                    >
                      {actionLoading ? <Loader2 size={13} className="animate-spin" /> : <UserPlus size={13} />}
                      <span>{t.btnOnboard}</span>
                    </button>
                  </div>
                </div>
              </form>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default StaffManagement;