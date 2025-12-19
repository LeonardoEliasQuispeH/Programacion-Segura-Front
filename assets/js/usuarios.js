// Obtener token desde localStorage
function getToken() {
    return localStorage.getItem("token");
}

// ----------------------
// Listar Usuarios
// ----------------------
async function fetchUsuarios() {
    const token = localStorage.getItem("token");
    const contentArea = document.getElementById("contentArea");

    if (!token) {
        contentArea.innerHTML = `<div class="alert alert-danger">No se encontró token. Inicia sesión nuevamente.</div>`;
        return;
    }

    try {
        const res = await fetch(`${API_BASE_URL}/usuarios?_=${Date.now()}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            }
        });

        if (!res.ok) throw new Error(`Error ${res.status}: ${res.statusText}`);
        const data = await res.json();
        displayUsuarios(data);

    } catch (err) {
        contentArea.innerHTML = `<div class="alert alert-danger">Error cargando Usuarios: ${err.message}</div>`;
    }
}

// ----------------------
// Renderizar usuarios
// ----------------------
function displayUsuarios(usuarios) {
    const contentArea = document.getElementById("contentArea");

    let html = `<h3>Usuarios</h3>`;

    if (!usuarios || usuarios.length === 0) {
        html += "<p>No hay usuarios registrados.</p>";
        contentArea.innerHTML = html;
        return;
    }

    html += `<div class="row">`;
    usuarios.forEach(u => {
        html += `
        <div class="col-md-4 mb-4">
            <div class="card h-100">
                <div class="card-body">
                    <h5 class="card-title">${u.usuario}</h5>
                    <p class="card-text"><strong>ID:</strong> ${u.id}</p>
                    <p class="card-text"><strong>Correo:</strong> ${u.correo}</p>
                    <p class="card-text"><strong>Estado:</strong> ${u.estado}</p>
                    <button class="btn btn-warning btn-sm" onclick="editUsuario(${u.id})">Editar</button>
                </div>
            </div>
        </div>`;
    });
    html += `</div>`;
    contentArea.innerHTML = html;
}

// ----------------------
// Editar Usuario
// ----------------------
async function editUsuario(id) {
    const token = localStorage.getItem("token");
    if (!token) return alert("No se encontró token.");
    const alertDiv = document.getElementById("editUsuarioAlert");

    try {
        // Obtener info del usuario
        const resUser = await fetch(`${API_BASE_URL}/usuarios/${id}?_=${Date.now()}`, {
            method: "GET",
            headers: { "Authorization": `Bearer ${token}` }
        });
        if (!resUser.ok) throw new Error("Error al cargar usuario");
        const user = await resUser.json();

        // Mostrar datos generales
        document.getElementById("editUsuarioId").innerText = user.id;
        document.getElementById("editUsuarioIdInput").value = user.id;
        document.getElementById("editUsuarioNombre").innerText = user.usuario;
        document.getElementById("editUsuarioCorreo").innerText = user.correo;

        // Estado
        const estadoSpan = document.getElementById("editUsuarioEstado");
        const btnEstado = document.getElementById("btnActivarDesactivar");
        estadoSpan.innerText = user.estado;
        btnEstado.innerText = user.estado === "ACTIVO" ? "Desactivar" : "Activar";
        btnEstado.className = user.estado === "ACTIVO" ? "btn btn-danger btn-sm ms-2" : "btn btn-success btn-sm ms-2";

        btnEstado.onclick = async () => {
            const accion = user.estado === "ACTIVO" ? "desactivar" : "activar";
            try {
                const res = await fetch(`${API_BASE_URL}/usuarios/${id}/${accion}`, {
                    method: "PATCH",
                    headers: { "Authorization": `Bearer ${token}` }
                });
                if (!res.ok) throw new Error(`Error al ${accion} usuario`);
                const data = await res.json();
                alertDiv.innerHTML = `<div class="alert alert-success">${data.message || `Usuario ${accion} correctamente`}</div>`;
                user.estado = accion === "activar" ? "ACTIVO" : "INACTIVO";
                estadoSpan.innerText = user.estado;
                btnEstado.innerText = user.estado === "ACTIVO" ? "Desactivar" : "Activar";
                btnEstado.className = user.estado === "ACTIVO" ? "btn btn-danger btn-sm ms-2" : "btn btn-success btn-sm ms-2";
                await fetchUsuarios();
            } catch (err) {
                alertDiv.innerHTML = `<div class="alert alert-danger">Error: ${err.message}</div>`;
            }
        };

        // Cargar roles
        const rolSelect = document.getElementById("editUsuarioRol");
        rolSelect.innerHTML = "<option>Cargando roles...</option>";
        try {
            const resRoles = await fetch(`${API_BASE_URL}/roles`, {
                method: "GET",
                headers: { "Authorization": `Bearer ${token}` }
            });
            const roles = await resRoles.json();
            rolSelect.innerHTML = "";
            roles.forEach(r => {
                const opt = document.createElement("option");
                opt.value = r.id;
                opt.text = r.nombre;
                if (r.nombre === user.rol) opt.selected = true;
                rolSelect.appendChild(opt);
            });
        } catch (err) {
            rolSelect.innerHTML = "<option>Error cargando roles</option>";
        }

        // Guardar rol
        document.getElementById("btnGuardarRol").onclick = async () => {
            const idUsuario = document.getElementById("editUsuarioIdInput").value;
            const idRol = parseInt(rolSelect.value);
            try {
                const res = await fetch(`${API_BASE_URL}/usuarios/${idUsuario}/rol`, {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    },
                    body: JSON.stringify({ idRol })
                });
                if (!res.ok) throw new Error(`Error ${res.status}: ${res.statusText}`);
                const data = await res.json();
                alertDiv.innerHTML = `<div class="alert alert-success">${data.message || "Rol actualizado correctamente"}</div>`;
                await fetchUsuarios();
            } catch (err) {
                alertDiv.innerHTML = `<div class="alert alert-danger">Error: ${err.message}</div>`;
            }
        };

        // Resetear contraseña
        document.getElementById("btnResetear").onclick = async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/usuarios/${id}/reset`, {
                    method: "PATCH",
                    headers: { "Authorization": `Bearer ${token}` }
                });
                if (!res.ok) throw new Error("Error al resetear contraseña");
                const data = await res.json();
                alertDiv.innerHTML = `<div class="alert alert-success">${data.message || "Contraseña reseteada correctamente"}</div>`;
            } catch (err) {
                alertDiv.innerHTML = `<div class="alert alert-danger">Error: ${err.message}</div>`;
            }
        };

        // Mostrar modal
        const editModal = new bootstrap.Modal(document.getElementById('editUsuarioModal'));
        editModal.show();

    } catch (err) {
        alertDiv.innerHTML = `<div class="alert alert-danger">Error cargando usuario: ${err.message}</div>`;
    }
}