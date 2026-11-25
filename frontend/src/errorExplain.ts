export interface FriendlyError {
  title: string;
  hint: string;
  technical: string;
}

interface ErrorCopy {
  timeoutTitle: string;
  timeoutHint: string;
  refusedTitle: string;
  refusedHint: string;
  dnsTitle: string;
  dnsHint: string;
  unreachableTitle: string;
  unreachableHint: string;
  authTitle: string;
  authHint: string;
  hostKeyTitle: string;
  hostKeyHint: string;
  proxyTitle: string;
  proxyHint: string;
  resetTitle: string;
  resetHint: string;
  demoOutageTitle: string;
  demoOutageHint: string;
  genericTitle: string;
  genericHint: string;
  techDetailsLabel: string;
}

const EN: ErrorCopy = {
  timeoutTitle: 'Server did not respond (Connection timed out)',
  timeoutHint: 'The server may be powered off, unreachable over the network, or a firewall is dropping packets on the SSH port.',
  refusedTitle: 'SSH port refused the connection',
  refusedHint: 'The server is reachable, but the SSH service (sshd) is stopped or listening on a different port.',
  dnsTitle: 'Hostname could not be resolved',
  dnsHint: 'Check the server domain/IP spelling and your DNS or VPN connection.',
  unreachableTitle: 'No network route to server',
  unreachableHint: 'Check your local internet connection, VPN, or the server network status.',
  authTitle: 'SSH authentication failed',
  authHint: 'The server rejected your credentials. Verify the username, password, or SSH private key and passphrase.',
  hostKeyTitle: 'SSH host key mismatch (Blocked for safety)',
  hostKeyHint: 'The server fingerprint changed since your last login. Verify if the OS was reinstalled before updating known_hosts.',
  proxyTitle: 'SOCKS5 proxy connection failed',
  proxyHint: 'Could not reach the server through the configured SOCKS5 proxy. Verify the proxy address, port, and login.',
  resetTitle: 'Connection closed by remote server',
  resetHint: 'The remote host closed the connection unexpectedly (possible Fail2ban block, SSH rate limit, or server reboot).',
  demoOutageTitle: 'Simulated outage active',
  demoOutageHint: 'This demo server is intentionally offline for testing alerts. Click "Restore Server" to bring it back online.',
  genericTitle: 'Unable to reach server',
  genericHint: 'Check the server status, SSH settings, and network connection.',
  techDetailsLabel: 'Technical details',
};

const FA: ErrorCopy = {
  timeoutTitle: 'پاسخی از سرور دریافت نشد (اتمام زمان اتصال)',
  timeoutHint: 'احتمالاً سرور خاموش است، دسترسی شبکه قطع شده، یا فایروال پورت SSH را مسدود کرده است.',
  refusedTitle: 'اتصال به پورت SSH رد شد',
  refusedHint: 'سرور در دسترس است، اما سرویس SSH روی آن متوقف شده یا روی پورت دیگری فعال است.',
  dnsTitle: 'آدرس دامنه سرور پیدا نشد',
  dnsHint: 'املای آدرس دامنه یا IP و همچنین وضعیت DNS یا VPN خود را بررسی کنید.',
  unreachableTitle: 'مسیر شبکه‌ای به سرور وجود ندارد',
  unreachableHint: 'اتصال اینترنت، VPN یا وضعیت شبکه سرور را بررسی کنید.',
  authTitle: 'احراز هویت SSH ناموفق بود',
  authHint: 'سرور ورود را رد کرد. نام کاربری، رمز عبور یا کلید خصوصی SSH را بررسی کنید.',
  hostKeyTitle: 'تغییر کلید امنیتی سرور (مسدود شد)',
  hostKeyHint: 'اثر انگشت امنیتی این سرور نسبت به قبل تغییر کرده است. پیش از بروزرسانی known_hosts مطمئن شوید سیستم‌عامل سرور مجدد نصب شده است.',
  proxyTitle: 'خطا در اتصال از طریق پراکسی SOCKS5',
  proxyHint: 'اتصال به پراکسی SOCKS5 تنظیم‌شده برای این سرور برقرار نشد. آدرس، پورت و اطلاعات ورود پراکسی را بررسی کنید.',
  resetTitle: 'اتصال از سمت سرور بسته شد',
  resetHint: 'سرور اتصال را به‌طور ناگهانی قطع کرد (احتمال محدودیت Fail2ban، ری‌استارت سرور یا قطع لحظه‌ای شبکه).',
  demoOutageTitle: 'قطعی شبیه‌سازی‌شده فعال است',
  demoOutageHint: 'این سرور آزمایشی برای تست هشدارها آفلاین شده است. برای بازگردانی روی «بازگردانی سرور» کلیک کنید.',
  genericTitle: 'امکان برقراری ارتباط با سرور وجود ندارد',
  genericHint: 'وضعیت روشن بودن سرور، تنظیمات SSH و اتصال شبکه را بررسی کنید.',
  techDetailsLabel: 'جزئیات فنی',
};

