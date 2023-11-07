// FS
export {
  emptyDirSync,
  ensureFileSync,
} from 'https://deno.land/std@0.205.0/fs/mod.ts';

// COLORS
export {
  bgBlue,
  bgBrightBlue,
  bgBrightGreen,
  bgBrightMagenta,
  bgCyan,
  bgGreen,
  bgMagenta,
  bgRed,
  bgYellow,
  black,
  cyan,
  green,
  magenta,
  red,
  yellow,
} from 'https://deno.land/std@0.205.0/fmt/colors.ts';

// CMD PARSING
export { parse } from 'https://deno.land/std@0.205.0/flags/mod.ts';

// HTTP
export { serveFile } from 'https://deno.land/std@0.205.0/http/file_server.ts';
