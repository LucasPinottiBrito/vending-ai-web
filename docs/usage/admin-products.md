# Gerenciamento de Produtos (Admin)

Este documento descreve as funcionalidades de gerenciamento de produtos disponíveis para administradores.

## 1. Listagem e Busca

A tela principal (`/admin/products`) exibe todos os produtos cadastrados no sistema.

- **Busca em Tempo Real**: Filtre produtos por **Nome** ou **SKU** através da barra de pesquisa.
- **Filtros por Categoria**: Selecione uma categoria específica para restringir a listagem.
- **Filtro de Status**: Visualize apenas produtos ativos, inativos ou todos.
- **Limpeza de Filtros**: Botão rápido para resetar todos os parâmetros de busca.

## 2. Cadastro de Novo Produto

Clique em **"Novo Produto"** para abrir o formulário de criação.

- **Campos Obrigatórios**: SKU (único), Nome e Preço (em centavos).
- **Campos Opcionais**: Descrição e Categoria.
- **Validação**: O sistema impede a criação de produtos com SKU duplicado ou preço negativo.
- **Status Inicial**: Por padrão, novos produtos são criados como "Ativos".

## 3. Edição de Dados

Através do menu de ações (ícone de três pontos), você pode editar qualquer produto.

- **Atualização em Lote**: Altere nome, preço ou categoria e salve instantaneamente.
- **Controle de Disponibilidade**: Ative ou desative o produto rapidamente clicando no badge de status na tabela.

## 4. Gerenciamento de Imagens

Cada produto pode ter uma imagem associada.

- **Upload**: Clique no ícone de **Upload** na linha do produto para selecionar um arquivo (PNG, JPG, WEBP).
- **Preview**: A miniatura da imagem é exibida diretamente na tabela.
- **Armazenamento**: As imagens são armazenadas localmente no servidor e vinculadas ao ID do produto.

## 5. Exclusão (Desativação)

Seguindo as boas práticas de integridade de dados, produtos não são removidos permanentemente para preservar o histórico de vendas.

- **Desativar**: O botão "Desativar" altera o status do produto para inativo.
- **Impacto**: Produtos inativos não aparecem no catálogo público para os clientes.

## 6. Integridade e Auditoria

Todas as operações de CRUD geram logs no **MongoDB**, permitindo rastrear:
- Quem criou/editou o produto.
- Valores antigos e novos (antes/depois).
- IP e timestamp da operação.
