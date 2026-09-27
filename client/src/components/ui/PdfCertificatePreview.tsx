import { useEffect, useRef, useState } from "react";

const PDFJS_MODULE_URL =
  "https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.min.mjs";
const PDFJS_WORKER_URL =
  "https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.worker.min.mjs";

type PdfRenderTask = {
  promise: Promise<void>;
  cancel?: () => void;
};

type PdfPage = {
  getViewport: (options: { scale: number }) => {
    width: number;
    height: number;
  };
  render: (options: {
    canvasContext: CanvasRenderingContext2D;
    viewport: { width: number; height: number };
  }) => PdfRenderTask;
};

type PdfDocument = {
  getPage: (pageNumber: number) => Promise<PdfPage>;
  destroy?: () => Promise<void> | void;
};

type PdfJsModule = {
  GlobalWorkerOptions: { workerSrc: string };
  getDocument: (options: { url: string }) => {
    promise: Promise<PdfDocument>;
    destroy?: () => Promise<void> | void;
  };
};

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
    let renderTask: PdfRenderTask | null = null;
    let pdfDocument: PdfDocument | null = null;

    const render = async () => {
      try {
        setState("loading");

        const pdfJsUrl = PDFJS_MODULE_URL;
        const pdfjs = (await import(/* @vite-ignore */ pdfJsUrl)) as PdfJsModule;
        pdfjs.GlobalWorkerOptions.workerSrc = PDFJS_WORKER_URL;

        const loadingTask = pdfjs.getDocument({ url: src });
        pdfDocument = await loadingTask.promise;
        if (cancelled) return;

        const page = await pdfDocument.getPage(1);
        if (cancelled) return;

        const canvas = canvasRef.current;
        const host = hostRef.current;
        if (!canvas || !host) return;

        const baseViewport = page.getViewport({ scale: 1 });
        const maxWidth = Math.max(240, host.clientWidth - 20);
        const maxHeight = 224;
        const cssScale = Math.min(
          maxWidth / baseViewport.width,
          maxHeight / baseViewport.height,
        );
        const outputScale = Math.min(window.devicePixelRatio || 1, 2);
        const renderViewport = page.getViewport({
          scale: cssScale * outputScale,
        });

        canvas.width = Math.max(1, Math.floor(renderViewport.width));
        canvas.height = Math.max(1, Math.floor(renderViewport.height));
        canvas.style.width = `${Math.floor(renderViewport.width / outputScale)}px`;
        canvas.style.height = `${Math.floor(renderViewport.height / outputScale)}px`;

        const context = canvas.getContext("2d", { alpha: false });
        if (!context) throw new Error("Canvas context unavailable");

        context.fillStyle = "#ffffff";
        context.fillRect(0, 0, canvas.width, canvas.height);

        renderTask = page.render({
          canvasContext: context,
          viewport: renderViewport,
        });
        await renderTask.promise;

        if (!cancelled) setState("ready");
      } catch (error) {
        if (cancelled) return;
        console.error("Certificate preview render failed", error);
        setState("error");
      }
    };

    void render();

    return () => {
      cancelled = true;
      renderTask?.cancel?.();
      void pdfDocument?.destroy?.();
    };
  }, [src]);

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
        <span className="pdf-certificate-preview__status">Rendering certificate…</span>
      ) : null}
      {state === "error" ? (
        <span className="pdf-certificate-preview__status">
          Preview unavailable — open the certificate to view it.
        </span>
      ) : null}
    </div>
  );
}
