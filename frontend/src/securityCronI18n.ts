export interface SecurityCronStrings {
  tabLabel: string;
  subSecurity: string;
  subCron: string;
  secTitle: string;
  secSubtitle: string;
  runAudit: string;
  auditing: string;
  scoreLabel: string;
  legendGreen: string;
  legendYellow: string;
  legendRed: string;
  secDisclaimer: string;
  cmdTemplatesLabel: string;
  tplDockerPrune: string;
  tplSslRenew: string;
  tplVacuumLogs: string;
  tplAptUpdate: string;
  tplReboot: string;
  checksTitle: string;
  sslTitle: string;
  sslSub: string;
  noCerts: string;
  daysLeft: string;
  expired: string;
  fixLabel: string;
  copyCmd: string;
  copiedCmd: string;
  whyMattersLabel: string;
  chkSshRoot: string;
  chkSshRootWhy: string;
  chkSshPass: string;
  chkSshPassWhy: string;
  chkFail2ban: string;
  chkFail2banWhy: string;
  chkFirewall: string;
  chkFirewallWhy: string;
  chkUpdates: string;
  chkUpdatesWhy: string;
  chkSsl: string;
  chkSslWhy: string;
  cronTitle: string;
  cronSubtitle: string;
  addCronBtn: string;
  saveCronBtn: string;
  cancelBtn: string;
  repeatLabel: string;
  modeMinutes: string;
  modeHours: string;
  modeDaily: string;
  modeWeekly: string;
  modeReboot: string;
  everyLabel: string;
  minutesUnit: string;
  hoursUnit: string;
  atTimeLabel: string;
  dayOfWeekLabel: string;
  previewLabel: string;
  showRawCron: string;
  hideRawCron: string;
  scheduleLabel: string;
  commandLabel: string;
  commandPlaceholder: string;
  commentLabel: string;
  commentPlaceholder: string;
  noCronJobs: string;
  enabled: string;
  disabled: string;
  timersTitle: string;
  timersSub: string;
  timersInfoBanner: string;
  noTimers: string;
  timerInactive: string;
  nextRun: string;
  refresh: string;
}

