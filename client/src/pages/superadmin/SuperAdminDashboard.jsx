import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { 
  Building2, PlusCircle, Trash2, LayoutDashboard, Search,
  Inbox, CheckCircle, Edit3, Loader2, AlertCircle, LogOut, UserPlus, Shield, X, RotateCcw, Clock, Landmark, Languages
} from 'lucide-react';

const translations = {
  ua: {
    loading: 'Завантаження командного центру...',
    title: 'Глобальна панель SuperAdmin',
    subtitle: 'Керування мультитенантними доменами закладу та кадровим складом методистов',
    btnManual: 'Нове ручне підключення',
    searchActive: 'Пошук за назвою, UUID закладу, ПІБ методиста або Email...',
    searchReq: 'Пошук за назвою, ПІБ заявника або Email...',
    searchTrash: 'Пошук за назвою або UUID...',
    metricActive: 'Активні заклади',
    metricPending: 'Необроблені заявки',
    tabActive: 'Реєстр запусків',
    tabRequests: 'Вхідні заявки',
    tabTrash: 'Черга видалення',
    thName: 'Навчальний заклад / Унікальний ID',
    thType: 'Тип профілю',
    thStaff: 'Штат підключених методистів',
    thActions: 'Дії',
    thAuthor: 'Заявлений заклад / Автор',
    thEmail: 'Адреса електронної пошта',
    thComment: 'Коментар до підключення',
    thGateway: 'Системний шлюз',
    thStatus: 'Статус знищення безпеки',
    noData: 'Співпадінь у реєстрі не виявлено',
    noRequests: 'Жодних нових заявок не знайдено',
    noTrash: 'Черга відкладеного видалення порожня',
    btnManage: 'Управління',
    btnApprove: 'Схвалити та розгорнути',
    btnRestore: 'Скасувати та відновити',
    btnReject: 'Відхилити',
    hours: 'год',
    destruction: 'Знищення через',
    modalParam: 'Параметри закладу',
    modalNew: 'Нове підключення',
    modalSub: 'Суверенний домен інституції',
    lblOfficialName: 'Офіційна назва закладу',
    lblClassification: 'Класифікація (Тип закладу)',
    btnUpdateName: 'Оновити назву закладу',
    btnFreeze: 'Заморозити та видалити заклад',
    lblStaff: 'Штат координаторів закладу',
    lblAdd: 'Додати нового',
    lblNoStaff: 'Методисти відсутні',
    lblProfileEdit: 'Коригування профілю методиста',
    lblProfileReg: 'Реєстрація картки методиста',
    placeholderName: 'Повне ПІБ методиста',
    placeholderPwd: 'Тимчасовий пароль методиста',
    lblAllow: 'Дозволити вхід ✓',
    lblBlock: 'Блокувати вхід ✗',
    btnSave: 'Зберегти зміни профілю',
    btnConnect: 'Підключити нового методиста до штату',
    btnDeploy: 'Затвердити та розгорнути заклад',
    typeUni: 'Університет',
    typeSchool: 'Школа / Ліцей',
    typeCollege: 'Коледж',
    confirmLogout: 'Ви дійсно бажаєте завершити сесію керування платформою?',
    confirmFreeze: 'Ви дійсно бажаєте заморозити заклад "{name}" та відправити його в чергу на видалення? Повне знищення відбудеться через 48 годин.',
    confirmDeleteMethodist: 'Видалити методиста "{name}" зі штату закладу? Ця дія є безповоротною.',
    confirmReject: 'Ви дійсно бажаєте відхилити заявку від закладу "{name}"?',
    reqStaff: 'ПІБ та Email є обов’язковими для профілю методиста',
    successUpdate: 'Дані закладу успішно оновлено.',
    successStaffUpdate: 'Облікову картку методиста оновлено',
    successStaffConnect: 'Додаткового методиста успішно підключено',
    successDeploy: 'Навчальний заклад успішно розгорнуто!',
    successFreeze: 'Заклад переведено в режим відкладеного видалення.',
    successRestore: 'Процедуру видалення скасовано, домен активний.',
    successStaffDelete: 'Методиста успішно видалено.',
    successReject: 'Заявку успішно відхилено.',
    errSync: 'Помилка синхронізації користувача',
    errDeploy: 'Помилка розгортання закладу',
    errRestore: 'Не вдалося скасувати видалення закладу',
    errFreeze: 'Критична помилка під час видалення сутності',
    errReject: 'Помилка під час відхилення заявки'
  },
  en: {
    loading: 'Loading command center...',
    title: 'Global SuperAdmin Dashboard',
    subtitle: 'Management of multi-tenant institution domains and staff of methodists',
    btnManual: 'New Manual Connection',
    searchActive: 'Search by name, UUID, methodist name or Email...',
    searchReq: 'Search by name, requester name or Email...',
    searchTrash: 'Search by name or UUID...',
    metricActive: 'Active Institutions',
    metricPending: 'Pending Requests',
    tabActive: 'Launch Registry',
    tabRequests: 'Inbox Requests',
    tabTrash: 'Deletion Queue',
    thName: 'Institution / Unique ID',
    thType: 'Profile Type',
    thStaff: 'Connected Methodists Staff',
    thActions: 'Actions',
    thAuthor: 'Declared Institution / Author',
    thEmail: 'Email Address',
    thComment: 'Connection Comment',
    thGateway: 'System Gateway',
    thStatus: 'Security Destruction Status',
    noData: 'No matches found in the registry',
    noRequests: 'No new requests found',
    noTrash: 'Deferred deletion queue is empty',
    btnManage: 'Manage',
    btnApprove: 'Approve & Deploy',
    btnRestore: 'Cancel & Restore',
    btnReject: 'Reject',
    hours: 'h',
    destruction: 'Destruction in',
    modalParam: 'Institution Parameters',
    modalNew: 'New Connection',
    modalSub: 'Sovereign domain of the institution',
    lblOfficialName: 'Official Institution Name',
    lblClassification: 'Classification (Institution Type)',
    btnUpdateName: 'Update Institution Name',
    btnFreeze: 'Freeze & Delete Institution',
    lblStaff: 'Institution Coordinators Staff',
    lblAdd: 'Add new',
    lblNoStaff: 'No methodists present',
    lblProfileEdit: 'Methodist Profile Adjustment',
    lblProfileReg: 'Methodist Card Registration',
    placeholderName: 'Full Name of Methodist',
    placeholderPwd: 'Temporary password',
    lblAllow: 'Allow Login ✓',
    lblBlock: 'Block Login ✗',
    btnSave: 'Save Profile Changes',
    btnConnect: 'Connect New Methodist to Staff',
    btnDeploy: 'Approve & Deploy Institution',
    typeUni: 'University',
    typeSchool: 'School / Lyceum',
    typeCollege: 'College',
    confirmLogout: 'Are you sure you want to end the platform management session?',
    confirmFreeze: 'Are you sure you want to freeze "{name}" and send it to the deletion queue? Full destruction will occur in 48 hours.',
    confirmDeleteMethodist: 'Delete methodist "{name}" from the institution staff? This action is irreversible.',
    confirmReject: 'Are you sure you want to reject the request from "{name}"?',
    reqStaff: 'Full Name and Email are required for the methodist profile',
    successUpdate: 'Institution data successfully updated.',
    successStaffUpdate: 'Methodist account card updated',
    successStaffConnect: 'Additional methodist successfully connected',
    successDeploy: 'Institution successfully deployed!',
    successFreeze: 'Institution transferred to deferred deletion mode.',
    successRestore: 'Deletion procedure canceled, domain is active.',
    successStaffDelete: 'Methodist successfully deleted.',
    successReject: 'Request successfully rejected.',
    errSync: 'User synchronization error',
    errDeploy: 'Institution deployment error',
    errRestore: 'Failed to cancel institution deletion',
    errFreeze: 'Critical error during entity deletion',
    errReject: 'Error rejecting request'
  }
};

