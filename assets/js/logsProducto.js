// Obtener token
function getToken() {
    return localStorage.getItem("token");
}

// ----------------------
// Fetch Logs
// ----------------------
async function fetchLogsProducto() {
    const token = getToken();
    const contentArea = document.getElementById("contentArea");
    if (!token) {
        contentArea.innerHTML = `<div class="alert alert-danger">No se encontró token. Inicia sesión nuevamente.</div>`;
        return;
    }

    try {
        const res = await fetch(`${API_BASE_URL}/logs?_=${Date.now()}`, {
            headers: { "Authorization": `Bearer ${token}` }
        });

        const text = await res.text();
        let logs;

        try {
            logs = text ? JSON.parse(text) : [];
        } catch (err) {
            logs = [];
        }

        // Si la respuesta no es un array, intentar usar un campo 'data' o convertir a array
        if (!Array.isArray(logs)) {
            if (logs.data && Array.isArray(logs.data)) {
                logs = logs.data;
            } else {
                logs = [logs]; // convertir objeto único en array
            }
        }

        displayLogs(logs);

    } catch (err) {
        contentArea.innerHTML = `<div class="alert alert-danger">Error cargando logs: ${err.message}</div>`;
        console.error(err);
    }
}

// ----------------------
// Render Logs
// ----------------------
function displayLogs(logs) {
    const contentArea = document.getElementById("contentArea");

    let html = `
        <div class="card">
            <div class="card-body">
                <h5 class="card-title">Registro de Actividades</h5>
                <div class="table-responsive">
                    <table class="table table-bordered table-striped">
                        <thead class="table-dark">
                            <tr>
                                <th>ID</th>
                                <th>Usuario</th>
                                <th>Acción</th>
                                <th>Entidad</th>
                                <th>Fecha</th>
                            </tr>
                        </thead>
                        <tbody>
    `;

    logs.forEach(log => {
        html += `
            <tr>
                <td>${log.id}</td>
                <td>${log.usuario || 'Desconocido'}</td>
                <td>${log.accion}</td>
                <td>${log.entidad || '-'}</td>
                <td>${new Date(log.fecha).toLocaleString()}</td>
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