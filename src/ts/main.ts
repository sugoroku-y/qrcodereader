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
declare const result__stop: HTMLButtonElement;
declare const result__resume: HTMLButtonElement;

function forEvent(
  target: EventTarget,
  name: string
): Promise<EventTarget | null> {
  return new Promise<EventTarget | null>(resolve => {
    target.addEventListener(name, function handler(ev) {
      target.removeEventListener(name, handler);
      resolve(ev.target);
    });
  });
}

function timeout(elapsis: number): Promise<void> {
  return new Promise<void>(resolve => setTimeout(resolve, elapsis));
}

const colors = ['red', 'blue', 'green', 'yellow', 'cyan', 'magenta'];

(async () => {
  await forEvent(window, 'DOMContentLoaded');

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
    // 要素内の文字列を全選択する
    const textNode = textElement.firstChild as Text;
    window
      .getSelection()
      ?.setBaseAndExtent(textNode, 0, textNode, textNode.data.length);
  });

  result__stop.addEventListener('click', () => {
    result.classList.add('stopped');
    qrcodereader__video.pause();
  });
  result__resume.addEventListener('click', () => {
    result.classList.remove('shown', 'stopped');
    qrcodereader__video.play();
  });
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
    await forEvent(qrcodereader__video, 'loadedmetadata');
    // 再生開始
    await qrcodereader__video.play();
    // バーコード読み取り機能の準備
    const barcodeDetector = new BarcodeDetector();

    let hideTimer: number = 0;
    while (true) {
      if (qrcodereader__video.paused) {
        await forEvent(qrcodereader__video, 'play');
        // 再開すぐに読み取り開始すると前回の画像が残っているかも知れないのでちょっと待つ
        await timeout(200);
      }
      // バーコード読み取り
      const barcodes = await barcodeDetector.detect(qrcodereader__video);
      // バーコードが読み取れなかったら空の配列が返る
      if (!barcodes.length) {
        // バーコードがなければ読み取り結果を3秒後に非表示にする
        if (result.classList.contains('shown') && !hideTimer) {
          hideTimer = setTimeout(() => {
            if (!qrcodereader__video.paused) {
              result.classList.remove('shown');
            }
            hideTimer = 0;
          }, 3000);
        }
        // 0.2秒待機してもう一度
        await timeout(200);
        continue;
      }
      // バーコードがあれば非表示タイマーを解除
      if (hideTimer) {
        clearTimeout(hideTimer);
        hideTimer = 0;
      }
      // 一旦前回の読み取り結果を削除
      while (result__list.firstChild) {
        result__list.removeChild(result__list.firstChild);
      }
      // 今回の読み取り結果を反映
      for (const barcode of barcodes) {
        const li = document.createElement('li');
        li.appendChild(document.createTextNode(barcode.rawValue));
        result__list.appendChild(li);
      }
      // 読み取り結果を表示
      result.classList.add('shown');
    }
  } catch (e) {
    errormessage.textContent = String(e);
  }
})();
