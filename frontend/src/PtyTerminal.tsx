import { useEffect, useLayoutEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';
import {
  Box,
  Check,
  ClipboardPaste,
  Copy,
  Maximize2,
  Minimize2,
  Power,
  RefreshCw,
  Server,
  Trash2,
} from 'lucide-react';
import { ClosePTY, ResizePTY, StartPTY, WritePTY } from '../wailsjs/go/main/App';
import { EventsOn } from '../wailsjs/runtime/runtime';
import { getPtyStrings } from './ptyI18n';

export interface PtyContainerTarget {
  id: string;
  name: string;
}

interface PtyTerminalProps {
  serverId: string;
  serverName: string;
  username: string;
  language: string;
  containerTarget: PtyContainerTarget | null;
  isVisible?: boolean;
  onStatusChange?: (status: 'connecting' | 'connected' | 'disconnected') => void;
  onExitContainer?: () => void;
}

function b64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) {
    out[i] = bin.charCodeAt(i);
  }
  return out;
}

async function readClipboardText(): Promise<string> {
  const rt = (window as any)?.runtime;
  if (rt && typeof rt.ClipboardGetText === 'function') {
    try {
      const txt = await rt.ClipboardGetText();
      if (typeof txt === 'string') return txt;
    } catch {
      // fallback
    }
  }
  if (navigator.clipboard?.readText) {
    try {
      return (await navigator.clipboard.readText()) || '';
    } catch {
      return '';
    }
  }
  return '';
}

async function writeClipboardText(text: string): Promise<boolean> {
  const rt = (window as any)?.runtime;
  if (rt && typeof rt.ClipboardSetText === 'function') {
    try {
      const ok = await rt.ClipboardSetText(text);
      if (ok) return true;
    } catch {
      // fallback
    }
  }
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      return false;
    }
  }
  return false;
}

const QUICK_KEYS = [
  { label: 'htop', cmd: 'htop\r' },
  { label: 'df -h', cmd: 'df -h\r' },
  { label: 'free -h', cmd: 'free -h\r' },
  { label: 'docker ps', cmd: 'docker ps\r' },
];

