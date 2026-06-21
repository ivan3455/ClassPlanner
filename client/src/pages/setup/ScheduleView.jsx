import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../api/axios';
import { 
  Calendar, Users, Building2, User, FileSpreadsheet,
  Loader2, ArrowLeft, RefreshCw, X, Link2, Check, Clock, Plus, Trash2, Save, Move
} from 'lucide-react';

const daysTranslation = {
  'Monday': 'Понеділок', 'Tuesday': 'Вівторок', 'Wednesday': 'Середа',
  'Thursday': 'Четвер', 'Friday': 'П’ятниця', 'Saturday': 'Субота', 'Sunday': 'Неділя'
};

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

const ScheduleView = () => {
  const navigate = useNavigate();
  const { publicVersionId } = useParams(); 

  const isPublicView = Boolean(publicVersionId);
  const versionId = isPublicView ? publicVersionId : localStorage.getItem('currentScheduleVersion');

  // Core data states
  const [schedule, setSchedule] = useState([]);
  const [timeSlots, setTimeSlots] = useState([]);
  const [groups, setGroups] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [subjects, setSubjects] = useState([]); 
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [exportLoading, setExportLoading] = useState(false); // Лоадер для формування Excel
  const [copied, setCopied] = useState(false);

  // Filter parameters
  const [selectedGroup, setSelectedGroup] = useState('');
  const [selectedTeacher, setSelectedTeacher] = useState('');
  const [selectedClassroom, setSelectedClassroom] = useState('');

  // States для модального вікна ручного редагування
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create'); 
  const [modalError, setModalError] = useState('');
  const [modalLoading, setModalLoading] = useState(false);
  
  const [editorData, setEditData] = useState({
    id: null,
    dayOfWeek: '',
    timeSlot: '',
    GroupId: '',
    SubjectId: '',
    TeacherId: '',
    ClassroomId: '',
    type: 'Lecture'
  });

  const user = useMemo(() => {
    try { return JSON.parse(localStorage.getItem('user')) || {}; } catch { return {}; }
  }, []);
  
  const institutionType = user.Institution?.type || 'University';
  const isMethodist = user.role === 'Methodist' && !isPublicView;

  // PHASE 1: Static Metadata Hydration
  useEffect(() => {
    if (!versionId) {
      if (!isPublicView) navigate('/dashboard');
      return;
    }

    const fetchStaticMetadata = async () => {
      try {
        const endpointPrefix = isPublicView ? '/public' : '';
        const config = isPublicView ? { _isPublic: true } : {};
        
        const [gRes, tRes, cRes, timeRes, subRes] = await Promise.all([
          api.get(`${endpointPrefix}/groups?versionId=${versionId}`, config).catch(() => ({ data: [] })),
          api.get(`${endpointPrefix}/teachers?versionId=${versionId}`, config).catch(() => ({ data: [] })),
          api.get(`${endpointPrefix}/classrooms?versionId=${versionId}`, config).catch(() => ({ data: [] })),
          api.get(`${endpointPrefix}/time-settings/${versionId}`, config).catch(() => ({ data: [] })),
          !isPublicView ? api.get('/subjects').catch(() => ({ data: [] })) : Promise.resolve({ data: [] })
        ]);
        
        setGroups(gRes.data || []);
        setTeachers(tRes.data || []);
        setClassrooms(cRes.data || []);
        setSubjects(subRes.data || []);
        
        const sortedSlots = (timeRes.data || []).sort((a, b) => a.orderNumber - b.orderNumber);
        setTimeSlots(sortedSlots);
      } catch (err) {
        console.error('Static registry mapping error:', err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchStaticMetadata();
  }, [versionId, isPublicView, navigate]);

  // PHASE 2: Reactive Fetch Matrix
  useEffect(() => {
    if (versionId) {
      fetchFilteredSchedule();
    }
  }, [versionId, selectedGroup, selectedTeacher, selectedClassroom]);

  const fetchFilteredSchedule = async () => {
    setRefreshing(true);
    try {
      let query = `?_cacheBust=${Date.now()}`;
      if (selectedGroup) query += `&groupId=${selectedGroup}`;
      if (selectedTeacher) query += `&teacherId=${selectedTeacher}`;
      if (selectedClassroom) query += `&classroomId=${selectedClassroom}`;

      const endpointPrefix = isPublicView ? '/public' : '/schedule';
      const config = isPublicView ? { _isPublic: true } : {};

      const res = await api.get(`${endpointPrefix}/view/${versionId}${query}`, config);
      setSchedule(res.data || []);
    } catch (err) {
      console.error('Schedule matrix refresh mismatch:', err.message);
    } finally {
      setRefreshing(false);
    }
  };

  // ФУНКЦІЯ ТРАНСПОРТУ ТА СКАЧУВАННЯ EXCEL BLOB ФАЙЛУ
  const handleExportExcel = async () => {
    if (!versionId) {
      alert('Помилка: Контекст робочої версії розкладу втрачено.');
      return;
    }

    setExportLoading(true);
    try {
      const response = await api.get(`/schedule/export/excel?versionId=${versionId}`, {
        responseType: 'blob' 
      });

      const blob = new Blob([response.data], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      
      link.href = url;
      link.setAttribute('download', `Розклад_Занять_${versionId.substring(0, 8)}.xlsx`);
      document.body.appendChild(link);
      link.click();
      
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Excel serialization pass failed:', error);
      alert('Не вдалося сформувати Excel-файл. Перевірте підключення до сервера або наявність пар у сітці.');
    } finally {
      setExportLoading(false);
    }
  };

  const handleResetFilters = () => {
    setSelectedTeacher('');
    setSelectedClassroom('');
    setSelectedGroup('');
  };

  const handleCopyPublicLink = async () => {
    const publicLink = `${window.location.origin}/public/schedule/${versionId}`;
    try {
      await navigator.clipboard.writeText(publicLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Could not copy link: ', err);
    }
  };

  const getLessons = (day, slotString) => {
    return schedule.filter(s => s.dayOfWeek === day && s.timeSlot === slotString);
  };

  const hasLessonsInDay = (day) => {
    return schedule.some(s => s.dayOfWeek === day);
  };

  // --- ЛОГІКА HTML5 DRAG AND DROP ---
  const handleDragStart = (e, lesson) => {
    if (!isMethodist) return;
    e.dataTransfer.setData('text/plain', JSON.stringify(lesson));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    if (!isMethodist) return;
    e.preventDefault();
  };

  const handleDropOnCell = async (e, targetDay, targetSlotString) => {
    if (!isMethodist) return;
    e.preventDefault();
    setRefreshing(true);

    try {
      const rawData = e.dataTransfer.getData('text/plain');
      if (!rawData) return;
      const lesson = JSON.parse(rawData);

      if (lesson.dayOfWeek === targetDay && lesson.timeSlot === targetSlotString) {
        setRefreshing(false);
        return;
      }

      const payload = {
        id: lesson.id,
        dayOfWeek: targetDay,
        timeSlot: targetSlotString,
        GroupId: lesson.GroupId,
        SubjectId: lesson.SubjectId,
        TeacherId: lesson.TeacherId,
        ClassroomId: lesson.ClassroomId,
        ScheduleVersionId: versionId,
        type: lesson.type || 'Lecture',
        isOnline: lesson.isOnline || false
      };

      await api.put(`/schedule/${lesson.id}`, payload);
      await fetchFilteredSchedule();
    } catch (err) {
      alert(err.response?.data?.message || 'Помилка переміщення заняття: обмеження конфліктів бекенду.');
    } finally {
      setRefreshing(false);
    }
  };

  // --- ЛОГІКА МОДАЛЬНОГО РЕДАКТОРА КЛІТИНКИ ---
  const handleOpenCellEditor = (day, slotString, existingLesson = null) => {
    if (!isMethodist) return; 
    setModalError('');
    
    if (existingLesson) {
      setModalMode('edit');
      setEditData({
        id: existingLesson.id,
        dayOfWeek: existingLesson.dayOfWeek,
        timeSlot: existingLesson.timeSlot,
        GroupId: existingLesson.GroupId || '',
        SubjectId: existingLesson.SubjectId || '',
        TeacherId: existingLesson.TeacherId || '',
        ClassroomId: existingLesson.ClassroomId || '',
        type: existingLesson.type || 'Lecture'
      });
    } else {
      setModalMode('create');
      setEditData({
        id: null,
        dayOfWeek: day,
        timeSlot: slotString,
        GroupId: selectedGroup || (groups[0]?.id || ''),
        SubjectId: subjects[0]?.id || '',
        TeacherId: selectedTeacher || (teachers[0]?.id || ''),
        ClassroomId: selectedClassroom || (classrooms[0]?.id || ''),
        type: 'Lecture'
      });
    }
    setIsModalOpen(true);
  };

  const handleSaveLessonForm = async (e) => {
    e.preventDefault();
    setModalLoading(true);
    setModalError('');

    const payload = {
      id: editorData.id,
      dayOfWeek: editorData.dayOfWeek,
      timeSlot: editorData.timeSlot.trim(),
      GroupId: editorData.GroupId,
      SubjectId: editorData.SubjectId,
      TeacherId: editorData.TeacherId || null,
      ClassroomId: editorData.ClassroomId,
      ScheduleVersionId: versionId,
      type: editorData.type,
      isOnline: false
    };

    try {
      if (modalMode === 'edit') {
        await api.put(`/schedule/${editorData.id}`, payload);
      } else {
        await api.post('/schedule', payload);
      }
      setIsModalOpen(false);
      fetchFilteredSchedule();
    } catch (err) {
      setModalError(err.response?.data?.message || 'Критична помилка валідації на сервері (500). Перевірте конфлікт сутностей.');
    } finally {
      setModalLoading(false);
    }
  };

  const handleDeleteLesson = async (id) => {
    if (!window.confirm('Видалити це заняття з розкладу безповоротно?')) return;
    setModalLoading(true);
    try {
      await api.delete(`/schedule/${id}`);
      setIsModalOpen(false);
      fetchFilteredSchedule();
    } catch (err) {
      setModalError(err.response?.data?.message || 'Помилка видалення заняття.');
    } finally {
      setModalLoading(false);
    }
  };

  const labels = useMemo(() => {
    if (institutionType === 'School') {
      return {
        groupSelector: 'Всі класи', teacherSelector: 'Всі вчителі', classroomSelector: 'Всі кабінети',
        unitName: 'Урок', emptyState: 'Вільний урок', errorEmptyBells: 'Конфігурація дзвінків відсутня.',
        groupPrefix: 'Кл.', noLessonsMobile: 'На цей день занять не заплановано'
      };
    }
    return {
      groupSelector: 'Всі групи', teacherSelector: 'Всі викладачі', classroomSelector: 'Всі аудиторії',
      unitName: 'Пара', emptyState: 'Вільне вікно', errorEmptyBells: 'Конфігурація дзвінків ВНЗ відсутня.',
      groupPrefix: 'Гр.', noLessonsMobile: 'На цей день пар немає'
    };
  }, [institutionType]);

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
      <Loader2 className="animate-spin text-emerald-600 w-9 h-9 mb-3" />
      <p className="text-slate-400 font-bold text-[11px] uppercase tracking-wider">Компіляція координаційної сітки...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6 text-slate-700 text-left w-full font-sans antialiased box-border">
      
      {/* HEADER CONTROL PANEL */}
      <header className="flex flex-col lg:flex-row justify-between lg:items-center gap-4 bg-white border border-slate-200 p-4 sm:p-5 rounded-xl shadow-sm">
        <div>
          {!isPublicView && (
            <button 
              type="button" onClick={() => navigate('/dashboard')} 
              className="flex items-center gap-1.5 text-slate-400 hover:text-slate-700 transition-colors text-xs font-bold uppercase tracking-wide mb-1.5 cursor-pointer group"
            >
              <ArrowLeft size={13} className="transition-transform duration-150 group-hover:-translate-x-0.5" /> 
              <span>Кабінет координатора</span>
            </button>
          )}
          <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <Calendar className="text-emerald-600 shrink-0" size={22} /> 
            <span>Екранна сітка розкладу</span>
            {refreshing && <RefreshCw size={14} className="text-emerald-600 animate-spin ml-1 shrink-0" />}
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          
          {/* НОВА ERP КНОПКА «ЕКСПОРТ В EXCEL» СЕРВІСУ МЕТОДИСТА */}
          {isMethodist && (
            <button
              type="button" disabled={exportLoading || refreshing} onClick={handleExportExcel}
              className="flex items-center justify-center gap-1.5 bg-emerald-700 hover:bg-emerald-600 disabled:bg-slate-200 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition-all shadow-sm cursor-pointer border border-transparent select-none uppercase tracking-wide shrink-0 w-full sm:w-auto"
            >
              {exportLoading ? <Loader2 size={13} className="animate-spin" /> : <FileSpreadsheet size={13} />}
              <span>{exportLoading ? 'Зведення...' : 'Експорт в Excel'}</span>
            </button>
          )}

          {!isPublicView && (
            <button
              type="button" onClick={handleCopyPublicLink}
              className={`flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer border w-full sm:w-auto ${copied ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'}`}
            >
              {copied ? (
                <><Check size={14} className="text-emerald-600" /> <span>Посилання скопійовано!</span></>
              ) : (
                <><Link2 size={14} className="text-slate-500" /> <span>Публічне посилання</span></>
              )}
            </button>
          )}

          {/* Filters */}
          <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200 flex-1 sm:flex-initial min-w-[130px]">
            <Users size={14} className="text-slate-400 shrink-0" />
            <select 
              className="bg-transparent text-xs text-slate-800 outline-none cursor-pointer pr-1 font-semibold border-none w-full"
              value={selectedGroup}
              onChange={(e) => { setSelectedGroup(e.target.value); setSelectedTeacher(''); setSelectedClassroom(''); }}
            >
              <option value="">{labels.groupSelector}</option>
              {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </div>

          <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200 flex-1 sm:flex-initial min-w-[130px]">
            <User size={14} className="text-slate-400 shrink-0" />
            <select 
              className="bg-transparent text-xs text-slate-800 outline-none cursor-pointer pr-1 font-semibold border-none w-full max-w-none sm:max-w-[160px]"
              value={selectedTeacher}
              onChange={(e) => { setSelectedTeacher(e.target.value); setSelectedGroup(''); setSelectedClassroom(''); }}
            >
              <option value="">{labels.teacherSelector}</option>
              {teachers.map(t => <option key={t.id} value={t.id}>{t.fullName}</option>)}
            </select>
          </div>

          <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200 flex-1 sm:flex-initial min-w-[130px]">
            <Building2 size={14} className="text-slate-400 shrink-0" />
            <select 
              className="bg-transparent text-xs text-slate-800 outline-none cursor-pointer pr-1 font-semibold border-none w-full"
              value={selectedClassroom}
              onChange={(e) => { setSelectedClassroom(e.target.value); setSelectedGroup(''); setSelectedTeacher(''); }}
            >
              <option value="">{labels.classroomSelector}</option>
              {classrooms.map(c => <option key={c.id} value={c.id}>Ауд. {c.number}</option>)}
            </select>
          </div>

          {(selectedGroup || selectedTeacher || selectedClassroom) && (
            <button
              type="button" onClick={handleResetFilters}
              className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors rounded-xl flex items-center justify-center cursor-pointer shadow-sm border border-slate-200 ml-auto sm:ml-0"
              title="Скинути фільтри"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </header>

      {/* 📱 MOBILE TIMELINE */}
      <section className="block md:hidden space-y-4">
        {days.map(day => {
          const hasLessons = hasLessonsInDay(day);
          return (
            <div key={day} className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
              <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200/60 flex justify-between items-center">
                <span className="font-black text-xs text-slate-900 tracking-wide uppercase">{daysTranslation[day]}</span>
              </div>

              <div className="p-3 divide-y divide-slate-100">
                {timeSlots.map((slot) => {
                  const slotString = `${slot.startTime.substring(0, 5)} - ${slot.endTime.substring(0, 5)}`;
                  const matchedLessons = getLessons(day, slotString);

                  if (matchedLessons.length === 0 && !isMethodist) return null;

                  return (
                    <div key={slot.id} className="py-3 first:pt-1 last:pb-1 flex gap-3 items-start">
                      <div className="w-16 shrink-0 pt-0.5">
                        <span className="text-[11px] font-black text-emerald-700 block leading-none">{labels.unitName} {slot.orderNumber}</span>
                        <span className="text-[9px] font-mono font-bold text-slate-400 block mt-1 flex items-center gap-0.5"><Clock size={8} /> {slotString}</span>
                      </div>

                      <div className="flex-1 space-y-2">
                        {matchedLessons.map((lesson) => (
                          <div 
                            key={lesson.id} 
                            onClick={() => handleOpenCellEditor(day, slotString, lesson)}
                            className={`bg-slate-50/50 border border-slate-200 rounded-xl p-3 relative overflow-hidden text-left ${isMethodist ? 'cursor-pointer hover:border-emerald-500 transition-colors' : ''}`}
                          >
                            <div className="absolute top-0 left-0 w-[3px] h-full bg-emerald-600"></div>
                            <h4 className="text-slate-900 font-bold text-xs leading-tight">{lesson.Subject?.name || lesson.subjectName}</h4>
                            <div className="mt-2 space-y-1 text-[10px] text-slate-500 font-medium">
                              <p className="flex items-center gap-1 text-slate-600 truncate">
                                <User size={10} className="text-slate-400 shrink-0" />
                                <span className="truncate">{lesson.Teacher?.fullName || 'Не вказано'}</span>
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </section>

      {/* 🖥️ DESKTOP GRID CANVAS */}
      <main className="hidden md:block bg-white border border-slate-200 rounded-xl p-6 shadow-sm overflow-x-auto relative">
        <table className="w-full border-collapse min-w-[900px]">
          <thead>
            <tr className="border-b border-slate-100">
              <th className="pb-4 pt-2 text-[10px] font-black text-slate-400 uppercase tracking-wider text-left w-40 pl-2">Часова шкала / Слот</th>
              {days.map(day => (
                <th key={day} className="pb-4 pt-2 text-xs font-black text-slate-900 tracking-wide text-center uppercase">{daysTranslation[day]}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {timeSlots.length === 0 ? (
              <tr><td colSpan="6" className="text-center py-20 text-xs text-slate-400 font-medium italic">{labels.errorEmptyBells}</td></tr>
            ) : (
              timeSlots.map((slot) => {
                const slotString = `${slot.startTime.substring(0, 5)} - ${slot.endTime.substring(0, 5)}`;
                return (
                  <tr key={slot.id} className="group hover:bg-slate-50/40 transition-colors">
                    <td className="py-5 pr-4 border-r border-slate-100 text-left pl-2">
                      <span className="text-sm font-black text-emerald-700 block leading-none tracking-tight">{labels.unitName} #{slot.orderNumber}</span>
                      <span className="text-[10px] font-mono font-bold text-slate-400 tracking-tight block mt-1.5">{slotString}</span>
                    </td>

                    {days.map(day => {
                      const matchedLessons = getLessons(day, slotString);
                      return (
                        <td 
                          key={day} 
                          className="p-2.5 w-1/5 text-center align-middle relative transition-all"
                          onDragOver={handleDragOver}
                          onDrop={(e) => handleDropOnCell(e, day, slotString)}
                        >
                          {matchedLessons.length > 0 ? (
                            <div className="space-y-2">
                              {matchedLessons.map((lesson) => (
                                <div 
                                  key={lesson.id} 
                                  draggable={isMethodist}
                                  onDragStart={(e) => handleDragStart(e, lesson)}
                                  onClick={() => handleOpenCellEditor(day, slotString, lesson)}
                                  className={`bg-white border border-slate-200 rounded-xl p-3.5 text-left shadow-sm relative overflow-hidden min-h-[115px] flex flex-col justify-between select-none ${isMethodist ? 'cursor-grab active:cursor-grabbing hover:border-emerald-500 hover:shadow-md transition-all duration-150' : ''}`}
                                >
                                  <div className="absolute top-0 left-0 w-[3px] h-full bg-emerald-600"></div>
                                  
                                  {isMethodist && (
                                    <div className="absolute top-2 right-2 text-slate-300 group-hover:text-slate-400">
                                      <Move size={10} />
                                    </div>
                                  )}

                                  <h4 className="text-slate-900 font-bold text-xs tracking-tight leading-snug line-clamp-2 pr-2">{lesson.Subject?.name || 'Навчальна дисципліна'}</h4>
                                  
                                  <div className="space-y-1.5 text-[10px] text-slate-400 font-semibold mt-2 pt-2 border-t border-slate-50">
                                    <p className="flex items-center gap-1 text-slate-600 truncate">
                                      <User size={11} className="text-slate-400 shrink-0" /> 
                                      <span className="font-medium truncate">{lesson.Teacher?.fullName || 'Не вказано'}</span>
                                    </p>
                                    <div className="flex justify-between items-center text-[9px] font-mono font-bold pt-0.5">
                                      <span className="text-emerald-700 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded font-bold">Ауд. {lesson.Classroom?.number || '—'}</span>
                                      <span className="text-slate-500 tracking-wider uppercase bg-slate-100 px-1.5 py-0.5 rounded">{labels.groupPrefix} {lesson.Group?.name || '—'}</span>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            isMethodist ? (
                              <button 
                                type="button" onClick={() => handleOpenCellEditor(day, slotString)}
                                className="w-full h-[115px] rounded-xl border border-dashed border-slate-200 hover:border-emerald-500 flex items-center justify-center text-slate-400 hover:text-emerald-600 text-[10px] font-bold italic transition-all bg-slate-50/10 hover:bg-white cursor-pointer"
                              >
                                <Plus size={14} className="mr-1" /> Призначити
                              </button>
                            ) : (
                              <div className="h-[115px] rounded-xl border border-dashed border-slate-200 flex items-center justify-center text-slate-400 text-[10px] font-semibold italic bg-slate-50/20">{labels.emptyState}</div>
                            )
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </main>

      {/* 🔐 MODAL EDITOR */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-100">
          <div className="bg-white p-6 rounded-2xl max-w-md w-full border border-slate-200 shadow-xl relative text-left overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-emerald-600"></div>
            
            <button type="button" onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1"><X size={16} /></button>
            
            <div className="mb-4">
              <h3 className="text-base font-black text-slate-900 tracking-tight">
                {modalMode === 'edit' ? 'Коригування заняття' : 'Вручну призначити заняття'}
              </h3>
              <p className="text-[10px] text-slate-400 font-mono mt-0.5 uppercase tracking-wide">
                {daysTranslation[editorData.dayOfWeek]} • {editorData.timeSlot}
              </p>
            </div>

            {modalError && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs font-semibold">{modalError}</div>}

            <form onSubmit={handleSaveLessonForm} className="space-y-4">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase block mb-1">Дисципліна / Предмет</label>
                <select 
                  required className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 outline-none focus:bg-white font-medium"
                  value={editorData.SubjectId} onChange={(e) => setEditData({...editorData, SubjectId: e.target.value})}
                >
                  <option value="">— Оберіть предмет —</option>
                  {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase block mb-1">{labels.groupPrefix === 'Кл.' ? 'Клас навчання' : 'Академічна група'}</label>
                <select 
                  required className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 outline-none focus:bg-white font-medium"
                  value={editorData.GroupId} onChange={(e) => setEditData({...editorData, GroupId: e.target.value})}
                >
                  <option value="">— Оберіть групу —</option>
                  {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase block mb-1">Викладач / Вчитель</label>
                <select 
                  required className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 outline-none focus:bg-white font-medium"
                  value={editorData.TeacherId} onChange={(e) => setEditData({...editorData, TeacherId: e.target.value})}
                >
                  <option value="">— Не вказано —</option>
                  {teachers.map(t => <option key={t.id} value={t.id}>{t.fullName}</option>)}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase block mb-1">Аудиторія / Кабінет</label>
                <select 
                  required className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 outline-none focus:bg-white font-medium"
                  value={editorData.ClassroomId} onChange={(e) => setEditData({...editorData, ClassroomId: e.target.value})}
                >
                  <option value="">— Оберіть кабінет —</option>
                  {classrooms.map(c => <option key={c.id} value={c.id}>Кабінет {c.number}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase block mb-1">Формат заняття</label>
                  <select 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs text-slate-800 font-bold outline-none"
                    value={editorData.type} onChange={(e) => setEditData({...editorData, type: e.target.value})}
                  >
                    <option value="Lecture">Лекція</option>
                    <option value="Practice">Практика</option>
                    <option value="Laboratory">Лабораторна</option>
                  </select>
                </div>
                
                <div className="flex items-end justify-end gap-2">
                  {modalMode === 'edit' && (
                    <button 
                      type="button" disabled={modalLoading} onClick={() => handleDeleteLesson(editorData.id)}
                      className="p-2.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl border border-red-100 cursor-pointer transition-colors"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                  <button 
                    type="submit" disabled={modalLoading}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs py-2.5 flex items-center justify-center gap-1.5 cursor-pointer uppercase tracking-wider"
                  >
                    {modalLoading ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                    <span>{modalMode === 'edit' ? 'Оновити' : 'Зберегти'}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScheduleView;