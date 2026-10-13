# Agente local UltraImage (RTX 5070)

Este agente conecta o site ao motor Retrato Local por conexões HTTPS iniciadas pelo seu PC. Não requer abrir portas no roteador, VPN, túnel ou endereço público na rede doméstica. A foto original é baixada por um link temporário privado do Supabase, processada no PC com SeedVR2 7B Sharp em ruído zero e enviada ao armazenamento privado do site.

## Requisitos

- Windows 10/11, driver NVIDIA atualizado e internet.
- Retrato Local já instalado e funcionando com o modelo SeedVR2 7B Sharp baixado.
- Runtime do projeto no Vercel apontando `IMAGE_PROCESSOR=local` e `LOCAL_WORKER_TOKEN` definido com pelo menos 32 caracteres aleatórios.
- Migration `supabase/migrations/003_local_gpu_worker.sql` aplicada ao Supabase antes do deploy do site.

O agente reutiliza `%LOCALAPPDATA%\RetratoLocal\runtime.json`, Python, dependências e pesos existentes. Não baixe nem copie modelos para esta pasta. Fotos locais têm limite de 1,2 MP; a escala é até 4×, limitada pelo plano escolhido no site. O agente usa uma tarefa por vez. Ele fica aguardando trabalhos e retoma as tentativas quando a internet volta.

## Instalação no Windows

1. Na Vercel, defina `IMAGE_PROCESSOR` como `local` e crie `LOCAL_WORKER_TOKEN` com um segredo aleatório forte (mínimo 32 caracteres). Faça novo deploy para ativar.
2. No Supabase SQL Editor, execute uma vez o conteúdo de `supabase/migrations/003_local_gpu_worker.sql`.
3. Copie a pasta `retrato-local-5070` para o PC que tem a RTX 5070.
4. Clique com o botão direito em `Instalar-Agente.bat` → Executar. Informe `https://ultraimageai.com` e o mesmo token configurado na Vercel. O Windows protege o token para a conta atual.
5. Execute `Iniciar-Agente.bat` e mantenha a janela aberta. O agente informa quando está aguardando ou quando conclui uma foto.
6. Envie uma foto pelo site. Deixe o agente e o computador ligados até a página do resultado indicar que terminou.

O mesmo token deve ser configurado no Vercel e no agente. Não o publique no GitHub nem o compartilhe. Se trocar esse segredo na Vercel, execute novamente `Instalar-Agente.bat`.

Para voltar temporariamente ao Replicate, altere `IMAGE_PROCESSOR` para `replicate` (ou remova a variável) e faça redeploy. Depois de contratar o processamento, o agente local pode ser desligado.

## Como desligar

Feche a janela do agente. Quando o PC estiver offline, os trabalhos ficam pendentes e os créditos permanecem reservados até o processamento ou falha. Tarefas interrompidas podem ser retomadas automaticamente quando o prazo de execução expira.

## Limites de custo

O processamento de IA é executado no seu PC, sem chamada ao Replicate. Vercel, Supabase e tráfego do site continuam sujeitos aos limites e políticas dos planos dessas contas. O site mantém a regra de créditos atual; esta integração não altera preços nem dá processamento gratuito a usuários finais.
