# Especificação v2 — simplificação e reformulação

Escopo revisado em 2 de novembro de 2026 por autorização do usuário. Substitui as obrigações de arquitetura da especificação v1.0. Este documento distingue explicitamente o runtime atual do destino planejado.

## Matriz de transição

| Área | Hoje | Decisão e etapa |
| --- | --- | --- |
| Frontend | Next.js/React e Tailwind | Manter; redesign integral nas etapas 3–5 |
| API | Express com camadas por diretório | Manter Express; organizar por funcionalidade na etapa 2 |
| Persistência | MySQL para negócio | Manter e preservar dados |
| Auditoria | MongoDB | Migrar para MySQL e validar antes de retirar MongoDB, etapa 2 |
| Infraestrutura | Quatro serviços locais | Reduzir a três após migração; MQTT continua externo |
| Interfaces abstratas | IDAO/IService/IController obrigatórias | Retirar obrigatoriedade; simplificar conforme uso na etapa 2 |
| Sessão | JWT Bearer no navegador | Preservar API; estabilizar hidratação e sincronização na etapa 1 |
| Acesso administrativo | API protegida, link público | API sempre protegida; link somente para ADMIN autenticado na etapa 3 |
| Pagamento | Carteira e recarga manual/mock | Manter na transição; checkout direto em sandbox na etapa 6 |
| Histórico e saldos | MySQL | Preservar; nenhuma exclusão automática de saldos legados |
| Operação | Máquinas, slots, estoque, eventos | Preservar regras e integração ESP32-S3 |
| Recursos existentes | Upload, JSON, XML, PDF e gráfico | Preservar; unificar implementação e navegação |
| Entrega acadêmica | PDF, vídeo e stack exigidos | Deixam de definir arquitetura; materiais antigos ficam como histórico |

## Fluxos preservados

Visitante consulta catálogo por máquina/QR Code e autentica-se. Cliente consulta sua conta, saldo legado e compras, compra um item e acompanha sua retirada. Administrador gerencia máquinas, slots, produtos, imagens, estoque e usuários; consulta pedidos, pagamentos, eventos e auditoria; gera relatórios/exportações.

As URLs públicas e de QR Code serão preservadas. O inventário em docs/etapa1/inventario.json registra rotas e consumidores antes da reorganização. Endpoints existentes respondem tanto sob /api quanto sem esse prefixo, por compatibilidade do roteador atual; novos clientes devem usar /api.

## Invariantes de negócio

- Backend decide preço, estoque, autorização e estado do pagamento; valores em centavos inteiros.
- Estoque disponível é quantidade disponível menos reservada. Transações e bloqueios evitam venda duplicada.
- Máquina precisa estar ativa e ter heartbeat válido. Somente confirmação de dispensa conclui a entrega.
- Recarga, checkout, eventos MQTT e estornos precisam ser idempotentes.
- Usuário comum consulta apenas seus registros. Acesso administrativo depende do perfil validado pela API, mesmo ao abrir URL diretamente.
- Tópicos e contrato de comando/eventos do firmware são preservados. Nenhum teste automatizado deve acionar equipamento real.

## Arquitetura alvo

Frontend Next.js → API Express → MySQL, com MQTT externo conectado à API. Módulos reúnem rotas, validação, regras e persistência quando necessários. Infraestrutura, configuração, erros e auditoria são compartilhados sem um framework genérico de CRUD. As migrações são aditivas e reversíveis antes da retirada de componentes antigos.

## Pagamentos planejados

Proposta: Mercado Pago Checkout Pro em teste, com pagamento por compra. A confirmação precisa de webhook autenticado e consulta ao provedor; retorno do navegador não confirma pagamento. Reservas têm expiração; aprovação tardia ou entrega inviável exige reconciliação/reembolso. Separar estados de pagamento e entrega. Reembolso externo só é concluído após confirmação do provedor; compra antiga com carteira mantém estorno em carteira.

Essa integração não faz parte da etapa 1. A escolha de API/SDK, meios disponíveis e credenciais será verificada na etapa 6. Não haverá cobrança real nesta fase.

## Entregas por etapa

1. Documentação coerente, inventário, backups com restauração comprovada, lint/TypeScript/build e regressão de sessão/permissões.
2. Módulos simplificados e migração verificada de logs; três serviços locais.
3. Sistema visual sans-serif e navegação por perfil.
4. Jornada completa do cliente redesenhada.
5. Operação administrativa redesenhada.
6. Pagamento e reembolso em sandbox integrados à dispensa simulada.
7. Validação final em desktop/celular, documentação e conclusão da transição.

Detalhes e critérios: plano-reformulacao.md. Evidências da etapa 1: etapa1/validacao.md. A especificação v1.0 e relatórios anteriores descrevem versões históricas; não devem ser interpretados como retrato do runtime atual.
