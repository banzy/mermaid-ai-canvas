import { useRef } from 'react';
import Editor, { Monaco, OnMount } from '@monaco-editor/react';
import { useAppStore } from '@/stores/useAppStore';

type EditorInstance = Parameters<OnMount>[0];

export const MonacoEditor = () => {
  const { editor: editorState, setCode, setCursorPosition, setErrors } = useAppStore();
  const editorRef = useRef<EditorInstance | null>(null);
  const monacoRef = useRef<Monaco | null>(null);

  const handleEditorMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    // Register Mermaid language
    monaco.languages.register({ id: 'mermaid' });

    // Define Mermaid syntax highlighting
    monaco.languages.setMonarchTokensProvider('mermaid', {
      keywords: [
        'graph', 'flowchart', 'sequenceDiagram', 'classDiagram', 'stateDiagram',
        'erDiagram', 'journey', 'gantt', 'pie', 'gitGraph', 'mindmap', 'timeline',
        'subgraph', 'end', 'participant', 'actor', 'note', 'loop', 'alt', 'opt',
        'par', 'rect', 'activate', 'deactivate', 'title', 'section', 'class',
        'style', 'linkStyle', 'click', 'callback', 'direction', 'TB', 'TD', 'BT',
        'RL', 'LR'
      ],
      operators: ['-->', '---', '-.->',  '==>', '-->|', '---|', '-.->', '.->'],
      tokenizer: {
        root: [
          [/%%.*$/, 'comment'],
          [/[A-Z][A-Z0-9_]*/, 'type.identifier'],
          [/[a-zA-Z_]\w*/, {
            cases: {
              '@keywords': 'keyword',
              '@default': 'identifier'
            }
          }],
          [/"[^"]*"/, 'string'],
          [/'[^']*'/, 'string'],
          [/\[.*?\]/, 'string.bracket'],
          [/\{.*?\}/, 'string.bracket'],
          [/\(.*?\)/, 'string.bracket'],
          [/-->|---|-\.->|==>|-->\||---\||-\.->|\.->/, 'operator'],
          [/[{}()\[\]]/, 'delimiter.bracket'],
          [/[;,]/, 'delimiter'],
          [/#[0-9a-fA-F]{6}/, 'number.hex'],
        ]
      }
    });

    // Define theme
    monaco.editor.defineTheme('mermaid-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'keyword', foreground: '22d3ee', fontStyle: 'bold' },
        { token: 'identifier', foreground: 'e2e8f0' },
        { token: 'type.identifier', foreground: 'a78bfa' },
        { token: 'string', foreground: '86efac' },
        { token: 'string.bracket', foreground: 'fcd34d' },
        { token: 'operator', foreground: 'f472b6' },
        { token: 'comment', foreground: '64748b', fontStyle: 'italic' },
        { token: 'number.hex', foreground: 'fb923c' },
        { token: 'delimiter', foreground: '94a3b8' },
      ],
      colors: {
        'editor.background': '#0f172a',
        'editor.foreground': '#e2e8f0',
        'editor.lineHighlightBackground': '#1e293b',
        'editor.selectionBackground': '#334155',
        'editorCursor.foreground': '#22d3ee',
        'editorLineNumber.foreground': '#475569',
        'editorLineNumber.activeForeground': '#94a3b8',
        'editor.inactiveSelectionBackground': '#1e293b80',
      }
    });

    monaco.editor.setTheme('mermaid-dark');

    // Track cursor position
    editor.onDidChangeCursorPosition((e) => {
      setCursorPosition({
        line: e.position.lineNumber,
        column: e.position.column,
      });
    });
  };

  const handleChange = (value: string | undefined) => {
    if (value !== undefined) {
      setCode(value);
    }
  };

  return (
    <div className="h-full w-full overflow-hidden rounded-lg border border-border bg-card">
      <Editor
        height="100%"
        defaultLanguage="mermaid"
        value={editorState.code}
        onChange={handleChange}
        onMount={handleEditorMount}
        theme="mermaid-dark"
        options={{
          fontSize: 14,
          fontFamily: 'JetBrains Mono, monospace',
          lineHeight: 1.6,
          padding: { top: 16, bottom: 16 },
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          wordWrap: 'on',
          automaticLayout: true,
          tabSize: 2,
          renderLineHighlight: 'all',
          cursorBlinking: 'smooth',
          cursorSmoothCaretAnimation: 'on',
          smoothScrolling: true,
          bracketPairColorization: { enabled: true },
          guides: {
            bracketPairs: true,
            indentation: true,
          },
        }}
        loading={
          <div className="flex h-full items-center justify-center">
            <div className="animate-shimmer h-8 w-32 rounded-md" />
          </div>
        }
      />
    </div>
  );
};