const ZH: ErrorCopy = {
  timeoutTitle: '服务器无响应（连接超时）',
  timeoutHint: '服务器可能已关机、网络不可达，或防火墙拦截了 SSH 端口。',
  refusedTitle: 'SSH 端口拒绝连接',
  refusedHint: '服务器可达，但 SSH 服务未运行或监听在其他端口。',
  dnsTitle: '无法解析主机名',
  dnsHint: '请检查域名或 IP 拼写以及 DNS/VPN 设置。',
  unreachableTitle: '无法路由到目标网络',
  unreachableHint: '请检查本地网络、VPN 或服务器网络状态。',
  authTitle: 'SSH 身份验证失败',
  authHint: '服务器拒绝了凭据。请检查用户名、密码或私钥及口令。',
  hostKeyTitle: 'SSH 主机密钥不匹配（已安全拦截）',
  hostKeyHint: '服务器指纹已变化，请确认是否重装系统后再更新 known_hosts。',
  proxyTitle: 'SOCKS5 代理连接失败',
  proxyHint: '无法通过配置的 SOCKS5 代理连接，请检查代理地址、端口和凭据。',
  resetTitle: '连接被远程服务器重置',
  resetHint: '远程主机意外关闭了连接（可能触发 Fail2ban、限流或正在重启）。',
  demoOutageTitle: '已启用模拟故障',
  demoOutageHint: '该演示节点已手动设为离线，点击“恢复服务器”即可重新上线。',
  genericTitle: '无法连接到服务器',
  genericHint: '请检查服务器状态、SSH 配置与网络连接。',
  techDetailsLabel: '技术详情',
};

const PT: ErrorCopy = {
  timeoutTitle: 'O servidor não respondeu (Tempo esgotado)',
  timeoutHint: 'O servidor pode estar desligado, sem rede ou um firewall está bloqueando a porta SSH.',
  refusedTitle: 'Conexão recusada na porta SSH',
  refusedHint: 'O servidor está acessível, mas o serviço SSH (sshd) está parado ou em outra porta.',
  dnsTitle: 'Não foi possível resolver o endereço',
  dnsHint: 'Verifique a grafia do domínio/IP e sua conexão DNS ou VPN.',
  unreachableTitle: 'Sem rota de rede até o servidor',
  unreachableHint: 'Verifique sua internet, VPN ou o estado da rede do servidor.',
  authTitle: 'Falha na autenticação SSH',
  authHint: 'Credenciais rejeitadas. Verifique usuário, senha ou chave privada SSH.',
  hostKeyTitle: 'Chave do host SSH alterada (Bloqueado)',
  hostKeyHint: 'A impressão digital do servidor mudou. Confirme se houve reinstalação antes de atualizar o known_hosts.',
  proxyTitle: 'Falha no proxy SOCKS5',
  proxyHint: 'Não foi possível conectar via proxy SOCKS5. Verifique host, porta e credenciais do proxy.',
  resetTitle: 'Conexão encerrada pelo servidor',
  resetHint: 'O servidor fechou a conexão inesperadamente (possível bloqueio do Fail2ban ou reinicialização).',
  demoOutageTitle: 'Queda simulada ativa',
  demoOutageHint: 'Este servidor de demonstração está offline para teste. Clique em "Restaurar Servidor" para religá-lo.',
  genericTitle: 'Não foi possível alcançar o servidor',
  genericHint: 'Verifique o estado do servidor, ajustes SSH e sua conexão.',
  techDetailsLabel: 'Detalhes técnicos',
};

