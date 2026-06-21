import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { School, Lock, Mail, Loader2, LogIn, Languages } from 'lucide-react';

// Словник локалізації (UA / EN)
const translations = {
  ua: {
    title: 'Увійдіть у ваш робочий кабінет',
    email: 'Електронна пошта',
    password: 'Пароль',
    rememberMe: "Запам'ятати мене на цьому пристрої",
    btnSubmit: 'Авторизуватися',
    btnRequest: 'Подати заявку на підключення закладу',
    errorDefault: 'Невірний Email або пароль. Спробуйте знову.'
  },
  en: {
    title: 'Sign in to your account',
    email: 'Email Address',
    password: 'Password',
    rememberMe: 'Remember me on this device',
    btnSubmit: 'Sign In',
    btnRequest: 'Submit institution registration request',
    errorDefault: 'Invalid Email or password. Please try again.'
  }
};

const LoginPage = () => {
  const [lang, setLang] = useState('ua'); 
  const t = translations[lang];

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState('idle'); // 'idle' | 'loading'
  const [error, setError] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const navigate = useNavigate();

  // AUTHENTICATION GUEST GUARD: Перехоплювач активної сесії
  useEffect(() => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    const rawUser = localStorage.getItem('user') || sessionStorage.getItem('user');

    if (token && rawUser) {
      try {
        const user = JSON.parse(rawUser);
        if (user.role === 'SuperAdmin') {
          navigate('/superadmin/dashboard', { replace: true });
        } else if (user.role === 'Methodist' || user.role === 'Teacher') {
          navigate('/dashboard', { replace: true });
        }
      } catch (e) {
        console.error('Guest Guard: Damaged profile trace detected. Holding gate open.');
      }
    }
  }, [navigate]);

  const toggleLang = () => {
    setLang(lang === 'ua' ? 'en' : 'ua');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setStatus('loading');
    setError('');

    try {
      const res = await api.post('/auth/login', {
        email: email.trim().toLowerCase(),
        password,
        rememberMe
      });
      const { token, user } = res.data;

      localStorage.removeItem('token');
      localStorage.removeItem('user');
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('user');

      const storage = rememberMe ? localStorage : sessionStorage;
      storage.setItem('token', token);
      storage.setItem('user', JSON.stringify(user));

      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      if (user.role === 'SuperAdmin') {
        navigate('/superadmin/dashboard', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    } catch (err) {
      setStatus('idle');
      setError(err.response?.data?.message || t.errorDefault);
    }
  };

  return (
    <div className="h-screen w-screen bg-slate-50 flex items-center justify-center p-0 sm:p-4 overflow-y-auto md:overflow-hidden select-none antialiased font-sans">
      <div className="max-w-md w-full bg-white border-0 sm:border border-slate-200 p-6 sm:p-8 rounded-none sm:rounded-2xl shadow-sm relative min-h-screen sm:min-h-0 flex flex-col justify-center sm:block">
        
        {/* Кнопка зміни мови локалізації — адаптована під мобільні відступи */}
        <div className="absolute top-4 right-4 sm:top-5 sm:right-5 z-10">
          <button 
            type="button"
            onClick={toggleLang}
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900 border border-slate-200 px-2.5 py-1.5 rounded-lg bg-white transition-colors cursor-pointer"
          >
            <Languages size={14} />
            <span className="uppercase font-semibold">{lang === 'ua' ? 'en' : 'ua'}</span>
          </button>
        </div>

        {/* Блок Брендингу / Логотипу */}
        <div className="text-center mb-5 sm:mb-6 mt-4 sm:mt-0">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200 mb-3">
            <School className="text-emerald-600 w-6 h-6" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">ClassPlanner</h2>
          <p className="mt-1 text-slate-500 text-xs px-4 sm:px-0">{t.title}</p>
        </div>

        {/* Повідомлення про помилки валідації */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs font-medium text-left">
            {error}
          </div>
        )}

        {/* Форма введення облікових даних */}
        <form className="space-y-4" onSubmit={handleLogin}>
          
          <div>
            <label className="block text-slate-500 text-[10px] font-semibold uppercase tracking-wider mb-1 pl-1">{t.email}</label>
            <div className="relative text-left">
              <Mail className="absolute left-3.5 top-2.5 text-slate-400" size={16} />
              <input 
                type="email" 
                required 
                disabled={status === 'loading'}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-10 pr-4 text-slate-900 text-sm outline-none focus:border-emerald-500 focus:bg-white transition-colors placeholder:text-slate-400 disabled:opacity-50 disabled:cursor-not-allowed"
                value={email} 
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-500 text-[10px] font-semibold uppercase tracking-wider mb-1 pl-1">{t.password}</label>
            <div className="relative text-left">
              <Lock className="absolute left-3.5 top-2.5 text-slate-400" size={16} />
              <input 
                type="password" 
                required 
                disabled={status === 'loading'}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-10 pr-4 text-slate-900 text-sm outline-none focus:border-emerald-500 focus:bg-white transition-colors placeholder:text-slate-400 disabled:opacity-50 disabled:cursor-not-allowed"
                value={password} 
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {/* Чекбокс запам'ятовування сесії JWT */}
          <div className="flex items-center justify-between px-0.5 select-none pt-0.5">
            <label className="flex items-center gap-2 text-xs text-slate-500 font-medium cursor-pointer hover:text-slate-800 transition-colors">
              <input 
                type="checkbox"
                disabled={status === 'loading'}
                className="w-4 h-4 rounded bg-white border-slate-200 text-emerald-600 focus:ring-0 cursor-pointer disabled:opacity-50"
                checked={rememberMe} 
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <span>{t.rememberMe}</span>
            </label>
          </div>

          {/* Акцентна Смарагдова кнопка входу */}
          <button 
            type="submit" 
            disabled={status === 'loading'}
            className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-medium py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm cursor-pointer shadow-sm mt-2"
          >
            {status === 'loading' ? (
              <Loader2 className="animate-spin" size={16} />
            ) : (
              <>
                <LogIn size={14} />
                <span>{t.btnSubmit}</span>
              </>
            )}
          </button>
        </form>

        {/* Системний перехід на сторінку онбордингу закладу */}
        <div className="mt-6 pt-5 border-t border-slate-100 text-center pb-4 sm:pb-0">
          <button 
            type="button"
            onClick={() => navigate('/request-access')}
            className="text-emerald-700 hover:text-emerald-600 text-xs font-semibold transition-colors cursor-pointer text-center leading-normal px-2"
          >
            {t.btnRequest}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;