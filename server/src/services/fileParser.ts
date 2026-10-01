import mammoth from 'mammoth';

export async function parseFileToHtml(
  buffer: Buffer,
  filename: string,
  mimetype: string
): Promise<{ title: string; html: string }> {
  const ext = filename.split('.').pop()?.toLowerCase() || '';

  // Extract base title from filename (remove extension)
  const title = filename.substring(0, filename.lastIndexOf('.')) || filename;

  if (ext === 'docx' || mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    const result = await mammoth.convertToHtml({ buffer });
    return {
      title,
      html: result.value || '<p></p>',
    };
  }

  if (ext === 'txt' || mimetype === 'text/plain') {
    const text = buffer.toString('utf-8');
    const html = text
      .split(/\r?\n\r?\n/)
      .map((para) => `<p>${escapeHtml(para.trim()).replace(/\r?\n/g, '<br/>')}</p>`)
      .join('');
    return {
      title,
      html: html || '<p></p>',
    };
  }

  if (ext === 'md' || mimetype === 'text/markdown' || mimetype === 'text/x-markdown') {
    const text = buffer.toString('utf-8');
    const html = parseMarkdownToHtml(text);
    return {
      title,
      html: html || '<p></p>',
    };
  }

  throw new Error(`Unsupported file type: .${ext}. Supported formats are .txt, .md, and .docx`);
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function parseMarkdownToHtml(md: string): string {
  const lines = md.split(/\r?\n/);
  let html = '';
  let inBulletList = false;
  let inOrderedList = false;

  const closeLists = () => {
    if (inBulletList) {
      html += '</ul>';
      inBulletList = false;
    }
    if (inOrderedList) {
      html += '</ol>';
      inOrderedList = false;
    }
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (!line) {
      closeLists();
      continue;
    }

    // Headers
    if (line.startsWith('# ')) {
      closeLists();
      html += `<h1>${parseInlineMarkdown(line.substring(2))}</h1>`;
      continue;
    }
    if (line.startsWith('## ')) {
      closeLists();
      html += `<h2>${parseInlineMarkdown(line.substring(3))}</h2>`;
      continue;
    }
    if (line.startsWith('### ')) {
      closeLists();
      html += `<h3>${parseInlineMarkdown(line.substring(4))}</h3>`;
      continue;
    }

    // Bullet List
    if (line.startsWith('* ') || line.startsWith('- ')) {
      if (inOrderedList) {
        html += '</ol>';
        inOrderedList = false;
      }
      if (!inBulletList) {
        html += '<ul>';
        inBulletList = true;
      }
      html += `<li>${parseInlineMarkdown(line.substring(2))}</li>`;
      continue;
    }

    // Numbered List
    const numListMatch = line.match(/^(\d+)\.\s+(.*)/);
    if (numListMatch) {
      if (inBulletList) {
        html += '</ul>';
        inBulletList = false;
      }
      if (!inOrderedList) {
        html += '<ol>';
        inOrderedList = true;
      }
      html += `<li>${parseInlineMarkdown(numListMatch[2])}</li>`;
      continue;
    }

    // Regular Paragraph
    closeLists();
    html += `<p>${parseInlineMarkdown(line)}</p>`;
  }

  closeLists();
  return html;
}

function parseInlineMarkdown(text: string): string {
  let escaped = escapeHtml(text);
  // Bold **text**
  escaped = escaped.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  // Italic *text* or _text_
  escaped = escaped.replace(/\*(.*?)\*/g, '<em>$1</em>');
  escaped = escaped.replace(/_(.*?)_/g, '<em>$1</em>');
  return escaped;
}