const ES: ErrorCopy = {
  timeoutTitle: 'El servidor no respondió (Tiempo agotado)',
  timeoutHint: 'El servidor podría estar apagado, sin red o un firewall bloquea el puerto SSH.',
  refusedTitle: 'Conexión rechazada en el puerto SSH',
  refusedHint: 'El servidor responde, pero el servicio SSH (sshd) está detenido o usa otro puerto.',
  dnsTitle: 'No se pudo resolver el dominio',
  dnsHint: 'Comprueba la escritura del host/IP y tu conexión DNS o VPN.',
  unreachableTitle: 'Sin ruta de red hacia el servidor',
  unreachableHint: 'Revisa tu conexión a internet, VPN o la red del servidor.',
  authTitle: 'Error de autenticación SSH',
  authHint: 'El servidor rechazó el acceso. Verifica usuario, contraseña o clave privada SSH.',
  hostKeyTitle: 'Clave de host SSH diferente (Bloqueado)',
  hostKeyHint: 'La huella del servidor cambió. Verifica si fue reinstalado antes de actualizar known_hosts.',
  proxyTitle: 'Error en el proxy SOCKS5',
  proxyHint: 'No se pudo conectar mediante el proxy SOCKS5 configurado. Revisa dirección, puerto y credenciales.',
  resetTitle: 'Conexión cerrada por el servidor',
  resetHint: 'El host cerró la conexión inesperadamente (posible bloqueo Fail2ban o reinicio).',
  demoOutageTitle: 'Caída simulada activa',
  demoOutageHint: 'Este servidor demo está desconectado para pruebas. Haz clic en "Restaurar servidor" para reconectarlo.',
  genericTitle: 'No se puede conectar al servidor',
  genericHint: 'Comprueba el estado del servidor, la configuración SSH y la red.',
  techDetailsLabel: 'Detalles técnicos',
};

const DE: ErrorCopy = {
  timeoutTitle: 'Server antwortet nicht (Zeitüberschreitung)',
  timeoutHint: 'Der Server ist möglicherweise ausgeschaltet, nicht erreichbar oder eine Firewall blockiert den SSH-Port.',
  refusedTitle: 'SSH-Port hat Verbindung abgelehnt',
  refusedHint: 'Der Server ist erreichbar, aber der SSH-Dienst (sshd) läuft nicht oder nutzt einen anderen Port.',
  dnsTitle: 'Hostname konnte nicht aufgelöst werden',
  dnsHint: 'Prüfen Sie Domain/IP-Schreibweise sowie DNS- und VPN-Verbindung.',
  unreachableTitle: 'Keine Netzwerkroute zum Server',
  unreachableHint: 'Prüfen Sie Ihre Internetverbindung, Ihr VPN oder den Serverstatus.',
  authTitle: 'SSH-Authentifizierung fehlgeschlagen',
  authHint: 'Anmeldedaten abgelehnt. Prüfen Sie Benutzername, Passwort oder SSH-Schlüssel.',
  hostKeyTitle: 'SSH-Host-Schlüssel geändert (Blockiert)',
  hostKeyHint: 'Der Fingerabdruck hat sich geändert. Prüfen Sie eine Neuinstallation, bevor Sie known_hosts aktualisieren.',
  proxyTitle: 'SOCKS5-Proxy-Verbindung fehlgeschlagen',
  proxyHint: 'Verbindung über den konfigurierten SOCKS5-Proxy fehlgeschlagen. Prüfen Sie Adresse, Port und Zugangsdaten.',
  resetTitle: 'Verbindung vom Server geschlossen',
  resetHint: 'Der Server hat die Verbindung unerwartet beendet (z. B. Fail2ban-Sperre oder Neustart).',
  demoOutageTitle: 'Simulierter Ausfall aktiv',
  demoOutageHint: 'Dieser Demo-Server ist zu Testzwecken offline. Klicken Sie auf „Server wiederherstellen“.',
  genericTitle: 'Server nicht erreichbar',
  genericHint: 'Prüfen Sie Serverstatus, SSH-Einstellungen und Netzwerkverbindung.',
  techDetailsLabel: 'Technische Details',
};