export default function PtyTerminal({
  serverId,
  serverName,
  username,
  language,
  containerTarget,
  isVisible = true,
  onStatusChange,
  onExitContainer,
}: PtyTerminalProps) {
  const tp = getPtyStrings(language);

  // Persistent DOM host so xterm is NEVER unmounted when toggling fullscreen
  const termHostRef = useRef<HTMLDivElement | null>(null);
  const inlineSlotRef = useRef<HTMLDivElement | null>(null);
  const fullSlotRef = useRef<HTMLDivElement | null>(null);

  const termRef = useRef<Terminal | null>(null);
  const fitRef = useRef<FitAddon | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const copiedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [status, setStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [connectNonce, setConnectNonce] = useState(0);
  const [hasSelection, setHasSelection] = useState(false);
  const [copiedFlash, setCopiedFlash] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [fontSize, setFontSize] = useState(13);
  const onStatusChangeRef = useRef(onStatusChange);
  onStatusChangeRef.current = onStatusChange;

  useEffect(() => {
    onStatusChangeRef.current?.(status);
  }, [status]);

  useEffect(() => {
    return () => {
      onStatusChangeRef.current?.('disconnected');
    };
  }, []);

  const closeActive = useCallback(() => {
    const sid = sessionIdRef.current;
    sessionIdRef.current = null;
    if (sid) {
      ClosePTY(sid).catch(() => {});
    }
  }, []);

  const flashCopied = useCallback(() => {
    setCopiedFlash(true);
    if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current);
    copiedTimerRef.current = setTimeout(() => setCopiedFlash(false), 1500);
  }, []);

  const handleCopy = useCallback(async () => {
    const term = termRef.current;
    if (!term) return;
    const sel = term.getSelection();
    if (!sel) return;
    const ok = await writeClipboardText(sel);
    if (ok) flashCopied();
    term.focus();
  }, [flashCopied]);

  const handlePaste = useCallback(async () => {
    const sid = sessionIdRef.current;
    if (!sid) return;
    const txt = await readClipboardText();
    if (txt) {
      WritePTY(sid, txt).catch(() => {});
    }
    termRef.current?.focus();
  }, []);

  const adjustFontSize = useCallback((delta: number) => {
    setFontSize((prev) => Math.max(11, Math.min(22, prev + delta)));
  }, []);

  const runFit = useCallback(() => {
    const host = termHostRef.current;
    const fit = fitRef.current;
    const term = termRef.current;
    if (!host || !fit || !term) return;
    if (host.clientWidth < 30 || host.clientHeight < 30) return;
    try {
      fit.fit();
      term.refresh(0, Math.max(0, term.rows - 1));
      if (sessionIdRef.current) {
        ResizePTY(sessionIdRef.current, term.cols, term.rows).catch(() => {});
      }
    } catch {
      // ignore during layout transition
    }
  }, []);

  // Collapse fullscreen automatically if user leaves the terminal tab
  useEffect(() => {
    if (!isVisible && expanded) {
      setExpanded(false);
    }
  }, [isVisible, expanded]);

  // F11 toggles fullscreen without interfering with Esc in vim/nano
  useEffect(() => {
    if (!isVisible) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'F11') {
        e.preventDefault();
        setExpanded((v) => !v);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isVisible]);

  // Move the persistent xterm DOM node between inline and fullscreen slots
  useLayoutEffect(() => {
    const host = termHostRef.current;
    const target = expanded ? fullSlotRef.current : inlineSlotRef.current;
    if (host && target && host.parentElement !== target) {
      target.appendChild(host);
    }
    const raf = requestAnimationFrame(() => {
      runFit();
      termRef.current?.focus();
    });
    const t = setTimeout(() => {
      runFit();
      termRef.current?.focus();
    }, 100);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(t);
    };
  }, [expanded, isVisible, runFit]);

  // Apply font size changes live & refit
  useEffect(() => {
    const term = termRef.current;
    if (!term) return;
    term.options.fontSize = fontSize;
    const t = setTimeout(runFit, 20);
    return () => clearTimeout(t);
  }, [fontSize, runFit]);

  // Initialize xterm ONCE inside persistent DOM host
  useEffect(() => {
    const host = document.createElement('div');
    host.style.width = '100%';
    host.style.height = '100%';
    termHostRef.current = host;

    const initialSlot = inlineSlotRef.current;
    if (initialSlot) {
      initialSlot.appendChild(host);
    }

    const term = new Terminal({
      cursorBlink: true,
      cursorStyle: 'bar',
      fontFamily: '"JetBrains Mono", "Cascadia Code", "Fira Code", Consolas, monospace',
      fontSize: 13,
      lineHeight: 1.25,
      scrollback: 1500,
      theme: {
        background: '#070b14',
        foreground: '#e2e8f0',
        cursor: '#22d3ee',
        cursorAccent: '#070b14',
        selectionBackground: 'rgba(34, 211, 238, 0.28)',
        black: '#0f172a',
        red: '#fb7185',
        green: '#34d399',
        yellow: '#fbbf24',
        blue: '#60a5fa',
        magenta: '#c084fc',
        cyan: '#22d3ee',
        white: '#e2e8f0',
        brightBlack: '#475569',
        brightRed: '#fda4af',
        brightGreen: '#6ee7b7',
        brightYellow: '#fde68a',
        brightBlue: '#93c5fd',
        brightMagenta: '#d8b4fe',
        brightCyan: '#67e8f9',
        brightWhite: '#f8fafc',
      },
    });

    const fit = new FitAddon();
    term.loadAddon(fit);
    term.open(host);

    termRef.current = term;
    fitRef.current = fit;
    runFit();

    term.attachCustomKeyEventHandler((ev) => {
      if (ev.type !== 'keydown') return true;
      const mod = ev.ctrlKey || ev.metaKey;
      if (mod && ev.code === 'KeyC' && (ev.shiftKey || term.hasSelection())) {
        const sel = term.getSelection();
        if (sel) {
          writeClipboardText(sel).catch(() => {});
          term.clearSelection();
        }
        return false;
      }
      if (mod && ev.code === 'KeyV') {
        readClipboardText()
          .then((txt) => {
            if (txt && sessionIdRef.current) {
              WritePTY(sessionIdRef.current, txt).catch(() => {});
            }
          })
          .catch(() => {});
        return false;
      }
      if (mod && (ev.key === '+' || ev.key === '=')) {
        ev.preventDefault();
        setFontSize((prev) => Math.min(22, prev + 1));
        return false;
      }
      if (mod && ev.key === '-') {
        ev.preventDefault();
        setFontSize((prev) => Math.max(11, prev - 1));
        return false;
      }
      if (mod && ev.key === '0') {
        ev.preventDefault();
        setFontSize(13);
        return false;
      }
      return true;
    });

    const selSub = term.onSelectionChange(() => {
      setHasSelection(term.hasSelection());
    });

    const dataSub = term.onData((data) => {
      if (sessionIdRef.current) {
        WritePTY(sessionIdRef.current, data).catch(() => {});
      }
    });

    const resizeSub = term.onResize(({ cols, rows }) => {
      if (sessionIdRef.current) {
        ResizePTY(sessionIdRef.current, cols, rows).catch(() => {});
      }
    });

    const ro = new ResizeObserver(() => {
      runFit();
    });
    ro.observe(host);

    const offData = EventsOn('pty:data', (payload: any) => {
      if (!payload || payload.sessionId !== sessionIdRef.current || !payload.data) return;
      try {
        term.write(b64ToBytes(String(payload.data)));
      } catch {
        // ignore decode error
      }
    });

    const offExit = EventsOn('pty:exit', (payload: any) => {
      if (!payload || payload.sessionId !== sessionIdRef.current) return;
      sessionIdRef.current = null;
      setStatus('disconnected');
      term.writeln(`\r\n\x1b[90m[${payload.reason || 'Disconnected'}]\x1b[0m`);
    });

    return () => {
      if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current);
      closeActive();
      offData();
      offExit();
      ro.disconnect();
      selSub.dispose();
      dataSub.dispose();
      resizeSub.dispose();
      term.dispose();
      host.remove();
      termHostRef.current = null;
      termRef.current = null;
      fitRef.current = null;
    };
  }, [closeActive, runFit]);

  // Connect / reconnect when server or container target changes
  useEffect(() => {
    let cancelled = false;
    const term = termRef.current;
    if (!term || !serverId) return;

    closeActive();
    setStatus('connecting');
    setErrorMsg('');
    setHasSelection(false);
    term.reset();
    runFit();

    const cols = term.cols || 80;
    const rows = term.rows || 24;
    const targetId = containerTarget?.id || '';

    StartPTY(serverId, targetId, cols, rows)
      .then((res) => {
        if (cancelled) {
          if (res?.sessionId) ClosePTY(res.sessionId).catch(() => {});
          return;
        }
        if (res && res.success && res.sessionId) {
          sessionIdRef.current = res.sessionId;
          setStatus('connected');
          term.focus();
          runFit();
        } else {
          setStatus('disconnected');
          const err = res?.error || 'Failed to start PTY session';
          setErrorMsg(err);
          term.writeln(`\x1b[31mError: ${err}\x1b[0m`);
        }
      })
      .catch((err) => {
        if (cancelled) return;
        setStatus('disconnected');
        const msg = String(err);
        setErrorMsg(msg);
        term.writeln(`\x1b[31mError: ${msg}\x1b[0m`);
      });

    return () => {
      cancelled = true;
    };
  }, [serverId, containerTarget?.id, connectNonce, closeActive, runFit]);

  const sendRaw = (raw: string) => {
    if (sessionIdRef.current) {
      WritePTY(sessionIdRef.current, raw).catch(() => {});
      termRef.current?.focus();
    }
  };

  const handleContextMenu = async (e: React.MouseEvent) => {
    e.preventDefault();
    const term = termRef.current;
    if (!term) return;
    if (term.hasSelection()) {
      const sel = term.getSelection();
      if (sel) {
        const ok = await writeClipboardText(sel);
        if (ok) flashCopied();
        term.clearSelection();
      }
    } else if (sessionIdRef.current) {
      const txt = await readClipboardText();
      if (txt) {
        WritePTY(sessionIdRef.current, txt).catch(() => {});
      }
    }
    term.focus();
  };

  const toolbarEl = (
    <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 rounded-xl border border-white/10 bg-slate-950/90 px-3 py-2 text-xs">
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
            status === 'connected'
              ? 'bg-emerald-500/15 text-emerald-300'
              : status === 'connecting'
                ? 'bg-amber-500/15 text-amber-300'
                : 'bg-rose-500/15 text-rose-300'
          }`}
        >
          <span
            className={`h-2 w-2 rounded-full ${
              status === 'connected'
                ? 'bg-emerald-400'
                : status === 'connecting'
                  ? 'animate-pulse bg-amber-400'
                  : 'bg-rose-400'
            }`}
          />
          {status === 'connected'
            ? tp.connected
            : status === 'connecting'
              ? tp.connecting
              : tp.disconnected}
        </span>

        {containerTarget ? (
          <div className="flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1 rounded-lg border border-sky-400/30 bg-sky-500/15 px-2 py-0.5 font-mono text-[11px] text-sky-200">
              <Box className="h-3 w-3" />
              {containerTarget.name}
            </span>
            {onExitContainer && (
              <button
                type="button"
                onClick={onExitContainer}
                className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] text-slate-300 transition hover:bg-white/15 hover:text-white"
              >
                <Server className="h-3 w-3" />
                {tp.backToHost}
              </button>
            )}
          </div>
        ) : (
          <span className="font-mono text-[11px] text-slate-300">
            {username}@{serverName}
          </span>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          disabled={!hasSelection && !copiedFlash}
          onMouseDown={(e) => e.preventDefault()}
          onClick={handleCopy}
          className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-[11px] font-medium transition ${
            copiedFlash
              ? 'border-emerald-400/35 bg-emerald-500/20 text-emerald-200'
              : hasSelection
                ? 'border-cyan-400/35 bg-cyan-500/15 text-cyan-200 hover:bg-cyan-500/25'
                : 'border-white/10 bg-white/5 text-slate-400 opacity-50'
          }`}
          title={tp.copy}
        >
          {copiedFlash ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
          {copiedFlash ? tp.copied : tp.copy}
        </button>

        <button
          type="button"
          disabled={status !== 'connected'}
          onMouseDown={(e) => e.preventDefault()}
          onClick={handlePaste}
          className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-medium text-slate-200 transition hover:border-cyan-400/35 hover:bg-cyan-500/15 hover:text-cyan-200 disabled:opacity-40"
          title={tp.paste}
        >
          <ClipboardPaste className="h-3 w-3" />
          {tp.paste}
        </button>

        <div className="inline-flex items-center rounded-lg border border-white/10 bg-white/5 text-[11px]">
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => adjustFontSize(-1)}
            className="px-2 py-1 font-mono text-slate-300 transition hover:bg-white/10 hover:text-white"
            title="Zoom out (Ctrl -)"
          >
            A-
          </button>
          <span className="border-x border-white/10 px-1.5 font-mono text-[10px] text-slate-400">
            {fontSize}
          </span>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => adjustFontSize(1)}
            className="px-2 py-1 font-mono text-slate-300 transition hover:bg-white/10 hover:text-white"
            title="Zoom in (Ctrl +)"
          >
            A+
          </button>
        </div>

        <span className="mx-0.5 hidden h-4 w-px bg-white/10 sm:inline-block" />

        {QUICK_KEYS.map((q) => (
          <button
            key={q.label}
            type="button"
            disabled={status !== 'connected'}
            onClick={() => sendRaw(q.cmd)}
            className="hidden rounded-lg border border-white/10 bg-white/5 px-2 py-1 font-mono text-[11px] text-slate-300 transition hover:border-cyan-400/30 hover:bg-cyan-500/10 hover:text-cyan-200 disabled:opacity-40 xl:inline-flex"
          >
            {q.label}
          </button>
        ))}

        <button
          type="button"
          disabled={status !== 'connected'}
          onClick={() => sendRaw('\x03')}
          className="rounded-lg border border-amber-400/25 bg-amber-500/10 px-2 py-1 text-[11px] font-medium text-amber-200 transition hover:bg-amber-500/20 disabled:opacity-40"
          title="Send SIGINT (Ctrl+C)"
        >
          {tp.interrupt}
        </button>

        <button
          type="button"
          onClick={() => termRef.current?.clear()}
          className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-[11px] text-slate-300 transition hover:bg-white/15 hover:text-white"
          title={tp.clear}
        >
          <Trash2 className="h-3 w-3" />
        </button>

        <button
          type="button"
          onClick={() => setConnectNonce((n) => n + 1)}
          className="inline-flex items-center gap-1 rounded-lg border border-cyan-400/25 bg-cyan-500/10 px-2.5 py-1 text-[11px] font-medium text-cyan-200 transition hover:bg-cyan-500/20"
        >
          <RefreshCw className={`h-3 w-3 ${status === 'connecting' ? 'animate-spin' : ''}`} />
          {tp.reconnect}
        </button>

        {status === 'connected' && (
          <button
            type="button"
            onClick={() => {
              closeActive();
              setStatus('disconnected');
              termRef.current?.writeln('\r\n\x1b[90m[Disconnected by user]\x1b[0m');
            }}
            className="inline-flex items-center gap-1 rounded-lg border border-rose-400/25 bg-rose-500/10 px-2 py-1 text-[11px] text-rose-200 transition hover:bg-rose-500/20"
            title={tp.disconnect}
          >
            <Power className="h-3 w-3" />
          </button>
        )}

        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-cyan-400/35 bg-cyan-500/15 px-2.5 py-1 text-[11px] font-semibold text-cyan-200 transition hover:bg-cyan-500/25"
          title={`${expanded ? tp.collapse : tp.expand} (F11)`}
        >
          {expanded ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
          {expanded && <span>{tp.collapse}</span>}
        </button>
      </div>
    </div>
  );

  if (expanded) {
    return createPortal(
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 99999,
          backgroundColor: '#070b14',
          display: 'flex',
          flexDirection: 'column',
          padding: '12px',
          gap: '10px',
          boxSizing: 'border-box',
        }}
      >
        {toolbarEl}
        {errorMsg && (
          <div className="shrink-0 rounded-xl border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">
            {errorMsg}
          </div>
        )}
        <div
          dir="ltr"
          onClick={() => termRef.current?.focus()}
          onContextMenu={handleContextMenu}
          style={{
            flex: 1,
            minHeight: 0,
            width: '100%',
            backgroundColor: '#070b14',
            borderRadius: '12px',
            border: '1px solid rgba(255,255,255,0.1)',
            padding: '10px',
            overflow: 'hidden',
            boxSizing: 'border-box',
          }}
        >
          <div ref={fullSlotRef} style={{ width: '100%', height: '100%' }} />
        </div>
      </div>,
      document.body
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {toolbarEl}
      {errorMsg && (
        <div className="rounded-xl border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">
          {errorMsg}
        </div>
      )}
      <div
        dir="ltr"
        onClick={() => termRef.current?.focus()}
        onContextMenu={handleContextMenu}
        className="h-[460px] w-full overflow-hidden rounded-xl border border-white/10 bg-[#070b14] p-2 shadow-inner"
      >
        <div ref={inlineSlotRef} className="h-full w-full" />
      </div>
      <p className="text-[11px] text-slate-500">{tp.ptyTip}</p>
    </div>
  );
}