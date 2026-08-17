const COLORS: Record<string, string> = {
  info: '\x1b[36m',
  warn: '\x1b[33m',
  error: '\x1b[31m',
  debug: '\x1b[90m',
};

function write(level: string, msg: string, extra?: string): void {
  const color = COLORS[level] ?? '';
  const line = `${new Date().toISOString()} ${color}[${level.toUpperCase()}]\x1b[0m ${msg}${extra ? ' ' + extra : ''}`;
  if (level === 'error') console.error(line);
  else console.log(line);
}

export const log = {
  info: (msg: string, extra?: string) => write('info', msg, extra),
  warn: (msg: string, extra?: string) => write('warn', msg, extra),
  error: (msg: string, extra?: string) => write('error', msg, extra),
  debug: (msg: string, extra?: string) => write('debug', msg, extra),
};
