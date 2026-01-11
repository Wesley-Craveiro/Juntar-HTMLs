document.addEventListener('DOMContentLoaded', () => {
  // --- Elementos ---
  const inputHtml = document.getElementById('input-html');
  const inputCss = document.getElementById('input-css');
  const inputReadme = document.getElementById('input-readme');
  const inputJs = document.getElementById('input-js');
  const inputGameJs = document.getElementById('input-game-js');
  
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
    README: 'sb_readme_content',
    JS: 'sb_js_content',
    GAME_JS: 'sb_game_js_content'
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

  // Carregar do LocalStorage
  function loadFromStorage() {
    inputHtml.value = localStorage.getItem(STORAGE_KEYS.HTML) || '';
    inputCss.value = localStorage.getItem(STORAGE_KEYS.CSS) || '';
    inputReadme.value = localStorage.getItem(STORAGE_KEYS.README) || '';
    inputJs.value = localStorage.getItem(STORAGE_KEYS.JS) || '';
    inputGameJs.value = localStorage.getItem(STORAGE_KEYS.GAME_JS) || '';
  }

  // Salvar no LocalStorage
  function saveToStorage() {
    localStorage.setItem(STORAGE_KEYS.HTML, inputHtml.value);
    localStorage.setItem(STORAGE_KEYS.CSS, inputCss.value);
    localStorage.setItem(STORAGE_KEYS.README, inputReadme.value);
    localStorage.setItem(STORAGE_KEYS.JS, inputJs.value);
    localStorage.setItem(STORAGE_KEYS.GAME_JS, inputGameJs.value);
  }

  // Construir o HTML final
  function buildFinalHtml() {
    const htmlContent = inputHtml.value;
    const cssContent = inputCss.value;
    const jsContent = inputJs.value;

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
    inputHtml.value = htmlBodyContent;
    inputCss.value = cssContent.trim();
    inputJs.value = jsContent.trim();

    // Salva e atualiza UI
    saveToStorage();
  }

  // Auto-save ao digitar
  [inputHtml, inputCss, inputReadme, inputJs, inputGameJs].forEach(input => {
    input.addEventListener('input', saveToStorage);
  });

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
      inputHtml.value = '';
      inputCss.value = '';
      inputReadme.value = '';
      inputJs.value = '';
      inputGameJs.value = '';
      saveToStorage();
      previewSection.classList.add('hidden');
      previewFrame.srcdoc = '';
      showToast('Editor limpo');
    }
  });

  // --- Inicialização ---
  loadFromStorage();
});
