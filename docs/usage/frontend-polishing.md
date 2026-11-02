# Frontend: estado e evolução

O frontend atual oferece home, seleção de máquinas, catálogo, detalhe, checkout com carteira, conta, histórico e administração. As rotas usam a API Express; disponibilidade e autorização vêm do backend.

O antigo modo de demonstração que apresentava máquinas offline como online não corresponde ao código atual. Sem heartbeat válido a interface deve mostrar indisponibilidade e o backend recusa a compra.

O redesign integral ainda será feito nas etapas 3–5 do plano. A etapa 1 estabiliza a sessão e o lint. Para o escopo vigente, consulte ../especificacao-plataforma-v2.md; para as evidências, ../etapa1/validacao.md.