const EN: SecurityCronStrings = {
  tabLabel: 'Security & Cron',
  subSecurity: 'Security & SSL Audit',
  subCron: 'Cron & Timers',
  secTitle: '1-Click Server Security & SSL Audit',
  secSubtitle: '100% Agentless over SSH · Audits SSH hardening, Fail2ban, Firewall, Security Updates & local SSL certificates (zero outbound HTTP)',
  runAudit: 'Run Audit',
  auditing: 'Auditing...',
  scoreLabel: 'Security Score',
  legendGreen: 'Green: Secure & properly configured',
  legendYellow: 'Yellow: Needs attention / recommended hardening',
  legendRed: 'Red: High risk — action strongly recommended',
  secDisclaimer: 'Note: This is purely an informational security report of your server. ZentraDeck never modifies your server automatically — review and run any suggested command at your own discretion.',
  cmdTemplatesLabel: 'Ready-made commands (optional):',
  tplDockerPrune: 'Clean unused Docker images',
  tplSslRenew: 'Renew SSL (Certbot)',
  tplVacuumLogs: 'Clean old journald logs (7d)',
  tplAptUpdate: 'Refresh apt package list',
  tplReboot: 'Scheduled server reboot',
  checksTitle: 'Security Hardening Checks',
  sslTitle: 'Local SSL Certificates Monitor',
  sslSub: 'Read directly from server certificate files via openssl — alerts when expiry is under 30 days',
  noCerts: 'No Let’s Encrypt or Nginx SSL certificate files detected in standard paths.',
  daysLeft: 'days left',
  expired: 'EXPIRED',
  fixLabel: 'Recommended command:',
  copyCmd: 'Copy',
  copiedCmd: 'Copied',
  whyMattersLabel: 'Why this matters:',
  chkSshRoot: 'SSH Root Login Policy',
  chkSshRootWhy: 'Direct root login is the #1 target of automated bots. Restricting root to SSH keys (or disabling it) blocks brute-force attacks on the highest-privilege account.',
  chkSshPass: 'SSH Password Authentication',
  chkSshPassWhy: 'Passwords can be guessed or leaked. Switching to SSH key-only login eliminates password brute-force risk completely.',
  chkFail2ban: 'Fail2ban Intrusion Protection',
  chkFail2banWhy: 'Fail2ban watches your SSH logs and automatically bans IP addresses that fail login repeatedly, stopping bot scans before they waste CPU or succeed.',
  chkFirewall: 'Host Firewall (UFW / Firewalld / nftables)',
  chkFirewallWhy: 'Without an active firewall, any accidentally exposed database or internal port is reachable from the entire internet. UFW blocks everything except ports you explicitly allow.',
  chkUpdates: 'Pending Security Updates',
  chkUpdatesWhy: 'Unpatched OS packages can contain known public vulnerabilities (CVEs). Installing security updates regularly closes those holes.',
  chkSsl: 'SSL Certificate Health (<30d expiry)',
  chkSslWhy: 'Expired SSL certificates immediately break HTTPS websites and APIs with browser security errors. Monitoring expiry gives you time to fix auto-renewal.',
  cronTitle: 'Simple Cron Job Manager',
  cronSubtitle: 'Schedule recurring server tasks visually without memorizing cron syntax',
  addCronBtn: 'New Scheduled Task',
  saveCronBtn: 'Save Task',
  cancelBtn: 'Cancel',
  repeatLabel: 'How often should it run?',
  modeMinutes: 'Every X min',
  modeHours: 'Every X hours',
  modeDaily: 'Daily',
  modeWeekly: 'Weekly',
  modeReboot: 'On Boot',
  everyLabel: 'Every',
  minutesUnit: 'minutes',
  hoursUnit: 'hours',
  atTimeLabel: 'At time',
  dayOfWeekLabel: 'Day of week',
  previewLabel: 'Schedule:',
  showRawCron: 'Show raw Cron expression (Advanced)',
  hideRawCron: 'Hide raw Cron expression',
  scheduleLabel: 'Raw Cron Expression',
  commandLabel: 'Command or Script to Run',
  commandPlaceholder: '/usr/local/bin/backup.sh',
  commentLabel: 'Task Name / Note (optional)',
  commentPlaceholder: 'e.g. Nightly database backup',
  noCronJobs: 'No scheduled tasks configured for this user yet.',
  enabled: 'Active',
  disabled: 'Paused',
  timersTitle: 'Systemd Timers (Read-Only)',
  timersSub: 'Built-in Linux maintenance tasks managed automatically by systemd',
  timersInfoBanner: 'These timers are native Linux OS maintenance jobs (log cleanup, security updates, SSD trim, etc.). You normally do not need to touch them.',
  noTimers: 'No systemd timers found.',
  timerInactive: 'Not scheduled',
  nextRun: 'Next run',
  refresh: 'Refresh',
};

const FA: SecurityCronStrings = {
  tabLabel: 'امنیت و زمان‌بندی',
  subSecurity: 'ممیزی امنیت و SSL',
  subCron: 'کرون‌جاب و تایمرها',
  secTitle: 'ممیزی ۱ کلیکی امنیت سرور و پایش SSL',
  secSubtitle: '۱۰۰٪ بدون ایجنت از طریق SSH · بررسی امن‌سازی SSH، Fail2ban، فایروال، آپدیت‌های امنیتی و گواهی‌های SSL (بدون هیچ درخواست اینترنتی)',
  runAudit: 'اجرای ممیزی',
  auditing: 'در حال بررسی...',
  scoreLabel: 'امتیاز امنیت سرور',
  legendGreen: 'سبز: امن و استاندارد',
  legendYellow: 'زرد: قابل بهبود (پیشنهاد امنیتی)',
  legendRed: 'قرمز: ریسک بالا (نیاز به اقدام فوری)',
  secDisclaimer: 'توجه: این بخش صرفاً یک گزارش امنیتی از وضعیت فعلی سرور شماست و ZentraDeck هیچ تغییری به‌صورت خودکار اعمال نمی‌کند؛ لطفاً هر دستور پیشنهادی را با بررسی و تصمیم‌گیری خودتان اجرا کنید.',
  cmdTemplatesLabel: 'دستورات آماده پرکاربرد (اختیاری):',
  tplDockerPrune: 'پاکسازی ایمیج‌های بلااستفاده داکر',
  tplSslRenew: 'تمدید خودکار گواهی SSL (Certbot)',
  tplVacuumLogs: 'پاکسازی لاگ‌های قدیمی (بالای ۷ روز)',
  tplAptUpdate: 'بروزرسانی لیست بسته‌های apt',
  tplReboot: 'ریبوت زمان‌بندی‌شده سرور',
  checksTitle: 'چک‌لیست امن‌سازی سرور',
  sslTitle: 'پایش گواهی‌های SSL محلی سرور',
  sslSub: 'خواندن مستقیم فایل گواهی‌ها با openssl روی سرور — هشدار خودکار زیر ۳۰ روز',
  noCerts: 'هیچ فایل گواهی SSL در مسیرهای استاندارد Let’s Encrypt یا Nginx پیدا نشد.',
  daysLeft: 'روز باقی‌مانده',
  expired: 'منقضی شده',
  fixLabel: 'دستور پیشنهادی برای رفع:',
  copyCmd: 'کپی دستور',
  copiedCmd: 'کپی شد',
  whyMattersLabel: 'چرا مهم است؟',
  chkSshRoot: 'سیاست ورود روت SSH (PermitRootLogin)',
  chkSshRootWhy: 'حساب root هدف شماره یک ربات‌های نفوذ است. محدود کردن ورود root به کلید SSH (یا بستن آن) جلوی حملات حدس رمز روی بالاترین سطح دسترسی سرور را می‌گیرد.',
  chkSshPass: 'ورود SSH با رمز عبور (PasswordAuthentication)',
  chkSshPassWhy: 'رمز عبور قابل حدس زدن یا لو رفتن است. وقتی ورود فقط با کلید SSH فعال باشد، حملات Brute-Force عملاً بی‌اثر می‌شوند.',
  chkFail2ban: 'محافظت ضد نفوذ Fail2ban',
  chkFail2banWhy: 'Fail2ban لاگ‌های SSH را زیر نظر می‌گیرد و آی‌پی‌هایی که چندین بار رمز اشتباه می‌زنند را به‌صورت خودکار مسدود می‌کند تا هم امنیت بالا برود و هم CPU سرور هدر نرود.',
  chkFirewall: 'فایروال سرور (UFW / Firewalld / nftables)',
  chkFirewallWhy: 'بدون فایروال فعال، هر پورتی که اشتباهی باز بماند (مثل دیتابیس یا سرویس داخلی) از کل اینترنت در دسترس است. دستور زیر اول پورت SSH را مجاز می‌کند و بعد فایروال را روشن می‌کند تا دسترسی شما قطع نشود.',
  chkUpdates: 'آپدیت‌های امنیتی معوق',
  chkUpdatesWhy: 'بسته‌های قدیمی سیستم‌عامل ممکن است حفره‌های امنیتی شناخته‌شده (CVE) داشته باشند. نصب منظم آپدیت‌های امنیتی این روزنه‌ها را می‌بندد.',
  chkSsl: 'سلامت گواهی‌های SSL (انقضای زیر ۳۰ روز)',
  chkSslWhy: 'با منقضی شدن گواهی SSL، سایت یا API شما فوراً با خطای امنیتی مرورگر از کار می‌افتد. پایش پیش‌دستانه فرصت کافی برای بررسی تمدید خودکار می‌دهد.',
  cronTitle: 'مدیریت ساده کارهای زمان‌بندی‌شده (Cron)',
  cronSubtitle: 'بدون نیاز به حفظ کردن فرمت پیچیده Cron، زمان اجرای اسکریپت‌های سرور را ساده انتخاب کنید',
  addCronBtn: 'افزودن کار زمان‌بندی‌شده',
  saveCronBtn: 'ذخیره زمان‌بندی',
  cancelBtn: 'انصراف',
  repeatLabel: 'هر چند وقت یک‌بار اجرا شود؟',
  modeMinutes: 'هر چند دقیقه',
  modeHours: 'هر چند ساعت',
  modeDaily: 'روزانه',
  modeWeekly: 'هفتگی',
  modeReboot: 'هنگام روشن شدن',
  everyLabel: 'هر',
  minutesUnit: 'دقیقه',
  hoursUnit: 'ساعت',
  atTimeLabel: 'در ساعت',
  dayOfWeekLabel: 'روز هفته',
  previewLabel: 'زمان‌بندی انتخاب‌شده:',
  showRawCron: 'نمایش عبارت اصلی Cron (حرفه‌ای)',
  hideRawCron: 'مخفی کردن عبارت اصلی Cron',
  scheduleLabel: 'عبارت خام Cron',
  commandLabel: 'دستور یا مسیر اسکریپت اجرایی',
  commandPlaceholder: '/usr/local/bin/backup.sh',
  commentLabel: 'نام یا توضیح این کار (اختیاری)',
  commentPlaceholder: 'مثلاً: بکاپ شبانه دیتابیس',
  noCronJobs: 'هنوز هیچ کار زمان‌بندی‌شده‌ای برای این کاربر ثبت نشده است.',
  enabled: 'فعال',
  disabled: 'متوقف',
  timersTitle: 'تایمرهای بومی Systemd (فقط‌خواندنی)',
  timersSub: 'وظایف نگهداری خودکار سیستم‌عامل لینوکس که توسط Systemd مدیریت می‌شوند',
  timersInfoBanner: 'این تایمرها کارهای نگهداری خودکار خود لینوکس هستند (پاکسازی لاگ‌ها، بررسی آپدیت‌ها، بهینه‌سازی SSD و ...). معمولاً نیازی به تغییر آن‌ها ندارید.',
  noTimers: 'هیچ تایمر Systemd پیدا نشد.',
  timerInactive: 'زمان‌بندی نشده',
  nextRun: 'اجرای بعدی',
  refresh: 'بروزرسانی',
};

