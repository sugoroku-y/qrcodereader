"use strict";
function assert(condition) {
    if (!condition) {
        throw new Error();
    }
}
function click(selector) {
    const [target, getResolve] = typeof selector === 'string'
        ? [
            document,
            (e) => (e instanceof HTMLElement && e.closest(selector)) ||
                undefined,
        ]
        : [selector, () => undefined];
    return new Promise(resolve => {
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
        await new Promise(r => qrcodereader__video.addEventListener('loadedmetadata', () => r()));
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
                li.appendChild(document.createTextNode(`${value}: ${barcode.cornerPoints
                    .map(({ x, y }) => `(${x}, ${y})`)
                    .join(' - ')}`));
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
    }
    catch (e) {
        errormessage.textContent = String(e);
    }
    result__list.addEventListener('click', async (ev) => {
        var _a, _b;
        // 読み取り結果の一項目がクリックされたとき
        const textElement = ev.target instanceof HTMLElement &&
            ev.target.closest('li');
        if (!textElement) {
            return;
        }
        // デフォルトのクリックを処理しないように
        ev.preventDefault();
        ev.stopPropagation();
        ev.stopImmediatePropagation();
        // 選択した項目の読み取った文字列を取得
        const text = (_a = textElement.getAttribute('data-text')) !== null && _a !== void 0 ? _a : '';
        // 既に選択状態の項目があれば解除
        for (const li of result__list.querySelectorAll('li[data-selected]')) {
            li.removeAttribute('data-selected');
        }
        // 選択項目を設定
        textElement.setAttribute('data-selected', 'true');
        // クリック位置を取得
        const left = ev.pageX, top = ev.pageY;
        // メニューを項目の左下に配置
        menu.style.left = `${left}px`;
        menu.style.top = `${top}px`;
        // URLっぽいテキストでないときは「開く」をグレーアウト
        menu__item__navigate.classList.toggle('disabled', !/^\w+:/.test(text));
        // メニューを表示
        menu.classList.add('shown');
        const menuItem = await click('#menu > div');
        // メニューの項目がクリックされたとき
        switch (menuItem) {
            // 開くがクリックされたとき
            case menu__item__navigate:
                location.href = text;
                break;
            // コピーがクリックされたとき
            case menu__item__copy:
                (_b = navigator.clipboard) === null || _b === void 0 ? void 0 : _b.writeText(text);
                break;
        }
        // メニューを閉じて、選択状態を解除
        menu.classList.remove('shown');
        for (const li of result__list.querySelectorAll('li[data-selected]')) {
            li.removeAttribute('data-selected');
        }
    });
});
