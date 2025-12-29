import type { ItemInventario } from '../types/inventario';
import { generateQRToken } from '../services/qrTokenService';

/**
 * Imprime un código QR con el nombre del equipo
 * Solo muestra el QR y el nombre, sin información adicional
 */
export const printQR = async (item: ItemInventario) => {
  // Generar token temporal de 15 minutos
  let tokenId: string;
  try {
    tokenId = await generateQRToken(item.id);
  } catch (error) {
    console.error('Error al generar token QR:', error);
    alert('Error al generar el código QR. Por favor, verifica tu conexión a Firebase e intenta nuevamente.');
    return;
  }

  // Crear un iframe oculto para la impresión
  const printFrame = document.createElement('iframe');
  printFrame.style.position = 'fixed';
  printFrame.style.right = '0';
  printFrame.style.bottom = '0';
  printFrame.style.width = '0';
  printFrame.style.height = '0';
  printFrame.style.border = 'none';
  printFrame.style.opacity = '0';
  printFrame.style.pointerEvents = 'none';
  document.body.appendChild(printFrame);

  // Generar el valor del QR con el token temporal
  const qrValue = `${window.location.origin}/item/${tokenId}`;
  
  // Crear el contenido HTML para imprimir
  const printContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>QR - ${escapeHtml(item.nombre)}</title>
        <meta charset="UTF-8">
        <style>
          @page {
            margin: 0;
            size: A4;
          }
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            background: white;
          }
          .qr-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 30px;
          }
          .qr-code-wrapper {
            margin-bottom: 30px;
            padding: 15px;
            background: white;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .qr-code-wrapper img {
            width: 400px;
            height: 400px;
            display: block;
          }
          .qr-name {
            font-size: 24px;
            font-weight: 600;
            text-align: center;
            color: #000;
            max-width: 450px;
            word-wrap: break-word;
            line-height: 1.4;
          }
        </style>
      </head>
      <body>
        <div class="qr-container">
          <div class="qr-code-wrapper">
            <img src="https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(qrValue)}" alt="QR Code" />
          </div>
          <div class="qr-name">${escapeHtml(item.nombre)}</div>
        </div>
      </body>
    </html>
  `;

  // Escribir el contenido en el iframe
  const printDoc = printFrame.contentDocument || printFrame.contentWindow?.document;
  if (printDoc) {
    printDoc.open();
    printDoc.write(printContent);
    printDoc.close();

    // Esperar a que el contenido se cargue y luego imprimir
    const handleLoad = () => {
      setTimeout(() => {
        if (printFrame.contentWindow) {
          printFrame.contentWindow.focus();
          printFrame.contentWindow.print();
        }
        // Remover el iframe después de un tiempo
        setTimeout(() => {
          if (document.body.contains(printFrame)) {
            document.body.removeChild(printFrame);
          }
        }, 1000);
      }, 500);
    };

    if (printFrame.contentDocument?.readyState === 'complete') {
      handleLoad();
    } else {
      printFrame.onload = handleLoad;
    }
  }
};

/**
 * Escapa caracteres HTML para prevenir XSS
 */
function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

