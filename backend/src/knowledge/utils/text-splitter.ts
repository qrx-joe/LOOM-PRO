export interface TextSplitterOptions {
  chunkSize: number;
  chunkOverlap: number;
  separators?: string[];
  strategy?: 'fixed' | 'semantic' | 'recursive';
}

export interface ChunkResult {
  content: string;
  metadata: { startIndex: number; endIndex: number };
}

/**
 * 增强版文本分块器
 * 支持三种分块策略：
 * - fixed: 固定大小分块
 * - semantic: 语义分块（按段落，保留语义完整性）
 * - recursive: 递归分块（支持中文标点）
 */
export class RecursiveCharacterTextSplitter {
  private chunkSize: number;
  private chunkOverlap: number;
  private separators: string[];
  private strategy: 'fixed' | 'semantic' | 'recursive';

  constructor(options: Partial<TextSplitterOptions> = {}) {
    this.chunkSize = options.chunkSize ?? 500;
    this.chunkOverlap = options.chunkOverlap ?? 50;
    this.strategy = options.strategy ?? 'recursive';
    this.separators = options.separators ?? ['\n\n', '\n', '。', '.', '！', '!', '？', '?', '；', ';', ' ', ''];

    if (this.chunkOverlap >= this.chunkSize) {
      throw new Error(`chunkOverlap (${this.chunkOverlap}) must be less than chunkSize (${this.chunkSize})`);
    }
  }

  splitText(text: string): string[] {
    switch (this.strategy) {
      case 'fixed':
        return this.fixedChunk(text);
      case 'semantic':
        return this.semanticChunk(text).map(c => c.content);
      case 'recursive':
      default:
        return this.recursiveChunk(text).map(c => c.content);
    }
  }

  /**
   * 固定大小分块
   */
  private fixedChunk(text: string): string[] {
    const chunks: string[] = [];
    let start = 0;

    while (start < text.length) {
      const end = Math.min(start + this.chunkSize, text.length);
      chunks.push(text.slice(start, end));
      start = end - this.chunkOverlap;
      if (start >= text.length - this.chunkOverlap) break;
    }

    return chunks;
  }

  /**
   * 语义分块 - 按段落分割，保留语义完整性
   * 来源：LOOM chunking.service.ts semanticChunk
   */
  private semanticChunk(text: string): ChunkResult[] {
    const paragraphs = text.split(/\n\n+/).filter(p => p.trim().length > 0);
    const chunks: ChunkResult[] = [];
    let currentChunk = '';
    let currentStart = 0;
    let position = 0;

    for (const para of paragraphs) {
      const paraStart = text.indexOf(para, position);

      if (currentChunk.length + para.length + 1 <= this.chunkSize) {
        currentChunk += (currentChunk ? '\n\n' : '') + para;
      } else {
        if (currentChunk) {
          chunks.push({
            content: currentChunk,
            metadata: { startIndex: currentStart, endIndex: currentStart + currentChunk.length },
          });

          if (this.chunkOverlap > 0 && currentChunk.length > this.chunkOverlap) {
            const overlapText = currentChunk.slice(-this.chunkOverlap);
            currentChunk = overlapText + '\n\n' + para;
            currentStart = Math.max(0, paraStart - this.chunkOverlap);
          } else {
            currentChunk = para;
            currentStart = paraStart;
          }
        } else {
          const subChunks = this.splitLongParagraph(para);
          for (const sub of subChunks) {
            const subStart = text.indexOf(sub.content, paraStart) || paraStart;
            chunks.push({
              content: sub.content,
              metadata: { startIndex: subStart, endIndex: subStart + sub.content.length },
            });
          }
          currentChunk = '';
        }
      }
      position = paraStart + para.length;
    }

    if (currentChunk) {
      chunks.push({
        content: currentChunk,
        metadata: { startIndex: currentStart, endIndex: currentStart + currentChunk.length },
      });
    }

    return chunks.length > 0
      ? chunks
      : [{ content: text.slice(0, this.chunkSize), metadata: { startIndex: 0, endIndex: Math.min(this.chunkSize, text.length) } }];
  }

  /**
   * 递归分块 - 使用多级分隔符（支持中文标点）
   * 来源：LOOM chunking.service.ts recursiveChunk
   */
  private recursiveChunk(text: string): ChunkResult[] {
    const separators = this.separators;

    const splitBySeparator = (t: string, sep: string): string[] => {
      if (sep === '') return t.split('');
      return t.split(sep).filter(s => s.trim().length > 0).map(s => (sep === ' ' ? s : s + sep));
    };

    const chunkRecursive = (t: string, sepIndex: number): ChunkResult[] => {
      if (t.length <= this.chunkSize) {
        return [{ content: t, metadata: { startIndex: 0, endIndex: t.length } }];
      }

      const separator = separators[sepIndex];
      if (!separator) {
        return this.fixedChunk(t).map((content, i) => ({
          content,
          metadata: { startIndex: i * (this.chunkSize - this.chunkOverlap), endIndex: (i + 1) * (this.chunkSize - this.chunkOverlap) },
        }));
      }

      const parts = splitBySeparator(t, separator);
      const chunks: ChunkResult[] = [];
      let current = '';
      let currentStart = 0;

      for (const part of parts) {
        if (current.length + part.length <= this.chunkSize) {
          current += part;
        } else {
          if (current) {
            chunks.push({
              content: current,
              metadata: { startIndex: currentStart, endIndex: currentStart + current.length },
            });
            currentStart += current.length - this.chunkOverlap;
          }

          if (part.length > this.chunkSize) {
            const subChunks = chunkRecursive(part, sepIndex + 1);
            chunks.push(
              ...subChunks.map(c => ({
                ...c,
                metadata: {
                  startIndex: currentStart + c.metadata.startIndex,
                  endIndex: currentStart + c.metadata.endIndex,
                },
              })),
            );
            current = '';
          } else {
            current = part;
          }
        }
      }

      if (current) {
        chunks.push({
          content: current,
          metadata: { startIndex: currentStart, endIndex: currentStart + current.length },
        });
      }

      return chunks;
    };

    return chunkRecursive(text, 0);
  }

  /**
   * 分割长段落
   */
  private splitLongParagraph(para: string): ChunkResult[] {
    const sentences = para.split(/(?<=[。！？.!?])/);
    const chunks: ChunkResult[] = [];
    let current = '';

    for (const sentence of sentences) {
      if (current.length + sentence.length <= this.chunkSize) {
        current += sentence;
      } else {
        if (current) {
          chunks.push({ content: current, metadata: { startIndex: 0, endIndex: current.length } });
        }
        current = sentence;
      }
    }
    if (current) {
      chunks.push({ content: current, metadata: { startIndex: 0, endIndex: current.length } });
    }

    return chunks;
  }

  // 兼容旧 API
  splitOriginal(text: string): string[] {
    return this.recursiveChunk(text).map(c => c.content);
  }
}
