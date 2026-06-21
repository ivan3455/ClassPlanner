import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { 
  Plus, Trash2, ArrowRight, ArrowLeft, Loader2, 
  AlertCircle, CheckCircle, GraduationCap, Mail, 
  ToggleLeft, ToggleRight, Sliders, User, Languages
} from 'lucide-react';

const translations = {
  ua: {
    titleEdit: 'Редагування профілю',
    labelName: 'Повне ПІБ викладача',
    labelEmail: 'Email (Вхід до системи)',
    labelPwdNew: 'Новий пароль (опціонально)',
    labelPwdTemp: 'Тимчасовий пароль',
    placeholderPwd: 'Пароль доступу',
    sectionOpt: 'Параметри оптимізації завантаження',
    optCompact: 'Компактно',
    optNoWindows: 'Без вікон ✓',
    btnCancel: 'Скасувати',
    btnSave: 'Зберегти зміни',
    btnRegister: 'Зареєструвати співробітника',
    btnBack: 'Назад до розкладу дзвінків',
    btnNext: 'Продовжити до класів та груп',
    pwdRequired: 'Пароль є обов’язковим для реєстрації нового користувача.',
    successUpdate: 'Облікову картку викладача успішно оновлено.',
    successReg: 'Нового співробітника успішно внесено до кадрового реєстру.',
    successDelete: 'Акаунт повністю вилучено з системи.',
    errSync: 'Помилка синхронізації бази кадрів.',
    errDelete: 'Критична помилка каскадного видалення.',
    confirmDelete: 'Ви дійсно бажаєте безповоротно видалити викладача "{name}"? Усі пов\'язані доручення та обмеження будуть каскадно вилучені.',
    generalDep: 'Загальна кафедра',
    limitLabel: 'ліміт',
    lessonsSuffix: 'зан/дн',
    max2: 'Не більше 2 занять',
    max3: 'Не більше 3 занять',
    max4: 'Не більше 4 занять',
    max5: 'Не більше 5 занять',
    max6: 'Не більше 6 занять',

    // Шкільні маркери
    schoolTitle: 'Кадровий склад та Обмеження',
    schoolDesc: 'Внесіть ПІБ вчителів школи, прив’яжіть їх до методичних об’єднань та вкажіть максимальне навантаження уроків на день для захисту від перевтоми.',
    schoolDep: 'Методичне об’єднання (Предметна кафедра)',
    schoolDepPlh: 'напр. Кафедра точних наук, Вчителі англійської мови',
    schoolMax: 'Максимум уроків на день',
    schoolWindow: 'Уникати «вікон» у розкладі вчителя',
    schoolWindowDesc: 'ШІ намагатиметься ставити уроки підряд без порожніх годин посеред дня.',
    schoolListTitle: 'Діючий педагогічний штат закладу',
    schoolEmpty: 'Реєстр викладацького складу порожній.',

    // Університетські маркери
    uniTitle: 'Реєстр викладачів та Обмежень',
    uniDesc: 'Зареєструйте професорсько-викладацький склад. Максимальна кількість пар на день та параметри вікон є найважливішими м’якими обмеженнями (Soft Constraints) для оптимізатора.',
    uniDep: 'Академічна кафедра факультету',
    uniDepPlh: 'напр. Кафедра комп’ютерних наук, Кафедра вищої математики',
    uniMax: 'Максимум пар на день',
    uniWindow: 'Мінімізувати вікна між парами лектора',
    uniWindowDesc: 'Алгоритм CSP групуватиме заняття викладача для оптимізації його робочих годин.',
    uniListTitle: 'Зареєстрований професорсько-викладацький склад',
    uniEmpty: 'Список викладачів закладу порожній.'
  },
  en: {
    titleEdit: 'Edit Profile Card',
    labelName: 'Full Name of Faculty Member',
    labelEmail: 'Email Address (System Login)',
    labelPwdNew: 'New Password (Optional)',
    labelPwdTemp: 'Temporary Password',
    placeholderPwd: 'Access credential security key',
    sectionOpt: 'Load Optimization Parameters',
    optCompact: 'Compact',
    optNoWindows: 'No Windows ✓',
    btnCancel: 'Cancel',
    btnSave: 'Save Profile Changes',
    btnRegister: 'Register Faculty Member',
    btnBack: 'Back to Bell Schedule',
    btnNext: 'Continue to Classes & Groups',
    pwdRequired: 'Password validation failed: security key field is mandatory.',
    successUpdate: 'Faculty member profile account successfully refreshed.',
    successReg: 'New employee successfully added to corporate rosters.',
    successDelete: 'Account completely wiped from database schema context.',
    errSync: 'Failed to balance personnel database tables.',
    errDelete: 'Critical cascade interruption error during drop execution pass.',
    confirmDelete: 'Are you sure you want to permanently delete faculty member "{name}"? All assigned load rows will be dropped.',
    generalDep: 'General Department',
    limitLabel: 'limit',
    lessonsSuffix: 'per day',
    max2: 'Max 2 classes per day',
    max3: 'Max 3 classes per day',
    max4: 'Max 4 classes per day',
    max5: 'Max 5 classes per day',
    max6: 'Max 6 classes per day',

    // Шкільні маркери (EN)
    schoolTitle: 'Teaching Staff & Constraints',
    schoolDesc: 'Register school teachers, attach them to custom subject committees, and lock down maximum lesson loads to prevent professional overfatigue.',
    schoolDep: 'Subject Committee (Methodic Division)',
    schoolDepPlh: 'e.g., Mathematics Committee, English Teachers Guild',
    schoolMax: 'Max lessons per day',
    schoolWindow: 'Avoid gaps in teacher time-windows',
    schoolWindowDesc: 'The AI will schedule school classes sequentially without trailing break hours during midday.',
    schoolListTitle: 'Active School Pedagogical Roster',
    schoolEmpty: 'Teacher registration ledger is empty.',

    // Університетські маркери (EN)
    uniTitle: 'Faculty Registry & Soft Constraints',
    uniDesc: 'Populate professor-lecturer cards. Maximum double periods per day and time-window restrictions serve as algorithmic Soft Constraints for the engine.',
    uniDep: 'Academic Faculty Department',
    uniDepPlh: 'e.g., Computer Sciences Department, Higher Mathematics Division',
    uniMax: 'Max pairs per day',
    uniWindow: 'Minimize window gaps for lecturers',
    uniWindowDesc: 'The CSP algorithm compiles scheduling cells tightly together to optimize the academic work hours.',
    uniListTitle: 'Registered Higher-Ed Faculty Staff',
    uniEmpty: 'Faculty staff database roster is empty.'
  }
};

const Step4 = () => {
  const lang = localStorage.getItem('lang') || 'ua';
  const t = translations[lang];

  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const userMetadata = useMemo(() => JSON.parse(localStorage.getItem('user')) || {}, []);
  const institutionType = userMetadata.Institution?.type || 'University';
  const versionId = localStorage.getItem('currentScheduleVersion');
  const navigate = useNavigate();

  const [isEditing, setIsEditing] = useState(false);
  const [targetId, setTargetId] = useState(null);
  
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    department: '',
    maxLessonsPerDay: '4', 
    avoidWindows: true     
  });

  useEffect(() => {
    if (!versionId) {
      navigate('/setup/step1');
      return;
    }
    fetchTeachers();
  }, [versionId]);

  const fetchTeachers = async () => {
    try {
      const res = await api.get('/teachers');
      setTeachers(res.data || []);
    } catch (err) {
      console.error('Failed to sync teachers registry:', err.message);
      setError(t.errSync);
    } finally {
      setLoading(false);
    }
  };

  const handleResetForm = () => {
    setIsEditing(false);
    setTargetId(null);
    setFormData({
      fullName: '',
      email: '',
      password: '',
      department: '',
      maxLessonsPerDay: '4',
      avoidWindows: true
    });
  };

  const handleSelectForEdit = (t) => {
    setIsEditing(true);
    setTargetId(t.id);
    setFormData({
      fullName: t.fullName,
      email: t.email,
      password: '', 
      department: t.Teacher?.department || '',
      maxLessonsPerDay: String(t.Teacher?.preferences?.maxLessonsPerDay || '4'),
      avoidWindows: t.Teacher?.preferences?.avoidWindows !== false
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');

    const preferencesPayload = {
      maxLessonsPerDay: Number(formData.maxLessonsPerDay),
      avoidWindows: formData.avoidWindows
    };

    const payload = {
      fullName: formData.fullName.trim(),
      email: formData.email.trim().toLowerCase(),
      department: formData.department.trim() || null,
      preferences: preferencesPayload
    };

    try {
      if (isEditing) {
        if (formData.password && formData.password.trim() !== '') {
          payload.password = formData.password;
        }
        await api.put(`/teachers/${targetId}`, payload);
        setSuccess(t.successUpdate);
      } else {
        if (!formData.password || formData.password.trim() === '') {
          setError(t.pwdRequired);
          setSubmitting(false);
          return;
        }
        payload.password = formData.password;
        await api.post('/teachers/register', payload);
        setSuccess(t.successReg);
      }
      
      handleResetForm();
      await fetchTeachers();
    } catch (err) {
      setError(err.response?.data?.message || t.errSync);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(t.confirmDelete.replace('{name}', name))) return;
    setError('');
    setSuccess('');
    try {
      await api.delete(`/teachers/${id}`);
      setSuccess(t.successDelete);
      if (targetId === id) handleResetForm();
      await fetchTeachers();
    } catch (err) {
      setError(err.response?.data?.message || t.errDelete);
    }
  };

  const labels = useMemo(() => {
    if (institutionType === 'School') {
      return {
        title: t.schoolTitle,
        desc: t.schoolDesc,
        depLabel: t.schoolDep,
        depPlaceholder: t.schoolDepPlh,
        unitMaxLabel: t.schoolMax,
        windowLabel: t.schoolWindow,
        windowDesc: t.schoolWindowDesc,
        listTitle: t.schoolListTitle,
        emptyList: t.schoolEmpty
      };
    }
    return {
      title: t.uniTitle,
      desc: t.uniDesc,
      depLabel: t.uniDep,
      depPlaceholder: t.uniDepPlh,
      unitMaxLabel: t.uniMax,
      windowLabel: t.uniWindow,
      windowDesc: t.uniWindowDesc,
      listTitle: t.uniListTitle,
      emptyList: t.uniEmpty
    };
  }, [institutionType, t]);

  if (loading) return (
    <div className="flex justify-center p-20 w-full bg-white">
      <Loader2 className="animate-spin text-emerald-600" size={32} />
    </div>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 animate-in fade-in duration-200 text-slate-700 select-none text-left w-full antialiased font-sans">
      
      {/* LEFT COLUMN: REGISTRATION AND MUTATION FORM */}
      <div className="lg:col-span-2 space-y-5">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">{isEditing ? t.titleEdit : labels.title}</h2>
          <p className="text-slate-400 text-xs mt-1 leading-relaxed">{labels.desc}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 bg-slate-50 border border-slate-200 p-5 rounded-xl shadow-sm">
          {error && <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-xl text-xs font-semibold flex items-center gap-2"><AlertCircle size={14}/> {error}</div>}
          {success && <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 p-3 rounded-xl text-xs font-semibold flex items-center gap-2"><CheckCircle size={14}/> {success}</div>}

          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-0.5 mb-1.5 block">{t.labelName}</label>
            <input 
              type="text" required placeholder="e.g., Ivanenko Petro Volodymyrovych"
              className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-slate-900 text-sm outline-none focus:border-emerald-500 transition-all font-medium placeholder:text-slate-300"
              value={formData.fullName} onChange={(e) => setFormData({...formData, fullName: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-0.5 mb-1.5 block">{t.labelEmail}</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3.5 text-slate-300" size={14} />
                <input 
                  type="email" required placeholder="teacher@edu.ua"
                  className="w-full bg-white border border-slate-200 rounded-xl py-2.5 pl-9 pr-3 text-slate-900 text-sm font-mono outline-none focus:border-emerald-500 transition-all placeholder:text-slate-300 font-medium"
                  value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
              </div>
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-0.5 mb-1.5 block">
                {isEditing ? t.labelPwdNew : t.labelPwdTemp}
              </label>
              <input 
                type="password" required={!isEditing} placeholder={isEditing ? '••••••••' : t.placeholderPwd}
                className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-slate-900 text-sm font-mono outline-none focus:border-emerald-500 transition-all placeholder:text-slate-300 font-medium"
                value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})}
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-0.5 mb-1.5 block">{labels.depLabel}</label>
            <input 
              type="text" placeholder={labels.depPlaceholder}
              className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-slate-900 text-sm outline-none focus:border-emerald-500 transition-all font-medium placeholder:text-slate-300"
              value={formData.department} onChange={(e) => setFormData({...formData, department: e.target.value})}
            />
          </div>

          {/* ALGORITHMIC PREFERENCES SUB-SECTION */}
          <div className="border-t border-slate-100 pt-3.5 space-y-3">
            <h4 className="text-[10px] font-black text-emerald-700 uppercase tracking-widest flex items-center gap-1.5">
              <Sliders size={12} /> {t.sectionOpt}
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-1.5">{labels.unitMaxLabel}</label>
                <div className="relative">
                  <select
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 outline-none cursor-pointer font-medium appearance-none"
                    value={formData.maxLessonsPerDay} onChange={(e) => setFormData({...formData, maxLessonsPerDay: e.target.value})}
                  >
                    <option value="2">{t.max2}</option>
                    <option value="3">{t.max3}</option>
                    <option value="4">{t.max4}</option>
                    <option value="5">{t.max5}</option>
                    <option value="6">{t.max6}</option>
                  </select>
                  <div className="absolute right-4 top-3.5 pointer-events-none w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[4px] border-t-slate-400"></div>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 p-2 rounded-xl h-full flex flex-col justify-center min-h-[38px]">
                <label className="flex items-center gap-2 cursor-pointer text-xs select-none pl-1">
                  <button
                    type="button" onClick={() => setFormData({...formData, avoidWindows: !formData.avoidWindows})}
                    className="transition-colors cursor-pointer"
                  >
                    {formData.avoidWindows ? <ToggleRight size={22} className="text-emerald-600" /> : <ToggleLeft size={22} className="text-slate-300" />}
                  </button>
                  <span className="font-bold text-[10px] text-slate-600 uppercase tracking-wide">
                    {formData.avoidWindows ? t.optNoWindows : t.optCompact}
                  </span>
                </label>
              </div>
            </div>
            <p className="text-[9px] text-slate-400 leading-normal pl-0.5">{labels.windowDesc}</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
            {isEditing && (
              <button 
                type="button" onClick={handleResetForm}
                className="flex-1 bg-white border border-slate-200 hover:bg-slate-50 text-slate-500 font-bold py-2.5 rounded-xl text-xs transition-colors cursor-pointer"
              >
                {t.btnCancel}
              </button>
            )}
            <button 
              type="submit" disabled={submitting}
              className="w-full flex-1 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-100 disabled:text-slate-400 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-sm"
            >
              {submitting ? <Loader2 className="animate-spin" size={14} /> : <Plus size={14} />}
              <span>{isEditing ? t.btnSave : t.btnRegister}</span>
            </button>
          </div>
        </form>
      </div>

      {/* RIGHT COLUMN: REPOSITORIES GRID LAYOUT */}
      <div className="lg:col-span-3 flex flex-col bg-slate-50 border border-slate-200 rounded-xl p-5 h-[540px] shadow-sm">
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-4 px-0.5 flex items-center gap-2">
          <GraduationCap size={14} /> <span>{labels.listTitle} ({teachers.length})</span>
        </h3>

        <div className="flex-1 overflow-y-auto pr-1 grid grid-cols-1 gap-3 content-start scrollbar-none">
          {teachers.length === 0 ? (
            <div className="text-center py-32 text-slate-400 italic text-xs">{labels.emptyList}</div>
          ) : (
            teachers.map((t) => (
              <div key={t.id} className={`bg-white border p-4 rounded-xl flex items-center justify-between group hover:border-emerald-500 transition-colors shadow-sm ${targetId === t.id ? 'border-emerald-500 bg-emerald-50/20' : 'border-slate-200'}`}>
                <div className="flex items-center gap-3.5 truncate mr-2 cursor-pointer w-full" onClick={() => handleSelectForEdit(t)}>
                  <div className="w-9 h-9 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center text-slate-400 shrink-0">
                    <User size={16} />
                  </div>
                  <div className="space-y-0.5 truncate">
                    <h4 className="text-slate-900 font-bold text-xs truncate group-hover:text-emerald-600 transition-colors">{t.fullName}</h4>
                    <p className="text-[10px] font-mono text-slate-400 truncate">{t.email}</p>
                    <div className="text-[10px] text-slate-400 font-bold flex flex-wrap items-center gap-x-1.5 pt-0.5 truncate">
                      <span className="text-slate-500 font-semibold truncate">{t.Teacher?.department || labels.generalDep}</span>
                      <span className="text-slate-200 font-normal">•</span>
                      <span className="text-emerald-700 font-mono text-[9px] bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100 shrink-0 uppercase tracking-wide">
                        {labels.limitLabel}: {t.Teacher?.preferences?.maxLessonsPerDay || 4} {t.lessonsSuffix}
                      </span>
                    </div>
                  </div>
                </div>
                
                <button 
                  type="button" onClick={() => handleDelete(t.id, t.fullName)}
                  className="p-2 text-slate-400 hover:text-red-600 sm:opacity-0 group-hover:opacity-100 transition-all rounded-lg hover:bg-red-50 cursor-pointer shrink-0"
                  title="Remove account from registry"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* FOOTER PIPELINE ROUTING ACTION PANEL */}
      <div className="lg:col-span-5 flex justify-between items-center pt-5 border-t border-slate-100 mt-2">
        <button 
          type="button" onClick={() => navigate('/setup/step3')} 
          className="flex items-center gap-1.5 text-slate-400 hover:text-slate-800 font-bold text-xs tracking-wide transition-colors cursor-pointer" 
        >
          <ArrowLeft size={14} /> <span>{t.btnBack}</span>
        </button>
        
        <button 
          type="button" onClick={() => navigate('/setup/step5')} 
          className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-5 py-2.5 rounded-xl flex items-center gap-2 text-sm cursor-pointer transition-colors shadow-sm" 
        >
          <span>{t.btnNext}</span>
          <ArrowRight size={14} />
        </button>
      </div>

    </div>
  );
};

export default Step4;