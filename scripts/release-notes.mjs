// Build release notes from the commits between the previous tag and the given tag.
// Usage: node scripts/release-notes.mjs v1.3.0 > release-notes.md
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

const SECTIONS = [
  ['feat', '✨ feat'],
  ['fix', '🐛 fix'],
  ['perf', '⚡ perf'],
  ['refactor', '♻️ refactor'],
  ['docs', '📝 docs'],
  ['other', '🔧 other']
];
const CONVENTIONAL_SUBJECT = /^(\w+)(?:\(([^)]+)\))?(!)?:\s*(.+)$/;
const TRAILER_LINE = /^(co-authored-by|signed-off-by):/i;
const FIELD_SEPARATOR = '\x1f';
const RECORD_SEPARATOR = '\x1e';

/**
 * @param {{ hash: string, subject: string, body: string }[]} commits - Newest first, as git log prints them
 * @returns {string} Markdown release notes
 */
export function formatReleaseNotes(commits) {
  const groups = new Map(SECTIONS.map(([type]) => [type, []]));

  for (const commit of [...commits].reverse()) {
    const match = commit.subject.match(CONVENTIONAL_SUBJECT);
    const [type, scope, breaking, summary] = match
      ? [match[1].toLowerCase(), match[2], Boolean(match[3]), match[4]]
      : ['other', null, false, commit.subject];

    // The version bump commit says nothing useful to users
    if (type === 'chore' && scope === 'release') {
      continue;
    }

    const prefix = `${breaking ? '**BREAKING** ' : ''}${scope ? `**${scope}:** ` : ''}`;
    const lines = [`- ${prefix}${summary} (${commit.hash.slice(0, 7)})`];
    const body = commit.body
      .split('\n')
      .filter((line) => !TRAILER_LINE.test(line.trim()))
      .join('\n')
      .trim();
    if (body) {
      lines.push('', ...body.split('\n').map((line) => (line ? `  ${line}` : '')), '');
    }

    (groups.get(type) ?? groups.get('other')).push(lines.join('\n'));
  }

  const sections = SECTIONS
    .filter(([type]) => groups.get(type).length > 0)
    .map(([type, title]) => `## ${title}\n\n${groups.get(type).join('\n')}`);

  return sections.length > 0 ? `${sections.join('\n\n')}\n` : '';
}

function git(...args) {
  return execFileSync('git', args, { encoding: 'utf8' });
}

function getPreviousTag(tag) {
  try {
    return git('describe', '--tags', '--abbrev=0', `${tag}^`).trim();
  } catch {
    return null; // First release: use the whole history
  }
}

function readCommits(tag) {
  const previousTag = getPreviousTag(tag);
  const range = previousTag ? `${previousTag}..${tag}` : tag;
  const output = git(
    'log',
    '--no-merges',
    `--format=%H${FIELD_SEPARATOR}%s${FIELD_SEPARATOR}%b${RECORD_SEPARATOR}`,
    range
  );

  return output
    .split(RECORD_SEPARATOR)
    .map((record) => record.trim())
    .filter(Boolean)
    .map((record) => {
      const [hash, subject, body = ''] = record.split(FIELD_SEPARATOR);
      return { hash, subject, body };
    });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const tag = process.argv[2];
  if (!tag) {
    throw new Error('Usage: node scripts/release-notes.mjs <tag>');
  }
  process.stdout.write(formatReleaseNotes(readCommits(tag)));
}
