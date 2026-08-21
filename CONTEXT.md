# PDF Studio — contexto técnico completo do estado atual

Este documento descreve o estado atual do aplicativo **PDF Studio** conforme o código do repositório. Ele foi escrito para que outra IA ou pessoa desenvolvedora consiga entender rapidamente a arquitetura, os fluxos, os dados e as limitações reais antes de continuar o desenvolvimento.

> Escopo: este documento descreve o código atual. Não assume funcionalidades que não estejam implementadas.

---

# 1. Visão geral do projeto

O **PDF Studio** é um aplicativo mobile feito com Expo/React Native para criar, organizar, preencher e manipular arquivos PDF. O fluxo mais importante do app é transformar um PDF existente em um **template reutilizável**, posicionar campos sobre esse PDF, preencher esses campos posteriormente e gerar um documento final em PDF.

## Problema que resolve

O app atende cenários em que uma pessoa precisa preencher documentos padronizados repetidamente, como recibos, contratos, declarações, fichas, formulários e documentos administrativos. Em vez de editar manualmente um PDF toda vez, o usuário cria uma estrutura de campos sobre um arquivo base e reutiliza essa estrutura para gerar novos documentos.

## Proposta principal

A proposta central é combinar três capacidades:

1. **Editor de templates**: escolher um PDF base, adicionar campos posicionados visualmente e configurar tipo, estilo e comportamento desses campos.
2. **Preenchimento de templates**: transformar os campos configurados em um formulário, mostrar uma prévia visual do documento e gerar um PDF final.
3. **Ferramentas auxiliares de PDF**: importar PDFs, organizar arquivos, juntar PDFs, dividir PDFs, converter imagens para PDF, compactar PDFs e criar/abrir planilhas vinculadas a templates.

## Casos de uso principais

- Profissionais que preenchem recibos ou declarações repetidamente.
- Pessoas que precisam gerar PDFs com campos padronizados a partir de modelos existentes.
- Usuários que desejam converter imagens em PDF, juntar vários PDFs ou extrair páginas.
- Usuários que querem manter uma biblioteca local de PDFs e planilhas geradas.

## Fluxo principal esperado

```text
Usuário abre o app
        ↓
Cria ou escolhe um template
        ↓
Importa/usa um PDF base
        ↓
Adiciona e configura campos sobre o PDF
        ↓
Salva o template localmente
        ↓
Abre o template para preenchimento
        ↓
Preenche/ajusta valores
        ↓
Confere a prévia
        ↓
Gera e compartilha o PDF final
```

---

# 2. Stack e tecnologias

## Expo

- Dependência: `expo ~55.0.28`.
- Ponto de entrada: `index.ts`, que usa `registerRootComponent(App)`.
- O app usa APIs Expo para arquivos, seleção de documentos/imagens, manipulação de imagem, compartilhamento, impressão/configuração e status bar.
- Configuração principal em `app.json` com nome `PDF Studio`, slug `pdf-studio`, orientação portrait, ícones, splash, Android package e intent filters para PDFs.

## React Native

- Dependência: `react-native 0.83.10`.
- Usado para toda a interface: `View`, `Text`, `Pressable`, `ScrollView`, `FlatList`, `Image`, `Modal`, `TextInput`, `Alert`, `ActivityIndicator`, `PanResponder`, `Animated`.
- O projeto é mobile-first e usa safe area via `react-native-safe-area-context`.

## React e TypeScript

- `react 19.2.0`.
- `typescript ~5.9.2` com `strict: true` em `tsconfig.json`.
- Tipos centrais de templates/campos ficam em `src/types/template.ts`.

## Navegação

- `@react-navigation/native`.
- `@react-navigation/native-stack` para a stack principal em `src/navigation/RootNavigator.tsx`.
- `@react-navigation/bottom-tabs` para as abas inferiores em `src/navigation/BottomTabs.tsx`.
- A navegação principal combina uma stack com uma tela raiz de tabs e várias telas full-screen sem header.

## Estado global

- `zustand` é usado em três stores:
  - `src/store/useEditorstorage.ts`: estado global do editor de templates e histórico Undo/Redo.
  - `src/store/useTemplateFillStore.ts`: sessões temporárias de preenchimento por template.
  - `src/store/useThemeStore.ts`: tema claro/escuro e paleta atual.

## Persistência local

- `@react-native-async-storage/async-storage` armazena metadados e preferências:
  - templates (`@editorpdf:templates`);
  - PDFs conhecidos (`@editorpdf:pdf_files`);
  - pastas (`@editorpdf:pdf_folders`);
  - progresso de leitura (`@editorpdf:reading_progress`);
  - preferências de leitura;
  - planilhas (`@editorpdf:spreadsheets`);
  - tema (`@editorpdf:theme_mode`).
- Arquivos físicos são gravados com `expo-file-system` (`File`, `Directory`, `Paths`) em `Paths.document` ou `Paths.cache`.

## PDF

- `pdf-lib` é usado para:
  - ler PDFs e contar páginas;
  - juntar documentos;
  - extrair páginas;
  - criar PDFs a partir de imagens;
  - criar PDF final a partir de uma captura PNG da prévia preenchida;
  - regravar PDFs na ferramenta de compactação.
- `react-native-view-shot` é usado em `TemplateFillScreen` para capturar a prévia preenchida como PNG antes de embutir essa imagem em um PDF com `pdf-lib`.
- `react-native-webview` é usado pelo motor/visualizador de PDF e rasterização.

## Imagens

- `expo-image-picker` seleciona imagens na ferramenta Converter para PDF.
- `expo-image-manipulator` recorta/gira imagens no modal de edição de imagem e faz rotação rápida.

## Compartilhamento, abertura e intents

- `expo-sharing` compartilha PDFs e planilhas quando disponível.
- `expo-intent-launcher` abre planilhas `.xlsx` no Android com `ACTION_VIEW`.
- `expo-file-system/legacy` é usado para converter URI de arquivo em content URI ao abrir planilhas no Android.

## Planilhas

- `xlsx` (SheetJS) gera workbooks `.xlsx` em base64 a partir das colunas/linhas armazenadas em JSON.
- A persistência de planilhas fica em `src/services/spreadsheetsStorage.ts`.

## Ícones e interface

- `lucide-react-native` fornece os ícones do app.
- `react-native-safe-area-context` fornece `SafeAreaProvider` no `App.tsx` e `useSafeAreaInsets` nas telas.

---

# 3. Estrutura do projeto