const FR: ErrorCopy = {
  timeoutTitle: 'Le serveur ne répond pas (Délai dépassé)',
  timeoutHint: 'Le serveur est peut-être éteint, hors réseau, ou un pare-feu bloque le port SSH.',
  refusedTitle: 'Connexion refusée sur le port SSH',
  refusedHint: 'Le serveur est joignable, mais le service SSH (sshd) est arrêté ou écoute sur un autre port.',
  dnsTitle: 'Impossible de résoudre le nom d’hôte',
  dnsHint: 'Vérifiez l’orthographe du domaine/IP ainsi que votre DNS ou VPN.',
  unreachableTitle: 'Aucune route réseau vers le serveur',
  unreachableHint: 'Vérifiez votre connexion internet, votre VPN ou l’état réseau du serveur.',
  authTitle: 'Échec d’authentification SSH',
  authHint: 'Identifiants refusés. Vérifiez le nom d’utilisateur, le mot de passe ou la clé privée SSH.',
  hostKeyTitle: 'Clé d’hôte SSH modifiée (Bloqué)',
  hostKeyHint: 'L’empreinte du serveur a changé. Vérifiez s’il a été réinstallé avant de mettre à jour known_hosts.',
  proxyTitle: 'Échec du proxy SOCKS5',
  proxyHint: 'Impossible de joindre le serveur via le proxy SOCKS5 configuré. Vérifiez l’adresse, le port et les identifiants.',
  resetTitle: 'Connexion fermée par le serveur distant',
  resetHint: 'L’hôte a interrompu la connexion (blocage Fail2ban, limite SSH ou redémarrage possible).',
  demoOutageTitle: 'Panne simulée active',
  demoOutageHint: 'Ce serveur de démo est hors ligne pour tester les alertes. Cliquez sur « Restaurer le serveur ».',
  genericTitle: 'Impossible de joindre le serveur',
  genericHint: 'Vérifiez l’état du serveur, les paramètres SSH et votre réseau.',
  techDetailsLabel: 'Détails techniques',
};

const JA: ErrorCopy = {
  timeoutTitle: 'サーバーから応答がありません（タイムアウト）',
  timeoutHint: 'サーバーが停止しているか、ネットワーク障害、またはファイアウォールが SSH ポートを遮断している可能性があります。',
  refusedTitle: 'SSH ポートで接続が拒否されました',
  refusedHint: 'サーバー自体は到達可能ですが、SSH サービス（sshd）が停止しているかポート番号が異なります。',
  dnsTitle: 'ホスト名を解決できませんでした',
  dnsHint: 'ドメイン・IP の入力ミス、または DNS / VPN 設定を確認してください。',
  unreachableTitle: 'サーバーへのネットワーク経路がありません',
  unreachableHint: 'インターネット接続、VPN、またはサーバーのネットワーク状態を確認してください。',
  authTitle: 'SSH 認証に失敗しました',
  authHint: 'ログイン情報が拒否されました。ユーザー名、パスワード、または SSH 秘密鍵を確認してください。',
  hostKeyTitle: 'SSH ホスト鍵が一致しません（安全のためブロック）',
  hostKeyHint: 'サーバーの指紋が変更されています。OS 再インストール等を確認したうえで known_hosts を更新してください。',
  proxyTitle: 'SOCKS5 プロキシへの接続に失敗しました',
  proxyHint: '設定された SOCKS5 プロキシ経由で接続できません。アドレス、ポート、認証情報を確認してください。',
  resetTitle: 'リモートサーバーにより接続が切断されました',
  resetHint: 'Fail2ban の制限、レート制限、またはサーバー再起動の可能性があります。',
  demoOutageTitle: '障害シミュレーション実行中',
  demoOutageHint: 'アラートテストのためオフラインになっています。「サーバーを復旧」をクリックして戻せます。',
  genericTitle: 'サーバーに接続できません',
  genericHint: 'サーバーの状態、SSH 設定、ネットワーク接続を確認してください。',
  techDetailsLabel: '技術的な詳細',
};

