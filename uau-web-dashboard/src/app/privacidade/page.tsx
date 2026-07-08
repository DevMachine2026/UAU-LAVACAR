import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Política de Privacidade | UAU+ Lavacar",
  description: "Como a UAU+ Lavacar coleta, usa e protege seus dados pessoais."
};

const EMAIL_SUPORTE = "contato@uaulavacar.com.br";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="mb-3 text-lg font-semibold text-uau-black">{title}</h2>
      <div className="space-y-3 text-sm leading-relaxed text-uau-gray">{children}</div>
    </section>
  );
}

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-[#f5f7fa] px-4 py-12">
      <div className="mx-auto max-w-3xl rounded-2xl border border-gray-100 bg-white p-8 shadow-sm sm:p-12">
        <Link href="/" className="text-sm font-medium text-uau-primary hover:underline">
          ← Voltar ao início
        </Link>

        <h1 className="mt-6 mb-1 text-2xl font-bold text-uau-black">Política de Privacidade</h1>
        <p className="mb-8 text-sm text-uau-gray">UAU+ Lavacar — última atualização: julho de 2026</p>

        <Section title="1. Quem somos">
          <p>
            Esta política descreve como a UAU+ Lavacar coleta, usa, armazena e protege os dados
            pessoais dos usuários do aplicativo UAU+ Lavacar e do painel web associado, em
            conformidade com a Lei Geral de Proteção de Dados (LGPD — Lei nº 13.709/2018).
          </p>
        </Section>

        <Section title="2. Dados que coletamos">
          <p>Coletamos os seguintes dados pessoais durante o cadastro e uso do aplicativo:</p>
          <ul className="list-disc space-y-1 pl-5">
            <li><strong>Dados de identificação:</strong> nome completo, e-mail e senha (armazenada de forma criptografada).</li>
            <li><strong>Dados de contato:</strong> telefone.</li>
            <li><strong>Documento:</strong> CPF, utilizado para identificação do cliente e emissão de cobranças.</li>
            <li><strong>Dados de veículo:</strong> placa, marca, modelo, cor e ano do(s) veículo(s) cadastrado(s).</li>
            <li><strong>Dados financeiros:</strong> histórico de cobranças, assinaturas e saldo de carteira, processados através do nosso parceiro de pagamentos (Asaas).</li>
            <li><strong>Dados de reconhecimento de placa (ANPR):</strong> eventos de leitura automática de placas capturados pelas câmeras instaladas nas unidades, utilizados para identificar veículos cadastrados no momento do atendimento.</li>
            <li><strong>Dados de uso:</strong> histórico de lavagens, indicações e notificações recebidas no aplicativo.</li>
          </ul>
          <p>
            As unidades franqueadas (endereço, latitude e longitude) são dados do estabelecimento,
            não do usuário, e são exibidos publicamente para fins de localização.
          </p>
        </Section>

        <Section title="3. Como usamos seus dados">
          <ul className="list-disc space-y-1 pl-5">
            <li>Criar e gerenciar sua conta e assinatura de plano;</li>
            <li>Processar pagamentos e emitir cobranças através do parceiro Asaas;</li>
            <li>Identificar seu veículo automaticamente nas unidades por meio das câmeras ANPR;</li>
            <li>Enviar notificações sobre seu plano, carteira e atendimentos;</li>
            <li>Prevenir fraudes e proteger a segurança da plataforma;</li>
            <li>Cumprir obrigações legais e regulatórias.</li>
          </ul>
        </Section>

        <Section title="4. Compartilhamento de dados">
          <p>
            Compartilhamos dados pessoais somente com prestadores estritamente necessários à
            operação do serviço, como o processador de pagamentos (Asaas) para cobrança de
            assinaturas. Não vendemos dados pessoais a terceiros.
          </p>
        </Section>

        <Section title="5. Armazenamento e segurança">
          <p>
            Os dados são armazenados em infraestrutura com controles de acesso e criptografia de
            senhas. Tokens de acesso ao aplicativo são armazenados de forma segura no dispositivo
            do usuário (armazenamento seguro do sistema operacional).
          </p>
        </Section>

        <Section title="6. Seus direitos (LGPD)">
          <p>Você pode, a qualquer momento, solicitar:</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>Confirmação da existência de tratamento de dados;</li>
            <li>Acesso, correção ou atualização dos seus dados (disponível também na tela de Perfil do aplicativo);</li>
            <li>Eliminação ou anonimização de dados, quando aplicável;</li>
            <li>Portabilidade de dados a outro fornecedor de serviço;</li>
            <li>Revogação do consentimento e exclusão da conta.</li>
          </ul>
          <p>
            Para exercer esses direitos, entre em contato pelo e-mail{" "}
            <a className="font-medium text-uau-primary hover:underline" href={`mailto:${EMAIL_SUPORTE}`}>
              {EMAIL_SUPORTE}
            </a>
            . Veja também nosso{" "}
            <Link href="/suporte" className="font-medium text-uau-primary hover:underline">
              canal de suporte
            </Link>
            .
          </p>
        </Section>

        <Section title="7. Alterações a esta política">
          <p>
            Esta política pode ser atualizada periodicamente. Recomendamos revisá-la com
            frequência. Alterações relevantes serão comunicadas pelo aplicativo.
          </p>
        </Section>
      </div>
    </div>
  );
}
