import type { Locale } from './locale';
import './terminal-demo.css';

/**
 * PROTOTYPE, dev server only (main.ts loads it behind import.meta.env.DEV, so
 * the production build never contains it). A tap-to-run terminal under the
 * glossary: five real commands on the sample folder from the agent window.
 * No free typing on purpose — nothing the visitor does can fail, and it works
 * with a thumb. Content lives here, not in content.ts, until David decides
 * whether it stays (2026-09-11).
 */

type Command = {
  /** What is typed at the prompt. */
  line: string;
  /** Output lines; `fresh` marks the file the conversion added. */
  output: (state: FolderState) => { text: string; fresh?: boolean }[];
  /** What happened, in plain words, under the window. */
  explain: string;
  /** Runs after the output, to change the folder. */
  effect?: (state: FolderState) => void;
};

type FolderState = { converted: boolean; clearLog: boolean };

type DemoCopy = {
  eyebrow: string;
  badge: string;
  title: string;
  lead: string;
  path: string;
  pick: string;
  idle: string;
  note: string;
  commands: Command[];
};

const FILES = ['AGENTS.md', 'gastos-agosto.csv', 'gastos-julio.csv', 'gastos-septiembre.csv', 'resumen-t3.md'];

function listing(state: FolderState) {
  const files = FILES.map((text) => ({ text }));
  return state.converted ? [...files, { text: 'resumen-t3.docx', fresh: true }] : files;
}

const COPY: Record<Locale, DemoCopy> = {
  es: {
    eyebrow: 'Pruébalo',
    badge: 'Prototipo · no se publica',
    title: 'Así se ve la terminal',
    lead: 'Toca un comando. Son los mismos que usa el agente, sobre la carpeta de ejemplo de arriba.',
    path: '~/Documentos/gastos-trimestre',
    pick: 'Toca un comando',
    idle: 'Empieza por ls: es lo primero que hace un agente al llegar a una carpeta.',
    note: 'Corre en tu navegador, sobre una carpeta de ejemplo. No toca tu computadora.',
    commands: [
      {
        line: 'ls',
        output: listing,
        explain: 'ls lista lo que hay en la carpeta. Es el primer paso de casi cualquier tarea: mirar con qué se cuenta.'
      },
      {
        line: 'head -3 gastos-julio.csv',
        output: () => [
          { text: 'fecha,categoría,monto' },
          { text: '2026-07-02,Transporte,38' },
          { text: '2026-07-03,Materiales,21' }
        ],
        explain: 'head muestra las primeras líneas de un archivo sin abrirlo. Así el agente entiende cómo está armada la hoja antes de tocarla.'
      },
      {
        line: 'cat AGENTS.md',
        output: () => [
          { text: '# Cómo trabajo aquí' },
          { text: '- Escribe en español, directo.' },
          { text: '- Montos en dólares, sin decimales.' },
          { text: '- Nunca borres un archivo: si sobra, avísame.' }
        ],
        explain: 'cat muestra un archivo completo. Este es el de instrucciones: el agente lo lee antes de empezar cada tarea.'
      },
      {
        line: 'pandoc resumen-t3.md -o resumen-t3.docx',
        output: () => [],
        explain: 'pandoc convierte el borrador en Markdown a un Word. Cuando todo sale bien no dice nada: toca ls otra vez y verás el archivo nuevo.',
        effect: (state) => {
          state.converted = true;
        }
      },
      {
        line: 'clear',
        output: () => [],
        explain: 'clear limpia la pantalla. Los archivos siguen ahí.',
        effect: (state) => {
          state.clearLog = true;
        }
      }
    ]
  },
  en: {
    eyebrow: 'Try it',
    badge: 'Prototype · not published',
    title: 'This is what the terminal looks like',
    lead: 'Tap a command. They are the ones the agent uses, on the sample folder above.',
    path: '~/Documents/quarterly-expenses',
    pick: 'Tap a command',
    idle: 'Start with ls: it is the first thing an agent does in a new folder.',
    note: 'It runs in your browser, on a sample folder. It does not touch your computer.',
    commands: [
      {
        line: 'ls',
        output: listing,
        explain: 'ls lists what is in the folder. It is the first step of almost any task: see what there is to work with.'
      },
      {
        line: 'head -3 gastos-julio.csv',
        output: () => [
          { text: 'fecha,categoría,monto' },
          { text: '2026-07-02,Transporte,38' },
          { text: '2026-07-03,Materiales,21' }
        ],
        explain: 'head shows the first lines of a file without opening it. That is how the agent learns the shape of a sheet before touching it.'
      },
      {
        line: 'cat AGENTS.md',
        output: () => [
          { text: '# How I work here' },
          { text: '- Write in Spanish, plainly.' },
          { text: '- Amounts in dollars, no decimals.' },
          { text: '- Never delete a file: if one is spare, tell me.' }
        ],
        explain: 'cat shows a whole file. This one holds the instructions: the agent reads it before every task.'
      },
      {
        line: 'pandoc resumen-t3.md -o resumen-t3.docx',
        output: () => [],
        explain: 'pandoc turns the Markdown draft into a Word file. When it works it says nothing: tap ls again and you will see the new file.',
        effect: (state) => {
          state.converted = true;
        }
      },
      {
        line: 'clear',
        output: () => [],
        explain: 'clear wipes the screen. The files are still there.',
        effect: (state) => {
          state.clearLog = true;
        }
      }
    ]
  }
};

