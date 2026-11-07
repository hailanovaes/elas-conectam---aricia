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

O formulário aceita fotos JPG, PNG e WebP, além de PDF, TXT e CSV (UTF-8). Até 5 arquivos, 4 MB por arquivo e 8 MB no total. Word e Excel devem ser exportados para PDF ou CSV. Vídeos não são aceitos. Fotos podem ser exibidas em cada peça, ampliadas e baixadas. Ao salvar a campanha, a associação com a foto fica guardada neste navegador. Documentos não são armazenados. Backups de texto não incluem as fotos: baixe-as separadamente. O botão “Gerar imagem com IA” está integrado à API, mas o teste real retornou cota gratuita zero da conta Google. O responsável deve liberar acesso/cota ao modelo no AI Studio para gerar imagens novas. A publicação é manual. Revise os textos e imagens antes de publicar.

## Histórico e privacidade

Novas campanhas sugerem uma imagem para a capa e para cada card/cena e story, indicando o nome de uma foto anexada adequada ou orientando uma nova captura. As sugestões são editáveis e acompanham os textos ao copiar, baixar ou salvar. Trata-se de orientação visual, não de geração de imagens.

Campanhas, perfil e resultados ficam apenas no localStorage do navegador/dispositivo. Não sincronizam entre dispositivos. Limpar dados do navegador pode apagar o histórico. Use Exportar backup e Importar backup. Chave e código de acesso não são salvos nesse histórico. Não inclua dados de clientes ou informações pessoais sensíveis nos campos. Perfil, briefing e resumo de até cinco campanhas publicadas e geradas com IA são enviados ao Gemini para contextualização. A publicação no Instagram e o registro de métricas são manuais. O exemplo fixo não é usado como histórico de IA.

## Verificações

`npm run check` verifica sintaxe. `npm run build` gera o Worker hospedável em `dist/server/index.js` e copia o manifesto. `node test.mjs` verifica validação e comportamento do servidor sem usar chave real.

Para publicação fora do Sites, use uma hospedagem compatível com Node.js e configure HTTPS, segredos e controle de acesso. A execução local escuta somente no próprio computador. O Worker hospedado depende da autenticação privada do Sites e/ou APP_PASSWORD; não torne o assistente público sem revisar proteção e limites de uso.