const RU: ErrorCopy = {
  timeoutTitle: 'Сервер не отвечает (превышено время ожидания)',
  timeoutHint: 'Возможно, сервер выключен, недоступен по сети или файрвол блокирует порт SSH.',
  refusedTitle: 'Подключение к порту SSH отклонено',
  refusedHint: 'Сервер доступен, но служба SSH (sshd) остановлена или слушает другой порт.',
  dnsTitle: 'Не удалось разрешить имя хоста',
  dnsHint: 'Проверьте правильность домена/IP, а также настройки DNS или VPN.',
  unreachableTitle: 'Нет сетевого маршрута до сервера',
  unreachableHint: 'Проверьте интернет-соединение, VPN или сетевой статус сервера.',
  authTitle: 'Ошибка аутентификации SSH',
  authHint: 'Сервер отклонил вход. Проверьте имя пользователя, пароль или приватный SSH-ключ.',
  hostKeyTitle: 'Ключ хоста SSH изменился (заблокировано)',
  hostKeyHint: 'Отпечаток сервера изменился. Убедитесь, что ОС переустанавливалась, прежде чем обновлять known_hosts.',
  proxyTitle: 'Ошибка подключения через SOCKS5-прокси',
  proxyHint: 'Не удалось соединиться через указанный SOCKS5-прокси. Проверьте адрес, порт и логин.',
  resetTitle: 'Соединение сброшено удалённым сервером',
  resetHint: 'Сервер внезапно закрыл соединение (возможна блокировка Fail2ban или перезагрузка).',
  demoOutageTitle: 'Активна симуляция сбоя',
  demoOutageHint: 'Демо-сервер намеренно отключён для проверки алертов. Нажмите «Восстановить сервер».',
  genericTitle: 'Не удаётся подключиться к серверу',
  genericHint: 'Проверьте состояние сервера, настройки SSH и сетевое подключение.',
  techDetailsLabel: 'Технические подробности',
};

const KO: ErrorCopy = {
  timeoutTitle: '서버 응답 없음 (연결 시간 초과)',
  timeoutHint: '서버가 꺼져 있거나 네트워크가 끊겼거나 방화벽이 SSH 포트를 차단하고 있을 수 있습니다.',
  refusedTitle: 'SSH 포트 연결이 거부됨',
  refusedHint: '서버에는 도달했으나 SSH 서비스(sshd)가 중지되었거나 다른 포트에서 실행 중입니다.',
  dnsTitle: '호스트 이름을 찾을 수 없음',
  dnsHint: '도메인/IP 철자 및 DNS 또는 VPN 연결 상태를 확인하세요.',
  unreachableTitle: '서버로의 네트워크 경로 없음',
  unreachableHint: '인터넷 연결, VPN 또는 서버 네트워크 상태를 확인하세요.',
  authTitle: 'SSH 인증 실패',
  authHint: '서버가 로그인을 거부했습니다. 사용자 이름, 비밀번호 또는 SSH 개인 키를 확인하세요.',
  hostKeyTitle: 'SSH 호스트 키 불일치 (보안상 차단됨)',
  hostKeyHint: '서버 지문이 변경되었습니다. OS 재설치 여부를 확인한 뒤 known_hosts를 갱신하세요.',
  proxyTitle: 'SOCKS5 프록시 연결 실패',
  proxyHint: '설정된 SOCKS5 프록시를 통해 연결할 수 없습니다. 프록시 주소, 포트 및 인증 정보를 확인하세요.',
  resetTitle: '원격 서버가 연결을 종료함',
  resetHint: '서버가 예기치 않게 연결을 닫았습니다 (Fail2ban 차단, 제한 또는 재부팅 가능성).',
  demoOutageTitle: '시뮬레이션 장애 활성화됨',
  demoOutageHint: '알림 테스트를 위해 데모 서버가 오프라인 상태입니다. "서버 복구"를 클릭하세요.',
  genericTitle: '서버에 연결할 수 없음',
  genericHint: '서버 상태, SSH 설정 및 네트워크 연결을 확인하세요.',
  techDetailsLabel: '기술 세부 정보',
};

