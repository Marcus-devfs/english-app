import { LegalLayout } from "@/components/legal/legal-layout";

export default function TermosPage() {
  return (
    <LegalLayout title="Termos de Uso">
      <p className="text-xs text-slate-500 mb-6">Última atualização: junho de 2026</p>

      <h2 className="text-lg font-bold text-norte-ink mt-0">1. Aceitação</h2>
      <p className="text-sm text-slate-600 leading-relaxed">
        Ao criar uma conta no Norte, você concorda com estes Termos de Uso e com nossa
        Política de Privacidade.
      </p>

      <h2 className="text-lg font-bold text-norte-ink">2. Serviço</h2>
      <p className="text-sm text-slate-600 leading-relaxed">
        O Norte oferece trilha de estudos, avaliação de nível, lições, quiz e conversação com
        professor IA. O serviço é fornecido &quot;como está&quot;, em evolução contínua (beta).
      </p>

      <h2 className="text-lg font-bold text-norte-ink">3. Conta</h2>
      <ul className="text-sm text-slate-600 space-y-1 list-disc pl-5">
        <li>Você deve fornecer informações verdadeiras no cadastro</li>
        <li>É responsável por manter sua senha em sigilo</li>
        <li>Não use o app para spam, abuso ou tentativas de invasão</li>
        <li>Uma conta por pessoa</li>
      </ul>

      <h2 className="text-lg font-bold text-norte-ink">4. Conteúdo e IA</h2>
      <p className="text-sm text-slate-600 leading-relaxed">
        Respostas do professor IA são orientativas e podem conter imprecisões. O Norte não
        substitui certificação oficial de proficiência (TOEFL, IELTS, etc.) nem garante
        fluência em prazo determinado.
      </p>

      <h2 className="text-lg font-bold text-norte-ink">5. Uso aceitável</h2>
      <p className="text-sm text-slate-600 leading-relaxed">
        É proibido automatizar requests (bots), explorar falhas de segurança, ou usar o chat
        IA para fins ilegais. Contas que violarem estas regras podem ser suspensas.
      </p>

      <h2 className="text-lg font-bold text-norte-ink">6. Encerramento</h2>
      <p className="text-sm text-slate-600 leading-relaxed">
        Você pode excluir sua conta a qualquer momento em Perfil. Podemos encerrar contas
        que violem estes termos.
      </p>

      <h2 className="text-lg font-bold text-norte-ink">7. Alterações</h2>
      <p className="text-sm text-slate-600 leading-relaxed">
        Podemos atualizar estes termos. Mudanças relevantes serão comunicadas no app.
        O uso continuado após alterações implica aceitação.
      </p>
    </LegalLayout>
  );
}
