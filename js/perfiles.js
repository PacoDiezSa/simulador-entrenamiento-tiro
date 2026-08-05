const valoresIniciales = {
  cartucho: "Winchester Extreme Point 30-06 180gr",
  bc: 0.422,
  factorDrag: 3000,
  v0: 838,
  alt: 1000,
  zona: 20,
  viento: 0,
  velAnimal: 4,
  pendiente: 0,
  anguloAnimal: 0,
  sistema: "mrad",
  valorClick: 0.1,
  peso: 180,
  ceroDeseado: 200,
};

const campos = Object.keys(valoresIniciales);
const selector = document.getElementById("selectorPerfil");

// ===== CARGA INICIAL =====
window.addEventListener("load", () => {
  actualizarListaPerfiles();

  const ultimoPerfil = localStorage.getItem("perfilActivo");

  if (ultimoPerfil) {
    selector.value = ultimoPerfil;
    cargarPerfil();
  } else {
    Object.keys(valoresIniciales).forEach((id) => {
      const control = document.getElementById(id);

      if (control) {
        control.value = valoresIniciales[id];
      }
    });
  }
});

// ===== GUARDAR PERFIL =====
function guardarPerfil() {
  let nombre = prompt("Nombre del perfil:");

  if (!nombre) return;

  let datos = {};

  campos.forEach((id) => {
    datos[id] = document.getElementById(id).value;
  });

  localStorage.setItem("perfil_" + nombre, JSON.stringify(datos));
  localStorage.setItem("perfilActivo", nombre);

  actualizarListaPerfiles();
  selector.value = nombre;

  alert("Perfil guardado correctamente");
}

// ===== CARGAR PERFIL =====
function cargarPerfil() {
  const nombre = selector.value;
  if (!nombre) return;

  const datos = JSON.parse(localStorage.getItem("perfil_" + nombre));
  if (!datos) return;

  campos.forEach((id) => {
    document.getElementById(id).value = datos[id];
  });

  localStorage.setItem("perfilActivo", nombre);
}

// ===== ELIMINAR PERFIL =====
function eliminarPerfil() {
  const nombre = selector.value;
  if (!nombre) return;

  if (!confirm("¿Eliminar perfil " + nombre + "?")) return;

  localStorage.removeItem("perfil_" + nombre);
  localStorage.removeItem("perfilActivo");

  actualizarListaPerfiles();

  alert("Perfil eliminado");
}

// ===== ACTUALIZAR LISTA =====
function actualizarListaPerfiles() {
  selector.innerHTML = "";

  for (let i = 0; i < localStorage.length; i++) {
    let clave = localStorage.key(i);

    if (clave.startsWith("perfil_")) {
      let nombre = clave.replace("perfil_", "");

      let option = document.createElement("option");
      option.value = nombre;
      option.textContent = nombre;

      selector.appendChild(option);
    }
  }
}

// ===== RESTABLECER VALORES =====
function restablecerValores() {
  if (!confirm("¿Restablecer valores iniciales?")) return;

  Object.keys(valoresIniciales).forEach((id) => {
    const control = document.getElementById(id);

    if (control) {
      control.value = valoresIniciales[id];
    }

    localStorage.removeItem(id);
  });
  location.reload();
}
