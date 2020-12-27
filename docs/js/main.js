"use strict";
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
                const li = document.createElement('li');
                li.appendChild(document.createTextNode(value));
                result__list.appendChild(li);
            }
            result.classList.add('shown');
            await new Promise(r => {
                result__close.addEventListener('click', function handler() {
                    result.classList.remove('shown');
                    r();
                    result__close.removeEventListener('click', handler);
                });
            });
        }
    }
    catch (e) {
        errormessage.textContent = String(e);
    }
});
function offset(element) {
    return (function sub(e) {
        const { left, top } = e.offsetParent
            ? sub(e.offsetParent)
            : { left: 0, top: 0 };
        return { left: left + e.offsetLeft, top: top + e.offsetTop };
    })(element);
}
document.addEventListener('click', ev => {
    var _a, _b, _c;
    if (!(ev.target instanceof HTMLElement)) {
        return;
    }
    const textElement = ev.target.closest('#result__list > li');
    if (textElement) {
        const { left, top } = offset(textElement);
        menu.setAttribute('data-text', (_a = textElement.textContent) !== null && _a !== void 0 ? _a : '');
        menu.style.left = `${left}px`;
        menu.style.top = `${top + textElement.offsetHeight}px`;
        menu.classList.add('shown');
        menu__item__navigate.classList.toggle('disabled', !/^\w+:/.test((_b = textElement.textContent) !== null && _b !== void 0 ? _b : ''));
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
                (_c = navigator.clipboard) === null || _c === void 0 ? void 0 : _c.writeText(text);
                return;
            }
        }
    }
});
