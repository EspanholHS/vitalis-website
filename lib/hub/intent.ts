import { containsAny, hasTokenLike, isAffirmative, isNegative, normalizeHubText } from './normalization';
import type { HubIntent } from './types';

const CANCEL_PHRASES = ['cancelar', 'cancela', 'sair', 'esquece', 'deixa pra la', 'parar', 'comecar de novo', 'reiniciar'];
const GREETINGS = ['oi', 'ola', 'bom dia', 'boa tarde', 'boa noite', 'tudo bem', 'e ai', 'hey', 'opa'];
const CAPABILITIES = ['o que voce pode fazer', 'o que voce consegue fazer', 'o que vc consegue fazer', 'o que voce faz', 'o que vc faz', 'o que voce sabe fazer', 'como voce pode me ajudar', 'em que voce pode me ajudar', 'quais sao suas funcoes', 'qual a sua funcao', 'para que voce serve', 'voce serve pra que', 'o que da para fazer', 'quais comandos', 'quais tarefas', 'me ajuda com o que', 'preciso de ajuda', 'me orienta'];
const IDENTITY = ['quem e voce', 'qual seu nome', 'como voce se chama', 'voce e uma ia', 'voce e humano', 'voce e um robo', 'o que voce e'];
const HOW_IT_WORKS = ['como funciona o hub', 'como voce funciona', 'como voce responde', 'de onde vem suas respostas', 'voce usa ia', 'como o hub funciona'];
const GRATITUDE = ['obrigado', 'obrigada', 'valeu', 'agradeco', 'ajudou muito', 'perfeito', 'era isso'];
const EMERGENCY = ['falta de ar', 'dificuldade para respirar', 'dor no peito', 'desmaio', 'convulsao', 'reacao grave', 'inchaco no rosto', 'nao consigo respirar'];
const CLINICAL = ['posso parar', 'devo parar', 'mudar a dose', 'alterar a dose', 'aumentar a dose', 'diminuir a dose', 'e seguro', 'faz mal', 'efeito colateral', 'interacao', 'contraindicacao', 'posso tomar junto', 'estou gravida'];

export function identifyHubIntent(message: string): HubIntent {
  const normalized = normalizeHubText(message);

  if (containsAny(normalized, EMERGENCY)) return 'emergency';
  if (containsAny(normalized, CLINICAL)) return 'clinical_safety';
  if (containsAny(normalized, CANCEL_PHRASES)) return 'cancel';
  if (isAffirmative(normalized) || isNegative(normalized)) return 'confirmation';
  if (containsAny(normalized, ['corrigir', 'alterar', 'mudar', 'voltar'])) return 'correction';
  if (GREETINGS.some((greeting) => normalized === greeting || normalized.startsWith(`${greeting} `))) return 'greeting';
  if (containsAny(normalized, IDENTITY)) return 'identity';
  if (containsAny(normalized, HOW_IT_WORKS)) return 'how_it_works';
  if (containsAny(normalized, GRATITUDE)) return 'gratitude';
  if (containsAny(normalized, CAPABILITIES) || (hasTokenLike(normalized, ['ajudar', 'funcoes', 'comandos', 'orientar']) && hasTokenLike(normalized, ['pode', 'quais', 'como', 'preciso']))) return 'capabilities';

  const mentionsMedication = hasTokenLike(normalized, ['medicamento', 'remedio', 'dose', 'toma', 'losartana']);
  const mentionsAdd = hasTokenLike(normalized, ['cadastrar', 'adicionar', 'incluir', 'novo']);
  if (mentionsAdd && hasTokenLike(normalized, ['medicamento', 'remedio', 'novo'])) return 'add_medication';

  const mentionsTaken = containsAny(normalized, ['ja tomei', 'marcar como tomado', 'marque como tomado', 'pode marcar', 'confirmar a dose', 'confirme a dose', 'registrar medicamento tomado', 'registrar toma'])
    || (hasTokenLike(normalized, ['tomei', 'tomado', 'confirmar']) && mentionsMedication);
  if (mentionsTaken) return 'confirm_dose';

  if (containsAny(normalized, ['historico', 'ultimas doses', 'o que eu tomei', 'quais remedios eu ja tomei', 'tive algum esquecimento', 'doses eu perdi'])
    || hasTokenLike(normalized, ['historico', 'esquecimento', 'perdi'])) return 'history';

  if (containsAny(normalized, ['adesao', 'porcentagem', 'como foi minha semana', 'tomando os remedios corretamente', 'esquecendo muitos'])
    || hasTokenLike(normalized, ['adesao', 'porcentagem', 'progresso', 'desempenho'])) return 'adherence';

  if (containsAny(normalized, ['proximo remedio', 'proximo medicamento', 'proxima dose', 'tomar agora', 'vem depois', 'remedio proximo', 'o que preciso tomar'])
    || (hasTokenLike(normalized, ['proximo', 'depois', 'agora']) && mentionsMedication)) return 'next_dose';

  if (containsAny(normalized, ['remedios eu tomo hoje', 'agenda de hoje', 'medicamentos de hoje', 'remedio hoje', 'doses faltam', 'rotina de hoje'])
    || (hasTokenLike(normalized, ['hoje', 'agenda', 'faltam']) && mentionsMedication)) return 'daily_medications';

  if (containsAny(normalized, ['onde fica', 'como abrir', 'ir para', 'abrir a tela', 'navegar'])) return 'navigation';
  if (mentionsMedication && hasTokenLike(normalized, ['ativos', 'listar', 'quais'])) return 'active_medications';
  return 'fallback';
}