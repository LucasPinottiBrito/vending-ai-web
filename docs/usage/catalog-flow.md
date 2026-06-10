# Fluxo do Catálogo Público (QR Code)

Este documento descreve como os clientes acessam a plataforma via QR Code, visualizam os produtos e iniciam uma compra.

## 1. Acesso via QR Code

Cada máquina possui um `slug` único (ex: `maquina-central`). O QR Code físico na máquina aponta para a URL:
`https://vending-ai.com/m/maquina-central`

## 2. Página do Catálogo

A página de catálogo (`/m/[slug]`) é pública e não exige login para visualização inicial.

### Funcionalidades:
- **Cabeçalho da Máquina**: Exibe nome, localização e status (Online/Offline).
- **Busca**: Filtro em tempo real por nome de produto.
- **Grade de Produtos**: Exibe imagem, nome, código do slot, preço e disponibilidade.
- **Validação de Compra**:
    - Se a máquina estiver Offline, o botão de compra é desabilitado.
    - Se o produto estiver Sem Estoque, o botão de compra é desabilitado.

## 3. Fluxo de Compra

Ao clicar em "Comprar":

1. **Verificação de Sessão**:
    - Se o usuário não estiver logado, é redirecionado para `/login` com parâmetro `returnTo` para voltar ao catálogo após o login.
2. **Checkout**:
    - Após o login, o usuário confirma a intenção de compra.
    - O frontend envia um POST para `/api/sales/checkout` com `machine_id`, `slot_id` e `product_id`.
    - O backend valida saldo, estoque e status da máquina em uma transação MySQL.
3. **Acompanhamento**:
    - Se autorizado, o usuário é redirecionado para `/purchase/[saleId]`.
    - Nesta tela, ele acompanha o status do dispense em tempo real (via polling ou websockets/mqtt-events).

## 4. Estados de Erro e Carregamento

- **Carregamento**: Skeleton ou spinner enquanto o catálogo é buscado.
- **Máquina Não Encontrada**: Exibe estado vazio informando que o slug é inválido.
- **Erro de API**: Exibe alerta com a mensagem de erro retornada pelo backend.
