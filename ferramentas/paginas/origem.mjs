// Registro de onde veio o conteúdo do último build (gravado por gerar.mjs, lido por ferramentas/pacote/pacote.mjs).
// Fica em dist-ssr: não vai para o servidor e some quando o build é refeito.
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
export const ORIGEM = path.join(RAIZ, 'dist-ssr', 'origem-do-conteudo.json');
