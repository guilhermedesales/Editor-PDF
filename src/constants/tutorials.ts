// Conteúdo dos tutoriais mostrados em Configurações > Tutoriais. Cada
// ferramenta tem uma sequência curta de passos exibida como carrossel
// no TutorialModal.

import { FilePlus2, FileEdit, Combine, FileImage, Scissors, FileArchive } from 'lucide-react-native';

export interface TutorialStep {
  title: string;
  description: string;
}

export interface ToolTutorial {
  id: string;
  label: string;
  icon: any;
  steps: TutorialStep[];
}

export const TOOL_TUTORIALS: ToolTutorial[] = [
  {
    id: 'template-create', label: 'Criar Template', icon: FilePlus2,
    steps: [
      { title: 'Escolha um PDF', description: 'Na tela de criação, selecione o arquivo que servirá de base pro seu template.' },
      { title: 'Adicione campos', description: 'Toque no ícone "+" na barra lateral e depois toque no ponto do documento onde o campo deve aparecer.' },
      { title: 'Configure cada campo', description: 'Defina nome, tipo de dado (CPF, valor, data, etc.), fonte, cor e alinhamento no painel de propriedades.' },
      { title: 'Salve o template', description: 'Dê um nome ao template e toque em Salvar. Ele fica disponível pra reutilizar quando quiser.' },
    ],
  },
  {
    id: 'template-fill', label: 'Preencher Template', icon: FileEdit,
    steps: [
      { title: 'Escolha o template', description: 'Na aba Templates, toque no card do template que deseja preencher.' },
      { title: 'Preencha os dados', description: 'Um formulário é gerado automaticamente com os campos definidos na criação.' },
      { title: 'Confira a prévia', description: 'Acompanhe em tempo real como o documento final vai ficar, na parte de baixo da tela.' },
      { title: 'Gere e compartilhe', description: 'Toque em Concluir, dê um nome ao arquivo e compartilhe por WhatsApp, e-mail ou qualquer app.' },
    ],
  },
  {
    id: 'merge', label: 'Juntar PDFs', icon: Combine,
    steps: [
      { title: 'Adicione os arquivos', description: 'Toque em "Adicionar PDF" e selecione todos os documentos que quer unir.' },
      { title: 'Organize a ordem', description: 'Use as setas pra cima/baixo em cada item pra definir a ordem final das páginas.' },
      { title: 'Junte e compartilhe', description: 'Toque em "Juntar e Compartilhar" — o novo PDF é gerado e já aparece na aba Arquivos.' },
    ],
  },
  {
    id: 'convert', label: 'Converter para PDF', icon: FileImage,
    steps: [
      { title: 'Selecione as imagens', description: 'Toque em "Adicionar Imagens" e escolha as fotos que virarão páginas do PDF.' },
      { title: 'Confira a ordem', description: 'As imagens aparecem na ordem em que foram selecionadas — cada uma vira uma página.' },
      { title: 'Converta e compartilhe', description: 'Toque em "Converter e Compartilhar" pra gerar o PDF final.' },
    ],
  },
  {
    id: 'split', label: 'Dividir PDF', icon: Scissors,
    steps: [
      { title: 'Selecione o PDF', description: 'Escolha o arquivo de onde você quer extrair páginas específicas.' },
      { title: 'Digite as páginas', description: 'Use vírgula para páginas separadas e hífen para intervalos — ex: "1-3,5".' },
      { title: 'Extraia e compartilhe', description: 'Toque em "Extrair e Compartilhar" pra gerar um novo PDF só com essas páginas.' },
    ],
  },
  {
    id: 'compress', label: 'Compactar PDF', icon: FileArchive,
    steps: [
      { title: 'Selecione o PDF', description: 'Escolha o arquivo que você quer deixar mais leve.' },
      { title: 'Compacte', description: 'Toque em "Compactar" — o app reescreve a estrutura interna do arquivo pra reduzir o tamanho.' },
      { title: 'Resultado', description: 'Compare o tamanho antes/depois e compartilhe direto pelo aviso que aparece na tela.' },
    ],
  },
];