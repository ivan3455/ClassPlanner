import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { Plus, Trash2, ArrowRight, ArrowLeft, Timer, Loader2, AlertCircle, Sparkles } from 'lucide-react';

const translations = {
  ua: {
    labelStart: 'Час початку',
    labelEnd: 'Час закінчення',
    btnBack: 'Назад до аудиторій',
    btnNext: 'Зберегти та перейти далі',
    validationEmpty: 'містить незаповнені часових межі.',
    validationChrono: 'Час початку не може бути пізнішим за час закінчення.',
    validationOverlap: 'накладається на час попереднього заняття.',
    errSave: 'Помилка збереження конфігурації часових меж.',

    // Шкільні маркери
    schoolTitle: 'Розклад дзвінків (Уроки)',
    schoolDesc: 'Визначте часові межі уроків. Правильно налаштовані перерви та тривалість занять (45 хв) забезпечать дотримання санітарних норм для учнів.',
    schoolUnit: 'Урок',
    schoolAdd: 'Додати урок',
    schoolTemplate: 'Шкільний розклад дзвінків',
    schoolEmpty: 'Часова сітка уроків порожня. Додайте урок або завантажте стандартний шкільний шаблон.',

    // Університетські маркери
    uniTitle: 'Розклад дзвінків (Академічні пари)',
    uniDesc: 'Визначте часові межі пар (80 хв). Вони стануть базовими дискретними доменами для розрахунку ядра CSP.',
    uniUnit: 'Пара',
    uniAdd: 'Додати пару',
    uniTemplate: 'Університетська сітка пар',
    uniEmpty: 'Часова сітка пар порожня. Додайте пару або завантажте базовий шаблон дзвінків ВНЗ.'
  },
  en: {
    labelStart: 'Start Time',
    labelEnd: 'End Time',
    btnBack: 'Back to Classrooms',
    btnNext: 'Save & Continue',
    validationEmpty: 'has incomplete time slot field nodes.',
    validationChrono: 'Start time cannot be later or equal to end time.',
    validationOverlap: 'overlaps with the duration timeframe of the previous entry.',
    errSave: 'Failed to write bell schedule records to database context.',

    // Шкільні маркери (EN)
    schoolTitle: 'Bell Schedule (Lessons)',
    schoolDesc: 'Define the strict time slots for lessons. Properly aligned shifts and break slots (45 min duration) sustain sanitary conditions for school pupils.',
    schoolUnit: 'Lesson',
    schoolAdd: 'Add Lesson',
    schoolTemplate: 'School Bells Template',
    schoolEmpty: 'Lesson timeline matrix is empty. Insert a slot or deploy the pre-made school template.',

    // Університетські маркери (EN)
    uniTitle: 'Bell Schedule (Academic Pairs)',
    uniDesc: 'Establish structural time slices for double periods (80 min). These act as essential isolated domains for CSP core processing.',
    uniUnit: 'Pair',
    uniAdd: 'Add Pair',
    uniTemplate: 'University Grid Template',
    uniEmpty: 'Academic pair matrix is empty. Register a pair slot or hydrate the base higher-ed template.'
  }
};