const wait = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));

function el<K extends keyof HTMLElementTagNameMap>(tag: K, className: string, text?: string) {
  const node = document.createElement(tag);
  node.className = className;
  if (text !== undefined) {
    node.textContent = text;
  }
  return node;
}

/** Mounts the demo after the glossary grid. Safe to call after every render. */
export function mountTerminalDemo(root: HTMLElement, locale: Locale, animate: boolean): void {
  const grid = root.querySelector('#glosario .gl-grid');
  if (!grid || root.querySelector('.td')) {
    return;
  }

  const text = COPY[locale];
  const state: FolderState = { converted: false, clearLog: false };
  let busy = false;

  const block = el('div', 'td');
  const head = el('div', 'td-head');
  const eyebrow = el('p', 'eyebrow', text.eyebrow);
  eyebrow.append(' ', el('span', 'td-badge', text.badge));
  head.append(eyebrow, el('h3', 'td-title', text.title), el('p', 'td-lead', text.lead));

  const win = el('div', 'td-window');
  const bar = el('div', 'td-bar');
  bar.append(el('span', 'td-dots'), el('span', 'td-path', text.path));
  const log = el('div', 'td-log');
  log.setAttribute('role', 'log');
  const cursorLine = el('div', 'td-line td-line--prompt');
  const cursorPrompt = el('span', 'td-sigil', '$');
  const typed = el('span', 'td-typed');
  cursorLine.append(cursorPrompt, typed, el('span', 'td-cursor'));
  log.append(cursorLine);
  win.append(bar, log);

  const picker = el('div', 'td-picker');
  picker.setAttribute('role', 'group');
  picker.setAttribute('aria-label', text.pick);
  const explain = el('p', 'td-explain', text.idle);
  explain.setAttribute('aria-live', 'polite');

  const run = async (command: Command, button: HTMLButtonElement) => {
    if (busy) {
      return;
    }
    busy = true;
    picker.querySelectorAll('button').forEach((b) => (b.disabled = true));
    button.classList.add('is-used');

    if (animate) {
      for (const char of command.line) {
        typed.textContent += char;
        await wait(24 + Math.random() * 30);
      }
      await wait(160);
    }

    typed.textContent = '';
    command.effect?.(state);

    if (state.clearLog) {
      state.clearLog = false;
      log.querySelectorAll('.td-line:not(.td-line--prompt)').forEach((line) => line.remove());
    } else {
      const entry = el('div', 'td-line');
      entry.append(el('span', 'td-sigil', '$'), document.createTextNode(command.line));
      cursorLine.before(entry);
      for (const out of command.output(state)) {
        cursorLine.before(el('div', `td-line td-out${out.fresh ? ' is-fresh' : ''}`, out.text));
      }
    }

    log.scrollTop = log.scrollHeight;
    explain.textContent = command.explain;
    picker.querySelectorAll('button').forEach((b) => (b.disabled = false));
    busy = false;
  };

  for (const command of text.commands) {
    const button = el('button', 'td-chip', command.line) as HTMLButtonElement;
    button.type = 'button';
    button.addEventListener('click', () => void run(command, button));
    picker.append(button);
  }

  block.append(head, win, picker, explain, el('p', 'td-note', text.note));
  grid.after(block);
}
