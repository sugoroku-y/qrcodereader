interface Point2D {
  x: number;
  y: number;
}

type BarcodeFormat =
  | 'aztec'
  | 'code_128'
  | 'code_39'
  | 'code_93'
  | 'codabar'
  | 'data_matrix'
  | 'ean_13'
  | 'ean_8'
  | 'itf'
  | 'pdf417'
  | 'qr_code'
  | 'unknown'
  | 'upc_a'
  | 'upc_e';

interface DetectedBarcode {
  boundingBox: DOMRectReadOnly;
  cornerPoints: ReadonlyArray<Readonly<Point2D>>;
  format: BarcodeFormat;
  rawValue: string;
}

interface BarcodeDetector {
  detect(image: ImageBitmapSource): Promise<DetectedBarcode[]>;
}

interface BarcodeDetectorConstructor {
  new (options?: {formats: BarcodeFormat[]}): BarcodeDetector;
  getSupportedFormats(): Promise<BarcodeFormat[]>;
}

interface Window {
  BarcodeDetector?: BarcodeDetectorConstructor;
}
declare const BarcodeDetector: BarcodeDetectorConstructor;

declare const unsupported: HTMLDivElement;
declare const video: HTMLVideoElement;
declare const result__list: HTMLUListElement;

window.addEventListener('load', async () => {
  if (!navigator.mediaDevices) {
    unsupported.textContent =
      'navigator.mediaDevices is not supported by this browser.';
    unsupported.style.display = 'block';
    return;
  }

  if (window.BarcodeDetector == undefined) {
    unsupported.textContent =
      'BarcodeDetector is not supported by this browser.';
    unsupported.style.display = 'block';
    return;
  }

  const stream = await navigator.mediaDevices.getUserMedia({
    audio: false,
    video: {
      facingMode: {
        exact: 'environment',
      },
    },
  });
  video.srcObject = stream;
  await new Promise<void>(r => {
    video.onloadedmetadata = _e => {
      video.play();
      r();
    };
  });
  try {
    const barcodeDetector = new BarcodeDetector();
    while (true) {
      const barcodes = await barcodeDetector.detect(video);
      if (!barcodes.length) {
        await new Promise(r => setTimeout(r, 200));
        continue;
      }
      while (result__list.firstChild) {
        result__list.removeChild(result__list.firstChild);
      }
      for (let barcode of barcodes) {
        const value = barcode.rawValue;
        const content = (() => {
          if (!/^\w+:\/\//.test(value)) {
            document.createTextNode(value);
          }
          const anchor = document.createElement('a');
          anchor.textContent = value;
          anchor.href = value;
          return anchor;
        })();
        const li = document.createElement('li');
        li.appendChild(content);
        result__list.appendChild(li);
      }
    }
  } catch (e) {
    console.error(e);
  }
});
