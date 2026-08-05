let biblioteca = null;

function abrirBiblioteca() {
  document.getElementById("panelBiblioteca").style.display = "block";

  cargarBiblioteca();
  document.getElementById("cmbFabricante").onchange = rellenarCalibres;
  document.getElementById("cmbCalibre").onchange = rellenarMuniciones;
  document.getElementById("cmbMunicion").onchange = mostrarDatosMunicion;
}

function cerrarBiblioteca() {
  document.getElementById("panelBiblioteca").style.display = "none";
}

function cerrarBiblioteca() {
  document.getElementById("panelBiblioteca").style.display = "none";
}

async function cargarBiblioteca() {
  try {
    const respuesta = await fetch("biblioteca.json");

    if (!respuesta.ok) {
      throw new Error("No se pudo abrir biblioteca.json");
    }

    biblioteca = await respuesta.json();

    rellenarFabricantes();
  } catch (e) {
    console.error(e);
  }
}
function rellenarFabricantes() {
  const cmb = document.getElementById("cmbFabricante");

  cmb.innerHTML = "<option>Seleccione...</option>";

  biblioteca.fabricantes.forEach((fabricante) => {
    cmb.innerHTML += `<option>${fabricante.nombre}</option>`;
  });
}
function rellenarCalibres() {
  const fabricanteSeleccionado = document.getElementById("cmbFabricante").value;

  const cmbCalibre = document.getElementById("cmbCalibre");

  cmbCalibre.innerHTML = "<option>Seleccione un calibre...</option>";

  const fabricante = biblioteca.fabricantes.find(
    (f) => f.nombre === fabricanteSeleccionado,
  );

  if (!fabricante) return;

  fabricante.calibres.forEach((calibre) => {
    cmbCalibre.innerHTML += `<option>${calibre.nombre}</option>`;
  });
}

function rellenarMuniciones() {
  const fabricanteSeleccionado = document.getElementById("cmbFabricante").value;

  const calibreSeleccionado = document.getElementById("cmbCalibre").value;

  const cmbMunicion = document.getElementById("cmbMunicion");

  cmbMunicion.innerHTML = "<option>Seleccione una munición...</option>";

  const fabricante = biblioteca.fabricantes.find(
    (f) => f.nombre === fabricanteSeleccionado,
  );

  if (!fabricante) return;

  const calibre = fabricante.calibres.find(
    (c) => c.nombre === calibreSeleccionado,
  );

  if (!calibre) return;

  calibre.municiones.forEach((municion) => {
    cmbMunicion.innerHTML += `<option>${municion.nombre}</option>`;
  });
}

function mostrarDatosMunicion() {
  const fabricante = biblioteca.fabricantes.find(
    (f) => f.nombre === cmbFabricante.value,
  );

  const calibre = fabricante.calibres.find(
    (c) => c.nombre === cmbCalibre.value,
  );

  const municion = calibre.municiones.find(
    (m) => m.nombre === cmbMunicion.value,
  );
  if (!municion) return;

  document.getElementById("datosMunicion").style.display = "block";

  document.getElementById("dBC").textContent = municion.bc;
  document.getElementById("dV0").textContent = municion.v0;
  document.getElementById("dPeso").textContent = municion.pesoGr ?? "-";

  document.getElementById("dFactor").textContent = municion.factorDrag ?? "-";
}

function actualizarTarjetaCartucho(nombre, bc, v0, peso) {
  document.getElementById("nombreCartucho").textContent = nombre;
  document.getElementById("resumenCartucho").textContent =
    `BC ${bc} • V0 ${v0} m/s • ${peso} gr`;
}

function cargarCartuchoSeleccionado() {
  const fabricante = biblioteca.fabricantes.find(
    (f) => f.nombre === cmbFabricante.value,
  );

  const calibre = fabricante.calibres.find(
    (c) => c.nombre === cmbCalibre.value,
  );

  const municion = calibre.municiones.find(
    (m) => m.nombre === cmbMunicion.value,
  );

  if (!municion) return;
  // Guardar el cartucho seleccionado para que calcular() pueda utilizarlo
  window.cartuchoSeleccionado = municion;
  // Calcular automáticamente el factor si no existe
  if (municion.factorDrag == null) {
    municion.factorDrag = calibrarFactorCartucho(municion);
  }

  document.getElementById("factorDrag").value = municion.factorDrag;
  document.getElementById("bc").value = municion.bc;
  document.getElementById("v0").value = municion.v0;
  document.getElementById("peso").value = municion.pesoGr;

  // Nombre del cartucho
  const nombreCompleto =
    fabricante.nombre + " " + calibre.nombre + " " + municion.nombre;

  actualizarTarjetaCartucho(
    nombreCompleto,
    municion.bc,
    municion.v0,
    municion.pesoGr,
  );

  document.getElementById("tituloCartucho").textContent =
    "Tabla balística – " + nombreCompleto;

  // Recalcular toda la tabla
  calcular();

  // Cerrar la biblioteca
  cerrarBiblioteca();
}
