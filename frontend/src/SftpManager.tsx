import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  ArrowUp,
  Check,
  ChevronDown,
  ChevronUp,
  Copy,
  Download,
  Edit3,
  Eye,
  EyeOff,
  FileCode2,
  FilePlus,
  FileText,
  Folder,
  FolderOpen,
  FolderPlus,
  Home,
  Maximize2,
  Minimize2,
  Pencil,
  Redo2,
  RefreshCw,
  Save,
  Search,
  ShieldCheck,
  Trash2,
  Undo2,
  Upload,
  WrapText,
  X,
} from 'lucide-react';
import {
  SFTPDelete,
  SFTPDownloadFile,
  SFTPListDir,
  SFTPMkdir,
  SFTPNewFile,
  SFTPReadFile,
  SFTPRename,
  SFTPUploadFile,
  SFTPWriteFile,
} from '../wailsjs/go/main/App';
import { main } from '../wailsjs/go/models';
import { getSftpStrings } from './sftpI18n';

interface SftpManagerProps {
  serverId: string;
  serverName: string;
  language: string;
  onToast: (type: 'success' | 'error', message: string) => void;
}

const BOOKMARKS = [
  { label: '~', path: '~' },
  { label: '/etc/nginx', path: '/etc/nginx' },
  { label: '/etc/systemd/system', path: '/etc/systemd/system' },
  { label: '/var/log', path: '/var/log' },
  { label: '/opt', path: '/opt' },
  { label: '/', path: '/' },
];

const CONFIG_EXTS = new Set([
  'conf', 'cfg', 'ini', 'env', 'yml', 'yaml', 'json', 'toml', 'xml',
  'sh', 'bash', 'zsh', 'service', 'timer', 'socket', 'rules', 'txt',
  'log', 'md', 'py', 'js', 'ts', 'go', 'rs', 'php', 'rb', 'sql', 'dockerfile',
]);

const TEXT_WRAP_DEFAULT_EXTS = new Set(['txt', 'md', 'log', 'csv', 'srt']);

const MAX_UNDO_STEPS = 100;

interface SftpServerCache {
  path: string;
  parent: string;
  entries: main.FileEntry[];
  filter: string;
  showHidden: boolean;
}

const sftpDirCache = new Map<string, SftpServerCache>();
const MAX_SFTP_CACHE_SERVERS = 20;

function saveSftpCache(serverId: string, data: SftpServerCache) {
  if (sftpDirCache.has(serverId)) sftpDirCache.delete(serverId);
  sftpDirCache.set(serverId, data);
  if (sftpDirCache.size > MAX_SFTP_CACHE_SERVERS) {
    const oldest = sftpDirCache.keys().next().value;
    if (oldest) sftpDirCache.delete(oldest);
  }
}

function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return '-';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function isConfigFile(name: string): boolean {
  const lower = name.toLowerCase();
  if (lower.startsWith('.env') || lower === 'dockerfile' || lower === 'makefile') return true;
  const idx = lower.lastIndexOf('.');
  if (idx < 0) return false;
  return CONFIG_EXTS.has(lower.slice(idx + 1));
}

function shouldWrapByDefault(filePath: string): boolean {
  const lower = filePath.toLowerCase();
  const idx = lower.lastIndexOf('.');
  if (idx < 0) return false;
  return TEXT_WRAP_DEFAULT_EXTS.has(lower.slice(idx + 1));
}

