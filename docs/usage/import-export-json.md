# Importação e Exportação de Dados (JSON)

Este documento descreve como realizar operações em lote na plataforma através de arquivos JSON.

## 1. Visão Geral

O módulo de Importação/Exportação (`/admin/import-export`) permite que administradores gerenciem grandes volumes de dados sem a necessidade de cadastros manuais individuais. Atualmente, o sistema suporta as entidades:

- **Produtos**: Itens do catálogo.
- **Inventário**: Vínculos entre máquinas, slots e produtos.

## 2. Exportação

A exportação permite baixar a base de dados atual para backup ou edição externa.

- **Como fazer**: Selecione a entidade desejada e clique em "Exportar para JSON".
- **Formato**: O arquivo gerado segue o padrão:
  ```json
  {
    "entity": "products",
    "records": [...]
  }
  ```
- **Conteúdo**: Inclui todos os registros (ativos e inativos) presentes no MySQL.

## 3. Importação

A importação permite inserir novos registros ou atualizar dados existentes em massa.

- **Arquivo Requerido**: Deve ser um arquivo `.json` válido, com tamanho máximo de 2MB.
- **Validação**: O sistema valida a estrutura do JSON antes de processar. Se houver um erro em qualquer linha, a operação inteira é cancelada (transacional) para garantir a integridade dos dados.
- **Regras Específicas**:
    - **Produtos**: SKUs duplicados serão rejeitados.
    - **Inventário**: IDs de Máquina, Slot e Produto devem existir previamente no sistema.

## 4. Exemplos de Estrutura

Para garantir o sucesso da importação, utilize os modelos oficiais como base:

- [Exemplo de Produtos](https://github.com/vending-ai/vending-ai-web/blob/main/docs/examples/products-import.example.json)
- [Exemplo de Inventário](https://github.com/vending-ai/vending-ai-web/blob/main/docs/examples/inventory-import.example.json)

## 5. Auditoria

Toda operação de importação ou exportação gera um log detalhado no **MongoDB** (`IMPORT_JSON` / `EXPORT_JSON`), registrando:
- Administrador que realizou a ação.
- Nome do arquivo enviado (na importação).
- Entidade afetada.
- Timestamp e IP de origem.
