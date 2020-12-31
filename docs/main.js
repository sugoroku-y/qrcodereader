"use strict";
function assert(condition) {
    if (!condition) {
        throw new Error();
    }
}
function forEvent(target, name, cancel) {
    return new Promise((resolve, reject) => {
        function handler(ev) {
            removeHandler();
            resolve(ev.target);
        }
        function cancelhandler() {
            removeHandler();
            reject(cancel);
        }
        function removeHandler() {
            target.removeEventListener(name, handler);
            if (cancel) {
                target.removeEventListener(cancel, cancelhandler);
            }
        }
        target.addEventListener(name, handler);
        if (cancel) {
            target.addEventListener(cancel, cancelhandler);
        }
    });
}
function timeout(elapsis) {
    return new Promise(resolve => setTimeout(resolve, elapsis));
}
async function hideResult() {
    // ゆっくりと結果を非表示にする
    result.style.transition = '3s';
    result.style.opacity = '0';
    try {
        await forEvent(result, 'transitionend', 'transitioncancel');
        // 完全に消えたら表示用クラスを外す
        result.classList.remove('shown');
    }
    catch (ex) {
        // アニメーション途中でキャンセルされたら非表示にしない
        return;
    }
    finally {
        // アニメーション用スタイルを解除
        result.style.transition = '';
        result.style.opacity = '';
    }
    // 次回表示のために今までの結果をクリア
    while (result__list.firstChild) {
        result__list.removeChild(result__list.firstChild);
    }
}
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
    // 読み取り結果ダイアログがクリックされたとき
    result.addEventListener('click', async () => {
        if (result.style.transition) {
            // アニメーションの途中ならキャンセル
            result.style.transition = '';
            return;
        }
        if (result.classList.toggle('stopped')) {
            qrcodereader__video.pause();
        }
        else {
            // 再開したら結果を非表示に
            await hideResult();
            qrcodereader__video.play();
        }
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
                    hideTimer = setTimeout(async () => {
                        // ただし停止中なら消さない
                        if (!qrcodereader__video.paused) {
                            await hideResult();
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
            // 今回の読み取り結果を反映
            LOOP: for (const barcode of barcodes) {
                const text = barcode.rawValue;
                // 既に読み取った結果の中にあれば何もしない
                for (const li of result__list.children) {
                    if (li.textContent === text) {
                        continue LOOP;
                    }
                }
                const li = document.createElement('li');
                li.appendChild(document.createTextNode(text));
                result__list.appendChild(li);
            }
            // 読み取り結果を表示
            result.classList.add('shown');
            result.style.transition = '';
        }
    }
    catch (e) {
        errormessage.textContent = String(e);
    }
})();
// サービスワーカーの用意
if ('serviceWorker' in navigator) {
    (async () => {
        try {
            const regist = await navigator.serviceWorker.register('sw.js');
            console.log(`ServiceWorker registration success(scope: ${regist.scope})`);
        }
        catch (err) {
            console.log(`ServiceWorker registration failure(${err})`);
        }
    })();
}
