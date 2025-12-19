function showMessage(msg) {
    document.getElementById("message").innerText = msg;
}

function login() {
    const usuario = document.getElementById("usuario").value.trim();
    const password = document.getElementById("password").value.trim();
    const captchaToken =
        document.querySelector('[name="g-recaptcha-response"]').value;

    if (!captchaToken) {
        showMessage("Valida el captcha.");
        return;
    }

    // 1️⃣ CAPTCHA (esto ya sabemos que funciona)
    fetch(`${API_BASE_URL}/captcha/register`, {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8"
        },
        body: "g-recaptcha-response=" + encodeURIComponent(captchaToken)
    })
    .then(res => res.text())
    .then(text => {

        if (text !== "Registro exitoso") {
            throw new Error("Captcha inválido");
        }

        // 2️⃣ LOGIN — JSON PURO (IGUAL QUE POSTMAN)
        return fetch(`${API_BASE_URL}/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json; charset=UTF-8"
            },
            body: JSON.stringify({
                usuario: usuario,
                contraseña: password
            })
        });
    })
    .then(res => {
        if (!res.ok) {
            throw new Error("Login inválido");
        }
        return res.json();
    })
    .then(data => {

        if (!data.idPersonal) {
            showMessage("Usuario y contraseña incorrectos.");
            return;
        }

        sessionStorage.setItem("otpUserId", data.idPersonal);
        window.location.href = "otp.html";
    })
    .catch(err => {
        console.error("LOGIN ERROR:", err);
        showMessage("Usuario y contraseña incorrectos.");
        if (window.grecaptcha) grecaptcha.reset();
    });
}


// Obtener token desde localStorage
function getToken() {
    return localStorage.getItem("token");
}

// Función de logout
async function logout() {
    const token = getToken();

    try {
        if (token) {
            // Llamada al endpoint de logout
            await fetch(`${API_BASE_URL}/api/v1/logout`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
            });
        }
    } catch (err) {
        console.error("Error al cerrar sesión en el servidor:", err);
    } finally {
        // Limpiar almacenamiento local y redirigir
        localStorage.clear();
        window.location.href = "../../index.html";
    }
}

// Asociar al botón de logout
document.addEventListener("DOMContentLoaded", () => {
    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", logout);
    }
});
