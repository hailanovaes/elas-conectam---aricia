# Brigadeiros Arícia — Ateliê de Conteúdo

Assistente em HTML, CSS e JavaScript, com chamada ao Gemini no servidor. Publicação manual. Paleta inspirada no cardápio fornecido: chocolate, rosa-claro e branco. O logo original não foi redesenhado nem substituído por uma reprodução.

## Usar localmente

Requer Node.js 22 ou mais recente. Não há dependências para instalar.

1. Copie `.env.example` para `.env`.
2. Preencha `GEMINI_API_KEY`, `GEMINI_MODEL` com um modelo disponível na sua conta e `APP_PASSWORD` com um código forte.
3. Execute `npm start` nesta pasta.
4. Abra http://localhost:3000. Em “Acesso à geração por IA”, informe o código APP_PASSWORD, nunca a chave do Gemini.

Não envie `.env` ou a chave para repositórios ou para o navegador. A chave tem custo/quota da conta responsável. No Sites, configure as três variáveis como segredos de execução e reimplante. O site foi liberado por solicitação do proprietário para acesso público por link, com código de acesso obrigatório para geração. Não inclua esse código no repositório.

## Sem chave

“Experimentar um exemplo sem IA” carrega uma campanha fixa dos panetones, claramente identificada. Não interpreta o formulário. Permite editar, copiar, baixar texto, escolher fotos e testar histórico. A geração de campanhas foi verificada com a API real. A geração de imagens está integrada, mas o teste real retornou HTTP 429 com cota gratuita zero para o modelo de imagens nesta conta.

## Fluxo

Formulário → servidor → Gemini → validação JSON → campos editáveis → copiar/baixar → publicação manual → resultados informados → contexto das próximas campanhas.

## Função do servidor e contrato JSON

`generateCampaign(env, brief, history)` em `worker/index.js` chama o Gemini com saída estruturada, valida os campos e retorna um objeto de campanha. É usada pela rota `POST /api/generate`, tanto no servidor Node.js quanto no Worker do Sites. Requer modelo com suporte a saída estruturada.

O formulário envia este corpo (todas as informações abaixo são exemplos):

```json
{
  "brief": {
    "produto": "Nanotone",
    "diferencial": "Panetone de bolso recheado e coberto com chocolate",
    "regiao": "São Paulo e ABC, mediante consulta para o bairro",
    "objetivo": "Atrair novos clientes",
    "material": "Tenho fotos reais do produto",
    "formato": "Carrossel"
  },
  "history": []
}
```

Sucesso: `200` com `{ "campaign": { "titulo": "...", "hipotese": "...", "capa": "...", "cards": ["...", "...", "..."], "legenda": "...", "cta": "...", "stories": ["...", "...", "..."], "capturas": [] } }`.

Erro: `{ "error": "Mensagem para a interface" }`. Códigos: `400` para entrada inválida, `401` para código de acesso inválido, `403` para origem diferente, `405` para método incorreto, `413` para corpo grande, `503` para configuração ausente e `502` para falha do Gemini. A chamada ao provedor tem prazo de 40 segundos. Respostas bloqueadas, truncadas ou fora do formato não são entregues como campanhas válidas.

O navegador envia `Content-Type: application/json` e `x-app-password` quando configurado. A origem deve corresponder à aplicação. A chave do Gemini é acrescentada apenas pelo servidor no cabeçalho `x-goog-api-key`. `npm test` executa os testes com provedor simulado, sem chave nem consumo real da API.

Fotos e documentos anexados são enviados ao Gemini para análise. A publicação é manual. Os textos e imagens de IA precisam de revisão. Não divulgar preços. Disponibilidade, sabores e entregas precisam ser confirmados pela Arícia.

## Anexos

## Sugestões de imagem por peça

Novas campanhas incluem `imagemCapa`, `imagensCards` e `imagensStories`. Cada sugestão tem `{ "arquivo": "nome-exato-da-foto.jpg ou string vazia", "orientacao": "Como fotografar ou compor a imagem" }`. As listas têm a mesma quantidade e ordem dos cards/cenas e stories. O servidor rejeita referências a nomes inexistentes e documentos citados como foto.

