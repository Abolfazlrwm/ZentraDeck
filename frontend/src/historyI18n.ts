export interface HistoryStrings {
  tabHistory: string;
  title: string;
  subtitle: string;
  range24h: string;
  range7d: string;
  range30d: string;
  refresh: string;
  copyReport: string;
  reportCopied: string;
  loading: string;
  sysstatActiveBadge: string;
  sysstatOptionalBadge: string;
  optionalTitle: string;
  optionalBadge: string;
  optionalBody: string;
  optionalPoint1: string;
  optionalPoint2: string;
  optionalPoint3: string;
  enableSysstatBtn: string;
  enablingSysstat: string;
  manualCmdLabel: string;
  peakCpu: string;
  avgLabel: string;
  peakRam: string;
  peakIOWaitSteal: string;
  peakNetLoad: string;
  atTime: string;
  insightsTitle: string;
  insightsSub: string;
  chartsTitle: string;
  chartCpu: string;
  chartMemory: string;
  chartLoad: string;
  chartNetwork: string;
  cpuUser: string;
  cpuSystem: string;
  cpuIOWait: string;
  cpuSteal: string;
  ramUsed: string;
  swapUsed: string;
  load1m: string;
  load5m: string;
  netRx: string;
  netTx: string;
  proCpuNote: string;
  noSysstatSamplesYet: string;
  incidentsTitle: string;
  incidentsSub: string;
  filterAll: string;
  filterReboot: string;
  filterOom: string;
  filterService: string;
  filterSsh: string;
  noIncidents: string;
  rawLogLabel: string;
  catReboot: string;
  catOom: string;
  catService: string;
  catSsh: string;
  explainReboot: string;
  explainOom: string;
  explainService: string;
  explainSsh: string;
  insightHealthyTitle: string;
  insightHealthyDesc: string;
  insightStealTitle: string;
  insightStealDesc: string;
  insightIOWaitTitle: string;
  insightIOWaitDesc: string;
  insightCpuTitle: string;
  insightCpuDesc: string;
  insightRamTitle: string;
  insightRamDesc: string;
  insightOomTitle: string;
  insightOomDesc: string;
  insightSshTitle: string;
  insightSshDesc: string;
  insightSvcTitle: string;
  insightSvcDesc: string;
  insightRebootTitle: string;
  insightRebootDesc: string;
  insightSwapTitle: string;
  insightSwapDesc: string;
  insightLoadTitle: string;
  insightLoadDesc: string;
  insightNetTitle: string;
  insightNetDesc: string;
  osNativeNotice: string;
  preflightBtn: string;
  preflightChecking: string;
  preflightSafe: string;
  preflightWarn: string;
  saveReportBtn: string;
  reportSavedToast: string;
  stabilityScoreLabel: string;
  reportExecTitle: string;
  reportFullTitle: string;
}

const EN: HistoryStrings = {
  tabHistory: 'History',
  title: 'Server History & Forensic Report',
  subtitle: '24/7 resource timeline (sysstat) + automatic system incident log (journald) over plain SSH',
  range24h: '24 Hours',
  range7d: '7 Days',
  range30d: '30 Days',
  refresh: 'Refresh',
  copyReport: 'Copy Report',
  reportCopied: 'Analytical report copied to clipboard',
  loading: 'Collecting historical metrics & journald incidents over SSH...',
  sysstatActiveBadge: 'sysstat active · 0 MB resident RAM',
  sysstatOptionalBadge: 'journald active · sysstat optional',
  optionalTitle: '24/7 Historical Charts (Optional Linux sysstat)',
  optionalBadge: '100% Optional',
  optionalBody: 'You do NOT need to enable this — live monitoring and the Incident Timeline below already work without installing anything. Enable official Linux sysstat only if you want 24h/7d/30d CPU, RAM, I/O, and network graphs recorded even while your PC is turned off.',
  optionalPoint1: '0 MB resident RAM — no background daemon or open ports; runs briefly via systemd timer.',
  optionalPoint2: 'Standard distro package (sysstat / sar) stored in /var/log/sysstat (~2–5 MB/month).',
  optionalPoint3: 'Captures pro diagnostics like I/O Wait (disk bottleneck) and CPU Steal % (VPS overselling).',
  enableSysstatBtn: 'Enable Official sysstat (1-Click)',
  enablingSysstat: 'Enabling sysstat...',
  manualCmdLabel: 'View exact Linux command',
  peakCpu: 'Peak CPU',
  avgLabel: 'Avg',
  peakRam: 'Peak RAM',
  peakIOWaitSteal: 'I/O Wait & Host Steal',
  peakNetLoad: 'Peak Load & Network',
  atTime: 'at',
  insightsTitle: 'Diagnostic Insights',
  insightsSub: 'Automated engineering summary from recorded metrics and kernel/systemd events',
  chartsTitle: 'Resource Breakdown Charts',
  chartCpu: 'CPU Breakdown',
  chartMemory: 'RAM & Swap',
  chartLoad: 'Load Avg',
  chartNetwork: 'Network KB/s',
  cpuUser: 'User %',
  cpuSystem: 'System %',
  cpuIOWait: 'I/O Wait %',
  cpuSteal: 'Steal %',
  ramUsed: 'RAM %',
  swapUsed: 'Swap %',
  load1m: 'Load 1m',
  load5m: 'Load 5m',
  netRx: 'Download (RX)',
  netTx: 'Upload (TX)',
  proCpuNote: 'Pro Tip: High I/O Wait means slow disk storage is bottlenecking CPU. High Steal % (>5%) means your VPS host node is oversold by the provider.',
  noSysstatSamplesYet: 'sysstat is enabled, waiting for the first scheduled sample (usually 5–10 minutes).',
  incidentsTitle: 'Incident & Event Timeline (journald)',
  incidentsSub: '100% Agentless — reads native Linux kernel & systemd logs even without sysstat',
  filterAll: 'All',
  filterReboot: 'Reboots',
  filterOom: 'OOM Killer',
  filterService: 'Services',
  filterSsh: 'SSH Auth',
  noIncidents: 'No critical incidents, reboots, or OOM events detected in this time range.',
  rawLogLabel: 'View raw system log',
  catReboot: 'Reboot',
  catOom: 'OOM Kill',
  catService: 'Service Error',
  catSsh: 'SSH Auth',
  explainReboot: 'The Linux kernel booted or restarted. Verify whether this was a planned update or an unexpected power/host reset.',
  explainOom: 'The kernel ran completely out of RAM and forcibly killed a process to prevent the entire server from freezing.',
  explainService: 'A systemd unit logged a critical failure or exited unexpectedly. Inspect the raw journal entry below.',
  explainSsh: 'Multiple failed SSH login attempts were recorded. Consider SSH key-only login and Fail2ban if not already active.',
  insightHealthyTitle: 'Stable Resource Envelope',
  insightHealthyDesc: 'CPU, memory, disk wait, and kernel logs remained within normal operating bounds for this window.',
  insightStealTitle: 'VPS Host Contention Detected (CPU Steal)',
  insightStealDesc: 'CPU Steal spiked above 5% — the physical hypervisor shared with other tenants delayed your virtual CPUs.',
  insightIOWaitTitle: 'Disk Storage Bottleneck (High I/O Wait)',
  insightIOWaitDesc: 'Processes spent significant time waiting on disk reads/writes (backups, database checkpoints, or slow storage).',
  insightCpuTitle: 'High CPU Saturation Window',
  insightCpuDesc: 'Total CPU utilization exceeded 80%. Inspect peak timestamp against service traffic or cron jobs.',
  insightRamTitle: 'Memory Pressure Threshold Reached',
  insightRamDesc: 'RAM usage crossed 85%. Monitor swap growth and memory-heavy containers to avoid OOM Kills.',
  insightOomTitle: 'Kernel OOM Killer Triggered',
  insightOomDesc: 'The Linux kernel killed at least one process due to memory exhaustion. Adding swap or memory limits is strongly advised.',
  insightSshTitle: 'Automated SSH Login Probes Observed',
  insightSshDesc: 'Repeated failed SSH logins were captured in journald. Verify PasswordAuthentication is disabled or Fail2ban is active.',
  insightSvcTitle: 'Systemd Service Errors Logged',
  insightSvcDesc: 'One or more services reported errors or unexpected restarts during this period.',
  insightRebootTitle: 'System Reboot(s) Occurred',
  insightRebootDesc: 'Server restart events were recorded in wtmp/last history during this period.',
  insightSwapTitle: 'Swap Memory Usage Elevated',
  insightSwapDesc: 'The server started spilling RAM pages into Swap disk space, which slows down application latency.',
  insightLoadTitle: 'Elevated System Load Average',
  insightLoadDesc: 'CPU/IO run queue peaked above normal levels — check background cron jobs, database queries, or workers.',
  insightNetTitle: 'High Network Bandwidth Burst',
  insightNetDesc: 'A sustained high-throughput traffic burst was recorded on the primary network interface.',
  osNativeNotice: 'Important: sysstat (sar/sadf) is an official, standard Linux operating system package from your distro repository — NOT a ZentraDeck agent, custom script, or third-party binary.',
  preflightBtn: '1. Check Server Compatibility First',
  preflightChecking: 'Checking server compatibility...',
  preflightSafe: 'Server pre-flight check passed — zero conflicts detected.',
  preflightWarn: 'Review pre-flight notes before enabling:',
  saveReportBtn: 'Save Report',
  reportSavedToast: 'Report saved to disk',
  stabilityScoreLabel: 'Stability Score',
  reportExecTitle: 'Part 1: Executive Summary',
  reportFullTitle: 'Part 2: Full Forensic & Technical Report',
};

const FA: HistoryStrings = {
  tabHistory: 'تاریخچه و گزارش',
  title: 'تاریخچه ۲۴ ساعته و گزارش تحلیلی سرور',
  subtitle: 'نمودار منابع شبانه‌روزی (sysstat) + تایم‌لاین خودکار حوادث سیستم (journald) از طریق SSH',
  range24h: '۲۴ ساعت',
  range7d: '۷ روز',
  range30d: '۳۰ روز',
  refresh: 'بروزرسانی',
  copyReport: 'کپی گزارش کامل',
  reportCopied: 'گزارش تحلیلی در کلیپ‌بورد کپی شد',
  loading: 'در حال خواندن تاریخچه منابع و حوادث journald از سرور...',
  sysstatActiveBadge: 'sysstat فعال · ۰ مگابایت رم مقیم',
  sysstatOptionalBadge: 'journald فعال · sysstat اختیاری',
  optionalTitle: 'نمودارهای ۲۴ ساعته منابع (پکیج رسمی و اختیاری sysstat)',
  optionalBadge: '۱۰۰٪ اختیاری',
  optionalBody: 'فعال‌سازی این بخش کاملاً اختیاری است و اگر نخواهید هیچ مشکلی ندارد؛ مانیتورینگ زنده و «تایم‌لاین حوادث سیستم» در پایین همین صفحه بدون نصب هیچ برنامه‌ای به‌صورت خودکار کار می‌کنند. تنها در صورتی که بخواهید حتی وقتی کامپیوتر شما خاموش است، نمودار CPU، رم، دیسک و شبکه ثبت شود، می‌توانید پکیج رسمی لینوکس sysstat را فعال کنید.',
  optionalPoint1: '۰ مگابایت رم مقیم — هیچ سرویس دائم یا پورت بازی ایجاد نمی‌کند؛ فقط هر ۱۰ دقیقه چند میلی‌ثانیه با تایمر اجرا می‌شود.',
  optionalPoint2: 'پکیج رسمی خود توزیع لینوکس (sysstat / sar) با مصرف دیسک بسیار ناچیز (~۲ تا ۵ مگابایت در ماه).',
  optionalPoint3: 'تفکیک تخصصی CPU شامل I/O Wait (تشخیص کندی دیسک) و Steal % (تشخیص Oversell شدن سرور توسط هاستینگ).',
  enableSysstatBtn: 'فعال‌سازی ۱ کلیکی پکیج رسمی sysstat',
  enablingSysstat: 'در حال فعال‌سازی sysstat...',
  manualCmdLabel: 'مشاهده دستور دقیق لینوکسی',
  peakCpu: 'اوج مصرف CPU',
  avgLabel: 'میانگین',
  peakRam: 'اوج مصرف رم',
  peakIOWaitSteal: 'انتظار دیسک و Steal هاست',
  peakNetLoad: 'اوج لود و شبکه',
  atTime: 'در ساعت',
  insightsTitle: 'تحلیل هوشمند وضعیت سرور',
  insightsSub: 'جمع‌بندی مهندسی از پیک منابع، گلوگاه‌های سخت‌افزاری و حوادث ثبت‌شده هسته لینوکس',
  chartsTitle: 'نمودارهای تفکیک‌شده منابع',
  chartCpu: 'تفکیک CPU',
  chartMemory: 'رم و Swap',
  chartLoad: 'Load Average',
  chartNetwork: 'ترافیک شبکه',
  cpuUser: 'کاربری (User)',
  cpuSystem: 'سیستم (System)',
  cpuIOWait: 'انتظار دیسک (I/O Wait)',
  cpuSteal: 'سرقت میزبان (Steal %)',
  ramUsed: 'رم %',
  swapUsed: 'Swap %',
  load1m: 'لود ۱ دقیقه',
  load5m: 'لود ۵ دقیقه',
  netRx: 'دریافت (RX)',
  netTx: 'ارسال (TX)',
  proCpuNote: 'نکته تخصصی: بالا بودن I/O Wait نشانه کندی دیسک و گلوگاه ذخیره‌سازی است. بالا بودن Steal % (بیش از ۵٪) یعنی سرور فیزیکی هاستینگ شلوغ (Oversell) است و CPU مجازی شما معطل می‌ماند.',
  noSysstatSamplesYet: 'سرویس sysstat فعال است؛ اولین نمونه تاریخی ظرف ۵ تا ۱۰ دقیقه آینده ثبت می‌شود.',
  incidentsTitle: 'تایم‌لاین حوادث و خطاهای سیستم (journald)',
  incidentsSub: '۱۰۰٪ بدون ایجنت — خواندن مستقیم لاگ هسته لینوکس و Systemd حتی بدون sysstat',
  filterAll: 'همه',
  filterReboot: 'ریبوت‌ها',
  filterOom: 'کمبود رم (OOM)',
  filterService: 'سرویس‌ها',
  filterSsh: 'ورود SSH',
  noIncidents: 'هیچ حادثه بحرانی، ریبوت یا خطای OOM در این بازه زمانی ثبت نشده است.',
  rawLogLabel: 'مشاهده لاگ خام سیستم',
  catReboot: 'ریبوت سرور',
  catOom: 'کشته‌شدن با OOM',
  catService: 'خطای سرویس',
  catSsh: 'تلاش ورود SSH',
  explainReboot: 'هسته لینوکس راه‌اندازی مجدد شده است. بررسی کنید که آیا به‌خاطر آپدیت برنامه‌ریزی‌شده بوده یا قطعی ناگهانی سرور.',
  explainOom: 'حافظه رم سرور کاملاً پر شد و هسته لینوکس برای جلوگیری از هنگ کردن کل سیستم، یک پردازش پرمصرف را به‌اجبار متوقف کرد.',
  explainService: 'یکی از سرویس‌های Systemd خطای جدی ثبت کرده یا به‌طور غیرمنتظره متوقف شده است. جزئیات فنی زیر را بررسی کنید.',
  explainSsh: 'تعداد زیادی تلاش ناموفق برای ورود SSH ثبت شده است. استفاده از کلید SSH و فعال بودن Fail2ban توصیه می‌شود.',
  insightHealthyTitle: 'وضعیت پایدار و سالم منابع',
  insightHealthyDesc: 'در این بازه زمانی مصرف CPU، رم، انتظار دیسک و لاگ‌های هسته لینوکس کاملاً در محدوده طبیعی بوده‌اند.',
  insightStealTitle: 'شلوغی سرور میزبان هاستینگ (CPU Steal بالا)',
  insightStealDesc: 'درصد Steal از ۵٪ عبور کرده است؛ یعنی سرور فیزیکی میزبان VPS شما تحت فشار سایر کاربران بوده و پردازنده مجازی شما منتظر مانده است.',
  insightIOWaitTitle: 'گلوگاه دیسک و ذخیره‌سازی (I/O Wait بالا)',
  insightIOWaitDesc: 'پردازنده زمان قابل‌توجهی را منتظر خواندن/نوشتن دیسک مانده است (معمولاً هنگام بکاپ‌گیری، چک‌پوینت دیتابیس یا کندی دیسک).',
  insightCpuTitle: 'بازه فشار سنگین روی CPU',
  insightCpuDesc: 'مصرف کل پردازنده از ۸۰٪ عبور کرده است. ساعت اوج مصرف را با ترافیک یا کرون‌جاب‌های سرور تطبیق دهید.',
  insightRamTitle: 'فشار بالا روی حافظه رم',
  insightRamDesc: 'مصرف رم به بالای ۸۵٪ رسیده است. رشد Swap و کانتینرهای پرمصرف را بررسی کنید تا به OOM Kill نرسد.',
  insightOomTitle: 'فعال شدن OOM Killer هسته لینوکس',
  insightOomDesc: 'به‌دلیل تمام شدن رم، هسته لینوکس حداقل یک پردازش را کشته است. افزودن Swap یا محدودسازی رم کانتینرها اکیداً توصیه می‌شود.',
  insightSshTitle: 'تلاش‌های مکرر ورود ناموفق SSH',
  insightSshDesc: 'تلاش‌های مشکوک ورود در لاگ sshd دیده شده است. غیرفعال بودن ورود با پسورد یا فعال بودن Fail2ban را چک کنید.',
  insightSvcTitle: 'ثبت خطا یا ری‌استارت سرویس‌های Systemd',
  insightSvcDesc: 'یک یا چند سرویس در این بازه دچار خطا یا خروج غیرمنتظره شده‌اند.',
  insightRebootTitle: 'ثبت ریبوت سرور در این بازه',
  insightRebootDesc: 'رویداد راه‌اندازی مجدد سرور در تاریخچه سیستم ثبت شده است.',
  insightSwapTitle: 'فشار روی حافظه Swap',
  insightSwapDesc: 'سیستم برای جبران کمبود رم به سراغ فضای Swap روی دیسک رفته که می‌تواند باعث کندی پاسخ‌دهی شود.',
  insightLoadTitle: 'افزایش صف پردازش (Load Average بالا)',
  insightLoadDesc: 'تعداد پردازش‌های منتظر CPU یا دیسک از حد معمول بالاتر رفته — کرون‌جاب‌ها یا کوئری‌های سنگین را بررسی کنید.',
  insightNetTitle: 'جهش قابل‌توجه ترافیک شبکه',
  insightNetDesc: 'یک پیک مصرف پهنای باند روی کارت شبکه اصلی سرور در این بازه زمانی ثبت شده است.',
  osNativeNotice: 'نکته مهم: sysstat (ابزارهای sar/sadf) یک پکیج رسمی و استاندارد خود سیستم‌عامل لینوکس از مخزن رسمی توزیع شماست و هیچ‌گونه اسکریپت یا ایجنت اختصاصی ZentraDeck نیست.',
  preflightBtn: '۱. ابتدا بررسی سازگاری و نبود تداخل سرور',
  preflightChecking: 'در حال بررسی سازگاری سرور...',
  preflightSafe: 'بررسی سرور با موفقیت انجام شد — هیچ تداخلی وجود ندارد و آماده فعال‌سازی است.',
  preflightWarn: 'نکات بررسی پیش از فعال‌سازی:',
  saveReportBtn: 'ذخیره فایل گزارش',
  reportSavedToast: 'فایل گزارش با موفقیت ذخیره شد',
  stabilityScoreLabel: 'امتیاز پایداری بازه',
  reportExecTitle: 'بخش اول: خلاصه مدیریتی سریع',
  reportFullTitle: 'بخش دوم: گزارش کامل تخصصی و تحلیلی',
};

const ZH: HistoryStrings = {
  ...EN,
  tabHistory: '历史报告',
  title: '服务器历史与故障分析报告',
  subtitle: '基于纯 SSH 的 24/7 资源趋势（sysstat）+ 系统事件时间线（journald）',
  range24h: '24 小时',
  range7d: '7 天',
  range30d: '30 天',
  refresh: '刷新',
  copyReport: '复制报告',
  reportCopied: '分析报告已复制到剪贴板',
  loading: '正在通过 SSH 读取历史指标与 journald 事件...',
  sysstatActiveBadge: 'sysstat 已启用 · 0 MB 常驻内存',
  sysstatOptionalBadge: 'journald 已启用 · sysstat 可选',
  optionalTitle: '24/7 历史曲线（可选安装官方 sysstat）',
  optionalBadge: '100% 可选',
  optionalBody: '此功能完全可选——即使不安装任何组件，实时监控与下方的系统事件时间线也已完整可用。仅当您希望在本地电脑关机时也能持续记录 24h/7d/30d 资源曲线时才需启用。',
  enableSysstatBtn: '一键启用官方 sysstat',
  enablingSysstat: '正在启用 sysstat...',
  manualCmdLabel: '查看完整 Linux 命令',
  peakCpu: 'CPU 峰值',
  avgLabel: '平均',
  peakRam: '内存峰值',
  peakIOWaitSteal: 'I/O 等待与宿主机 Steal',
  peakNetLoad: '负载与网络峰值',
  atTime: '于',
  insightsTitle: '智能诊断摘要',
  chartsTitle: '资源细分图表',
  incidentsTitle: '系统事件时间线 (journald)',
  filterAll: '全部',
  filterReboot: '重启',
  filterOom: '内存溢出 (OOM)',
  filterService: '服务异常',
  filterSsh: 'SSH 登录',
  noIncidents: '该时间段内未检测到严重故障、重启或 OOM 事件。',
  rawLogLabel: '查看原始系统日志',
  insightHealthyTitle: '资源运行平稳',
};

const PT: HistoryStrings = {
  ...EN,
  tabHistory: 'Histórico',
  title: 'Histórico do Servidor e Relatório Analítico',
  subtitle: 'Métricas 24/7 (sysstat) + linha do tempo de incidentes (journald) via SSH puro',
  range24h: '24 Horas',
  range7d: '7 Dias',
  range30d: '30 Dias',
  refresh: 'Atualizar',
  copyReport: 'Copiar Relatório',
  reportCopied: 'Relatório analítico copiado',
  optionalBadge: '100% Opcional',
  enableSysstatBtn: 'Ativar sysstat Oficial (1 Clique)',
  peakCpu: 'Pico de CPU',
  avgLabel: 'Méd',
  peakRam: 'Pico de RAM',
  insightsTitle: 'Análise Diagnóstica',
  chartsTitle: 'Gráficos Detalhados',
  incidentsTitle: 'Linha do Tempo de Incidentes (journald)',
  filterAll: 'Todos',
  filterReboot: 'Reinícios',
  filterService: 'Serviços',
  noIncidents: 'Nenhum incidente crítico, reinício ou OOM detectado neste período.',
  rawLogLabel: 'Ver log bruto do sistema',
};

const ES: HistoryStrings = {
  ...EN,
  tabHistory: 'Historial',
  title: 'Historial del Servidor e Informe Analítico',
  subtitle: 'Métricas 24/7 (sysstat) + línea de incidentes (journald) por SSH estándar',
  range24h: '24 Horas',
  range7d: '7 Días',
  range30d: '30 Días',
  refresh: 'Actualizar',
  copyReport: 'Copiar Informe',
  reportCopied: 'Informe analítico copiado',
  optionalBadge: '100% Opcional',
  enableSysstatBtn: 'Activar sysstat Oficial (1 Clic)',
  peakCpu: 'Pico de CPU',
  avgLabel: 'Prom',
  peakRam: 'Pico de RAM',
  insightsTitle: 'Diagnóstico Inteligente',
  chartsTitle: 'Gráficos de Recursos',
  incidentsTitle: 'Línea de Tiempo de Incidentes (journald)',
  filterAll: 'Todos',
  filterReboot: 'Reinicios',
  filterService: 'Servicios',
  noIncidents: 'No se detectaron incidentes críticos, reinicios ni OOM en este periodo.',
  rawLogLabel: 'Ver registro técnico',
};

const DE: HistoryStrings = {
  ...EN,
  tabHistory: 'Verlauf',
  title: 'Server-Verlauf & Analysebericht',
  subtitle: '24/7-Ressourcenverlauf (sysstat) + Ereignis-Timeline (journald) über reines SSH',
  range24h: '24 Stunden',
  range7d: '7 Tage',
  range30d: '30 Tage',
  refresh: 'Aktualisieren',
  copyReport: 'Bericht kopieren',
  reportCopied: 'Analysebericht in Zwischenablage kopiert',
  optionalBadge: '100% Optional',
  enableSysstatBtn: 'Offizielles sysstat aktivieren (1-Klick)',
  peakCpu: 'CPU-Spitze',
  avgLabel: 'Ø',
  peakRam: 'RAM-Spitze',
  insightsTitle: 'Diagnose-Auswertung',
  chartsTitle: 'Ressourcen-Diagramme',
  incidentsTitle: 'Ereignis- & Vorfall-Timeline (journald)',
  filterAll: 'Alle',
  filterReboot: 'Neustarts',
  filterService: 'Dienste',
  noIncidents: 'Keine kritischen Vorfälle, Neustarts oder OOM-Ereignisse in diesem Zeitraum.',
  rawLogLabel: 'Systemlog anzeigen',
};

const FR: HistoryStrings = {
  ...EN,
  tabHistory: 'Historique',
  title: 'Historique Serveur & Rapport Analytique',
  subtitle: 'Métriques 24/7 (sysstat) + chronologie des incidents (journald) via SSH pur',
  range24h: '24 Heures',
  range7d: '7 Jours',
  range30d: '30 Jours',
  refresh: 'Actualiser',
  copyReport: 'Copier le rapport',
  reportCopied: 'Rapport analytique copié',
  optionalBadge: '100% Optionnel',
  enableSysstatBtn: 'Activer sysstat officiel (1 clic)',
  peakCpu: 'Pic CPU',
  avgLabel: 'Moy',
  peakRam: 'Pic RAM',
  insightsTitle: 'Analyse diagnostique',
  chartsTitle: 'Graphiques détaillés',
  incidentsTitle: 'Chronologie des incidents (journald)',
  filterAll: 'Tous',
  filterReboot: 'Redémarrages',
  filterService: 'Services',
  noIncidents: 'Aucun incident critique, redémarrage ou OOM détecté sur cette période.',
  rawLogLabel: 'Voir le journal brut',
};

const JA: HistoryStrings = {
  ...EN,
  tabHistory: '履歴レポート',
  title: 'サーバー履歴・詳細分析レポート',
  subtitle: '24時間リソース履歴（sysstat）＋システム障害タイムライン（journald）を SSH で取得',
  range24h: '24時間',
  range7d: '7日間',
  range30d: '30日間',
  refresh: '更新',
  copyReport: 'レポートをコピー',
  reportCopied: '分析レポートをコピーしました',
  optionalBadge: '100% オプション',
  enableSysstatBtn: '公式 sysstat を有効化（1クリック）',
  peakCpu: 'CPU ピーク',
  avgLabel: '平均',
  peakRam: 'RAM ピーク',
  insightsTitle: '自動診断インサイト',
  chartsTitle: 'リソース内訳グラフ',
  incidentsTitle: 'インシデントタイムライン (journald)',
  filterAll: 'すべて',
  filterReboot: '再起動',
  filterService: 'サービス',
  noIncidents: 'この期間に重大な障害・再起動・OOM は検出されませんでした。',
  rawLogLabel: '生ログを表示',
};

const RU: HistoryStrings = {
  ...EN,
  tabHistory: 'История',
  title: 'История сервера и аналитический отчёт',
  subtitle: 'Графики 24/7 (sysstat) + лента системных событий (journald) через обычный SSH',
  range24h: '24 часа',
  range7d: '7 дней',
  range30d: '30 дней',
  refresh: 'Обновить',
  copyReport: 'Копировать отчёт',
  reportCopied: 'Аналитический отчёт скопирован',
  optionalBadge: '100% Опционально',
  enableSysstatBtn: 'Включить официальный sysstat (1 клик)',
  peakCpu: 'Пик CPU',
  avgLabel: 'Сред.',
  peakRam: 'Пик RAM',
  insightsTitle: 'Диагностические выводы',
  chartsTitle: 'Детализация ресурсов',
  incidentsTitle: 'Лента инцидентов и сбоев (journald)',
  filterAll: 'Все',
  filterReboot: 'Перезагрузки',
  filterService: 'Службы',
  noIncidents: 'За выбранный период критических сбоев, перезагрузок и OOM не обнаружено.',
  rawLogLabel: 'Показать системный лог',
};

const KO: HistoryStrings = {
  ...EN,
  tabHistory: '기록 리포트',
  title: '서버 이력 및 상세 분석 리포트',
  subtitle: '24/7 리소스 기록(sysstat) + 시스템 장애 타임라인(journald)을 SSH로 조회',
  range24h: '24시간',
  range7d: '7일',
  range30d: '30일',
  refresh: '새로고침',
  copyReport: '리포트 복사',
  reportCopied: '분석 리포트가 복사되었습니다',
  optionalBadge: '100% 선택 사항',
  enableSysstatBtn: '공식 sysstat 활성화 (원클릭)',
  peakCpu: '최대 CPU',
  avgLabel: '평균',
  peakRam: '최대 RAM',
  insightsTitle: '진단 인사이트',
  chartsTitle: '리소스 세부 차트',
  incidentsTitle: '장애 및 이벤트 타임라인 (journald)',
  filterAll: '전체',
  filterReboot: '재부팅',
  filterService: '서비스',
  noIncidents: '이 기간 동안 심각한 장애, 재부팅 또는 OOM이 감지되지 않았습니다.',
  rawLogLabel: '원본 시스템 로그 보기',
};

const ID: HistoryStrings = {
  ...EN,
  tabHistory: 'Riwayat',
  title: 'Riwayat Server & Laporan Analitik',
  subtitle: 'Grafik sumber daya 24/7 (sysstat) + linimasa insiden sistem (journald) via SSH',
  range24h: '24 Jam',
  range7d: '7 Hari',
  range30d: '30 Hari',
  refresh: 'Segarkan',
  copyReport: 'Salin Laporan',
  reportCopied: 'Laporan analitik disalin ke clipboard',
  optionalBadge: '100% Opsional',
  enableSysstatBtn: 'Aktifkan sysstat Resmi (1 Klik)',
  peakCpu: 'Puncak CPU',
  avgLabel: 'Rata2',
  peakRam: 'Puncak RAM',
  insightsTitle: 'Wawasan Diagnostik',
  chartsTitle: 'Grafik Rincian Sumber Daya',
  incidentsTitle: 'Linimasa Insiden & Event (journald)',
  filterAll: 'Semua',
  filterReboot: 'Reboot',
  filterService: 'Layanan',
  noIncidents: 'Tidak ada insiden kritis, reboot, atau OOM dalam rentang waktu ini.',
  rawLogLabel: 'Lihat log mentah sistem',
};

const HIST_MAP: Record<string, HistoryStrings> = {
  en: EN,
  fa: FA,
  zh: ZH,
  pt: PT,
  es: ES,
  de: DE,
  fr: FR,
  ja: JA,
  ru: RU,
  ko: KO,
  id: ID,
};

export function getHistoryStrings(lang: string): HistoryStrings {
  return HIST_MAP[lang] || EN;
}