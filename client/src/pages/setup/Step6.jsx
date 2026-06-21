import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { 
  BookOpen, Plus, Trash2, ArrowLeft, ArrowRight, 
  Loader2, Users, GraduationCap, Clock, BookMarked, Pencil, X
} from 'lucide-react';

const translations = {
  ua: {
    titleEdit: 'Редагування навантаження',
    descEdit: 'Змініть годинні параметри або відповідального лектора для вибраної дисципліни.',
    labelLectureUni: 'Лекції (пар)',
    labelPracticeUni: 'Практики (пар)',
    labelLabUni: 'Лаб. робіт (пар)',
    labelSchoolHours: 'Кількість уроків на тиждень',
    btnCancel: 'Скасувати',
    btnSave: 'Зберегти зміни',
    btnAdd: 'Додати до плану',
    btnBack: 'Назад до класів та груп',
    btnNext: 'Продовжити до запуску ШІ',
    errSave: 'Помилка під час збереження картки навантаження.',
    errRegistry: 'Не вдалося завантажити необхідні довідники даних.',
    confirmDelete: 'Вилучити цю дисципліни з плану навантаження семестру?',
    errDelete: 'Не вдалося вилучити позицію плану.',
    optionNoClasses: 'Класи відсутні',
    optionNoTeachers: 'Викладачі відсутні',
    teacherPrefix: 'Вчитель:',
    hoursSuffix: 'год.',
    lectureLabel: 'Лекцій:',
    practiceLabel: 'Практик:',
    labLabel: 'Лабораторних:',

    // Шкільні маркери
    schoolTitle: 'Навчальні плани та Навантаження',
    schoolDesc: 'Сформуйте робочу matrix-карту уроків для кожного класу. Вкажіть предмет, оберіть клас, відповідального вчителя та сумарну кількість уроків на тиждень.',
    schoolSubject: 'Назва шкільного предмета',
    schoolPlaceholder: 'напр. Алгебра, Світова література, Англійська мова',
    schoolGroup: 'Навчальний клас',
    schoolGroupPrefix: 'Клас',
    schoolTeacher: 'Відповідальний вчитель',
    schoolEmptyTeacher: 'Вчителі відсутні',
    schoolListTitle: 'Карти розподілу шкільних уроків',
    schoolEmptyList: 'Навчальний план годин закладу порожній',

    // Університетські маркери
    uniTitle: 'Навчальний план та Предмети',
    uniDesc: 'Призначте академічні дисципліни групам та закріпіть за ними лекторів. Натисніть на будь-яку картку для швидкого коригування годин розкладу.',
    uniSubject: 'Назва навчальної дисципліни',
    uniPlaceholder: 'напр. Розробка компіляторів, Вища математика',
    uniGroup: 'Академічна група',
    uniGroupPrefix: 'Група',
    uniTeacher: 'Відповідальний викладач',
    uniEmptyTeacher: 'Викладачі відсутні',
    uniListTitle: 'Картки академічних навантажень',
    uniEmptyList: 'План навантаження семестру порожній'
  },
  en: {
    titleEdit: 'Edit Academic Load',
    descEdit: 'Modify hours configuration framework or re-assign responsible lecturer node for the selected item.',
    labelLectureUni: 'Lectures (Pairs)',
    labelPracticeUni: 'Practices (Pairs)',
    labelLabUni: 'Labs (Pairs)',
    labelSchoolHours: 'Total Lessons Per Week',
    btnCancel: 'Cancel',
    btnSave: 'Save Load Changes',
    btnAdd: 'Add to Plan Matrix',
    btnBack: 'Back to Classes & Groups',
    btnNext: 'Continue to AI Optimizer',
    errSave: 'Failed to write curriculum records to database staging context.',
    errRegistry: 'Failed to hydrate core structural directories.',
    confirmDelete: 'Are you sure you want to drop this subject entry from the semester plan?',
    errDelete: 'Failed to remove target load position from layout.',
    optionNoClasses: 'No school classes found',
    optionNoTeachers: 'No faculty teachers found',
    teacherPrefix: 'Teacher:',
    hoursSuffix: 'h.',
    lectureLabel: 'Lectures:',
    practiceLabel: 'Practices:',
    labLabel: 'Labs:',

    // Шкільні маркери (EN)
    schoolTitle: 'Curriculum Plans & Load Distribution',
    schoolDesc: 'Formulate an active matrix map of lessons for each class. Specify a subject, match the grade, assign the tutor, and enter weekly hours.',
    schoolSubject: 'School Subject Title Name',
    schoolPlaceholder: 'e.g., Algebra, World Literature, English Language',
    schoolGroup: 'Target Study Class',
    schoolGroupPrefix: 'Class',
    schoolTeacher: 'Responsible School Teacher',
    schoolEmptyTeacher: 'No school teachers registered',
    schoolListTitle: 'School Lesson Distribution Maps',
    schoolEmptyList: 'School curriculum hours matrix is empty',

    // Університетські маркери (EN)
    uniTitle: 'Curriculum Plan & Subjects',
    uniDesc: 'Assign academic disciplines to student groups and lock down lecturers. Click any card entry to trigger instant hours fine-tuning.',
    uniSubject: 'Academic Discipline Name',
    uniPlaceholder: 'e.g., Compiler Development, Higher Mathematics',
    uniGroup: 'Academic Student Group',
    uniGroupPrefix: 'Group',
    uniTeacher: 'Responsible Faculty Lecturer',
    uniEmptyTeacher: 'No faculty lecturers registered',
    uniListTitle: 'Academic Load Configuration Cards',
    uniEmptyList: 'Semester curriculum load plan is empty'
  }
};

const Step6 = () => {
  const lang = localStorage.getItem('lang') || 'ua';
  const t = translations[lang];

  const [loads, setLoads] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState(null); 

  const user = useMemo(() => JSON.parse(localStorage.getItem('user')) || {}, []);
  const institutionType = user.Institution?.type || 'University';
  const versionId = localStorage.getItem('currentScheduleVersion');

  const [formData, setFormData] = useState({
    subjectName: '',
    GroupId: '',
    TeacherId: '',
    lectureHours: '2', 
    practiceHours: '0',
    labHours: '0'
  });

  const navigate = useNavigate();

  useEffect(() => {
    if (!versionId) {
      navigate('/setup/step1');
      return;
    }
    initStepData();
  }, [versionId]);

  const initStepData = async () => {
    try {
      const [loadRes, teacherRes, groupRes] = await Promise.all([
        api.get(`/curriculum?versionId=${versionId}`),
        api.get('/teachers'), 
        api.get('/groups')     
      ]);
      setLoads(loadRes.data || []);
      setTeachers(teacherRes.data || []);
      setGroups(groupRes.data || []);
      
      if (groupRes.data?.length > 0 || teacherRes.data?.length > 0) {
        setFormData(prev => ({ 
          ...prev, 
          GroupId: groupRes.data[0]?.id || '', 
          TeacherId: teacherRes.data[0]?.id || '' 
        }));
      }
    } catch (err) {
      console.error('Failed to sync curriculum context matrix:', err.message);
      setError(t.errRegistry);
    } file: {
      setLoading(false);
    }
  };

  const handleSelectEdit = (loadItem) => {
    setEditingId(loadItem.id);
    setFormData({
      subjectName: loadItem.Subject?.name || loadItem.subjectName || '',
      GroupId: loadItem.GroupId || '',
      TeacherId: loadItem.TeacherId || '',
      lectureHours: String(loadItem.lectureHours || 0),
      practiceHours: String(loadItem.practiceHours || 0),
      labHours: String(loadItem.labHours || 0)
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setFormData(prev => ({
      ...prev,
      subjectName: '',
      lectureHours: institutionType === 'School' ? '3' : '2',
      practiceHours: '0',
      labHours: '0'
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    const payload = {
      ScheduleVersionId: versionId,
      GroupId: formData.GroupId,
      subjectName: formData.subjectName.trim(),
      TeacherId: formData.TeacherId || null,
      lectureHours: Number(formData.lectureHours),
      practiceHours: institutionType === 'School' ? 0 : Number(formData.practiceHours),
      labHours: institutionType === 'School' ? 0 : Number(formData.labHours)
    };

    try {
      if (editingId) {
        const res = await api.put(`/curriculum/${editingId}`, payload);
        setLoads(loads.map(l => l.id === editingId ? res.data : l));
        setEditingId(null);
      } else {
        const res = await api.post('/curriculum', payload);
        setLoads([res.data, ...loads]);
      }
      
      setFormData(prev => ({ 
        ...prev, 
        subjectName: '', 
        lectureHours: institutionType === 'School' ? '3' : '2', 
        practiceHours: '0', 
        labHours: '0' 
      }));
    } catch (err) {
      setError(err.response?.data?.message || t.errSave);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation(); 
    if (!window.confirm(t.confirmDelete)) return;
    try {
      await api.delete(`/curriculum/${id}`);
      setLoads(loads.filter(l => l.id !== id));
      if (editingId === id) handleCancelEdit();
    } catch (err) {
      alert(err.response?.data?.message || t.errDelete);
    }
  };

  const labels = useMemo(() => {
    if (institutionType === 'School') {
      return {
        title: t.schoolTitle,
        desc: t.schoolDesc,
        subjectNameLabel: t.schoolSubject,
        placeholder: t.schoolPlaceholder,
        groupLabel: t.schoolGroup,
        groupPrefix: t.schoolGroupPrefix,
        teacherLabel: t.schoolTeacher,
        emptyTeacher: t.schoolEmptyTeacher,
        listTitle: t.schoolListTitle,
        emptyList: t.schoolEmptyList
      };
    }
    return {
      title: t.uniTitle,
      desc: t.uniDesc,
      subjectNameLabel: t.uniSubject,
      placeholder: t.uniPlaceholder,
      groupLabel: t.uniGroup,
      groupPrefix: t.uniGroupPrefix,
      teacherLabel: t.uniTeacher,
      emptyTeacher: t.uniEmptyTeacher,
      listTitle: t.uniListTitle,
      emptyList: t.uniEmptyList
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
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 animate-in fade-in duration-200 text-slate-700 text-left select-none w-full antialiased font-sans">
      
      {/* LEFT COLUMN: CONTEXT FORM SETUP */}
      <div className="lg:col-span-2 space-y-5">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">
            {editingId ? t.titleEdit : labels.title}
          </h2>
          <p className="text-slate-400 text-xs mt-1 leading-relaxed">
            {editingId ? t.descEdit : labels.desc}
          </p>
        </div>

        <form onSubmit={handleSubmit} className={`space-y-4 border p-5 rounded-xl shadow-sm transition-all duration-200 ${editingId ? 'bg-amber-50/40 border-amber-300 shadow-sm' : 'bg-white border-slate-200'}`}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-xl text-xs font-semibold">
              {error}
            </div>
          )}

          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-0.5 mb-1.5 block">{labels.subjectNameLabel}</label>
            <input 
              type="text" required disabled={submitting} placeholder={labels.placeholder} 
              className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-slate-900 text-sm outline-none focus:border-emerald-500 transition-all font-medium placeholder:text-slate-300" 
              value={formData.subjectName} 
              onChange={(e) => setFormData({...formData, subjectName: e.target.value})} 
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-0.5 mb-1.5 block">{labels.groupLabel}</label>
              <div className="relative">
                <select 
                  disabled={submitting} 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 text-sm outline-none focus:border-emerald-500 cursor-pointer appearance-none font-medium" 
                  value={formData.GroupId} 
                  onChange={(e) => setFormData({...formData, GroupId: e.target.value})} 
                >
                  {groups.length === 0 ? <option value="">{t.optionNoClasses}</option> : groups.map(g => (
                    <option key={g.id} value={g.id}>{labels.groupPrefix} {g.name}</option>
                  ))}
                </select>
                <div className="absolute right-4 top-4 pointer-events-none w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[4px] border-t-slate-400"></div>
              </div>
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-0.5 mb-1.5 block">{labels.teacherLabel}</label>
              <div className="relative">
                <select 
                  disabled={submitting} 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 text-sm outline-none focus:border-emerald-500 cursor-pointer appearance-none font-medium" 
                  value={formData.TeacherId} 
                  onChange={(e) => setFormData({...formData, TeacherId: e.target.value})} 
                >
                  {teachers.length === 0 ? <option value="">{labels.emptyTeacher}</option> : teachers.map(t => (
                    <option key={t.id} value={t.id}>{t.fullName}</option>
                  ))}
                </select>
                <div className="absolute right-4 top-4 pointer-events-none w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[4px] border-t-slate-400"></div>
              </div>
            </div>
          </div>

          {institutionType === 'School' ? (
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-0.5 mb-1.5 block">{t.labelSchoolHours}</label>
              <div className="relative">
                <BookMarked className="absolute left-3.5 top-3.5 text-slate-300" size={15} />
                <input 
                  type="number" required disabled={submitting} min="1" max="15" 
                  className="w-full bg-white border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-slate-900 text-sm outline-none focus:border-emerald-500 font-medium" 
                  value={formData.lectureHours} 
                  onChange={(e) => setFormData({...formData, lectureHours: e.target.value})} 
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3 pt-1">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider text-center block mb-1">{t.labelLectureUni}</label>
                <input type="number" required disabled={submitting} min="0" max="10" className="w-full bg-white border border-slate-200 rounded-xl p-2 text-center text-slate-900 text-sm focus:border-emerald-500 transition-all font-mono font-bold" value={formData.lectureHours} onChange={(e) => setFormData({...formData, lectureHours: e.target.value})} />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider text-center block mb-1">{t.labelPracticeUni}</label>
                <input type="number" required disabled={submitting} min="0" max="10" className="w-full bg-white border border-slate-200 rounded-xl p-2 text-center text-slate-900 text-sm focus:border-emerald-500 transition-all font-mono font-bold" value={formData.practiceHours} onChange={(e) => setFormData({...formData, practiceHours: e.target.value})} />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider text-center block mb-1">{t.labelLabUni}</label>
                <input type="number" required disabled={submitting} min="0" max="10" className="w-full bg-white border border-slate-200 rounded-xl p-2 text-center text-slate-900 text-sm focus:border-emerald-500 transition-all font-mono font-bold" value={formData.labHours} onChange={(e) => setFormData({...formData, labHours: e.target.value})} />
              </div>
            </div>
          )}

          <div className="flex gap-2.5 mt-4">
            {editingId && (
              <button 
                type="button" onClick={handleCancelEdit} disabled={submitting}
                className="bg-white hover:bg-slate-50 text-slate-500 border border-slate-200 p-2.5 rounded-xl flex items-center justify-center transition-colors cursor-pointer"
              >
                <X size={15} />
              </button>
            )}
            <button 
              type="submit" 
              disabled={submitting || groups.length === 0 || teachers.length === 0} 
              className={`flex-1 font-bold py-2.5 rounded-xl flex items-center justify-center gap-1.5 text-xs uppercase tracking-wide cursor-pointer transition-colors shadow-sm ${editingId ? 'bg-amber-600 hover:bg-amber-500 text-white' : 'bg-emerald-600 hover:bg-emerald-500 text-white'}`} 
            >
              {submitting ? <Loader2 className="animate-spin" size={14} /> : <Plus size={14} />}
              <span>{editingId ? t.btnSave : t.btnAdd}</span>
            </button>
          </div>
        </form>
      </div>

      {/* RIGHT COLUMN: INDEX DATA MATRIX CONTAINER */}
      <div className="lg:col-span-3 flex flex-col bg-slate-50 border border-slate-200 rounded-xl p-5 h-[495px] shadow-sm">
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-4 px-0.5 flex items-center gap-2">
          <BookOpen size={14} /> <span>{labels.listTitle} ({loads.length})</span>
        </h3> 
        
        <div className="flex-1 overflow-y-auto pr-1 grid grid-cols-1 gap-3 content-start scrollbar-none">
          {loads.length === 0 ? (
            <div className="text-center py-28 text-slate-400 italic text-xs">{labels.emptyList}</div>
          ) : (
            loads.map((l) => {
              const localizedGroupName = l.Group?.name || groups.find(g => g.id === l.GroupId)?.name || '—';
              const localizedTeacherName = l.RecommendedTeacher?.fullName || teachers.find(t => t.id === l.TeacherId)?.fullName || '—';
              const isCurrentEditTarget = editingId === l.id;

              return (
                <div 
                  key={l.id} onClick={() => handleSelectEdit(l)}
                  className={`border p-4 rounded-xl flex items-center justify-between group cursor-pointer transition-colors shadow-sm active:scale-[0.995] ${isCurrentEditTarget ? 'bg-amber-50 border-amber-400 shadow-xs' : 'bg-white border-slate-200 hover:border-emerald-500'}`}
                >
                  <div className="flex items-center gap-3.5 truncate mr-2">
                    <div className={`w-9 h-9 border rounded-lg flex items-center justify-center shrink-0 transition-colors ${isCurrentEditTarget ? 'bg-amber-100 border-amber-300 text-amber-800' : 'bg-slate-50 border-slate-100 text-slate-400'}`}>
                      {isCurrentEditTarget ? <Pencil size={13} /> : <GraduationCap size={16} />}
                    </div>
                    <div className="space-y-0.5 truncate text-left">
                      <h4 className="text-slate-900 font-bold text-xs truncate group-hover:text-emerald-600 transition-colors">{l.Subject?.name || l.subjectName}</h4>
                      <div className="text-[11px] text-slate-400 flex flex-wrap items-center gap-x-1.5 font-semibold truncate">
                        <span className="flex items-center gap-1 text-emerald-700 truncate"><Users size={11} className="shrink-0" /> {labels.groupPrefix} {localizedGroupName}</span>
                        <span className="text-slate-200 font-normal">•</span> 
                        <span className="truncate text-slate-600 font-bold">{t.teacherPrefix} {localizedTeacherName}</span>
                      </div>
                      <div className="text-[10px] font-mono font-bold text-slate-400 flex flex-wrap items-center gap-x-2.5 pt-0.5">
                        {institutionType === 'School' ? (
                          <span className="flex items-center gap-1 text-teal-600 font-bold"><Clock size={10} /> {t.schoolHours}: {l.lectureHours} {t.hoursSuffix}</span>
                        ) : (
                          <>
                            <span className="flex items-center gap-0.5 text-blue-600">{t.lectureLabel} {l.lectureHours}</span>
                            <span className="text-indigo-500">{t.practiceLabel} {l.practiceHours}</span>
                            <span className="text-teal-600">{t.labLabel} {l.labHours}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <button 
                    type="button" onClick={(e) => handleDelete(e, l.id)} 
                    className="p-2 text-slate-400 hover:text-red-600 sm:opacity-0 group-hover:opacity-100 transition-all rounded-lg hover:bg-red-50 cursor-pointer shrink-0" 
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* NAVIGATION FOOTER */}
      <div className="lg:col-span-5 flex justify-between items-center pt-5 border-t border-slate-100 mt-2">
        <button 
          type="button" onClick={() => navigate('/setup/step5')} 
          className="flex items-center gap-1.5 text-slate-400 hover:text-slate-800 font-bold text-xs tracking-wide transition-colors cursor-pointer" 
        >
          <ArrowLeft size={14} /> <span>{t.btnBack}</span>
        </button>
        <button 
          type="button" onClick={() => navigate('/setup/step7')} 
          className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-5 py-2.5 rounded-xl flex items-center gap-2 text-sm cursor-pointer transition-colors shadow-sm" 
        >
          <span>{t.btnNext}</span>
          <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
};

export default Step6;