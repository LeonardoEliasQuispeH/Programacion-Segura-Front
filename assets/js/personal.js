// personal.js

// Obtener token desde localStorage
function getToken() {
    return localStorage.getItem("token");
}

// ----------------------
// Listar Personal
// ----------------------
async function fetchPersonals() {
    const token = getToken();
    const contentArea = document.getElementById("contentArea");

    if (!token) {
        contentArea.innerHTML = `<div class="alert alert-danger">No se encontró token. Inicia sesión nuevamente.</div>`;
        return;
    }

    try {
        const res = await fetch(`${API_BASE_URL}/personals?_=${Date.now()}`, { // Evitar cache
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            }
        });

        if (!res.ok) throw new Error(`Error ${res.status}: ${res.statusText}`);
        const data = await res.json();
        displayPersonals(data);
    } catch (err) {
        console.error(err);
        contentArea.innerHTML = `<div class="alert alert-danger">Error cargando Personal: ${err.message}</div>`;
    }
}

// Renderizar cards de personal
function displayPersonals(personals) {
    const contentArea = document.getElementById("contentArea");

    // Botón Añadir Personal
    let html = `
        <div class="d-flex justify-content-end mb-3">
            <button class="btn btn-success" id="addPersonalBtn">Añadir Personal</button>
        </div>
    `;

    if (!personals || personals.length === 0) {
        html += "<p>No hay personal registrado.</p>";
        contentArea.innerHTML = html;
        attachAddPersonalListener(); // agregar listener al botón
        return;
    }

    html += `<div class="row">`;
    personals.forEach(p => {
        html += `
        <div class="col-md-4 mb-4">
            <div class="card h-100">
                <img src="${p.urlimg || 'https://via.placeholder.com/150'}" class="card-img-top" alt="${p.nombre}">
                <div class="card-body">
                    <h5 class="card-title">${p.nombre} ${p.apellidoPaterno} ${p.apellidoMaterno}</h5>
                    <p class="card-text">ID: ${p.id}</p>
                    <button class="btn btn-primary btn-sm me-2" onclick="viewPersonal(${p.id})">Visualizar</button>
                    <button class="btn btn-warning btn-sm" onclick="editPersonal(${p.id})">Editar</button>
                </div>
            </div>
        </div>
        `;
    });
    html += `</div>`;
    contentArea.innerHTML = html;

    attachAddPersonalListener(); // agregar listener al botón
}

// Función para agregar listener al botón "Añadir Personal"
function attachAddPersonalListener() {
    const btn = document.getElementById("addPersonalBtn");
    if (btn) {
        btn.addEventListener("click", () => {
            document.getElementById("addPersonalForm").reset();
            document.getElementById("addPersonalAlert").innerHTML = '';
            const addModal = new bootstrap.Modal(document.getElementById('addPersonalModal'));
            addModal.show();
        });
    }
}

