import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { 
  Building2, Plus, Trash2, ArrowLeft, 
  ArrowRight, Loader2, Users, Monitor, 
  BookOpen, HelpCircle, School
} from 'lucide-react';

const translations = {
  ua: {
    labelNumber: 'Назва / Номер приміщення',
    labelCapacity: 'Місткість (місць)',
    labelType: 'Спеціалізація типу',
    btnSubmit: 'Додати до фонду',
    btnBack: 'Назад до семестрів',
    btnNext: 'Продовжити до розкладу дзвінків',
    confirmDelete: 'Ви впевнені, що хочете вилучити приміщення з фонду закладу?',
    errDefault: 'Помилка під час реєстрації кабінету.',
    errDelete: 'Не вдалося видалити аудиторію через активні зв’язки розкладу.',
    fallbackType: 'Навчальний клас',
    schoolTitle: 'Фонд кабінетів та класів',
    schoolDesc: 'Внесіть наявні шкільні класи, кабінети інформатики, лабораторії чи актові зали.',
    schoolPlaceholder: 'напр. 304, Каб. Хімії, Актова зала',
    schoolListTitle: 'Реєстр навчальних приміщень закладу',
    schoolEmptyList: 'Кадровий кабінетний фонд порожній',
    schoolType1: 'Стандартний клас / Кабінет',
    schoolType2: 'Кабінет інформатики',
    schoolType3: 'Спеціалізована лабораторія',
    schoolType4: 'Актова зала / Лекційний зал',
    uniTitle: 'Фонд аудиторій закладу',
    uniDesc: 'Внесіть наявні лекційні зали, практичні кабінети та комп’ютерні класи.',
    uniPlaceholder: 'напр. 402, Велика Лекційна, Лаб-3',
    uniListTitle: 'Облікові картки аудиторій',
    uniEmptyList: 'Аудиторний фонд закладу порожній',
    uniType1: 'Лекційна аудиторія',
    uniType2: 'Практичний кабінет',
    uniType3: 'Комп’ютерний клас',
    uniType4: 'Наукова лабораторія'
  },
  en: {
    labelNumber: 'Room Name / Number',
    labelCapacity: 'Capacity (Seats)',
    labelType: 'Type Specialization',
    btnSubmit: 'Add to Fund',
    btnBack: 'Back to Semesters',
    btnNext: 'Continue to Bell Schedule',
    confirmDelete: 'Are you sure you want to remove this room from the institution fund?',
    errDefault: 'Error occurred during classroom registration.',
    errDelete: 'Failed to delete the classroom due to active schedule references.',
    fallbackType: 'Classroom',
    schoolTitle: 'Classrooms & Cabinets Fund',
    schoolDesc: 'Enter available school classrooms, computer labs, or assembly halls.',
    schoolPlaceholder: 'e.g., 304, Chemistry Lab, Main Hall',
    schoolListTitle: 'Registry of School Classrooms',
    schoolEmptyList: 'Classroom infrastructure fund is empty',
    schoolType1: 'Standard Classroom',
    schoolType2: 'Computer Lab',
    schoolType3: 'Specialized Laboratory',
    schoolType4: 'Assembly Hall / Lecture Room',
    uniTitle: 'Institution Auditorium Fund',
    uniDesc: 'Register lecture halls, practical classrooms, and computer labs.',
    uniPlaceholder: 'e.g., 402, Main Lecture Hall, Lab-3',
    uniListTitle: 'Auditorium Account Cards',
    uniEmptyList: 'Auditorium fund is empty',
    uniType1: 'Lecture Auditorium',
    uniType2: 'Practical Classroom',
    uniType3: 'Computer Class',
    uniType4: 'Scientific Laboratory'
  }
};

const Step2 = () => {
  const lang = localStorage.getItem('lang') || 'ua';
  const t = translations[lang];

  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const versionId = localStorage.getItem('currentScheduleVersion');
  const user = useMemo(() => JSON.parse(localStorage.getItem('user')) || {}, []);
  const institutionType = user.Institution?.type || 'University';
  const navigate = useNavigate();

  const [formData, setFormData] = useState({ number: '', capacity: '', type: 'Lecture' });

  const classroomTypes = useMemo(() => {
    if (institutionType === 'School') {
      return [
        { key: 'General', label: t.schoolType1 },
        { key: 'Computer Class', label: t.schoolType2 },
        { key: 'Laboratory', label: t.schoolType3 },
        { key: 'Lecture', label: t.schoolType4 }
      ];
    }
    return [
      { key: 'Lecture', label: t.uniType1 },
      { key: 'General', label: t.uniType2 },
      { key: 'Computer Class', label: t.uniType3 },
      { key: 'Laboratory', label: t.uniType4 }
    ];
  }, [institutionType, t]);

  useEffect(() => {
    if (!versionId) { navigate('/setup/step1'); return; }
    setFormData(prev => ({ ...prev, type: institutionType === 'School' ? 'General' : 'Lecture' }));
    fetchClassrooms();
  }, [institutionType, versionId]);

  const fetchClassrooms = async () => {
    try {
      const res = await api.get('/classrooms', { headers: { 'x-schedule-version-id': versionId } });
      setClassrooms(res.data || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    const payload = {
      number: formData.number.trim(),
      capacity: Number(formData.capacity),
      type: formData.type,
      ScheduleVersionId: versionId 
    };

    try {
      const res = await api.post('/classrooms', payload);
      setClassrooms([...classrooms, res.data]);
      setFormData({ number: '', capacity: '', type: institutionType === 'School' ? 'General' : 'Lecture' });
    } catch (err) {
      setError(err.response?.data?.message || t.errDefault);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(t.confirmDelete)) return;
    try {
      await api.delete(`/classrooms/${id}`);
      setClassrooms(classrooms.filter(c => c.id !== id));
    } catch (err) { alert(err.response?.data?.message || t.errDelete); }
  };

  const getTypeIcon = (type) => {
    if (type === 'Lecture') return <BookOpen className="text-blue-600" size={16} />;
    if (type === 'Computer Class') return <Monitor className="text-indigo-600" size={16} />;
    if (type === 'Laboratory') return <HelpCircle className="text-cyan-600" size={16} />;
    return <School className="text-emerald-600" size={16} />;
  };

  const formatType = (type) => {
    const matched = classroomTypes.find(t => t.key === type);
    return matched ? matched.label : t.fallbackType;
  };

  const textContext = useMemo(() => {
    return institutionType === 'School' ? 
      { title: t.schoolTitle, desc: t.schoolDesc, inputPlaceholder: t.schoolPlaceholder, listTitle: t.schoolListTitle, emptyList: t.schoolEmptyList } :
      { title: t.uniTitle, desc: t.uniDesc, inputPlaceholder: t.uniPlaceholder, listTitle: t.uniListTitle, emptyList: t.uniEmptyList };
  }, [institutionType, t]);

  if (loading) return <div className="flex justify-center p-20"><Loader2 className="animate-spin text-emerald-600" size={32} /></div>;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 animate-in fade-in duration-200 text-slate-700 select-none text-left w-full">
      <div className="lg:col-span-2 space-y-5">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">{textContext.title}</h2>
          <p className="text-slate-400 text-xs mt-1 leading-relaxed">{textContext.desc}</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 bg-slate-50 border border-slate-200 p-5 rounded-xl">
          {error && <div className="bg-red-50 text-red-600 border border-red-200 p-3 rounded-xl text-xs font-medium">{error}</div>}
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-0.5 mb-1.5 block">{t.labelNumber}</label>
            <input type="text" required disabled={submitting} placeholder={textContext.inputPlaceholder} className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-slate-900 text-sm outline-none focus:border-emerald-500 font-medium" value={formData.number} onChange={(e) => setFormData({...formData, number: e.target.value})} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-0.5 mb-1.5 block">{t.labelCapacity}</label>
              <input type="number" required disabled={submitting} placeholder="30" min="1" className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-slate-900 text-sm outline-none focus:border-emerald-500 font-medium" value={formData.capacity} onChange={(e) => setFormData({...formData, capacity: e.target.value})} />
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-0.5 mb-1.5 block">{t.labelType}</label>
              <select disabled={submitting} className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-slate-900 text-sm outline-none focus:border-emerald-500 font-medium" value={formData.type} onChange={(e) => setFormData({...formData, type: e.target.value})}>
                {classroomTypes.map((t, idx) => <option key={idx} value={t.key}>{t.label}</option>)}
              </select>
            </div>
          </div>
          <button type="submit" disabled={submitting} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-xl text-sm flex items-center justify-center gap-2 shadow-sm">
            {submitting ? <Loader2 className="animate-spin" size={16} /> : <><Plus size={14} /> <span>{t.btnSubmit}</span></>}
          </button>
        </form>
      </div>

      <div className="lg:col-span-3 flex flex-col bg-slate-50 border border-slate-200 rounded-xl p-5 h-[440px]">
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
          <Building2 size={14} /> <span>{textContext.listTitle} ({classrooms.length})</span>
        </h3>
        <div className="flex-1 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-3.5 content-start">
          {classrooms.length === 0 ? <div className="col-span-2 text-center py-20 text-slate-400 text-xs">{textContext.emptyList}</div> :
            classrooms.map((c) => (
              <div key={c.id} className="bg-white border border-slate-200 p-3.5 rounded-xl flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 bg-slate-50 rounded-lg flex items-center justify-center">{getTypeIcon(c.type)}</div>
                  <div className="space-y-0.5 min-w-0">
                    <h4 className="text-slate-900 font-bold text-xs truncate">{c.number}</h4>
                    <p className="text-[11px] text-slate-400 font-semibold truncate">{c.capacity} m. • {formatType(c.type)}</p>
                  </div>
                </div>
                <button type="button" onClick={() => handleDelete(c.id)} className="p-2 text-slate-400 hover:text-red-600 transition-all rounded-lg hover:bg-red-50"><Trash2 size={13} /></button>
              </div>
            ))
          }
        </div>
      </div>

      <div className="lg:col-span-5 flex justify-between pt-5 border-t border-slate-100">
        <button type="button" onClick={() => navigate('/setup/step1')} className="flex items-center gap-1.5 text-slate-400 hover:text-slate-800 font-bold text-xs tracking-wide"><ArrowLeft size={14} /> <span>{t.btnBack}</span></button>
        <button type="button" onClick={() => navigate('/setup/step3')} className="bg-emerald-600 text-white font-bold px-5 py-2.5 rounded-xl text-sm flex items-center gap-2">{t.btnNext} <ArrowRight size={14} /></button>
      </div>
    </div>
  );
};

export default Step2;