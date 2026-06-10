# Gerenciamento de Máquinas e Inventário

Este documento descreve as funcionalidades de gerenciamento técnico de hardware e controle de estoque.

## 1. Máquinas (`/admin/machines`)

O módulo de máquinas permite o controle centralizado de todas as vending machines da rede.

- **Status IoT**: Acompanhe se a máquina está `ONLINE`, `OFFLINE` ou em `MANUTENÇÃO`.
- **Slug e Localização**: Defina o identificador da URL (QR Code) e o endereço físico da unidade.
- **Ações Rápidas**: Atalhos diretos para configurar slots ou visualizar o inventário específico daquela máquina.

## 2. Configuração de Slots (`/admin/machines/[id]/slots`)

Cada máquina possui slots (espirais) que precisam ser mapeados para o hardware físico.

- **Código**: Identificador visual (ex: A1, B2).
- **Motor ID**: Endereço do motor na controladora ESP32-S3.
- **Sensor Column ID**: Índice da coluna de sensores de queda.
- **Habilitação**: Desative slots com problemas mecânicos sem precisar remover a máquina de operação.

## 3. Controle de Inventário (`/admin/inventory`)

O inventário vincula produtos aos slots das máquinas e controla as quantidades.

- **Associação**: Vincule um produto ativo a um slot específico de uma máquina.
- **Quantidades**:
    - **Disponível**: Quantidade real abastecida na máquina.
    - **Reservado**: Itens em processo de venda (pagamento autorizado, aguardando dispensa).
    - **Saldo para Venda**: Cálculo automático (`Disponível - Reservado`).
- **Ajuste Rápido**: Botões de `+1` e `-1` para facilitar a reposição física.
- **Alertas de Estoque Baixo**: Itens com saldo abaixo do limite configurado são destacados em vermelho com um ícone de alerta.

## 4. Fluxo de Abastecimento Recomendado

1. Acesse o painel de **Inventário**.
2. Filtre pela **Máquina** que está sendo abastecida.
3. Utilize os botões de **Ajuste Rápido** para atualizar as quantidades conforme os itens são inseridos.
4. Caso o slot esteja vazio ou precise mudar o produto, utilize o botão **"Novo Estoque"** ou **"Editar"**.

## 5. Integridade de Dados

- O sistema impede que a quantidade disponível seja menor que zero.
- Alterações de estoque são registradas no MongoDB para auditoria técnica.
- Se uma máquina estiver `OFFLINE`, o frontend bloqueia vendas mesmo que haja estoque, para evitar falhas de experiência do usuário.
