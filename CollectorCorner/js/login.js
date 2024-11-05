// js/login.js

function showError() {
    const urlParams = new URLSearchParams(window.location.search);
    const error = urlParams.get('error');
    if (error === '1') {
        const messageContainer = document.getElementById('error-message');
        messageContainer.innerHTML = '<p style="color:red;">Usuario o contraseña incorrectos.</p>';
    }
}

