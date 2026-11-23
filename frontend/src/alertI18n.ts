import type { LanguageCode } from './i18n';

export interface AlertStrings {
  desktopAlerts: string;
  minimizeToTray: string;
  testNotif: string;
  testNotifSent: string;
  alertRules: string;
  alertRulesSub: string;
  muteServer: string;
  muted: string;
  alertOutage: string;
  alertFailedSvc: string;
  cpuLimit: string;
  ramLimit: string;
  diskLimit: string;
  cooldownMin: string;
  zeroDisable: string;
  quitApp: string;
}

const EN: AlertStrings = {
  desktopAlerts: 'OS Desktop Notifications',
  minimizeToTray: 'Keep running in System Tray on close',
  testNotif: 'Test Notification',
  testNotifSent: 'Test OS notification sent',
  alertRules: 'Custom Alert Rules',
  alertRulesSub: 'Per-server thresholds & notifications',
  muteServer: 'Mute all alerts for this server',
  muted: 'Muted',
  alertOutage: 'Outage & recovery alerts',
  alertFailedSvc: 'Failed systemd service alerts',
  cpuLimit: 'CPU Limit (%)',
  ramLimit: 'RAM Limit (%)',
  diskLimit: 'Disk Limit (%)',
  cooldownMin: 'Cooldown (min)',
  zeroDisable: 'Set 0 to disable a resource threshold. Triggers after 2 consecutive checks.',
  quitApp: 'Quit Completely',
};

const FA: AlertStrings = {
  desktopAlerts: 'اعلان دسکتاپ سیستم‌عامل',
  minimizeToTray: 'اجرا در پس‌زمینه (System Tray) هنگام بستن',
  testNotif: 'تست اعلان',
  testNotifSent: 'اعلان تستی به سیستم‌عامل ارسال شد',
  alertRules: 'قوانین هشدار اختصاصی سرور',
  alertRulesSub: 'تنظیم آستانه منابع و نوتیفیکیشن این سرور',
  muteServer: 'سایلنت کردن تمام هشدارهای این سرور',
  muted: 'سایلنت',
  alertOutage: 'هشدار قطعی و بازگشت سرور',
  alertFailedSvc: 'هشدار خطای سرویس‌های Systemd',
  cpuLimit: 'حد مجاز CPU (%)',
  ramLimit: 'حد مجاز RAM (%)',
  diskLimit: 'حد مجاز دیسک (%)',
  cooldownMin: 'فاصله تکرار (دقیقه)',
  zeroDisable: 'عدد 0 برای غیرفعال کردن هر مورد. هشدار پس از ۲ بررسی متوالی ارسال می‌شود.',
  quitApp: 'خروج کامل',
};

const MAP: Partial<Record<LanguageCode, AlertStrings>> = {
  en: EN,
  fa: FA,
  zh: {
    ...EN,
    desktopAlerts: '桌面系统通知',
    minimizeToTray: '关闭窗口时最小化到托盘',
    testNotif: '测试通知',
    testNotifSent: '已发送系统测试通知',
    alertRules: '自定义告警规则',
    alertRulesSub: '单服务器阈值与通知设置',
    muteServer: '静音此服务器的所有告警',
    muted: '已静音',
    alertOutage: '离线与恢复告警',
    alertFailedSvc: 'Systemd 服务异常告警',
    cpuLimit: 'CPU 阈值 (%)',
    ramLimit: '内存阈值 (%)',
    diskLimit: '磁盘阈值 (%)',
    cooldownMin: '冷却时间 (分钟)',
    zeroDisable: '设为 0 可禁用该项阈值；连续触发 2 次后发送通知。',
    quitApp: '完全退出',
  },
  de: {
    ...EN,
    desktopAlerts: 'Desktop-Benachrichtigungen',
    minimizeToTray: 'Beim Schließen im System-Tray weiterlaufen',
    testNotif: 'Testen',
    alertRules: 'Eigene Alarmregeln',
    muteServer: 'Alle Alarme für diesen Server stummschalten',
    muted: 'Stumm',
    quitApp: 'Vollständig beenden',
  },
  fr: {
    ...EN,
    desktopAlerts: 'Notifications bureau',
    minimizeToTray: 'Réduire dans la barre système à la fermeture',
    testNotif: 'Tester',
    alertRules: "Règles d'alerte personnalisées",
    muteServer: 'Couper les alertes pour ce serveur',
    muted: 'Muet',
    quitApp: 'Quitter complètement',
  },
  es: {
    ...EN,
    desktopAlerts: 'Notificaciones de escritorio',
    minimizeToTray: 'Mantener en la bandeja del sistema al cerrar',
    testNotif: 'Probar',
    alertRules: 'Reglas de alerta personalizadas',
    muteServer: 'Silenciar todas las alertas de este servidor',
    muted: 'Silenciado',
    quitApp: 'Salir por completo',
  },
  pt: {
    ...EN,
    desktopAlerts: 'Notificações da área de trabalho',
    minimizeToTray: 'Manter na bandeja do sistema ao fechar',
    testNotif: 'Testar',
    alertRules: 'Regras de alerta personalizadas',
    muteServer: 'Silenciar todos os alertas deste servidor',
    muted: 'Mudo',
    quitApp: 'Sair completamente',
  },
  ru: {
    ...EN,
    desktopAlerts: 'Уведомления рабочего стола',
    minimizeToTray: 'Сворачивать в трей при закрытии',
    testNotif: 'Тест',
    alertRules: 'Правила уведомлений сервера',
    muteServer: 'Отключить все уведомления для сервера',
    muted: 'Без звука',
    quitApp: 'Выйти полностью',
  },
  ja: {
    ...EN,
    desktopAlerts: 'デスクトップ通知',
    minimizeToTray: '閉じる時にシステムトレイへ格納',
    testNotif: '通知テスト',
    alertRules: 'カスタムアラート設定',
    muteServer: 'このサーバーの通知をミュート',
    muted: 'ミュート',
    quitApp: '完全に終了',
  },
  ko: {
    ...EN,
    desktopAlerts: '데스크톱 알림',
    minimizeToTray: '닫을 때 시스템 트레이에서 계속 실행',
    testNotif: '알림 테스트',
    alertRules: '서버별 알림 규칙',
    muteServer: '이 서버의 모든 알림 음소거',
    muted: '음소거',
    quitApp: '완전 종료',
  },
  id: {
    ...EN,
    desktopAlerts: 'Notifikasi Desktop OS',
    minimizeToTray: 'Tetap berjalan di System Tray saat ditutup',
    testNotif: 'Uji Notifikasi',
    alertRules: 'Aturan Peringatan Kustom',
    muteServer: 'Bisukan semua peringatan server ini',
    muted: 'Dibisukan',
    quitApp: 'Keluar Sepenuhnya',
  },
};

export function getAlertStrings(lang: string): AlertStrings {
  return MAP[lang as LanguageCode] || EN;
}