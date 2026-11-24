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

const ZH: PtyStrings = {
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
  disconnect: '断开连接',
  clear: '清空',
  copy: '复制',
  copied: '已复制',
  paste: '粘贴',
  interrupt: '中断 (^C)',
  expand: '全屏',
  collapse: '退出全屏',
  ptyTip: '完整交互式终端（支持 htop、vim、nano、sudo）。右键复制选中内容或直接粘贴；Ctrl +/- 调整字体大小。',
};

const DE: PtyStrings = {
  interactivePty: 'Interaktives PTY',
  quickRunner: 'Schnellbefehle',
  shellBtn: 'Shell',
  hostShell: 'Host-Shell',
  dockerShell: 'Container-Shell',
  backToHost: 'Zur Host-Shell',
  connected: 'Verbunden',
  connecting: 'Verbinden...',
  disconnected: 'Getrennt',
  reconnect: 'Neu verbinden',
  disconnect: 'Trennen',
  clear: 'Leeren',
  copy: 'Kopieren',
  copied: 'Kopiert',
  paste: 'Einfügen',
  interrupt: 'Stopp (^C)',
  expand: 'Vollbild',
  collapse: 'Vollbild beenden',
  ptyTip: 'Vollständiges interaktives Terminal (htop, vim, nano, sudo). Rechtsklick kopiert Auswahl oder fügt ein; Strg +/- ändert die Schriftgröße.',
};

const FR: PtyStrings = {
  interactivePty: 'Terminal PTY',
  quickRunner: 'Commandes rapides',
  shellBtn: 'Shell',
  hostShell: "Shell de l'hôte",
  dockerShell: 'Shell du conteneur',
  backToHost: "Retour à l'hôte",
  connected: 'Connecté',
  connecting: 'Connexion...',
  disconnected: 'Déconnecté',
  reconnect: 'Reconnecter',
  disconnect: 'Déconnecter',
  clear: 'Effacer',
  copy: 'Copier',
  copied: 'Copié',
  paste: 'Coller',
  interrupt: 'Arrêter (^C)',
  expand: 'Plein écran',
  collapse: 'Quitter le plein écran',
  ptyTip: 'Terminal interactif complet (htop, vim, nano, sudo). Le clic droit copie la sélection ou colle ; Ctrl +/- ajuste la taille du texte.',
};

const ES: PtyStrings = {
  interactivePty: 'PTY Interactivo',
  quickRunner: 'Comandos rápidos',
  shellBtn: 'Shell',
  hostShell: 'Shell del servidor',
  dockerShell: 'Shell del contenedor',
  backToHost: 'Volver al servidor',
  connected: 'Conectado',
  connecting: 'Conectando...',
  disconnected: 'Desconectado',
  reconnect: 'Reconectar',
  disconnect: 'Desconectar',
  clear: 'Limpiar',
  copy: 'Copiar',
  copied: 'Copiado',
  paste: 'Pegar',
  interrupt: 'Detener (^C)',
  expand: 'Pantalla completa',
  collapse: 'Salir de pantalla completa',
  ptyTip: 'Terminal interactiva completa (htop, vim, nano, sudo). Clic derecho copia la selección o pega; Ctrl +/- ajusta el tamaño de fuente.',
};

const PT: PtyStrings = {
  interactivePty: 'PTY Interativo',
  quickRunner: 'Comandos rápidos',
  shellBtn: 'Shell',
  hostShell: 'Shell do servidor',
  dockerShell: 'Shell do contêiner',
  backToHost: 'Voltar ao servidor',
  connected: 'Conectado',
  connecting: 'Conectando...',
  disconnected: 'Desconectado',
  reconnect: 'Reconectar',
  disconnect: 'Desconectar',
  clear: 'Limpar',
  copy: 'Copiar',
  copied: 'Copiado',
  paste: 'Colar',
  interrupt: 'Parar (^C)',
  expand: 'Tela cheia',
  collapse: 'Sair da tela cheia',
  ptyTip: 'Terminal interativo completo (htop, vim, nano, sudo). Clique direito copia a seleção ou cola; Ctrl +/- ajusta o tamanho da fonte.',
};

