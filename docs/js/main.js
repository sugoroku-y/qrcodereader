"use strict";
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
    await new Promise(r => {
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
    }
    catch (e) {
        console.error(e);
    }
});
