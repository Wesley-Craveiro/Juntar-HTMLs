document.addEventListener('DOMContentLoaded', () => {
  // --- Elementos ---
  const inputHtml = document.getElementById('input-html');
  const inputCss = document.getElementById('input-css');
  const inputJs = document.getElementById('input-js');
  
  const btnPreview = document.getElementById('btn-preview');
  const btnCopy = document.getElementById('btn-copy');
  const btnDownload = document.getElementById('btn-download');
  const btnClear = document.getElementById('btn-clear');
  const btnClosePreview = document.getElementById('btn-close-preview');
  
  const previewSection = document.getElementById('preview-section');
  const previewFrame = document.getElementById('preview-frame');
  const toast = document.getElementById('toast');

  // --- Constantes de Storage ---
  const STORAGE_KEYS = {
    HTML: 'sb_html_content',
    CSS: 'sb_css_content',
    JS: 'sb_js_content'
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
    inputJs.value = localStorage.getItem(STORAGE_KEYS.JS) || '';
  }

  // Salvar no LocalStorage
  function saveToStorage() {
    localStorage.setItem(STORAGE_KEYS.HTML, inputHtml.value);
    localStorage.setItem(STORAGE_KEYS.CSS, inputCss.value);
    localStorage.setItem(STORAGE_KEYS.JS, inputJs.value);
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

  // Auto-save ao digitar
  [inputHtml, inputCss, inputJs].forEach(input => {
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
      
      const a = document.createElement('a');
      a.href = url;
      a.download = 'index.html';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      showToast('Download iniciado!');
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
      inputJs.value = '';
      saveToStorage();
      previewSection.classList.add('hidden');
      previewFrame.srcdoc = '';
      showToast('Editor limpo');
    }
  });

  // --- Inicialização ---
  loadFromStorage();
});
