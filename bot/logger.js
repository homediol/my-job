/**
 * Simple structured logger for the bot.
 *
 * Prefixes each line with a timestamp and module tag so the backend
 * (bot_runner.py) can capture and parse the output easily.
 */

const LOG_LEVELS = { debug: 0, info: 1, warn: 2, error: 3 };

const currentLevel = (process.env.BOT_LOG_LEVEL || 'info').toLowerCase();

function timestamp() {
  const now = new Date();
  return now.toLocaleTimeString('en-US', { hour12: false });
}

function emit(level, tag, message, ...args) {
  if (LOG_LEVELS[level] < LOG_LEVELS[currentLevel]) return;

  const extra = args.length ? ' ' + args.map(a => {
    try { return JSON.stringify(a); } catch { return String(a); }
  }).join(' ') : '';

  const line = `[${timestamp()}] [${tag}] [${level.toUpperCase()}] ${message}${extra}`;
  if (level === 'error') {
    process.stderr.write(line + '\n');
  } else {
    process.stdout.write(line + '\n');
  }
}

export function createLogger(tag) {
  return {
    debug: (msg, ...args) => emit('debug', tag, msg, ...args),
    info:  (msg, ...args) => emit('info',  tag, msg, ...args),
    warn:  (msg, ...args) => emit('warn',  tag, msg, ...args),
    error: (msg, ...args) => emit('error', tag, msg, ...args),
  };
}

