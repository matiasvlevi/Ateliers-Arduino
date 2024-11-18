function decrypt_pdf(encryptedPdf, password) {
    const decrypted = CryptoJS.AES.decrypt(encryptedPdf, password);

    const base64Pdf = decrypted.toString(CryptoJS.enc.Utf8);

    if (!base64Pdf) {
        alert('Invalid password or corrupted PDF.');
        return;
    }

    return base64Pdf;
}

function to_byte_array(base64Pdf) {

    // Convert base64 string to a binary buffer
    const byteCharacters = atob(base64Pdf);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);

    return byteArray;
}

function open_pdf(byteArray) {
    // Create a blob and open the PDF in a new tab
    const blob = new Blob([byteArray], { type: 'application/pdf' });
    const blobUrl = URL.createObjectURL(blob);
    window.open(blobUrl, '_blank');
}

function pdf_link(path) {
    console.log(path)
    fetch(path)
        .then(response => response.blob())
        .then(blob => {
            const reader = new FileReader();
            reader.onload = () => {
                try {
                    open_pdf(to_byte_array(decrypt_pdf(
                        reader.result,
                        prompt('Enter Password'))));
                } catch (e) {
                    alert('Invalid password or corrupted document.');
                }
            };
            reader.readAsText(blob);
        });
}