```text
.
├── App.tsx
├── index.ts
├── app.json
├── eas.json
├── package.json
├── assets/
│   ├── icon.png
│   ├── logo.png
│   └── ...
└── src/
    ├── components/
    │   ├── FieldEditorSheet.tsx
    │   ├── FieldOverlay.tsx
    │   ├── FieldTypePicker.tsx
    │   ├── FolderEditorModal.tsx
    │   ├── ImageEditModal.tsx
    │   ├── MergePreviewModal.tsx
    │   ├── PageJumpModal.tsx
    │   ├── PdfEngine.tsx
    │   ├── PdfPageRasterizer.tsx
    │   ├── PdfThumbnail.tsx
    │   ├── PdfZoomModal.tsx
    │   ├── ReadingSettingsModal.tsx
    │   ├── SliderBar.tsx
    │   ├── SpreadsheetLinkModal.tsx
    │   ├── TemplatePreviewModal.tsx
    │   ├── ToolSidebar.tsx
    │   ├── TutorialModal.tsx
    │   └── ZoomablePdfView.tsx
    ├── constants/
    │   ├── fieldTypes.ts
    │   ├── theme.ts
    │   └── tutorials.ts
    ├── navigation/
    │   ├── BottomTabs.tsx
    │   └── RootNavigator.tsx
    ├── screens/
    │   ├── CompressPdfScreen.tsx
    │   ├── ConvertToPdfScreen.tsx
    │   ├── FileScreen.tsx
    │   ├── HomeScreen.tsx
    │   ├── MergePdfScreen.tsx
    │   ├── PdfViewerScreen.tsx
    │   ├── PlaceholderScreen.tsx
    │   ├── SettingsScreen.tsx
    │   ├── SplitPdfScreen.tsx
    │   ├── TemplateEditorScreen.tsx
    │   ├── TemplateFillScreen.tsx
    │   ├── TemplatesScreen.tsx
    │   └── ToolsScreen.tsx
    ├── services/
    │   ├── pdfFileIO.ts
    │   ├── pdfFilesStorage.ts
    │   ├── pdfFoldersStorage.ts
    │   ├── pdfReadingProgress.ts
    │   ├── spreadsheetsStorage.ts
    │   └── templateStorage.ts
    ├── store/
    │   ├── useEditorstorage.ts
    │   ├── useTemplateFillStore.ts
    │   └── useThemeStore.ts
    ├── types/
    │   └── template.ts
    └── utils/
        ├── autoIncrement.ts
        ├── dateFormat.ts
        ├── masks.ts
        ├── numberToWords.ts
        └── xlsxBuilder.ts
```

## Responsabilidades por pasta

- `components/`: componentes reutilizáveis ou modais complexos. Inclui editor de propriedades de campo, overlay de campos no PDF, modais de planilha, visualização, rasterização e zoom.
- `screens/`: telas navegáveis do app. Cada tela coordena estado local, serviços e componentes.
- `services/`: camada de persistência e I/O. Lê/escreve AsyncStorage, arquivos locais, PDFs e planilhas.
- `store/`: stores Zustand para estados globais/temporários.
- `types/`: modelos centrais compartilhados.
- `utils/`: funções puras de formatação, máscaras, números por extenso, auto incremento e construção de XLSX.
- `constants/`: tema, tipos de campos e tutoriais.
- `navigation/`: configuração de stack e tabs.

## Arquivos centrais

- `src/types/template.ts`: contrato de dados para templates e campos.
- `src/screens/TemplateEditorScreen.tsx`: criação/edição visual de templates.
- `src/screens/TemplateFillScreen.tsx`: preenchimento, prévia e geração final do PDF.
- `src/store/useEditorstorage.ts`: estado global do editor e Undo/Redo.
- `src/store/useTemplateFillStore.ts`: persistência temporária do preenchimento durante navegação.
- `src/services/templateStorage.ts`: persistência local de templates e imagem base.
- `src/components/FieldOverlay.tsx`: arraste/redimensionamento de campos no canvas.
- `src/components/FieldEditorSheet.tsx`: edição de propriedades dos campos.

---

# 4. Navegação e telas

## Estrutura geral

`App.tsx` envolve o app em `SafeAreaProvider`, configura `StatusBar` conforme o tema e renderiza `RootNavigator`.

`RootNavigator` define uma stack nativa com:

- `MainTabs` como tela principal sem header;
- telas full-screen para editor, preenchimento, visualizador e ferramentas de PDF.

`BottomTabs` define cinco abas:

1. Home (`HomeTab`)
2. Templates (`Templates`)
3. Arquivos (`Files`)
4. Ferramentas (`Tools`)
5. Configurações (`SettingsTab`)

A barra inferior usa `useSafeAreaInsets` para ajustar altura e padding inferior.

## Telas

### HomeScreen (`src/screens/HomeScreen.tsx`)

- **Objetivo**: tela inicial com ações rápidas e templates recentes.
- **Como chega**: aba Home.
- **Recebe dados**: nenhum parâmetro de rota.
- **Carrega**: até 4 templates recentes via `getAllTemplates()` em `useFocusEffect`.
- **Ações**:
  - Criar Template → `TemplateEditor` sem `templateId`.
  - Preencher Template → se houver templates, navega para aba Templates; senão alerta.
  - Converter Arquivo → `ConvertToPdf`.
  - Juntar PDFs → `MergePdf`.
  - Abrir PDF → aba Files.
  - Tocar em template recente → `TemplateFill` com `templateId`.

### TemplatesScreen (`src/screens/TemplatesScreen.tsx`)

- **Objetivo**: listar, buscar, criar, preencher e editar templates.
- **Como chega**: aba Templates ou navegação a partir de Home.
- **Carrega**: todos os templates, ordenados por `updatedAt` desc.
- **Ações**:
  - Novo Template → `TemplateEditor` sem `templateId`.
  - Buscar templates por nome.
  - Tocar no card → `TemplateFill` com `templateId`.
  - Tocar em Editar → `TemplateEditor` com `templateId`.

### TemplateEditorScreen (`src/screens/TemplateEditorScreen.tsx`)

- **Objetivo**: criar ou editar um template visualmente.
- **Como chega**: Home, Templates ou Tools.
- **Recebe dados**: opcional `templateId`.
- **Ações**:
  - Selecionar PDF base.
  - Renderizar/rasterizar a primeira página do PDF.
  - Adicionar campos sobre o documento.
  - Mover/redimensionar campos.
  - Editar propriedades em bottom sheet.
  - Duplicar/remover campos.
  - Undo/Redo.
  - Ver prévia.
  - Vincular planilha.
  - Salvar template.
- **Navegação de saída**: `navigation.goBack()` ao cancelar/salvar.

### TemplateFillScreen (`src/screens/TemplateFillScreen.tsx`)

- **Objetivo**: preencher um template e gerar PDF final.
- **Como chega**: TemplatesScreen, HomeScreen recentes.
- **Recebe dados**: `templateId` obrigatório.
- **Carrega**:
  - template via `getTemplateById`;
  - sessão temporária do preenchimento por `useTemplateFillStore`;
  - planilha vinculada via `getSpreadsheetByTemplateId`.
- **Ações**:
  - Preencher campos.
  - Editar datas automáticas pré-preenchidas.
  - Selecionar mês em modal.
  - Editar textos fixos.
  - Ver prévia ao vivo.
  - Definir nome do arquivo final.
  - Gerar e compartilhar PDF.
  - Opcionalmente adicionar linha em planilha vinculada.

### FileScreen (`src/screens/FileScreen.tsx`)

- **Objetivo**: gerenciar PDFs e planilhas locais.
- **Como chega**: aba Arquivos ou Home “Abrir PDF”.
- **Carrega**: PDFs, pastas e planilhas em `useFocusEffect`.
- **Ações para PDFs**:
  - Importar PDF.
  - Abrir PDF no visualizador.
  - Favoritar.
  - Renomear.
  - Excluir.
  - Compartilhar.
  - Mover para pasta.
  - Criar/editar/excluir pastas.
  - Alternar lista/grade.
  - Filtrar por todos/recentes/favoritos.
- **Ações para planilhas**:
  - Alternar para aba Planilhas interna.
  - Abrir planilha com app externo no Android via intent ou compartilhar no iOS.
  - Compartilhar, renomear ou excluir planilha.

### PdfViewerScreen (`src/screens/PdfViewerScreen.tsx`)

