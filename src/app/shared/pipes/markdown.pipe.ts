import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { marked, Renderer } from 'marked';

@Pipe({ name: 'markdown', standalone: true })
export class MarkdownPipe implements PipeTransform {
  private renderer = new Renderer();
  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }


  constructor(private sanitizer: DomSanitizer) {
    // 🔗 Liens
    this.renderer.link = ({ href, title, tokens }: any) => {
      const text = this.renderer.parser.parseInline(tokens);
      return `<a href="${href}" target="_blank" rel="noopener noreferrer" title="${title || ''}" class="font-medium underline underline-offset-2 hover:opacity-80 transition-opacity text-[rgb(0,157.53,229)] dark:text-blue-400">${text}</a>`;
    };

    // 📊 Tableau
    this.renderer.table = ({ header, rows }: any) => {
      const headHtml = header.map((cell: any) =>
        `<th class="bg-gray-100 dark:bg-gray-500 text-gray-900 dark:text-white h-10 text-sm text-left px-2 border border-gray-200 dark:border-gray-600 font-semibold">${this.renderer.parser.parseInline(cell.tokens)}</th>`
      ).join('');

      const bodyHtml = rows.map((row: any) =>
        `<tr>${row.map((cell: any) =>
          `<td class="bg-white dark:bg-gray-700 text-gray-900 dark:text-white h-10 border border-gray-200 dark:border-gray-600 px-2">${this.renderer.parser.parseInline(cell.tokens)}</td>`
        ).join('')}</tr>`
      ).join('');

      return `<table class="w-full border-collapse my-2">
        <thead><tr>${headHtml}</tr></thead>
        <tbody>${bodyHtml}</tbody>
      </table>`;
    };

    // 💻 Code inline
    this.renderer.codespan = ({ text }: any) => {
      return `<code class="bg-gray-100 dark:bg-gray-900 text-blue-400 dark:text-blue-400 px-1.5 py-0.5 rounded text-xs">${this.escapeHtml(text)}</code>`;
    };

    // 📦 Bloc de code
    this.renderer.code = ({ text, lang }: any) => {
      return `<pre class="bg-gray-900 dark:bg-black text-gray-100 p-3 rounded-lg overflow-x-auto my-2"><code>${this.escapeHtml(text)}</code></pre>`;
    };
    // 💬 Citation
    this.renderer.blockquote = ({ tokens }: any) => {
      const text = this.renderer.parser.parse(tokens);
      return `<blockquote class="bg-gray-100 dark:bg-gray-800 border-l-4 border-gray-300 dark:border-gray-600 pl-4 py-1 italic text-gray-600 dark:text-gray-300 my-2">${text}</blockquote>`;
    };

    // 📌 Titres (h1 → h6)
    this.renderer.heading = ({ tokens, depth }: any) => {
      const text = this.renderer.parser.parseInline(tokens);
      const sizes: Record<number, string> = {
        1: 'text-2xl font-bold mt-4 mb-2 text-gray-900 dark:text-white',
        2: 'text-xl font-bold mt-3 mb-2 text-gray-900 dark:text-white',
        3: 'text-lg font-semibold mt-3 mb-1 text-gray-900 dark:text-white',
        4: 'text-base font-semibold mt-2 mb-1 text-gray-900 dark:text-white',
        5: 'text-sm font-semibold mt-2 mb-1 text-gray-900 dark:text-white',
        6: 'text-xs font-semibold mt-2 mb-1 text-gray-900 dark:text-white',
      };
      return `<h${depth} class="${sizes[depth]}">${text}</h${depth}>`;
    };

    // 📄 Paragraphe
    this.renderer.paragraph = ({ tokens }: any) => {
      const text = this.renderer.parser.parseInline(tokens);
      return `<p class="mb-2 text-gray-800 dark:text-gray-200">${text}</p>`;
    };

    // 📝 Liste
    this.renderer.list = ({ items, ordered }: any) => {
      const tag = ordered ? 'ol' : 'ul';
      const listClass = ordered ? 'list-decimal' : 'list-disc';
      const itemsHtml = items.map((item: any) => {
        const text = this.renderer.parser.parse(item.tokens);
        return `<li class="ml-2">${text}</li>`;
      }).join('');
      return `<${tag} class="${listClass} pl-5 mb-2 ml-4 text-gray-800 dark:text-gray-200 space-y-1">${itemsHtml}</${tag}>`;
    };

    // 💪 Gras
    this.renderer.strong = ({ tokens }: any) => {
      const text = this.renderer.parser.parseInline(tokens);
      return `<strong class="font-bold text-gray-900 dark:text-white">${text}</strong>`;
    };

    // 🔤 Italique
    this.renderer.em = ({ tokens }: any) => {
      const text = this.renderer.parser.parseInline(tokens);
      return `<em class="italic">${text}</em>`;
    };

    // ➖ Ligne horizontale
    this.renderer.hr = () => {
      return `<hr class="border-gray-300 dark:border-gray-600 my-3"/>`;
    };
  }

  transform(value: string) {
    if (!value) return '';

    const html = marked.parse(value, {
      async: false,
      renderer: this.renderer as any
    }) as string;

    return this.sanitizer.bypassSecurityTrustHtml(html);
  }
}
