# Plano de simplificação e reformulação da plataforma

Status: etapa 1 concluída; etapas 2–7 planejadas. Evidências em [docs/etapa1/validacao.md](etapa1/validacao.md). A aplicação ainda usa quatro serviços; a migração de arquitetura não foi iniciada.

## Direção e decisões

O usuário autorizou rever a arquitetura e os requisitos acadêmicos. Portanto, a exigência atual de quatro serviços, MongoDB exclusivo para logs e interfaces abstratas deixa de ser premissa para a nova proposta. A especificação e os arquivos de orientação devem ser atualizados na primeira etapa, junto com uma matriz do que será mantido, substituído e retirado.

Proposta: Next.js/React no frontend, uma API Express organizada por funcionalidade e MySQL para dados e auditoria. MQTT permanece como integração externa da API. São **três serviços locais**, sem adicionar microsserviços, filas ou outro banco para este porte de projeto.

Sugestão de pagamento: **Mercado Pago Checkout Pro em ambiente de teste**, inicialmente para pagamento por compra. É uma proposta de produto, não uma decisão já implementada: a carteira atual fica disponível na transição e seus saldos e histórico são preservados. A retirada definitiva da carteira depende de resolver todos os saldos e compras pendentes.

## Diagnóstico com base na documentação e no código

- `AGENTS.md` e a especificação v1.0 ainda descrevem requisitos acadêmicos obrigatórios. O README e alguns guias descrevem módulos já implementados como futuros ou pendentes.
- `docs/usage/frontend-polishing.md` descreve máquinas apresentadas como online na demonstração, enquanto os componentes atuais tratam ausência de heartbeat. A documentação precisa refletir o comportamento real.
- `components/admin/ReportsAdmin.tsx` e `components/reports/ReportsAdmin.tsx` coexistem; a rota importa a versão de `admin`. Há dois `MachineStatusBadge` com responsabilidades equivalentes em `catalog` e `machines`. Confirmar todos os usos antes de consolidar.
- `AppHeader.tsx` inclui `/admin` em `navItems`, independentemente da sessão, além de já ter uma entrada condicionada no menu do usuário.
- O layout carrega Geist, mas `globals.css` redefine `--font-sans: var(--font-sans)`. Essa autorreferência é uma hipótese concreta para a queda na fonte padrão serifada observada na captura de teste. A confirmação será feita pelo estilo computado no navegador.
- O pagamento atual é manual/simulado. `PaymentService.confirmMockPayment` faz crédito de carteira; o checkout debita a carteira; falhas de dispensa estornam para a carteira. A integração externa precisa mudar esses três pontos de forma coordenada.
- `payments.type` aceita apenas `MOCK_TOPUP`; há restrições também em provider, status e referência das transações. Trocar apenas a variável de ambiente não habilita um gateway.
- A validação anterior registrou 96 testes de API aprovados, 18 erros de lint e erro React #418 em navegações autenticadas. Esses resultados são uma referência histórica; deverão ser medidos novamente, pois o repositório pode ter evoluído.

## Etapas, entregas e critérios de conclusão

### 1. Consolidar escopo e estabelecer uma base verificável

Atualizar a especificação, `AGENTS.md`, README e `PRODUCT.md` para a arquitetura proposta. Registrar os recursos preservados: catálogo por QR Code, autenticação, compra de um item, estoque, acompanhamento da retirada, administração e suporte. Preservar inicialmente imagens, relatórios, gráficos e exportações existentes; a simplificação começa pela implementação e pela navegação.

Inventariar rotas e consumidores; guardar uma versão recuperável do código e backups verificáveis dos bancos. Executar os testes atuais e separar defeitos preexistentes. Resolver a sessão/hidratação e os erros de lint necessários para deixar a base validável antes do redesign.

**Concluída quando:** escopo revisado e referências coerentes; baseline de testes registrada; restauração dos dados demonstrada; acesso direto à administração continua protegido pela API.

### 2. Simplificar estrutura, dependências e infraestrutura

Migrar gradualmente o backend para `src/modules/<funcionalidade>`, com módulos de autenticação, catálogo, máquinas/estoque, pedidos, pagamentos e administração/auditoria. Cada módulo reúne rotas, validação, serviço e acesso a dados quando necessário. Controllers permanecem pequenos; não exigir classes, models ou métodos CRUD sem uso em todos os módulos. Substituir contratos abstratos obrigatórios por contratos reais dos módulos e adaptadores.

Centralizar configuração, conexão com banco, erros e auditoria em `src/shared`. Consolidar a montagem repetida dos logs sem criar um framework genérico de CRUD. Manter transações e bloqueios de estoque no domínio responsável.