- **Objetivo**: visualizar PDFs.
- **Como chega**: FileScreen ao abrir PDF.
- **Recebe dados**: `uri` e `name`.
- **Funcionalidades reais no código**:
  - Usa componentes de visualização/rasterização de PDF.
  - Persiste última página lida por URI via `pdfReadingProgress`.
  - Oferece configurações de leitura como tema e brilho por overlay.
  - Usa modais como PageJump, ReadingSettings e PdfZoom.

### ToolsScreen (`src/screens/ToolsScreen.tsx`)

- **Objetivo**: central de ferramentas PDF.
- **Como chega**: aba Ferramentas.
- **Ações**:
  - Juntar PDFs → `MergePdf`.
  - Converter para PDF → `ConvertToPdf`.
  - Criar Template → `TemplateEditor`.
  - Dividir PDF → `SplitPdf`.
  - Compactar PDF → `CompressPdf`.
  - Favoritar ferramentas localmente em estado da tela. Esse favorito não é persistido.

### MergePdfScreen (`src/screens/MergePdfScreen.tsx`)

- **Objetivo**: juntar vários PDFs em um único PDF.
- **Como chega**: Tools/Home.
- **Ações**:
  - Selecionar múltiplos PDFs via DocumentPicker.
  - Reordenar itens.
  - Gerar PDF combinado com `pdf-lib`.
  - Mostrar prévia/nome via `MergePreviewModal`.
  - Salvar arquivo gerado em storage gerenciado e compartilhar.

### ConvertToPdfScreen (`src/screens/ConvertToPdfScreen.tsx`)

- **Objetivo**: converter imagens em PDF.
- **Como chega**: Tools/Home.
- **Ações**:
  - Selecionar múltiplas imagens.
  - Remover imagens.
  - Girar rapidamente.
  - Editar imagem em `ImageEditModal`.
  - Montar PDF com uma imagem por página.
  - Pré-visualizar e compartilhar.

### SplitPdfScreen (`src/screens/SplitPdfScreen.tsx`)

- **Objetivo**: extrair páginas específicas de um PDF para um novo PDF.
- **Como chega**: Tools.
- **Ações**:
  - Selecionar PDF.
  - Informar páginas/intervalos.
  - Criar novo PDF com `copyPages` do `pdf-lib`.
  - Salvar/compartilhar resultado.

### CompressPdfScreen (`src/screens/CompressPdfScreen.tsx`)

- **Objetivo**: regravar PDF com opções simples de compactação estrutural.
- **Como chega**: Tools.
- **Ações**:
  - Selecionar PDF.
  - Limpar metadados básicos.
  - Salvar com `useObjectStreams: true`.
  - Mostrar tamanho antes/depois e compartilhar.

### SettingsScreen (`src/screens/SettingsScreen.tsx`)

- **Objetivo**: configurações, tema, tutoriais e reset de dados.
- **Como chega**: aba Configurações.
- **Ações**:
  - Alternar tema claro/escuro.
  - Abrir tutoriais em `TutorialModal`.
  - Resetar templates via `resetAllTemplates`.

### PlaceholderScreen (`src/screens/PlaceholderScreen.tsx`)

- Tela simples placeholder para funcionalidades não implementadas ou removidas de fluxos principais.

---

# 5. Fluxos completos do usuário

## 5.1 Criar template

1. O usuário inicia em Home, Templates ou Ferramentas.
2. Navega para `TemplateEditor` sem `templateId`.
3. `TemplateEditorScreen` chama `reset()` do `useEditorStore` no `useEffect` de inicialização quando não há `templateId`.
4. A tela mostra estado vazio com botão “Selecionar Arquivo”.
5. O usuário escolhe um PDF com `DocumentPicker.getDocumentAsync({ type: 'application/pdf', copyToCacheDirectory: true })`.
6. O arquivo selecionado é lido como base64 com `new File(asset.uri).base64()`.
7. `PdfPageRasterizer` recebe o PDF em base64 e retorna uma imagem `imageDataUri` e dimensões (`pageWidth`, `pageHeight`).
8. `handleRendered` salva a imagem renderizada e chama `setPdfSource(imageDataUri, w, h)` no store do editor.
9. O usuário usa a toolbar inferior (`ToolSidebar`) para escolher “Adicionar”.
10. Ao tocar no canvas, `handleCanvasTap` converte o ponto tocado da tela para coordenadas do PDF: `locationX / scale`, `locationY / scale`.
11. `FieldTypePicker` abre e o usuário escolhe o tipo do campo.
12. `buildDefaultField` cria um `TemplateField` com:
    - id gerado por timestamp + random;
    - tipo escolhido;
    - configurações padrão específicas do tipo;
    - posição inicial centralizada no toque;
    - estilo padrão.
13. `addField` adiciona o campo ao store e também grava histórico para Undo.
14. O usuário pode editar propriedades em `FieldEditorSheet`.
15. Para salvar, o usuário informa/ajusta nome do template e toca em “Salvar”.
16. `handleSave` chama `saveTemplate` com id efetivo, nome, `pdfUri`, `pageWidth`, `pageHeight`, campos e timestamps.
17. `templateStorage.saveTemplate` persiste a imagem base em arquivo se ela estiver como `data:image/...;base64,...` e salva os metadados no AsyncStorage.

## 5.2 Editar template

1. O usuário toca em “Editar” no card de um template em TemplatesScreen.
2. A navegação abre `TemplateEditor` com `templateId`.
3. `TemplateEditorScreen` busca o template por `getTemplateById(templateId)`.
4. Se encontrado, chama `loadFromTemplate` no `useEditorStore` com nome, URI, dimensões e campos.
5. `renderedImage` é definido como `t.pdfUri`, que é a imagem base persistida.
6. Os campos são renderizados com `FieldOverlay` sobre a imagem.

### Seleção

- Cada `FieldOverlay` recebe `selected={selectedFieldId === field.id}`.
- A seleção é feita por callbacks para `selectField`.
- Dependendo da ferramenta ativa, um toque pode selecionar, editar ou excluir.

### Mover campo

- Ferramenta ativa: `move`.
- `FieldOverlay` usa `PanResponder`.
- Durante o arraste, estado local `drag` altera visualmente a posição sem atualizar o store global a cada movimento.
- Ao soltar, `commit` calcula delta em pontos do PDF: `dxScreen / (scale * zoomScale)` e `dyScreen / (scale * zoomScale)`.
- `TemplateEditorScreen.handleMoveField` chama `updateField` com nova posição.
- `updateField` salva um único estado no histórico.

### Redimensionar campo

- Ferramenta ativa: `resize`.
- `FieldOverlay` exibe quatro handles quando o campo está selecionado.
- Durante o gesto, a UI local mostra o tamanho temporário.
- Ao soltar, calcula `dw`, `dh`, `dx`, `dy` em pontos do PDF, respeitando mínimos `MIN_WIDTH = 40` e `MIN_HEIGHT = 16`.
- `updateField` atualiza posição/tamanho no store e registra um único histórico.

### Propriedades editáveis

`FieldEditorSheet` permite alterar:

- nome interno (`internalName`);
- tipo de dado;
- texto padrão para `textoFixo`;
- configuração de valor (`showSymbol`);
- configuração de auto incremento (`digits`, `startAt`);
- vínculo de `valorPorExtenso` com campo de valor;
- configuração de data (`parts`, `monthFormat`, `yearFormat`, `auto`);
- obrigatório (`required`);
- fonte, tamanho, cor, negrito, itálico, alinhamento;
- largura e altura em pixels/pontos do documento.

### Criar novo campo

