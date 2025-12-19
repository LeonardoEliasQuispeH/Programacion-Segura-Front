// personal.js

// Obtener token desde localStorage
function getToken() {
    return localStorage.getItem("token");
}
// ----------------------
// Listar Productos
// ----------------------
async function fetchProductos() {
    const token = localStorage.getItem("token");
    const contentArea = document.getElementById("contentArea");

    if (!token) {
        contentArea.innerHTML = `<div class="alert alert-danger">No se encontró token. Inicia sesión nuevamente.</div>`;
        return;
    }

    try {
        const res = await fetch(`${API_BASE_URL}/productos?_=${Date.now()}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            }
        });

        if (!res.ok) throw new Error(`Error ${res.status}: ${res.statusText}`);
        const data = await res.json().catch(() => []);
        displayProductos(data);
    } catch (err) {
        contentArea.innerHTML = `<div class="alert alert-danger">Error cargando Productos: ${err.message}</div>`;
    }
}

// Renderizar cards de productos
function displayProductos(productos) {
    const contentArea = document.getElementById("contentArea");

    // Botón Añadir Producto
    let html = `
        <div class="d-flex justify-content-end mb-3">
            <button class="btn btn-success" id="addProductoBtn">Añadir Producto</button>
        </div>
    `;

    if (!productos || productos.length === 0) {
        html += "<p>No hay productos registrados.</p>";
        contentArea.innerHTML = html;
        attachAddProductoListener();
        return;
    }

    html += `<div class="row">`;
    productos.forEach(p => {
        html += `
        <div class="col-md-4 mb-4">
            <div class="card h-100">
                <img src="${p.urlImg || 'https://via.placeholder.com/150'}" class="card-img-top" alt="${p.nombre}">
                <div class="card-body">
                    <h5 class="card-title">${p.nombre}</h5>
                    <p class="card-text"><strong>ID:</strong> ${p.id}</p>
                    <p class="card-text"><strong>Stock:</strong> ${p.stock}</p>
                    <p class="card-text"><strong>Color:</strong> ${p.color}</p>
                    <p class="card-text"><strong>Talla:</strong> ${p.talla}</p>
                    <p class="card-text"><strong>Precio:</strong> $${p.precio}</p>
                    <button class="btn btn-primary btn-sm me-2" onclick="viewProducto(${p.id})">Visualizar</button>
                    <button class="btn btn-warning btn-sm" onclick="editProducto(${p.id})">Editar</button>
                </div>
            </div>
        </div>
        `;
    });
    html += `</div>`;
    contentArea.innerHTML = html;

    attachAddProductoListener();
}

// Listener para botón Añadir Producto
function attachAddProductoListener() {
    const btn = document.getElementById("addProductoBtn");
    if (btn) {
        btn.addEventListener("click", () => {
            document.getElementById("addProductoForm").reset();
            document.getElementById("addProductoAlert").innerHTML = '';
            const addModal = new bootstrap.Modal(document.getElementById('addProductoModal'));
            addModal.show();
        });
    }
}

// ----------------------
// Visualizar Producto
// ----------------------
async function viewProducto(id) {
    const token = localStorage.getItem("token");
    if (!token) return alert("No se encontró token. Inicia sesión nuevamente.");

    try {
        const res = await fetch(`${API_BASE_URL}/productos/${id}?_=${Date.now()}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            }
        });

        if (!res.ok) throw new Error(`Error ${res.status}: ${res.statusText}`);
        const p = await res.json();

        document.getElementById("productoModalBody").innerHTML = `
            <div class="row">
                <div class="col-md-4">
                    <img src="${p.urlImg || 'https://via.placeholder.com/300'}" class="img-fluid rounded" alt="${p.nombre}">
                </div>
                <div class="col-md-8">
                    <ul class="list-group list-group-flush">
                        <li class="list-group-item"><strong>ID:</strong> ${p.id}</li>
                        <li class="list-group-item"><strong>Nombre:</strong> ${p.nombre}</li>
                        <li class="list-group-item"><strong>Stock:</strong> ${p.stock}</li>
                        <li class="list-group-item"><strong>Color:</strong> ${p.color}</li>
                        <li class="list-group-item"><strong>Talla:</strong> ${p.talla}</li>
                        <li class="list-group-item"><strong>Precio:</strong> $${p.precio}</li>
                        <li class="list-group-item"><strong>Fecha Creación:</strong> ${new Date(p.fechaCreacion).toLocaleString()}</li>
                    </ul>
                </div>
            </div>
        `;

        const productoModal = new bootstrap.Modal(document.getElementById('productoModal'));
        productoModal.show();

    } catch (err) {
        console.error(err);
        alert(`Error cargando el producto: ${err.message}`);
    }
}

