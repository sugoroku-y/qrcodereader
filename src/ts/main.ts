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

declare const errormessage: HTMLDivElement;
declare const qrcodereader__video: HTMLVideoElement;
declare const result: HTMLDivElement;
declare const result__list: HTMLUListElement;
declare const result__close: HTMLButtonElement;
declare const menu: HTMLDivElement;
declare const menu__item__navigate: HTMLDivElement;
declare const menu__item__copy: HTMLDivElement;

window.addEventListener('load', async () => {
  if (!navigator.mediaDevices) {
    errormessage.textContent =
      'navigator.mediaDevices is not supported by this browser.';
    return;
  }

  if (window.BarcodeDetector == undefined) {
    errormessage.textContent =
      'BarcodeDetector is not supported by this browser.';
    return;
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: {
        facingMode: {
          exact: 'environment',
        },
      },
    });
    qrcodereader__video.srcObject = stream;
    await new Promise<void>(r => {
      qrcodereader__video.onloadedmetadata = _e => {
        qrcodereader__video.play();
        r();
      };
    });
    const barcodeDetector = new BarcodeDetector();
    while (true) {
      const barcodes = await barcodeDetector.detect(qrcodereader__video);
      if (!barcodes.length) {
        await new Promise(r => setTimeout(r, 200));
        continue;
      }
      while (result__list.firstChild) {
        result__list.removeChild(result__list.firstChild);
      }
      for (let barcode of barcodes) {
        const value = barcode.rawValue;
        const li = document.createElement('li');
        li.appendChild(document.createTextNode(value));
        result__list.appendChild(li);
      }
      result.classList.add('shown');
      await new Promise<void>(r => {
        result__close.addEventListener('click', function handler() {
          result.classList.remove('shown');
          r();
          result__close.removeEventListener('click', handler);
        });
      });
    }
  } catch (e) {
    errormessage.textContent = String(e);
  }
});

function offset(element: HTMLElement) {
  return (function sub(e: HTMLElement): {left: number; top: number} {
    const {left, top} = e.offsetParent
      ? sub(e.offsetParent as HTMLElement)
      : {left: 0, top: 0};
    return {left: left + e.offsetLeft, top: top + e.offsetTop};
  })(element);
}

document.addEventListener('click', ev => {
  if (!(ev.target instanceof HTMLElement)) {
    return;
  }
  const textElement = ev.target.closest('#result__list > li') as HTMLElement;
  if (textElement) {
    const {left, top} = offset(textElement);
    menu.setAttribute('data-text', textElement.textContent ?? '');
    menu.style.left = `${left}px`;
    menu.style.top = `${top + textElement.offsetHeight}px`;
    menu.classList.add('shown');
    menu__item__navigate.classList.toggle(
      'disabled',
      !/^\w+:/.test(textElement.textContent ?? '')
    );
    ev.preventDefault();
    ev.stopPropagation();
    ev.stopImmediatePropagation();
    return;
  }
  menu.classList.remove('shown');

  const menuItem = ev.target.closest('#menu > div');
  if (menuItem) {
    const text = menu.getAttribute('data-text');
    if (text) {
      if (menuItem === menu__item__navigate) {
        location.href = text;
        return;
      }
      if (menuItem === menu__item__copy) {
        navigator.clipboard?.writeText(text);
        return;
      }
    }
  }
});