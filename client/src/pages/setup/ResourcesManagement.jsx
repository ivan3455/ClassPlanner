import { useState, useEffect } from 'react';
import InlineResourceGrid from './InlineResourceGrid';
import { Landmark, School, ClipboardList, AlertCircle } from 'lucide-react';

const translations = {
  ua: {
    title: 'Глобальний довідник інфраструктури та ресурсів',
    subtitle: 'Пряме табличне редагування та модифікація даних аудиторного фонду, контингенту груп та матриці навантаження семестру',
    tabClassrooms: 'Аудиторії / Кабінети',
    tabGroups: 'Групи / Класи',
    tabCurriculum: 'Матриця навантаження годин',
    noVersionTitle: 'Не обрано активну робочу версію розкладу',
    noVersionSubtitle: 'Перейдіть до розділу "Контроль версій" або скористайтеся Майстром налаштування, щоб активувати контекст планування.'
  },
  en: {
    title: 'Global Infrastructure & Resource Directory',
    subtitle: 'Direct inline grid modification of auditorium fund, student groups, and semester hourly load distributions',
    tabClassrooms: 'Auditoriums / Rooms',
    tabGroups: 'Groups / Classes',
    tabCurriculum: 'Hourly Load Matrix',
    noVersionTitle: 'No Active Schedule Version Selected',
    noVersionSubtitle: 'Please navigate to "Versions Control" or utilize the Setup Wizard to initialize a valid planning context.'
  }
};

const registryColumnsConfig = {
  classrooms: [
    { key: 'number', label: { ua: 'Номер / Назва', en: 'Room Number' }, type: 'text', placeholder: '304, Лаб. ШІ' },
    { key: 'type', label: { ua: 'Тип приміщення', en: 'Room Type' }, type: 'select', options: ['Lecture', 'Laboratory', 'Practice', 'Universal'] },
    { key: 'capacity', label: { ua: 'Місткість (чол.)', en: 'Capacity' }, type: 'number', placeholder: '30' },
    { key: 'isAvailable', label: { ua: 'Доступність', en: 'Status' }, type: 'boolean' }
  ],
  groups: [
    { key: 'name', label: { ua: 'Назва групи / класу', en: 'Group Name' }, type: 'text', placeholder: 'КН-301, 11-А' },
    { key: 'studentCount', label: { ua: 'Кіл-сть студентів', en: 'Students Count' }, type: 'number', placeholder: '25' }
    // Поле зміна навчання (shift) успішно вилучено з конфігурації ERP-матриці
  ],
  curriculum: [
    { key: 'subjectName', isSubjectInput: true, relationKey: 'Subject', label: { ua: 'Дисципліна / Предмет', en: 'Subject Name' }, type: 'text', placeholder: 'Вища математика, Алгебра' },
    { key: 'GroupId', relationKey: 'Group', label: { ua: 'Академічна група', en: 'Target Group' }, type: 'asyncSelect', entity: 'groups' },
    { key: 'TeacherId', relationKey: 'RecommendedTeacher', label: { ua: 'Закріплений викладач', en: 'Assigned Teacher' }, type: 'asyncSelect', entity: 'teachers' },
    { key: 'lectureHours', label: { ua: 'Лекції (год/тиждень)', en: 'Lectures (h/w)' }, type: 'number', placeholder: '2' },
    { key: 'practiceHours', label: { ua: 'Практики (год/тиждень)', en: 'Practices (h/w)' }, type: 'number', placeholder: '0' },
    { key: 'labHours', label: { ua: 'Лабораторні (год/тиждень)', en: 'Labs (h/w)' }, type: 'number', placeholder: '0' }
  ]
};

const ResourcesManagement = () => {
  const [lang, setLang] = useState(localStorage.getItem('lang') || 'ua');
  const t = translations[lang];
  const [activeTab, setActiveTab] = useState('classrooms');
  const [currentVersionId, setCurrentVersionId] = useState(localStorage.getItem('currentScheduleVersion') || '');

  useEffect(() => {
    const handleLangChange = (e) => setLang(e.detail);
    window.addEventListener('appLangChanged', handleLangChange);
    
    const handleVersionChange = () => {
      setCurrentVersionId(localStorage.getItem('currentScheduleVersion') || '');
    };
    window.addEventListener('currentVersionChanged', handleVersionChange);

    return () => {
      window.removeEventListener('appLangChanged', handleLangChange);
      window.removeEventListener('currentVersionChanged', handleVersionChange);
    };
  }, []);

  if (!currentVersionId) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center text-center p-6 bg-white border border-dashed border-slate-200 rounded-xl max-w-4xl mx-auto my-10 shadow-xs">
        <div className="p-3 bg-amber-50 text-amber-600 rounded-full mb-4 animate-bounce">
          <AlertCircle size={28} />
        </div>
        <h3 className="text-base font-black text-slate-900 tracking-tight">{t.noVersionTitle}</h3>
        <p className="text-slate-500 text-xs mt-1.5 leading-relaxed max-w-md">{t.noVersionSubtitle}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-left antialiased font-sans w-full text-slate-700 p-1 animate-in fade-in duration-150">
      <div className="flex flex-col lg:flex-row justify-between lg:items-center border-b border-slate-200 pb-4 gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <Landmark className="text-emerald-600" size={24} /> 
            <span>{t.title}</span>
          </h1>
          <p className="text-slate-500 text-xs mt-1 leading-relaxed max-w-3xl">{t.subtitle}</p>
        </div>

        <div className="bg-slate-100 p-1 rounded-xl border border-slate-200 flex flex-wrap sm:flex-nowrap gap-1 sm:w-auto w-full shrink-0">
          <button 
            type="button" onClick={() => setActiveTab('classrooms')}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${activeTab === 'classrooms' ? 'bg-white text-emerald-700 shadow-sm border border-slate-200/40' : 'text-slate-500 hover:text-slate-800'}`}
          >
            <Landmark size={14} /> <span>{t.tabClassrooms}</span>
          </button>
          
          <button 
            type="button" onClick={() => setActiveTab('groups')}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${activeTab === 'groups' ? 'bg-white text-emerald-700 shadow-sm border border-slate-200/40' : 'text-slate-500 hover:text-slate-800'}`}
          >
            <School size={14} /> <span>{t.tabGroups}</span>
          </button>
          
          <button 
            type="button" onClick={() => setActiveTab('curriculum')}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${activeTab === 'curriculum' ? 'bg-white text-emerald-700 shadow-sm border border-slate-200/40' : 'text-slate-500 hover:text-slate-800'}`}
          >
            <ClipboardList size={14} /> <span>{t.tabCurriculum}</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-2 shadow-xs">
        <InlineResourceGrid 
          resourceType={activeTab} 
          versionId={currentVersionId} 
          columns={registryColumnsConfig[activeTab]} 
          lang={lang} 
        />
      </div>
    </div>
  );
};

export default ResourcesManagement;