// ----------------------
// Visualizar Personal
// ----------------------
async function viewPersonal(id) {
    const token = getToken();
    if (!token) return alert("No se encontró token. Inicia sesión nuevamente.");

    try {
        const res = await fetch(`${API_BASE_URL}/personals/${id}?_=${Date.now()}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            }
        });

        if (!res.ok) throw new Error(`Error ${res.status}: ${res.statusText}`);
        const p = await res.json();

        document.getElementById("personalModalBody").innerHTML = `
            <div class="row">
                <div class="col-md-4">
                    <img src="${p.urlimg || 'https://via.placeholder.com/300'}" class="img-fluid rounded" alt="${p.nombre}">
                </div>
                <div class="col-md-8">
                    <ul class="list-group list-group-flush">
                        <li class="list-group-item"><strong>ID:</strong> ${p.id}</li>
                        <li class="list-group-item"><strong>Nombre:</strong> ${p.nombre}</li>
                        <li class="list-group-item"><strong>Apellido Paterno:</strong> ${p.apellidoPaterno}</li>
                        <li class="list-group-item"><strong>Apellido Materno:</strong> ${p.apellidoMaterno}</li>
                        <li class="list-group-item"><strong>DNI:</strong> ${p.dni}</li>
                        <li class="list-group-item"><strong>Celular:</strong> ${p.celular}</li>
                        <li class="list-group-item"><strong>Correo:</strong> ${p.correo}</li>
                        <li class="list-group-item"><strong>Fecha Creación:</strong> ${new Date(p.fechacreacion).toLocaleString()}</li>
                    </ul>
                </div>
            </div>
        `;

        const personalModal = new bootstrap.Modal(document.getElementById('personalModal'));
        personalModal.show();

    } catch (err) {
        console.error(err);
        alert(`Error cargando el personal: ${err.message}`);
    }
}

// ----------------------
// Editar Personal
// ----------------------
async function editPersonal(id) {
    const token = getToken();
    if (!token) return alert("No se encontró token. Inicia sesión nuevamente.");

    try {
        const res = await fetch(`${API_BASE_URL}/personals/${id}?_=${Date.now()}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            }
        });

        if (!res.ok) throw new Error(`Error ${res.status}: ${res.statusText}`);
        const p = await res.json();

        // Llenar formulario con datos actuales
        document.getElementById("editNombre").value = p.nombre;
        document.getElementById("editApellidoPaterno").value = p.apellidoPaterno;
        document.getElementById("editApellidoMaterno").value = p.apellidoMaterno;
        document.getElementById("editDni").value = p.dni;
        document.getElementById("editCelular").value = p.celular;
        document.getElementById("editCorreo").value = p.correo;

        const editFileInput = document.getElementById("editFileImg");
        const editPreview = document.getElementById("editPreviewImg");

        // Limpiar alert y preview
        document.getElementById("editPersonalAlert").innerHTML = '';
        editFileInput.value = '';
        if (p.urlimg) {
            editPreview.src = p.urlimg;
            editPreview.style.display = 'block';
        } else {
            editPreview.src = '';
            editPreview.style.display = 'none';
        }

        // Abrir modal de edición
        const editModal = new bootstrap.Modal(document.getElementById('editPersonalModal'));
        editModal.show();

        // Listener para previsualización
        editFileInput.addEventListener("change", function() {
            const file = this.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = e => {
                    editPreview.src = e.target.result;
                    editPreview.style.display = 'block';
                };
                reader.readAsDataURL(file);
            } else {
                editPreview.src = p.urlimg || '';
                editPreview.style.display = p.urlimg ? 'block' : 'none';
            }
        });

        // Capturar submit
        const form = document.getElementById("editPersonalForm");
        form.onsubmit = async function(e) {
            e.preventDefault();
            await submitEditPersonal(id, editModal);
        };

    } catch (err) {
        console.error(err);
        alert(`Error cargando personal para edición: ${err.message}`);
    }
}

// Validación front-end
function validatePersonalData(data) {
    if (!data.nombre.trim() || !data.apellidoPaterno.trim() || !data.apellidoMaterno.trim()) return "Nombre y apellidos no pueden estar vacíos.";
    if (!/^\d{8}$/.test(data.dni)) return "DNI debe tener exactamente 8 dígitos.";
    if (!/^\d{9}$/.test(data.celular)) return "Celular debe tener exactamente 9 dígitos.";
    if (!/@/.test(data.correo)) return "Correo inválido.";
    return null;
}