const ID: ErrorCopy = {
  timeoutTitle: 'Server tidak merespons (Waktu koneksi habis)',
  timeoutHint: 'Server mungkin mati, jaringan tidak terjangkau, atau firewall memblokir port SSH.',
  refusedTitle: 'Koneksi ditolak pada port SSH',
  refusedHint: 'Server terjangkau, tetapi layanan SSH (sshd) berhenti atau berjalan di port berbeda.',
  dnsTitle: 'Nama host tidak dapat ditemukan',
  dnsHint: 'Periksa ejaan domain/IP serta koneksi DNS atau VPN Anda.',
  unreachableTitle: 'Tidak ada rute jaringan ke server',
  unreachableHint: 'Periksa koneksi internet, VPN, atau status jaringan server.',
  authTitle: 'Autentikasi SSH gagal',
  authHint: 'Server menolak kredensial. Periksa nama pengguna, kata sandi, atau kunci privat SSH.',
  hostKeyTitle: 'Kunci host SSH berubah (Diblokir demi keamanan)',
  hostKeyHint: 'Sidik jari server berubah. Pastikan OS baru diinstal ulang sebelum memperbarui known_hosts.',
  proxyTitle: 'Koneksi proxy SOCKS5 gagal',
  proxyHint: 'Tidak dapat terhubung lewat proxy SOCKS5 yang diatur. Periksa alamat, port, dan kredensial proxy.',
  resetTitle: 'Koneksi ditutup oleh server',
  resetHint: 'Server memutus koneksi tiba-tiba (kemungkinan blokir Fail2ban atau server restart).',
  demoOutageTitle: 'Simulasi gangguan aktif',
  demoOutageHint: 'Server demo sengaja offline untuk uji peringatan. Klik "Pulihkan Server" untuk menyalakannya kembali.',
  genericTitle: 'Tidak dapat menjangkau server',
  genericHint: 'Periksa status server, pengaturan SSH, dan koneksi jaringan.',
  techDetailsLabel: 'Detail teknis',
};

const ERROR_MAP: Record<string, ErrorCopy> = {
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

export function sanitizeErrorText(raw: string, privacyMode: boolean): string {
  if (!raw) return '';
  if (!privacyMode) return raw;
  return raw
    .replace(/\b(?:\d{1,3}\.){3}\d{1,3}(?::\d+)?\b/g, '•••.•••.•••.•••')
    .replace(/\[[0-9a-fA-F:]+\](?::\d+)?/g, '[•••:•••]')
    .replace(/(?:dial\s+tcp\s+|lookup\s+)([^\s:]+)/gi, (m, host) => m.replace(host, '•••'));
}

export function getErrorTechLabel(lang: string): string {
  return (ERROR_MAP[lang] || EN).techDetailsLabel;
}

export function explainConnectionError(raw: string, lang: string, privacyMode: boolean): FriendlyError {
  const c = ERROR_MAP[lang] || EN;
  const lower = (raw || '').toLowerCase();
  const technical = sanitizeErrorText(raw || '', privacyMode);

  if (lower.includes('simulated') && lower.includes('outage')) {
    return { title: c.demoOutageTitle, hint: c.demoOutageHint, technical };
  }
  if (lower.includes('socks') || lower.includes('proxy')) {
    return { title: c.proxyTitle, hint: c.proxyHint, technical };
  }
  if (lower.includes('knownhosts') || lower.includes('host key') || lower.includes('key mismatch')) {
    return { title: c.hostKeyTitle, hint: c.hostKeyHint, technical };
  }
  if (
    lower.includes('unable to authenticate') ||
    lower.includes('permission denied') ||
    lower.includes('no supported methods') ||
    lower.includes('passphrase') ||
    lower.includes('private key') ||
    lower.includes('handshake failed')
  ) {
    return { title: c.authTitle, hint: c.authHint, technical };
  }
  if (lower.includes('connection refused')) {
    return { title: c.refusedTitle, hint: c.refusedHint, technical };
  }
  if (lower.includes('no such host') || lower.includes('lookup ')) {
    return { title: c.dnsTitle, hint: c.dnsHint, technical };
  }
  if (
    lower.includes('i/o timeout') ||
    lower.includes('timed out') ||
    lower.includes('deadline exceeded')
  ) {
    return { title: c.timeoutTitle, hint: c.timeoutHint, technical };
  }
  if (
    lower.includes('network is unreachable') ||
    lower.includes('no route to host') ||
    lower.includes('host is down') ||
    lower.includes('unreachable')
  ) {
    return { title: c.unreachableTitle, hint: c.unreachableHint, technical };
  }
  if (
    lower.includes('connection reset') ||
    lower.includes('broken pipe') ||
    lower.includes('eof')
  ) {
    return { title: c.resetTitle, hint: c.resetHint, technical };
  }

  return { title: c.genericTitle, hint: c.genericHint, technical };
}