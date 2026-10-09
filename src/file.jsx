import { CodeBlock, MarkdownText, languageForPath } from '@deepseek-ai/dsh-client-ui-primitives';
import { useCallback, useEffect, useRef, useState } from 'react';

import { writeFile } from './api.js';
import { t } from './i18n.js';
import { FileSkeleton, LoadingAnnounce, fileLoading } from './skeleton.jsx';

/** Extensions rendered as a Markdown document rather than as source. */
const MARKDOWN = new Set(['md', 'markdown', 'mdx']);

/** Extensions the browser can show as a picture, if it can decode them. */
const IMAGE = new Set(['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'avif', 'ico']);

/** Extensions the browser can show as a document, if it has a viewer. */
const DOCUMENT = new Set(['pdf']);

/** How a file's bytes are handed to a `<img>`, and as what type. */
const IMAGE_MIME = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  webp: 'image/webp',
  bmp: 'image/bmp',
  avif: 'image/avif',
  ico: 'image/x-icon',
};

/**
 * The lowercased extension of a repository-relative path.
 * @param {string} path - slash-separated path.
 * @returns {string} the extension without its dot, or an empty string.
 */
export function extensionOf(path) {
  const name = path.slice(path.lastIndexOf('/') + 1);
  const cut = name.lastIndexOf('.');
  return cut <= 0 ? '' : name.slice(cut + 1).toLowerCase();
}

/**
 * Whether one path names a Markdown document.
 * @param {string} path - repository-relative, slash-separated path.
 * @returns {boolean} whether the file renders as Markdown.
 */
export function isMarkdown(path) {
  return MARKDOWN.has(extensionOf(path));
}

/**
 * How one file should be previewed.
 * Everything unrecognized stays source, which is also the fallback for a
 * language with no grammar.
 * @param {string} path - repository-relative, slash-separated path.
 * @returns {'markdown' | 'image' | 'document' | 'source'} the preview kind.
 */
export function previewKind(path) {
  const extension = extensionOf(path);
  if (MARKDOWN.has(extension)) return 'markdown';
  if (IMAGE.has(extension)) return 'image';
  if (DOCUMENT.has(extension)) return 'document';
  return 'source';
}

/**
 * The localized chrome both primitives require.
 * Rebuilt whenever the language changes so the primitives never hold stale labels.
 */
function labels() {
  return { code: { copyLabel: t('action.copy'), copiedLabel: t('action.copied') }, footnotes: t('action.footnotes') };
}

/**
 * One file's complete content, previewed by what it is.
 * The editor is the same content in a plain text field, as a separate mode:
 * a preview that can be typed into is a preview a keystroke can break.
 * @param {object} props - the served file, the wrap choice, and its path.
 * @returns {React.ReactElement} the file, or the refusal that replaces it.
 */
export function FileView({ data, wrap, path }) {
  if (data === undefined) {
    return (
      <>
        <LoadingAnnounce label={fileLoading()} />
        <FileSkeleton />
      </>
    );
  }
  if (data.kind === 'error') return <div className="gv-note error">{data.message}</div>;
  if (data.kind === 'binary') return <div className="gv-note">{t('status.binary')}</div>;
  if (data.kind === 'oversized') return <div className="gv-note">{t('status.oversized')}</div>;

  if (previewKind(path) === 'image') {
    // The Host serves bytes as a data URL so the browser decodes them with the
    // decoder it already has, rather than with one this view guesses.
    return (
      <div className="gv-file gv-image">
        <img src={data.dataUrl} alt={path} />
      </div>
    );
  }
  if (previewKind(path) === 'document') {
    return (
      <div className="gv-file gv-image">
        <object data={data.dataUrl} type="application/pdf" aria-label={path}>
          <div className="gv-note">
            {t('preview.noDocument')}
            <br />
            <a href={data.dataUrl} download={path.split('/').pop()}>
              {t('preview.download')}
            </a>
          </div>
        </object>
      </div>
    );
  }
  if (previewKind(path) === 'markdown') {
    return (
      <div className="gv-file">
        <MarkdownText text={data.text} labels={labels()} />
      </div>
    );
  }
  return (
    <div className="gv-file">
      <CodeBlock
        code={data.text}
        lang={languageForPath(path)}
        lineNumbers
        showHeader={false}
        copyLabel={t('action.copy')}
        copiedLabel={t('action.copied')}
        wrap={wrap}
      />
    </div>
  );
}

/**
 * The same file as an editable field, with a save that cannot lose a race.
 * The buffer starts from what the Host served and the version token comes with
 * it, so a save after the file changed underneath refuses instead of overwriting.
 * @param {object} props - the served file, the path, and the status refresh.
 * @returns {React.ReactElement} the editor.
 */
export function FileEditor({ data, path, sessionId, onSaved }) {
  const [buffer, setBuffer] = useState(data?.text ?? '');
  const [state, setState] = useState('idle');
  const [problem, setProblem] = useState(undefined);
  const area = useRef(undefined);

  // A different file is a different buffer; do not carry the last one's text.
  useEffect(() => {
    setBuffer(data?.text ?? '');
    setProblem(undefined);
    setState('idle');
  }, [data, path]);

  const save = useCallback(async () => {
    if (state === 'saving') return;
    setState('saving');
    setProblem(undefined);
    try {
      const answer = await writeFile(sessionId, path, buffer, data?.version);
      setState('saved');
      onSaved?.(answer);
    } catch (error) {
      setProblem(error.message);
      setState('idle');
    }
  }, [state, sessionId, path, buffer, data?.version, onSaved]);

  const dirty = data !== undefined && buffer !== data.text;

  return (
    <div className="gv-editor">
      <textarea
        ref={area}
        className="gv-input gv-editor-area"
        value={buffer}
        spellCheck={false}
        aria-label={path}
        onChange={event => {
          setBuffer(event.target.value);
          if (state === 'saved') setState('idle');
        }}
        onKeyDown={event => {
          if (event.key === 's' && (event.metaKey || event.ctrlKey)) {
            event.preventDefault();
            save();
          }
        }}
      />
      <div className="gv-editor-bar">
        {dirty ? <span className="gv-dirty">{t('edit.dirty')}</span> : <span className="gv-note-inline">{t('edit.clean')}</span>}
        {problem === undefined ? null : <span className="gv-editor-problem">{problem}</span>}
        <span className="gv-spacer" />
        <span className="gv-editor-hint">{t('edit.hint')}</span>
        <button
          type="button"
          className="gv-btn primary"
          disabled={!dirty || state === 'saving'}
          onClick={save}
        >
          {state === 'saving' ? t('edit.saving') : state === 'saved' ? t('edit.saved') : t('edit.save')}
        </button>
      </div>
    </div>
  );
}
