import axios from 'axios';

// Dictionary mapping server business logic error messages to user-friendly Ukrainian text layouts
const ERROR_TRANSLATIONS = {
  // Base Authentication & Registration
  'User with this email already exists within the platform': 'Користувач з таким Email вже зареєстрований у системі.',
  'Missing required fields: fullName, email, and password are mandatory.': 'Будь ласка, заповніть усі обов’язкові поля: повне ім’я, email та пароль.',
  'User is not linked to any academic institution': 'Користувач не прив’язаний до жодного навчального закладу.',
  'User identity context is not linked to any active institution branch.': 'Користувач не прив’язаний до жодного навчального закладу.',

  // Academic Groups & Subgroups
  'Missing required fields: name, studentCount, and course are mandatory': 'Будь ласка, заповніть обов’язкові поля: назва, кількість студентів та курс.',
  'Missing required fields: name, studentCount, and course are mandatory.': 'Будь ласка, заповніть обов’язкові поля: назва, кількість студентів та курс.',
  'Student group not found or access denied': 'Академічну групу не знайдено або доступ до неї заборонено.',
  'Student group not found or access denied.': 'Академічну групу не знайдено або доступ до неї заборонено.',
  'Cannot delete group: an active generated schedule is currently linked to this group': 'Неможливо видалити групу: для неї вже згенеровано активний розклад.',
  'Cannot delete group: an active generated schedule structure is currently linked to this target context.': 'Неможливо видалити групу: для неї вже згенеровано активний розклад.',
  'Specified parent group not found or belongs to another institution branch.': 'Вказану батьківську групу не знайдено або вона належить іншому закладу.',
  'Cannot delete parent group: please remove or dissociate its connected child subgroups first.': 'Неможливо видалити основну групу: спочатку видаліть або відв’яжіть усі її підгрупи.',

  // Classrooms & Cabinets
  'Missing required fields: number, capacity, and type are mandatory': 'Будь ласка, заповніть усі обов’язкові поля: номер, місткість та тип аудиторії.',
  'Missing required fields: number, capacity, and type are mandatory.': 'Будь ласка, заповніть усі обов’язкові поля: номер, місткість та тип аудиторії.',
  'Classroom not found or access denied': 'Аудиторію не знайдено або доступ до неї заборонено.',
  'Classroom not found or access denied.': 'Аудиторію не знайдено або доступ до неї заборонено.',
  'Cannot delete classroom: this specific location asset is currently allocated inside active schedule frameworks.': 'Неможливо видалити аудиторію: вона задіяна в активному розкладі.',

  // Academic Subjects
  'Missing required fields: name and code are mandatory.': 'Заповніть обов’язкові поля: назва предмета та унікальний код.',
  'The sum of lecture, practice, and lab hours exceeds the specified total hours.': 'Сума лекційних, практичних та лабораторних годин перевищує вказану загальну кількість годин.',
  'Updated hourly distribution violates total allocated hours balance constraint.': 'Оновлений розподіл годин суперечить загальній кількості годин предмета.',
  'Cannot delete subject: it is currently referenced by an active curriculum group plan or an active generated schedule.': 'Неможливо видалити предмет: він використовується в навчальних планах або задіяний у розкладі.',

  // Curriculum Plans
  'Missing required parameters: GroupId and subjectName are mandatory.': 'Не вистачає обов’язкових параметрів: вкажіть групу та назву предмета.',
  'The designated recommended teacher was not found or belongs to another staff tier.': 'Вказаного викладача не знайдено або він не працює у вашому закладі.',
  'Cannot extract entry: this subject assignment is actively utilized within deployed schedule calendars.': 'Неможливо видалити запис плану: цей предмет уже винесено на сітку занять.',

  // Manual Schedule Manipulation & Conflict Satisfaction Engine
  'The assigned teacher is already occupied with another academic block': 'Цей викладач уже зайнятий іншою парою на цей час.',
  'The assigned teacher is already occupied with another academic class during slot "': 'Цей викладач уже має заняття на цьому часовому слоті.',
  'The targeted classroom is already fully occupied during this time block': 'Ця аудиторія вже зайнята іншою групою на цей часовий слот.',
  'The designated student group is already assigned to a parallel lesson instance': 'У цієї академічної групи вже стоїть інше заняття на цей час.',
  'Access denied or target group not found': 'Доступ заборонено або вказану групу не знайдено.',
  'The selected teacher is already occupied during this time slot': 'Обраний викладач уже має заняття на цьому слоті.',

  // New Subgroups Collision Alerts
  'Conflict via structural division: An overlapping lesson exists for a connected sub-branch or parent class (Subgroup) during slot "': 'Накладка через поділ групи: у цей час у зв’язаної підгрупи або основного класу вже стоїть пара.',

  // Automated Schedule CSP Optimization Engine
  'The engine reached a dead-end execution state. Cannot assign grid elements conflict-free.': 'Алгоритм генерації зайшов у глухий кут. Неможливо розставити всі пари без конфліктів. Спробуйте розширити сітку дзвінків або зменшити навантаження.',
  'Curriculum configuration parameters are empty.': 'Навчальний план порожній. Будь ласка, розподіліть години навантаження перед генерацією.'
};

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  }
});

// Request interceptor: Automatically injects JWT Bearer token if present inside storage nodes
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor: Centralized translation hub and global 401 token expiration layout handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const { status, data } = error.response;

      // Global Guard: Session expiration handling
      if (status === 401) {
        console.warn('Session expired or unauthorized request. Purging credentials from all structural channels...');
        
        // Completely clear down volatile authentication tokens and layout contexts
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');
        
        // Redirect dynamically if window object is available
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
      }

      // Dynamic Error Localization Logic Pass
      if (data && data.message) {
        const rawMessage = data.message;
        
        // Store original text node backup to assist developers during debugging phases
        error.response.data.originalMessage = rawMessage;

        // Perfect key match search loop
        if (ERROR_TRANSLATIONS[rawMessage]) {
          error.response.data.message = ERROR_TRANSLATIONS[rawMessage];
        } else {
          // Substring fallbacks to catch dynamic dynamic variables embedded in engine error responses
          for (const key of Object.keys(ERROR_TRANSLATIONS)) {
            if (rawMessage.startsWith(key)) {
              error.response.data.message = ERROR_TRANSLATIONS[key];
              break;
            }
          }
        }
      }
    } else if (error.request) {
      // Network failure context mapping
      error.message = 'Не вдалося встановити зв’язок із сервером. Перевірте підключення або статус API сервісу.';
    }

    return Promise.reject(error);
  }
);

export default api;