const Step3 = () => {
  const lang = localStorage.getItem('lang') || 'ua';
  const t = translations[lang];

  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [validationError, setValidationError] = useState('');
  const navigate = useNavigate();
  
  const versionId = localStorage.getItem('currentScheduleVersion');
  const user = useMemo(() => JSON.parse(localStorage.getItem('user')) || {}, []);
  const institutionType = user.Institution?.type || 'University';

  useEffect(() => {
    if (!versionId) {
      navigate('/setup/step1');
      return;
    }
    fetchTimeSlots();
  }, [versionId]);

  const fetchTimeSlots = async () => {
    try {
      const res = await api.get(`/time-settings/${versionId}`);
      const sortedSlots = (res.data || []).sort((a, b) => a.orderNumber - b.orderNumber);
      setSlots(sortedSlots);
    } catch (err) {
      console.error('Failed to sync time slots:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const labels = useMemo(() => {
    if (institutionType === 'School') {
      return {
        title: t.schoolTitle,
        desc: t.schoolDesc,
        unitName: t.schoolUnit,
        addButton: t.schoolAdd,
        autofillTemplate: t.schoolTemplate,
        emptyState: t.schoolEmpty
      };
    }
    return {
      title: t.uniTitle,
      desc: t.uniDesc,
      unitName: t.uniUnit,
      addButton: t.uniAdd,
      autofillTemplate: t.uniTemplate,
      emptyState: t.uniEmpty
    };
  }, [institutionType, t]);

  const addSlot = () => {
    setValidationError('');
    const nextNumber = slots.length + 1;
    setSlots([...slots, { orderNumber: nextNumber, startTime: '', endTime: '', ScheduleVersionId: versionId }]);
  };

  const removeSlot = (index) => {
    setValidationError('');
    const newSlots = slots.filter((_, i) => i !== index)
      .map((slot, i) => ({ ...slot, orderNumber: i + 1 }));
    setSlots(newSlots);
  };

  const handleAutoFill = () => {
    setValidationError('');
    const templates = institutionType === 'School' 
      ? [
          { orderNumber: 1, startTime: '08:30', endTime: '09:15' },
          { orderNumber: 2, startTime: '09:25', endTime: '10:10' },
          { orderNumber: 3, startTime: '10:30', endTime: '11:15' },
          { orderNumber: 4, startTime: '11:35', endTime: '12:20' },
          { orderNumber: 5, startTime: '12:30', endTime: '13:15' },
          { orderNumber: 6, startTime: '13:25', endTime: '14:10' }
        ]
      : [
          { orderNumber: 1, startTime: '08:30', endTime: '09:50' },
          { orderNumber: 2, startTime: '10:05', endTime: '11:25' }, 
          { orderNumber: 3, startTime: '11:40', endTime: '13:00' }, 
          { orderNumber: 4, startTime: '13:15', endTime: '14:35' }, 
          { orderNumber: 5, startTime: '14:50', endTime: '16:10' }
        ];

    setSlots(templates.map(slot => ({ ...slot, ScheduleVersionId: versionId })));
  };

  const validateGridChronology = () => {
    for (let i = 0; i < slots.length; i++) {
      const slot = slots[i];
      if (!slot.startTime || !slot.endTime) {
        return `${labels.unitName} №${slot.orderNumber} ${t.validationEmpty}`;
      }
      if (slot.startTime >= slot.endTime) {
        return `${labels.unitName} №${slot.orderNumber}: ${t.validationChrono}`;
      }
      if (i > 0) {
        const prevSlot = slots[i - 1];
        if (slot.startTime < prevSlot.endTime) {
          return `${labels.unitName} №${slot.orderNumber} ${t.validationOverlap}`;
        }
      }
    }
    return null;
  };

  const handleSave = async () => {
    setValidationError('');
    const errorMsg = validateGridChronology();
    if (errorMsg) {
      setValidationError(errorMsg);
      return;
    }
    setSaving(true);
    try {
      await api.post('/time-settings/bulk', { versionId, slots });
      navigate('/setup/step4'); 
    } catch (err) {
      setValidationError(err.response?.data?.message || t.errSave);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="flex justify-center p-20 w-full bg-white">
      <Loader2 className="animate-spin text-emerald-600" size={32} />
    </div>
  );

  return (
    <div className="space-y-6 text-left animate-in fade-in duration-200 select-none text-slate-700 w-full antialiased font-sans">
      <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-4 mb-2">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">{labels.title}</h2>
          <p className="text-slate-400 text-xs mt-1 leading-relaxed">{labels.desc}</p>
        </div>
        
        <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
          {slots.length === 0 && (
            <button 
              type="button" onClick={handleAutoFill} 
              className="px-3.5 h-9 bg-slate-100 border border-slate-200 text-emerald-700 font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer transition-colors shadow-sm"
            >
              <Sparkles size={13} /> 
              <span>{labels.autofillTemplate}</span>
            </button>
          )}
          <button 
            type="button" onClick={addSlot} 
            className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 h-9 rounded-xl font-bold text-xs flex items-center gap-2 cursor-pointer transition-colors shadow-sm"
          >
            <Plus size={14} /> 
            <span>{labels.addButton}</span>
          </button>
        </div>
      </div>

      {validationError && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs font-semibold flex items-center gap-2">
          <AlertCircle size={14} className="shrink-0" />
          <p>{validationError}</p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-3.5 mb-4">
        {slots.length === 0 ? (
          <div className="text-center py-16 bg-slate-50 border border-slate-200 rounded-xl">
            <Timer className="mx-auto text-slate-300 mb-2" size={36} />
            <p className="text-slate-400 text-xs italic font-semibold max-w-sm mx-auto leading-relaxed">{labels.emptyState}</p>
          </div>
        ) : (
          slots.map((slot, index) => (
            <div key={index} className="bg-white border border-slate-200 p-4 rounded-xl flex items-center gap-5 shadow-sm group hover:border-emerald-500 transition-colors">
              <div className="flex items-center justify-center w-9 h-9 bg-emerald-50 border border-emerald-100 rounded-lg text-emerald-700 font-black text-base shrink-0">
                {slot.orderNumber}
              </div>
              
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1 block pl-0.5">{t.labelStart}</label>
                  <input 
                    type="time" required disabled={saving} 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs text-slate-800 focus:border-emerald-500 outline-none font-mono font-bold disabled:opacity-50" 
                    value={slot.startTime} 
                    onChange={(e) => {
                      setValidationError('');
                      const newSlots = [...slots];
                      newSlots[index].startTime = e.target.value;
                      setSlots(newSlots);
                    }} 
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1 block pl-0.5">{t.labelEnd}</label>
                  <input 
                    type="time" required disabled={saving} 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs text-slate-800 focus:border-emerald-500 outline-none font-mono font-bold disabled:opacity-50" 
                    value={slot.endTime} 
                    onChange={(e) => {
                      setValidationError('');
                      const newSlots = [...slots];
                      newSlots[index].endTime = e.target.value;
                      setSlots(newSlots);
                    }} 
                  />
                </div>
              </div>
              
              <button 
                type="button" onClick={() => removeSlot(index)} disabled={saving} 
                className="p-2 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 cursor-pointer shrink-0 transition-colors"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))
        )}
      </div>

      <div className="flex justify-between items-center pt-5 border-t border-slate-100">
        <button 
          type="button" onClick={() => navigate('/setup/step2')} disabled={saving} 
          className="flex items-center gap-1.5 text-slate-400 hover:text-slate-800 font-bold text-xs cursor-pointer transition-colors"
        >
          <ArrowLeft size={14} /> 
          <span>{t.btnBack}</span>
        </button>
        
        <button 
          type="button" onClick={handleSave} disabled={saving || slots.length === 0} 
          className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-100 disabled:text-slate-400 text-white font-bold px-5 py-2.5 rounded-xl shadow-sm flex items-center gap-2 text-sm cursor-pointer transition-colors"
        >
          {saving ? <Loader2 className="animate-spin" size={16} /> : (
            <>
              <span>{t.btnNext}</span>
              <ArrowRight size={14} />
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default Step3;