export function getSecurityCronStrings(lang: string): SecurityCronStrings {
  if (lang === 'fa') return FA;
  return EN;
}

export function describeSystemdTimer(unit: string, lang: string): string {
  const u = (unit || '').toLowerCase();
  const isFa = lang === 'fa';
  const rules: [string, string, string][] = [
    ['sysstat-collect', 'ثبت خودکار آمار مصرف منابع سرور (CPU، رم، دیسک) برای نمودارهای تاریخچه', 'Collects periodic CPU/RAM/IO stats for History charts'],
    ['sysstat-summary', 'خلاصه‌سازی روزانه آمارهای ثبت‌شده sysstat', 'Generates daily summary of recorded sysstat metrics'],
    ['apt-daily-upgrade', 'نصب خودکار آپدیت‌های امنیتی بسته‌های سیستم‌عامل', 'Automatically installs unattended security updates'],
    ['apt-daily', 'بررسی روزانه مخازن برای یافتن آپدیت‌های جدید بسته‌ها', 'Checks package repositories daily for available updates'],
    ['logrotate', 'چرخاندن و فشرده‌سازی فایل‌های لاگ برای جلوگیری از پر شدن دیسک', 'Rotates & compresses old logs to prevent disk exhaustion'],
    ['fstrim', 'بهینه‌سازی فضای خالی دیسک SSD برای حفظ سرعت و عمر حافظه', 'Trims unused SSD blocks to keep disk performance optimal'],
    ['dpkg-db-backup', 'بکاپ خودکار از پایگاه‌داده بسته‌های نصب‌شده سیستم', 'Backs up the installed package database automatically'],
    ['man-db', 'بروزرسانی فهرست صفحات راهنمای دستورات لینوکس (man)', 'Updates the Linux manual pages search index'],
    ['fwupd', 'بررسی آپدیت فریمور سخت‌افزار سرور', 'Checks for hardware firmware updates'],
    ['motd-news', 'بروزرسانی پیام‌های خبری صفحه ورود ترمینال اوبونتو', 'Fetches Ubuntu terminal login news messages'],
    ['update-notifier', 'اطلاع‌رسانی درباره آپدیت‌های جدید هنگام ورود به سرور', 'Refreshes login update notifications'],
    ['tmpfiles-clean', 'پاکسازی خودکار فایل‌های موقت قدیمی در /tmp و /var/tmp', 'Cleans up expired temporary files automatically'],
    ['e2scrub', 'بررسی سلامت فایل‌سیستم ext4 در پس‌زمینه بدون قطعی', 'Checks ext4 filesystem integrity in the background'],
    ['certbot', 'بررسی و تمدید خودکار گواهی‌های SSL رایگان Let’s Encrypt', 'Automatically checks and renews Let’s Encrypt SSL certs'],
    ['snapd', 'بررسی و تعمیر خودکار بسته‌های Snap', 'Checks and maintains Snap packages'],
    ['apport', 'ارسال یا مدیریت گزارش کرش برنامه‌های سیستم', 'Handles system crash report maintenance'],
    ['ua-timer', 'بررسی وضعیت سرویس Ubuntu Pro / Advantage', 'Checks Ubuntu Pro / Advantage subscription status'],
  ];
  for (const [key, fa, en] of rules) {
    if (u.includes(key)) return isFa ? fa : en;
  }
  return isFa ? 'تایمر نگهداری خودکار سیستم‌عامل لینوکس' : 'Native Linux systemd scheduled maintenance timer';
}

