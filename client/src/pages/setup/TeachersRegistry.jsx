import { useState, useEffect, useMemo } from 'react';
import api from '../../api/axios';
import { 
  Users, Plus, Trash2, Loader2, Save, 
  CheckCircle, ShieldAlert, Mail, Key, User 
} from 'lucide-react';

const translations = {
  ua: {
    title: 'Глобальний кадровий реєстр викладачів',
    subtitle: 'Пряме табличне керування обліковими записами. Додавайте порожні рядки та заповнюйте дані вручну.',
    thName: 'Повне ПІБ викладача',
    thEmail: 'Email / Логін',
    thPassword: 'Пароль (зміна)',
    thDepartment: 'Кафедра / Комісія',
    thActions: 'Статус',
    btnAddRow: 'Додати порожній рядок',
    textSaving: 'Синхронізація...',
    textSaved: 'Збережено ✓',
    errValidation: 'ПІБ, Email та Пароль є обов’язковими для нового викладача!',
    confirmDelete: 'Ви дійсно бажаєте видалити викладача "{name}"?',
    generalDep: 'Загальна кафедра',
    loadingLabel: 'Завантаження кадрового реєстру...',
    passPlaceholderNew: 'Введіть пароль',
    passPlaceholderEdit: '••••••••'
  },
  en: {
    title: 'Global Faculty Registry',
    subtitle: 'Direct inline grid management. Insert empty rows and populate data manually.',
    thName: 'Full Name of Faculty',
    thEmail: 'Email Address / Login',
    thPassword: 'Password (Override)',
    thDepartment: 'Academic Department',
    thActions: 'Status',
    btnAddRow: 'Insert Empty Row',
    textSaving: 'Syncing...',
    textSaved: 'Saved ✓',
    errValidation: 'Name, Email and Password are required for a new faculty member!',
    confirmDelete: 'Are you sure you want to delete faculty member "{name}"?',
    generalDep: 'General Department',
    loadingLabel: 'Downloading registries...',
    passPlaceholderNew: 'Set password',
    passPlaceholderEdit: '••••••••'
  }
};

