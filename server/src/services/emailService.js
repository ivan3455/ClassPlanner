const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.ethereal.email',
  port: process.env.EMAIL_PORT || 587,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Інтернаціональна матриця локалізованих шаблонів (UA / EN)
const emailTemplates = {
  ua: {
    subject: 'Вашу заявку погоджено — Доступ до системи розкладу',
    welcome: 'Вітаємо',
    approved: 'Адміністрація платформи розглянула та <strong>затвердила</strong> вашу заявку на реєстрацію навчального закладу.',
    instLabel: 'Навчальний заклад',
    loginLabel: 'Ваш логін (Email)',
    pwdLabel: 'Тимчасовий пароль',
    warning: '* Наполегливо рекомендуємо змінити цей пароль відразу після першого входу в особистий кабінет у цілях безпеки.',
    footer: 'З повагою,<br><strong>Команда розробки системи планування ClassPlanner</strong>'
  },
  en: {
    subject: 'Your request has been approved — Access to ClassPlanner',
    welcome: 'Welcome',
    approved: 'The platform administration has reviewed and <strong>approved</strong> your application for institution registration.',
    instLabel: 'Institution Name',
    loginLabel: 'Your Login (Email)',
    pwdLabel: 'Temporary Password',
    warning: '* We strongly recommend that you change this password immediately after your first login for security purposes.',
    footer: 'Best regards,<br><strong>ClassPlanner System Dev Team</strong>'
  }
};

/**
 * Відправляє підтверджуючий емейл методисту про успішний онбординг закладу з урахуванням локалізації
 * @param {String} toEmail - Email методиста
 * @param {String} methodistName - ПІБ методиста
 * @param {String} institutionName - Назва закладу
 * @param {String} temporaryPassword - Тимчасовий пароль для першого входу
 * @param {String} lang - Мовний контекст клієнта ('ua' | 'en')
 */
const sendOnboardingEmail = async (toEmail, methodistName, institutionName, temporaryPassword, lang = 'ua') => {
  try {
    // Безпечний вибір мовної локалізації з фолбеком на 'ua'
    const t = emailTemplates[lang] || emailTemplates.ua;

    const mailOptions = {
      from: `"SaaS ClassPlanner" <noreply@schedule-system.com>`,
      to: toEmail,
      subject: t.subject,
      html: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
          <h2 style="color: #059669; font-size: 22px; font-weight: 800; margin-top: 0; margin-bottom: 15px; tracking-tight: -0.025em;">${t.welcome}, ${methodistName}!</h2>
          <p style="color: #475569; font-size: 14px; line-height: 1.6; margin-bottom: 25px;">${t.approved}</p>
          
          <div style="background-color: #f8fafc; padding: 20px; border-left: 4px solid #059669; border-radius: 8px; margin: 25px 0;">
            <p style="margin: 0 0 8px 0; font-size: 13px; color: #334155;"><strong style="color: #64748b; text-transform: uppercase; font-size: 11px; tracking: 0.05em; display: inline-block; width: 140px;">${t.instLabel}:</strong> ${institutionName}</p>
            <p style="margin: 0 0 8px 0; font-size: 13px; color: #334155;"><strong style="color: #64748b; text-transform: uppercase; font-size: 11px; tracking: 0.05em; display: inline-block; width: 140px;">${t.loginLabel}:</strong> ${toEmail}</p>
            <p style="margin: 0; font-size: 13px; color: #334155;"><strong style="color: #64748b; text-transform: uppercase; font-size: 11px; tracking: 0.05em; display: inline-block; width: 140px;">${t.pwdLabel}:</strong> <span style="font-family: ui-monospace, monospace; background: #e2e8f0; padding: 3px 8px; border-radius: 6px; font-weight: 700; color: #0f172a; font-size: 13px;">${temporaryPassword}</span></p>
          </div>

          <p style="color: #dc2626; font-size: 12px; font-style: italic; margin-top: 20px; margin-bottom: 30px; line-height: 1.5;">${t.warning}</p>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #f1f5f9; font-size: 13px; color: #64748b; line-height: 1.5;">
            ${t.footer}
          </div>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`[Email Service]: Localized [${lang.toUpperCase()}] onboarding email successfully sent to ${toEmail}. Message ID: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error('[Email Service Critical Error]: Помилка під час генерації або відправки листа:', error.message);
    return false;
  }
};

module.exports = {
  sendOnboardingEmail
};