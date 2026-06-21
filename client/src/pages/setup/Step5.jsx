import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { 
  Plus, Trash2, ArrowRight, ArrowLeft, Loader2, 
  AlertCircle, CheckCircle, Users, Layers, 
  GraduationCap, Tag
} from 'lucide-react';

const translations = {
  ua: {
    titleCorrection: 'Корекція параметрів',
    btnCancel: 'Скасувати',
    btnSave: 'Зберегти зміни',
    btnCreateClass: 'Створити клас',
    btnCreateGroup: 'Створити групу',
    btnBack: 'Назад до кадрового складу',
    btnNext: 'Продовжити до планів предметів',
    successUpdate: 'Облікові параметри успішно оновлено.',
    successReg: 'Нову одиницю контингенту успішно внесено до реєстру.',
    successDelete: 'Запис успішно видалено з кадрових списків.',
    errSync: 'Помилка синхронізації бази контингенту.',
    errDelete: 'Не вдалося видалити елемент через наявні жорсткі зв’язки розкладу.',
    errRegistry: 'Реєстр недоступний через помилку бекенду. Перевірте асоціації Subgroups у моделях.',
    emptyPrompt: 'Контингент закладу порожній. Внесіть перші класи або групи.',
    confirmDelete: 'Ви дійсно бажаєте вилучити "{name}" з реєстру закладу? Усі пов\'язані плани та підгрупи будуть перевірені на цілісність.',
    optionStandalone: '--- Standalone (Самостійний базовий клас) ---',
    optionBelongs: 'Входить до складу:',
    subgroupSuffix: 'Підгрупа складу',
    studentsCountText: 'учнів',

    // Шкільні маркери
    schoolTitle: 'Класи, Паралелі та Підгрупи',
    schoolDesc: 'Зареєструйте учнівські класи вашого ліцею. Ви можете розділити базовий клас (напр., 10-А) на підгрупи для вивчення іноземних мов чи інформатики за допомогою прапорця батьківського класу.',
    schoolName: 'Літерно-цифровий ідентифікатор класу',
    schoolNamePlh: 'напр. 10-А, 5-Б, 10-А (Англ. підгрупа 1)',
    schoolCourse: 'Рік навчання (Клас / Паралель)',
    schoolCount: 'Кількість учнів',
    schoolSpec: 'Профільний напрямок класу (опціонально)',
    schoolSpecPlh: 'напр. Математичний профіль, Філологічний',
    schoolSub: 'Це ізольована підгрупа іншого класу?',
    schoolSubPlh: 'Оберіть основний батьківський клас',
    schoolListTitle: 'Діючий реєстр навчальних класів закладу',
    schoolPrefix: 'Клас / Паралель',
    schoolUnitSelector: 'й Клас',

    // Університетські маркери
    uniTitle: 'Акад. Групи та Підгрупи',
    uniDesc: 'Внесіть академічні групи вашого факультету. Створюйте лабораторні підгрупи або потокові об’єднання за допомогою селектора ієрархічних зв’язків для математичного ядра CSP.',
    uniName: 'Кодова назва / Номер групи',
    uniNamePlh: 'напр. КН-409, ІПЗ-201, КН-409 (Підгрупа 1)',
    uniCourse: 'Поточний курс навчання',
    uniCount: 'Кількість студентів',
    uniSpec: 'Спеціалізація / Напрямок навчання',
    uniSpecPlh: 'напр. Комп’ютерні науки, Системний аналіз',
    uniSub: 'Це внутрішня підгрупа іншої групи?',
    uniSubPlh: 'Оберіть основну батьківську групу',
    uniListTitle: 'Зареєстровані академічні групи',
    uniPrefix: 'Курс',
    uniUnitSelector: 'й Курс'
  },
  en: {
    titleCorrection: 'Adjustment Mode',
    btnCancel: 'Cancel',
    btnSave: 'Save Structural Node',
    btnCreateClass: 'Create Class',
    btnCreateGroup: 'Create Group',
    btnBack: 'Back to Teaching Staff',
    btnNext: 'Continue to Subject Plans',
    successUpdate: 'Account node identity specifications updated successfully.',
    successReg: 'New contingent asset added to structural registries.',
    successDelete: 'Record detached from core ledger maps successfully.',
    errSync: 'Failed to complete balancing mutation cycles.',
    errDelete: 'Interruption: Entity possesses binding references within structural schedule nodes.',
    errRegistry: 'Database query failure. Please verify Subgroups associations within server models.',
    emptyPrompt: 'Contingent fund index is empty. Populating records is mandatory to unlock pipeline.',
    confirmDelete: 'Are you sure you want to drop "{name}" from the ledger? This clears implicit children rows.',
    optionStandalone: '--- Standalone Core (Independent Main Asset) ---',
    optionBelongs: 'Attached to base parent:',
    subgroupSuffix: 'Child Cluster Subgroup',
    studentsCountText: 'students',

    // Шкільні маркери (EN)
    schoolTitle: 'Classes, Parallels & Subgroups',
    schoolDesc: 'Register student classes of your lyceum. You can split a root class entity (e.g., 10-A) into specialized branches for languages or informatics using the hierarchy link.',
    schoolName: 'Alphanumeric Class Identifier Code',
    schoolNamePlh: 'e.g., 10-A, 5-B, 10-A (English Sub-1)',
    schoolCourse: 'Academic Study Year (Class / Parallel)',
    schoolCount: 'Pupils Headcount',
    schoolSpec: 'Class Stream Profile Specialization (Optional)',
    schoolSpecPlh: 'e.g., Mathematical Profile, Philology Division',
    schoolSub: 'Is this an isolated subgroup of another class?',
    schoolSubPlh: 'Choose core parent school class node',
    schoolListTitle: 'Active School Classes Registry',
    schoolPrefix: 'Parallel Class',
    schoolUnitSelector: ' Grade',

    // Університетські маркери (EN)
    uniTitle: 'Academic Groups & Subgroups',
    uniDesc: 'Log student groups of your faculty department. Build layout sub-divisions or lecture streams utilizing the structural drop matrix to serve the CSP mathematical model.',
    uniName: 'Coded Name / Group Number Tag',
    uniNamePlh: 'e.g., CS-409, SE-201, CS-409 (Subgroup-1)',
    uniCourse: 'Current Active Study Course',
    uniCount: 'Students Headcount',
    uniSpec: 'Specialization / Educational Direction',
    uniSpecPlh: 'e.g., Computer Sciences, Systems Analysis',
    uniSub: 'Is this an internal sub-tier of another group?',
    uniSubPlh: 'Select primary parent academic group',
    uniListTitle: 'Registered Academic Groups',
    uniPrefix: 'Course Year',
    uniUnitSelector: ' Year'
  }
};

