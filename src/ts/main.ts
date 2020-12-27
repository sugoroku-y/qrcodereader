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
declare const qrcodereader__canvas: HTMLCanvasElement;
declare const result: HTMLDivElement;
declare const result__list: HTMLUListElement;
declare const result__close: HTMLButtonElement;
declare const menu: HTMLDivElement;
declare const menu__item__navigate: HTMLDivElement;
declare const menu__item__copy: HTMLDivElement;

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

  qrcodereader__canvas.width = qrcodereader__canvas.clientWidth;
  qrcodereader__canvas.height = qrcodereader__canvas.clientHeight;

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
      const ctx = qrcodereader__canvas.getContext('2d');
      assert(ctx);
      ctx.clearRect(
        0,
        0,
        qrcodereader__canvas.width,
        qrcodereader__canvas.height
      );
      let index = 0;
      // 今回の読み取り結果を反映
      for (let barcode of barcodes) {
        const value = barcode.rawValue;
        const li = document.createElement('li');
        li.appendChild(document.createTextNode(value));
        result__list.appendChild(li);
        ctx.strokeStyle = colors[index % colors.length];
        ctx.beginPath();
        (({x, y}) => ctx.moveTo(x, y))(barcode.cornerPoints[0]);
        barcode.cornerPoints.slice(1).forEach(({x, y}) => ctx.lineTo(x, y));
        ctx.stroke();
      }
      // 読み取り結果を表示
      result.classList.add('shown');
      // 読み取り結果の閉じるボタンがクリックされるまで待機
      await new Promise<void>(r => {
        result__close.addEventListener('click', function handler() {
          r();
          // クリックハンドラを解除
          result__close.removeEventListener('click', handler);
        });
      });
      // クリックされたら読み取り結果を非表示
      result.classList.remove('shown');
      // 再生再開
      await qrcodereader__video.play();
    }
  } catch (e) {
    errormessage.textContent = String(e);
  }
});

/**
 * body要素左上からの位置を取得
 * @param element 
 */
function offset(element: HTMLElement) {
  const r = {left: 0, top: 0};
  while (element) {
    r.left += element.offsetLeft;
    r.top += element.offsetTop;
    element = element.offsetParent as HTMLElement;
  }
  return r;
}

document.addEventListener('click', ev => {
  if (!(ev.target instanceof HTMLElement)) {
    return;
  }
  // 読み取り結果の一項目がクリックされたとき
  const textElement = ev.target.closest('#result__list > li') as HTMLElement;
  if (textElement) {
    // 項目の左上の座標を取得
    const {left, top} = offset(textElement);
    // 項目のテキストを属性値に設定
    menu.setAttribute('data-text', textElement.textContent ?? '');
    // メニューを項目の左下に配置
    menu.style.left = `${left}px`;
    menu.style.top = `${top + textElement.offsetHeight}px`;
    // メニューを表示
    menu.classList.add('shown');
    // URLっぽいテキストでないときは「開く」をグレーアウト
    menu__item__navigate.classList.toggle(
      'disabled',
      !/^\w+:/.test(textElement.textContent ?? '')
    );
    // デフォルトのクリックを処理しないように
    ev.preventDefault();
    ev.stopPropagation();
    ev.stopImmediatePropagation();
    return;
  }
  // 読み取り結果の一項目以外のところがクリックされたら、メニューを閉じる
  menu.classList.remove('shown');

  // メニューの項目がクリックされたとき
  const menuItem = ev.target.closest('#menu > div');
  if (menuItem) {
    const text = menu.getAttribute('data-text');
    if (text) {
      // 開くがクリックされたとき
      if (menuItem === menu__item__navigate) {
        location.href = text;
        return;
      }
      // コピーがクリックされたとき
      if (menuItem === menu__item__copy) {
        navigator.clipboard?.writeText(text);
        return;
      }
    }
  }
});