- Ferramenta “Adicionar” → toque no canvas → `FieldTypePicker` → `addField`.
- O novo campo é selecionado automaticamente.

### Remover campo

- Ferramenta “Excluir” e toque no campo, ou botão de lixeira no `FieldEditorSheet`.
- A remoção passa por `Alert.alert` de confirmação.
- `deleteField` remove do store, limpa seleção se necessário e registra histórico.

### Undo/Redo

- Botões de Undo/Redo ficam na linha superior do editor junto da prévia e planilha.
- `undo` e `redo` vêm do `useEditorStore`.
- Mais detalhes na seção 14.

### Salvar edição

- `handleSave` cria objeto `Template` e chama `saveTemplate`.
- Observação real do código: ao salvar, `createdAt` e `updatedAt` são definidos como `now` mesmo ao editar template existente; ou seja, `createdAt` original não é preservado na implementação atual.

### Área de ferramentas

- `ToolSidebar` atualmente é uma barra inferior horizontal com `ScrollView`.
- Ferramentas disponíveis: Adicionar, Mover, Redimensionar, Editar, Excluir.
- A tela envolve a toolbar com `paddingBottom: insets.bottom` para respeitar safe area.

## 5.3 Preencher template

1. O usuário escolhe um template em TemplatesScreen/Home.
2. A navegação abre `TemplateFill` com `templateId`.
3. `TemplateFillScreen` carrega o template com `getTemplateById`.
4. Carrega a sessão temporária com `useTemplateFillStore.getSession(templateId)`.
5. `initialValuesForTemplate` cria valores padrão para:
   - `textoFixo`: `defaultText`;
   - `autoIncremento`: próximo número formatado;
   - `data` automática: data atual em valor bruto completo.
6. Valores de sessão existentes têm prioridade sobre defaults: `return { ...defaults, ...existingValues }`.
7. A tela renderiza uma seção de formulário e uma prévia visual.

### Como os campos viram formulário

- A tela itera `template.fields.map`.
- `autoIncremento` é tratado como read-only em uma caixa “Automático”.
- `valorPorExtenso` vinculado a um campo de valor aparece como derivado em caixa “Vinculado”.
- `data` usa `renderDateInput`.
- Os demais usam `TextInput`.

### Campos de texto

- `texto`: input de linha única.
- `textoMultilinha`: input multiline com `numberOfLines={4}` e `minHeight`.
- `textoFixo`: aparece como input editável com valor inicial vindo de `defaultText`, sem alterar o template salvo.

### Campos numéricos e máscaras

- `numero`, `valor`, `numeroPorExtenso`, CPF, CNPJ e telefone usam `keyboardType='numeric'` quando aplicável.
- `valor` aplica máscara monetária em centavos e resolve para `R$ valor` se `showSymbol` estiver ativo.
- CPF, CNPJ e telefone usam máscaras em `src/utils/masks.ts`.

### Datas

`DateConfig` define:

```ts
{
  parts: Array<'dia' | 'mes' | 'ano'>;
  monthFormat: 'numero' | 'nome' | 'abreviado';
  yearFormat?: 'completo' | 'doisDigitos';
  auto: boolean;
}
```

- `parts` pode ser uma parte isolada (`dia`, `mes`, `ano`) ou data completa (`dia`, `mes`, `ano`).
- `monthFormat` controla saída do mês.
- `yearFormat` controla exibição do ano completo ou com dois dígitos.
- `auto` indica se o default inicial vem da data atual.

### Data automática

- Ao abrir o preenchimento, `initialValuesForTemplate` usa `rawValueFromDate` para gerar o valor bruto atual.
- Esse valor bruto é editável no formulário.
- A alteração feita no preenchimento fica em `values` e em `useTemplateFillStore`.
- A configuração original do template continua com `dateConfig.auto` inalterado.

### Seleção manual de mês

- Para data completa, o formulário mostra três controles: dia, seletor de mês e ano.
- Para campo apenas de mês, o formulário mostra um pressable que abre modal.
- O modal usa `MONTH_OPTIONS`, derivado dos 12 nomes de meses.
- Ao escolher mês, `setDatePart(field, 'mes', value)` atualiza o valor bruto.

### Ano com 2 ou 4 dígitos

- O usuário configura no editor (`FieldEditorSheet`) como `yearFormat`.
- Internamente o valor bruto continua aceitando até 4 dígitos (`maskYear` limita a 4).
- Na saída final, `formatDateValue` usa `formatYear` para mostrar `2026` ou `26`.
- A informação não é reduzida no armazenamento temporário; a redução é só formatação.

### Valores temporários e persistência de preenchimento

- `values` é estado local da tela.
- Toda alteração via `setValue` também chama `persistValue(templateId, fieldId, text)` no `useTemplateFillStore`.
- O nome do arquivo também é preservado por `persistFileName`.
- As sessões são indexadas por `templateId`, evitando misturar valores entre templates.
- Essa persistência é em memória (Zustand), não AsyncStorage. Sobrevive à navegação dentro do app enquanto o processo JS estiver vivo, mas não é persistência permanente após encerramento do app.
- O store possui `clearSession`, mas `TemplateFillScreen` atual não chama essa função após gerar documento. Portanto, no código atual, a sessão não é descartada automaticamente depois da geração.

## 5.4 Gerar documento final

1. Usuário toca em “Concluir”.
2. Abre modal para nome do arquivo.
3. Usuário toca em “Gerar e Compartilhar”.
4. `handleConfirmGenerate` chama `viewShotRef.current.capture()` para capturar a prévia visual como PNG.
5. O PNG é lido com `new File(shotUri).bytes()`.
6. Um novo `PDFDocument` é criado com `pdf-lib`.
7. O PNG capturado é embutido com `embedPng`.
8. É criada uma página com as dimensões reais do template: `[template.pageWidth, template.pageHeight]`.
9. A imagem é desenhada ocupando toda a página: `x: 0, y: 0, width: pageWidth, height: pageHeight`.
10. O PDF é salvo em bytes.
11. O arquivo final é escrito em `Paths.cache` com nome sanitizado.
12. Se houver campo `autoIncremento`, o template salvo é atualizado com `autoIncrementCounter: usedRaw + 1`.
13. Se houver planilha vinculada e opção marcada, é adicionada uma linha via `appendSpreadsheetRow`.
14. O app tenta compartilhar com `Sharing.shareAsync` usando MIME `application/pdf`.
15. Se compartilhamento não estiver disponível, mostra alerta com URI.

### Aplicação visual dos valores

A prévia é um `ViewShot` que contém:

- a imagem base do template (`Image` com `template.pdfUri`);
- um `Text` absoluto para cada campo.

Cada campo é renderizado com:

```text
left = field.position.x * scale
top = field.position.y * scale
width = field.position.width * scale
height = field.position.height * scale
fontSize = field.style.fontSize * scale
```

Como o PDF final é uma imagem da prévia inteira, os textos não são objetos textuais editáveis no PDF final; eles são rasterizados dentro da imagem capturada.

---

# 6. Sistema de templates

## Interfaces reais simplificadas

