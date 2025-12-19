//const API_BASE_URL = "https://lupalegiback-g6h0ckhdh2f3fcf3.canadacentral-01.azurewebsites.net/api/v1";

function showMessage(msg) {
    document.getElementById("message").innerText = msg;
}

function verifyOtp() {
    const otp = document.getElementById("otp").value.trim();
    const userId = sessionStorage.getItem("otpUserId"); // guardado al login

    if (!userId) {
        window.location.href = "index.html"; // si no hay userId, vuelve al login
        return;
    }

    fetch(`${API_BASE_URL}/otp/verificar`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            idUsuario: Number(userId),
            otp: otp
        })
    })
    .then(res => res.json())
    .then(data => {
        console.log("OTP RESPONSE:", data);

        if (!data.token) {
            showMessage("OTP incorrecto.");
            return;
        }

        // Guardar datos en LocalStorage
        localStorage.setItem("token", data.token);
        localStorage.setItem("rol", data.rol);
        localStorage.setItem("idPersonal", data.idPersonal);
        localStorage.setItem("nombre", data.nombre);
        localStorage.setItem("apellido", data.apellido);

        console.log("ROL RECIBIDO:", data.rol);
console.log("TOKEN RECIBIDO:", data.token);
        // Redirección según rol
        switch(data.rol) {
            case "ADMIN":
                window.location.href = "pages/admin/admin.html";
                break;
            case "ALMACEN":
                window.location.href = "pages/almacen/almacen.html";
                break;
            case "GERENTE":
                window.location.href = "pages/gerente/gerente.html";
                break;
            default:
                window.location.href = "dashboard.html"; // fallback
        }
    })
    .catch(err => {
        console.error(err);
        showMessage("Error validando OTP.");
    });
}
