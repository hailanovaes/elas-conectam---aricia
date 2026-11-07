# Brigadeiros Arícia — Ateliê de Conteúdo

Assistente em HTML, CSS e JavaScript, com chamada ao Gemini no servidor. Publicação manual. Paleta inspirada no cardápio fornecido: chocolate, rosa-claro e branco. O logo original não foi redesenhado nem substituído por uma reprodução.

## Usar localmente

Requer Node.js 22 ou mais recente. Não há dependências para instalar.

1. Copie `.env.example` para `.env`.
2. Preencha `GEMINI_API_KEY`, `GEMINI_MODEL` com um modelo disponível na sua conta e `APP_PASSWORD` com um código forte.
3. Execute `npm start` nesta pasta.
4. Abra http://localhost:3000. Em “Acesso à geração por IA”, informe o código APP_PASSWORD, nunca a chave do Gemini.

Não envie `.env` ou a chave para repositórios ou para o navegador. A chave tem custo/quota da conta responsável. No Sites, configure as três variáveis como segredos de execução e reimplante. O Site inicialmente é privado do proprietário: Arícia precisará receber acesso autorizado para usar a versão hospedada.

## Sem chave

“Experimentar um exemplo sem IA” carrega uma campanha fixa dos panetones, claramente identificada. Não interpreta o formulário. Permite editar, copiar, baixar texto e testar histórico. A geração personalizada com Gemini exige configuração e não foi verificada com uma chave real na entrega.

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

Fotos e documentos anexados são enviados ao Gemini para análise. Esta versão não gera imagens nem publica conteúdo. Os textos, inclusive os gerados pela IA, precisam de revisão. Não divulgar preços. Disponibilidade, sabores e entregas precisam ser confirmados pela Arícia.

## Anexos

O formulário aceita JPG, PNG, WebP, PDF, TXT e CSV (UTF-8), com prévias de fotos e remoção individual. Limites: 5 arquivos, 4 MB por arquivo e 8 MB no total. Word e Excel devem ser exportados para PDF ou CSV; vídeos não são aceitos. O navegador envia `attachments: [{name, mimeType, data}]` com base64 no JSON de `POST /api/generate`. O servidor valida tipo, assinatura básica, codificação e tamanho antes da chamada ao Gemini. Fotos e PDFs seguem como `inlineData`; TXT/CSV seguem como texto. Limite do corpo HTTP: 12 MiB, incluindo a expansão base64.

Os arquivos são processados somente para a geração atual e não são gravados pela aplicação no servidor, no histórico ou nos backups. Apenas nome, tipo e tamanho ficam na campanha salva. Ao reabrir ou recarregar, anexe os originais novamente para outra geração. O tratamento pelo Google segue as condições da conta Gemini utilizada. O botão de exemplo sem IA não analisa anexos. Instruções encontradas em anexos são tratadas como dados, não como comandos.

## Histórico e privacidade

Campanhas, perfil e resultados ficam apenas no localStorage do navegador/dispositivo. Não sincronizam entre dispositivos. Limpar dados do navegador pode apagar o histórico. Use Exportar backup e Importar backup. Chave e código de acesso não são salvos nesse histórico. Não inclua dados de clientes ou informações pessoais sensíveis nos campos. Perfil, briefing e resumo de até cinco campanhas publicadas e geradas com IA são enviados ao Gemini para contextualização. A publicação no Instagram e o registro de métricas são manuais. O exemplo fixo não é usado como histórico de IA.

## Verificações

`npm run check` verifica sintaxe. `npm run build` gera o Worker hospedável em `dist/server/index.js` e copia o manifesto. `node test.mjs` verifica validação e comportamento do servidor sem usar chave real.

Para publicação fora do Sites, use uma hospedagem compatível com Node.js e configure HTTPS, segredos e controle de acesso. A execução local escuta somente no próprio computador. O Worker hospedado depende da autenticação privada do Sites e/ou APP_PASSWORD; não torne o assistente público sem revisar proteção e limites de uso.