```ts
type FieldType =
  | 'texto'
  | 'textoFixo'
  | 'numero'
  | 'valor'
  | 'valorPorExtenso'
  | 'numeroPorExtenso'
  | 'autoIncremento'
  | 'data'
  | 'hora'
  | 'cpf'
  | 'cnpj'
  | 'telefone'
  | 'textoMultilinha';

interface Template {
  id: string;
  name: string;
  pdfUri: string;
  pageWidth: number;
  pageHeight: number;
  fields: TemplateField[];
  createdAt: number;
  updatedAt: number;
  autoIncrementCounter?: number;
}

interface TemplateField {
  id: string;
  internalName: string;
  type: FieldType;
  position: { x: number; y: number; width: number; height: number };
  style: FieldStyle;
  required: boolean;
  placeholder?: string;
  defaultText?: string;
  maxLines?: number;
  dateConfig?: DateConfig;
  valorConfig?: ValorConfig;
  linkedValorFieldId?: string | null;
  autoIncrementConfig?: AutoIncrementConfig;
}
```

## Campos do template

- `id`: identifica o template.
- `name`: nome visível.
- `pdfUri`: URI da imagem base renderizada do PDF, não necessariamente o PDF original.
- `pageWidth` e `pageHeight`: dimensões em pontos/unidade do PDF retornadas pela rasterização.
- `fields`: lista de campos posicionados.
- `createdAt`, `updatedAt`: timestamps.
- `autoIncrementCounter`: contador global do template para o próximo número automático usado.

## Persistência

`templateStorage.ts` usa:

- AsyncStorage key `@editorpdf:templates` para metadados.
- Diretório `Paths.document/template-images` para imagens base quando o template contém data URI.

O serviço evita salvar base64 grande diretamente no AsyncStorage porque Android/SQLite pode estourar limite por linha. Se `pdfUri` começa com `data:`, a imagem é extraída e escrita como arquivo. O JSON salva apenas `file://...`.

---

# 7. Sistema de campos

Todos os tipos vêm de `FieldType` e aparecem em `FIELD_TYPE_OPTIONS` para criação.

## Propriedades comuns

Todos os campos possuem:

- `id`;
- `internalName`;
- `type`;
- `position`;
- `style`;
- `required`.

`style` inclui fonte, tamanho, cor, negrito, itálico e alinhamento.

## `texto`

- Campo preenchível de linha única.
- Criado via picker de tipos.
- No editor aparece como overlay com nome interno.
- No preenchimento aparece como `TextInput` normal.
- No PDF final renderiza exatamente o valor digitado.

## `textoFixo`

- Texto criado no template com `defaultText`.
- Conceitualmente é texto inicial do documento, mas editável durante preenchimento.
- No editor, `FieldEditorSheet` mostra “Texto inicial no template”.
- No preenchimento, começa com `defaultText` e pode ser alterado.
- A alteração não muda o template salvo; fica apenas na sessão de preenchimento.

## `textoMultilinha`

- Campo textual com múltiplas linhas.
- No preenchimento usa `TextInput multiline` com altura mínima.
- Na prévia/final usa `numberOfLines={maxLines ?? 4}`.

## `numero`

- Campo numérico simples.
- Usa teclado numérico.
- Não há máscara além do keyboard type.
- Valor final é o texto digitado.

## `valor`

- Campo monetário.
- Usa máscara `maskCurrency`, interpretando os dígitos como centavos.
- Configuração `valorConfig.showSymbol` controla prefixo `R$`.
- Valor final inclui ou não o símbolo conforme configuração.

## `valorPorExtenso`

- Converte valor monetário em texto por extenso.
- Pode ser preenchido manualmente ou vinculado a um campo `valor` por `linkedValorFieldId`.
- Quando vinculado, a tela mostra caixa “Vinculado” e o usuário não digita diretamente nesse campo.
- Usa `currencyToWords`.

## `numeroPorExtenso`

- Converte número inteiro em texto por extenso.
- Usa `plainNumberToWords`.
- Limitação real: conversão de número base suporta até 999.999.999; acima disso retorna número cru.

## `autoIncremento`

- Campo automático/read-only no preenchimento.
- Configuração `digits` define zeros à esquerda.
- Configuração `startAt` define início.
- `nextAutoIncrementNumber` considera `template.autoIncrementCounter` e `startAt`.
- Ao gerar PDF, o template é salvo com contador incrementado.
- No código atual, se houver mais de um campo `autoIncremento`, apenas o primeiro é usado para avançar contador.

## `data`

- Campo de data configurável.
- Pode representar dia, mês, ano ou data completa.
- Mês pode sair como número, nome ou abreviado.
- Ano pode sair completo ou dois dígitos.
- Pode ser automático, mas ainda editável no preenchimento.
- O mês é selecionado por modal quando o campo inclui mês.

## `hora`

- Campo textual com placeholder `HH:MM`.
- Não há máscara específica implementada para hora no código atual.

## `cpf`

- Campo com máscara `000.000.000-00`.
- Usa teclado numérico.

## `cnpj`

- Campo com máscara `00.000.000/0000-00`.
- Usa teclado numérico.

## `telefone`

- Campo com máscara para telefone de 10 ou 11 dígitos.
- Usa teclado numérico.

## Diferenças conceituais

- **Preenchíveis**: `texto`, `textoMultilinha`, `numero`, `valor`, `numeroPorExtenso`, CPF, CNPJ, telefone, hora, datas não-read-only e `textoFixo` no preenchimento.
- **Automáticos**: `autoIncremento`; datas automáticas têm default automático, mas são editáveis.
- **Derivados**: `valorPorExtenso` quando vinculado a campo de valor.
- **Texto fixo editável**: `textoFixo` tem default salvo no template, mas valor temporário no preenchimento.

---

# 8. Coordenadas, escala e posicionamento

## Sistema de coordenadas

O template armazena posições em coordenadas do documento/base, não em pixels reais da tela. Cada campo tem:

```ts
position: {
  x: number;
  y: number;
  width: number;
  height: number;
}
```

## Escala no editor e preenchimento

A escala básica é calculada com:

```text
displayWidth = SCREEN_WIDTH - spacing.md * 2
scale = pageWidth ? displayWidth / pageWidth : 1
displayHeight = pageHeight * scale
```

No editor, a imagem é exibida com `width: displayWidth` e `height: pageHeight * scale`. Os campos são posicionados multiplicando `position` por `scale`.

No preenchimento, a prévia usa a mesma lógica.

## Adição de campos

Ao tocar na tela para adicionar campo:

```text
xDocumento = locationX / scale
yDocumento = locationY / scale
```

O campo nasce centralizado nesse ponto com tamanho padrão de `120 x 24`.

## Movimento e redimensionamento

`FieldOverlay` precisa lidar com zoom. Durante commit do gesto:

```text
effectiveScale = scale * zoomScale
dxDocumento = dxTela / effectiveScale
dyDocumento = dyTela / effectiveScale
```

Assim, quando o usuário está com zoom, o delta visual é convertido para o delta correto no documento.

## Zoom

`ZoomablePdfView` implementa pinch e pan com `PanResponder` + `Animated`.

- Zoom mínimo: 1.
- Zoom máximo: 4.
- Pan só existe quando zoom > 1.
- O deslocamento é limitado por `maxOffset(dimension, scale) = (dimension * (scale - 1)) / 2`.

## Orientação e múltiplas páginas

- `app.json` fixa orientação portrait.
- O sistema de template atual trabalha com uma única página/imagem base. `PdfPageRasterizer` rasteriza uma página para o editor; não há fluxo de template multi-página completo no código atual.
- Ferramentas como merge/split lidam com PDFs multi-página, mas o editor de template não oferece edição de múltiplas páginas.

## Pontos frágeis

- O PDF final do preenchimento é uma imagem rasterizada da prévia, não texto vetorial pesquisável/selecionável.
- A precisão depende da captura do `ViewShot` e da escala visual.
- A implementação assume uma página base por template.
- `SCREEN_WIDTH` é calculado fora do componente; mudanças de orientação/tamanho durante runtime podem não recalcular automaticamente em todos os casos.

---

# 9. Estado da aplicação

## Estado local

As telas usam `useState` para estados de UI:

- modais abertos;
- loading;
- listas carregadas;
- texto de busca;
- itens selecionados;
- campos temporários de formulários.

## Zustand

### `useEditorStore`

Guarda estado global do editor:

```text
templateId
templateName
pdfUri
pageWidth/pageHeight
fields
selectedFieldId
pastFields/futureFields
```

Também expõe ações para adicionar, atualizar, excluir, selecionar, carregar template, resetar, undo e redo.

### `useTemplateFillStore`

Guarda sessões temporárias em memória:

```ts
sessions: Record<templateId, { values: Record<fieldId, string>; fileName?: string }>
```

É usado para preservar preenchimento ao navegar pelo app.

### `useThemeStore`

Guarda tema atual (`light` ou `dark`), paleta de cores e flag `hydrated`. Persiste preferência em AsyncStorage.

## Ciclo de vida do preenchimento

```text
Template salvo no AsyncStorage + imagem em arquivo
        ↓
Usuário abre TemplateFill(templateId)
        ↓
Tela busca template e sessão temporária
        ↓
Defaults são calculados para texto fixo, auto incremento e data automática
        ↓
Valores da sessão sobrescrevem defaults
        ↓
Usuário edita campos
        ↓
Estado local values e useTemplateFillStore são atualizados
        ↓
Usuário navega para outra tela
        ↓
Store em memória mantém sessão por templateId
        ↓
Usuário volta ao mesmo template
        ↓
Sessão é reaplicada
        ↓
Documento é gerado
        ↓
No código atual, sessão não é limpa automaticamente
```

## Ciclo de vida do editor

```text
Abrir editor sem templateId
        ↓
reset() limpa store do editor
        ↓
Selecionar PDF e rasterizar
        ↓
setPdfSource salva imagem/dimensões
        ↓
add/update/delete modificam fields e histórico
        ↓
Salvar chama saveTemplate
```

```text
Abrir editor com templateId
        ↓
getTemplateById carrega template
        ↓
loadFromTemplate popula store e limpa histórico
        ↓
Usuário edita campos
        ↓
Salvar sobrescreve template no storage
```

---

# 10. Persistência e arquivos

## Templates

- Metadados: AsyncStorage `@editorpdf:templates`.
- Imagens base: `Paths.document/template-images/{templateId}.{ext}` quando necessário.
- `deleteTemplate` remove a imagem associada se `pdfUri` for `file://`.
- `resetAllTemplates` remove a pasta de imagens e a chave de templates.

## PDFs gerenciados

- Metadados: AsyncStorage `@editorpdf:pdf_files`.
- Arquivos importados/gerados: `Paths.document/{id}.pdf`.
- `registerPdfFile` cria/atualiza entrada.
- `deletePdfFile` remove arquivo físico se for `file://`.

## Pastas

- AsyncStorage `@editorpdf:pdf_folders`.
- Pastas são metadados; arquivos referenciam `folderId`.
- Ao excluir pasta, FileScreen chama `clearFolderFromFiles` antes de `deleteFolder`, movendo arquivos para raiz.

## Planilhas

- JSON fonte da verdade: AsyncStorage `@editorpdf:spreadsheets`.
- Arquivos `.xlsx`: `Paths.document/template-spreadsheets/{spreadsheetId}.xlsx`.
- Toda alteração de configuração ou linhas regenera o arquivo inteiro.

## Arquivos temporários

- PDFs finais gerados por preenchimento de template são escritos em `Paths.cache` e compartilhados. Eles não são registrados na aba Arquivos pelo fluxo atual de `TemplateFillScreen`.
- PDFs gerados por ferramentas via `saveGeneratedPdf` são salvos em `Paths.document` e registrados na aba Arquivos.

## Persistência do preenchimento

- Em memória via Zustand, não AsyncStorage.
- Não há limpeza automática na geração do documento.

## Possíveis problemas de armazenamento reais

- O código já reconhece risco de AsyncStorage no Android para linhas grandes e evita base64 de template em JSON.
- Planilhas guardam todas as linhas também em AsyncStorage; se muitas linhas forem geradas, a chave `@editorpdf:spreadsheets` pode crescer bastante.

---

# 11. Permissões e integração com o dispositivo

## Seleção de arquivos

- PDFs são escolhidos por `expo-document-picker`.
- `copyToCacheDirectory: true` é usado em importação e ferramentas.
- Tipos MIME para PDF: `application/pdf`.

## Seleção de imagens

- `expo-image-picker` abre biblioteca de imagens com múltipla seleção.
- `mediaTypes: ImagePicker.MediaTypeOptions.Images`.

## Compartilhamento

- `expo-sharing` é usado para PDFs e XLSX.
- O código sempre verifica `Sharing.isAvailableAsync()` antes de compartilhar.
- PDFs usam MIME `application/pdf`.
- Planilhas usam MIME `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`.

## Android intents

`app.json` registra intent filters para PDFs:

- `VIEW` com `application/pdf` em schemes `content` e `file`.
- `SEND` com `application/pdf`.
- `SEND_MULTIPLE` com `application/pdf`.

No FileScreen, planilhas no Android são abertas com:

```text
IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
  data: contentUri,
  flags: 1,
  type: XLSX_MIME,
})
```

`flags: 1` corresponde ao grant de permissão de leitura.

## Safe area

- `SafeAreaProvider` fica no `App.tsx`.
- Telas usam `paddingTop: insets.top`.
- Bottom tabs e algumas áreas inferiores usam `insets.bottom` para evitar sobreposição com navegação do sistema.

---

# 12. Componentes principais

## `FieldEditorSheet`

- Bottom sheet/modal de propriedades de campo.
- Props principais: `field`, `allFields`, `onUpdate`, `onUpdateStyle`, `onDelete`, `onDuplicate`.
- Edita tipo, nome, configurações específicas, required, tipografia e dimensões.
- Depende de `FIELD_TYPE_OPTIONS`, `dateFormat`, `autoIncrement`, `numberToWords`.

## `FieldOverlay`

- Renderiza um campo sobre o PDF no editor.
- Props: campo, escala, zoom, seleção, ferramenta ativa e callbacks.
- Usa `PanResponder` para mover/redimensionar.
- Mantém estado local `drag` para feedback visual durante gesto, evitando atualizar store a cada frame.

## `FieldTypePicker`

- Modal para escolher tipo de campo ao adicionar.
- Usa `FIELD_TYPE_OPTIONS`.

## `ToolSidebar`

- Toolbar inferior horizontal do editor.
- Props: `active`, `onChange`.
- Ferramentas: adicionar, mover, redimensionar, editar, excluir.

## `ZoomablePdfView`

- Container com zoom por pinça e pan com dois dedos.
- Props: `children`, `onScaleChange`.
- Usa `Animated.Value`, `PanResponder`, limites de escala e pan.

## `TemplatePreviewModal`

- Prévia do template no editor.
- Renderiza imagem base e amostras dos campos.
- Permite tocar em campos para editar texto de exemplo localmente no modal.

## `SpreadsheetLinkModal`

- Modal de vínculo de template com planilha.
- Permite criar/editar uma planilha vinculada e configurar colunas mapeadas para campos.
- Usa serviços de planilha e campos existentes do template.

## `PdfPageRasterizer`