const SuperAdminDashboard = () => {
  const [lang, setLang] = useState('ua');
  const t = translations[lang];

  const [institutions, setInstitutions] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  
  const [activeTab, setActiveTab] = useState('active'); 
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingInstId, setEditingInstId] = useState(null);
  const [selectedRequestId, setSelectedRequestId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const navigate = useNavigate();

  const [instName, setInstName] = useState('');
  const [instType, setInstType] = useState('University'); 
  const [methodistsList, setMethodistsList] = useState([]); 
  
  const [mId, setMId] = useState(null); 
  const [mName, setMName] = useState('');
  const [mEmail, setMEmail] = useState('');
  const [mPassword, setMPassword] = useState('');
  const [mActive, setMActive] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [instRes, reqRes] = await Promise.all([
        api.get('/superadmin/institutions'),
        api.get('/superadmin/requests')
      ]);
      setInstitutions(instRes.data || []);
      setRequests(reqRes.data || []);
    } catch (err) {
      console.error('SuperAdmin Data Sync Error:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleLang = () => {
    setLang(lang === 'ua' ? 'en' : 'ua');
  };

  // Хелпер для криптографічно безпечнішої генерації паролів методистам
  const generateSecurePassword = () => {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let password = "";
    for (let i = 0; i < 10; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };

  const filteredActiveInstitutions = useMemo(() => {
    const active = institutions.filter(inst => inst.deletionRequestedAt === null);
    if (!searchQuery.trim()) return active;
    
    const query = searchQuery.toLowerCase().trim();
    return active.filter(inst => 
      inst.name?.toLowerCase().includes(query) ||
      inst.id?.toLowerCase().includes(query) ||
      inst.Users?.some(m => m.fullName?.toLowerCase().includes(query) || m.email?.toLowerCase().includes(query))
    );
  }, [institutions, searchQuery]);

  const filteredPendingRequests = useMemo(() => {
    const pending = requests.filter(req => req.status === 'Pending' || !req.status);
    if (!searchQuery.trim()) return pending;

    const query = searchQuery.toLowerCase().trim();
    return pending.filter(req => 
      req.instName?.toLowerCase().includes(query) ||
      req.methodistName?.toLowerCase().includes(query) ||
      req.methodistEmail?.toLowerCase().includes(query)
    );
  }, [requests, searchQuery]);

  const filteredTrashInstitutions = useMemo(() => {
    const trash = institutions.filter(inst => inst.deletionRequestedAt !== null);
    if (!searchQuery.trim()) return trash;

    const query = searchQuery.toLowerCase().trim();
    return trash.filter(inst => 
      inst.name?.toLowerCase().includes(query) ||
      inst.id?.toLowerCase().includes(query)
    );
  }, [institutions, searchQuery]);

  const handleLogout = () => {
    if (!window.confirm(t.confirmLogout)) return;
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    delete api.defaults.headers.common['Authorization'];
    navigate('/', { replace: true });
  };

  const handleProcessRequest = (request) => {
    setEditingInstId(null);
    setSelectedRequestId(request.id);
    setInstName(request.instName);
    setInstType(request.instType || 'University'); 
    setMethodistsList([]);
    resetMethodistForm();
    setMName(request.methodistName);
    setMEmail(request.methodistEmail);
    // ФІКС: Замість статичного пароля викликаємо генератор
    setMPassword(generateSecurePassword());
    setIsModalOpen(true);
  };

  const handleRejectRequest = async (requestId, instName) => {
    if (!window.confirm(t.confirmReject.replace('{name}', instName))) return;
    setActionLoading(true);
    try {
      await api.put(`/superadmin/requests/${requestId}/reject`);
      alert(t.successReject);
      await fetchData();
    } catch (err) {
      alert(err.response?.data?.message || t.errReject);
    } finally {
      document.body.style.pointerEvents = 'auto'; // Відновлення інтерфейсу
      setActionLoading(false);
    }
  };

  const handleEditClick = (inst) => {
    setEditingInstId(inst.id);
    setSelectedRequestId(null);
    setInstName(inst.name);
    setInstType(inst.type || 'University'); 
    setMethodistsList(inst.Users || []); 
    resetMethodistForm();
    setIsModalOpen(true);
  };

  const resetMethodistForm = () => {
    setMId(null);
    setMName('');
    setMEmail('');
    setMPassword('');
    setMActive(true);
  };

  const handleSelectMethodistForEdit = (m) => {
    setMId(m.id);
    setMName(m.fullName);
    setMEmail(m.email);
    setMPassword(''); 
    setMActive(m.isActive);
  };

  const handleSaveInstitutionData = async (e) => {
    e.preventDefault();
    if (!editingInstId) return;
    setActionLoading(true);
    try {
      await api.put(`/superadmin/institutions/${editingInstId}`, { 
        instName: instName.trim(),
        type: instType
      });
      alert(t.successUpdate);
      await fetchData();
    } catch (err) {
      alert(err.response?.data?.message || t.errSync);
    } finally {
      setActionLoading(false);
    }
  };

  const handleMethodistSubmit = async (e) => {
    e.preventDefault();
    if (!mName || !mEmail) {
      alert(t.reqStaff);
      return;
    }
    setActionLoading(true);
    try {
      if (mId) {
        const res = await api.put(`/superadmin/methodists/${mId}`, {
          fullName: mName.trim(),
          email: mEmail.trim().toLowerCase(),
          isActive: mActive
        });
        
        setMethodistsList(methodistsList.map(m => m.id === mId ? res.data : m));
        alert(t.successStaffUpdate);
      } else {
        const payload = {
          fullName: mName.trim(),
          email: mEmail.trim().toLowerCase(),
          // ФІКС: якщо пароль пустий при ручному створенні, теж страхуємося генератором
          password: mPassword || generateSecurePassword()
        };

        if (editingInstId) {
          const res = await api.post(`/superadmin/institutions/${editingInstId}/methodists`, payload);
          setMethodistsList([...methodistsList, res.data]);
          alert(t.successStaffConnect);
        } else {
          await api.post('/superadmin/setup-institution', {
            instName: instName.trim(),
            instType: instType,
            methodistName: payload.fullName,
            methodistEmail: payload.email,
            methodistPassword: payload.password,
            requestId: selectedRequestId,
            lang: lang 
          });
          
          setIsModalOpen(false);
          setSelectedRequestId(null);
          await fetchData();
          alert(t.successDeploy);
          return;
        }
      }
      resetMethodistForm();
      const refreshRes = await api.get('/superadmin/institutions');
      setInstitutions(refreshRes.data || []);
    } catch (err) {
      alert(err.response?.data?.message || t.errSync);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteInstitution = async (id, name) => {
    if (window.confirm(t.confirmFreeze.replace('{name}', name))) {
      setActionLoading(true);
      try {
        await api.delete(`/superadmin/institutions/${id}`);
        await fetchData();
        alert(t.successFreeze);
      } catch (err) {
        alert(t.errFreeze);
      } finally {
        setIsModalOpen(false);
        setActionLoading(false);
      }
    }
  };

  const handleRestoreInstitution = async (id) => {
    setActionLoading(true);
    try {
      api.post(`/superadmin/institutions/${id}/restore`);
      await fetchData();
      alert(t.successRestore);
    } catch (err) {
      alert(t.errRestore);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteMethodist = async (methodistId, fullName) => {
    if (!window.confirm(t.confirmDeleteMethodist.replace('{name}', fullName))) return;
    setActionLoading(true);
    try {
      await api.delete(`/superadmin/methodists/${methodistId}`);
      setMethodistsList(methodistsList.filter(m => m.id !== methodistId));
      alert(t.successStaffDelete);
      const refreshRes = await api.get('/superadmin/institutions');
      setInstitutions(refreshRes.data || []);
    } catch (err) {
      alert(err.response?.data?.message || t.errSync);
    } finally {
      setActionLoading(false);
    }
  };

  const getRemainingHours = (requestedAtString) => {
    const requestedAt = new Date(requestedAtString);
    const deadline = new Date(requestedAt.getTime() + 48 * 60 * 60 * 1000);
    const now = new Date();
    const diffMs = deadline - now;
    if (diffMs <= 0) return `0 ${t.hours}`;
    const hours = Math.ceil(diffMs / (1000 * 60 * 60));
    return `${hours} ${t.hours}`;
  };

  const typeLabels = {
    'University': { text: t.typeUni, style: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    'School': { text: t.typeSchool, style: 'bg-teal-50 text-teal-700 border-teal-200' },
    'College': { text: t.typeCollege, style: 'bg-amber-50 text-amber-700 border-amber-200' }
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center select-none antialiased font-sans">
      <Loader2 className="text-emerald-600 animate-spin w-10 h-10 mb-3" />
      <div className="text-slate-500 font-bold text-xs uppercase tracking-widest">{t.loading}</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-700 p-4 sm:p-8 select-none text-left antialiased font-sans">
      
      {/* GLOBAL HEADER */}
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between sm:items-center gap-6 mb-8 border-b border-slate-200 pb-6">
        <div>
          <div className="flex items-center justify-between sm:justify-start gap-4">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
              <LayoutDashboard className="text-emerald-600" size={24} /> {t.title}
            </h1>
            <button 
              type="button"
              onClick={toggleLang}
              className="flex items-center gap-1 text-xs text-slate-600 hover:text-slate-900 border border-slate-200 px-2 py-1 rounded-lg bg-white transition-colors cursor-pointer"
            >
              <Languages size={14} />
              <span className="uppercase font-semibold">{lang === 'ua' ? 'en' : 'ua'}</span>
            </button>
          </div>
          <p className="text-slate-500 text-xs mt-1.5">{t.subtitle}</p>
        </div>
        
        <div className="flex items-center gap-3 self-end sm:self-center">
          <button 
            onClick={() => {
              setEditingInstId(null);
              setSelectedRequestId(null);
              setInstName('');
              setInstType('University'); 
              setMethodistsList([]);
              resetMethodistForm();
              setIsModalOpen(true);
            }}
            className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 rounded-xl font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors shadow-sm cursor-pointer whitespace-nowrap"
          >
            <PlusCircle size={16} /> {t.btnManual}
          </button>

          <button 
            onClick={handleLogout}
            className="bg-white border border-slate-200 hover:border-red-200 text-slate-500 hover:text-red-600 p-2.5 rounded-xl transition-colors cursor-pointer"
            title="Sign Out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>

      {/* CORE SEARCH CONTROLS */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="relative w-full">
          <Search className="absolute left-4 top-3 text-slate-400" size={16} />
          <input 
            type="text" 
            placeholder={
              activeTab === 'active' ? t.searchActive :
              activeTab === 'requests' ? t.searchReq : t.searchTrash
            }
            value={searchQuery} 
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl py-2.5 pl-11 pr-10 outline-none focus:border-emerald-500 text-sm text-slate-900 transition-colors placeholder:text-slate-400"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-4 top-3 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer">
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* METRIC INDEX TILES & TABS */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
            <p className="text-slate-400 uppercase text-[10px] font-bold tracking-widest">{t.metricActive}</p>
            <h3 className="text-2xl font-black text-slate-900 mt-1 tracking-tight">{filteredActiveInstitutions.length}</h3>
          </div>
          <div className="bg-white border border-slate-200 p-4 rounded-xl border-l-4 border-l-amber-500 shadow-sm">
            <p className="text-slate-400 uppercase text-[10px] font-bold tracking-widest">{t.metricPending}</p>
            <h3 className="text-2xl font-black text-slate-900 mt-1 tracking-tight">{filteredPendingRequests.length}</h3>
          </div>
          
          <div className="md:col-span-2 flex items-end">
            <div className="bg-white p-1 rounded-xl border border-slate-200 flex w-full">
              <button 
                onClick={() => { setActiveTab('active'); setSearchQuery(''); }}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer ${activeTab === 'active' ? 'bg-slate-100 text-emerald-700' : 'text-slate-500 hover:text-slate-800'}`}
              >
                <Building2 size={14} /> {t.tabActive} ({filteredActiveInstitutions.length})
              </button>
              <button 
                onClick={() => { setActiveTab('requests'); setSearchQuery(''); }}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-2 relative cursor-pointer ${activeTab === 'requests' ? 'bg-slate-100 text-emerald-700' : 'text-slate-500 hover:text-slate-800'}`}
              >
                <Inbox size={14} /> {t.tabRequests} ({filteredPendingRequests.length})
                {filteredPendingRequests.length > 0 && (
                  <span className="absolute top-2 right-3 w-1.5 h-1.5 bg-amber-500 rounded-full animate-ping"></span>
                )}
              </button>
              <button 
                onClick={() => { setActiveTab('trash'); setSearchQuery(''); }}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer ${activeTab === 'trash' ? 'bg-slate-100 text-red-600' : 'text-slate-500 hover:text-slate-800'}`}
              >
                <Clock size={14} /> {t.tabTrash} ({filteredTrashInstitutions.length})
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* CORE DATAGRIDS LAYOUT */}
      <div className="max-w-7xl mx-auto bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        
        {/* TAB 1: ACTIVE INSTS */}
        {activeTab === 'active' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3.5">{t.thName}</th>
                  <th className="px-6 py-3.5">{t.thType}</th>
                  <th className="px-6 py-3.5">{t.thStaff}</th>
                  <th className="px-6 py-3.5 text-right">{t.thActions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredActiveInstitutions.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="text-center p-8 text-xs text-slate-400 italic">{t.noData}</td>
                  </tr>
                ) : (
                  filteredActiveInstitutions.map((inst) => {
                    const badge = typeLabels[inst.type || 'University'];
                    return (
                      <tr key={inst.id} className="transition-colors group hover:bg-slate-50/60">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-bold text-slate-900">{inst.name}</div>
                          <div className="text-[10px] font-mono text-slate-400 mt-0.5 select-all">UUID: {inst.id}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${badge.style}`}>
                            {badge.text}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1.5 max-w-sm">
                            {inst.Users && inst.Users.length > 0 ? (
                              inst.Users.map(m => (
                                <div key={m.id} className="text-xs flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-2 py-0.5">
                                  <span className="text-slate-700 font-medium truncate max-w-[110px]" title={m.fullName}>{m.fullName}</span>
                                  <span className={`text-[9px] px-1 rounded font-mono font-bold ${m.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
                                    {m.isActive ? 'Active' : 'Muted'}
                                  </span>
                                </div>
                              ))
                            ) : (
                              <span className="text-red-500 text-xs italic font-semibold">No coordinators attached!</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="flex justify-end items-center gap-2 md:opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                            <button 
                              type="button"
                              onClick={() => handleEditClick(inst)}
                              className="h-8 px-2.5 text-slate-600 hover:text-slate-900 bg-white border border-slate-200 hover:border-slate-300 rounded-lg transition-colors cursor-pointer flex items-center gap-1 text-xs font-semibold shrink-0"
                            >
                              <Edit3 size={12} /> <span>{t.btnManage}</span>
                            </button>
                            <button 
                              type="button"
                              onClick={() => handleDeleteInstitution(inst.id, inst.name)}
                              disabled={actionLoading}
                              className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-red-600 bg-white border border-slate-200 hover:border-red-200 rounded-lg transition-colors cursor-pointer disabled:opacity-40 shrink-0"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 2: REQUESTS QUEUE */}
        {activeTab === 'requests' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3.5">{t.thAuthor}</th>
                  <th className="px-6 py-3.5">{t.thType}</th>
                  <th className="px-6 py-3.5">{t.thEmail}</th>
                  <th className="px-6 py-3.5">{t.thComment}</th>
                  <th className="px-6 py-3.5 text-right">{t.thGateway}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPendingRequests.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center p-8 text-xs text-slate-400 italic">{t.noRequests}</td>
                  </tr>
                ) : (
                  filteredPendingRequests.map((req) => {
                    const requestBadge = typeLabels[req.instType || 'University'];
                    return (
                      <tr key={req.id} className="transition-colors hover:bg-slate-50/60">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-amber-600 font-bold text-sm">{req.instName}</div>
                          <div className="text-xs text-slate-400 italic mt-0.5">{req.methodistName}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${requestBadge.style}`}>
                            {requestBadge.text}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-600 font-mono">{req.methodistEmail}</td>
                        <td className="px-6 py-4 max-w-xs text-xs text-slate-400 leading-relaxed">
                          <div className="truncate hover:whitespace-normal transition-all" title={req.comment}>{req.comment || '—'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="flex justify-end items-center gap-2">
                            <button 
                              type="button"
                              onClick={() => handleProcessRequest(req)}
                              className="h-8 px-2.5 bg-emerald-600 text-white hover:bg-emerald-500 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer shadow-sm shrink-0"
                            >
                              <CheckCircle size={12} /> {t.btnApprove}
                            </button>
                            <button 
                              type="button"
                              onClick={() => handleRejectRequest(req.id, req.instName)}
                              disabled={actionLoading}
                              className="h-8 px-2.5 bg-red-50 text-red-600 border border-red-200 hover:bg-red-600 hover:text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer shrink-0"
                            >
                              <X size={12} /> <span>{t.btnReject}</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 3: TRASH */}
        {activeTab === 'trash' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3.5">{t.thName}</th>
                  <th className="px-6 py-3.5">{t.thType}</th>
                  <th className="px-6 py-3.5">{t.thStatus}</th>
                  <th className="px-6 py-3.5 text-right">{t.btnRestore}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTrashInstitutions.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="text-center p-8 text-xs text-slate-400 italic">{t.noTrash}</td>
                  </tr>
                ) : (
                  filteredTrashInstitutions.map((inst) => {
                    const badge = typeLabels[inst.type || 'University'];
                    return (
                      <tr key={inst.id} className="transition-colors hover:bg-red-50/20">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-bold text-red-600 line-through decoration-1">{inst.name}</div>
                          <div className="text-[10px] font-mono text-slate-400 mt-0.5">UUID: {inst.id}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${badge.style}`}>
                            {badge.text}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="bg-red-50 border border-red-200 text-red-600 text-[10px] px-2 py-0.5 rounded-md flex items-center gap-1 font-mono font-bold w-fit animate-pulse">
                            <Clock size={12} /> {t.destruction} {getRemainingHours(inst.deletionRequestedAt)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <button 
                            type="button"
                            onClick={() => handleRestoreInstitution(inst.id)}
                            disabled={actionLoading}
                            className="h-8 px-2.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 ml-auto cursor-pointer"
                          >
                            <RotateCcw size={12} /> {t.btnRestore}
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL CONFIGURATION PORTAL INTERFACE */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white border border-slate-200 p-6 sm:p-7 rounded-2xl max-w-4xl w-full shadow-xl relative overflow-hidden grid grid-cols-1 md:grid-cols-5 gap-6 text-left">
            <div className="absolute top-0 left-0 w-full h-1 bg-emerald-600"></div>
            
            <button 
              type="button"
              onClick={() => { setIsModalOpen(false); setSelectedRequestId(null); }}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>

            {/* LEFT SIDE AREA: INSTITUTION METRICS CONTROL */}
            <div className="md:col-span-2 space-y-4 border-b md:border-b-0 md:border-r border-slate-100 pb-4 md:pb-0 md:pr-5 flex flex-col justify-between">
              <div className="space-y-4 w-full">
                <div>
                  <h2 className="text-lg font-black text-slate-900 tracking-tight">
                    {editingInstId ? t.modalParam : t.modalNew}
                  </h2>
                  <p className="text-slate-400 text-[9px] uppercase font-bold tracking-widest mt-0.5">{t.modalSub}</p>
                </div>

                <form onSubmit={handleSaveInstitutionData} className="space-y-3.5">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-0.5">{t.lblOfficialName}</label>
                    <input 
                      type="text" required disabled={actionLoading}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 outline-none focus:border-emerald-500 focus:bg-white transition-colors"
                      value={instName} onChange={(e) => setInstName(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-0.5">{t.lblClassification}</label>
                    <div className="relative">
                      <Landmark className="absolute left-3 top-3 text-slate-400" size={14} />
                      <select
                        required
                        disabled={actionLoading || (editingInstId !== null)} 
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 pl-9 text-xs text-slate-900 outline-none focus:border-emerald-500 focus:bg-white transition-colors cursor-pointer appearance-none"
                        value={instType} onChange={(e) => setInstType(e.target.value)}
                      >
                        <option value="University">{t.typeUni}</option>
                        <option value="School">{t.typeSchool}</option>
                        <option value="College">{t.typeCollege}</option>
                      </select>
                      <div className="absolute right-3.5 top-3.5 pointer-events-none w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[4px] border-t-slate-400"></div>
                    </div>
                  </div>

                  {editingInstId && (
                    <div className="pt-1.5 space-y-2">
                      <button 
                        type="submit" disabled={actionLoading}
                        className="w-full bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold py-2 rounded-xl text-xs transition-colors cursor-pointer"
                      >
                        {actionLoading ? <Loader2 size={12} className="animate-spin mx-auto" /> : t.btnUpdateName}
                      </button>
                      <button 
                        type="button" 
                        disabled={actionLoading}
                        onClick={() => handleDeleteInstitution(editingInstId, instName)}
                        className="w-full bg-red-50 hover:bg-red-100/60 border border-red-200 text-red-600 font-bold py-2 rounded-xl text-xs transition-colors cursor-pointer text-center"
                      >
                        {t.btnFreeze}
                      </button>
                    </div>
                  )}
                </form>
              </div>

              {!editingInstId && (
                <div className="text-[10px] leading-relaxed text-slate-400 pt-2 flex items-start gap-1 w-full border-t border-slate-50">
                  <AlertCircle size={12} className="shrink-0 text-slate-300 mt-0.5" />
                  <span>
                    {selectedRequestId ? "Deployed on request parameters base model." : "Please choose the classification context node."}
                  </span>
                </div>
              )}
            </div>

            {/* RIGHT SIDE AREA: MULTI-METHODIST MANAGEMENT NODES */}
            <div className="md:col-span-3 flex flex-col justify-between h-[420px] md:h-auto">
              {editingInstId && (
                <div className="space-y-2 mb-3">
                  <h3 className="text-xs font-black text-slate-500 uppercase tracking-wider flex items-center justify-between px-0.5">
                    <span>{t.lblStaff} ({methodistsList.length} / 10)</span>
                    {mId && (
                      <button 
                        type="button"
                        onClick={resetMethodistForm}
                        className="text-[10px] text-emerald-700 font-bold lowercase bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded hover:bg-emerald-600 hover:text-white transition-all cursor-pointer"
                      >
                        + {t.lblAdd}
                      </button>
                    )}
                  </h3>
                  
                  <div className="max-h-28 overflow-y-auto space-y-1.5 pr-1 border border-slate-100 p-2 rounded-xl bg-slate-50/50">
                    {methodistsList.length === 0 ? (
                      <p className="text-center text-slate-400 italic text-[11px] py-2">{t.lblNoStaff}</p>
                    ) : (
                      methodistsList.map(m => (
                        <div 
                          key={m.id} 
                          className={`p-2 rounded-xl border flex items-center justify-between transition-colors ${mId === m.id ? 'bg-emerald-50 border-emerald-300 text-emerald-800' : 'bg-white border-slate-200 text-slate-700'}`}
                        >
                          <div className="space-y-0.5 max-w-[170px] cursor-pointer w-full" onClick={() => handleSelectMethodistForEdit(m)}>
                            <h4 className="text-xs font-bold truncate">{m.fullName}</h4>
                            <p className="text-[10px] text-slate-400 font-mono truncate">{m.email}</p>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className={`text-[9px] font-bold px-1 py-0.5 rounded uppercase font-mono ${m.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
                              {m.isActive ? 'Active' : 'Muted'}
                            </span>
                            <button 
                              type="button"
                              onClick={() => handleSelectMethodistForEdit(m)}
                              className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-slate-700 bg-white border border-slate-200 rounded-lg shrink-0 cursor-pointer"
                            >
                              <Edit3 size={11} />
                            </button>
                            <button 
                              type="button"
                              onClick={() => handleDeleteMethodist(m.id, m.fullName)}
                              className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-red-500 bg-white border border-slate-200 rounded-lg shrink-0 cursor-pointer transition-colors"
                            >
                              <Trash2 size={11} />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              <form onSubmit={handleMethodistSubmit} className="space-y-3 bg-slate-50 border border-slate-200 p-3.5 rounded-xl flex-1 flex flex-col justify-between">
                <div className="space-y-3 w-full">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                    {mId ? <Shield size={12} className="text-emerald-600" /> : <UserPlus size={12} className="text-emerald-600" />}
                    <span>{mId ? t.lblProfileEdit : t.lblProfileReg}</span>
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input 
                      type="text" placeholder={t.placeholderName} required disabled={actionLoading}
                      className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 outline-none focus:border-emerald-500 transition-colors"
                      value={mName} onChange={(e) => setMName(e.target.value)}
                    />
                    <input 
                      type="email" placeholder="Email / Login" required disabled={actionLoading}
                      className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 font-mono outline-none focus:border-emerald-500 transition-colors"
                      value={mEmail} onChange={(e) => setMEmail(e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                    {!mId ? (
                      <input 
                        type="text" // ФІКС: міняємо на text, щоб суперадмін бачив згенерований рядок
                        placeholder={t.placeholderPwd}
                        required={!mId} disabled={actionLoading}
                        className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 font-mono outline-none focus:border-emerald-500 transition-colors font-bold"
                        value={mPassword} onChange={(e) => setMPassword(e.target.value)}
                      />
                    ) : (
                      <div className="flex items-center bg-white border border-slate-200 px-3 py-2 rounded-xl select-none w-full col-span-2 sm:col-span-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider cursor-pointer flex items-center gap-2 w-full">
                          <input 
                            type="checkbox" disabled={actionLoading}
                            className="w-3.5 h-3.5 rounded bg-white border-slate-200 text-emerald-600 focus:ring-0 cursor-pointer"
                            checked={mActive} onChange={(e) => setMActive(e.target.checked)}
                          />
                          <span className={mActive ? 'text-emerald-600 font-bold' : 'text-red-500 font-bold'}>
                            {mActive ? t.lblAllow : t.lblBlock}
                          </span>
                        </label>
                      </div>
                    )}
                  </div>
                </div>

                <button 
                  type="submit" disabled={actionLoading || (!editingInstId && !instName)}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 transition-colors mt-3 cursor-pointer shadow-sm"
                >
                  {actionLoading ? <Loader2 size={12} className="animate-spin" /> : (mId ? <CheckCircle size={12} /> : <UserPlus size={12} />)}
                  <span>
                    {editingInstId 
                      ? (mId ? t.btnSave : t.btnConnect) 
                      : t.btnDeploy
                    }
                  </span>
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperAdminDashboard;