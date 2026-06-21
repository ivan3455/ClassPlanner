import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { ArrowLeft, CheckCircle, Send, School, User, Mail, MessageSquare, AlertCircle, Loader2, Landmark, Languages } from 'lucide-react';

const translations = {
  ua: {
    back: 'Назад до входу',
    title: 'Реєстрація навчального закладу',
    subtitle: 'Заповніть форму нижче, щоб подати заявку на підключення вашої установи до системи.',
    instName: 'Назва навчального закладу',
    instType: 'Тип установи',
    typeUni: 'Університет / Інститут',
    typeSchool: 'Школа / Ліцей / Гімназія',
    typeCollege: 'Коледж / Технікум',
    fullName: 'Повне ім’я (ПІБ методиста)',
    email: 'Електронна пошта',
    comment: 'Додаткова інформація / Коментар',
    btnSubmit: 'Надіслати заявку на підключення',
    successTitle: 'Заявку прийнято!',
    successDesc: 'Заявку для закладу "{name}" успішно надіслано. Вона буде налаштована під потреби обраного типу установи. Відповідь надійде на пошту {email}.',
    btnBack: 'Повернутися на головну',
    errorDefault: 'Не вдалося надіслати заявку. Перевірте з’єднання з сервером.'
  },
  en: {
    back: 'Back to login',
    title: 'Register Institution',
    subtitle: 'Fill out the form below to submit a connection request for your institution to the system.',
    instName: 'Institution Name',
    instType: 'Institution Type',
    typeUni: 'University / Institute',
    typeSchool: 'School / Lyceum / Gymnasium',
    typeCollege: 'College / Technical School',
    fullName: 'Full Name (Methodist)',
    email: 'Email Address',
    comment: 'Additional Information / Comment',
    btnSubmit: 'Submit Request',
    successTitle: 'Request Submitted!',
    successDesc: 'Request for "{name}" has been successfully sent. It will be configured for the selected institution type. The response will be sent to {email}.',
    btnBack: 'Back to Login',
    errorDefault: 'Failed to send request. Please check your server connection.'
  }
};