- Converte/rasteriza a página do PDF para imagem usada no editor de template.
- Recebe PDF base64 e retorna data URI + dimensões.
- Depende de componentes/motor de PDF/WebView.

## `PdfEngine`

- Componente de suporte para renderização/engine PDF em WebView.
- Usado pelos componentes de visualização/rasterização.

## `PdfThumbnail`

- Componente para miniaturas de PDFs em listas/cards quando aplicável.

## `MergePreviewModal`

- Modal de prévia/nome antes de confirmar geração/compartilhamento em ferramentas como merge/convert.

## `ImageEditModal`

- Permite editar imagem selecionada antes de converter para PDF.
- Usa `expo-image-manipulator` para gerar novo arquivo.

## `FolderEditorModal`

- Cria/edita pasta com nome, cor e ícone.
- Exporta `FOLDER_ICON_MAP` usado no FileScreen.

## `TutorialModal`

- Mostra passos de tutoriais configurados em `constants/tutorials.ts`.

## `ReadingSettingsModal`, `PageJumpModal`, `PdfZoomModal`, `SliderBar`

- Componentes auxiliares do visualizador de PDF para leitura, pulo de página, zoom e controle deslizante.

---

# 13. Serviços e lógica de negócio

## `templateStorage.ts`

- `getAllTemplates`, `getTemplateById`, `saveTemplate`, `deleteTemplate`, `resetAllTemplates`.
- Cuida da migração de imagens base para arquivo físico.
- Reseta storage em caso de erro de leitura/JSON corrompido.

## `pdfFileIO.ts`

- `pickAndImportPdf`: seleciona PDF, copia para `Paths.document`, conta páginas e registra metadados.
- `pickMultiplePdfs`: seleciona vários PDFs temporários.
- `saveGeneratedPdf`: salva bytes gerados em `Paths.document` e registra na aba Arquivos.

## `pdfFilesStorage.ts`

- Gerencia metadados dos PDFs conhecidos pelo app.
- Inclui favorito, rename, move to folder, delete.

## `pdfFoldersStorage.ts`

- CRUD de pastas.
- Pastas têm `name`, `color`, `icon`.

## `pdfReadingProgress.ts`

- Salva última página por URI.
- Salva tema de leitura (`claro`, `sepia`, `escuro`) e brilho via overlay.

## `spreadsheetsStorage.ts`

- Guarda planilhas vinculadas a templates.
- JSON no AsyncStorage é a fonte da verdade; arquivo XLSX é regenerado.
- Permite criar, atualizar configuração, adicionar linha, renomear e excluir.

## `dateFormat.ts`

- Meses por nome/abreviado.
- `MONTH_OPTIONS` para modal.
- `rawValueFromDate` gera valor bruto a partir de `Date`.
- `formatDateValue` aplica formato de mês, ano e data automática.
- `placeholderForDateConfig` gera placeholder.

## `masks.ts`

- Máscaras de CPF, CNPJ, telefone, valor, data completa, dia/mês e ano.

## `numberToWords.ts`

- Converte números e valores monetários para português por extenso.

## `autoIncrement.ts`

- Configuração default e cálculo do próximo número automático.

## `xlsxBuilder.ts`

- Usa SheetJS para montar workbook `.xlsx` com cabeçalho e linhas.
- Sanitiza nome da aba para limite e caracteres inválidos.

---

# 14. Undo e Redo

## Onde fica

O histórico fica em `src/store/useEditorstorage.ts` no Zustand store do editor.

## Estrutura

```ts
pastFields: TemplateField[][];
futureFields: TemplateField[][];
```

Cada entrada é um snapshot completo de `fields`.

## Salvamento de histórico

A função `pushHistory(state, nextFields)`:

- compara `state.fields` e `nextFields` com `JSON.stringify`;
- se iguais, não salva novo histórico;
- se diferentes, adiciona `state.fields` em `pastFields`;
- limita histórico a 50 entradas com `.slice(-50)`;
- limpa `futureFields`.

## Ações que entram no histórico

- `addField`.
- `updateField`.
- `deleteField`.

Isso inclui mover, redimensionar, duplicar (porque duplica via add), alterações de propriedades e mudança de tipo.

## Como evita múltiplos estados durante arraste

Durante drag/resize, `FieldOverlay` usa estado local `drag` para atualizar visualmente sem chamar `updateField`. Só ao soltar o gesto (`onPanResponderRelease`/`commit`) chama `onMove` ou `onResize`, que atualiza o store uma vez.

## Undo

- Pega o último snapshot de `pastFields`.
- Define `fields` como esse snapshot.
- Remove esse snapshot de `pastFields`.
- Adiciona o estado atual no início de `futureFields`.
- Mantém `selectedFieldId` apenas se o campo ainda existir.

## Redo

- Pega o primeiro snapshot de `futureFields`.
- Define `fields` como ele.
- Adiciona o estado atual ao final de `pastFields`.
- Remove o snapshot aplicado de `futureFields`.

## Nova alteração após Undo

Como `pushHistory` sempre zera `futureFields`, qualquer nova alteração depois de Undo descarta o histórico de Redo.

## Limitações atuais

- Histórico cobre apenas `fields`, não cobre `templateName`, `pdfUri`, `pageWidth` ou `pageHeight`.
- Comparação via `JSON.stringify` pode ficar cara se houver muitos campos.
- Alterações de propriedade por digitação podem criar muitas entradas, porque cada `onChangeText` chama `updateField`.
- Histórico é limpo ao carregar template com `loadFromTemplate`.

---

# 15. Problemas conhecidos e pontos frágeis

## Bugs conhecidos

- `TemplateEditorScreen.handleSave` define `createdAt` como `now` mesmo ao editar template existente. Isso pode perder a data original de criação.
- `TemplateFillScreen` só avança contador de auto incremento considerando o primeiro campo `autoIncremento`, embora o template permita vários campos desse tipo.
- O store de preenchimento tem `clearSession`, mas a tela não chama após geração; valores anteriores continuam ao reabrir o mesmo template enquanto o app estiver vivo.
- `TemplatePreviewModal.sampleFor` não trata explicitamente `textoFixo`; cai no default e pode mostrar nome interno/texto de exemplo em vez de `defaultText` na prévia do editor.

## Limitações

- Editor de template suporta efetivamente uma página base, não template multi-página completo.
- PDF final de preenchimento é rasterizado como imagem; textos não ficam pesquisáveis/selecionáveis no PDF.
- Campo `hora` não tem máscara/validação específica apesar do placeholder.
- Campo `required` é configurável, mas não há validação bloqueando geração quando obrigatório está vazio.
- Favoritos de ferramentas em ToolsScreen são apenas estado local, não persistem.
- Sessões de preenchimento sobrevivem à navegação, mas não ao encerramento do app.

## Dívida técnica

- Alguns fluxos duplicam lógica de formatação/preview de campos entre `TemplateFillScreen`, `TemplatePreviewModal` e `FieldEditorSheet`.
- A conversão de preview para PDF depende de captura visual, o que acopla resultado final ao layout/renderização RN.
- Stores e services usam nomes antigos (`@editorpdf`) apesar do app chamar PDF Studio; isso funciona, mas é detalhe legado.
- `useEditorstorage.ts` tem nome com “storage” em caixa diferente (`storage`/`Store`) e typo visual, mas é funcional.

## Possíveis problemas futuros