async function copyTextToClipboard(text: string): Promise<boolean> {
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

export default function SftpManager({ serverId, serverName, language, onToast }: SftpManagerProps) {
  const ts = getSftpStrings(language);

  const [currentPath, setCurrentPath] = useState<string>('~');
  const [pathInput, setPathInput] = useState<string>('~');
  const [parentPath, setParentPath] = useState<string>('/');
  const [entries, setEntries] = useState<main.FileEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [busy, setBusy] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [filter, setFilter] = useState<string>('');
  const [showHidden, setShowHidden] = useState<boolean>(true);

  // Inline create / rename / delete confirmation states
  const [promptMode, setPromptMode] = useState<null | { kind: 'mkdir' | 'newfile' | 'rename'; targetPath?: string; initial?: string }>(null);
  const [promptVal, setPromptVal] = useState<string>('');
  const [confirmDeletePath, setConfirmDeletePath] = useState<string | null>(null);

  // Upgraded Quick Editor states
  const [editorFile, setEditorFile] = useState<{ path: string; content: string; original: string } | null>(null);
  const [editorSaving, setEditorSaving] = useState<boolean>(false);
  const [editorFullscreen, setEditorFullscreen] = useState<boolean>(false);
  const [editorFontSize, setEditorFontSize] = useState<number>(14);
  const [editorDir, setEditorDir] = useState<'ltr' | 'rtl'>('ltr');
  const [wordWrap, setWordWrap] = useState<boolean>(true);
  const [copiedFlash, setCopiedFlash] = useState<boolean>(false);
  const [confirmCloseOpen, setConfirmCloseOpen] = useState<boolean>(false);
  const [cursorPos, setCursorPos] = useState<{ ln: number; col: number }>({ ln: 1, col: 1 });

  // Undo / Redo stack
  const [undoStack, setUndoStack] = useState<string[]>([]);
  const [undoIdx, setUndoIdx] = useState<number>(0);
  const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const findInputRef = useRef<HTMLInputElement | null>(null);

  // Find & Replace bar
  const [findOpen, setFindOpen] = useState<boolean>(false);
  const [findQuery, setFindQuery] = useState<string>('');
  const [replaceQuery, setReplaceQuery] = useState<string>('');
  const [activeMatchIdx, setActiveMatchIdx] = useState<number>(0);

  const loadDir = useCallback(
    async (targetPath: string) => {
      if (!serverId) return;
      setLoading(true);
      setErrorMsg('');
      setConfirmDeletePath(null);
      try {
        const res = await SFTPListDir(serverId, targetPath);
        if (res && res.success) {
          const nextPath = res.path || '/';
          const nextParent = res.parent || '/';
          const nextEntries = res.entries || [];
          setCurrentPath(nextPath);
          setPathInput(nextPath);
          setParentPath(nextParent);
          setEntries(nextEntries);
          const prev = sftpDirCache.get(serverId);
          saveSftpCache(serverId, {
            path: nextPath,
            parent: nextParent,
            entries: nextEntries,
            filter: prev?.filter ?? '',
            showHidden: prev?.showHidden ?? true,
          });
        } else if (res?.error === 'NOT_A_DIRECTORY') {
          SFTPReadFile(serverId, targetPath).then((fres) => {
            if (fres && fres.success) {
              initEditorSession(fres.path, fres.content);
            } else {
              onToast('error', fres?.error || 'Cannot open file');
            }
          });
        } else {
          setErrorMsg(res?.error || 'Failed to load directory');
        }
      } catch (err) {
        setErrorMsg(String(err));
      } finally {
        setLoading(false);
      }
    },
    [serverId]
  );

  // Instant per-server restore from lightweight cache (0ms switch, 1 DOM instance)
  useEffect(() => {
    setEditorFile(null);
    setEditorFullscreen(false);
    setConfirmCloseOpen(false);
    setFindOpen(false);
    setPromptMode(null);
    setConfirmDeletePath(null);
    setErrorMsg('');

    const cached = sftpDirCache.get(serverId);
    if (cached) {
      setCurrentPath(cached.path);
      setPathInput(cached.path);
      setParentPath(cached.parent);
      setEntries(cached.entries);
      setFilter(cached.filter);
      setShowHidden(cached.showHidden);
    } else {
      setCurrentPath('~');
      setPathInput('~');
      setParentPath('/');
      setEntries([]);
      setFilter('');
      setShowHidden(true);
      loadDir('~');
    }
  }, [serverId, loadDir]);

  useEffect(() => {
    const cached = sftpDirCache.get(serverId);
    if (cached) {
      cached.filter = filter;
      cached.showHidden = showHidden;
    }
  }, [serverId, filter, showHidden]);

  const visibleEntries = useMemo(() => {
    const q = filter.trim().toLowerCase();
    return entries.filter((e) => {
      if (!showHidden && e.name.startsWith('.')) return false;
      if (q && !e.name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [entries, filter, showHidden]);

  const breadcrumbs = useMemo(() => {
    const clean = currentPath || '/';
    if (clean === '/') return [{ label: '/', path: '/' }];
    const parts = clean.split('/').filter(Boolean);
    const list = [{ label: '/', path: '/' }];
    let acc = '';
    for (const p of parts) {
      acc += '/' + p;
      list.push({ label: p, path: acc });
    }
    return list;
  }, [currentPath]);

  const initEditorSession = useCallback((filePath: string, content: string) => {
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    setEditorFile({ path: filePath, content, original: content });
    setUndoStack([content]);
    setUndoIdx(0);
    setConfirmCloseOpen(false);
    setFindOpen(false);
    setFindQuery('');
    setReplaceQuery('');
    setActiveMatchIdx(0);
    setCursorPos({ ln: 1, col: 1 });
    setWordWrap(shouldWrapByDefault(filePath));
    // Auto-detect RTL if Persian/Arabic characters exist in first 400 chars
    const sample = content.slice(0, 400);
    setEditorDir(/[\u0600-\u06FF]/.test(sample) ? 'rtl' : 'ltr');
  }, []);

  const commitSnapshotNow = useCallback((nextContent: string) => {
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    setUndoStack((prev) => {
      const sliced = prev.slice(0, undoIdx + 1);
      if (sliced[sliced.length - 1] === nextContent) return sliced;
      const merged = [...sliced, nextContent];
      return merged.length > MAX_UNDO_STEPS ? merged.slice(merged.length - MAX_UNDO_STEPS) : merged;
    });
    setUndoIdx((prev) => Math.min(prev + 1, MAX_UNDO_STEPS - 1));
  }, [undoIdx]);

  const updateEditorContent = useCallback(
    (nextContent: string, immediateHistory = false) => {
      setEditorFile((prev) => (prev ? { ...prev, content: nextContent } : null));
      if (immediateHistory) {
        commitSnapshotNow(nextContent);
      } else {
        if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
        undoTimerRef.current = setTimeout(() => {
          commitSnapshotNow(nextContent);
        }, 350);
      }
    },
    [commitSnapshotNow]
  );

  const canUndo = undoIdx > 0;
  const canRedo = undoIdx < undoStack.length - 1;

  const handleUndo = useCallback(() => {
    if (!canUndo) return;
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    const nextIdx = undoIdx - 1;
    const val = undoStack[nextIdx];
    setUndoIdx(nextIdx);
    setEditorFile((prev) => (prev ? { ...prev, content: val } : null));
  }, [canUndo, undoIdx, undoStack]);

  const handleRedo = useCallback(() => {
    if (!canRedo) return;
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    const nextIdx = undoIdx + 1;
    const val = undoStack[nextIdx];
    setUndoIdx(nextIdx);
    setEditorFile((prev) => (prev ? { ...prev, content: val } : null));
  }, [canRedo, undoIdx, undoStack]);

  const handleOpenEditor = async (filePath: string) => {
    setBusy(true);
    try {
      const res = await SFTPReadFile(serverId, filePath);
      if (res && res.success) {
        initEditorSession(res.path, res.content);
      } else {
        onToast('error', res?.error || 'Cannot open file');
      }
    } catch (err) {
      onToast('error', String(err));
    } finally {
      setBusy(false);
    }
  };

  const handleSaveEditor = useCallback(async (): Promise<boolean> => {
    if (!editorFile || editorSaving) return false;
    setEditorSaving(true);
    try {
      const res = await SFTPWriteFile(serverId, editorFile.path, editorFile.content);
      if (res && res.success) {
        setEditorFile((prev) => (prev ? { ...prev, original: prev.content } : null));
        onToast('success', res.message || 'Saved');
        loadDir(currentPath);
        return true;
      } else {
        onToast('error', res?.message || 'Save failed');
        return false;
      }
    } catch (err) {
      onToast('error', String(err));
      return false;
    } finally {
      setEditorSaving(false);
    }
  }, [editorFile, editorSaving, serverId, currentPath, loadDir, onToast]);

  const isDirty = !!editorFile && editorFile.content !== editorFile.original;

  const requestCloseEditor = useCallback(() => {
    if (isDirty) {
      setConfirmCloseOpen(true);
    } else {
      setEditorFile(null);
      setEditorFullscreen(false);
      setFindOpen(false);
    }
  }, [isDirty]);

  // Compute Find matches
  const matchPositions = useMemo(() => {
    if (!editorFile || !findQuery) return [] as number[];
    const hay = editorFile.content.toLowerCase();
    const needle = findQuery.toLowerCase();
    const positions: number[] = [];
    let pos = 0;
    while (pos <= hay.length - needle.length) {
      const idx = hay.indexOf(needle, pos);
      if (idx === -1) break;
      positions.push(idx);
      pos = idx + Math.max(1, needle.length);
      if (positions.length >= 2000) break;
    }
    return positions;
  }, [editorFile, findQuery]);

  const jumpToMatch = useCallback(
    (index: number) => {
      const el = textareaRef.current;
      if (!el || matchPositions.length === 0 || !findQuery) return;
      const safeIdx = ((index % matchPositions.length) + matchPositions.length) % matchPositions.length;
      setActiveMatchIdx(safeIdx);
      const start = matchPositions[safeIdx];
      const end = start + findQuery.length;
      el.focus();
      el.setSelectionRange(start, end);
      // Scroll roughly into view
      const before = el.value.slice(0, start);
      const lineNum = before.split('\n').length;
      const lineHeight = editorFontSize * 1.6;
      el.scrollTop = Math.max(0, (lineNum - 4) * lineHeight);
    },
    [matchPositions, findQuery, editorFontSize]
  );

  const handleReplaceOne = () => {
    if (!editorFile || !findQuery || matchPositions.length === 0) return;
    const safeIdx = Math.min(activeMatchIdx, matchPositions.length - 1);
    const start = matchPositions[safeIdx];
    const next =
      editorFile.content.slice(0, start) +
      replaceQuery +
      editorFile.content.slice(start + findQuery.length);
    updateEditorContent(next, true);
  };

  const handleReplaceAll = () => {
    if (!editorFile || !findQuery || matchPositions.length === 0) return;
    const escaped = findQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const next = editorFile.content.replace(new RegExp(escaped, 'gi'), () => replaceQuery);
    updateEditorContent(next, true);
  };

  const updateCursorFromEl = (el: HTMLTextAreaElement) => {
    const before = el.value.slice(0, el.selectionStart);
    const lines = before.split('\n');
    setCursorPos({ ln: lines.length, col: lines[lines.length - 1].length + 1 });
  };

  // Global keyboard shortcuts inside Editor
  useEffect(() => {
    if (!editorFile) return;
    const onKey = (e: KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey;
      if (mod && e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleSaveEditor();
      } else if (mod && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        setFindOpen(true);
        requestAnimationFrame(() => findInputRef.current?.focus());
      } else if (mod && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        if (document.activeElement !== findInputRef.current) {
          e.preventDefault();
          handleUndo();
        }
      } else if (mod && (e.key.toLowerCase() === 'y' || (e.key.toLowerCase() === 'z' && e.shiftKey))) {
        if (document.activeElement !== findInputRef.current) {
          e.preventDefault();
          handleRedo();
        }
      } else if (mod && (e.key === '+' || e.key === '=')) {
        e.preventDefault();
        setEditorFontSize((s) => Math.min(24, s + 1));
      } else if (mod && e.key === '-') {
        e.preventDefault();
        setEditorFontSize((s) => Math.max(11, s - 1));
      } else if (mod && e.key === '0') {
        e.preventDefault();
        setEditorFontSize(14);
      } else if (e.key === 'F11') {
        e.preventDefault();
        setEditorFullscreen((v) => !v);
      } else if (e.key === 'Escape' && findOpen) {
        e.preventDefault();
        setFindOpen(false);
        textareaRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [editorFile, findOpen, handleSaveEditor, handleUndo, handleRedo]);

  const handleUpload = async () => {
    setBusy(true);
    try {
      const res = await SFTPUploadFile(serverId, currentPath);
      if (res.success) {
        onToast('success', res.message);
        loadDir(currentPath);
      } else if (res.message !== 'cancelled') {
        onToast('error', res.message);
      }
    } catch (err) {
      onToast('error', String(err));
    } finally {
      setBusy(false);
    }
  };

  const handleDownload = async (remotePath: string) => {
    setBusy(true);
    try {
      const res = await SFTPDownloadFile(serverId, remotePath);
      if (res.success) {
        onToast('success', res.message);
      } else if (res.message !== 'cancelled') {
        onToast('error', res.message);
      }
    } catch (err) {
      onToast('error', String(err));
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (remotePath: string) => {
    setBusy(true);
    setConfirmDeletePath(null);
    try {
      const res = await SFTPDelete(serverId, remotePath);
      if (res.success) {
        onToast('success', res.message);
        loadDir(currentPath);
      } else {
        onToast('error', res.message);
      }
    } catch (err) {
      onToast('error', String(err));
    } finally {
      setBusy(false);
    }
  };

  const handlePromptSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promptMode || !promptVal.trim()) return;
    const val = promptVal.trim();
    setBusy(true);
    try {
      if (promptMode.kind === 'mkdir') {
        const res = await SFTPMkdir(serverId, currentPath, val);
        if (res.success) {
          onToast('success', res.message);
          setPromptMode(null);
          setPromptVal('');
          loadDir(currentPath);
        } else {
          onToast('error', res.message);
        }
      } else if (promptMode.kind === 'newfile') {
        const res = await SFTPNewFile(serverId, currentPath, val);
        if (res.success) {
          const createdPath = res.message;
          setPromptMode(null);
          setPromptVal('');
          loadDir(currentPath);
          initEditorSession(createdPath, '');
        } else {
          onToast('error', res.message);
        }
      } else if (promptMode.kind === 'rename' && promptMode.targetPath) {
        const res = await SFTPRename(serverId, promptMode.targetPath, val);
        if (res.success) {
          onToast('success', res.message);
          setPromptMode(null);
          setPromptVal('');
          loadDir(currentPath);
        } else {
          onToast('error', res.message);
        }
      }
    } catch (err) {
      onToast('error', String(err));
    } finally {
      setBusy(false);
    }
  };

  const editorLineCount = editorFile ? editorFile.content.split('\n').length : 0;

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4 backdrop-blur-xl">
      {/* Header & Main Actions */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <FolderOpen className="h-4 w-4 text-amber-400" />
          <h3 className="text-sm font-semibold text-white">{ts.title}</h3>
          <span className="rounded-md bg-white/5 px-2 py-0.5 text-[11px] text-slate-400">
            {visibleEntries.length}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <button
            type="button"
            disabled={busy}
            onClick={handleUpload}
            className="inline-flex items-center gap-1.5 rounded-lg border border-cyan-400/30 bg-cyan-500/15 px-2.5 py-1 text-[11px] font-semibold text-cyan-200 transition hover:bg-cyan-500/25 disabled:opacity-50"
          >
            <Upload className="h-3.5 w-3.5" />
            {ts.upload}
          </button>

          <button
            type="button"
            disabled={busy}
            onClick={() => {
              setPromptMode({ kind: 'newfile' });
              setPromptVal('');
            }}
            className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-medium text-slate-200 transition hover:bg-white/15 disabled:opacity-50"
          >
            <FilePlus className="h-3.5 w-3.5" />
            {ts.newFile}
          </button>

          <button
            type="button"
            disabled={busy}
            onClick={() => {
              setPromptMode({ kind: 'mkdir' });
              setPromptVal('');
            }}
            className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-medium text-slate-200 transition hover:bg-white/15 disabled:opacity-50"
          >
            <FolderPlus className="h-3.5 w-3.5" />
            {ts.newFolder}
          </button>

          <button
            type="button"
            disabled={loading}
            onClick={() => loadDir(currentPath)}
            className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-slate-300 transition hover:bg-white/15 hover:text-white disabled:opacity-50"
            title={ts.refresh}
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Navigation Bar: Up + Direct Path Input + Filter */}
      <div className="mb-2.5 flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={loading || currentPath === '/'}
          onClick={() => loadDir(parentPath)}
          className="inline-flex items-center gap-1 rounded-xl border border-white/10 bg-slate-950/70 px-2.5 py-1.5 text-xs text-slate-300 transition hover:bg-white/10 hover:text-white disabled:opacity-40"
          title={ts.upDir}
        >
          <ArrowUp className="h-3.5 w-3.5" />
        </button>

        <button
          type="button"
          disabled={loading}
          onClick={() => loadDir('~')}
          className="inline-flex items-center gap-1 rounded-xl border border-white/10 bg-slate-950/70 px-2.5 py-1.5 text-xs text-slate-300 transition hover:bg-white/10 hover:text-white disabled:opacity-40"
          title="Home (~)"
        >
          <Home className="h-3.5 w-3.5" />
        </button>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            loadDir(pathInput);
          }}
          className="flex min-w-[200px] flex-1 items-center gap-1.5"
        >
          <input
            dir="ltr"
            type="text"
            spellCheck={false}
            value={pathInput}
            onChange={(e) => setPathInput(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-slate-950/80 px-3 py-1.5 font-mono text-xs text-cyan-200 outline-none focus:border-cyan-400/50"
          />
          <button
            type="submit"
            disabled={loading}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-200 transition hover:bg-white/15"
          >
            {ts.go}
          </button>
        </form>

        <div className="relative w-44">
          <Search className="pointer-events-none absolute start-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder={ts.filterFiles}
            className="w-full rounded-xl border border-white/10 bg-slate-950/80 py-1.5 pe-2.5 ps-8 text-xs text-white placeholder-slate-500 outline-none focus:border-cyan-400/50"
          />
        </div>

        <button
          type="button"
          onClick={() => setShowHidden((v) => !v)}
          className={`inline-flex items-center gap-1 rounded-xl border px-2.5 py-1.5 text-[11px] font-medium transition ${
            showHidden
              ? 'border-cyan-400/30 bg-cyan-500/10 text-cyan-200'
              : 'border-white/10 bg-white/5 text-slate-400 hover:text-white'
          }`}
        >
          {showHidden ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
          {ts.showHidden}
        </button>
      </div>

      {/* Quick Linux Path Bookmarks + Breadcrumbs */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/5 bg-slate-950/50 px-3 py-1.5 text-[11px]">
        <div dir="ltr" className="flex flex-wrap items-center gap-1 font-mono text-slate-300">
          {breadcrumbs.map((bc, idx) => (
            <span key={bc.path} className="inline-flex items-center gap-1">
              {idx > 0 && <span className="text-slate-600">/</span>}
              <button
                type="button"
                onClick={() => loadDir(bc.path)}
                className={`rounded px-1 py-0.5 transition hover:bg-white/10 hover:text-cyan-300 ${
                  idx === breadcrumbs.length - 1 ? 'font-semibold text-cyan-300' : 'text-slate-400'
                }`}
              >
                {bc.label === '/' ? '/' : bc.label}
              </button>
            </span>
          ))}
        </div>

        <div dir="ltr" className="flex flex-wrap items-center gap-1">
          {BOOKMARKS.map((bm) => (
            <button
              key={bm.path}
              type="button"
              onClick={() => loadDir(bm.path)}
              className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 font-mono text-[10px] text-slate-300 transition hover:border-cyan-400/35 hover:bg-cyan-500/10 hover:text-cyan-200"
            >
              {bm.label}
            </button>
          ))}
        </div>
      </div>

      {/* Inline Create / Rename Prompt */}
      {promptMode && (
        <form
          onSubmit={handlePromptSubmit}
          className="mb-3 flex flex-wrap items-center gap-2 rounded-xl border border-cyan-400/30 bg-cyan-500/10 p-2.5 text-xs"
        >
          <input
            dir="ltr"
            autoFocus
            type="text"
            spellCheck={false}
            value={promptVal}
            onChange={(e) => setPromptVal(e.target.value)}
            placeholder={
              promptMode.kind === 'mkdir'
                ? ts.enterFolderName
                : promptMode.kind === 'newfile'
                  ? ts.enterFileName
                  : ts.enterNewName
            }
            className="min-w-[220px] flex-1 rounded-lg border border-white/15 bg-slate-950/90 px-3 py-1.5 font-mono text-xs text-white outline-none focus:border-cyan-400"
          />
          <button
            type="submit"
            disabled={busy || !promptVal.trim()}
            className="inline-flex items-center gap-1 rounded-lg bg-cyan-500 px-3 py-1.5 text-xs font-semibold text-slate-950 transition hover:brightness-110 disabled:opacity-50"
          >
            <Check className="h-3.5 w-3.5" />
            {promptMode.kind === 'rename' ? ts.rename : ts.create}
          </button>
          <button
            type="button"
            onClick={() => {
              setPromptMode(null);
              setPromptVal('');
            }}
            className="rounded-lg px-2.5 py-1.5 text-xs text-slate-300 hover:bg-white/10 hover:text-white"
          >
            {ts.cancel}
          </button>
        </form>
      )}

      {errorMsg && (
        <div className="mb-3 rounded-xl border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">
          {errorMsg}
        </div>
      )}

      {/* File Table */}
      <div className="max-h-[430px] overflow-auto rounded-xl border border-white/10 bg-slate-950/60">
        {loading && entries.length === 0 ? (
          <div className="flex items-center justify-center gap-2 py-12 text-xs text-slate-400">
            <RefreshCw className="h-4 w-4 animate-spin text-cyan-400" />
            <span>Loading {currentPath}...</span>
          </div>
        ) : visibleEntries.length === 0 ? (
          <p className="py-10 text-center text-xs text-slate-400">{ts.emptyDir}</p>
        ) : (
          <table className="w-full border-collapse text-xs">
            <thead className="sticky top-0 z-10 bg-slate-900/95 text-[11px] text-slate-400">
              <tr className="border-b border-white/10">
                <th className="px-3 py-2 text-start font-medium">{ts.colName}</th>
                <th className="w-24 px-3 py-2 text-start font-medium">{ts.colSize}</th>
                <th className="hidden w-28 px-3 py-2 text-start font-medium md:table-cell">{ts.colPerms}</th>
                <th className="hidden w-36 px-3 py-2 text-start font-medium lg:table-cell">{ts.colModified}</th>
                <th className="w-44 px-3 py-2 text-end font-medium">{ts.colActions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {visibleEntries.map((entry) => {
                const isConfirmingDel = confirmDeletePath === entry.path;
                const configLike = !entry.isDir && isConfigFile(entry.name);
                return (
                  <tr key={entry.path} className="group transition hover:bg-white/[0.04]">
                    <td className="px-3 py-2">
                      <button
                        type="button"
                        onClick={() => (entry.isDir || entry.isSymlink ? loadDir(entry.path) : handleOpenEditor(entry.path))}
                        className="flex max-w-full items-center gap-2 text-start"
                      >
                        {entry.isDir ? (
                          <Folder className="h-4 w-4 shrink-0 text-amber-400" />
                        ) : configLike ? (
                          <FileCode2 className="h-4 w-4 shrink-0 text-cyan-400" />
                        ) : (
                          <FileText className="h-4 w-4 shrink-0 text-slate-400" />
                        )}
                        <span
                          dir="ltr"
                          className={`truncate font-mono ${
                            entry.isDir
                              ? 'font-semibold text-amber-100 group-hover:text-amber-300'
                              : 'text-slate-200 group-hover:text-cyan-200'
                          }`}
                        >
                          {entry.name}
                          {entry.isSymlink ? ' ->' : ''}
                        </span>
                      </button>
                    </td>
                    <td dir="ltr" className="px-3 py-2 font-mono text-[11px] text-slate-400">
                      {entry.isDir ? '-' : formatBytes(entry.size)}
                    </td>
                    <td dir="ltr" className="hidden px-3 py-2 font-mono text-[11px] text-slate-500 md:table-cell">
                      {entry.mode}
                    </td>
                    <td dir="ltr" className="hidden px-3 py-2 font-mono text-[11px] text-slate-500 lg:table-cell">
                      {entry.modTime}
                    </td>
                    <td className="px-3 py-2 text-end">
                      {isConfirmingDel ? (
                        <div className="inline-flex items-center gap-1.5">
                          <span className="text-[10px] text-rose-300">{ts.confirmDelete}</span>
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => handleDelete(entry.path)}
                            className="rounded-md bg-rose-500/25 px-2 py-0.5 text-[11px] font-semibold text-rose-200 hover:bg-rose-500/40"
                          >
                            {ts.del}
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeletePath(null)}
                            className="rounded-md bg-white/10 px-2 py-0.5 text-[11px] text-slate-300 hover:bg-white/20"
                          >
                            {ts.cancel}
                          </button>
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1">
                          {!entry.isDir && (
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => handleOpenEditor(entry.path)}
                              className="inline-flex items-center gap-1 rounded-md border border-cyan-400/25 bg-cyan-500/10 px-2 py-1 text-[11px] font-medium text-cyan-200 transition hover:bg-cyan-500/25"
                              title={ts.edit}
                            >
                              <Edit3 className="h-3 w-3" />
                              <span className="hidden sm:inline">{ts.edit}</span>
                            </button>
                          )}
                          {!entry.isDir && (
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => handleDownload(entry.path)}
                              className="rounded-md border border-white/10 bg-white/5 p-1 text-slate-300 transition hover:bg-white/15 hover:text-white"
                              title={ts.download}
                            >
                              <Download className="h-3.5 w-3.5" />
                            </button>
                          )}
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => {
                              setPromptMode({ kind: 'rename', targetPath: entry.path, initial: entry.name });
                              setPromptVal(entry.name);
                            }}
                            className="rounded-md border border-white/10 bg-white/5 p-1 text-slate-300 transition hover:bg-white/15 hover:text-white"
                            title={ts.rename}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => setConfirmDeletePath(entry.path)}
                            className="rounded-md border border-rose-400/20 bg-rose-500/10 p-1 text-rose-300 transition hover:bg-rose-500/25"
                            title={ts.del}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Upgraded Quick Config Editor Modal (Portal to document.body) */}
      {editorFile &&
        createPortal(
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 99990,
              padding: editorFullscreen ? '0px' : '16px',
            }}
            className="flex items-center justify-center bg-black/80 backdrop-blur-sm"
          >
            <div
              className={`flex flex-col overflow-hidden border border-white/15 bg-[#090d16] shadow-2xl ${
                editorFullscreen
                  ? 'h-screen w-screen rounded-none border-0'
                  : 'h-[90vh] w-[95vw] max-w-6xl rounded-2xl'
              }`}
            >
              {/* Editor Header Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 bg-slate-950/95 px-4 py-2.5 text-xs">
                <div className="flex min-w-0 items-center gap-2">
                  <FileCode2 className="h-4 w-4 shrink-0 text-cyan-400" />
                  <span dir="ltr" className="truncate font-mono font-semibold text-white">
                    {editorFile.path}
                  </span>
                  <span className="rounded-md bg-white/5 px-2 py-0.5 text-[10px] text-slate-400">
                    {serverName}
                  </span>
                  {isDirty && (
                    <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-semibold text-amber-300">
                      {ts.unsaved}
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  {/* Undo / Redo */}
                  <div className="inline-flex items-center rounded-lg border border-white/10 bg-white/5">
                    <button
                      type="button"
                      disabled={!canUndo}
                      onClick={handleUndo}
                      className="px-2 py-1 text-slate-300 transition hover:bg-white/10 hover:text-white disabled:opacity-35"
                      title={`${ts.undo} (Ctrl+Z)`}
                    >
                      <Undo2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={!canRedo}
                      onClick={handleRedo}
                      className="border-s border-white/10 px-2 py-1 text-slate-300 transition hover:bg-white/10 hover:text-white disabled:opacity-35"
                      title={`${ts.redo} (Ctrl+Y)`}
                    >
                      <Redo2 className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {/* Find & Replace toggle */}
                  <button
                    type="button"
                    onClick={() => {
                      setFindOpen((v) => {
                        const next = !v;
                        if (next) requestAnimationFrame(() => findInputRef.current?.focus());
                        return next;
                      });
                    }}
                    className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[11px] transition ${
                      findOpen
                        ? 'border-cyan-400/35 bg-cyan-500/15 text-cyan-200'
                        : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white'
                    }`}
                    title={`${ts.findReplace} (Ctrl+F)`}
                  >
                    <Search className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">{ts.findReplace}</span>
                  </button>

                  {/* Font Zoom (same style as Terminal) */}
                  <div className="inline-flex items-center rounded-lg border border-white/10 bg-white/5 text-[11px]">
                    <button
                      type="button"
                      onClick={() => setEditorFontSize((s) => Math.max(11, s - 1))}
                      className="px-2 py-1 font-mono text-slate-300 transition hover:bg-white/10 hover:text-white"
                      title="Zoom out (Ctrl -)"
                    >
                      A-
                    </button>
                    <span className="border-x border-white/10 px-1.5 font-mono text-[10px] text-slate-400">
                      {editorFontSize}
                    </span>
                    <button
                      type="button"
                      onClick={() => setEditorFontSize((s) => Math.min(24, s + 1))}
                      className="px-2 py-1 font-mono text-slate-300 transition hover:bg-white/10 hover:text-white"
                      title="Zoom in (Ctrl +)"
                    >
                      A+
                    </button>
                  </div>

                  {/* LTR / RTL Toggle */}
                  <button
                    type="button"
                    onClick={() => setEditorDir((d) => (d === 'ltr' ? 'rtl' : 'ltr'))}
                    className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 font-mono text-[11px] font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white"
                    title="Toggle text direction (LTR / RTL)"
                  >
                    {editorDir.toUpperCase()}
                  </button>

                  {/* Word Wrap */}
                  <button
                    type="button"
                    onClick={() => setWordWrap((v) => !v)}
                    className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[11px] transition ${
                      wordWrap
                        ? 'border-cyan-400/35 bg-cyan-500/15 text-cyan-200'
                        : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'
                    }`}
                    title={ts.wordWrap}
                  >
                    <WrapText className="h-3.5 w-3.5" />
                    <span className="hidden md:inline">{ts.wordWrap}</span>
                  </button>

                  {/* Copy All */}
                  <button
                    type="button"
                    onClick={async () => {
                      const ok = await copyTextToClipboard(editorFile.content);
                      if (ok) {
                        setCopiedFlash(true);
                        setTimeout(() => setCopiedFlash(false), 1500);
                      }
                    }}
                    className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[11px] transition ${
                      copiedFlash
                        ? 'border-emerald-400/35 bg-emerald-500/20 text-emerald-200'
                        : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white'
                    }`}
                    title={ts.copyAll}
                  >
                    {copiedFlash ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    <span className="hidden md:inline">{copiedFlash ? ts.copied : ts.copyAll}</span>
                  </button>

                  {/* Fullscreen Toggle */}
                  <button
                    type="button"
                    onClick={() => setEditorFullscreen((v) => !v)}
                    className="inline-flex items-center gap-1 rounded-lg border border-cyan-400/30 bg-cyan-500/10 px-2 py-1 text-[11px] font-medium text-cyan-200 transition hover:bg-cyan-500/25"
                    title={`${editorFullscreen ? ts.exitFullscreen : ts.fullscreen} (F11)`}
                  >
                    {editorFullscreen ? (
                      <Minimize2 className="h-3.5 w-3.5" />
                    ) : (
                      <Maximize2 className="h-3.5 w-3.5" />
                    )}
                  </button>

                  {/* Save Button */}
                  <button
                    type="button"
                    disabled={editorSaving || !isDirty}
                    onClick={() => handleSaveEditor()}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-indigo-500 to-cyan-500 px-3.5 py-1.5 text-xs font-semibold text-white shadow-lg shadow-cyan-500/20 transition hover:brightness-110 disabled:opacity-45"
                  >
                    <Save className="h-3.5 w-3.5" />
                    {editorSaving ? ts.saving : ts.save}
                  </button>

                  {/* Close Button */}
                  <button
                    type="button"
                    onClick={requestCloseEditor}
                    className="rounded-lg p-1.5 text-slate-400 transition hover:bg-white/10 hover:text-white"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Unsaved Changes Confirmation Banner */}
              {confirmCloseOpen && (
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-400/30 bg-amber-500/15 px-4 py-2 text-xs text-amber-100">
                  <span>{ts.unsavedPrompt}</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={editorSaving}
                      onClick={async () => {
                        const ok = await handleSaveEditor();
                        if (ok) {
                          setConfirmCloseOpen(false);
                          setEditorFile(null);
                          setEditorFullscreen(false);
                        }
                      }}
                      className="rounded-lg bg-emerald-500/25 px-3 py-1 font-semibold text-emerald-200 hover:bg-emerald-500/35"
                    >
                      {ts.saveAndClose}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setConfirmCloseOpen(false);
                        setEditorFile(null);
                        setEditorFullscreen(false);
                      }}
                      className="rounded-lg bg-rose-500/25 px-3 py-1 font-semibold text-rose-200 hover:bg-rose-500/35"
                    >
                      {ts.discard}
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmCloseOpen(false)}
                      className="rounded-lg bg-white/10 px-3 py-1 text-slate-200 hover:bg-white/20"
                    >
                      {ts.cancel}
                    </button>
                  </div>
                </div>
              )}

              {/* Compact Find & Replace Bar */}
              {findOpen && (
                <div className="flex flex-wrap items-center gap-2 border-b border-white/10 bg-slate-900/90 px-4 py-2 text-xs">
                  <div className="flex items-center gap-1.5">
                    <input
                      ref={findInputRef}
                      type="text"
                      value={findQuery}
                      onChange={(e) => {
                        setFindQuery(e.target.value);
                        setActiveMatchIdx(0);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          jumpToMatch(e.shiftKey ? activeMatchIdx - 1 : activeMatchIdx + 1);
                        }
                      }}
                      placeholder={ts.findPlaceholder}
                      className="w-48 rounded-lg border border-white/15 bg-slate-950 px-2.5 py-1 text-xs text-white outline-none focus:border-cyan-400"
                    />
                    <span dir="ltr" className="min-w-[46px] text-center font-mono text-[11px] text-slate-400">
                      {findQuery
                        ? matchPositions.length > 0
                          ? `${Math.min(activeMatchIdx + 1, matchPositions.length)}/${matchPositions.length}`
                          : '0/0'
                        : ''}
                    </span>
                    <button
                      type="button"
                      disabled={matchPositions.length === 0}
                      onClick={() => jumpToMatch(activeMatchIdx - 1)}
                      className="rounded-md border border-white/10 bg-white/5 p-1 text-slate-300 hover:bg-white/15 disabled:opacity-35"
                    >
                      <ChevronUp className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={matchPositions.length === 0}
                      onClick={() => jumpToMatch(activeMatchIdx + 1)}
                      className="rounded-md border border-white/10 bg-white/5 p-1 text-slate-300 hover:bg-white/15 disabled:opacity-35"
                    >
                      <ChevronDown className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      value={replaceQuery}
                      onChange={(e) => setReplaceQuery(e.target.value)}
                      placeholder={ts.replacePlaceholder}
                      className="w-44 rounded-lg border border-white/15 bg-slate-950 px-2.5 py-1 text-xs text-white outline-none focus:border-cyan-400"
                    />
                    <button
                      type="button"
                      disabled={matchPositions.length === 0}
                      onClick={handleReplaceOne}
                      className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-medium text-slate-200 hover:bg-white/15 disabled:opacity-35"
                    >
                      {ts.replaceOne}
                    </button>
                    <button
                      type="button"
                      disabled={matchPositions.length === 0}
                      onClick={handleReplaceAll}
                      className="rounded-lg border border-cyan-400/25 bg-cyan-500/10 px-2.5 py-1 text-[11px] font-medium text-cyan-200 hover:bg-cyan-500/20 disabled:opacity-35"
                    >
                      {ts.replaceAll}
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => setFindOpen(false)}
                    className="ms-auto rounded-md p-1 text-slate-400 hover:bg-white/10 hover:text-white"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}

              {/* Editor Textarea */}
              <textarea
                ref={textareaRef}
                dir={editorDir}
                spellCheck={false}
                value={editorFile.content}
                style={{ fontSize: `${editorFontSize}px`, lineHeight: 1.6 }}
                onChange={(e) => {
                  updateEditorContent(e.target.value, false);
                  updateCursorFromEl(e.target);
                }}
                onClick={(e) => updateCursorFromEl(e.currentTarget)}
                onKeyUp={(e) => updateCursorFromEl(e.currentTarget)}
                onKeyDown={(e) => {
                  if (e.key === 'Tab') {
                    e.preventDefault();
                    const el = e.currentTarget;
                    const start = el.selectionStart;
                    const end = el.selectionEnd;
                    const next = editorFile.content.slice(0, start) + '  ' + editorFile.content.slice(end);
                    updateEditorContent(next, true);
                    requestAnimationFrame(() => {
                      el.selectionStart = el.selectionEnd = start + 2;
                      updateCursorFromEl(el);
                    });
                  }
                }}
                wrap={wordWrap ? 'soft' : 'off'}
                className="min-h-0 flex-1 resize-none bg-[#060911] p-5 font-mono text-slate-100 outline-none"
              />

              {/* Editor Footer */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/10 bg-slate-950/95 px-4 py-2 text-[11px] text-slate-500">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded-md border border-emerald-400/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-300">
                    <ShieldCheck className="h-3 w-3" />
                    {ts.atomicBadge}
                  </span>
                  <span className="hidden md:inline">{ts.editorHint}</span>
                </div>
                <div dir="ltr" className="flex items-center gap-3 font-mono text-slate-400">
                  <span>Ln {cursorPos.ln}, Col {cursorPos.col}</span>
                  <span>{editorLineCount} {ts.lines}</span>
                  <span>UTF-8 · {formatBytes(new Blob([editorFile.content]).size)}</span>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}