const RequestAccess = () => {
  const [lang, setLang] = useState('ua');
  const t = translations[lang];

  const [formData, setFormData] = useState({
    instName: '',
    instType: 'University',
    methodistName: '',
    methodistEmail: '',
    comment: ''
  });

  const [status, setStatus] = useState('idle'); // 'idle' | 'loading' | 'success' | 'error'
  const [errorMessage, setErrorMessage] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const toggleLang = () => {
    setLang(lang === 'ua' ? 'en' : 'ua');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('loading');
    setErrorMessage('');

    const sanitizedData = {
      instName: formData.instName.trim(),
      instType: formData.instType,
      methodistName: formData.methodistName.trim(),
      methodistEmail: formData.methodistEmail.trim().toLowerCase(),
      comment: formData.comment.trim()
    };

    try {
      await api.post('/public/request-institution', sanitizedData);
      setStatus('success');
    } catch (err) {
      setStatus('error');
      setErrorMessage(err.response?.data?.message || t.errorDefault);
      console.error('Request Access Error:', err.message);
    }
  };

  // ЕКРАН УСПІШНОГО ВІДПРАВЛЕННЯ (Світлий)
  if (status === 'success') {
    return (
      <div className="min-h-screen w-screen bg-slate-50 flex items-center justify-center p-4 md:overflow-hidden select-none antialiased font-sans">
        <div className="max-w-md w-full bg-white border border-slate-200 p-6 md:p-8 rounded-2xl text-center shadow-sm">
          <div className="w-14 h-14 bg-emerald-50 rounded-xl flex items-center justify-center mx-auto mb-5">
            <CheckCircle className="text-emerald-600 w-7 h-7" />
          </div>
          
          <h2 className="text-xl font-bold text-slate-900 mb-2">{t.successTitle}</h2>
          
          <p className="text-slate-600 mb-6 text-sm leading-relaxed px-2">
            {t.successDesc
              .replace('{name}', formData.instName.trim())
              .replace('{email}', formData.methodistEmail.trim().toLowerCase())}
          </p>
          
          <button 
            onClick={() => navigate('/')} 
            className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl transition-colors text-sm cursor-pointer"
          >
            {t.btnBack}
          </button>
        </div>
      </div>
    );
  }

  // ГОЛОВНИЙ ЕКРАН ФОРМИ (Світлий Clean UI)
  return (
    <div className="h-screen w-screen bg-slate-50 flex items-center justify-center p-0 sm:p-4 overflow-y-auto md:overflow-hidden select-none antialiased font-sans">
      <div className="max-w-xl w-full bg-white border-0 sm:border border-slate-200 p-6 sm:p-8 rounded-none sm:rounded-2xl shadow-sm relative min-h-screen sm:min-h-0 flex flex-col justify-center sm:block">
        
        {/* Верхня панель дій */}
        <div className="flex items-center justify-between mb-5 sm:mb-6">
          <button 
            onClick={() => navigate('/login')} 
            className="flex items-center gap-2 text-slate-500 hover:text-slate-800 text-sm font-medium transition-colors cursor-pointer"
          >
            <ArrowLeft size={16} /> 
            <span>{t.back}</span>
          </button>

          <button 
            type="button"
            onClick={toggleLang}
            className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900 border border-slate-200 hover:border-slate-300 px-2.5 py-1.5 rounded-lg bg-white transition-colors cursor-pointer"
          >
            <Languages size={14} />
            <span className="uppercase font-semibold">{lang === 'ua' ? 'en' : 'ua'}</span>
          </button>
        </div>
        
        {/* Блок заголовка */}
        <div className="mb-5">
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight mb-1">{t.title}</h2>
          <p className="text-slate-500 text-xs leading-relaxed">
            {t.subtitle}
          </p>
        </div>

        {/* Обробка помилок сервера */}
        {status === 'error' && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-red-600 text-xs leading-normal">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <p>{errorMessage}</p>
          </div>
        )}

        {/* Форма введення даних */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          
          {/* Ряд: Назва закладу та Його тип */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            <div className="md:col-span-2">
              <label className="block text-slate-500 text-[10px] font-semibold uppercase tracking-wider mb-1 pl-1">{t.instName}</label>
              <div className="relative">
                <School className="absolute left-3.5 top-2.5 text-slate-400" size={16} />
                <input 
                  name="instName"
                  type="text" 
                  required 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-10 pr-4 text-slate-900 text-sm outline-none focus:border-emerald-500 focus:bg-white transition-colors placeholder:text-slate-400"
                  value={formData.instName}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-500 text-[10px] font-semibold uppercase tracking-wider mb-1 pl-1">{t.instType}</label>
              <div className="relative">
                <Landmark className="absolute left-3.5 top-2.5 text-slate-400" size={16} />
                <select
                  name="instType"
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-10 pr-8 text-slate-900 text-sm outline-none focus:border-emerald-500 focus:bg-white transition-colors cursor-pointer appearance-none"
                  value={formData.instType}
                  onChange={handleChange}
                >
                  <option value="University" className="bg-white">{t.typeUni}</option>
                  <option value="School" className="bg-white">{t.typeSchool}</option>
                  <option value="College" className="bg-white">{t.typeCollege}</option>
                </select>
                <div className="absolute right-3.5 top-3.5 pointer-events-none w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[4px] border-t-slate-400"></div>
              </div>
            </div>
          </div>

          {/* Ряд: ПІБ методиста та Його Email */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-slate-500 text-[10px] font-semibold uppercase tracking-wider mb-1 pl-1">{t.fullName}</label>
              <div className="relative">
                <User className="absolute left-3.5 top-2.5 text-slate-400" size={16} />
                <input 
                  name="methodistName"
                  type="text" 
                  required 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-10 pr-4 text-slate-900 text-sm outline-none focus:border-emerald-500 focus:bg-white transition-colors placeholder:text-slate-400"
                  value={formData.methodistName}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-500 text-[10px] font-semibold uppercase tracking-wider mb-1 pl-1">{t.email}</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-2.5 text-slate-400" size={16} />
                <input 
                  name="methodistEmail"
                  type="email" 
                  required 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-10 pr-4 text-slate-900 text-sm outline-none focus:border-emerald-500 focus:bg-white transition-colors placeholder:text-slate-400"
                  value={formData.methodistEmail}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          {/* Поле: Коментар */}
          <div>
            <label className="block text-slate-500 text-[10px] font-semibold uppercase tracking-wider mb-1 pl-1">{t.comment}</label>
            <div className="relative">
              <MessageSquare className="absolute left-3.5 top-2.5 text-slate-400" size={16} />
              <textarea 
                name="comment"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-10 pr-4 text-slate-900 text-sm outline-none focus:border-emerald-500 focus:bg-white transition-colors min-h-[65px] max-h-[65px] resize-none"
                value={formData.comment}
                onChange={handleChange}
              ></textarea>
            </div>
          </div>
          
          {/* Головна кнопка відправки — Смарагдовий акцент */}
          <button 
            type="submit" 
            disabled={status === 'loading'}
            className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-medium py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm cursor-pointer mt-2"
          >
            {status === 'loading' ? (
              <Loader2 className="animate-spin" size={16} />
            ) : (
              <>
                <Send size={14} />
                <span>{t.btnSubmit}</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default RequestAccess;