const fs = require('fs');

let content = fs.readFileSync('src/components/SurveyInput.tsx', 'utf8');

// Replace the entire question auto-detection block with a smarter version
const OLD_DETECTION = `        } else {
          for (let i = 1; i <= 15; i++) {
            const found = cols.find(c => 
              c.toLowerCase().includes(\`item \${i}\`) || 
              c.toLowerCase().includes(\`q\${i}\`) ||
              c.toLowerCase().includes(\`pergunta \${i}\`)
            );
            if (found) initialMapping[i.toString()] = found;
          }`;

const NEW_DETECTION = `        } else {
          // ── SMART QUESTION DETECTION ──
          // Patterns to EXCLUDE (non-question columns)
          const EXCLUDE_PATTERNS = [
            'nome', 'name', 'email', 'cpf', 'matrícula', 'matricula',
            'data', 'date', 'timestamp', 'hora', 'time',
            'setor', 'departamento', 'área', 'area', 'unidade', 'local',
            'cargo', 'função', 'funcao', 'equipe', 'turno', 'ges', 'ghe',
            'filial', 'loja', 'regional', 'empresa', 'cnpj', 'id',
            'grupo', 'divisão', 'divisao', 'posto', 'célula', 'celula'
          ];
          
          // Columns that are likely questions: numeric (1..15), q1..q15, pergunta 1..15, item 1..15
          // OR any remaining column with numeric 1-5 values
          const isLikelyQuestion = (col: string) => {
            const lower = col.toLowerCase().trim();
            // Exclude known non-question columns
            if (EXCLUDE_PATTERNS.some(p => lower.includes(p))) return false;
            // Match patterns: "1", "01", "Q1", "q1", "Item 1", "Pergunta 1", "P1", "1."
            if (/^\\d{1,2}\\.?$/.test(lower)) return true; // pure number
            if (/^(q|p|item|pergunta|questão|questao)\\s*\\d{1,2}$/i.test(lower)) return true;
            return false;
          };

          // First pass: try pattern matching
          const patternMapped: string[] = [];
          for (let i = 1; i <= 15; i++) {
            const found = cols.find(c => {
              const lower = c.toLowerCase().trim();
              if (patternMapped.includes(c)) return false;
              return (
                lower === i.toString() ||
                lower === String(i).padStart(2,'0') ||
                lower === \`q\${i}\` ||
                lower === \`p\${i}\` ||
                lower.includes(\`item \${i}\`) ||
                lower.includes(\`item\${i}\`) ||
                lower.includes(\`pergunta \${i}\`) ||
                lower.includes(\`pergunta\${i}\`) ||
                lower.includes(\`questão \${i}\`) ||
                lower.includes(\`questao \${i}\`) ||
                lower === \`\${i}.\`
              );
            });
            if (found) {
              initialMapping[i.toString()] = found;
              patternMapped.push(found);
            }
          }
          
          // Second pass: if fewer than 10 questions found, use heuristic
          // Identify numeric 1-5 valued columns (likely Likert scale)
          const mappedCount = Object.keys(initialMapping).filter(k => !isNaN(Number(k))).length;
          if (mappedCount < 10 && rawData.length > 0) {
            console.log('[ConexaRP] Pattern match found only', mappedCount, 'questions. Trying heuristic...');
            const alreadyMapped = new Set(Object.values(initialMapping));
            const numericCols = cols.filter(col => {
              if (alreadyMapped.has(col)) return false;
              const lower = col.toLowerCase().trim();
              if (EXCLUDE_PATTERNS.some(p => lower.includes(p))) return false;
              // Check if majority of values are 1-5
              let numericCount = 0;
              let total = 0;
              rawData.slice(0, 20).forEach((row: any) => {
                const v = row[col];
                if (v !== undefined && v !== null && v !== '') {
                  total++;
                  const n = parseFloat(String(v).replace(/[^0-9.]/g,''));
                  if (!isNaN(n) && n >= 1 && n <= 5) numericCount++;
                }
              });
              return total > 0 && numericCount / total >= 0.6;
            });
            console.log('[ConexaRP] Heuristic found Likert columns:', numericCols);
            let qIdx = 1;
            for (const col of numericCols) {
              if (qIdx > 15) break;
              if (!initialMapping[qIdx.toString()]) {
                initialMapping[qIdx.toString()] = col;
              }
              qIdx++;
            }
          }
          console.log('[ConexaRP] Final question mapping:', Object.fromEntries(
            Object.entries(initialMapping).filter(([k]) => !isNaN(Number(k)))
          ));`;

if (content.includes(OLD_DETECTION)) {
  content = content.replace(OLD_DETECTION, NEW_DETECTION);
  console.log('✅ Smart question detection applied');
} else {
  console.warn('⚠ Detection pattern not found - searching for fallback...');
  // Try to find what's actually there
  const idx = content.indexOf('for (let i = 1; i <= 15; i++)');
  if (idx !== -1) {
    console.log('Found loop at index', idx);
    console.log('Context:', content.substring(idx - 50, idx + 300));
  }
}

fs.writeFileSync('src/components/SurveyInput.tsx', content, 'utf8');
console.log('\n🎉 Smart detection complete');
