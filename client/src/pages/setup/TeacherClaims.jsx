import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { ClipboardList, Check, X, Loader2, AlertCircle, Calendar, User, MessageSquare } from 'lucide-react';

const TeacherClaims = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const res = await api.get('/methodist/leave-requests/pending');
      setRequests(res.data || []);
    } catch (err) {
      console.error('Error fetching leave requests:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (id, status) => {
    if (!window.confirm(status === 'Approved' ? 'Затвердити цей запит?' : 'Відхилити цей запит?')) return;
    setActionLoading(true);
    try {
      await api.put(`/methodist/leave-requests/${id}/review`, { status });
      setRequests(requests.filter(r => r.id !== id));
    } catch (err) {
      alert('Помилка обробки запиту на сервері');
    } finally {
      setActionLoading(false);
    }
  };

  const typeLabels = {
    SickLeave: { text: 'Лікарняний', style: 'bg-red-50 text-red-700 border-red-200' },
    DayOff: { text: 'Вихідний', style: 'bg-amber-50 text-amber-700 border-amber-200' },
    Vacation: { text: 'Відпустка', style: 'bg-blue-50 text-blue-700 border-blue-200' }
  };

  if (loading) return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center bg-slate-50 antialiased font-sans">
      <Loader2 className="text-emerald-600 animate-spin w-10 h-10 mb-2" />
      <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Завантаження запитів...</p>
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-150 select-none text-left antialiased font-sans w-full">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
          <ClipboardList className="text-emerald-600" size={24} /> Центр кадрових запитів викладачів
        </h1>
        <p className="text-slate-500 text-xs mt-1">Розгляд та узгодження заявок на лікарняні, відпустки та відгули з автоматичною синхронізацією ШІ-генератора</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {requests.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400 italic flex flex-col items-center justify-center gap-2">
            <AlertCircle size={24} className="text-slate-300" />
            <span>Нових або нерозглянутих запитів від штату викладачів не виявлено.</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">Викладач</th>
                  <th className="px-6 py-4">Тип запиту</th>
                  <th className="px-6 py-4">Період відсутності</th>
                  <th className="px-6 py-4">Обгрунтування (Коментар)</th>
                  <th className="px-6 py-4 text-right">Рішення методиста</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {requests.map((req) => {
                  const badge = typeLabels[req.type] || { text: req.type, style: 'bg-slate-50' };
                  return (
                    <tr key={req.id} className="transition-colors hover:bg-slate-50/40">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-bold text-slate-900 flex items-center gap-2">
                          <User size={14} className="text-slate-400" /> {req.User?.fullName}
                        </div>
                        <div className="text-[10px] font-mono text-slate-400 mt-0.5">{req.User?.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-md border ${badge.style}`}>
                          {badge.text}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-700 font-medium">
                        <div className="flex items-center gap-1.5 text-slate-600">
                          <Calendar size={13} className="text-slate-400" />
                          <span>{req.startDate}</span>
                          <span className="text-slate-300">•</span>
                          <span>{req.endDate}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 max-w-xs text-xs text-slate-500 leading-relaxed">
                        <div className="flex items-start gap-1.5">
                          <MessageSquare size={13} className="text-slate-400 shrink-0 mt-0.5" />
                          <p className="italic">{req.comment || 'Обгрунтування не вказано'}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex justify-end items-center gap-2">
                          <button
                            type="button"
                            disabled={actionLoading}
                            onClick={() => handleReview(req.id, 'Approved')}
                            className="w-8 h-8 flex items-center justify-center bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors cursor-pointer disabled:opacity-40"
                            title="Схвалити запит"
                          >
                            <Check size={14} />
                          </button>
                          <button
                            type="button"
                            disabled={actionLoading}
                            onClick={() => handleReview(req.id, 'Rejected')}
                            className="w-8 h-8 flex items-center justify-center bg-red-50 text-red-600 border border-red-200 hover:bg-red-600 hover:text-white rounded-lg transition-colors cursor-pointer disabled:opacity-40"
                            title="Відхилити"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherClaims;