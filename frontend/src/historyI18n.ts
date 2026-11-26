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
  tblMetric: string;
  tblPeak: string;
  tblAvg: string;
  tblPeakTime: string;
  rowCpuTotal: string;
}

const EN: HistoryStrings = {
  tabHistory: 'History & Report',
  title: 'Server History & Forensic Report',
  subtitle: 'Historical resource trends, automated root-cause diagnostics, and system incident timeline via SSH',
  range24h: '24 Hours', range7d: '7 Days', range30d: '30 Days',
  refresh: 'Refresh', copyReport: 'Copy Report', reportCopied: 'Report copied to clipboard', loading: 'Loading server history...',
  sysstatActiveBadge: 'sysstat Active (0 MB RAM)', sysstatOptionalBadge: 'Layer 1 Only (journald)',
  optionalTitle: 'Unlock Full Historical Resource Charts (Optional)', optionalBadge: '0 MB Resident RAM',
  optionalBody: 'ZentraDeck already analyzes crashes, OOM kills, reboots, and SSH events using native Linux logs. To record historical CPU, RAM, Disk I/O, CPU Steal, and Network graphs while ZentraDeck is closed, you can optionally enable the standard Linux sysstat package.',
  optionalPoint1: 'Zero background daemon — runs briefly via systemd timer and exits immediately.',
  optionalPoint2: 'Tiny disk footprint (~2–5 MB/month) with automatic rotation in /var/log/sysstat.',
  optionalPoint3: '100% removable anytime via your package manager with zero leftovers.',
  enableSysstatBtn: '2. Enable sysstat on Server', enablingSysstat: 'Enabling sysstat...', manualCmdLabel: 'Or view manual command',
  peakCpu: 'Peak CPU', avgLabel: 'Avg', peakRam: 'Peak RAM', peakIOWaitSteal: 'Disk I/O & CPU Steal', peakNetLoad: 'Peak Load & Network', atTime: 'at',
  insightsTitle: 'Automated Diagnostic Insights', insightsSub: 'Key findings inferred from historical metrics and system logs',
  chartsTitle: 'Historical Resource Graphs', chartCpu: 'CPU Breakdown', chartMemory: 'Memory & Swap', chartLoad: 'Load Average', chartNetwork: 'Network I/O',
  cpuUser: 'User %', cpuSystem: 'System %', cpuIOWait: 'I/O Wait %', cpuSteal: 'Host Steal %',
  ramUsed: 'RAM Used %', swapUsed: 'Swap Used %', load1m: 'Load 1m', load5m: 'Load 5m', netRx: 'Download (RX)', netTx: 'Upload (TX)',
  proCpuNote: 'Tip: High I/O Wait (amber) points to slow disk/storage bottlenecks; high CPU Steal (red) means your VPS host node is oversold.',
  noSysstatSamplesYet: 'sysstat is active, waiting for the first periodic samples to be recorded (~10 min).',
  incidentsTitle: 'Incident & Crash Timeline', incidentsSub: 'Extracted directly from systemd journald and wtmp without any installed agent',
  filterAll: 'All', filterReboot: 'Reboots', filterOom: 'OOM Kills', filterService: 'Services', filterSsh: 'SSH Auth',
  noIncidents: 'No critical incidents or crashes recorded in this period.', rawLogLabel: 'View raw log line',
  catReboot: 'Reboot', catOom: 'OOM Kill', catService: 'Service Crash', catSsh: 'SSH Auth',
  explainReboot: 'The server restarted (planned reboot, kernel update, or unexpected power loss).',
  explainOom: 'Linux ran out of RAM and the kernel OOM-Killer terminated a process to keep the OS alive.',
  explainService: 'A systemd service exited unexpectedly or failed during execution.',
  explainSsh: 'Suspicious or repeated failed SSH authentication attempts detected in system logs.',
  insightHealthyTitle: 'System Stability Looks Healthy', insightHealthyDesc: 'No severe resource spikes, host CPU throttling, or OOM crashes were detected in this timeframe.',
  insightStealTitle: 'VPS Host CPU Steal Detected', insightStealDesc: 'Other tenants on the physical VPS host are competing for CPU time, causing random latency spikes.',
  insightIOWaitTitle: 'High Disk I/O Wait Bottleneck', insightIOWaitDesc: 'CPU spent significant time waiting on disk reads/writes — check database queries, backups, or storage speed.',
  insightCpuTitle: 'High CPU Utilization Spike', insightCpuDesc: 'CPU peaked near saturation — review top processes or scheduled jobs around the peak timestamp.',
  insightRamTitle: 'Memory Pressure Detected', insightRamDesc: 'RAM usage approached full capacity, raising the risk of swapping or OOM process termination.',
  insightOomTitle: 'Out-Of-Memory (OOM) Kills Recorded', insightOomDesc: 'The Linux kernel forcefully killed one or more processes due to memory exhaustion.',
  insightSshTitle: 'SSH Brute-Force Activity', insightSshDesc: 'Repeated failed SSH login attempts were logged — ensure SSH keys and Fail2ban are enabled.',
  insightSvcTitle: 'Service Failures Detected', insightSvcDesc: 'One or more systemd services crashed or entered a failed state during this window.',
  insightRebootTitle: 'Server Reboots Recorded', insightRebootDesc: 'Server restart events were recorded in wtmp/last history during this period.',
  insightSwapTitle: 'Swap Memory Usage Elevated', insightSwapDesc: 'The server started spilling RAM pages into Swap disk space, which increases application latency.',
  insightLoadTitle: 'Elevated System Load Average', insightLoadDesc: 'CPU/IO run queue peaked above normal levels — check background cron jobs, database queries, or workers.',
  insightNetTitle: 'High Network Bandwidth Burst', insightNetDesc: 'A sustained high-throughput traffic burst was recorded on the primary network interface.',
  osNativeNotice: 'Important: sysstat (sar/sadf) is an official, standard Linux operating system package from your distro repository — NOT a ZentraDeck agent, custom script, or third-party binary.',
  preflightBtn: '1. Check Server Compatibility First', preflightChecking: 'Checking server compatibility...',
  preflightSafe: 'Server pre-flight check passed — zero conflicts detected.', preflightWarn: 'Review pre-flight notes before enabling:',
  saveReportBtn: 'Save Report', reportSavedToast: 'Report saved to disk', stabilityScoreLabel: 'Stability Score',
  reportExecTitle: 'Part 1: Executive Summary', reportFullTitle: 'Part 2: Full Forensic & Technical Report',
  tblMetric: 'Metric', tblPeak: 'Peak', tblAvg: 'Average', tblPeakTime: 'Peak Time', rowCpuTotal: 'CPU Total',
};

const FA: HistoryStrings = {
  tabHistory: 'تاریخچه و گزارش',
  title: 'تاریخچه سرور و گزارش تحلیلی',
  subtitle: 'روند تاریخی مصرف منابع، تحلیل هوشمند علت کندی و تایم‌لاین خطاها از طریق SSH',
  range24h: '۲۴ ساعت', range7d: '۷ روز', range30d: '۳۰ روز',
  refresh: 'بروزرسانی', copyReport: 'کپی گزارش', reportCopied: 'گزارش در کلیپ‌بورد کپی شد', loading: 'در حال دریافت تاریخچه سرور...',
  sysstatActiveBadge: 'sysstat فعال (۰ مگابایت رم)', sysstatOptionalBadge: 'لایه اول (فقط journald)',
  optionalTitle: 'فعال‌سازی نمودارهای تاریخی مصرف منابع (اختیاری)', optionalBadge: '۰ مگابایت رم مقیم',
  optionalBody: 'ZentraDeck همین الان هم کرش سرویس‌ها، OOM Kill، ریبوت‌ها و حملات SSH را از لاگ‌های بومی لینوکس تحلیل می‌کند. اگر می‌خواهید حتی زمانی که برنامه بسته است نمودار CPU، رم، دیسک، CPU Steal و شبکه ثبت شود، می‌توانید پکیج استاندارد sysstat لینوکس را فعال کنید.',
  optionalPoint1: 'بدون سرویس مقیم در رم — فقط هر چند دقیقه اجرا می‌شود و بلافاصله بسته می‌شود.',
  optionalPoint2: 'حجم بسیار کم روی دیسک (حدود ۲ تا ۵ مگابایت در ماه) با پاکسازی خودکار.',
  optionalPoint3: '۱۰۰٪ قابل حذف در هر زمان بدون هیچ فایل اضافی روی سرور.',
  enableSysstatBtn: '۲. فعال‌سازی sysstat روی سرور', enablingSysstat: 'در حال فعال‌سازی sysstat...', manualCmdLabel: 'یا مشاهده دستور دستی',
  peakCpu: 'اوج مصرف CPU', avgLabel: 'میانگین', peakRam: 'اوج مصرف رم', peakIOWaitSteal: 'انتظار دیسک و Steal', peakNetLoad: 'اوج لود و شبکه', atTime: 'در',
  insightsTitle: 'تحلیل هوشمند و عیب‌یابی خودکار', insightsSub: 'یافته‌های کلیدی استخراج‌شده از متریک‌های تاریخی و لاگ‌های سیستم',
  chartsTitle: 'نمودارهای تاریخی مصرف منابع', chartCpu: 'جزئیات CPU', chartMemory: 'رم و Swap', chartLoad: 'میانگین لود (Load)', chartNetwork: 'ترافیک شبکه',
  cpuUser: 'کاربر %', cpuSystem: 'سیستم %', cpuIOWait: 'انتظار دیسک %', cpuSteal: 'سرقت میزبان (Steal) %',
  ramUsed: 'رم مصرفی %', swapUsed: 'Swap مصرفی %', load1m: 'لود ۱ دقیقه', load5m: 'لود ۵ دقیقه', netRx: 'دانلود (RX)', netTx: 'آپلود (TX)',
  proCpuNote: 'نکته تخصصی: بالا بودن I/O Wait (نارنجی) نشانه گلوگاه دیسک و بالا بودن CPU Steal (قرمز) نشانه شلوغی بیش از حد سرور میزبان VPS است.',
  noSysstatSamplesYet: 'سرویس sysstat فعال است؛ منتظر ثبت اولین نمونه‌های دوره‌ای باشید (حدود ۱۰ دقیقه).',
  incidentsTitle: 'تایم‌لاین رویدادها و کرش‌ها', incidentsSub: 'استخراج مستقیم از systemd journald و wtmp بدون نیاز به نصب ایجنت',
  filterAll: 'همه', filterReboot: 'ریبوت‌ها', filterOom: 'کمبود رم (OOM)', filterService: 'سرویس‌ها', filterSsh: 'ورود SSH',
  noIncidents: 'هیچ رویداد بحرانی یا کرشی در این بازه زمانی ثبت نشده است.', rawLogLabel: 'مشاهده خط لاگ خام',
  catReboot: 'ریبوت', catOom: 'کمبود رم (OOM)', catService: 'کرش سرویس', catSsh: 'ورود SSH',
  explainReboot: 'سرور راه‌اندازی مجدد شده است (ریبوت دستی، آپدیت کرنل یا قطعی ناگهانی).',
  explainOom: 'رم سرور پر شده و هسته لینوکس (OOM-Killer) یک پردازش را برای زنده نگه داشتن سیستم بسته است.',
  explainService: 'یکی از سرویس‌های Systemd به‌طور غیرمنتظره متوقف شده یا به خطا خورده است.',
  explainSsh: 'تلاش‌های ناموفق و مشکوک ورود به SSH در لاگ‌های سیستم ثبت شده است.',
  insightHealthyTitle: 'پایداری سرور در وضعیت مطلوب است', insightHealthyDesc: 'در این بازه هیچ جهش خطرناک منابع، کندی میزبان یا کرش کمبود رم مشاهده نشد.',
  insightStealTitle: 'تشخیص CPU Steal از سرور میزبان', insightStealDesc: 'سایر سرورهای روی نود فیزیکی میزبان در حال رقابت بر سر CPU هستند و باعث کندی تصادفی می‌شوند.',
  insightIOWaitTitle: 'گلوگاه انتظار دیسک (I/O Wait بالا)', insightIOWaitDesc: 'پردازنده زمان زیادی منتظر خواندن/نوشتن روی دیسک بوده — کوئری‌های دیتابیس یا سرعت دیسک را بررسی کنید.',
  insightCpuTitle: 'جهش شدید مصرف CPU', insightCpuDesc: 'مصرف CPU به سقف نزدیک شده — پردازش‌ها یا کرون‌جاب‌های زمان اوج را بررسی کنید.',
  insightRamTitle: 'فشار بالا روی حافظه رم', insightRamDesc: 'مصرف رم به ظرفیت کامل نزدیک شده و خطر استفاده از Swap یا OOM Kill وجود دارد.',
  insightOomTitle: 'ثبت خطای کمبود رم (OOM Kill)', insightOomDesc: 'هسته لینوکس به‌دلیل پر شدن کامل رم، یک یا چند برنامه را به‌اجبار متوقف کرده است.',
  insightSshTitle: 'تلاش‌های نفوذ SSH (Brute-Force)', insightSshDesc: 'تلاش‌های ناموفق متعدد ورود SSH ثبت شده — از فعال بودن کلید SSH و Fail2ban مطمئن شوید.',
  insightSvcTitle: 'کرش یا خطای سرویس‌ها', insightSvcDesc: 'یک یا چند سرویس Systemd در این بازه زمانی متوقف یا دچار خطا شده‌اند.',
  insightRebootTitle: 'ثبت ریبوت‌های سرور', insightRebootDesc: 'رویداد راه‌اندازی مجدد سرور در تاریخچه سیستم ثبت شده است.',
  insightSwapTitle: 'فشار روی حافظه Swap', insightSwapDesc: 'سیستم برای جبران کمبود رم به سراغ فضای Swap روی دیسک رفته که می‌تواند باعث کندی پاسخ‌دهی شود.',
  insightLoadTitle: 'افزایش صف پردازش (Load Average بالا)', insightLoadDesc: 'تعداد پردازش‌های منتظر CPU یا دیسک از حد معمول بالاتر رفته — کرون‌جاب‌ها یا کوئری‌های سنگین را بررسی کنید.',
  insightNetTitle: 'جهش قابل‌توجه ترافیک شبکه', insightNetDesc: 'یک پیک مصرف پهنای باند روی کارت شبکه اصلی سرور در این بازه زمانی ثبت شده است.',
  osNativeNotice: 'نکته مهم: sysstat (ابزارهای sar/sadf) یک پکیج رسمی و استاندارد خود سیستم‌عامل لینوکس از مخزن رسمی توزیع شماست و هیچ‌گونه اسکریپت یا ایجنت اختصاصی ZentraDeck نیست.',
  preflightBtn: '۱. ابتدا بررسی سازگاری و نبود تداخل سرور', preflightChecking: 'در حال بررسی سازگاری سرور...',
  preflightSafe: 'بررسی سرور با موفقیت انجام شد — هیچ تداخلی وجود ندارد و آماده فعال‌سازی است.', preflightWarn: 'نکات بررسی پیش از فعال‌سازی:',
  saveReportBtn: 'ذخیره فایل گزارش', reportSavedToast: 'فایل گزارش با موفقیت ذخیره شد', stabilityScoreLabel: 'امتیاز پایداری بازه',
  reportExecTitle: 'بخش اول: خلاصه مدیریتی سریع', reportFullTitle: 'بخش دوم: گزارش کامل تخصصی و تحلیلی',
  tblMetric: 'شاخص', tblPeak: 'اوج مصرف', tblAvg: 'میانگین', tblPeakTime: 'زمان اوج', rowCpuTotal: 'مجموع CPU',
};

const ZH: HistoryStrings = {
  tabHistory: '历史与报告',
  title: '服务器历史记录与诊断报告',
  subtitle: '通过 SSH 获取历史资源趋势、自动根因分析与系统事件时间线',
  range24h: '24 小时', range7d: '7 天', range30d: '30 天',
  refresh: '刷新', copyReport: '复制报告', reportCopied: '报告已复制到剪贴板', loading: '正在加载服务器历史...',
  sysstatActiveBadge: 'sysstat 已启用（0 MB 常驻内存）', sysstatOptionalBadge: '仅第 1 层（journald）',
  optionalTitle: '解锁完整历史资源图表（可选）', optionalBadge: '0 MB 常驻内存',
  optionalBody: 'ZentraDeck 已通过 Linux 原生日志分析服务崩溃、OOM、重启和 SSH 事件。若希望在软件关闭时也记录 CPU、内存、磁盘 I/O、Steal 与网络曲线，可选择启用官方 sysstat 软件包。',
  optionalPoint1: '无后台常驻进程 — 仅由 systemd 定时器短暂运行并立即退出。',
  optionalPoint2: '极小磁盘占用（每月约 2–5 MB），自动轮转清理。',
  optionalPoint3: '随时可通过包管理器 100% 卸载，无任何残留。',
  enableSysstatBtn: '2. 在服务器上启用 sysstat', enablingSysstat: '正在启用 sysstat...', manualCmdLabel: '或查看手动命令',
  peakCpu: 'CPU 峰值', avgLabel: '平均', peakRam: '内存峰值', peakIOWaitSteal: '磁盘等待与 Steal', peakNetLoad: '负载与网络峰值', atTime: '于',
  insightsTitle: '自动诊断洞察', insightsSub: '基于历史指标与系统日志推断的关键发现',
  chartsTitle: '历史资源曲线', chartCpu: 'CPU 细分', chartMemory: '内存与 Swap', chartLoad: '系统负载', chartNetwork: '网络流量',
  cpuUser: '用户 %', cpuSystem: '系统 %', cpuIOWait: 'I/O 等待 %', cpuSteal: '宿主机争抢 %',
  ramUsed: '内存使用 %', swapUsed: 'Swap 使用 %', load1m: '1 分钟负载', load5m: '5 分钟负载', netRx: '下载 (RX)', netTx: '上传 (TX)',
  proCpuNote: '提示：I/O Wait（橙色）偏高表示磁盘瓶颈；CPU Steal（红色）偏高说明 VPS 物理宿主机超售严重。',
  noSysstatSamplesYet: 'sysstat 已启用，正在等待首批定时采样数据（约 10 分钟）。',
  incidentsTitle: '故障与事件时间线', incidentsSub: '直接从 systemd journald 与 wtmp 提取，无需安装任何代理',
  filterAll: '全部', filterReboot: '重启', filterOom: 'OOM 内存溢出', filterService: '服务异常', filterSsh: 'SSH 认证',
  noIncidents: '此时间段内未记录到严重故障或崩溃事件。', rawLogLabel: '查看原始日志',
  catReboot: '重启', catOom: 'OOM 终止', catService: '服务崩溃', catSsh: 'SSH 认证',
  explainReboot: '服务器发生了重启（计划重启、内核更新或意外断电）。',
  explainOom: '内存耗尽，Linux 内核 OOM-Killer 强制终止了进程以维持系统运行。',
  explainService: '某个 systemd 服务异常退出或运行失败。',
  explainSsh: '系统日志中检测到多次可疑的 SSH 登录失败尝试。',
  insightHealthyTitle: '系统运行稳定健康', insightHealthyDesc: '此期间未检测到严重资源飙升、宿主机限流或 OOM 崩溃。',
  insightStealTitle: '检测到 VPS 宿主机 CPU Steal', insightStealDesc: '物理宿主机上的其他租户正在争抢 CPU 资源，导致随机延迟升高。',
  insightIOWaitTitle: '磁盘 I/O 等待瓶颈偏高', insightIOWaitDesc: 'CPU 花费大量时间等待磁盘读写 — 请检查数据库查询、备份任务或磁盘性能。',
  insightCpuTitle: 'CPU 使用率出现高峰', insightCpuDesc: 'CPU 接近饱和 — 请排查峰值时间点附近的进程或定时任务。',
  insightRamTitle: '检测到内存压力', insightRamDesc: '内存接近上限，存在触发 Swap 变慢或 OOM 杀进程的风险。',
  insightOomTitle: '记录到 OOM 内存溢出事件', insightOomDesc: '因内存耗尽，Linux 内核强制终止了一个或多个进程。',
  insightSshTitle: '检测到 SSH 暴力破解活动', insightSshDesc: '记录到多次 SSH 登录失败 — 建议启用 SSH 密钥认证与 Fail2ban。',
  insightSvcTitle: '检测到服务故障', insightSvcDesc: '此期间有一个或多个 systemd 服务发生崩溃或失败。',
  insightRebootTitle: '记录到服务器重启', insightRebootDesc: '系统历史日志中记录了服务器重启事件。',
  insightSwapTitle: 'Swap 交换空间使用升高', insightSwapDesc: '系统开始将内存页换出到磁盘 Swap，可能会增加应用延迟。',
  insightLoadTitle: '系统平均负载偏高', insightLoadDesc: 'CPU/IO 等待队列高于正常水平 — 请检查后台任务或数据库查询。',
  insightNetTitle: '网络带宽出现突增', insightNetDesc: '主网卡在此期间记录到显著的高吞吐流量峰值。',
  osNativeNotice: '重要说明：sysstat（sar/sadf）是 Linux 发行版官方软件源提供的标准系统包，并非 ZentraDeck 代理或第三方脚本。',
  preflightBtn: '1. 先检查服务器兼容性', preflightChecking: '正在检查兼容性...',
  preflightSafe: '预检通过 — 未发现冲突，可安全启用。', preflightWarn: '启用前请查看预检提示：',
  saveReportBtn: '保存报告', reportSavedToast: '报告已保存到本地', stabilityScoreLabel: '稳定性评分',
  reportExecTitle: '第一部分：快速管理摘要', reportFullTitle: '第二部分：完整技术与诊断报告',
  tblMetric: '指标', tblPeak: '峰值', tblAvg: '平均值', tblPeakTime: '峰值时间', rowCpuTotal: 'CPU 总计',
};

const PT: HistoryStrings = {
  tabHistory: 'Histórico e Relatório',
  title: 'Histórico do Servidor e Relatório Forense',
  subtitle: 'Tendências históricas de recursos, diagnóstico automático e linha do tempo de incidentes via SSH',
  range24h: '24 Horas', range7d: '7 Dias', range30d: '30 Dias',
  refresh: 'Atualizar', copyReport: 'Copiar Relatório', reportCopied: 'Relatório copiado', loading: 'Carregando histórico...',
  sysstatActiveBadge: 'sysstat Ativo (0 MB RAM)', sysstatOptionalBadge: 'Camada 1 (journald)',
  optionalTitle: 'Ativar Gráficos Históricos de Recursos (Opcional)', optionalBadge: '0 MB RAM Residente',
  optionalBody: 'O ZentraDeck já analisa falhas, OOM, reinicializações e eventos SSH pelos logs nativos do Linux. Para gravar gráficos de CPU, RAM, Disco, Steal e Rede mesmo com o app fechado, você pode ativar o pacote padrão sysstat.',
  optionalPoint1: 'Zero daemon em segundo plano — executa brevemente via systemd timer e encerra.',
  optionalPoint2: 'Uso mínimo de disco (~2–5 MB/mês) com rotação automática.',
  optionalPoint3: '100% removível a qualquer momento sem deixar rastros.',
  enableSysstatBtn: '2. Ativar sysstat no Servidor', enablingSysstat: 'Ativando sysstat...', manualCmdLabel: 'Ou ver comando manual',
  peakCpu: 'Pico de CPU', avgLabel: 'Média', peakRam: 'Pico de RAM', peakIOWaitSteal: 'I/O de Disco e Steal', peakNetLoad: 'Pico de Load e Rede', atTime: 'às',
  insightsTitle: 'Diagnóstico Automático', insightsSub: 'Principais achados das métricas históricas e logs do sistema',
  chartsTitle: 'Gráficos Históricos de Recursos', chartCpu: 'Detalhes CPU', chartMemory: 'Memória e Swap', chartLoad: 'Carga (Load)', chartNetwork: 'Rede I/O',
  cpuUser: 'Usuário %', cpuSystem: 'Sistema %', cpuIOWait: 'Espera I/O %', cpuSteal: 'CPU Steal %',
  ramUsed: 'RAM Usada %', swapUsed: 'Swap Usado %', load1m: 'Load 1m', load5m: 'Load 5m', netRx: 'Download (RX)', netTx: 'Upload (TX)',
  proCpuNote: 'Dica: I/O Wait alto (âmbar) indica gargalo de disco; CPU Steal alto (vermelho) indica host VPS sobrecarregado.',
  noSysstatSamplesYet: 'sysstat ativo — aguardando as primeiras amostras periódicas (~10 min).',
  incidentsTitle: 'Linha do Tempo de Incidentes', incidentsSub: 'Extraído diretamente do systemd journald e wtmp sem instalar agentes',
  filterAll: 'Todos', filterReboot: 'Reinícios', filterOom: 'OOM Kills', filterService: 'Serviços', filterSsh: 'Auth SSH',
  noIncidents: 'Nenhum incidente crítico registrado neste período.', rawLogLabel: 'Ver linha de log bruta',
  catReboot: 'Reinício', catOom: 'OOM Kill', catService: 'Falha de Serviço', catSsh: 'Auth SSH',
  explainReboot: 'O servidor foi reiniciado (planejado, atualização de kernel ou queda de energia).',
  explainOom: 'A RAM esgotou e o OOM-Killer do kernel encerrou um processo para proteger o sistema.',
  explainService: 'Um serviço systemd falhou ou encerrou inesperadamente.',
  explainSsh: 'Tentativas suspeitas ou repetidas de login SSH com falha foram detectadas.',
  insightHealthyTitle: 'Estabilidade do Sistema Saudável', insightHealthyDesc: 'Nenhum pico severo de recursos, throttling ou OOM foi detectado neste período.',
  insightStealTitle: 'CPU Steal do Host VPS Detectado', insightStealDesc: 'Outros clientes no servidor físico estão competindo por CPU, causando latência aleatória.',
  insightIOWaitTitle: 'Gargalo Alto de I/O de Disco', insightIOWaitDesc: 'A CPU aguardou muito tempo por leitura/escrita em disco — verifique banco de dados ou backups.',
  insightCpuTitle: 'Pico Elevado de Uso de CPU', insightCpuDesc: 'A CPU chegou perto do limite — verifique processos ou tarefas agendadas no horário do pico.',
  insightRamTitle: 'Pressão de Memória Detectada', insightRamDesc: 'O uso de RAM aproximou-se da capacidade máxima, aumentando risco de Swap ou OOM.',
  insightOomTitle: 'Eventos de Falta de Memória (OOM)', insightOomDesc: 'O kernel Linux encerrou processos à força devido ao esgotamento da RAM.',
  insightSshTitle: 'Atividade de Força Bruta SSH', insightSshDesc: 'Várias falhas de login SSH registradas — mantenha chaves SSH e Fail2ban ativos.',
  insightSvcTitle: 'Falhas em Serviços Detectadas', insightSvcDesc: 'Um ou mais serviços systemd falharam neste intervalo.',
  insightRebootTitle: 'Reinicializações Registradas', insightRebootDesc: 'Eventos de reinício do servidor foram registrados no histórico.',
  insightSwapTitle: 'Uso Elevado de Memória Swap', insightSwapDesc: 'O servidor começou a usar Swap em disco, o que pode aumentar a latência.',
  insightLoadTitle: 'Carga Média do Sistema Elevada', insightLoadDesc: 'A fila de CPU/IO passou do normal — verifique cron jobs ou consultas pesadas.',
  insightNetTitle: 'Pico de Tráfego de Rede', insightNetDesc: 'Um alto volume de banda foi registrado na interface principal de rede.',
  osNativeNotice: 'Importante: sysstat (sar/sadf) é um pacote oficial do repositório do seu Linux — NÃO é um agente do ZentraDeck nem script de terceiros.',
  preflightBtn: '1. Verificar Compatibilidade Primeiro', preflightChecking: 'Verificando compatibilidade...',
  preflightSafe: 'Verificação aprovada — nenhum conflito detectado.', preflightWarn: 'Revise as notas antes de ativar:',
  saveReportBtn: 'Salvar Relatório', reportSavedToast: 'Relatório salvo no disco', stabilityScoreLabel: 'Índice de Estabilidade',
  reportExecTitle: 'Parte 1: Resumo Executivo', reportFullTitle: 'Parte 2: Relatório Técnico Completo',
  tblMetric: 'Métrica', tblPeak: 'Pico', tblAvg: 'Média', tblPeakTime: 'Horário do Pico', rowCpuTotal: 'CPU Total',
};

const ES: HistoryStrings = {
  tabHistory: 'Historial e Informe',
  title: 'Historial del Servidor e Informe Forense',
  subtitle: 'Tendencias históricas de recursos, diagnóstico automático y cronología de incidentes vía SSH',
  range24h: '24 Horas', range7d: '7 Días', range30d: '30 Días',
  refresh: 'Actualizar', copyReport: 'Copiar Informe', reportCopied: 'Informe copiado', loading: 'Cargando historial...',
  sysstatActiveBadge: 'sysstat Activo (0 MB RAM)', sysstatOptionalBadge: 'Solo Capa 1 (journald)',
  optionalTitle: 'Activar Gráficos Históricos de Recursos (Opcional)', optionalBadge: '0 MB RAM Residente',
  optionalBody: 'ZentraDeck ya analiza caídas, OOM, reinicios y eventos SSH desde los registros nativos de Linux. Para registrar gráficos históricos de CPU, RAM, Disco, Steal y Red con la app cerrada, puedes activar el paquete oficial sysstat.',
  optionalPoint1: 'Sin demonio residente — se ejecuta brevemente vía systemd timer y termina.',
  optionalPoint2: 'Espacio mínimo en disco (~2–5 MB/mes) con rotación automática.',
  optionalPoint3: '100% desinstalable en cualquier momento sin dejar residuos.',
  enableSysstatBtn: '2. Activar sysstat en el Servidor', enablingSysstat: 'Activando sysstat...', manualCmdLabel: 'O ver comando manual',
  peakCpu: 'Pico de CPU', avgLabel: 'Prom.', peakRam: 'Pico de RAM', peakIOWaitSteal: 'Espera E/S y Steal', peakNetLoad: 'Pico de Carga y Red', atTime: 'a las',
  insightsTitle: 'Diagnóstico Automático', insightsSub: 'Hallazgos clave inferidos de métricas históricas y registros',
  chartsTitle: 'Gráficos Históricos de Recursos', chartCpu: 'Desglose CPU', chartMemory: 'Memoria y Swap', chartLoad: 'Carga Media', chartNetwork: 'Red E/S',
  cpuUser: 'Usuario %', cpuSystem: 'Sistema %', cpuIOWait: 'Espera E/S %', cpuSteal: 'CPU Steal %',
  ramUsed: 'RAM Usada %', swapUsed: 'Swap Usado %', load1m: 'Carga 1m', load5m: 'Carga 5m', netRx: 'Descarga (RX)', netTx: 'Subida (TX)',
  proCpuNote: 'Consejo: Un I/O Wait alto (ámbar) señala cuello de botella en disco; un CPU Steal alto (rojo) indica nodo VPS saturado.',
  noSysstatSamplesYet: 'sysstat está activo; esperando las primeras muestras periódicas (~10 min).',
  incidentsTitle: 'Cronología de Incidentes', incidentsSub: 'Extraído directamente de systemd journald y wtmp sin agentes',
  filterAll: 'Todos', filterReboot: 'Reinicios', filterOom: 'OOM Kills', filterService: 'Servicios', filterSsh: 'Auth SSH',
  noIncidents: 'No se registraron incidentes críticos en este período.', rawLogLabel: 'Ver línea de log sin procesar',
  catReboot: 'Reinicio', catOom: 'OOM Kill', catService: 'Fallo de Servicio', catSsh: 'Auth SSH',
  explainReboot: 'El servidor se reinició (reinicio manual, actualización de kernel o corte eléctrico).',
  explainOom: 'La RAM se agotó y el OOM-Killer del kernel cerró un proceso para proteger el sistema.',
  explainService: 'Un servicio systemd falló o se detuvo inesperadamente.',
  explainSsh: 'Se detectaron intentos fallidos repetidos o sospechosos de acceso SSH.',
  insightHealthyTitle: 'Estabilidad del Sistema Saludable', insightHealthyDesc: 'No se detectaron picos graves, throttling del host ni cierres por OOM.',
  insightStealTitle: 'CPU Steal del Host VPS Detectado', insightStealDesc: 'Otros clientes en el nodo físico compiten por CPU, generando latencia irregular.',
  insightIOWaitTitle: 'Cuello de Botella en Disco (I/O Wait)', insightIOWaitDesc: 'La CPU esperó demasiado por lecturas/escrituras — revisa consultas BD o copias.',
  insightCpuTitle: 'Pico Alto de Uso de CPU', insightCpuDesc: 'La CPU rozó la saturación — revisa procesos o tareas cron en la hora del pico.',
  insightRamTitle: 'Presión de Memoria Detectada', insightRamDesc: 'El uso de RAM se acercó al máximo, aumentando el riesgo de Swap u OOM.',
  insightOomTitle: 'Eventos de Falta de Memoria (OOM)', insightOomDesc: 'El kernel Linux cerró procesos forzosamente por agotamiento de RAM.',
  insightSshTitle: 'Actividad de Fuerza Bruta SSH', insightSshDesc: 'Se registraron múltiples intentos fallidos SSH — activa claves SSH y Fail2ban.',
  insightSvcTitle: 'Fallos de Servicios Detectados', insightSvcDesc: 'Uno o más servicios systemd fallaron durante este intervalo.',
  insightRebootTitle: 'Reinicios del Servidor Registrados', insightRebootDesc: 'Se registraron reinicios del servidor en el historial del sistema.',
  insightSwapTitle: 'Uso Elevado de Memoria Swap', insightSwapDesc: 'El servidor empezó a volcar páginas de RAM al disco Swap, elevando la latencia.',
  insightLoadTitle: 'Carga Media del Sistema Elevada', insightLoadDesc: 'La cola de CPU/IO superó niveles normales — revisa tareas en segundo plano.',
  insightNetTitle: 'Ráfaga Alta de Ancho de Banda', insightNetDesc: 'Se registró un pico notable de tráfico en la interfaz de red principal.',
  osNativeNotice: 'Importante: sysstat (sar/sadf) es un paquete oficial de tu distribución Linux — NO es un agente de ZentraDeck ni un script de terceros.',
  preflightBtn: '1. Comprobar Compatibilidad Primero', preflightChecking: 'Comprobando compatibilidad...',
  preflightSafe: 'Comprobación superada — sin conflictos detectados.', preflightWarn: 'Revisa las notas antes de activar:',
  saveReportBtn: 'Guardar Informe', reportSavedToast: 'Informe guardado en disco', stabilityScoreLabel: 'Índice de Estabilidad',
  reportExecTitle: 'Parte 1: Resumen Ejecutivo', reportFullTitle: 'Parte 2: Informe Técnico Completo',
  tblMetric: 'Métrica', tblPeak: 'Pico', tblAvg: 'Promedio', tblPeakTime: 'Hora del Pico', rowCpuTotal: 'CPU Total',
};

const DE: HistoryStrings = {
  tabHistory: 'Verlauf & Bericht',
  title: 'Serververlauf & Forensikbericht',
  subtitle: 'Historische Ressourcentrends, automatische Diagnose und Vorfalls-Zeitachse über SSH',
  range24h: '24 Stunden', range7d: '7 Tage', range30d: '30 Tage',
  refresh: 'Aktualisieren', copyReport: 'Bericht kopieren', reportCopied: 'Bericht kopiert', loading: 'Lade Serververlauf...',
  sysstatActiveBadge: 'sysstat Aktiv (0 MB RAM)', sysstatOptionalBadge: 'Nur Ebene 1 (journald)',
  optionalTitle: 'Historische Ressourcendiagramme aktivieren (Optional)', optionalBadge: '0 MB RAM-Bedarf',
  optionalBody: 'ZentraDeck analysiert Abstürze, OOM-Kills, Neustarts und SSH-Vorfälle bereits über native Linux-Logs. Für historische CPU-, RAM-, I/O-, Steal- und Netzwerkkurven können Sie das offizielle Linux-Paket sysstat aktivieren.',
  optionalPoint1: 'Kein Hintergrund-Daemon — läuft kurz per systemd-Timer und beendet sich sofort.',
  optionalPoint2: 'Minimaler Speicherplatz (~2–5 MB/Monat) mit automatischer Rotation.',
  optionalPoint3: 'Jederzeit rückstandsfrei über die Paketverwaltung entfernbar.',
  enableSysstatBtn: '2. sysstat auf Server aktivieren', enablingSysstat: 'Aktiviere sysstat...', manualCmdLabel: 'Oder manuellen Befehl anzeigen',
  peakCpu: 'CPU-Spitze', avgLabel: 'Ø', peakRam: 'RAM-Spitze', peakIOWaitSteal: 'Disk I/O & Steal', peakNetLoad: 'Last & Netzwerk', atTime: 'um',
  insightsTitle: 'Automatische Diagnose', insightsSub: 'Wichtige Erkenntnisse aus historischen Metriken und Systemlogs',
  chartsTitle: 'Historische Ressourcengrafiken', chartCpu: 'CPU-Details', chartMemory: 'RAM & Swap', chartLoad: 'Systemlast', chartNetwork: 'Netzwerk I/O',
  cpuUser: 'Benutzer %', cpuSystem: 'System %', cpuIOWait: 'I/O-Wartezeit %', cpuSteal: 'Host-Steal %',
  ramUsed: 'RAM Belegt %', swapUsed: 'Swap Belegt %', load1m: 'Last 1m', load5m: 'Last 5m', netRx: 'Download (RX)', netTx: 'Upload (TX)',
  proCpuNote: 'Tipp: Hohes I/O Wait (gelb) deutet auf Festplattenengpässe hin; hohes CPU Steal (rot) auf einen überbuchten VPS-Host.',
  noSysstatSamplesYet: 'sysstat ist aktiv — warte auf die ersten Messwerte (~10 Min.).',
  incidentsTitle: 'Vorfalls- & Absturzverlauf', incidentsSub: 'Direkt aus systemd journald und wtmp ohne Agenten gelesen',
  filterAll: 'Alle', filterReboot: 'Neustarts', filterOom: 'OOM-Kills', filterService: 'Dienste', filterSsh: 'SSH-Auth',
  noIncidents: 'Keine kritischen Vorfälle in diesem Zeitraum aufgezeichnet.', rawLogLabel: 'Roh-Logzeile anzeigen',
  catReboot: 'Neustart', catOom: 'OOM-Kill', catService: 'Dienstfehler', catSsh: 'SSH-Auth',
  explainReboot: 'Der Server wurde neu gestartet (geplant, Kernel-Update oder Stromausfall).',
  explainOom: 'Der Arbeitsspeicher war voll und der Linux-OOM-Killer hat einen Prozess beendet.',
  explainService: 'Ein systemd-Dienst wurde unerwartet beendet oder ist fehlgeschlagen.',
  explainSsh: 'Wiederholte fehlgeschlagene SSH-Anmeldeversuche wurden protokolliert.',
  insightHealthyTitle: 'Systemstabilität sieht gesund aus', insightHealthyDesc: 'Keine kritischen Spitzen, Host-Drosselung oder OOM-Abstürze erkannt.',
  insightStealTitle: 'VPS-Host CPU-Steal erkannt', insightStealDesc: 'Andere Instanzen auf dem Host konkurrieren um CPU-Zeit und verursachen Latenzen.',
  insightIOWaitTitle: 'Hoher Disk-I/O-Engpass', insightIOWaitDesc: 'Die CPU wartete lange auf Datenträgerzugriffe — prüfen Sie Datenbanken oder Backups.',
  insightCpuTitle: 'Hohe CPU-Auslastungsspitze', insightCpuDesc: 'Die CPU war nahezu ausgelastet — prüfen Sie Prozesse zur Spitzenzeit.',
  insightRamTitle: 'Speicherdruck erkannt', insightRamDesc: 'Der RAM-Verbrauch näherte sich dem Maximum (Swap-/OOM-Risiko).',
  insightOomTitle: 'Out-Of-Memory (OOM) Ereignisse', insightOomDesc: 'Der Linux-Kernel musste Prozesse wegen Speichermangels beenden.',
  insightSshTitle: 'SSH-Brute-Force-Aktivität', insightSshDesc: 'Mehrere fehlgeschlagene SSH-Logins — nutzen Sie SSH-Keys und Fail2ban.',
  insightSvcTitle: 'Dienstfehler erkannt', insightSvcDesc: 'Ein oder mehrere systemd-Dienste sind abgestürzt oder fehlgeschlagen.',
  insightRebootTitle: 'Server-Neustarts erfasst', insightRebootDesc: 'Im Zeitraum wurden Neustarts des Servers protokolliert.',
  insightSwapTitle: 'Erhöhte Swap-Nutzung', insightSwapDesc: 'RAM-Seiten wurden auf Swap ausgelagert, was die Latenz erhöhen kann.',
  insightLoadTitle: 'Erhöhte Systemlast (Load Average)', insightLoadDesc: 'Die Prozesswarteschlange überstieg normale Werte — prüfen Sie Cronjobs/Abfragen.',
  insightNetTitle: 'Starke Netzwerk-Traffic-Spitze', insightNetDesc: 'Auf der primären Netzwerkschnittstelle wurde eine hohe Bandbreitenspitze gemessen.',
  osNativeNotice: 'Wichtig: sysstat (sar/sadf) ist ein offizielles Standardpaket Ihrer Linux-Distribution — KEIN ZentraDeck-Agent oder Drittanbieter-Skript.',
  preflightBtn: '1. Zuerst Kompatibilität prüfen', preflightChecking: 'Prüfe Kompatibilität...',
  preflightSafe: 'Vorprüfung bestanden — keine Konflikte gefunden.', preflightWarn: 'Hinweise vor der Aktivierung prüfen:',
  saveReportBtn: 'Bericht speichern', reportSavedToast: 'Bericht gespeichert', stabilityScoreLabel: 'Stabilitätswert',
  reportExecTitle: 'Teil 1: Management-Zusammenfassung', reportFullTitle: 'Teil 2: Vollständiger technischer Bericht',
  tblMetric: 'Metrik', tblPeak: 'Spitze', tblAvg: 'Durchschnitt', tblPeakTime: 'Spitzenzeit', rowCpuTotal: 'CPU Gesamt',
};

const FR: HistoryStrings = {
  tabHistory: 'Historique & Rapport',
  title: 'Historique Serveur & Rapport Forensique',
  subtitle: 'Tendances historiques des ressources, diagnostic automatique et chronologie des incidents via SSH',
  range24h: '24 Heures', range7d: '7 Jours', range30d: '30 Jours',
  refresh: 'Actualiser', copyReport: 'Copier le rapport', reportCopied: 'Rapport copié', loading: 'Chargement de l’historique...',
  sysstatActiveBadge: 'sysstat Actif (0 Mo RAM)', sysstatOptionalBadge: 'Couche 1 (journald)',
  optionalTitle: 'Activer les graphiques historiques (Optionnel)', optionalBadge: '0 Mo RAM résidente',
  optionalBody: 'ZentraDeck analyse déjà les plantages, OOM, redémarrages et alertes SSH depuis les journaux Linux natifs. Pour enregistrer les courbes CPU, RAM, Disque, Steal et Réseau même application fermée, activez le paquet standard sysstat.',
  optionalPoint1: 'Aucun démon résident — s’exécute brièvement via systemd timer puis s’arrête.',
  optionalPoint2: 'Empreinte disque minime (~2–5 Mo/mois) avec rotation automatique.',
  optionalPoint3: '100% désinstallable à tout moment sans aucun résidu.',
  enableSysstatBtn: '2. Activer sysstat sur le serveur', enablingSysstat: 'Activation de sysstat...', manualCmdLabel: 'Ou voir la commande manuelle',
  peakCpu: 'Pic CPU', avgLabel: 'Moy.', peakRam: 'Pic RAM', peakIOWaitSteal: 'I/O Disque & Steal', peakNetLoad: 'Pic Charge & Réseau', atTime: 'à',
  insightsTitle: 'Diagnostic Automatique', insightsSub: 'Conclusions clés déduites des métriques historiques et journaux',
  chartsTitle: 'Graphiques Historiques', chartCpu: 'Détail CPU', chartMemory: 'Mémoire & Swap', chartLoad: 'Charge (Load)', chartNetwork: 'Réseau I/O',
  cpuUser: 'Utilisateur %', cpuSystem: 'Système %', cpuIOWait: 'Attente I/O %', cpuSteal: 'CPU Steal %',
  ramUsed: 'RAM Utilisée %', swapUsed: 'Swap Utilisé %', load1m: 'Charge 1m', load5m: 'Charge 5m', netRx: 'Réception (RX)', netTx: 'Émission (TX)',
  proCpuNote: 'Astuce : un I/O Wait élevé (ambre) révèle un goulot disque ; un CPU Steal élevé (rouge) indique un hôte VPS surchargé.',
  noSysstatSamplesYet: 'sysstat est actif — en attente des premiers échantillons (~10 min).',
  incidentsTitle: 'Chronologie des incidents', incidentsSub: 'Extrait directement de systemd journald et wtmp sans agent',
  filterAll: 'Tous', filterReboot: 'Redémarrages', filterOom: 'OOM Kills', filterService: 'Services', filterSsh: 'Auth SSH',
  noIncidents: 'Aucun incident critique enregistré sur cette période.', rawLogLabel: 'Voir la ligne brute',
  catReboot: 'Redémarrage', catOom: 'OOM Kill', catService: 'Panne Service', catSsh: 'Auth SSH',
  explainReboot: 'Le serveur a redémarré (redémarrage manuel, mise à jour noyau ou coupure).',
  explainOom: 'La RAM a été saturée et l’OOM-Killer du noyau a arrêté un processus.',
  explainService: 'Un service systemd s’est arrêté de manière inattendue ou a échoué.',
  explainSsh: 'Des tentatives répétées d’authentification SSH échouées ont été détectées.',
  insightHealthyTitle: 'Stabilité du système saine', insightHealthyDesc: 'Aucun pic critique, bridage hôte ou arrêt OOM détecté sur cette période.',
  insightStealTitle: 'CPU Steal hôte VPS détecté', insightStealDesc: 'D’autres instances sur le nœud physique concurrencent votre CPU, créant des latences.',
  insightIOWaitTitle: 'Goulot d’attente disque (I/O Wait)', insightIOWaitDesc: 'Le CPU a attendu les accès disque — vérifiez bases de données ou sauvegardes.',
  insightCpuTitle: 'Pic élevé d’utilisation CPU', insightCpuDesc: 'Le CPU a approché la saturation — vérifiez les processus au moment du pic.',
  insightRamTitle: 'Pression mémoire détectée', insightRamDesc: 'La RAM a approché sa capacité maximale (risque de Swap ou OOM).',
  insightOomTitle: 'Arrêts manque de mémoire (OOM)', insightOomDesc: 'Le noyau Linux a dû arrêter des processus par manque de RAM.',
  insightSshTitle: 'Activité force brute SSH', insightSshDesc: 'Échecs SSH répétés détectés — activez les clés SSH et Fail2ban.',
  insightSvcTitle: 'Défaillances de services détectées', insightSvcDesc: 'Un ou plusieurs services systemd ont échoué durant cette période.',
  insightRebootTitle: 'Redémarrages serveur enregistrés', insightRebootDesc: 'Des redémarrages ont été relevés dans l’historique système.',
  insightSwapTitle: 'Utilisation élevée du Swap', insightSwapDesc: 'Le système a déchargé de la RAM sur le disque Swap, augmentant la latence.',
  insightLoadTitle: 'Charge moyenne système élevée', insightLoadDesc: 'La file CPU/IO a dépassé la normale — vérifiez tâches cron et requêtes.',
  insightNetTitle: 'Pic important de bande passante', insightNetDesc: 'Une forte poussée de trafic réseau a été enregistrée sur l’interface principale.',
  osNativeNotice: 'Important : sysstat (sar/sadf) est un paquet officiel de votre distribution Linux — PAS un agent ZentraDeck ni un script tiers.',
  preflightBtn: '1. Vérifier la compatibilité d’abord', preflightChecking: 'Vérification...',
  preflightSafe: 'Vérification réussie — aucun conflit détecté.', preflightWarn: 'Points à vérifier avant activation :',
  saveReportBtn: 'Enregistrer', reportSavedToast: 'Rapport enregistré sur le disque', stabilityScoreLabel: 'Score de stabilité',
  reportExecTitle: 'Partie 1 : Résumé exécutif', reportFullTitle: 'Partie 2 : Rapport technique complet',
  tblMetric: 'Métrique', tblPeak: 'Pic', tblAvg: 'Moyenne', tblPeakTime: 'Heure du pic', rowCpuTotal: 'CPU Total',
};

const JA: HistoryStrings = {
  tabHistory: '履歴とレポート',
  title: 'サーバー履歴と診断レポート',
  subtitle: 'SSH 経由で過去のリソース推移・自動原因分析・障害タイムラインを取得',
  range24h: '24時間', range7d: '7日間', range30d: '30日間',
  refresh: '更新', copyReport: 'レポートをコピー', reportCopied: 'レポートをコピーしました', loading: 'サーバー履歴を読み込み中...',
  sysstatActiveBadge: 'sysstat 有効 (常駐メモリ 0 MB)', sysstatOptionalBadge: 'レイヤー1のみ (journald)',
  optionalTitle: '履歴リソースグラフを有効化（任意）', optionalBadge: '常駐 RAM 0 MB',
  optionalBody: 'ZentraDeck は Linux 標準ログからクラッシュ・OOM・再起動・SSH 攻撃を既に解析しています。アプリ終了中も CPU・RAM・ディスク・Steal・ネットワーク推移を記録するには、標準パッケージ sysstat を有効にできます。',
  optionalPoint1: '常駐デーモンなし — systemd タイマーで短時間だけ実行しすぐ終了します。',
  optionalPoint2: 'ディスク消費はごくわずか（月 約2〜5 MB）で自動ローテーション。',
  optionalPoint3: 'パッケージ管理からいつでも完全に削除可能です。',
  enableSysstatBtn: '2. サーバーで sysstat を有効化', enablingSysstat: '有効化中...', manualCmdLabel: '手動コマンドを表示',
  peakCpu: '最大 CPU', avgLabel: '平均', peakRam: '最大 RAM', peakIOWaitSteal: 'I/O 待機 & Steal', peakNetLoad: '最大ロード & 通信', atTime: '時刻',
  insightsTitle: '自動診断インサイト', insightsSub: '履歴メトリクスとシステムログから抽出した重要所見',
  chartsTitle: 'リソース推移グラフ', chartCpu: 'CPU 内訳', chartMemory: 'メモリ & Swap', chartLoad: 'ロードアベレージ', chartNetwork: 'ネットワーク',
  cpuUser: 'ユーザー %', cpuSystem: 'システム %', cpuIOWait: 'I/O 待機 %', cpuSteal: 'ホスト Steal %',
  ramUsed: 'RAM 使用率 %', swapUsed: 'Swap 使用率 %', load1m: '1分ロード', load5m: '5分ロード', netRx: '受信 (RX)', netTx: '送信 (TX)',
  proCpuNote: 'ヒント：I/O Wait（橙）が高い場合はディスク遅延、CPU Steal（赤）が高い場合は VPS ホストの過密を示します。',
  noSysstatSamplesYet: 'sysstat は有効です。初回サンプル記録までお待ちください（約10分）。',
  incidentsTitle: '障害・イベントタイムライン', incidentsSub: 'エージェント不要で systemd journald と wtmp から直接抽出',
  filterAll: 'すべて', filterReboot: '再起動', filterOom: 'OOM 強制終了', filterService: 'サービス', filterSsh: 'SSH 認証',
  noIncidents: 'この期間に重大な障害やクラッシュは記録されていません。', rawLogLabel: '生ログを表示',
  catReboot: '再起動', catOom: 'OOM Kill', catService: 'サービス障害', catSsh: 'SSH 認証',
  explainReboot: 'サーバーが再起動されました（計画再起動・カーネル更新・電源断など）。',
  explainOom: 'メモリ不足のため Linux カーネルの OOM-Killer がプロセスを強制終了しました。',
  explainService: 'systemd サービスが予期せず終了または失敗しました。',
  explainSsh: 'システムログに繰り返しの SSH ログイン失敗が記録されています。',
  insightHealthyTitle: 'システムは安定稼働中', insightHealthyDesc: '深刻なリソース急増・ホスト制限・OOM 障害は検出されませんでした。',
  insightStealTitle: 'VPS ホストの CPU Steal を検出', insightStealDesc: '物理ホスト上の他テナントと CPU が競合し、遅延が発生しています。',
  insightIOWaitTitle: 'ディスク I/O 待機ボトルネック', insightIOWaitDesc: 'ディスク読み書き待ち時間が長くなっています。DB やバックアップを確認してください。',
  insightCpuTitle: 'CPU 使用率の急増', insightCpuDesc: 'CPU が飽和付近まで上昇しました。ピーク時刻のプロセスや Cron を確認してください。',
  insightRamTitle: 'メモリ逼迫を検出', insightRamDesc: 'RAM 使用率が上限に近づいており、Swap 増加や OOM のリスクがあります。',
  insightOomTitle: 'メモリ不足（OOM Kill）を記録', insightOomDesc: 'メモリ枯渇によりカーネルがプロセスを強制終了しました。',
  insightSshTitle: 'SSH ブルートフォース試行', insightSshDesc: 'SSH 認証失敗が多数記録されています。鍵認証と Fail2ban を推奨します。',
  insightSvcTitle: 'サービス障害を検出', insightSvcDesc: 'この期間に 1 つ以上の systemd サービスが失敗しました。',
  insightRebootTitle: 'サーバー再起動を記録', insightRebootDesc: '履歴にサーバーの再起動イベントが記録されています。',
  insightSwapTitle: 'Swap メモリ使用量の上昇', insightSwapDesc: 'RAM 不足によりディスク Swap が使用され、応答遅延の原因になります。',
  insightLoadTitle: 'システム負荷（Load）上昇', insightLoadDesc: 'CPU/IO 待機キューが通常値を超えました。バックグラウンド処理を確認してください。',
  insightNetTitle: 'ネットワーク帯域の急増', insightNetDesc: '主要ネットワークインターフェースで大きなトラフィックバーストを記録しました。',
  osNativeNotice: '重要：sysstat（sar/sadf）は Linux 公式リポジトリの標準パッケージであり、ZentraDeck 独自エージェントや外部スクリプトではありません。',
  preflightBtn: '1. まずサーバー互換性をチェック', preflightChecking: '互換性を確認中...',
  preflightSafe: '事前チェック合格 — 競合は検出されませんでした。', preflightWarn: '有効化前の確認事項：',
  saveReportBtn: 'レポート保存', reportSavedToast: 'レポートを保存しました', stabilityScoreLabel: '安定性スコア',
  reportExecTitle: '第1部：エグゼクティブサマリー', reportFullTitle: '第2部：詳細技術・診断レポート',
  tblMetric: '指標', tblPeak: '最大値', tblAvg: '平均値', tblPeakTime: 'ピーク時刻', rowCpuTotal: 'CPU 合計',
};

const RU: HistoryStrings = {
  tabHistory: 'История и отчёт',
  title: 'История сервера и диагностический отчёт',
  subtitle: 'Динамика ресурсов, автодиагностика причин и хронология инцидентов по SSH',
  range24h: '24 часа', range7d: '7 дней', range30d: '30 дней',
  refresh: 'Обновить', copyReport: 'Копировать отчёт', reportCopied: 'Отчёт скопирован', loading: 'Загрузка истории сервера...',
  sysstatActiveBadge: 'sysstat Активен (0 МБ ОЗУ)', sysstatOptionalBadge: 'Только уровень 1 (journald)',
  optionalTitle: 'Включить графики истории ресурсов (Опционально)', optionalBadge: '0 МБ в ОЗУ',
  optionalBody: 'ZentraDeck уже анализирует сбои, OOM, перезагрузки и SSH-атаки из штатных логов Linux. Чтобы записывать графики CPU, RAM, диска, Steal и сети даже при закрытом приложении, можно включить стандартный пакет sysstat.',
  optionalPoint1: 'Без фонового демона — запускается таймером systemd и сразу завершается.',
  optionalPoint2: 'Минимальное место на диске (~2–5 МБ/мес) с автоочисткой.',
  optionalPoint3: 'Удаляется полностью через пакетный менеджер в любой момент.',
  enableSysstatBtn: '2. Включить sysstat на сервере', enablingSysstat: 'Включение sysstat...', manualCmdLabel: 'Или команда вручную',
  peakCpu: 'Пик CPU', avgLabel: 'Сред.', peakRam: 'Пик RAM', peakIOWaitSteal: 'I/O диска и Steal', peakNetLoad: 'Пик Load и сети', atTime: 'в',
  insightsTitle: 'Автоматическая диагностика', insightsSub: 'Ключевые выводы из метрик истории и системных журналов',
  chartsTitle: 'Графики истории ресурсов', chartCpu: 'Детали CPU', chartMemory: 'Память и Swap', chartLoad: 'Нагрузка (Load)', chartNetwork: 'Сеть I/O',
  cpuUser: 'Польз. %', cpuSystem: 'Систем. %', cpuIOWait: 'Ожидание I/O %', cpuSteal: 'Host Steal %',
  ramUsed: 'Занято RAM %', swapUsed: 'Занято Swap %', load1m: 'Load 1м', load5m: 'Load 5м', netRx: 'Входящий (RX)', netTx: 'Исходящий (TX)',
  proCpuNote: 'Совет: высокий I/O Wait (оранжевый) указывает на узкое место диска; высокий CPU Steal (красный) — на перегрузку хоста VPS.',
  noSysstatSamplesYet: 'sysstat активен — ожидаем первые периодические замеры (~10 мин).',
  incidentsTitle: 'Хронология инцидентов и сбоев', incidentsSub: 'Получено напрямую из systemd journald и wtmp без установки агентов',
  filterAll: 'Все', filterReboot: 'Перезагрузки', filterOom: 'OOM Kills', filterService: 'Службы', filterSsh: 'SSH Входы',
  noIncidents: 'Критических сбоев за этот период не зафиксировано.', rawLogLabel: 'Показать исходный лог',
  catReboot: 'Перезагрузка', catOom: 'OOM Kill', catService: 'Сбой службы', catSsh: 'SSH Вход',
  explainReboot: 'Сервер был перезагружен (планово, после обновления ядра или сбоя питания).',
  explainOom: 'ОЗУ закончилось, и ядро (OOM-Killer) принудительно завершило процесс.',
  explainService: 'Служба systemd аварийно завершилась или перешла в состояние ошибки.',
  explainSsh: 'В логах обнаружены повторяющиеся неудачные попытки входа по SSH.',
  insightHealthyTitle: 'Стабильность системы в норме', insightHealthyDesc: 'Серьёзных скачков нагрузки, троттлинга хоста или OOM-сбоев не выявлено.',
  insightStealTitle: 'Обнаружен CPU Steal хоста VPS', insightStealDesc: 'Соседние виртуальные машины на узле конкурируют за CPU, вызывая задержки.',
  insightIOWaitTitle: 'Высокое ожидание диска (I/O Wait)', insightIOWaitDesc: 'CPU долго ждал операций чтения/записи — проверьте БД, бэкапы или диск.',
  insightCpuTitle: 'Пик высокой нагрузки CPU', insightCpuDesc: 'Загрузка CPU приближалась к максимуму — проверьте процессы в момент пика.',
  insightRamTitle: 'Высокая нагрузка на ОЗУ', insightRamDesc: 'Использование RAM близко к пределу, есть риск свопинга или OOM.',
  insightOomTitle: 'Зафиксированы события OOM Kill', insightOomDesc: 'Ядро Linux принудительно завершило процессы из-за нехватки памяти.',
  insightSshTitle: 'Попытки перебора паролей SSH', insightSshDesc: 'Много неудачных входов SSH — используйте SSH-ключи и Fail2ban.',
  insightSvcTitle: 'Обнаружены сбои служб', insightSvcDesc: 'Одна или несколько служб systemd завершались с ошибкой.',
  insightRebootTitle: 'Зафиксированы перезагрузки', insightRebootDesc: 'В истории системы отмечены перезагрузки сервера.',
  insightSwapTitle: 'Повышенное использование Swap', insightSwapDesc: 'Система выгружает страницы RAM на диск Swap, что замедляет отклик.',
  insightLoadTitle: 'Повышенная средняя нагрузка (Load)', insightLoadDesc: 'Очередь CPU/IO выше нормы — проверьте cron-задачи или тяжёлые запросы.',
  insightNetTitle: 'Всплеск сетевого трафика', insightNetDesc: 'На основном сетевом интерфейсе зафиксирован пик пропускной способности.',
  osNativeNotice: 'Важно: sysstat (sar/sadf) — официальный стандартный пакет вашего дистрибутива Linux, а НЕ агент ZentraDeck или сторонний скрипт.',
  preflightBtn: '1. Сначала проверить совместимость', preflightChecking: 'Проверка совместимости...',
  preflightSafe: 'Проверка пройдена — конфликтов не обнаружено.', preflightWarn: 'Замечания перед включением:',
  saveReportBtn: 'Сохранить отчёт', reportSavedToast: 'Отчёт сохранён на диск', stabilityScoreLabel: 'Индекс стабильности',
  reportExecTitle: 'Часть 1: Краткая сводка', reportFullTitle: 'Часть 2: Полный технический отчёт',
  tblMetric: 'Метрика', tblPeak: 'Пик', tblAvg: 'Среднее', tblPeakTime: 'Время пика', rowCpuTotal: 'CPU Всего',
};

const KO: HistoryStrings = {
  tabHistory: '이력 및 보고서',
  title: '서버 이력 및 진단 보고서',
  subtitle: 'SSH를 통한 리소스 추이, 자동 원인 진단 및 시스템 장애 타임라인',
  range24h: '24시간', range7d: '7일', range30d: '30일',
  refresh: '새로고침', copyReport: '보고서 복사', reportCopied: '보고서가 복사되었습니다', loading: '서버 이력 불러오는 중...',
  sysstatActiveBadge: 'sysstat 활성 (상주 RAM 0 MB)', sysstatOptionalBadge: '1단계만 활성 (journald)',
  optionalTitle: '전체 리소스 이력 차트 활성화 (선택)', optionalBadge: '상주 RAM 0 MB',
  optionalBody: 'ZentraDeck은 기본 리눅스 로그로 서비스 충돌, OOM, 재부팅, SSH 이벤트를 이미 분석합니다. 앱이 닫혀 있을 때도 CPU·RAM·디스크·Steal·네트워크 차트를 기록하려면 공식 sysstat 패키지를 활성화할 수 있습니다.',
  optionalPoint1: '상주 데몬 없음 — systemd 타이머로 잠시 실행 후 즉시 종료됩니다.',
  optionalPoint2: '디스크 사용량 극소화(월 약 2~5 MB) 및 자동 로테이션.',
  optionalPoint3: '언제든 패키지 관리자로 잔여 파일 없이 100% 제거 가능.',
  enableSysstatBtn: '2. 서버에 sysstat 활성화', enablingSysstat: 'sysstat 활성화 중...', manualCmdLabel: '수동 명령어 보기',
  peakCpu: '최대 CPU', avgLabel: '평균', peakRam: '최대 RAM', peakIOWaitSteal: '디스크 I/O & Steal', peakNetLoad: '최대 로드 & 네트워크', atTime: '시각',
  insightsTitle: '자동 진단 인사이트', insightsSub: '이력 지표 및 시스템 로그에서 도출된 주요 분석 결과',
  chartsTitle: '리소스 이력 차트', chartCpu: 'CPU 세부', chartMemory: '메모리 & Swap', chartLoad: '로드 평균', chartNetwork: '네트워크 I/O',
  cpuUser: '사용자 %', cpuSystem: '시스템 %', cpuIOWait: 'I/O 대기 %', cpuSteal: '호스트 Steal %',
  ramUsed: 'RAM 사용 %', swapUsed: 'Swap 사용 %', load1m: '1분 로드', load5m: '5분 로드', netRx: '수신 (RX)', netTx: '송신 (TX)',
  proCpuNote: '팁: 높은 I/O Wait(주황)는 디스크 병목을, 높은 CPU Steal(빨강)은 VPS 호스트 과밀을 의미합니다.',
  noSysstatSamplesYet: 'sysstat가 활성화되었습니다. 첫 주기 샘플 기록을 기다리는 중입니다(약 10분).',
  incidentsTitle: '장애 및 이벤트 타임라인', incidentsSub: '에이전트 없이 systemd journald 및 wtmp에서 직접 추출',
  filterAll: '전체', filterReboot: '재부팅', filterOom: 'OOM 종료', filterService: '서비스', filterSsh: 'SSH 인증',
  noIncidents: '이 기간에 기록된 심각한 장애가 없습니다.', rawLogLabel: '원본 로그 보기',
  catReboot: '재부팅', catOom: 'OOM Kill', catService: '서비스 오류', catSsh: 'SSH 인증',
  explainReboot: '서버가 재시작되었습니다(수동 재부팅, 커널 업데이트 또는 전원 차단).',
  explainOom: 'RAM이 고갈되어 리눅스 커널 OOM-Killer가 프로세스를 강제 종료했습니다.',
  explainService: 'systemd 서비스가 예기치 않게 종료되었거나 실패했습니다.',
  explainSsh: '시스템 로그에서 반복적인 SSH 로그인 실패 시도가 감지되었습니다.',
  insightHealthyTitle: '시스템 안정성 양호', insightHealthyDesc: '심각한 리소스 급증, 호스트 제한 또는 OOM 충돌이 감지되지 않았습니다.',
  insightStealTitle: 'VPS 호스트 CPU Steal 감지', insightStealDesc: '물리 호스트의 다른 인스턴스와 CPU 경합으로 지연이 발생하고 있습니다.',
  insightIOWaitTitle: '높은 디스크 I/O 대기 병목', insightIOWaitDesc: '디스크 읽기/쓰기 대기가 길어졌습니다. DB 쿼리나 백업을 점검하세요.',
  insightCpuTitle: '높은 CPU 사용률 급증', insightCpuDesc: 'CPU가 포화 상태에 근접했습니다. 피크 시점의 프로세스를 확인하세요.',
  insightRamTitle: '메모리 압박 감지', insightRamDesc: 'RAM 사용량이 한계에 가까워져 Swap 또는 OOM 위험이 있습니다.',
  insightOomTitle: '메모리 부족(OOM Kill) 기록됨', insightOomDesc: '메모리 고갈로 커널이 하나 이상의 프로세스를 강제 종료했습니다.',
  insightSshTitle: 'SSH 무차별 대입 공격 감지', insightSshDesc: '반복적인 SSH 로그인 실패가 기록되었습니다. SSH 키와 Fail2ban을 권장합니다.',
  insightSvcTitle: '서비스 장애 감지됨', insightSvcDesc: '이 기간 동안 하나 이상의 systemd 서비스가 실패했습니다.',
  insightRebootTitle: '서버 재부팅 기록됨', insightRebootDesc: '시스템 이력에 서버 재시작 이벤트가 기록되었습니다.',
  insightSwapTitle: 'Swap 메모리 사용 증가', insightSwapDesc: 'RAM 부족으로 디스크 Swap이 사용되어 응답 지연이 증가할 수 있습니다.',
  insightLoadTitle: '시스템 로드 평균 상승', insightLoadDesc: 'CPU/IO 대기열이 정상보다 높아졌습니다. Cron 작업이나 쿼리를 점검하세요.',
  insightNetTitle: '네트워크 대역폭 급증', insightNetDesc: '주 네트워크 인터페이스에서 높은 트래픽 버스트가 기록되었습니다.',
  osNativeNotice: '중요: sysstat(sar/sadf)는 리눅스 배포판 공식 저장소의 표준 패키지이며 ZentraDeck 에이전트나 외부 스크립트가 아닙니다.',
  preflightBtn: '1. 먼저 서버 호환성 확인', preflightChecking: '호환성 확인 중...',
  preflightSafe: '사전 점검 통과 — 충돌이 발견되지 않았습니다.', preflightWarn: '활성화 전 점검 사항을 확인하세요:',
  saveReportBtn: '보고서 저장', reportSavedToast: '보고서가 저장되었습니다', stabilityScoreLabel: '안정성 점수',
  reportExecTitle: '1부: 핵심 요약', reportFullTitle: '2부: 전체 기술 및 진단 보고서',
  tblMetric: '지표', tblPeak: '최대', tblAvg: '평균', tblPeakTime: '최대 시각', rowCpuTotal: 'CPU 전체',
};

