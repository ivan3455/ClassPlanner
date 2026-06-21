import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

const Unauthorized = () => {
  const navigate = useNavigate();

  // INTERGRITY FIX: Fallback evaluation checks BOTH session and local slots to verify active login tokens
  const handleBackToSafety = () => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (token) {
      navigate('/dashboard'); // If logged in, pipe context back into the core platform switch grid
    } else {
      navigate('/login'); // Fallback path if missing token signatures entirely
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center select-none">
      <div className="relative mb-6">
        {/* Soft back-glow pulsing warning indicator animation */}
        <div className="absolute inset-0 bg-red-600/10 rounded-full blur-xl animate-pulse"></div>
        <ShieldAlert className="text-red-500 w-24 h-24 relative z-10" />
      </div>

      <h1 className="text-4xl font-extrabold text-white tracking-tight mb-3">
        Доступ обмежено
      </h1>
      
      <p className="text-slate-400 mb-8 max-w-md text-sm leading-relaxed">
        У вашого облікового запису недостатньо прав для перегляду цієї сторінки або виконання цієї операції. 
        Якщо це помилка, будь ласка, зверніться до координатора вашого закладу.
      </p>

      <button
        onClick={handleBackToSafety}
        className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 border border-slate-800 hover:border-slate-700 hover:bg-slate-800 text-blue-400 font-semibold text-sm rounded-lg shadow-md transition-all duration-150 group cursor-pointer"
      >
        <ArrowLeft size={16} className="transition-transform duration-150 group-hover:-translate-x-0.5" />
        <span>Повернутися на головну</span>
      </button>
    </div>
  );
};

export default Unauthorized;