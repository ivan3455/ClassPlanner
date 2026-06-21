import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

const DashboardLayout = () => {
  return (
    <div className="flex bg-slate-50 min-h-screen text-slate-800 antialiased font-sans">
      {/* Ліва навігаційна панель закладу (Sidebar) */}
      <Sidebar />
      
      {/* Головна робоча зона додатка з підтримкою вертикального скролу */}
      {/* Відступи адаптовані: p-4 на мобільних, p-6 на планшетах та p-8 на десктопах */}
      <main className="flex-1 h-screen overflow-y-auto p-4 sm:p-6 md:p-8">
        {/* Контейнер фіксації максимальної ширини контенту для моніторів UltraWide */}
        <div className="max-w-7xl mx-auto w-full">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;