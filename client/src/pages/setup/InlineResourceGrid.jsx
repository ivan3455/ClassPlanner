import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { Loader2, Plus, Trash2, Check, X, Edit2 } from 'lucide-react';

const InlineResourceGrid = ({ resourceType, versionId, columns, lang }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [newFormData, setNewFormData] = useState({});
  const [asyncOptions, setAsyncOptions] = useState({});

  const getBaseUrl = () => {
    switch (resourceType) {
      case 'classrooms': return '/classrooms';
      case 'groups': return '/groups';
      case 'curriculum': return '/curriculum';
      default: return `/${resourceType}`;
    }
  };

  useEffect(() => {
    fetchGridData();
    if (resourceType === 'curriculum') {
      fetchAsyncDependencies();
    }
  }, [resourceType, versionId]);

  const fetchGridData = async () => {
    setLoading(true);
    setError('');
    try {
      const baseUrl = getBaseUrl();
      const res = await api.get(`${baseUrl}?versionId=${versionId}`);
      setData(res.data || []);
      
      const initialForm = {};
      columns.forEach(col => {
        initialForm[col.key] = col.type === 'number' ? '0' : col.type === 'boolean' ? true : '';
      });
      setNewFormData(initialForm);
    } catch (err) {
      console.error(`Grid fetch error for ${resourceType}:`, err.message);
      setError(lang === 'ua' ? 'Не вдалося завантажити дані довідника.' : 'Failed to synchronize registry data.');
    } finally {
      setLoading(false);
    }
  };

  const fetchAsyncDependencies = async () => {
    try {
      const [grRes, teachRes] = await Promise.all([
        api.get('/groups').catch(() => ({ data: [] })),
        api.get('/teachers').catch(() => ({ data: [] }))
      ]);
      setAsyncOptions({
        groups: grRes.data || [],
        teachers: teachRes.data || []
      });
    } catch (err) {
      console.error('Failed to resolve async grid structures:', err.message);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const baseUrl = getBaseUrl();
      const payload = { ...newFormData, ScheduleVersionId: versionId };
      await api.post(baseUrl, payload);
      fetchGridData();
    } catch (err) {
      alert(err.response?.data?.message || 'Create record mismatch error.');
    }
  };

  const startEdit = (row) => {
    setEditingId(row.id);
    setEditFormData({
      ...row,
      subjectName: row.Subject?.name || row.subjectName || ''
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditFormData({});
  };

  const handleUpdate = async (id) => {
    try {
      const baseUrl = getBaseUrl();
      const payload = { ...editFormData, ScheduleVersionId: versionId };
      await api.put(`${baseUrl}/${id}`, payload);
      setEditingId(null);
      fetchGridData();
    } catch (err) {
      alert(err.response?.data?.message || 'Update request rejected.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(lang === 'ua' ? 'Вилучити цей рядок безповоротно?' : 'Drop this data entry node permanently?')) return;
    try {
      const baseUrl = getBaseUrl();
      await api.delete(`${baseUrl}/${id}`);
      setData(data.filter(item => item.id !== id));
    } catch (err) {
      alert(err.response?.data?.message || 'Delete operation constraints conflict.');
    }
  };

  if (loading) return <div className="flex justify-center items-center p-12 w-full"><Loader2 className="animate-spin text-emerald-600" size={24} /></div>;

  return (
    <div className="w-full overflow-x-auto text-slate-700 text-xs text-left">
      {error && <div className="m-2 p-3 bg-red-50 text-red-600 border border-red-200 rounded-xl font-semibold">{error}</div>}
      
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200">
            {columns.map(col => (
              <th key={col.key} className="p-3 font-black text-slate-500 uppercase tracking-wider">
                {col.label[lang] || col.label['ua']}
              </th>
            ))}
            <th className="p-3 font-black text-slate-500 uppercase tracking-wider text-right w-24">Дії</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          
          {/* ФОРМА ШВИДКОГО СТВОРЕННЯ */}
          <tr className="bg-emerald-50/20 border-b border-slate-200/60">
            {columns.map(col => (
              <td key={col.key} className="p-2">
                {col.type === 'text' || col.type === 'number' ? (
                  <input
                    type={col.type}
                    placeholder={col.placeholder}
                    className="w-full bg-white border border-slate-200 rounded-lg p-1.5 outline-none focus:border-emerald-500 font-medium"
                    value={newFormData[col.key] || ''}
                    onChange={(e) => setNewFormData({ ...newFormData, [col.key]: e.target.value })}
                  />
                ) : col.type === 'select' ? (
                  <select
                    className="w-full bg-white border border-slate-200 rounded-lg p-1.5 outline-none focus:border-emerald-500 font-medium cursor-pointer"
                    value={newFormData[col.key] || ''}
                    onChange={(e) => setNewFormData({ ...newFormData, [col.key]: e.target.value })}
                  >
                    <option value="">—</option>
                    {col.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                ) : col.type === 'boolean' ? (
                  <select
                    className="w-full bg-white border border-slate-200 rounded-lg p-1.5 outline-none font-medium cursor-pointer"
                    value={newFormData[col.key] === undefined ? 'true' : String(newFormData[col.key])}
                    onChange={(e) => setNewFormData({ ...newFormData, [col.key]: e.target.value === 'true' })}
                  >
                    <option value="true">{lang === 'ua' ? 'Доступно' : 'Active'}</option>
                    <option value="false">{lang === 'ua' ? 'Блоковано' : 'Locked'}</option>
                  </select>
                ) : col.type === 'asyncSelect' ? (
                  <select
                    className="w-full bg-white border border-slate-200 rounded-lg p-1.5 outline-none font-medium cursor-pointer"
                    value={newFormData[col.key] || ''}
                    onChange={(e) => setNewFormData({ ...newFormData, [col.key]: e.target.value })}
                  >
                    <option value="">—</option>
                    {(asyncOptions[col.entity] || []).map(opt => (
                      <option key={opt.id} value={opt.id}>{opt.name || opt.fullName}</option>
                    ))}
                  </select>
                ) : null}
              </td>
            ))}
            <td className="p-2 text-right">
              <button type="button" onClick={handleCreate} className="p-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors cursor-pointer shadow-xs">
                <Plus size={14} />
              </button>
            </td>
          </tr>

          {/* СПИСОК РЯДКІВ ДАНИХ */}
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length + 1} className="text-center py-8 text-slate-400 italic">
                {lang === 'ua' ? 'Довідник порожній. Додайте перший запис за допомогою рядка вище.' : 'Registry grid layer is empty.'}
              </td>
            </tr>
          ) : (
            data.map(row => {
              const isEditing = editingId === row.id;
              return (
                <tr key={row.id} className="hover:bg-slate-50/50 transition-colors font-medium">
                  {columns.map(col => (
                    <td key={col.key} className="p-3 text-slate-900">
                      {isEditing ? (
                        col.type === 'text' || col.type === 'number' ? (
                          <input
                            type={col.type}
                            className="w-full bg-white border border-slate-300 rounded-md p-1 font-medium"
                            value={col.isSubjectInput ? (editFormData.subjectName || '') : (editFormData[col.key] || '')}
                            onChange={(e) => setEditFormData({ 
                              ...editFormData, 
                              [col.isSubjectInput ? 'subjectName' : col.key]: e.target.value 
                            })}
                          />
                        ) : col.type === 'select' ? (
                          <select
                            className="w-full bg-white border border-slate-300 rounded-md p-1 font-medium"
                            value={editFormData[col.key] || ''}
                            onChange={(e) => setEditFormData({ ...editFormData, [col.key]: e.target.value })}
                          >
                            {col.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                          </select>
                        ) : col.type === 'boolean' ? (
                          <select
                            className="w-full bg-white border border-slate-300 rounded-md p-1 font-medium"
                            value={String(editFormData[col.key])}
                            onChange={(e) => setEditFormData({ ...editFormData, [col.key]: e.target.value === 'true' })}
                          >
                            <option value="true">{lang === 'ua' ? 'Доступно' : 'Active'}</option>
                            <option value="false">{lang === 'ua' ? 'Блоковано' : 'Locked'}</option>
                          </select>
                        ) : col.type === 'asyncSelect' ? (
                          <select
                            className="w-full bg-white border border-slate-300 rounded-md p-1 font-medium"
                            value={editFormData[col.key] || ''}
                            onChange={(e) => setEditFormData({ ...editFormData, [col.key]: e.target.value })}
                          >
                            {(asyncOptions[col.entity] || []).map(opt => (
                              <option key={opt.id} value={opt.id}>{opt.name || opt.fullName}</option>
                            ))}
                          </select>
                        ) : null
                      ) : (
                        col.type === 'boolean' ? (
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${row[col.key] ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                            {row[col.key] ? (lang === 'ua' ? 'Доступно' : 'Active') : (lang === 'ua' ? 'Блоковано' : 'Locked')}
                          </span>
                        ) : col.type === 'asyncSelect' ? (
                          row[col.relationKey]?.name || row[col.relationKey]?.fullName || row[col.key] || '—'
                        ) : col.isSubjectInput ? (
                          row.Subject?.name || row.subjectName || '—'
                        ) : (
                          row[col.key] !== undefined && row[col.key] !== null ? String(row[col.key]) : '—'
                        )
                      )}
                    </td>
                  ))}
                  
                  <td className="p-3 text-right flex justify-end gap-1.5">
                    {isEditing ? (
                      <>
                        <button type="button" onClick={() => handleUpdate(row.id)} className="p-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded-md transition-colors cursor-pointer">
                          <Check size={13} />
                        </button>
                        <button type="button" onClick={cancelEdit} className="p-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-md transition-colors cursor-pointer">
                          <X size={13} />
                        </button>
                      </>
                    ) : (
                      <>
                        <button type="button" onClick={() => startEdit(row)} className="p-1 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors cursor-pointer">
                          <Edit2 size={13} />
                        </button>
                        <button type="button" onClick={() => handleDelete(row.id)} className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors cursor-pointer">
                          <Trash2 size={13} />
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
};

export default InlineResourceGrid;