const TeachersRegistry = () => {
  const [lang, setLang] = useState(localStorage.getItem('lang') || 'ua');
  const t = translations[lang];

  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState('idle'); // idle | saving | saved

  useEffect(() => {
    fetchTeachers();

    const handleLangChange = (e) => setLang(e.detail);
    window.addEventListener('appLangChanged', handleLangChange);
    return () => window.removeEventListener('appLangChanged', handleLangChange);
  }, []);

  const fetchTeachers = async () => {
    try {
      const res = await api.get('/teachers');
      setTeachers(res.data || []);
    } catch (err) {
      console.error('Registry Load Error:', err);
    } finally {
      setLoading(false);
    }
  };

  // 1. Додавання локального порожнього рядка (Без запиту на сервер)
  const handleAddEmptyRow = () => {
    const tempId = `temp_${Date.now()}`;
    const newRow = {
      id: tempId,
      fullName: '',
      email: '',
      password: '', // Тільки для нового рядка
      Teacher: { department: '' },
      isNew: true
    };
    setTeachers([newRow, ...teachers]);
  };

  // 2. Обробка змін у клітинках (Автозбереження для існуючих)
  const handleCellChange = async (id, field, value) => {
    const updated = teachers.map(teacher => {
      if (teacher.id === id) {
        if (field === 'department') {
          return { ...teacher, Teacher: { ...teacher.Teacher, department: value } };
        }
        return { ...teacher, [field]: value };
      }
      return teacher;
    });
    setTeachers(updated);

    // Якщо це існуючий викладач — робимо автозбереження на кожен чих
    if (!id.toString().startsWith('temp_')) {
      performUpdate(id, updated.find(t => t.id === id));
    }
  };

  const performUpdate = async (id, teacherData) => {
    setSyncStatus('saving');
    try {
      const payload = {
        fullName: teacherData.fullName,
        email: teacherData.email,
        department: teacherData.Teacher?.department || null
      };
      // Якщо в поле пароля існуючого вчителя щось ввели — додаємо в payload
      if (teacherData.password && teacherData.password.trim() !== '') {
        payload.password = teacherData.password;
      }

      await api.put(`/teachers/${id}`, payload);
      setSyncStatus('saved');
      setTimeout(() => setSyncStatus('idle'), 1500);
    } catch (err) {
      setSyncStatus('idle');
    }
  };

  // 3. Збереження нового викладача (Explicit Save через дискетку)
  const handleSaveNew = async (tempId) => {
    const row = teachers.find(t => t.id === tempId);
    
    if (!row.fullName || !row.email || !row.password) {
      alert(t.errValidation);
      return;
    }

    setSyncStatus('saving');
    try {
      const res = await api.post('/teachers/register', {
        fullName: row.fullName,
        email: row.email,
        password: row.password,
        department: row.Teacher?.department || t.generalDep
      });

      // Замінюємо temp рядок на справжній об'єкт з бази
      const serverTeacher = {
        ...res.data.teacher,
        Teacher: { department: res.data.teacher.department }
      };
      
      setTeachers(teachers.map(t => t.id === tempId ? serverTeacher : t));
      setSyncStatus('saved');
      setTimeout(() => setSyncStatus('idle'), 1500);
    } catch (err) {
      alert(err.response?.data?.message || 'Error');
      setSyncStatus('idle');
    }
  };

  const handleDelete = async (id, name) => {
    if (id.toString().startsWith('temp_')) {
      setTeachers(teachers.filter(t => t.id !== id));
      return;
    }

    if (!window.confirm(t.confirmDelete.replace('{name}', name))) return;
    try {
      await api.delete(`/teachers/${id}`);
      setTeachers(teachers.filter(t => t.id !== id));
    } catch (err) {
      alert('Action blocked: Active schedule references exist.');
    }
  };

  if (loading) return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center bg-slate-50 antialiased">
      <Loader2 className="text-emerald-600 animate-spin w-10 h-10 mb-2" />
      <p className="text-slate-400 text-xs font-bold uppercase">{t.loadingLabel}</p>
    </div>
  );

  return (
    <div className="space-y-6 select-none text-left antialiased font-sans w-full text-slate-700 p-1 animate-in fade-in duration-200">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b border-slate-200 pb-4 gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <Users className="text-emerald-600" size={24} /> 
            <span>{t.title}</span>
          </h1>
          <p className="text-slate-500 text-xs mt-1 max-w-2xl">{t.subtitle}</p>
        </div>

        <div className="flex items-center gap-4 shrink-0">
          <div className="text-xs font-bold">
            {syncStatus === 'saving' && <span className="text-amber-600 flex items-center gap-1"><Loader2 size={12} className="animate-spin" /> {t.textSaving}</span>}
            {syncStatus === 'saved' && <span className="text-emerald-600 font-black flex items-center gap-1"><CheckCircle size={12} /> {t.textSaved}</span>}
          </div>
          <button 
            onClick={handleAddEmptyRow}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 transition-all shadow-sm cursor-pointer uppercase tracking-wider"
          >
            <Plus size={14} /> {t.btnAddRow}
          </button>
        </div>
      </div>

      {/* INLINE GRID HOUSING */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse min-w-[950px]">
            <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-400 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 w-[25%]">{t.thName}</th>
                <th className="px-4 py-3 w-[20%]">{t.thEmail}</th>
                <th className="px-4 py-3 w-[20%]">{t.thPassword}</th>
                <th className="px-4 py-3 w-[25%]">{t.thDepartment}</th>
                <th className="px-4 py-3 w-[10%] text-right">{t.thActions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-medium">
              {teachers.map(row => {
                const isTemp = row.id.toString().startsWith('temp_');
                return (
                  <tr key={row.id} className={`transition-colors ${isTemp ? 'bg-emerald-50/30' : 'hover:bg-slate-50/50'}`}>
                    {/* Клітинка: ПІБ */}
                    <td className="px-3 py-1.5">
                      <input 
                        type="text"
                        className="w-full bg-transparent p-2 outline-none font-bold text-slate-900 focus:bg-white focus:ring-1 focus:ring-emerald-500/20 rounded-lg transition-all"
                        value={row.fullName}
                        onChange={(e) => handleCellChange(row.id, 'fullName', e.target.value)}
                      />
                    </td>

                    {/* Клітинка: Email */}
                    <td className="px-3 py-1.5">
                      <input 
                        type="email"
                        className="w-full bg-transparent p-2 outline-none font-mono font-bold text-slate-600 focus:bg-white focus:ring-1 focus:ring-emerald-500/20 rounded-lg transition-all"
                        value={row.email}
                        onChange={(e) => handleCellChange(row.id, 'email', e.target.value)}
                      />
                    </td>

                    {/* Клітинка: ПАРОЛЬ */}
                    <td className="px-3 py-1.5">
                      <input 
                        type="password"
                        placeholder={isTemp ? t.passPlaceholderNew : t.passPlaceholderEdit}
                        className="w-full bg-transparent p-2 outline-none font-mono text-slate-400 focus:text-slate-900 focus:bg-white focus:ring-1 focus:ring-emerald-500/20 rounded-lg transition-all"
                        onChange={(e) => handleCellChange(row.id, 'password', e.target.value)}
                      />
                    </td>

                    {/* Клітинка: Кафедра */}
                    <td className="px-3 py-1.5">
                      <input 
                        type="text"
                        placeholder={t.generalDep}
                        className="w-full bg-transparent p-2 outline-none font-semibold text-slate-500 focus:bg-white focus:ring-1 focus:ring-emerald-500/20 rounded-lg transition-all"
                        value={row.Teacher?.department || ''}
                        onChange={(e) => handleCellChange(row.id, 'department', e.target.value)}
                      />
                    </td>

                    {/* Клітинка: Керування */}
                    <td className="px-4 py-1.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {isTemp ? (
                          <button 
                            onClick={() => handleSaveNew(row.id)}
                            className="p-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 transition-colors cursor-pointer shadow-xs"
                            title="Save to database"
                          >
                            <Save size={14} />
                          </button>
                        ) : (
                          <div className="w-8 h-8 flex items-center justify-center text-emerald-400">
                             <CheckCircle size={14} className="opacity-40" />
                          </div>
                        )}
                        <button 
                          onClick={() => handleDelete(row.id, row.fullName)}
                          className="p-2 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all cursor-pointer"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

export default TeachersRegistry;