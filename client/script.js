import { EditorView, basicSetup } from "codemirror"
import { html } from "@codemirror/lang-html"
import { css } from "@codemirror/lang-css"
import { javascript } from "@codemirror/lang-javascript"
import { oneDark } from "@codemirror/theme-one-dark"
import { EditorState } from "@codemirror/state"

document.addEventListener('DOMContentLoaded', () => {
  // --- Elementos ---
  const editorHtmlContainer = document.getElementById('editor-html');
  const editorCssContainer = document.getElementById('editor-css');
  const editorJsContainer = document.getElementById('editor-js');
  
  const btnPreview = document.getElementById('btn-preview');
  const btnCopy = document.getElementById('btn-copy');
  const btnDownload = document.getElementById('btn-download');
  const btnClear = document.getElementById('btn-clear');
  const btnClosePreview = document.getElementById('btn-close-preview');
  
  // Novos Elementos de Importação
  const inputImportUrl = document.getElementById('input-import-url');
  const btnImportAction = document.getElementById('btn-import-action');
  const fileInput = document.getElementById('file-input');
  
  const previewSection = document.getElementById('preview-section');
  const previewFrame = document.getElementById('preview-frame');
  const toast = document.getElementById('toast');

  // --- Constantes de Storage ---
  const STORAGE_KEYS = {
    HTML: 'sb_html_content',
    CSS: 'sb_css_content',
    JS: 'sb_js_content'
  };

  // --- Inicialização do CodeMirror ---
  
  const createEditor = (parent, langExtension, initialValue, saveCallback) => {
    return new EditorView({
      state: EditorState.create({
        doc: initialValue,
        extensions: [
          basicSetup,
          oneDark,
          langExtension,
          EditorView.updateListener.of((update) => {
            if (update.docChanged) {
              saveCallback(update.state.doc.toString());
            }
          }),
          EditorView.theme({
            "&": { height: "100%", fontSize: "14px" },
            ".cm-scroller": { overflow: "auto" }
          })
        ]
      }),
      parent: parent
    });
  };

  // Carrega valores iniciais
  const initialHtml = localStorage.getItem(STORAGE_KEYS.HTML) || "<!-- Cole seu HTML aqui -->\n<h1>Olá Mundo</h1>";
  const initialCss = localStorage.getItem(STORAGE_KEYS.CSS) || "/* Cole seu CSS aqui */\nbody { background: #f0f0f0; }";
  const initialJs = localStorage.getItem(STORAGE_KEYS.JS) || "// Cole seu JavaScript aqui\nconsole.log('Carregado!');";

  // Cria as instâncias dos editores
  let viewHtml = createEditor(editorHtmlContainer, html(), initialHtml, (val) => {
    localStorage.setItem(STORAGE_KEYS.HTML, val);
  });

  let viewCss = createEditor(editorCssContainer, css(), initialCss, (val) => {
    localStorage.setItem(STORAGE_KEYS.CSS, val);
  });

  let viewJs = createEditor(editorJsContainer, javascript(), initialJs, (val) => {
    localStorage.setItem(STORAGE_KEYS.JS, val);
  });

  // --- Helpers para pegar/setar valores ---
  
  const getHtml = () => viewHtml.state.doc.toString();
  const getCss = () => viewCss.state.doc.toString();
  const getJs = () => viewJs.state.doc.toString();

  const setEditorContent = (view, content) => {
    const transaction = view.state.update({
      changes: { from: 0, to: view.state.doc.length, insert: content }
    });
    view.dispatch(transaction);
  };

  // --- Funções Auxiliares ---
  
  // Mostrar Toast
  function showToast(msg, type = 'success') {
    toast.textContent = msg;
    toast.className = `toast show ${type}`;
    
    setTimeout(() => {
      toast.className = 'toast';
    }, 3000);
  }

  // Construir o HTML final
  function buildFinalHtml() {
    const htmlContent = getHtml();
    const cssContent = getCss();
    const jsContent = getJs();

    const styleTag = cssContent ? `<style>\n${cssContent}\n</style>` : '';
    const scriptTag = jsContent ? `<script>\n${jsContent}\n<\/script>` : '';

    // Verifica se já tem estrutura completa
    const hasHtmlTag = /<html[^>]*>/i.test(htmlContent);
    const hasHeadTag = /<head[^>]*>/i.test(htmlContent);
    const hasBodyTag = /<body[^>]*>/i.test(htmlContent);

    let finalSource = '';

    if (hasHtmlTag) {
      // Se já tem HTML, tentamos injetar inteligentemente
      let source = htmlContent;

      // Injetar CSS no head ou antes do body se não tiver head
      if (styleTag) {
        if (hasHeadTag) {
          source = source.replace(/<\/head>/i, `${styleTag}\n</head>`);
        } else if (hasBodyTag) {
          source = source.replace(/<body/i, `<head>${styleTag}</head>\n<body`);
        } else {
          // Fallback
          source = styleTag + '\n' + source;
        }
      }

      // Injetar JS antes do fechamento do body
      if (scriptTag) {
        if (hasBodyTag) {
          source = source.replace(/<\/body>/i, `${scriptTag}\n</body>`);
        } else {
          source = source + '\n' + scriptTag;
        }
      }
      
      finalSource = source;

    } else {
      // Se é fragmento, cria estrutura completa
      finalSource = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Document</title>
  <style>
    body { margin: 0; padding: 0; box-sizing: border-box; }
  </style>
  ${styleTag}
</head>
<body>
${htmlContent}
${scriptTag}
</body>
</html>`;
    }

    return finalSource;
  }

  // --- Event Listeners ---

  // Botão Importar Action
  btnImportAction.addEventListener('click', () => {
    const url = inputImportUrl.value.trim();

    if (!url) {
      // Se vazio, assume que usuário quer abrir arquivo
      fileInput.click();
      return;
    }

    if (url.startsWith('file://') || url.match(/^[a-zA-Z]:\\/)) {
      // Caminho local detectado
      showToast('Para arquivos locais, selecione o arquivo na janela a seguir.', 'success');
      // Pequeno delay para usuário ler o toast antes de abrir o picker
      setTimeout(() => fileInput.click(), 1000);
      return;
    }

    if (url.startsWith('http')) {
      // TODO: Implementar fetch via proxy se necessário, por enquanto alertamos
      alert('Importação direta de URL ainda não implementada (requer proxy CORS). Por favor, baixe o arquivo e use a opção de carregar arquivo.');
    } else {
      // Fallback para arquivo
      fileInput.click();
    }
  });

  // Input de Arquivo (Change)
  fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target.result;
      parseAndPopulate(content);
      showToast(`Arquivo "${file.name}" carregado com sucesso!`);
    };
    reader.onerror = () => showToast('Erro ao ler arquivo', 'error');
    reader.readAsText(file);
    
    // Reset para permitir selecionar o mesmo arquivo novamente
    fileInput.value = '';
  });

  // Função para parsear HTML importado
  function parseAndPopulate(htmlString) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlString, 'text/html');

    // 1. Extrair CSS (<style>)
    const styles = doc.querySelectorAll('style');
    let cssContent = '';
    styles.forEach(style => {
      cssContent += style.innerHTML.trim() + '\n\n';
      style.remove(); // Remove do doc para não duplicar no HTML
    });

    // 2. Extrair JS (<script>) - Ignora src externos por enquanto ou mantém no HTML?
    // Vamos extrair scripts inline. Scripts com src ficam no HTML body geralmente.
    const scripts = doc.querySelectorAll('script');
    let jsContent = '';
    scripts.forEach(script => {
      if (!script.src && !script.type || script.type === 'text/javascript' || script.type === 'module') {
        jsContent += script.innerHTML.trim() + '\n\n';
        script.remove();
      }
    });

    // 3. O que sobra é o HTML (Body innerHTML)
    // Se o usuário importou um arquivo completo, pegamos o body.
    // Se for fragmento, pegamos tudo.
    let htmlBodyContent = '';
    if (doc.body) {
      htmlBodyContent = doc.body.innerHTML.trim();
    } else {
      htmlBodyContent = doc.documentElement.innerHTML.trim();
    }

    // Popula os editores
    setEditorContent(viewHtml, htmlBodyContent);
    setEditorContent(viewCss, cssContent.trim());
    setEditorContent(viewJs, jsContent.trim());

    // Salva manualmente pois o listener do CodeMirror cuida disso, 
    // mas aqui estamos fazendo uma mudança "externa"
    localStorage.setItem(STORAGE_KEYS.HTML, htmlBodyContent);
    localStorage.setItem(STORAGE_KEYS.CSS, cssContent.trim());
    localStorage.setItem(STORAGE_KEYS.JS, jsContent.trim());
  }

  // Botão Preview
  btnPreview.addEventListener('click', () => {
    const finalHtml = buildFinalHtml();
    previewSection.classList.remove('hidden');
    
    // Usar srcdoc para iframe é mais seguro e fácil para preview local
    previewFrame.srcdoc = finalHtml;
    
    showToast('Preview atualizado');
  });

  // Fechar Preview
  btnClosePreview.addEventListener('click', () => {
    previewSection.classList.add('hidden');
  });

  // Botão Copiar
  btnCopy.addEventListener('click', async () => {
    try {
      const finalHtml = buildFinalHtml();
      await navigator.clipboard.writeText(finalHtml);
      showToast('Código copiado para a área de transferência!');
    } catch (err) {
      showToast('Erro ao copiar código', 'error');
      console.error(err);
    }
  });

  // Botão Download
  btnDownload.addEventListener('click', () => {
    try {
      const finalHtml = buildFinalHtml();
      const blob = new Blob([finalHtml], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      
      let fileName = 'index.html';
      const importUrl = inputImportUrl.value.trim();
      
      // Tenta extrair o nome do arquivo da URL/Caminho se existir
      if (importUrl) {
        // Remove prefixo file:/// e decodifica caracteres (ex: %20)
        let cleanPath = decodeURIComponent(importUrl.replace(/^file:\/\/\/?/, ''));
        // Pega a última parte após / ou \
        const parts = cleanPath.split(/[/\\]/);
        const lastPart = parts[parts.length - 1];
        
        // Se terminar com .html ou .htm, usa esse nome
        if (lastPart && (lastPart.toLowerCase().endsWith('.html') || lastPart.toLowerCase().endsWith('.htm'))) {
          fileName = lastPart;
        }
      }

      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      showToast(`Download iniciado: ${fileName}`);
    } catch (err) {
      showToast('Erro ao gerar download', 'error');
      console.error(err);
    }
  });

  // Botão Limpar
  btnClear.addEventListener('click', () => {
    if (confirm('Tem certeza que deseja limpar tudo?')) {
      setEditorContent(viewHtml, '');
      setEditorContent(viewCss, '');
      setEditorContent(viewJs, '');
      
      localStorage.setItem(STORAGE_KEYS.HTML, '');
      localStorage.setItem(STORAGE_KEYS.CSS, '');
      localStorage.setItem(STORAGE_KEYS.JS, '');
      
      previewSection.classList.add('hidden');
      previewFrame.srcdoc = '';
      showToast('Editor limpo');
    }
  });
});