export function describeCronSchedule(expr: string, lang: string): string {
  const e = (expr || '').trim();
  const isFa = lang === 'fa';
  if (e === '@reboot') return isFa ? 'هنگام روشن شدن سرور' : 'At system boot';
  if (e === '@hourly' || e === '0 * * * *') return isFa ? 'هر ساعت (دقیقه ۰۰)' : 'Every hour (at :00)';
  if (e === '@daily' || e === '0 0 * * *') return isFa ? 'هر روز ساعت ۰۰:۰۰' : 'Every day at 00:00';
  if (e === '@weekly') return isFa ? 'هر هفته (یکشنبه ۰۰:۰۰)' : 'Every week (Sunday 00:00)';
  if (e === '@monthly') return isFa ? 'اول هر ماه ساعت ۰۰:۰۰' : 'Monthly on day 1 at 00:00';

  const parts = e.split(/\s+/);
  if (parts.length !== 5) return e;
  const [min, hour, dom, mon, dow] = parts;

  if (min.startsWith('*/') && hour === '*' && dom === '*' && mon === '*' && dow === '*') {
    const n = min.slice(2);
    return isFa ? `هر ${n} دقیقه یک‌بار` : `Every ${n} minutes`;
  }
  if (/^\d+$/.test(min) && hour.startsWith('*/') && dom === '*' && mon === '*' && dow === '*') {
    const n = hour.slice(2);
    return isFa ? `هر ${n} ساعت (دقیقه ${min.padStart(2, '0')})` : `Every ${n} hours (at :${min.padStart(2, '0')})`;
  }
  if (/^\d+$/.test(min) && /^\d+$/.test(hour) && dom === '*' && mon === '*' && dow === '*') {
    const t = `${hour.padStart(2, '0')}:${min.padStart(2, '0')}`;
    return isFa ? `هر روز ساعت ${t}` : `Every day at ${t}`;
  }
  if (/^\d+$/.test(min) && /^\d+$/.test(hour) && dom === '*' && mon === '*' && /^\d+$/.test(dow)) {
    const daysEn = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const daysFa = ['یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه', 'شنبه', 'یکشنبه'];
    const dIdx = Math.min(7, Math.max(0, parseInt(dow, 10)));
    const t = `${hour.padStart(2, '0')}:${min.padStart(2, '0')}`;
    return isFa ? `هر ${daysFa[dIdx]} ساعت ${t}` : `Every ${daysEn[dIdx]} at ${t}`;
  }
  return e;
}