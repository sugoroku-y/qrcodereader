"use strict";
window.addEventListener('load', async () => {
    if (!navigator.mediaDevices) {
        unsupported.textContent =
            'navigator.mediaDevices is not supported by this browser.';
        unsupported.style.display = '';
        return;
    }
    if (window.BarcodeDetector == undefined) {
        unsupported.textContent =
            'BarcodeDetector is not supported by this browser.';
        unsupported.style.display = '';
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
        await new Promise(r => {
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
    }
    catch (e) {
        unsupported.textContent = String(e);
        unsupported.style.display = '';
    }
});
