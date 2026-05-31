/**
 * Abre uma janela de impressão com HTML arbitrário.
 * Se popup for bloqueado, faz download como .html como fallback.
 */
export function printHtml(html, filename = "documento") {
  const win = window.open("", "_blank");
  if (win) {
    win.document.write(html);
    win.document.close();
    win.onload = () => win.print();
  } else {
    // Fallback: download do arquivo HTML
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `${filename}.html`;
    a.click();
    URL.revokeObjectURL(url);
  }
}