No frontend, usar `app` para rotas/layouts, `features` para funcionalidades, `components/ui` para primitivas e `lib` para integração compartilhada. Consolidar as duplicações comprovadas; revisar dependências por uso antes de removê-las. Mudar um módulo por vez, mantendo URLs públicas e links de QR Code.

Criar uma tabela MySQL de auditoria com índices, contexto e detalhes estruturados. Importar logs do MongoDB preservando identificador de origem e datas, com retomada sem duplicar. Comparar contagens/amostras e verificar leitura/exportação antes da troca. Configurar retenção para os logs de acesso não crescerem indefinidamente.

Remover MongoDB do Compose somente depois de validar a migração e desativar seus consumidores. Manter seu volume e backup durante a janela de reversão. O backend continua servindo HTTP e MQTT no mesmo processo, com tarefas pequenas de expiração/reconciliação persistidas no MySQL e recuperáveis após reinício.

**Concluída quando:** os três serviços sobem, dados e logs permanecem consultáveis, testes dos módulos migrados passam e existe um procedimento de reversão sem apagar dados.

### 3. Definir o novo sistema visual e corrigir a navegação

Direção proposta: interface de autoatendimento clara, contemporânea e prioritariamente móvel, com tipografia totalmente sem serifa, fotos de produtos e disponibilidade real como elementos principais. Validar a direção em uma tela de catálogo e uma tela administrativa antes de expandir para todas as páginas.

Usar uma única fonte sans-serif consistente, títulos com peso moderado, números bem legíveis e escala de tamanho enxuta. Unificar cores, espaçamentos, bordas, estados e foco em tokens. Sugestão inicial: superfícies claras, texto grafite e cor de destaque para a ação principal; sem compromisso definitivo com a paleta antes dos protótipos.

Separar os layouts público, conta e administração. Visitante vê comprar e entrar; cliente autenticado vê sua conta e compras; somente usuário autenticado com perfil `ADMIN` recebe o link de administração. Aplicar a mesma regra ao menu móvel, atalhos e chamadas da home. A autorização da API permanece independente da visibilidade do link.

**Concluída quando:** a fonte computada é a esperada, não há salto/flash de navegação por sessão, menus respeitam os três estados e os componentes básicos funcionam com teclado e em 360 px de largura.

### 4. Reformular toda a jornada do cliente

Redesenhar home, seleção de máquina, catálogo, detalhe, login/cadastro, confirmação, acompanhamento da retirada, conta e histórico. Priorizar a sequência QR Code → produto → pagamento → retirada. Reduzir a home aos conteúdos que ajudam a comprar ou entender o funcionamento.

Dar destaque ao preço, foto, slot e disponibilidade. Exibir carregamento, catálogo vazio, produto indisponível, máquina offline, sessão expirada, pagamento pendente/recusado e problema de retirada. Usar textos em português nos estados apresentados ao cliente. Durante a transição, manter a carteira acessível a quem tem saldo, sem torná-la uma etapa obrigatória do novo fluxo.

**Concluída quando:** o fluxo completo funciona em celular e desktop com dados reais da API; indisponibilidade não é mascarada; erros permitem voltar, tentar de novo ou pedir suporte.

### 5. Reformular a operação administrativa

Organizar a navegação em Operação (máquinas, slots e estoque), Comercial (produtos, pedidos e pagamentos) e Gestão (usuários, relatórios e auditoria). Reduzir telas repetidas, reutilizando filtros, tabelas, formulários e confirmações.

Concentrar no painel os dados acionáveis: estoque baixo, máquinas sem comunicação, pedidos pendentes e falhas. Preservar upload, busca, relatórios PDF, gráfico e exportações funcionais. Diferenciar claramente pagamento aprovado de produto efetivamente entregue.

**Concluída quando:** cada tarefa administrativa existente tem um destino no novo mapa, filtros e formulários são consistentes e o cliente comum não acessa dados administrativos.

### 6. Integrar pagamento por compra em sandbox

Criar um pequeno contrato de provedor para criar checkout, consultar pagamento e solicitar reembolso. Implementar apenas dois adaptadores necessários: simulado para testes automatizados e Mercado Pago para teste integrado. Não criar uma infraestrutura para vários gateways antecipadamente.

Planejar migrações aditivas: relação entre pagamento e pedido, moeda, ambiente, referência externa, estado do checkout, expiração, eventos recebidos e solicitações de reembolso. Revisar as restrições MySQL atuais e manter registros legados de carteira intactos. Separar status de pagamento dos status de entrega.

Fluxo proposto:

