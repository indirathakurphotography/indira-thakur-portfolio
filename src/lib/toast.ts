type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

type Listener = () => void;

let toasts: Toast[] = [];
let cachedSnapshot: Toast[] = [];
let listeners: Listener[] = [];
let nextId = 0;

function notify() {
  cachedSnapshot = [...toasts];
  listeners.forEach(fn => fn());
}

function add(message: string, type: ToastType, duration = 3500) {
  const id = nextId++;
  toasts = [...toasts, { id, message, type }];
  notify();
  setTimeout(() => {
    toasts = toasts.filter(t => t.id !== id);
    notify();
  }, duration);
}

export const toast = {
  success: (message: string) => add(message, 'success'),
  error: (message: string) => add(message, 'error'),
  info: (message: string) => add(message, 'info'),
  subscribe: (fn: Listener) => {
    listeners.push(fn);
    return () => {
      listeners = listeners.filter(l => l !== fn);
    };
  },
  getSnapshot: () => cachedSnapshot,
};
