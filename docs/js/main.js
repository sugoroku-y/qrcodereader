"use strict";
function assert(condition) {
    if (!condition) {
        throw new Error();
    }
}
function forEvent(target, name) {
    return new Promise(resolve => {
        target.addEventListener(name, function handler(ev) {
            target.removeEventListener(name, handler);
            resolve(ev.target);
        });
    });
}
function timeout(elapsis) {
    return new Promise(resolve => setTimeout(resolve, elapsis));
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
    // 読み取り結果の一項目がクリックされたとき
    result__list.addEventListener('click', ev => {
        var _a;
        const textElement = ev.target instanceof HTMLElement &&
            ev.target.closest('li');
        if (!textElement) {
            return;
        }
        // デフォルトのクリックを処理しないように
        ev.preventDefault();
        ev.stopPropagation();
        ev.stopImmediatePropagation();
        // 要素内の文字列を全選択する
        const textNode = textElement.firstChild;
        (_a = window
            .getSelection()) === null || _a === void 0 ? void 0 : _a.setBaseAndExtent(textNode, 0, textNode, textNode.data.length);
    });
    // 停止ボタンが押されたとき
    result__stop.addEventListener('click', () => {
        result.classList.add('stopped');
        qrcodereader__video.pause();
    });
    // 再開ボタンが押されたとき
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
        let hideTimer = 0;
        while (true) {
            // 停止中なら再開されるまで待つ
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
                        // ただし停止中なら消さない
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
    }
    catch (e) {
        errormessage.textContent = String(e);
    }
})();