// ----------------------
// Editar Producto
// ----------------------
async function editProducto(id) {
    const token = localStorage.getItem("token");
    if (!token) return alert("No se encontró token.");

    try {
        const res = await fetch(`${API_BASE_URL}/productos/${id}?_=${Date.now()}`, {
            method: "GET",
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (!res.ok) throw new Error(`Error ${res.status}: ${res.statusText}`);
        const p = await res.json();

        document.getElementById("editNombre").value = p.nombre;
        document.getElementById("editStock").value = p.stock;
        document.getElementById("editColor").value = p.color;
        document.getElementById("editTalla").value = p.talla;
        document.getElementById("editPrecio").value = p.precio;
        document.getElementById("editUrlImg").value = p.urlImg || '';

        const editModal = new bootstrap.Modal(document.getElementById('editProductoModal'));
        editModal.show();

        const form = document.getElementById("editProductoForm");
        form.onsubmit = async function(e) {
            e.preventDefault();
            await submitEditProducto(id, editModal);
        };

    } catch (err) {
        console.error(err);
        alert(`Error cargando producto para edición: ${err.message}`);
    }
}

// Enviar PUT para actualizar
async function submitEditProducto(id, modalInstance) {
    const token = localStorage.getItem("token");
    const data = {
        nombre: document.getElementById("editNombre").value.trim(),
        stock: parseInt(document.getElementById("editStock").value),
        color: document.getElementById("editColor").value.trim(),
        talla: document.getElementById("editTalla").value.trim(),
        precio: parseFloat(document.getElementById("editPrecio").value),
        urlImg: document.getElementById("editUrlImg").value.trim()
    };

    const alertDiv = document.getElementById("editProductoAlert");

    try {
        const res = await fetch(`${API_BASE_URL}/productos/${id}`, {
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

        alertDiv.innerHTML = `<div class="alert alert-success">Producto actualizado correctamente.</div>`;
        await fetchProductos();
        setTimeout(() => modalInstance.hide(), 1000);

    } catch (err) {
        console.error(err);
        alertDiv.innerHTML = `<div class="alert alert-danger">Error al actualizar: ${err.message}</div>`;
    }
}

// ----------------------
// Crear Producto
// ----------------------
document.getElementById("addProductoForm").addEventListener("submit", async function(e) {
    e.preventDefault();
    const alertDiv = document.getElementById("addProductoAlert");

    // Obtener valores
    const nombre = document.getElementById("addNombre").value.trim();
    const stock = document.getElementById("addStock").value.trim();
    const color = document.getElementById("addColor").value.trim();
    const talla = document.getElementById("addTalla").value.trim();
    const precio = document.getElementById("addPrecio").value.trim();
    const fileInput = document.getElementById("addUrlImg");

    // Validaciones básicas
    if (!nombre) {
        alertDiv.innerHTML = `<div class="alert alert-danger">El nombre del producto no puede estar vacío.</div>`;
        return;
    }
    if (!stock || isNaN(stock) || Number(stock) < 0) {
        alertDiv.innerHTML = `<div class="alert alert-danger">El stock debe ser un número válido mayor o igual a 0.</div>`;
        return;
    }
    if (!color) {
        alertDiv.innerHTML = `<div class="alert alert-danger">El color no puede estar vacío.</div>`;
        return;
    }
    if (!talla) {
        alertDiv.innerHTML = `<div class="alert alert-danger">La talla no puede estar vacía.</div>`;
        return;
    }
    if (!precio || isNaN(precio) || Number(precio) < 0) {
        alertDiv.innerHTML = `<div class="alert alert-danger">El precio debe ser un número válido mayor o igual a 0.</div>`;
        return;
    }

    // Manejar imagen (opcional)
    let urlImg = '';
    if (fileInput.files.length > 0) {
        const file = fileInput.files[0];
        urlImg = `http://127.0.0.1:5501/assets/img/${file.name}`;
    }

    const token = localStorage.getItem("token");
    if (!token) {
        alertDiv.innerHTML = `<div class="alert alert-danger">Token no encontrado.</div>`;
        return;
    }

    const data = {
        nombre,
        stock: Number(stock),
        color,
        talla,
        precio: Number(precio),
        urlImg
    };

    try {
        const res = await fetch(`${API_BASE_URL}/productos`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify(data)
        });

        if (!res.ok) {
            const resData = await res.json().catch(() => ({}));
            alertDiv.innerHTML = `<div class="alert alert-danger">${resData.message || 'Error al agregar producto'}</div>`;
            return;
        }

        alertDiv.innerHTML = `<div class="alert alert-success">Producto agregado correctamente.</div>`;
        await fetchProductos();

        const addModalEl = document.getElementById('addProductoModal');
        const addModal = bootstrap.Modal.getInstance(addModalEl) || new bootstrap.Modal(addModalEl);
        setTimeout(() => addModal.hide(), 1000);
        document.getElementById("addProductoForm").reset();

    } catch (err) {
        console.error(err);
        alertDiv.innerHTML = `<div class="alert alert-danger">Error al agregar producto: ${err.message}</div>`;
    }
});

// ----------------------
// Inicializar menú Productos
// ----------------------
document.addEventListener("DOMContentLoaded", () => {
    const productoLink = document.querySelector('.sidebar a[data-page="productos"]');
    if (productoLink) {
        productoLink.addEventListener("click", e => {
            e.preventDefault();
            fetchProductos();
        });
    }
});