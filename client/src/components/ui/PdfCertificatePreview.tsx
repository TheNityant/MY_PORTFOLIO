import { useEffect, useRef, useState } from "react";
import {
  GlobalWorkerOptions,
  getDocument,
  type PDFDocumentProxy,
  type PDFPageProxy,
  type RenderTask,
} from "pdfjs-dist";
import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";

GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

export function PdfCertificatePreview({
  src,
  label,
}: {
  src: string;
  label: string;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    let cancelled = false;
    let renderTask: RenderTask | null = null;
    let pdfDocument: PDFDocumentProxy | null = null;
    let page: PDFPageProxy | null = null;

    const render = async () => {
      try {
        setState("loading");

        const loadingTask = getDocument({
          url: src,
          disableRange: true,
          disableStream: true,
          disableAutoFetch: true,
          stopAtErrors: false,
        });

        pdfDocument = await loadingTask.promise;
        if (cancelled) return;

        page = await pdfDocument.getPage(1);
        if (cancelled) return;

        const canvas = canvasRef.current;
        const host = hostRef.current;
        if (!canvas || !host) return;

        const baseViewport = page.getViewport({ scale: 1 });
        const maxWidth = Math.max(220, host.clientWidth - 20);
        const maxHeight = 224;
        const cssScale = Math.min(
          maxWidth / baseViewport.width,
          maxHeight / baseViewport.height,
        );
        const outputScale = Math.min(window.devicePixelRatio || 1, 2);
        const viewport = page.getViewport({ scale: cssScale * outputScale });

        canvas.width = Math.max(1, Math.floor(viewport.width));
        canvas.height = Math.max(1, Math.floor(viewport.height));
        canvas.style.width = `${Math.floor(viewport.width / outputScale)}px`;
        canvas.style.height = `${Math.floor(viewport.height / outputScale)}px`;

        const context = canvas.getContext("2d", { alpha: false });
        if (!context) throw new Error("Canvas context unavailable");

        context.fillStyle = "#ffffff";
        context.fillRect(0, 0, canvas.width, canvas.height);

        renderTask = page.render({
          canvasContext: context,
          viewport,
        });

        await renderTask.promise;

        if (!cancelled) setState("ready");
      } catch (error) {
        if (cancelled) return;
        console.error(`Certificate preview render failed for ${label}`, error);
        setState("error");
      }
    };

    void render();

    return () => {
      cancelled = true;
      renderTask?.cancel();
      page?.cleanup();
      void pdfDocument?.destroy();
    };
  }, [label, src]);

  return (
    <div
      ref={hostRef}
      className="pdf-certificate-preview"
      data-state={state}
      aria-label={`${label} certificate preview`}
    >
      <canvas
        ref={canvasRef}
        className="pdf-certificate-preview__canvas"
        aria-hidden="true"
      />
      {state === "loading" ? (
        <span className="pdf-certificate-preview__status">
          Rendering certificate…
        </span>
      ) : null}
      {state === "error" ? (
        <span className="pdf-certificate-preview__status">
          Preview unavailable — open the certificate to view it.
        </span>
      ) : null}
    </div>
  );
}
