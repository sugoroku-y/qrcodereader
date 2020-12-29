function assert<T extends {} | []>(
  condition: T | null | undefined
): asserts condition is T {
  if (!condition) {
    throw new Error();
  }
}

// BarcodeDetectorのための定義・宣言 ここから

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
  prototype: BarcodeDetector;
  getSupportedFormats(): Promise<BarcodeFormat[]>;
}

interface Window {
  BarcodeDetector?: BarcodeDetectorConstructor;
}
declare const BarcodeDetector: BarcodeDetectorConstructor;
// BarcodeDetectorのための型定義・宣言 ここまで

// html内でID指定した要素
declare const errormessage: HTMLDivElement;
declare const qrcodereader__video: HTMLVideoElement;
declare const result: HTMLDivElement;
declare const result__list: HTMLUListElement;
declare const result__close: HTMLButtonElement;

function click<E extends HTMLElement>(selector: string): Promise<E | undefined>;
function click<E extends HTMLElement>(selector: HTMLElement): Promise<void>;
function click<E extends HTMLElement>(
  selector: string | HTMLElement
): Promise<E | undefined> {
  const [target, getResolve] =
    typeof selector === 'string'
      ? [
          document,
          (e: unknown) =>
            (e instanceof HTMLElement && (e.closest(selector) as E)) ||
            undefined,
        ]
      : [selector, () => undefined];
  return new Promise<E | undefined>(resolve => {
    target.addEventListener('click', function handler(ev) {
      target.removeEventListener('click', handler);
      resolve(getResolve(ev.target));
    });
  });
}

const colors = ['red', 'blue', 'green', 'yellow', 'cyan', 'magenta'];

window.addEventListener('load', async () => {
  // navigator.mediaDevicesがなければエラー
  if (!navigator.mediaDevices) {
    errormessage.textContent =
      'navigator.mediaDevices is not supported by this browser.';
    return;
  }

  // BarcodeDetectorがなければエラー
  if (!window.BarcodeDetector) {
    errormessage.textContent =
      'BarcodeDetector is not supported by this browser.';
    return;
  }
  try {
    // カメラからのストリームを取得してvideoに接続
    qrcodereader__video.srcObject = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: {
        facingMode: {
          exact: 'environment',
        },
      },
    });
    // 読み込み完了を待つ
    await new Promise<void>(r =>
      qrcodereader__video.addEventListener('loadedmetadata', () => r())
    );
    // 再生開始
    await qrcodereader__video.play();
    // バーコード読み取り機能の準備
    const barcodeDetector = new BarcodeDetector();

    while (true) {
      // バーコード読み取り
      const barcodes = await barcodeDetector.detect(qrcodereader__video);
      // バーコードが読み取れなかったら空の配列が返る
      if (!barcodes.length) {
        // 0.2秒待機してもう一度
        await new Promise(r => setTimeout(r, 200));
        continue;
      }
      // 一旦再生を停止
      qrcodereader__video.pause();
      // 一旦前回の読み取り結果を削除
      while (result__list.firstChild) {
        result__list.removeChild(result__list.firstChild);
      }
      let index = 0;
      // 今回の読み取り結果を反映
      for (let barcode of barcodes) {
        const value = barcode.rawValue;
        const li = document.createElement('li');
        li.appendChild(document.createTextNode(value));
        li.setAttribute('data-text', value);
        result__list.appendChild(li);
      }
      // 読み取り結果を表示
      result.classList.add('shown');
      // 読み取り結果の閉じるボタンがクリックされるまで待機
      await click(result__close);
      // クリックされたら読み取り結果を非表示
      result.classList.remove('shown');
      // 再生再開
      await qrcodereader__video.play();
    }
  } catch (e) {
    errormessage.textContent = String(e);
  }
});

window.addEventListener('load', () => {
  result__list.addEventListener('click', ev => {
    // 読み取り結果の一項目がクリックされたとき
    const textElement =
      ev.target instanceof HTMLElement &&
      (ev.target.closest('li') as HTMLElement);
    if (!textElement) {
      return;
    }
    // デフォルトのクリックを処理しないように
    ev.preventDefault();
    ev.stopPropagation();
    ev.stopImmediatePropagation();
    // 文字列を選択する
    const textNode = textElement.firstChild as Text;
    window
      .getSelection()
      ?.setBaseAndExtent(textNode, 0, textNode, textNode.data.length);
  });
});