const RU: PtyStrings = {
  interactivePty: 'Интерактивный PTY',
  quickRunner: 'Быстрые команды',
  shellBtn: 'Шелл',
  hostShell: 'Шелл сервера',
  dockerShell: 'Шелл контейнера',
  backToHost: 'К серверу',
  connected: 'Подключено',
  connecting: 'Подключение...',
  disconnected: 'Отключено',
  reconnect: 'Переподключить',
  disconnect: 'Отключить',
  clear: 'Очистить',
  copy: 'Копировать',
  copied: 'Скопировано',
  paste: 'Вставить',
  interrupt: 'Стоп (^C)',
  expand: 'На весь экран',
  collapse: 'Выйти из полного экрана',
  ptyTip: 'Полноценный интерактивный терминал (htop, vim, nano, sudo). Правый клик копирует выделение или вставляет; Ctrl +/- меняет размер шрифта.',
};

const JA: PtyStrings = {
  interactivePty: '対話型 PTY',
  quickRunner: 'クイックコマンド',
  shellBtn: 'シェル',
  hostShell: 'ホストシェル',
  dockerShell: 'コンテナシェル',
  backToHost: 'ホストへ戻る',
  connected: '接続済み',
  connecting: '接続中...',
  disconnected: '切断',
  reconnect: '再接続',
  disconnect: '切断する',
  clear: 'クリア',
  copy: 'コピー',
  copied: 'コピー済',
  paste: '貼り付け',
  interrupt: '停止 (^C)',
  expand: '全画面',
  collapse: '全画面を終了',
  ptyTip: '完全な対話型ターミナル（htop、vim、nano、sudo 対応）。右クリックで選択コピーまたは貼り付け、Ctrl +/- で文字サイズ変更。',
};

const KO: PtyStrings = {
  interactivePty: '대화형 PTY',
  quickRunner: '빠른 명령',
  shellBtn: '셸',
  hostShell: '호스트 셸',
  dockerShell: '컨테이너 셸',
  backToHost: '호스트로 돌아가기',
  connected: '연결됨',
  connecting: '연결 중...',
  disconnected: '연결 끊김',
  reconnect: '다시 연결',
  disconnect: '연결 해제',
  clear: '지우기',
  copy: '복사',
  copied: '복사됨',
  paste: '붙여넣기',
  interrupt: '중지 (^C)',
  expand: '전체 화면',
  collapse: '전체 화면 종료',
  ptyTip: '완전한 대화형 터미널(htop, vim, nano, sudo 지원). 우클릭으로 선택 복사 또는 붙여넣기, Ctrl +/-로 글꼴 크기 조절.',
};

const ID: PtyStrings = {
  interactivePty: 'PTY Interaktif',
  quickRunner: 'Perintah Cepat',
  shellBtn: 'Shell',
  hostShell: 'Shell Host',
  dockerShell: 'Shell Kontainer',
  backToHost: 'Kembali ke Host',
  connected: 'Terhubung',
  connecting: 'Menghubungkan...',
  disconnected: 'Terputus',
  reconnect: 'Hubungkan Ulang',
  disconnect: 'Putuskan',
  clear: 'Bersihkan',
  copy: 'Salin',
  copied: 'Tersalin',
  paste: 'Tempel',
  interrupt: 'Hentikan (^C)',
  expand: 'Layar Penuh',
  collapse: 'Keluar Layar Penuh',
  ptyTip: 'Terminal interaktif penuh (htop, vim, nano, sudo). Klik kanan menyalin teks terpilih atau menempel; Ctrl +/- mengatur ukuran huruf.',
};

const MAP: Partial<Record<LanguageCode, PtyStrings>> = {
  en: EN,
  fa: FA,
  zh: ZH,
  de: DE,
  fr: FR,
  es: ES,
  pt: PT,
  ru: RU,
  ja: JA,
  ko: KO,
  id: ID,
};

export function getPtyStrings(lang: string): PtyStrings {
  return MAP[lang as LanguageCode] || EN;
}