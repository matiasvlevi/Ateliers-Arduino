async function derive_key_and_iv(password, salt, iterations = 10000, keyLength = 256) {
    const encoder = new TextEncoder();
    const passwordBytes = encoder.encode(password);

    // Create a key material from the password using PBKDF2
    const keyMaterial = await crypto.subtle.importKey(
        "raw",
        passwordBytes,
        "PBKDF2",
        false,
        ["deriveBits"]
    );

    // Calculate total length needed for both key and IV
    const totalLength = keyLength / 8 + 16; // keyLength in bytes, plus 16 bytes for IV

    const derivedBits = await crypto.subtle.deriveBits(
        {
            name: "PBKDF2",
            salt: salt,
            iterations: iterations,
            hash: "SHA-256",
        },
        keyMaterial,
        totalLength * 8
    );

    const derivedBytes = new Uint8Array(derivedBits);
    return {
        key: await crypto.subtle.importKey(
            "raw",
            derivedBytes.slice(0, keyLength / 8),
            "AES-CBC",
            false,
            ["decrypt"]
        ),
        iv: derivedBytes.slice(keyLength / 8)
    };
}

async function decrypt_b64(base64Data, password) {
    const encryptedData = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));

    // Extract prefix and verify
    const expectedPrefix = "Salted__";
    const prefix = new TextDecoder().decode(encryptedData.slice(0, 8));
    if (prefix !== expectedPrefix) {
        throw new Error("Expected a 'Salted__' prefix, but it's missing.");
    }

    // Extract salt and the encrypted content
    const salt = encryptedData.slice(8, 16);
    const ciphertext = encryptedData.slice(16);

    // Derive key and IV
    const { key, iv } = await derive_key_and_iv(password, salt);

    // Decrypt the ciphertext
    const decrypted = await crypto.subtle.decrypt(
        {
            name: "AES-CBC",
            iv: iv
        },
        key,
        ciphertext
    );

    return new Uint8Array(decrypted);
}

function open_asset(byteArray, options) {
    const blob = new Blob([byteArray], options);
    const blobUrl = URL.createObjectURL(blob);
    window.open(blobUrl, '_blank');
    console.log(`PDF decrypted and opened : \n ${blobUrl}`);
}

async function enc_link(path) {
    return fetch(path)
        .then(response => response.text())
        .then(b64 => decrypt_b64(b64, prompt('Enter Password')));
}