1. Backend valida máquina, preço e estoque; cria pedido aguardando pagamento e reserva temporária em transação curta, com chave de idempotência.
2. Cria o checkout no provedor fora da transação MySQL, com referência do pedido e tratamento de timeout/repetição. Falha nessa criação libera ou expira a reserva.
3. Cliente segue ao checkout hospedado. O retorno ao site apenas mostra o estado consultado na API.
4. Webhook autenticado, seguido de consulta ao provedor, confirma referência, valor, moeda, conta recebedora e ambiente. Eventos duplicados ou fora de ordem não repetem efeitos.
5. Antes de dispensar, conferir validade da reserva e disponibilidade da máquina. Gravar a intenção de comando no banco e publicar pelo MQTT com o mesmo identificador em tentativas repetidas. Eventos da máquina também precisam ser idempotentes.
6. Pagamento recusado, cancelamento ou expiração liberam a reserva. Pagamento aprovado após a expiração ou quando a máquina já não pode entregar inicia reembolso, sem dispensar item sem reserva válida.
7. Falha ou timeout de retirada inicia reembolso no provedor. Registrar solicitação pendente e repetir de forma controlada; marcar reembolsado somente após confirmação. Compras antigas com carteira continuam usando sua regra original de estorno.

Reconciliar pagamentos e reembolsos pendentes após perda de webhook ou reinício. Se um comando já foi enviado e seu resultado é incerto, não disparar outra entrega nem concluir reembolso cegamente: registrar a ocorrência para reconciliação/suporte.

Primeira prova externa com cartão de teste, que permite verificar aprovação e recusa. A documentação do Checkout Pro informa que meios offline como Pix podem permanecer pendentes no teste; portanto, não tratar a geração de um Pix como comprovação de pagamento integrado aprovado.

**Dependências da etapa:** aplicação/contas de teste do Mercado Pago, credenciais somente no backend e endpoint HTTPS acessível ao provedor para webhook. A escolha exata da API/SDK e a configuração dos meios de pagamento serão verificadas na implementação.

**Concluída quando:** pagamento de teste aprovado produz exatamente uma entrega simulada; recusa/expiração não entrega; falha da máquina gera um único reembolso; retorno forjado, webhook repetido e reinício não duplicam cobrança, reserva, entrega ou devolução.

### 7. Validar a nova versão e concluir a transição

Executar testes de API e migração, build, TypeScript, lint e testes de navegador para visitante, cliente e administrador. Cobrir desktop e celular, teclado, contraste, rótulos, carregamento e estados de erro. Atualizar os seletores Playwright para a interface nova.

Testar também webhook inválido, valor divergente, pagamento tardio, indisponibilidade do provedor/MQTT e reinício com pedidos pendentes. Usar simulador de máquina em testes; documentar separadamente o que foi confirmado em hardware físico.

Publicar instruções de execução, migração, backup/restauração e sandbox. Aposentar caminhos antigos apenas depois de comprovar que não há consumidores ou pendências; manter histórico de pedidos e saldos até concluir a política de transição.

**Concluída quando:** três serviços saudáveis, testes e lint aprovados, jornada completa demonstrada em sandbox, evidências de interface e documentação correspondentes à versão entregue.

## Ordem de execução

1 → 2 → 3 → 4 → 5 → 6 → 7. O contrato interno do pagamento é definido na etapa 2; as telas já contemplam seus estados nas etapas 3–5; a conexão externa ocorre na etapa 6. Cada etapa termina em uma versão executável e revisável.

Arquitetura alvo e pagamento direto são recomendações deste plano. A autorização para rever os requisitos permite avaliá-las; não equivale a apagar bancos, saldos ou recursos agora.

## Referências consultadas

Fontes locais: especificação v1.0, `AGENTS.md`, `PRODUCT.md`, READMEs, guias de arquitetura, autenticação, carteira/pagamentos, frontend, polimento e testes, além dos componentes, serviços e schema mencionados acima. A captura `docs/testing/wallet-validation.jpg` foi usada como referência visual existente; não foi produzida nova auditoria visual nesta revisão.

Fontes oficiais do provedor, consultadas em 2 de novembro de 2026:

- [Mercado Pago — Checkout Pro](https://www.mercadopago.com.br/developers/pt/docs/checkout-pro-preferences/overview).
- [Mercado Pago — compras de teste e limitações de meios offline](https://www.mercadopago.com.br/developers/pt/docs/checkout-pro-preferences/integration-test/test-purchases).
- [Mercado Pago — notificações e validação de webhooks](https://www.mercadopago.com.br/developers/pt/docs/checkout-pro-preferences/payment-notifications).
- [Stripe — sandboxes](https://docs.stripe.com/sandboxes), alternativa considerada, sem previsão de integrar dois provedores nesta versão.