A interface apresenta a sugestão junto de cada texto, com enquadramento, fundo/cores e espaço para o título. Quando não houver uma foto adequada, sugere uma nova foto/tomada. É possível escolher a foto anexada para cada peça, visualizá-la, ampliar e baixar. Também há um botão independente “Gerar imagem com IA” por peça. É possível editar, copiar, salvar, exportar e baixar as sugestões junto da campanha. Campanhas antigas continuam abrindo.

### Geração e exibição de imagens

`POST /api/image` recebe `{prompt, attachments: []}` com fotos opcionais de referência e devolve `{image:{mimeType,data},generated:true,note}`. Usa a mesma proteção de origem e código de acesso da geração de campanhas. O modelo padrão é `gemini-3.1-flash-image`, substituível por `GEMINI_IMAGE_MODEL` no servidor. A requisição ao Google permite as modalidades TEXT e IMAGE, com prazo de 90 segundos. Imagens de IA são identificadas como tal e exigem conferência da aparência do produto. Não são criadas automaticamente em lote: cada clique solicita uma imagem. A cota e os custos dependem da conta Google. O teste real recebeu cota gratuita zero; habilitação de faturamento ou cota deve ser feita pelo proprietário no AI Studio, não pela aplicação.

### Formatos e armazenamento dos anexos

O formulário aceita JPG, PNG, WebP, PDF, TXT e CSV (UTF-8), com prévias de fotos e remoção individual. Limites: 5 arquivos, 4 MB por arquivo e 8 MB no total. Word e Excel devem ser exportados para PDF ou CSV; vídeos não são aceitos. O navegador envia `attachments: [{name, mimeType, data}]` com base64 no JSON de `POST /api/generate`. O servidor valida tipo, assinatura básica, codificação e tamanho antes da chamada ao Gemini. Fotos e PDFs seguem como `inlineData`; TXT/CSV seguem como texto. Limite do corpo HTTP: 12 MiB, incluindo a expansão base64.

Documentos não são armazenados. Fotos usadas nas campanhas e imagens geradas ficam no IndexedDB deste navegador; campanhas guardam as referências locais. É necessário salvar a campanha após escolher ou gerar uma foto. Limpar os dados do navegador apaga também as imagens. Os backups JSON incluem textos e resultados, sem os arquivos de imagem: baixe as imagens separadamente. Não existe sincronização entre dispositivos. Se o armazenamento de imagens falhar, a aplicação mantém a prévia na sessão e orienta baixar uma cópia. O tratamento pelo Google segue as condições da conta Gemini utilizada. O exemplo sem IA permite mostrar fotos manualmente, mas não as analisa nem gera imagens sem chamada à API. Instruções encontradas em anexos são tratadas como dados, não como comandos.

## Histórico e privacidade

Campanhas, perfil e resultados ficam apenas no localStorage do navegador/dispositivo. Não sincronizam entre dispositivos. Limpar dados do navegador pode apagar o histórico. Use Exportar backup e Importar backup. Chave e código de acesso não são salvos nesse histórico. Não inclua dados de clientes ou informações pessoais sensíveis nos campos. Perfil, briefing e resumo de até cinco campanhas publicadas e geradas com IA são enviados ao Gemini para contextualização. A publicação no Instagram e o registro de métricas são manuais. O exemplo fixo não é usado como histórico de IA.

## Verificações

`npm run check` verifica sintaxe. `npm run build` gera o Worker hospedável em `dist/server/index.js` e copia o manifesto. `node test.mjs` verifica validação e comportamento do servidor sem usar chave real.

Para publicação fora do Sites, use uma hospedagem compatível com Node.js e configure HTTPS, segredos e controle de acesso. A execução local escuta somente no próprio computador. O Worker hospedado depende da autenticação privada do Sites e/ou APP_PASSWORD; não torne o assistente público sem revisar proteção e limites de uso.
