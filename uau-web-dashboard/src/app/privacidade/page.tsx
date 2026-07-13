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

function SubSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <h3 className="font-medium text-uau-black">{title}</h3>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function InfoTable({ head, rows }: { head: string[]; rows: string[][] }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="w-full min-w-[480px] text-left text-sm">
        <thead className="bg-gray-50">
          <tr>
            {head.map((h) => (
              <th key={h} className="px-3 py-2 font-semibold text-uau-black">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-t border-gray-100">
              {row.map((cell, j) => (
                <td key={j} className="px-3 py-2 align-top text-uau-gray">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
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
        <p className="mb-8 text-sm text-uau-gray">
          UAU+ Lavacar — última atualização: julho de 2026 — versão 6.0
        </p>

        <Section title="1. Quem somos">
          <p>
            A <strong>UAU LAVA CAR SERVICE LTDA</strong>, pessoa jurídica de direito privado,
            inscrita no CNPJ sob o nº <strong>58.192.467/0001-60</strong>, com sede na Av. Eusébio
            de Queiroz, nº 4569, Complemento &quot;A&quot;, bairro Centro, Eusébio-CE, CEP
            61.760-046, e-mail de contato{" "}
            <a className="font-medium text-uau-primary hover:underline" href={`mailto:${EMAIL_SUPORTE}`}>
              {EMAIL_SUPORTE}
            </a>
            , opera o aplicativo <strong>UAU+ Lavacar</strong> e o painel web associado
            (&quot;Plataforma&quot;). Esta Política de Privacidade tem como objetivo assegurar a
            conformidade com a <strong>Lei nº 13.709/2018 (LGPD)</strong> e com as diretrizes da{" "}
            <strong>ANPD — Agência Nacional de Proteção de Dados</strong>, autoridade responsável
            pela fiscalização da LGPD no Brasil, atendendo aos princípios da finalidade,
            necessidade, adequação, transparência, segurança, prevenção, responsabilização e
            prestação de contas.
          </p>
        </Section>

        <Section title="2. Aplicabilidade">
          <p>
            Esta Política se aplica a qualquer pessoa que interaja com a UAU+ Lavacar por meio de
            seus canais oficiais — aplicativo, painel web, e-mail, WhatsApp de suporte e demais
            meios digitais oficialmente utilizados — mesmo que não tenha concluído o cadastro. O
            compartilhamento de dados pessoais é condição necessária para criação de conta,
            assinatura de plano e uso dos serviços.
          </p>
          <p>
            Esta política se aplica a todos os perfis de usuário da Plataforma:{" "}
            <strong>clientes (assinantes)</strong>, <strong>operadores</strong>,{" "}
            <strong>responsáveis por unidade franqueada</strong> e{" "}
            <strong>administradores</strong>, cada um com o tratamento de dados descrito na
            seção 3.
          </p>
        </Section>

        <Section title="3. Dados que coletamos">
          <SubSection title="3.1 Clientes (assinantes)">
            <ul className="list-disc space-y-1 pl-5">
              <li>
                <strong>Identificação:</strong> nome completo, e-mail, senha (armazenada de forma
                criptografada/hash).
              </li>
              <li>
                <strong>Contato:</strong> telefone.
              </li>
              <li>
                <strong>Documento:</strong> CPF, utilizado para identificação do cliente e emissão
                de cobranças.
              </li>
              <li>
                <strong>Veículo:</strong> placa, marca, modelo, cor e ano do(s) veículo(s)
                cadastrado(s).
              </li>
              <li>
                <strong>Financeiro:</strong> histórico de cobranças, assinaturas e saldo de
                carteira (wallet/cashback). O processamento de pagamento, incluindo dados de
                cartão de crédito quando aplicável, é feito integralmente pelo parceiro Asaas, em
                página hospedada por ele — <strong>a UAU+ Lavacar não coleta, armazena,
                transmite ou registra número de cartão, CVV ou validade em nenhum momento</strong>,
                conforme confirmado em auditoria técnica do backend.
              </li>
              <li>
                <strong>Reconhecimento automático de placas (ANPR):</strong> eventos de leitura de
                placas capturados pelas câmeras instaladas nas unidades, usados para identificar
                veículos cadastrados no momento do atendimento. Esses eventos podem revelar padrões
                de frequência e horário de uso — ver prazo de retenção na seção 8.
              </li>
              <li>
                <strong>Uso da plataforma:</strong> histórico de lavagens, indicações e
                notificações recebidas.
              </li>
            </ul>
          </SubSection>

          <SubSection title="3.2 Operadores, responsáveis de unidade e administradores">
            <ul className="list-disc space-y-1 pl-5">
              <li>
                Dados de identificação e contato (nome, e-mail, telefone) para autenticação e
                controle de acesso ao painel.
              </li>
              <li>
                <strong>Registros de segurança (logs):</strong> endereço IP, identificador do
                dispositivo/navegador (user agent) e eventos de autenticação, para segurança da
                conta e prevenção a fraude.
              </li>
            </ul>
          </SubSection>

          <SubSection title="3.3 Dados técnicos e de navegação (todos os usuários)">
            <ul className="list-disc space-y-1 pl-5">
              <li>
                Endereço IP, tipo de dispositivo/navegador, sistema operacional e data/hora de
                acesso, coletados automaticamente pela infraestrutura da Plataforma e pela
                ferramenta de monitoramento de erros (Sentry), com a finalidade exclusiva de
                diagnóstico técnico e estabilidade do aplicativo.
              </li>
              <li>
                <strong>Cookies (painel web):</strong> utilizamos um único cookie,{" "}
                <code className="rounded bg-gray-100 px-1 py-0.5 text-xs">__uau_session</code>,
                estritamente necessário para autenticação e controle de sessão (válido por 7 dias,
                protegido com HttpOnly e Secure). Não utilizamos cookies de rastreamento,
                publicidade ou ferramentas de analytics de terceiros.
              </li>
            </ul>
          </SubSection>

          <p>
            Dados das <strong>unidades franqueadas</strong> (endereço, latitude e longitude) são
            dados do estabelecimento, não do usuário, e são exibidos publicamente para fins de
            localização.
          </p>
        </Section>

        <Section title="4. Controlador e base legal">
          <p>
            A UAU+ Lavacar atua como <strong>controladora dos dados pessoais</strong> tratados em
            seus canais. A coleta e o tratamento de dados ocorrem com base nas hipóteses legais
            previstas nos <strong>artigos 7º e 11º da LGPD</strong>, sendo dispensada a coleta de
            consentimento nos casos previstos em lei:
          </p>
          <InfoTable
            head={["Finalidade", "Base legal (LGPD)"]}
            rows={[
              ["Criação de conta, gestão de assinatura, cobrança", "Execução de contrato (art. 7º, V)"],
              ["Identificação via ANPR no atendimento", "Execução de contrato / legítimo interesse (art. 7º, IX)"],
              ["Prevenção a fraude, logs de segurança", "Legítimo interesse (art. 7º, IX)"],
              ["Diagnóstico técnico (Sentry)", "Legítimo interesse (art. 7º, IX)"],
              ["Cumprimento de obrigações fiscais", "Obrigação legal/regulatória (art. 7º, II)"],
              ["Comunicações institucionais/notificações do app", "Execução de contrato / legítimo interesse"],
            ]}
          />
        </Section>

        <Section title="5. Finalidades do tratamento">
          <ul className="list-disc space-y-1 pl-5">
            <li>Criar e gerenciar sua conta e assinatura de plano;</li>
            <li>Processar pagamentos e emitir cobranças através do parceiro Asaas;</li>
            <li>Identificar seu veículo automaticamente nas unidades por meio das câmeras ANPR;</li>
            <li>Enviar notificações sobre plano, carteira e atendimentos;</li>
            <li>Prevenir fraudes e proteger a segurança da plataforma;</li>
            <li>Diagnosticar falhas técnicas e manter a estabilidade do aplicativo;</li>
            <li>Atender solicitações, dúvidas e reclamações;</li>
            <li>Cumprir obrigações legais, regulatórias e fiscais;</li>
            <li>
              Responder a autoridades, auditorias e processos judiciais ou administrativos, quando
              exigido.
            </li>
          </ul>
        </Section>

        <Section title="6. Compartilhamento de dados">
          <p>
            Compartilhamos dados pessoais apenas com prestadores estritamente necessários à
            operação do serviço, mediante compromissos de confidencialidade e segurança:
          </p>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              <strong>Asaas</strong> — processamento de pagamentos e cobranças.
            </li>
            <li>
              <strong>Sentry</strong> — monitoramento técnico de erros (dados técnicos de
              dispositivo/IP no momento de falhas).
            </li>
            <li>
              <strong>Provedores de infraestrutura</strong> (hospedagem de backend, banco de dados
              e painel web) — necessários à operação da plataforma.
            </li>
            <li>
              <strong>Autoridades públicas ou judiciais</strong>, quando houver obrigação legal.
            </li>
            <li>
              <strong>Escritórios jurídicos e contábeis</strong>, quando necessário à defesa de
              direitos ou auditoria.
            </li>
          </ul>
          <p>
            Não vendemos dados pessoais a terceiros, nem os compartilhamos para fins de
            publicidade de terceiros.
          </p>

          <SubSection title="6.1 Transferência internacional de dados">
            <p>
              O banco de dados que armazena os dados pessoais está hospedado em São Paulo, Brasil.
              O processamento do backend (servidor de aplicação) e do painel web ocorre em
              infraestrutura de nuvem internacional (incluindo servidores nos Estados Unidos),
              operada por fornecedores que adotam cláusulas contratuais padrão e garantias de
              proteção de dados compatíveis com a LGPD, nos termos do art. 33. Ao utilizar a
              Plataforma, o titular está ciente de que dados pessoais podem ser processados fora
              do território nacional, sempre com os mesmos padrões de segurança e
              confidencialidade descritos nesta política.
            </p>
          </SubSection>
        </Section>

        <Section title="7. Segurança e boas práticas">
          <p>
            A UAU+ Lavacar adota medidas técnicas e administrativas compatíveis com o padrão de
            mercado, incluindo criptografia, controle de acesso e monitoramento. Tokens de acesso
            ao aplicativo são armazenados de forma segura no dispositivo do usuário, utilizando os
            mecanismos de armazenamento seguro do sistema operacional. Conexões entre o
            aplicativo/painel e nossos servidores utilizam criptografia em trânsito (HTTPS).
          </p>
          <p>
            Em caso de incidente de segurança que possa acarretar risco relevante aos titulares,
            comunicaremos a ANPD e os titulares afetados, nos termos do art. 48 da LGPD.
          </p>
        </Section>

        <Section title="8. Armazenamento, retenção e exclusão de dados">
          <p>
            Os dados pessoais serão retidos pelo prazo necessário para cumprir as finalidades
            desta política, respeitando obrigações legais, regulatórias e prazos prescricionais:
          </p>
          <InfoTable
            head={["Categoria de dado", "Prazo de retenção"]}
            rows={[
              [
                "Dados de conta (nome, e-mail, veículo)",
                "Enquanto a conta estiver ativa; até 60 dias após solicitação de exclusão",
              ],
              [
                "Histórico financeiro / cobranças",
                "5 anos, conforme prazos fiscais e prescricionais aplicáveis",
              ],
              [
                "Eventos de reconhecimento de placa (ANPR)",
                "180 dias, salvo uso ativo em investigação de fraude",
              ],
              ["Logs de segurança (IP, user agent)", "12 meses"],
            ]}
          />

          <SubSection title="8.1 Como excluir sua conta">
            <p>
              Você pode solicitar a exclusão da sua conta e dos dados pessoais associados a
              qualquer momento, através do e-mail{" "}
              <a className="font-medium text-uau-primary hover:underline" href={`mailto:${EMAIL_SUPORTE}`}>
                {EMAIL_SUPORTE}
              </a>
              , informando o e-mail cadastrado na conta. O pedido será processado em até 15 dias
              úteis, e você receberá confirmação por e-mail quando a exclusão for concluída.
            </p>
            <p>
              Podemos reter determinados dados mesmo após a exclusão da conta, quando exigido por
              lei — por exemplo, registros financeiros para cumprimento de obrigações fiscais, ou
              dados necessários à prevenção de fraude, conforme tabela acima.
            </p>
          </SubSection>
        </Section>

        <Section title="9. Seus direitos (LGPD, art. 18)">
          <p>Nos termos da LGPD, você pode exercer os seguintes direitos:</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>Confirmação da existência de tratamento;</li>
            <li>
              Acesso, correção ou atualização dos dados (disponível também na tela de Perfil do
              aplicativo);
            </li>
            <li>
              Anonimização, bloqueio ou eliminação de dados excessivos ou tratados em
              desconformidade;
            </li>
            <li>Portabilidade de dados a outro fornecedor de serviço;</li>
            <li>Eliminação de dados tratados com base no consentimento, e exclusão da conta;</li>
            <li>Informação sobre as entidades com as quais compartilhamos seus dados;</li>
            <li>Revogação do consentimento, quando aplicável;</li>
            <li>Oposição a tratamento realizado com base em legítimo interesse;</li>
            <li>
              <strong>Apresentar reclamação à ANPD</strong>, caso entenda que seus direitos não
              foram atendidos.
            </li>
          </ul>
          <p>
            O exercício desses direitos deve ser feito pelo e-mail{" "}
            <a className="font-medium text-uau-primary hover:underline" href={`mailto:${EMAIL_SUPORTE}`}>
              {EMAIL_SUPORTE}
            </a>{" "}
            ou pelo{" "}
            <Link href="/suporte" className="font-medium text-uau-primary hover:underline">
              canal de suporte
            </Link>
            , conforme previsto no art. 41 da LGPD.
          </p>
        </Section>

        <Section title="10. Tratamento de dados de crianças">
          <p>
            O UAU+ Lavacar não é destinado a menores de 18 anos, dado que a criação de conta exige
            capacidade civil plena (CPF vinculado e cobrança recorrente). Caso, ainda assim, dados
            de <strong>crianças (até 12 anos incompletos)</strong> sejam tratados em qualquer canal
            de atendimento, isso somente ocorrerá com{" "}
            <strong>consentimento específico e em destaque de pelo menos um dos pais ou
            responsável legal</strong>, em conformidade com o art. 14 da LGPD.
          </p>
        </Section>

        <Section title="11. Encarregado de Proteção de Dados (DPO)">
          <p>
            O encarregado pelo tratamento de dados pessoais é{" "}
            <strong>Carlos Eduardo Souza da Silva Rabelo</strong>, que pode ser contatado pelo
            e-mail{" "}
            <a className="font-medium text-uau-primary hover:underline" href={`mailto:${EMAIL_SUPORTE}`}>
              {EMAIL_SUPORTE}
            </a>{" "}
            para questões relacionadas à privacidade e proteção de dados, conforme art. 41 da
            LGPD.
          </p>
        </Section>

        <Section title="12. Atualização desta política">
          <p>
            Esta Política pode ser alterada a qualquer momento para garantir conformidade com a
            legislação vigente. Atualizações relevantes serão comunicadas pelo aplicativo, painel
            web ou canais oficiais da empresa.
          </p>
        </Section>
      </div>
    </div>
  );
}
