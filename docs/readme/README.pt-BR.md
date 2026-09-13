<div align="center">

<img src="../../media/icon.png" width="96" alt="Logo do OpenFiles">

# OpenFiles

### Sua IA escreveu. Seu linter nunca viu.

Claude Code, Codex, Copilot, Gemini CLI e OpenCode editam arquivos direto no disco.<br>
A maioria dos language servers do VS Code só verifica arquivos abertos no editor.<br>
**O OpenFiles abre cada arquivo que seu agente mexe, deixa seus linters rodarem e devolve os problemas para o agente.**

[English](../../README.md) · Português

</div>

---

## Instalação

**VS Code:** [Visual Studio Marketplace](https://marketplace.visualstudio.com/items?itemName=devgiordane.openfiles)<br>
**Cursor, Windsurf, VSCodium, Antigravity, Kiro:** [Open VSX](https://open-vsx.org/extension/devgiordane/openfiles)

```sh
code --install-extension devgiordane.openfiles
```

Depois rode **OpenFiles: Primeiros Passos** na Paleta de Comandos. Leva uns dois minutos.

<details>
<summary><b>Ou cole isto no seu agente</b></summary>

```text
Set up OpenFiles for this repository. Read https://devgiordane.github.io/openfiles/llms.txt,
add the OpenFiles section to AGENTS.md (or CLAUDE.md / GEMINI.md), and tell me to run
"OpenFiles: Install Agent Hooks…" in VS Code. Don't write hook config yourself.
```

</details>

## O problema

Eu vivia fazendo merge de trabalho de agente que ele jurava estar pronto, e aí o CI encontrava os erros de tipo. Os linters estavam instalados. Só nunca olharam.

Os language servers do VS Code são ótimos, e a maioria só verifica arquivos **abertos** por padrão:

- **TypeScript:** erros do projeto inteiro ficam atrás de `typescript.tsserver.experimental.enableProjectDiagnostics`, que vem desligado.
- **ESLint:** verifica o arquivo enquanto você digita nele.
- **Pylance:** `python.analysis.diagnosticMode` vem como `openFilesOnly`.
- **C#:** diagnósticos de analyzers e do compilador vêm como `openFiles`.

Então quando um agente edita vinte arquivos pelo terminal, nada os verifica, e o painel Problemas continua vazio.

| Sem OpenFiles | Com OpenFiles |
|---|---|
| O agente diz "Pronto ✅" | Cada arquivo que o agente escreveu abre numa aba em segundo plano |
| Problemas vazio porque nada está aberto | ESLint, TypeScript, Pylance e companhia verificam esses arquivos |
| Você encontra 3 erros de tipo no CI, ou em produção | A barra lateral **Edições da IA** lista os arquivos com checkbox: `auth.ts 2✕ 1⚠` |
| Você cola os erros no agente na mão | O hook entrega os erros ao agente, que corrige no mesmo turno |

## Funciona com seu agente

| Agente | Detectado por | Problemas devolvidos ao agente |
|---|---|---|
| **Claude Code** | hook `PostToolUse` | ✅ |
| **Codex CLI** | hook `PostToolUse` (lê o `apply_patch`) | ✅ |
| **GitHub Copilot** (CLI e agent mode) | hook `postToolUse` | ✅ |
| **Gemini CLI** | hook `AfterTool` | ✅ |
| **Cursor** | hooks `afterFileEdit` + `postToolUse` | ✅ |
| **Windsurf / Devin Desktop** | hook `post_write_code` (beta) | — |
| **OpenCode** | plugin, `file.edited` (beta) | — |
| **Aider, Goose, Amp, Crush, Qwen Code, Kiro, Cline, qualquer outro** | monitor de arquivos + Git | via `.openfiles/diagnostics.json` |

Hooks são opcionais. Sem eles, o OpenFiles pega toda escrita pelo monitor de arquivos; só não sabe qual agente fez.

**Editores:** VS Code, Cursor, Windsurf, VSCodium, Google Antigravity, Kiro, Trae e Positron. Funciona em qualquer editor baseado no VS Code 1.93 ou mais novo.

## Como funciona

- **Detecção.** Monitor de arquivos, Git (para ignorar troca de branch) e hooks dos agentes. Seus próprios salvamentos, incluindo format-on-save, não contam. Uma rajada de 200 arquivos (instalação, build) é listada, não aberta.
- **Revisão.** A barra lateral agrupa as mudanças por agente, com checkbox por arquivo. **Revisar Próximo Arquivo Alterado** marca o atual como revisado e abre o próximo, com erros primeiro.
- **Retorno.** O hook espera até 4 segundos os diagnósticos assentarem e devolve ao agente no formato que ele espera. Se o VS Code não estiver aberto, o hook sai sem fazer nada. Ele nunca trava o agente.

Tudo fica na sua máquina. Sem telemetria, sem chamadas de rede, sem conta.

## Prompts

**OpenFiles: Copiar um Prompt para o Seu Agente…** traz:

- **Instruções para AGENTS.md / CLAUDE.md.** Uma seção curta dizendo ao agente para ler `.openfiles/diagnostics.json` e corrigir os erros antes de dizer que terminou.
- **Corrigir os problemas nos arquivos editados pela IA**, com `arquivo:linha:coluna`.
- **Trabalhar em passos pequenos.**
- **Escrever a descrição do PR.**
- **Pedir ao agente para configurar o OpenFiles.**

## Documentação

Guias por agente, referência de configurações e a lista de linters para 50 linguagens: **https://devgiordane.github.io/openfiles** (em inglês, com botão "Copy Markdown" em cada página para colar direto no agente).

## Contribuindo

Adicionar um agente geralmente é uma entrada no registro e um teste. Veja [CONTRIBUTING.md](../../CONTRIBUTING.md). Traduções da interface são bem-vindas em `l10n/`.

Se o OpenFiles pegou um erro que seu agente jurava não existir, uma ⭐ ajuda outras pessoas a encontrá-lo.

## Licença

[MIT](../../LICENSE) © Giordane Oliveira
