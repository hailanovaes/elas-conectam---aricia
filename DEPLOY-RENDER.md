# Publicar gratuitamente no Render

O projeto tem site e servidor no mesmo serviço Node.js. Não escolha Static Site.

## Caminho mais curto

1. Crie uma conta em https://dashboard.render.com/register e conecte seu GitHub. Autorize o acesso ao repositório `hailanovaes/elas-conectam---aricia`.
2. Abra https://render.com/deploy?repo=https://github.com/hailanovaes/elas-conectam---aricia
3. Confira o arquivo `render.yaml`, o serviço `brigadeiros-aricia` e o plano **Free**. O nome do serviço e o endereço final podem variar conforme disponibilidade.
4. Quando o Render pedir as variáveis, informe `GEMINI_API_KEY` com a chave real e `APP_PASSWORD` com o código de acesso que Arícia vai usar. Não publique esses valores no GitHub. As outras configurações já estão no arquivo.
5. Confirme a criação do Blueprint e acompanhe o deploy até o estado **Live**. A página de cadastro e seus termos devem ser concluídos pelo titular da conta.
6. Copie o endereço `https://...onrender.com` exibido pelo Render. Esse é o link independente para entregar à Arícia. Nenhum endereço está reservado até o deploy terminar.
7. Abra o link, confira `/healthz` e `/api/status`, e teste a geração de campanha no formulário usando o código escolhido. Não envie a chave da API no campo de código.

## Se preferir cadastrar manualmente

No painel: New → Web Service → repositório do GitHub. Use:

| Campo | Valor |
|---|---|
| Branch | main |
| Runtime | Node |
| Build Command | npm run check && npm test |
| Start Command | node server.mjs |
| Instance Type | Free |
| Health Check Path | /healthz |

Variáveis: `HOST=0.0.0.0`, `NODE_VERSION=24`, `NODE_ENV=production`, `GEMINI_MODEL=gemini-3.1-flash-lite`, `GEMINI_IMAGE_MODEL=gemini-3.1-flash-image`, mais os segredos `GEMINI_API_KEY` e `APP_PASSWORD`.

Não defina PORT manualmente: o Render fornece. `RENDER_EXTERNAL_URL` também é fornecida pelo Render e é usada para reconhecer o endereço HTTPS na validação do servidor. Se usar domínio próprio, defina `PUBLIC_ORIGIN` com a origem HTTPS canônica (sem caminho) e use esse domínio ao acessar o app.

## Limites e dados

O serviço gratuito pausa após 15 minutos sem tráfego e pode levar cerca de um minuto para reativar. Confira as condições atuais em https://render.com/docs/free. A hospedagem gratuita não concede cota ou crédito de IA: os custos e limites do Gemini continuam vinculados à sua conta Google. O modelo de imagens retornou cota gratuita zero no teste feito neste projeto.

Campanhas e fotos continuam no navegador utilizado, não no disco do Render. Ao mudar do endereço antigo para o novo, o navegador usa outro armazenamento. Exporte e importe os textos/resultados, e anexe ou baixe novamente as fotos necessárias: o backup JSON não inclui imagens.

O código de acesso é conferido no servidor. Não coloque chaves no HTML, JS do navegador ou arquivos versionados. Este documento não contém nenhuma credencial.

Após a publicação, atualizações da branch conectada podem ser publicadas automaticamente conforme as configurações do serviço no Render.
