/**
 * Client-side file text extractor with PDF sanitization and size budgeting
 */
export async function extractTextFromFile(file: File): Promise<{ text: string; isBinaryOrScanned?: boolean; warning?: string }> {
  const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
  const isOfficeDoc = /\.(docx|xlsx|pptx|doc|xls|ppt|odt|zip|rar|tar|gz)$/i.test(file.name);

  if (isOfficeDoc) {
    return {
      text: `[Hujjat: ${file.name} (${file.type || 'Office Fayli'}) - Iltimos, bu fayl ichidagi kerakli matnni nusxalab (copy-paste) yuboring]`,
      isBinaryOrScanned: true,
      warning: `"${file.name}" arxivlangan formatda. Iltimos, uning ichidagi matnni to'g'ridan-to'g'ri nusxalab yuboring.`,
    };
  }

  if (isPdf) {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const uint8 = new Uint8Array(arrayBuffer);
      const decoder = new TextDecoder('latin1');
      const raw = decoder.decode(uint8);

      // Extract text inside PDF text objects (e.g. (Some text) Tj or [(...) 10 (...)] TJ)
      const textMatches: string[] = [];
      const tjRegex = /\(([^)\\]*(?:\\.[^)\\]*)*)\)\s*Tj/g;
      let match: RegExpExecArray | null;
      while ((match = tjRegex.exec(raw)) !== null) {
        if (match[1] && match[1].length > 1) {
          const cleaned = match[1]
            .replace(/\\([()\\])/g, '$1')
            .replace(/\\r|\\n|\\t/g, ' ')
            .trim();
          if (cleaned) textMatches.push(cleaned);
        }
      }

      let extracted = textMatches.join(' ').replace(/\s+/g, ' ').trim();

      // If Tj didn't find enough, try TJ arrays
      if (extracted.length < 50) {
        const tjArrayRegex = /\[([^\]]+)\]\s*TJ/g;
        while ((match = tjArrayRegex.exec(raw)) !== null) {
          const inner = match[1].replace(/\([^)]+\)/g, (str) => {
            textMatches.push(str.slice(1, -1));
            return '';
          });
        }
        extracted = textMatches.join(' ').replace(/\s+/g, ' ').trim();
      }

      // If still empty or scanned image PDF, clean ASCII fallback
      if (extracted.length < 30) {
        const cleanAscii = raw
          .replace(/[^\x20-\x7E\n\r\t\u0400-\u04FF]/g, ' ')
          .replace(/\b(stream|endstream|xref|trailer|obj|endobj|Filter|FlateDecode|Catalog|Pages|Font|MediaBox)\b/gi, '')
          .replace(/\s{2,}/g, ' ')
          .trim();

        if (cleanAscii.length > 50) {
          extracted = cleanAscii;
        }
      }

      if (extracted.length < 30) {
        return {
          text: `[Hujjat: ${file.name} - Skanerlangan tasvir yoki shifrlangan PDF. Iltimos, faylning skrinshotini (rasm holida) yuklang yoki matnidan nusxa oling]`,
          isBinaryOrScanned: true,
          warning: `"${file.name}" faylida o'qiladigan matn topilmadi. Agar u skanerlangan bo'lsa, rasm sifatida yuklang.`,
        };
      }

      // Safe budget max 8,000 characters (~2,000 tokens)
      return { text: extracted.slice(0, 8000) };
    } catch (err) {
      return {
        text: `[Hujjat: ${file.name} - Matnni o'qib bo'lmadi]`,
        isBinaryOrScanned: true,
        warning: `Faylni o'qishda xatolik yuz berdi.`,
      };
    }
  }

  // Plain Text, Markdown, Code, CSV, JSON
  try {
    const text = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsText(file);
    });

    // Strip binary null bytes
    const cleanText = text.replace(/\0/g, '').slice(0, 10000);
    return { text: cleanText };
  } catch (err) {
    return {
      text: `[Fayl: ${file.name} - Matnni o'qishda xato]`,
      isBinaryOrScanned: true,
    };
  }
}
