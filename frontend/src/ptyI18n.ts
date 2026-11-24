import type { LanguageCode } from './i18n';

export interface PtyStrings {
  interactivePty: string;
  quickRunner: string;
  shellBtn: string;
  hostShell: string;
  dockerShell: string;
  backToHost: string;
  connected: string;
  connecting: string;
  disconnected: string;
  reconnect: string;
  disconnect: string;
  clear: string;
  copy: string;
  copied: string;
  paste: string;
  interrupt: string;
  expand: string;
  collapse: string;
  ptyTip: string;
}

const EN: PtyStrings = {
  interactivePty: 'Interactive PTY',
  quickRunner: 'Quick Commands',
  shellBtn: 'Shell',
  hostShell: 'Host Shell',
  dockerShell: 'Container Shell',
  backToHost: 'Host Shell',
  connected: 'Connected',
  connecting: 'Connecting...',
  disconnected: 'Disconnected',
  reconnect: 'Reconnect',
  disconnect: 'Disconnect',
  clear: 'Clear',
  copy: 'Copy',
  copied: 'Copied',
  paste: 'Paste',
  interrupt: 'Stop (^C)',
  expand: 'Fullscreen',
  collapse: 'Exit Fullscreen',
  ptyTip: 'Full interactive terminal (htop, vim, nano, sudo). Right-click copies selection or pastes; Ctrl +/- adjusts font size.',
};

const FA: PtyStrings = {
  interactivePty: 'ترمینال تعاملی (PTY)',
  quickRunner: 'دستورات سریع',
  shellBtn: 'شل',
  hostShell: 'شل سرور',
  dockerShell: 'شل کانتینر',
  backToHost: 'بازگشت به سرور',
  connected: 'متصل',
  connecting: 'در حال اتصال...',
  disconnected: 'قطع شده',
  reconnect: 'اتصال مجدد',
  disconnect: 'قطع اتصال',
  clear: 'پاک کردن',
  copy: 'کپی',
  copied: 'کپی شد',
  paste: 'پیست',
  interrupt: 'توقف (^C)',
  expand: 'تمام‌صفحه',
  collapse: 'خروج از تمام‌صفحه',
  ptyTip: 'ترمینال تعاملی کامل (htop، nano، vim، sudo). راست‌کلیک روی متن انتخاب‌شده کپی و بدون انتخاب پیست می‌کند؛ Ctrl +/- برای تغییر سایز فونت.',
};

const MAP: Partial<Record<LanguageCode, PtyStrings>> = {
  en: EN,
  fa: FA,
  zh: {
    ...EN,
    interactivePty: '交互式终端 (PTY)',
    quickRunner: '快捷命令',
    shellBtn: '终端',
    hostShell: '主机终端',
    dockerShell: '容器终端',
    backToHost: '返回主机',
    connected: '已连接',
    connecting: '连接中...',
    disconnected: '已断开',
    reconnect: '重新连接',
    disconnect: '断开',
    clear: '清空',
    copy: '复制',
    copied: '已复制',
    paste: '粘贴',
    interrupt: '中断 (^C)',
    expand: '全屏',
    collapse: '退出全屏',
  },
  de: { ...EN, interactivePty: 'Interaktives PTY', quickRunner: 'Schnellbefehle', connected: 'Verbunden', disconnected: 'Getrennt', reconnect: 'Neu verbinden', clear: 'Leeren', copy: 'Kopieren', copied: 'Kopiert', paste: 'Einfügen', interrupt: 'Stopp (^C)', expand: 'Vollbild', collapse: 'Beenden' },
  fr: { ...EN, interactivePty: 'Terminal PTY', quickRunner: 'Commandes rapides', connected: 'Connecté', disconnected: 'Déconnecté', reconnect: 'Reconnecter', clear: 'Effacer', copy: 'Copier', copied: 'Copié', paste: 'Coller', interrupt: 'Arrêter (^C)', expand: 'Plein écran', collapse: 'Réduire' },
  es: { ...EN, interactivePty: 'PTY Interactivo', quickRunner: 'Comandos rápidos', connected: 'Conectado', disconnected: 'Desconectado', reconnect: 'Reconectar', clear: 'Limpiar', copy: 'Copiar', copied: 'Copiado', paste: 'Pegar', interrupt: 'Detener (^C)', expand: 'Pantalla completa', collapse: 'Salir' },
  pt: { ...EN, interactivePty: 'PTY Interativo', quickRunner: 'Comandos rápidos', connected: 'Conectado', disconnected: 'Desconectado', reconnect: 'Reconectar', clear: 'Limpar', copy: 'Copiar', copied: 'Copiado', paste: 'Colar', interrupt: 'Parar (^C)', expand: 'Tela cheia', collapse: 'Sair' },
  ru: { ...EN, interactivePty: 'Интерактивный PTY', quickRunner: 'Быстрые команды', connected: 'Подключено', disconnected: 'Отключено', reconnect: 'Переподключить', clear: 'Очистить', copy: 'Копировать', copied: 'Скопировано', paste: 'Вставить', interrupt: 'Стоп (^C)', expand: 'На весь экран', collapse: 'Свернуть' },
  ja: { ...EN, interactivePty: '対話型 PTY', quickRunner: 'クイックコマンド', connected: '接続済み', disconnected: '切断', reconnect: '再接続', clear: 'クリア', copy: 'コピー', copied: 'コピー済', paste: '貼り付け', interrupt: '停止 (^C)', expand: '全画面', collapse: '元に戻す' },
  ko: { ...EN, interactivePty: '대화형 PTY', quickRunner: '빠른 명령', connected: '연결됨', disconnected: '연결 끊김', reconnect: '다시 연결', clear: '지우기', copy: '복사', copied: '복사됨', paste: '붙여넣기', interrupt: '중지 (^C)', expand: '전체 화면', collapse: '축소' },
  id: { ...EN, interactivePty: 'PTY Interaktif', quickRunner: 'Perintah Cepat', connected: 'Terhubung', disconnected: 'Terputus', reconnect: 'Hubungkan Ulang', clear: 'Bersihkan', copy: 'Salin', copied: 'Tersalin', paste: 'Tempel', interrupt: 'Hentikan (^C)', expand: 'Layar Penuh', collapse: 'Keluar' },
};

export function getPtyStrings(lang: string): PtyStrings {
  return MAP[lang as LanguageCode] || EN;
}