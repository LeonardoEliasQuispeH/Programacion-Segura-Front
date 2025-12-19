// Obtener token
function getToken() {
    return localStorage.getItem("token");
}

// ----------------------
// Fetch Movimientos
// ----------------------
async function fetchMovimientos() {
    const token = getToken();
    const contentArea = document.getElementById("contentArea");
    if (!token) {
        contentArea.innerHTML = `<div class="alert alert-danger">No se encontró token. Inicia sesión nuevamente.</div>`;
        return;
    }

    try {
        const [movRes, prodRes] = await Promise.all([
            fetch(`${API_BASE_URL}/movimientos?_=${Date.now()}`, { 
                headers: { "Authorization": `Bearer ${token}` } 
            }),
            fetch(`${API_BASE_URL}/productos?_=${Date.now()}`, { 
                headers: { "Authorization": `Bearer ${token}` } 
            })
        ]);

        // Leer como texto primero
        const movText = await movRes.text();
        const prodText = await prodRes.text();

        // Parsear JSON solo si hay contenido
        const movimientos = movText ? JSON.parse(movText) : [];
        const productos = prodText ? JSON.parse(prodText) : [];

        displayMovimientos(movimientos, productos);

    } catch(err) {
        contentArea.innerHTML = `<div class="alert alert-danger">Error cargando movimientos: ${err.message}</div>`;
        console.error(err);
    }
}