async function submitEditPersonal(id, modalInstance) {
    const token = getToken();
    const alertDiv = document.getElementById("editPersonalAlert");

    const data = {
        nombre: document.getElementById("editNombre").value.trim(),
        apellidoPaterno: document.getElementById("editApellidoPaterno").value.trim(),
        apellidoMaterno: document.getElementById("editApellidoMaterno").value.trim(),
        dni: document.getElementById("editDni").value.trim(),
        celular: document.getElementById("editCelular").value.trim(),
        correo: document.getElementById("editCorreo").value.trim()
    };

    // Validar datos
    const errorMsg = validatePersonalData(data);
    if (errorMsg) {
        alertDiv.innerHTML = `<div class="alert alert-danger">${errorMsg}</div>`;
        return;
    }

    // -----------------------
    // Manejo de imagen
    // -----------------------
    let urlImg = document.getElementById("editUrlImg").value.trim(); // URL si existe
    const fileInput = document.getElementById("editFileImg");

    if (fileInput.files.length > 0) {
        const file = fileInput.files[0];
        if (!["image/jpeg", "image/png"].includes(file.type)) {
            alertDiv.innerHTML = `<div class="alert alert-danger">Solo JPG o PNG.</div>`;
            return;
        }

        try {
            urlImg = await uploadToAzure(file);
        } catch (err) {
            alertDiv.innerHTML = `<div class="alert alert-danger">${err.message}</div>`;
            return;
        }
    }

    data.urlimg = urlImg;

    // -----------------------
    // Enviar PUT
    // -----------------------
    try {
        const res = await fetch(`${API_BASE_URL}/personals/${id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify(data)
        });

        const resData = await res.json();
        if (!res.ok) {
            alertDiv.innerHTML = `<div class="alert alert-danger">${resData.message || 'Error al actualizar'}</div>`;
            return;
        }

        alertDiv.innerHTML = `<div class="alert alert-success">Personal actualizado correctamente.</div>`;

        // Actualizar listado
        await fetchPersonals();

        // Cerrar modal después de 1 segundo
        setTimeout(() => modalInstance.hide(), 1000);

    } catch (err) {
        alertDiv.innerHTML = `<div class="alert alert-danger">Error al actualizar: ${err.message}</div>`;
    }
}


//POST AÑADIR PERSONAL

// Escucha submit del formulario de añadir personal
// Escucha submit del formulario de añadir personal
document.getElementById("addPersonalForm").addEventListener("submit", async function(e) {
    e.preventDefault();
    const alertDiv = document.getElementById("addPersonalAlert");

    const nombre = document.getElementById("addNombre").value.trim();
    const apellidoPaterno = document.getElementById("addApellidoPaterno").value.trim();
    const apellidoMaterno = document.getElementById("addApellidoMaterno").value.trim();
    const dni = document.getElementById("addDni").value.trim();
    const celular = document.getElementById("addCelular").value.trim();
    const correo = document.getElementById("addCorreo").value.trim();
    const fileInput = document.getElementById("addUrlImg");

    // Validaciones simples
    if (!nombre || !apellidoPaterno || !apellidoMaterno) {
        alertDiv.innerHTML = `<div class="alert alert-danger">Nombre y apellidos son obligatorios.</div>`;
        return;
    }
    if (!/^\d{8}$/.test(dni)) {
        alertDiv.innerHTML = `<div class="alert alert-danger">DNI debe tener 8 dígitos.</div>`;
        return;
    }
    if (!/^\d{9}$/.test(celular)) {
        alertDiv.innerHTML = `<div class="alert alert-danger">Celular debe tener 9 dígitos.</div>`;
        return;
    }
    if (!/@/.test(correo)) {
        alertDiv.innerHTML = `<div class="alert alert-danger">Correo inválido.</div>`;
        return;
    }

    let urlImg = '';
    if (fileInput.files.length > 0) {
        const file = fileInput.files[0];
        if (!["image/jpeg", "image/png"].includes(file.type)) {
            alertDiv.innerHTML = `<div class="alert alert-danger">Solo JPG o PNG.</div>`;
            return;
        }

        try {
            urlImg = await uploadToAzure(file);
        } catch (err) {
            alertDiv.innerHTML = `<div class="alert alert-danger">${err.message}</div>`;
            return;
        }
    }

    const token = getToken();
    if (!token) {
        alertDiv.innerHTML = `<div class="alert alert-danger">Token no encontrado.</div>`;
        return;
    }

    const data = { nombre, apellidoPaterno, apellidoMaterno, dni, celular, correo, urlimg: urlImg };

    try {
        const res = await fetch(`${API_BASE_URL}/personals`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify(data)
        });

        const resData = await res.json();

        if (res.ok || (resData.message && resData.message.toUpperCase().startsWith("EXITO"))) {
            alertDiv.innerHTML = `<div class="alert alert-success">${resData.message || 'Personal agregado correctamente.'}</div>`;
            await fetchPersonals(); // actualizar listado
            const addModal = bootstrap.Modal.getInstance(document.getElementById('addPersonalModal'));
            setTimeout(() => addModal.hide(), 1000);
            document.getElementById("addPersonalForm").reset();
        } else {
            alertDiv.innerHTML = `<div class="alert alert-danger">${resData.message || 'Error al agregar personal'}</div>`;
        }

    } catch (err) {
        alertDiv.innerHTML = `<div class="alert alert-danger">Error: ${err.message}</div>`;
    }
});


async function uploadToAzure(file) {
    const sasUrl = "https://lupalegistorage.blob.core.windows.net/personal?sp=racw&st=2025-12-18T19:02:01Z&se=2025-12-22T03:17:01Z&sv=2024-11-04&sr=c&sig=r28rQRSdxZKakdLbRNNfAQP2MpMnle7U7PrgNr2Vc8g%3D";

    // Nombre único para evitar colisiones
    const blobName = Date.now() + '-' + file.name;
    const uploadUrl = `${sasUrl}&comp=block&blockid=${btoa(blobName)}`;

    // Subida del archivo
    const res = await fetch(`https://lupalegistorage.blob.core.windows.net/personal/${blobName}?${sasUrl.split('?')[1]}`, {
        method: 'PUT',
        headers: {
            'x-ms-blob-type': 'BlockBlob',
            'Content-Type': file.type
        },
        body: file
    });

    if (!res.ok) throw new Error(`Error subiendo imagen a Azure: ${res.statusText}`);

    // Retornamos la URL pública del blob
    return `https://lupalegistorage.blob.core.windows.net/personal/${blobName}`;
}
// ----------------------
// Inicializar menú de Personal
// ----------------------
document.addEventListener("DOMContentLoaded", () => {
    // Listener para previsualización de imagen al editar personal
    const editFileInput = document.getElementById("editFileImg");
    const editPreview = document.getElementById("editPreviewImg");

    if (editFileInput) {
        editFileInput.addEventListener("change", function() {
            const file = this.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = e => editPreview.src = e.target.result;
                reader.readAsDataURL(file);
            }
        });
    }
});