- AsyncStorage pode crescer demais com muitas planilhas/linhas.
- `JSON.stringify` para comparar histórico pode afetar performance em templates grandes.
- Mudanças de tamanho/orientação de tela podem exigir recalcular `SCREEN_WIDTH`, que hoje é constante de módulo em algumas telas.
- Adicionar suporte multi-página exigirá remodelar `Template` e `TemplateField` para incluir página de cada campo.

---

# 16. Funcionalidades existentes

## Templates

- Criar template a partir de PDF.
- Rasterizar PDF base em imagem.
- Listar e buscar templates.
- Editar template existente.
- Preencher template.
- Vincular template a planilha.
- Resetar todos os templates nas configurações.

## Editor

- Adicionar campos de vários tipos.
- Mover campos.
- Redimensionar campos.
- Editar propriedades.
- Duplicar campos.
- Excluir campos.
- Ver prévia.
- Undo/Redo de alterações de campos.
- Toolbar inferior com ferramentas.
- Zoom/pan com dois dedos no canvas.

## Preenchimento

- Formulário gerado automaticamente a partir dos campos.
- Máscaras para CPF, CNPJ, telefone, valor e data.
- Data automática editável.
- Mês por seletor.
- Ano completo ou dois dígitos.
- Texto fixo editável.
- Valor por extenso e número por extenso.
- Valor por extenso vinculado a campo de valor.
- Auto incremento com contador salvo no template.
- Prévia visual do documento.
- Persistência temporária por template durante navegação.
- Geração e compartilhamento de PDF final.
- Registro opcional em planilha vinculada.

## PDF e arquivos

- Importar PDF para biblioteca local.
- Listar PDFs.
- Abrir PDF no visualizador.
- Favoritar PDFs.
- Renomear PDFs.
- Excluir PDFs.
- Compartilhar PDFs.
- Organizar PDFs em pastas.
- Criar/editar/excluir pastas.
- Alternar lista/grade.

## Ferramentas PDF

- Juntar PDFs.
- Converter imagens para PDF.
- Editar/girar imagens antes de converter.
- Dividir PDF por páginas/intervalos.
- Compactar PDF por regravação estrutural/metadados.

## Planilhas

- Criar planilha vinculada a template.
- Configurar colunas mapeadas a campos.
- Adicionar linha ao gerar documento.
- Regenerar arquivo XLSX.
- Listar planilhas na aba Arquivos.
- Abrir planilha em app externo no Android.
- Compartilhar planilha.
- Renomear/excluir planilha.

## Configurações e leitura

- Tema claro/escuro.
- Tutoriais por ferramenta.
- Progresso de leitura por PDF.
- Tema/brilho de leitura no visualizador.

---

# 17. Funcionalidades planejadas ou parcialmente implementadas

- `PlaceholderScreen` existe para telas/funcionalidades placeholder.
- Comentário em `ToolsScreen` indica que Assinar/Escanear/Reorganizar foram removidos por pedido; portanto não são funcionalidades atuais.
- Comentário em `theme.ts` indica que carregar fonte via `expo-font` é passo opcional futuro; não está implementado.
- `TemplateFillData` existe em `types/template.ts`, mas o fluxo atual usa `Record<string,string>` diretamente e `useTemplateFillStore`; não há persistência permanente desse tipo.
- `clearSession` existe no store de preenchimento, mas não está integrado à geração/saída no fluxo atual.
- Campo `required` existe e aparece na UI, mas validação obrigatória antes de gerar ainda não está implementada.
- Suporte a multi-página em templates não está implementado, embora ferramentas de PDF manipulem PDFs multi-página.

---

# Guia para continuar o desenvolvimento

## Arquivos para analisar antes de modificar templates

- `src/types/template.ts`
- `src/services/templateStorage.ts`
- `src/screens/TemplateEditorScreen.tsx`
- `src/screens/TemplateFillScreen.tsx`
- `src/components/FieldEditorSheet.tsx`
- `src/components/FieldOverlay.tsx`
- `src/constants/fieldTypes.ts`
- `src/store/useEditorstorage.ts`

## Arquivos relacionados ao editor

- `TemplateEditorScreen.tsx`
- `FieldOverlay.tsx`
- `FieldEditorSheet.tsx`
- `FieldTypePicker.tsx`
- `ToolSidebar.tsx`
- `ZoomablePdfView.tsx`
- `TemplatePreviewModal.tsx`
- `useEditorstorage.ts`

## Arquivos relacionados ao preenchimento

- `TemplateFillScreen.tsx`
- `useTemplateFillStore.ts`
- `dateFormat.ts`
- `masks.ts`
- `numberToWords.ts`
- `autoIncrement.ts`
- `spreadsheetsStorage.ts`

## Arquivos relacionados à geração/manipulação de PDF

- `TemplateFillScreen.tsx` para geração final de template.
- `pdfFileIO.ts` para importação/salvamento de PDFs gerados.
- `MergePdfScreen.tsx` para juntar PDFs.
- `ConvertToPdfScreen.tsx` para imagens → PDF.
- `SplitPdfScreen.tsx` para extração de páginas.
- `CompressPdfScreen.tsx` para compactação.
- `PdfPageRasterizer.tsx`, `PdfEngine.tsx`, `PdfViewerScreen.tsx` para renderização/visualização.

## Estruturas que exigem cuidado

- `Template` e `TemplateField`: qualquer mudança precisa preservar templates antigos.
- `DateConfig`: usado em editor, preenchimento e preview.
- `position`: base para coordenadas e geração visual.
- `useEditorStore.fields`: é a fonte de verdade durante edição.
- `pastFields`/`futureFields`: qualquer update direto de fields pode quebrar Undo/Redo se não passar pelas ações.
- `useTemplateFillStore.sessions`: valores temporários por template.
- AsyncStorage keys: mudar nomes sem migração perde dados existentes.

## Principais riscos ao alterar funcionalidades

- Quebrar compatibilidade com templates salvos que não têm campos novos opcionais (`yearFormat`, `defaultText`, configs).
- Criar updates de state durante render ao tentar normalizar valores no JSX.
- Registrar centenas de estados no Undo durante drag se atualizar store em `onPanResponderMove`.
- Sobrescrever valores digitados ao recalcular defaults de data/texto fixo.
- Alterar escala/posição e deslocar campos no PDF final.
- Aumentar payload em AsyncStorage com base64 ou planilhas grandes.

## Checklist de regressão

- [ ] Criar template
- [ ] Importar documento
- [ ] Adicionar campo
- [ ] Mover campo
- [ ] Redimensionar campo
- [ ] Undo
- [ ] Redo
- [ ] Salvar template
- [ ] Abrir template salvo
- [ ] Editar template salvo
- [ ] Duplicar campo
- [ ] Excluir campo
- [ ] Vincular planilha
- [ ] Preencher campos
- [ ] Preencher campo valor
- [ ] Conferir valor por extenso vinculado
- [ ] Editar data automática
- [ ] Alterar mês
- [ ] Alterar formato do ano
- [ ] Editar texto fixo
- [ ] Navegar e voltar para o preenchimento
- [ ] Gerar documento final
- [ ] Confirmar incremento automático após geração
- [ ] Confirmar linha adicionada na planilha vinculada
- [ ] Importar PDF na aba Arquivos
- [ ] Abrir PDF no visualizador
- [ ] Renomear/favoritar/excluir PDF
- [ ] Criar/editar/excluir pasta
- [ ] Juntar PDFs
- [ ] Converter imagens para PDF
- [ ] Dividir PDF
- [ ] Compactar PDF
- [ ] Abrir/compartilhar planilha
- [ ] Alternar tema claro/escuro
- [ ] Abrir tutoriais