const Step5 = () => {
  const lang = localStorage.getItem('lang') || 'ua';
  const t = translations[lang];

  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const user = useMemo(() => JSON.parse(localStorage.getItem('user')) || {}, []);
  const institutionType = user.Institution?.type || 'University';
  const versionId = localStorage.getItem('currentScheduleVersion');
  const navigate = useNavigate();

  const [isEditing, setIsEditing] = useState(false);
  const [targetId, setTargetId] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    studentCount: '',
    course: '1', 
    specialization: '',
    parentGroupId: '' 
  });

  useEffect(() => {
    if (!versionId) {
      navigate('/setup/step1');
      return;
    }
    fetchGroups();
  }, [versionId]);

  const fetchGroups = async () => {
    try {
      const res = await api.get('/groups');
      setGroups(res.data || []);
      setError('');
    } catch (err) {
      console.error('Failed to sync groups registry:', err.message);
      setError(t.errRegistry);
    } finally {
      setLoading(false);
    }
  };

  const parentGroupCandidates = useMemo(() => {
    return groups.filter(g => !g.parentGroupId && g.id !== targetId);
  }, [groups, targetId]);

  const handleResetForm = () => {
    setIsEditing(false);
    setTargetId(null);
    setFormData({
      name: '',
      studentCount: '',
      course: '1',
      specialization: '',
      parentGroupId: ''
    });
  };

  const handleSelectForEdit = (g) => {
    setIsEditing(true);
    setTargetId(g.id);
    setFormData({
      name: g.name,
      studentCount: String(g.studentCount),
      course: String(g.course),
      specialization: g.specialization || '',
      parentGroupId: g.parentGroupId || ''
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');

    const payload = {
      name: formData.name.trim(),
      studentCount: parseInt(formData.studentCount, 10),
      course: parseInt(formData.course, 10),
      specialization: formData.specialization.trim() || null,
      parentGroupId: formData.parentGroupId || null
    };

    try {
      if (isEditing) {
        await api.put(`/groups/${targetId}`, payload);
        setSuccess(t.successUpdate);
      } else {
        await api.post('/groups', payload);
        setSuccess(t.successReg);
      }
      
      handleResetForm();
      await fetchGroups();
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
      await api.delete(`/groups/${id}`);
      setSuccess(t.successDelete);
      if (targetId === id) handleResetForm();
      await fetchGroups();
    } catch (err) {
      setError(err.response?.data?.message || t.errDelete);
    }
  };

  const labels = useMemo(() => {
    if (institutionType === 'School') {
      return {
        title: t.schoolTitle,
        desc: t.schoolDesc,
        nameLabel: t.schoolName,
        namePlaceholder: t.schoolNamePlh,
        courseLabel: t.schoolCourse,
        countLabel: t.schoolCount,
        specLabel: t.schoolSpec,
        specPlaceholder: t.schoolSpecPlh,
        subgroupLabel: t.schoolSub,
        subgroupOption: t.schoolSubPlh,
        listTitle: t.schoolListTitle,
        unitPrefix: t.schoolPrefix
      };
    }
    return {
      title: t.uniTitle,
      desc: t.uniDesc,
      nameLabel: t.uniName,
      namePlaceholder: t.uniNamePlh,
      courseLabel: t.uniCourse,
      countLabel: t.uniCount,
      specLabel: t.uniSpec,
      specPlaceholder: t.uniSpecPlh,
      subgroupLabel: t.uniSub,
      subgroupOption: t.uniSubPlh,
      listTitle: t.uniListTitle,
      unitPrefix: t.uniPrefix
    };
  }, [institutionType, t]);

  if (loading && !error) return (
    <div className="flex justify-center p-20 w-full bg-white">
      <Loader2 className="animate-spin text-emerald-600" size={32} />
    </div>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 animate-in fade-in duration-200 text-slate-700 select-none text-left w-full antialiased font-sans">
      
      {/* LEFT COLUMN: CRITICAL CONFIGURATION FORM */}
      <div className="lg:col-span-2 space-y-5">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">{isEditing ? t.titleCorrection : labels.title}</h2>
          <p className="text-slate-400 text-xs mt-1 leading-relaxed">{labels.desc}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 bg-slate-50 border border-slate-200 p-5 rounded-xl shadow-sm">
          {error && <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-xl text-xs font-semibold flex items-start gap-2"><AlertCircle size={14} className="shrink-0 mt-0.5"/> <span>{error}</span></div>}
          {success && <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 p-3 rounded-xl text-xs font-semibold flex items-center gap-2"><CheckCircle size={14}/> {success}</div>}

          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-0.5 mb-1.5 block">{labels.nameLabel}</label>
            <input 
              type="text" required placeholder={labels.namePlaceholder}
              className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-slate-900 text-sm outline-none focus:border-emerald-500 transition-all font-medium placeholder:text-slate-300"
              value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-0.5 mb-1.5 block">{labels.courseLabel}</label>
              <div className="relative">
                <select
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 text-sm outline-none focus:border-emerald-500 cursor-pointer font-medium appearance-none"
                  value={formData.course} onChange={(e) => setFormData({...formData, course: e.target.value})}
                >
                  {Array.from({ length: institutionType === 'School' ? 12 : 6 }, (_, i) => String(i + 1)).map(num => (
                    <option key={num} value={num}>
                      {num}{institutionType === 'School' ? t.schoolUnitSelector : t.uniUnitSelector}
                    </option>
                  ))}
                </select>
                <div className="absolute right-4 top-4 pointer-events-none w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[4px] border-t-slate-400"></div>
              </div>
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-0.5 mb-1.5 block">{labels.countLabel}</label>
              <input 
                type="number" required min="1" placeholder="e.g., 25"
                className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-slate-900 text-sm outline-none focus:border-emerald-500 transition-all placeholder:text-slate-300 font-medium"
                value={formData.studentCount} onChange={(e) => setFormData({...formData, studentCount: e.target.value})}
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-0.5 mb-1.5 block">{labels.specLabel}</label>
            <input 
              type="text" placeholder={labels.specPlaceholder}
              className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-slate-900 text-sm outline-none focus:border-emerald-500 transition-all font-medium placeholder:text-slate-300"
              value={formData.specialization} onChange={(e) => setFormData({...formData, specialization: e.target.value})}
            />
          </div>

          {/* HIERARCHICAL SUBGROUP MANAGEMENT NODE */}
          <div className="border-t border-slate-100 pt-3.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-0.5 mb-1.5 block flex items-center gap-1.5">
              <Layers size={12} className="text-emerald-600" /> {labels.subgroupLabel}
            </label>
            <div className="relative">
              <select
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 text-sm outline-none focus:border-emerald-500 cursor-pointer font-medium appearance-none"
                value={formData.parentGroupId} onChange={(e) => setFormData({...formData, parentGroupId: e.target.value})}
              >
                <option value="" className="text-slate-400">{t.optionStandalone}</option>
                {parentGroupCandidates.map(p => (
                  <option key={p.id} value={p.id}>{t.optionBelongs} {p.name}</option>
                ))}
              </select>
              <div className="absolute right-4 top-4 pointer-events-none w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[4px] border-t-slate-400"></div>
            </div>
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
              <span>{isEditing ? t.btnSave : (institutionType === 'School' ? t.btnCreateClass : t.btnCreateGroup)}</span>
            </button>
          </div>
        </form>
      </div>

      {/* RIGHT COLUMN: GRIDS AND HIERARCHIES DISPLAY */}
      <div className="lg:col-span-3 flex flex-col bg-slate-50 border border-slate-200 rounded-xl p-5 h-[560px] shadow-sm">
        <h3 className="text-xs font-black text-slate-400 tracking-wider uppercase mb-4 px-0.5 flex items-center gap-2">
          <Users size={14} /> <span>{labels.listTitle} ({groups.filter(g => !g.parentGroupId).length})</span>
        </h3>

        <div className="flex-1 overflow-y-auto pr-1 space-y-3.5 scrollbar-none content-start">
          {groups.length === 0 ? (
            <div className="text-center py-32 text-slate-400 italic text-xs">
              {error ? t.errRegistry : t.emptyPrompt}
            </div>
          ) : (
            groups.filter(g => !g.parentGroupId).map((g) => (
              <div key={g.id} className="space-y-1.5">
                
                {/* PARENT CLASS ELEMENT CARD */}
                <div className={`bg-white border p-3.5 rounded-xl flex items-center justify-between group hover:border-emerald-500 transition-colors shadow-sm ${targetId === g.id ? 'border-emerald-500 bg-emerald-50/20' : 'border-slate-200'}`}>
                  <div className="flex items-center gap-3.5 truncate mr-2 cursor-pointer w-full" onClick={() => handleSelectForEdit(g)}>
                    <div className="w-9 h-9 bg-slate-50 border border-slate-100 rounded-lg flex items-center justify-center text-slate-400 shrink-0">
                      <GraduationCap size={16} />
                    </div>
                    <div className="space-y-0.5 truncate">
                      <h4 className="text-slate-900 font-bold text-sm truncate group-hover:text-emerald-600 transition-colors">{g.name}</h4>
                      <div className="text-[11px] text-slate-400 font-semibold flex items-center gap-x-1.5 truncate">
                        <span className="text-emerald-700 font-bold shrink-0">{labels.unitPrefix}: {g.course}</span>
                        <span className="text-slate-200 font-normal shrink-0">•</span>
                        <span className="truncate">{g.studentCount} {t.studentsCountText}</span>
                        {g.specialization && (
                          <>
                            <span className="text-slate-200 font-normal shrink-0">•</span>
                            <span className="truncate italic text-slate-500">{g.specialization}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <button 
                    type="button" onClick={() => handleDelete(g.id, g.name)}
                    className="p-2 text-slate-400 hover:text-red-600 sm:opacity-0 group-hover:opacity-100 transition-all rounded-lg hover:bg-red-50 cursor-pointer shrink-0"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>

                {/* CHILD SUBGROUPS CLUSTER */}
                {groups.filter(sub => sub.parentGroupId === g.id).map(sub => (
                  <div key={sub.id} className={`ml-6 bg-slate-50/50 border p-2.5 rounded-xl flex items-center justify-between group/sub hover:border-emerald-500 transition-colors ${targetId === sub.id ? 'border-emerald-500 bg-emerald-50/20' : 'border-slate-200'}`}>
                    <div className="flex items-center gap-2.5 truncate mr-2 cursor-pointer w-full" onClick={() => handleSelectForEdit(sub)}>
                      <div className="w-7 h-7 bg-white border border-slate-200 rounded-md flex items-center justify-center text-slate-400 shrink-0 shadow-xs">
                        <Tag size={12} />
                      </div>
                      <div className="truncate">
                        <h5 className="text-slate-800 font-bold text-xs truncate group-hover/sub:text-emerald-600 transition-colors">{sub.name}</h5>
                        <p className="text-[10px] text-slate-400 font-semibold tracking-tight">{sub.studentCount} {t.studentsCountText} • {t.subgroupSuffix}</p>
                      </div>
                    </div>
                    <button 
                      type="button" onClick={() => handleDelete(sub.id, sub.name)}
                      className="p-1.5 text-slate-400 hover:text-red-600 sm:opacity-0 group-hover/sub:opacity-100 transition-all rounded-md hover:bg-red-50 cursor-pointer shrink-0"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}

              </div>
            ))
          )}
        </div>
      </div>

      {/* FOOTER PIPELINE ROUTING CONTROLS */}
      <div className="lg:col-span-5 flex justify-between items-center pt-5 border-t border-slate-100 mt-2">
        <button 
          type="button" onClick={() => navigate('/setup/step4')} 
          className="flex items-center gap-1.5 text-slate-400 hover:text-slate-800 font-bold text-xs tracking-wide transition-colors cursor-pointer" 
        >
          <ArrowLeft size={14} /> <span>{t.btnBack}</span>
        </button>
        
        <button 
          type="button" onClick={() => navigate('/setup/step6')} 
          className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-5 py-2.5 rounded-xl flex items-center gap-2 text-sm cursor-pointer transition-colors shadow-sm" 
        >
          <span>{t.btnNext}</span>
          <ArrowRight size={14} />
        </button>
      </div>

    </div>
  );
};

export default Step5;