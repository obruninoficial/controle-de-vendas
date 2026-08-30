# Controle de Vendas

Aplicativo 100% local e offline para controle de produtos, clientes, vendas e
fiados. Construído como PWA (React + TypeScript + Vite + Tailwind CSS +
Dexie.js/IndexedDB), sem backend, sem servidor, sem login e sem nenhum envio
de dados para a internet.

## Publicando direto do iPhone (sem computador)

1. Crie uma conta gratuita em github.com (pelo Safari do iPhone).
2. Crie um repositório novo, público, chamado por exemplo `controle-de-vendas`.
3. Em **Add file → Upload files**, envie todo o conteúdo desta pasta (mantendo
   a pasta `.github/workflows`).
4. Vá em **Settings → Pages** e em "Build and deployment" escolha a origem
   **GitHub Actions**.
5. Aguarde alguns minutos — o workflow em `.github/workflows/deploy.yml` builda
   e publica o app automaticamente. O link fica em **Settings → Pages**.
6. Abra esse link no Safari do iPhone e toque em **Adicionar à Tela de Início**.

Depois disso, o app abre offline, como um aplicativo instalado, e todos os
dados ficam salvos apenas no iPhone.

## Rodando localmente (com computador)

```bash
npm install
npm run dev
```

Abra o endereço mostrado no terminal (ex: `http://localhost:5173`) no
navegador do computador para testar, ou no Safari do iPhone (na mesma rede
Wi-Fi) usando o endereço de rede mostrado pelo Vite (`--host`).

## Gerando a versão de produção

```bash
npm run build
npm run preview
```

Os arquivos finais ficam em `dist/`. Esse diretório pode ser hospedado em
qualquer servidor estático (Vercel, Netlify, GitHub Pages, ou até um servidor
local), apenas para servir os arquivos — nenhum dado do aplicativo passa por
esse servidor, tudo continua sendo salvo localmente no IndexedDB do
dispositivo que abrir o app.

## Instalando no iPhone (Adicionar à Tela de Início)

1. Publique a pasta `dist/` em qualquer URL HTTPS (necessário para o Service
   Worker funcionar) ou sirva localmente na sua rede.
2. Abra a URL no Safari do iPhone.
3. Toque no ícone de compartilhar e escolha **Adicionar à Tela de Início**.
4. O aplicativo abrirá em modo standalone, como um app nativo, e funcionará
   totalmente offline depois do primeiro carregamento.

## Estrutura do projeto

```
src/
├── components/   # Componentes reutilizáveis de UI
├── pages/        # Telas do aplicativo (Início, Produtos, Clientes, Vendas...)
├── db/           # Definição do banco Dexie/IndexedDB
├── services/      # Regras de negócio (CRUD, cálculo de dívida, backup)
├── types/        # Tipos TypeScript compartilhados
├── utils/        # Formatação de moeda e datas
└── App.tsx
```

## Backup e restauração

Em **Configurações**, é possível exportar todos os dados como um arquivo
`.json` (que pode ser salvo no app Arquivos do iPhone) e importar esse mesmo
arquivo depois para restaurar os dados — útil antes de trocar de aparelho ou
apagar o aplicativo.

## Sobre o armazenamento

Todos os dados (produtos, clientes, vendas, itens de venda e pagamentos)
ficam salvos no banco `ControleDeVendasDB`, no IndexedDB do navegador/PWA.
Nenhuma informação é enviada para servidores externos. Se o aplicativo for
apagado do dispositivo, os dados locais podem ser perdidos — por isso é
importante fazer backups regularmente pela tela de Configurações.
