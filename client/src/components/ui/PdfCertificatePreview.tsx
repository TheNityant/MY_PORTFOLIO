import { useEffect, useRef, useState } from "react";

const PDFJS_SCRIPT_URL =
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
const PDFJS_WORKER_URL =
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

type PdfRenderTask = {
  promise: Promise<void>;
  cancel?: () => void;
};

type PdfViewport = {
  width: number;
  height: number;
};

type PdfPage = {
  getViewport: (options: { scale: number }) => PdfViewport;
  render: (options: {
    canvasContext: CanvasRenderingContext2D;
    viewport: PdfViewport;
  }) => PdfRenderTask;
  cleanup?: () => void;
};

type PdfDocument = {
  getPage: (pageNumber: number) => Promise<PdfPage>;
  destroy?: () => Promise<void> | void;
};

type PdfJsLib = {
  GlobalWorkerOptions: { workerSrc: string };
  getDocument: (options: {
    url: string;
    disableRange?: boolean;
    disableStream?: boolean;
    disableAutoFetch?: boolean;
    stopAtErrors?: boolean;
  }) => {
    promise: Promise<PdfDocument>;
    destroy?: () => Promise<void> | void;
  };
};

declare global {
  interface Window {
    pdfjsLib?: PdfJsLib;
  }
}

let pdfJsPromise: Promise<PdfJsLib> | null = null;

function loadPdfJs() {
  if (window.pdfjsLib) {
    window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER_URL;
    return Promise.resolve(window.pdfjsLib);
  }

  if (pdfJsPromise) return pdfJsPromise;

  pdfJsPromise = new Promise<PdfJsLib>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      'script[data-portfolio-pdfjs="true"]',
    );

    const finish = () => {
      if (!window.pdfjsLib) {
        reject(new Error("PDF.js loaded without exposing pdfjsLib"));
        return;
      }

      window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER_URL;
      resolve(window.pdfjsLib);
    };

    if (existing) {
      existing.addEventListener("load", finish, { once: true });
      existing.addEventListener(
        "error",
        () => reject(new Error("PDF.js script failed to load")),
        { once: true },
      );
      return;
    }

    const script = document.createElement("script");
    script.src = PDFJS_SCRIPT_URL;
    script.async = true;
    script.crossOrigin = "anonymous";
    script.dataset.portfolioPdfjs = "true";
    script.addEventListener("load", finish, { once: true });
    script.addEventListener(
      "error",
      () => reject(new Error("PDF.js script failed to load")),
      { once: true },
    );
    document.head.appendChild(script);
  });

  return pdfJsPromise;
}

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
    let page: PdfPage | null = null;

    const render = async () => {
      try {
        setState("loading");

        const pdfjs = await loadPdfJs();
        if (cancelled) return;

        // These certificate files are small. Fetch each PDF as one complete
        // response instead of relying on range/stream support through the
        // Vercel proxy, which was unreliable for some PDFs.
        const loadingTask = pdfjs.getDocument({
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

        context.save();
        context.fillStyle = "#ffffff";
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.restore();

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
      renderTask?.cancel?.();
      page?.cleanup?.();
      void pdfDocument?.destroy?.();
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
