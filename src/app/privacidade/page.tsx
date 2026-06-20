import { LegalLayout } from "@/components/legal/legal-layout";

export default function PrivacidadePage() {
  return (
    <LegalLayout title="Política de Privacidade">
      <p className="text-xs text-slate-500 mb-6">Última atualização: junho de 2026</p>

      <h2 className="text-lg font-bold text-norte-ink mt-0">1. Quem somos</h2>
      <p className="text-sm text-slate-600 leading-relaxed">
        O <strong>Norte</strong> é um aplicativo de aprendizado de inglês. Esta política descreve
        como tratamos seus dados pessoais em conformidade com a LGPD (Lei nº 13.709/2018).
      </p>

      <h2 className="text-lg font-bold text-norte-ink">2. Dados que coletamos</h2>
      <ul className="text-sm text-slate-600 space-y-1 list-disc pl-5">
        <li><strong>Cadastro:</strong> nome, email e senha (armazenada com hash criptográfico)</li>
        <li><strong>Aprendizado:</strong> objetivo, nível, progresso, respostas de avaliação</li>
        <li><strong>Chat:</strong> mensagens enviadas ao professor IA</li>
        <li><strong>Preferências:</strong> idioma, metas de prática, fuso horário</li>
        <li><strong>Notificações:</strong> token de push (se você ativar)</li>
        <li><strong>Técnicos:</strong> IP para rate limiting e segurança</li>
      </ul>

      <h2 className="text-lg font-bold text-norte-ink">3. Finalidade</h2>
      <p className="text-sm text-slate-600 leading-relaxed">
        Usamos seus dados para personalizar sua trilha, fornecer o chat com IA, enviar lembretes
        (se autorizado), medir progresso e proteger o serviço contra abuso.
      </p>

      <h2 className="text-lg font-bold text-norte-ink">4. Compartilhamento</h2>
      <p className="text-sm text-slate-600 leading-relaxed">
        Não vendemos seus dados. Compartilhamos apenas com provedores necessários ao serviço
        (hospedagem, banco de dados, IA para chat), sob contratos de proteção de dados.
      </p>

      <h2 className="text-lg font-bold text-norte-ink">5. Seus direitos (LGPD)</h2>
      <p className="text-sm text-slate-600 leading-relaxed">
        Você pode solicitar acesso, correção ou exclusão da conta a qualquer momento em{" "}
        <strong>Perfil → Excluir minha conta</strong>. Também pode revogar notificações push
        nas configurações do dispositivo.
      </p>

      <h2 className="text-lg font-bold text-norte-ink">6. Retenção</h2>
      <p className="text-sm text-slate-600 leading-relaxed">
        Mantemos os dados enquanto sua conta estiver ativa. Após exclusão, removemos seus
        dados pessoais e mensagens de chat do nosso banco de dados.
      </p>

      <h2 className="text-lg font-bold text-norte-ink">7. Contato</h2>
      <p className="text-sm text-slate-600 leading-relaxed">
        Dúvidas sobre privacidade: use o email configurado como responsável do app (VAPID_SUBJECT
        / contato do desenvolvedor).
      </p>
    </LegalLayout>
  );
}
