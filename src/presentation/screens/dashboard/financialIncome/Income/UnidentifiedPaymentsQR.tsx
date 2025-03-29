import { useState, useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import { useUnidentifiedPaymentsStore } from "../../../../../store/useUnidentifiedPaymentsStore";
import toast from "react-hot-toast";

const UnidentifiedPaymentsQR = () => {
  const [showQR, setShowQR] = useState(false);
  const [qrUrl, setQrUrl] = useState("");
  const qrRef = useRef<HTMLDivElement>(null);
  const { createQRData } = useUnidentifiedPaymentsStore();

  const generateQR = async () => {
    try {
      const qrId = await createQRData();
      const url = `${window.location.origin}/unidentified-payments/${qrId}`;
      setQrUrl(url);
      setShowQR(true);
      toast.success("QR generado correctamente");
    } catch (error: any) {
      console.error("Error al generar QR:", error);
      toast.error("Error al generar el QR");
    }
  };

  const printQR = () => {
    if (!qrRef.current) return;

    // Convertir el SVG a base64
    const svgElement = qrRef.current.querySelector("svg");
    if (!svgElement) return;

    const svgData = new XMLSerializer().serializeToString(svgElement);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      const base64Image = canvas.toDataURL("image/png");

      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Pagos No Identificados - QR</title>
              <style>
                body { 
                  font-family: Arial, sans-serif;
                  display: flex;
                  flex-direction: column;
                  align-items: center;
                  padding: 20px;
                }
                .qr-container {
                  text-align: center;
                  margin: 20px 0;
                }
                .qr-image {
                  width: 200px;
                  height: 200px;
                  margin: 20px auto;
                }
                .title {
                  font-size: 24px;
                  margin-bottom: 20px;
                  color: #1a1a1a;
                }
                .instructions {
                  font-size: 16px;
                  color: #666;
                  margin: 20px 0;
                  text-align: center;
                  max-width: 300px;
                }
                .footer {
                  margin-top: 20px;
                  font-size: 12px;
                  color: #999;
                }
              </style>
            </head>
            <body>
              <div class="title">Pagos No Identificados</div>
              <div class="qr-container">
                <img src="${base64Image}" class="qr-image" alt="Código QR" />
              </div>
              <div class="instructions">
                Escanea este código QR para ver la lista de pagos no identificados de los últimos 30 días
              </div>
              <div class="footer">
                Estate Admin - Un servicio de Omnipixel
              </div>
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
      }
    };

    img.src = "data:image/svg+xml;base64," + btoa(svgData);
  };

  return (
    <>
      <button
        onClick={generateQR}
        className="flex items-center bg-indigo-600 dark:bg-indigo-500 text-white px-3 py-1 rounded-md hover:bg-indigo-700 dark:hover:bg-indigo-600"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5 mr-1"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z"
            clipRule="evenodd"
          />
        </svg>
        Generar QR
      </button>

      {showQR && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Código QR</h3>
              <button
                onClick={() => setShowQR(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="flex flex-col items-center">
              <div ref={qrRef}>
                <QRCodeSVG value={qrUrl} size={200} />
              </div>
              <p className="mt-4 text-sm text-center text-gray-600 dark:text-gray-300">
                Escanea este código QR para acceder a la tabla de pagos no
                identificados de los últimos 30 días
              </p>
              <button
                onClick={printQR}
                className="mt-4 flex items-center bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-2"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M5 4v3H4a2 2 0 00-2 2v3a2 2 0 002 2h1v2a2 2 0 002 2h6a2 2 0 002-2v-2h1a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm8 0H7v3h6V4zm0 8H7v4h6v-4z"
                    clipRule="evenodd"
                  />
                </svg>
                Imprimir QR
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default UnidentifiedPaymentsQR;
