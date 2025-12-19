// ----------------------
// Variables globales
// ----------------------
let sesionesActivasCache = [];

// ----------------------
// Obtener token
// ----------------------
function getToken() {
    return localStorage.getItem("token");
}

// ----------------------
// Fetch Sesiones Activas
// ----------------------
async function fetchSesionesActivas() {
    const token = getToken();
    const contentArea = document.getElementById("contentArea");

    if (!token) {
        contentArea.innerHTML = `<div class="alert alert-danger">No se encontró token. Inicia sesión nuevamente.</div>`;
        return;
    }

    try {
        const res = await fetch(`${API_BASE_URL}/logs/auth/activas?_=${Date.now()}`, {
            headers: { "Authorization": `Bearer ${token}` }
        });

        // Si hay error, tratar de leer mensaje
        if (!res.ok) {
            let msg = `HTTP ${res.status}`;
            try {
                const errData = await res.json();
                if (errData.message) msg += ` - ${errData.message}`;
            } catch {}
            throw new Error(msg);
        }

        let sesiones = await res.json();

        // Si viene un objeto con data, usamos data
        if (!Array.isArray(sesiones) && sesiones.data && Array.isArray(sesiones.data)) {
            sesiones = sesiones.data;
        }

        // Guardamos en cache
        sesionesActivasCache = Array.isArray(sesiones) ? sesiones : [];

        displaySesionesActivas(sesionesActivasCache);

    } catch (err) {
        contentArea.innerHTML = `<div class="alert alert-danger">Error cargando sesiones activas: ${err.message}</div>`;
        console.error("fetchSesionesActivas error:", err);
    }
}

// ----------------------
// Render Sesiones Activas
// ----------------------
function displaySesionesActivas(sesiones) {
    const contentArea = document.getElementById("contentArea");

    if (!sesiones.length) {
        contentArea.innerHTML = `<div class="alert alert-info">No hay sesiones activas</div>`;
        return;
    }

    let html = `
        <div class="card">
            <div class="card-body">
                <h5 class="card-title">Sesiones Activas</h5>
                <div class="table-responsive">
                    <table class="table table-bordered table-striped">
                        <thead class="table-dark">
                            <tr>
                                <th>ID</th>
                                <th>Usuario Ingresado</th>
                                <th>Tipo Evento</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
    `;

    sesiones.forEach(s => {
        html += `
            <tr>
                <td>${s.id}</td>
                <td>${s.usuarioIngresado}</td>
                <td>${s.tipoEvento}</td>
                <td>
                    <button class="btn btn-primary btn-sm" onclick="viewSesionActiva(${s.id})">Ver</button>
                </td>
            </tr>
        `;
    });

    html += `
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;

    contentArea.innerHTML = html;
}

// ----------------------
// Ver detalle de sesión activa (usa cache)
// ----------------------
function viewSesionActiva(id) {
    const s = sesionesActivasCache.find(sess => sess.id === id);
    if (!s) return alert("Sesión no encontrada");

    document.getElementById("viewSesionActivaBody").innerHTML = `
        <ul class="list-group">
            <li class="list-group-item"><strong>ID:</strong> ${s.id}</li>
            <li class="list-group-item"><strong>Usuario Ingresado:</strong> ${s.usuarioIngresado}</li>
            <li class="list-group-item"><strong>Tipo Evento:</strong> ${s.tipoEvento}</li>
            <li class="list-group-item"><strong>Fecha:</strong> ${s.fecha}</li>
            <li class="list-group-item"><strong>Hora:</strong> ${s.hora}</li>
            <li class="list-group-item"><strong>ID Usuario:</strong> ${s.idUsuario}</li>
            <li class="list-group-item"><strong>IP Address:</strong> ${s.ipAddress}</li>
            <li class="list-group-item"><strong>Token ID:</strong> ${s.tokenId}</li>
            <li class="list-group-item"><strong>Activo:</strong> ${s.active}</li>
            <li class="list-group-item"><strong>Expiración:</strong> ${new Date(s.expirationTime).toLocaleString()}</li>
        </ul>
    `;

    const modal = new bootstrap.Modal(document.getElementById('viewSesionActivaModal'));
    modal.show();
}