// ----------------------
// Render Movimientos
// ----------------------
function displayMovimientos(movimientos, productos) {
    const contentArea = document.getElementById("contentArea");

    let html = `
        <div class="d-flex justify-content-end mb-3">
            <button class="btn btn-success me-2" id="registrarEntradaBtn">Registrar Entrada</button>
            <button class="btn btn-warning" id="registrarSalidaBtn">Registrar Salida</button>
        </div>
        <div class="card">
            <div class="card-body">
                <h5 class="card-title">Movimientos de Productos</h5>
                <div class="table-responsive">
                    <table class="table table-bordered table-striped">
                        <thead class="table-dark">
                            <tr>
                                <th>ID</th>
                                <th>Producto</th>
                                <th>Cantidad</th>
                                <th>Tipo</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
    `;

    movimientos.forEach(m => {
        const prod = productos.find(p => p.id === m.idProducto);
        const nombreProducto = prod ? `${prod.nombre} - ${prod.color} - ${prod.talla}` : m.idProducto;

        html += `
            <tr>
                <td>${m.id}</td>
                <td>${nombreProducto}</td>
                <td>${m.cantidad}</td>
                <td>${m.tipoMovimiento}</td>
                <td><button class="btn btn-primary btn-sm" onclick="viewMovimiento(${m.id})">Ver</button></td>
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

    document.getElementById("registrarEntradaBtn").addEventListener("click", () => {
        const modal = new bootstrap.Modal(document.getElementById('entradaModal'));
        modal.show();
        fillProductoSelect("entrada", productos);
    });

    document.getElementById("registrarSalidaBtn").addEventListener("click", () => {
        const modal = new bootstrap.Modal(document.getElementById('salidaModal'));
        modal.show();
        fillProductoSelect("salida", productos);
    });
}

// ----------------------
// Llenar select de productos
// ----------------------
function fillProductoSelect(tipo, productos) {
    const selectId = tipo === "entrada" ? "entradaProductoSelect" : "salidaProductoSelect";
    const select = document.getElementById(selectId);
    select.innerHTML = "";

    productos.forEach(p => {
        const option = document.createElement("option");
        option.value = p.id;
        option.text = `${p.nombre} - ${p.color} - ${p.talla} (Stock: ${p.stock})`;
        option.dataset.stock = p.stock; // <-- aquí
        select.appendChild(option);
    });

    if (tipo === "salida") {
        const stockInfo = document.getElementById("stockDisponibleInfo");
        select.addEventListener("change", () => {
            const selected = productos.find(p => p.id == select.value);
            stockInfo.textContent = `Stock disponible: ${selected ? selected.stock : 0}`;
            const salidaCantidad = document.getElementById("salidaCantidad");
            salidaCantidad.max = selected ? selected.stock : 1;
            salidaCantidad.value = 1;
        });
        select.dispatchEvent(new Event("change"));
    }
}

// ----------------------
// Registrar Entrada
// ----------------------
document.getElementById("entradaForm").addEventListener("submit", async (e) => {
    e.preventDefault(); // evita recarga de página
    const token = getToken();
    const productoId = parseInt(document.getElementById("entradaProductoSelect").value);
    const cantidad = parseInt(document.getElementById("entradaCantidad").value);
    const alertDiv = document.getElementById("entradaAlert");

    if (!token) {
        alertDiv.innerHTML = `<div class="alert alert-danger">Token no encontrado.</div>`;
        return;
    }

    try {
        const res = await fetch(`${API_BASE_URL}/movimientos`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({
                idProducto: productoId,
                cantidad: cantidad,
                tipoMovimiento: "ENTRADA"
            })
        });

        if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            alertDiv.innerHTML = `<div class="alert alert-danger">${data.message || 'Error al registrar entrada'}</div>`;
            return;
        }

        alertDiv.innerHTML = `<div class="alert alert-success">Entrada registrada correctamente.</div>`;
        await fetchMovimientos(); // recargar tabla
        const modal = bootstrap.Modal.getInstance(document.getElementById('entradaModal'));
        setTimeout(() => modal.hide(), 800);
        document.getElementById("entradaForm").reset();

    } catch (err) {
        alertDiv.innerHTML = `<div class="alert alert-danger">Error: ${err.message}</div>`;
    }
});

// ----------------------
// Registrar Salida
// ----------------------
document.getElementById("salidaForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const token = getToken();
    const productoId = parseInt(document.getElementById("salidaProductoSelect").value);
    const cantidad = parseInt(document.getElementById("salidaCantidad").value);
    const alertDiv = document.getElementById("salidaAlert");

    const selectedProducto = Array.from(document.getElementById("salidaProductoSelect").options)
        .find(o => parseInt(o.value) === productoId);

    if (!token) {
        alertDiv.innerHTML = `<div class="alert alert-danger">Token no encontrado.</div>`;
        return;
    }

    const stockDisponible = parseInt(selectedProducto.dataset.stock || 0);

    if (cantidad > stockDisponible) {
        alertDiv.innerHTML = `<div class="alert alert-danger">Cantidad excede stock disponible (${stockDisponible}).</div>`;
        return;
    }

    try {
        const res = await fetch(`${API_BASE_URL}/movimientos`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({
                idProducto: productoId,
                cantidad: cantidad,
                tipoMovimiento: "SALIDA"
            })
        });

        if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            alertDiv.innerHTML = `<div class="alert alert-danger">${data.message || 'Error al registrar salida'}</div>`;
            return;
        }

        alertDiv.innerHTML = `<div class="alert alert-success">Salida registrada correctamente.</div>`;
        await fetchMovimientos(); // recargar tabla
        const modal = bootstrap.Modal.getInstance(document.getElementById('salidaModal'));
        setTimeout(() => modal.hide(), 800);
        document.getElementById("salidaForm").reset();

    } catch (err) {
        alertDiv.innerHTML = `<div class="alert alert-danger">Error: ${err.message}</div>`;
    }
});

// ----------------------
// Ver movimiento (modal simple)
// ----------------------
async function viewMovimiento(id) {
    const token = getToken();
    if (!token) return alert("No se encontró token");

    try {
        // 1️⃣ Obtener movimiento
        const resMov = await fetch(`${API_BASE_URL}/movimientos/${id}`, {
            headers: { "Authorization": `Bearer ${token}` }
        });
        if (!resMov.ok) throw new Error("Error al cargar movimiento");
        const m = await resMov.json();

        // 2️⃣ Obtener info del producto
        const resProd = await fetch(`${API_BASE_URL}/productos/${m.idProducto}?_=${Date.now()}`, {
            headers: { "Authorization": `Bearer ${token}` }
        });
        const prod = resProd.ok ? await resProd.json() : null;
        const nombreProducto = prod ? `${prod.nombre} - ${prod.color} - ${prod.talla}` : m.idProducto;

        // 3️⃣ Obtener info del usuario
        const resUser = await fetch(`${API_BASE_URL}/usuarios/${m.idUsuario}?_=${Date.now()}`, {
            headers: { "Authorization": `Bearer ${token}` }
        });
        const user = resUser.ok ? await resUser.json() : { usuario: 'Desconocido', correo: '-' };

        // 4️⃣ Renderizar en modal
        document.getElementById("viewMovimientoBody").innerHTML = `
            <ul class="list-group">
                <li class="list-group-item"><strong>ID Movimiento:</strong> ${m.id}</li>
                <li class="list-group-item"><strong>Producto:</strong> ${nombreProducto} (ID: ${m.idProducto})</li>
                <li class="list-group-item"><strong>Cantidad:</strong> ${m.cantidad}</li>
                <li class="list-group-item"><strong>Tipo:</strong> ${m.tipoMovimiento}</li>
                <li class="list-group-item"><strong>Fecha:</strong> ${new Date(m.fechaMovimiento).toLocaleString()}</li>
                <li class="list-group-item"><strong>Usuario:</strong> ${user.usuario} (${user.correo})</li>
            </ul>
        `;

        const modal = new bootstrap.Modal(document.getElementById('viewMovimientoModal'));
        modal.show();

    } catch (err) {
        alert(`Error cargando movimiento: ${err.message}`);
        console.error(err);
    }
}