const ID: HistoryStrings = {
  tabHistory: 'Riwayat & Laporan',
  title: 'Riwayat Server & Laporan Forensik',
  subtitle: 'Tren sumber daya historis, diagnosis otomatis, dan lini masa insiden melalui SSH',
  range24h: '24 Jam', range7d: '7 Hari', range30d: '30 Hari',
  refresh: 'Segarkan', copyReport: 'Salin Laporan', reportCopied: 'Laporan disalin', loading: 'Memuat riwayat server...',
  sysstatActiveBadge: 'sysstat Aktif (0 MB RAM)', sysstatOptionalBadge: 'Lapisan 1 saja (journald)',
  optionalTitle: 'Aktifkan Grafik Sumber Daya Historis (Opsional)', optionalBadge: '0 MB RAM Residen',
  optionalBody: 'ZentraDeck sudah menganalisis crash, OOM, reboot, dan SSH dari log bawaan Linux. Untuk merekam grafik CPU, RAM, Disk, Steal, dan Jaringan saat aplikasi ditutup, Anda dapat mengaktifkan paket resmi sysstat.',
  optionalPoint1: 'Tanpa daemon latar belakang — berjalan singkat via timer systemd lalu keluar.',
  optionalPoint2: 'Ukuran disk sangat kecil (~2–5 MB/bulan) dengan rotasi otomatis.',
  optionalPoint3: '100% dapat dihapus kapan saja melalui manajer paket.',
  enableSysstatBtn: '2. Aktifkan sysstat di Server', enablingSysstat: 'Mengaktifkan sysstat...', manualCmdLabel: 'Atau lihat perintah manual',
  peakCpu: 'Puncak CPU', avgLabel: 'Rata2', peakRam: 'Puncak RAM', peakIOWaitSteal: 'Disk I/O & Steal', peakNetLoad: 'Puncak Load & Jaringan', atTime: 'pada',
  insightsTitle: 'Analisis Diagnostik Otomatis', insightsSub: 'Temuan utama dari metrik historis dan log sistem',
  chartsTitle: 'Grafik Sumber Daya Historis', chartCpu: 'Rincian CPU', chartMemory: 'Memori & Swap', chartLoad: 'Beban (Load)', chartNetwork: 'Jaringan I/O',
  cpuUser: 'Pengguna %', cpuSystem: 'Sistem %', cpuIOWait: 'Tunggu I/O %', cpuSteal: 'Host Steal %',
  ramUsed: 'RAM Terpakai %', swapUsed: 'Swap Terpakai %', load1m: 'Load 1m', load5m: 'Load 5m', netRx: 'Unduh (RX)', netTx: 'Unggah (TX)',
  proCpuNote: 'Tips: I/O Wait tinggi (oranye) menandakan hambatan disk; CPU Steal tinggi (merah) berarti node host VPS padat.',
  noSysstatSamplesYet: 'sysstat aktif — menunggu sampel berkala pertama (~10 menit).',
  incidentsTitle: 'Lini Masa Insiden & Crash', incidentsSub: 'Diambil langsung dari systemd journald dan wtmp tanpa agen',
  filterAll: 'Semua', filterReboot: 'Reboot', filterOom: 'OOM Kill', filterService: 'Layanan', filterSsh: 'Auth SSH',
  noIncidents: 'Tidak ada insiden kritis tercatat pada periode ini.', rawLogLabel: 'Lihat baris log mentah',
  catReboot: 'Reboot', catOom: 'OOM Kill', catService: 'Crash Layanan', catSsh: 'Auth SSH',
  explainReboot: 'Server dimulai ulang (reboot manual, pembaruan kernel, atau mati daya).',
  explainOom: 'RAM habis sehingga OOM-Killer kernel menghentikan proses untuk menyelamatkan sistem.',
  explainService: 'Layanan systemd berhenti tak terduga atau gagal berjalan.',
  explainSsh: 'Percobaan login SSH gagal berulang kali terdeteksi di log sistem.',
  insightHealthyTitle: 'Stabilitas Sistem Terlihat Sehat', insightHealthyDesc: 'Tidak ada lonjakan berat, throttling host, atau crash OOM pada periode ini.',
  insightStealTitle: 'CPU Steal Host VPS Terdeteksi', insightStealDesc: 'Pengguna lain pada host fisik berebut CPU sehingga memicu latensi acak.',
  insightIOWaitTitle: 'Hambatan Disk I/O Wait Tinggi', insightIOWaitDesc: 'CPU lama menunggu baca/tulis disk — periksa kueri database atau backup.',
  insightCpuTitle: 'Lonjakan Penggunaan CPU Tinggi', insightCpuDesc: 'CPU mendekati batas maksimum — periksa proses atau cron saat waktu puncak.',
  insightRamTitle: 'Tekanan Memori Terdeteksi', insightRamDesc: 'Penggunaan RAM mendekati kapasitas penuh (risiko Swap atau OOM).',
  insightOomTitle: 'Insiden Kehabisan Memori (OOM)', insightOomDesc: 'Kernel Linux menghentikan paksa proses karena kehabisan RAM.',
  insightSshTitle: 'Aktivitas Brute-Force SSH', insightSshDesc: 'Banyak kegagalan login SSH — pastikan kunci SSH dan Fail2ban aktif.',
  insightSvcTitle: 'Kegagalan Layanan Terdeteksi', insightSvcDesc: 'Satu atau lebih layanan systemd gagal pada rentang waktu ini.',
  insightRebootTitle: 'Reboot Server Tercatat', insightRebootDesc: 'Peristiwa restart server tercatat dalam riwayat sistem.',
  insightSwapTitle: 'Penggunaan Memori Swap Meningkat', insightSwapDesc: 'Server mulai memindahkan RAM ke Swap disk yang dapat memperlambat respons.',
  insightLoadTitle: 'Rata-rata Beban Sistem Tinggi', insightLoadDesc: 'Antrean CPU/IO melampaui normal — periksa tugas latar belakang atau database.',
  insightNetTitle: 'Lonjakan Trafik Jaringan Tinggi', insightNetDesc: 'Lonjakan bandwidth signifikan tercatat pada antarmuka jaringan utama.',
  osNativeNotice: 'Penting: sysstat (sar/sadf) adalah paket resmi bawaan repositori Linux Anda — BUKAN agen ZentraDeck atau skrip pihak ketiga.',
  preflightBtn: '1. Periksa Kompatibilitas Server Dulu', preflightChecking: 'Memeriksa kompatibilitas...',
  preflightSafe: 'Pemeriksaan lulus — tidak ada konflik terdeteksi.', preflightWarn: 'Tinjau catatan sebelum mengaktifkan:',
  saveReportBtn: 'Simpan Laporan', reportSavedToast: 'Laporan disimpan ke disk', stabilityScoreLabel: 'Skor Stabilitas',
  reportExecTitle: 'Bagian 1: Ringkasan Eksekutif', reportFullTitle: 'Bagian 2: Laporan Teknis Lengkap',
  tblMetric: 'Metrik', tblPeak: 'Puncak', tblAvg: 'Rata-rata', tblPeakTime: 'Waktu Puncak', rowCpuTotal: 'Total CPU',
};

const ALL_HIST: Record<string, HistoryStrings> = {
  en: EN, fa: FA, zh: ZH, pt: PT, es: ES, de: DE, fr: FR, ja: JA, ru: RU, ko: KO, id: ID,
};

export function getHistoryStrings(lang: string): HistoryStrings {
  return ALL_HIST[lang] || EN;
}