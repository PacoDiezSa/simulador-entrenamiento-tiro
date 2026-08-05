const datosSimulador = {
  trayectoria: null,
  beta: null,
  rad: null,
  velocidadAnimal: null,
  ultimaFila: null,

  nombreCartucho: "",
  distancia: 0,
  zonaVital: 0,

  sistema: "",
  valorClick: 0,

  v0: 0,
  vientoTransversal: 0,
  masa: 0,

  viento: 0,
  anguloViento: 0,

  pendiente: 0,

  retardoPersonal: 0,
};

function abrirManual() {
  window.open("Manual_de_uso.pdf", "_blank");
}

function densidadAire(alt) {
  const rho0 = 1.225;
  return rho0 * Math.exp(-alt / 8500);
}

// ✅ VARIABLES GLOBALES

// Distancias mostradas en la tabla balística
const DISTANCIAS_TABLA = [
  0,
  25,
  50,
  75,
  91.44, // 100 yd
  100,
  125,
  150,
  175,
  182.88, // 200 yd
  200,
  225,
  250,
  274.32, // 300 yd
  300,
];

let ultimaSimulacion = null;
let impactoX = null;
let impactoY = null;
let vientoOffset = 0;
let mostrarImpacto = false;
let factorVelocidad = 1; // 1 = normal, 0.5 = lenta, 0.2 = súper lenta
let lineaSuelo = 0;
let zonaVitalCm = 15;
window.retardoPersonalDisparo =
  parseFloat(localStorage.getItem("retardoPersonalDisparo")) || 0;
let usarRetardoPersonal = false;
function actualizarZonaVital() {
  const valor = parseFloat(document.getElementById("zona").value);
  zonaVitalCm = isNaN(valor) ? 15 : valor;
}

let imagenesListas = true;

function tiempoHastaDistancia(d, tray) {
  for (let i = 1; i < tray.length; i++) {
    let p1 = tray[i - 1];
    let p2 = tray[i];

    if (p2.x >= d) {
      let f = (d - p1.x) / (p2.x - p1.x);

      return p1.t + f * (p2.t - p1.t);
    }
  }

  return null; // por seguridad
}

function tiempoHastaIntercepcion(d, velAnimal, rad, tray) {
  let t = tiempoHastaDistancia(d, tray);

  if (t === null) return null;

  for (let i = 0; i < 3; i++) {
    let dNueva = d + velAnimal * Math.sin(rad) * t;

    t = tiempoHastaDistancia(dNueva, tray);

    if (t === null) return null;
  }

  return t;
}
function toggleRetardo() {
  usarRetardoPersonal = document.getElementById("usarRetardo").checked;
  calcular(); // Actualiza inmediatamente la tabla
}

function toggleConfiguracion() {
  const panel = document.getElementById("panelConfiguracion");
  const boton = document.getElementById("btnConfiguracion");

  if (panel.style.display === "none") {
    panel.style.display = "block";
    boton.textContent = "▼ ⚙ Parámetros de la simulación";
  } else {
    panel.style.display = "none";
    boton.textContent = "▶ ⚙ Parámetros de la simulación";
  }
}

function toggleTabla() {
  const panel = document.getElementById("panelTabla");
  const boton = document.getElementById("btnTabla");

  if (panel.style.display === "none") {
    panel.style.display = "block";
    boton.textContent = "▼ 📋 Tabla balística";
  } else {
    panel.style.display = "none";
    boton.textContent = "▶ 📋 Tabla balística";
  }
}

function actualizarResumen() {
  document.getElementById("rCartucho").textContent =
    document.getElementById("nombreCartucho").textContent;

  document.getElementById("rCero").textContent =
    document.getElementById("ceroDeseado").value + " m";

  document.getElementById("rDistancia").textContent =
    document.getElementById("distanciaEntrenamiento").value + " m";

  document.getElementById("rVelAnimal").textContent =
    document.getElementById("velAnimal").value + " m/s";

  document.getElementById("rViento").textContent =
    document.getElementById("viento").value + " m/s";

  document.getElementById("rZona").textContent =
    document.getElementById("zona").value + " cm";

  const sistema = document.getElementById("sistema").value.toUpperCase();
  const click = document.getElementById("valorClick").value;

  document.getElementById("rSistema").textContent =
    sistema + " (" + click + " por clic)";

  document.getElementById("rRetardo").textContent =
    window.retardoPersonalDisparo > 0
      ? Math.round(window.retardoPersonalDisparo) + " ms"
      : "No calibrado";

  const distancia = parseFloat(
    document.getElementById("distanciaEntrenamiento").value,
  );

  const datos = obtenerDatosSimulador(distancia);

  if (datos) {
    document.getElementById("rAdelanto").textContent =
      Math.round(datos.adelantoTotalCm) + " cm";

    document.getElementById("rCaida").textContent =
      Math.round(datos.caidaCm) + " cm";

    document.getElementById("rTiempo").textContent =
      datos.tiempoVuelo.toFixed(3) + " s";

    document.getElementById("rVelocidad").textContent =
      Math.round(datos.velocidad) + " m/s";

    document.getElementById("rEnergia").textContent =
      Math.round(datos.energia) + " J";
  }
}

function prepararCalculo() {
  const nombreCartucho = document
    .getElementById("nombreCartucho")
    .textContent.trim();
  const bc = parseFloat(document.getElementById("bc").value);
  const v0 = parseFloat(document.getElementById("v0").value);
  const alt = parseFloat(document.getElementById("alt").value);
  const zona = parseFloat(document.getElementById("zona").value) / 100;

  const viento = parseFloat(document.getElementById("viento").value);
  const anguloViento = parseFloat(
    document.getElementById("anguloViento").value,
  );
  const radViento = (anguloViento * Math.PI) / 180;
  const vientoTransversal = viento * Math.sin(radViento);

  const sistema = document.getElementById("sistema").value;
  const valorClick = parseFloat(document.getElementById("valorClick").value);

  const pendiente = parseFloat(document.getElementById("pendiente").value);
  const beta = (pendiente * Math.PI) / 180;

  const pesoGrains = parseFloat(document.getElementById("peso").value);
  const masa = pesoGrains * 0.00006479891;

  const rho = densidadAire(alt);
  const g = 9.81;
  const visorAltura = 0.038;
  const dt = 0.0005;

  const factorDrag = parseFloat(document.getElementById("factorDrag").value);

  const velAnimal = parseFloat(document.getElementById("velAnimal").value);
  const angulo = parseFloat(document.getElementById("anguloAnimal").value);
  const rad = (angulo * Math.PI) / 180;

  const ceroDeseado = parseFloat(document.getElementById("ceroDeseado").value);

  return {
    nombreCartucho,
    bc,
    v0,
    alt,
    zona,
    viento,
    anguloViento,
    radViento,
    vientoTransversal,
    sistema,
    valorClick,
    pendiente,
    beta,
    pesoGrains,
    masa,
    rho,
    g,
    visorAltura,
    dt,
    factorDrag,
    velAnimal,
    angulo,
    rad,
    ceroDeseado,
  };
}

function obtenerPuntoTrayectoria(d, trayFinal) {
  if (d === 0) {
    return trayFinal[0];
  }

  let idx = trayFinal.findIndex((p) => p.x >= d);

  if (idx <= 0) {
    return null;
  }

  let p1 = trayFinal[idx - 1];
  let p2 = trayFinal[idx];

  let f = (d - p1.x) / (p2.x - p1.x);

  return {
    x: d,
    y: p1.y + f * (p2.y - p1.y),
    v: p1.v + f * (p2.v - p1.v),
    t: p1.t + f * (p2.t - p1.t),
  };
}

function calcularFila(
  d,
  trayFinal,
  beta,
  v0,
  vientoTransversal,
  masa,
  velAnimal,
  rad,
  sistema,
  valorClick,
) {
  const punto = obtenerPuntoTrayectoria(d, trayFinal);

  if (!punto) return null;
  let distanciaGeometrica =
    Math.abs(Math.cos(beta)) < 0.0001 ? "-" : d / Math.cos(beta);

  let tiempoVacio = d / v0;
  let lagTime = punto.t - tiempoVacio;

  let deriva_cm = vientoTransversal * lagTime * 100;
  let caida_cm = punto.y * 100;
  let energia = 0.5 * masa * punto.v * punto.v;

  let tReal = tiempoHastaIntercepcion(d, velAnimal, rad, trayFinal);

  let adelanto_cm = velAnimal * tReal * Math.cos(rad) * 100;

  let adelantoCorregido_cm = adelanto_cm - deriva_cm;
  let adelantoTotal_cm = adelantoCorregido_cm;

  const retardo_s = window.retardoPersonalDisparo / 1000;

  if (usarRetardoPersonal) {
    adelantoTotal_cm += velAnimal * retardo_s * 100;
  }
  // =============================

  let clicksVertical = "-";
  let clicksHorizontal = "-";

  if (d !== 0) {
    let anguloVertical;
    let anguloHorizontal;

    if (sistema === "mrad") {
      anguloVertical = -caida_cm / (d * 0.1);

      anguloHorizontal = deriva_cm / (d * 0.1);
    } else {
      anguloVertical = -caida_cm / (d * 0.0291);

      anguloHorizontal = deriva_cm / (d * 0.0291);
    }

    clicksVertical = (anguloVertical / valorClick).toFixed(1);

    clicksHorizontal = (anguloHorizontal / valorClick).toFixed(1);
  }

  return {
    distancia: d,
    distanciaGeometrica,
    velocidad: punto.v,
    energia,
    caidaCm: caida_cm,
    derivaCm: deriva_cm,
    adelantoCm: adelanto_cm,
    adelantoCorregidoCm: adelantoCorregido_cm,
    adelantoTotalCm: adelantoTotal_cm,
    tiempoVuelo: tReal,
    clicksVertical,
    clicksHorizontal,
  };
}
function calcularCruces(trayectoria, zona) {
  let primerCruce = null;
  let segundoCruce = null;
  let mpbr = null;

  for (let i = 1; i < trayectoria.length; i++) {
    let prev = trayectoria[i - 1];
    let curr = trayectoria[i];

    // Primer cruce (subiendo)
    if (prev.y < 0 && curr.y >= 0 && primerCruce === null) {
      let f = -prev.y / (curr.y - prev.y);
      primerCruce = prev.x + f * (curr.x - prev.x);
    }

    // Segundo cruce (bajando)
    if (prev.y > 0 && curr.y <= 0 && segundoCruce === null) {
      let f = prev.y / (prev.y - curr.y);
      segundoCruce = prev.x + f * (curr.x - prev.x);
    }

    // MPBR
    if (prev.y > -zona && curr.y <= -zona && mpbr === null) {
      let f = (prev.y + zona) / (prev.y - curr.y);
      mpbr = prev.x + f * (curr.x - prev.x);
    }
  }

  return {
    primerCruce,
    segundoCruce,
    mpbr,
  };
}

function guardarDatosSimulador(
  trayFinal,
  datos,
  beta,
  v0,
  vientoTransversal,
  masa,
  sistema,
  valorClick,
) {
  // Guardar datos para el simulador
  datosSimulador.trayectoria = trayFinal;
  datosSimulador.beta = beta;
  datosSimulador.velocidadAnimal = datos.velAnimal;
  datosSimulador.rad = datos.rad;
  datosSimulador.v0 = v0;
  datosSimulador.vientoTransversal = vientoTransversal;
  datosSimulador.masa = masa;
  datosSimulador.sistema = sistema;
  datosSimulador.valorClick = valorClick;

  actualizarResumen();
}

function mostrarResultado(ceroDeseado, zona, cruces) {
  document.getElementById("resultado").innerHTML =
    "<b>Cero configurado:</b> " +
    ceroDeseado.toFixed(0) +
    " m<br>" +
    "<b>Primer cero:</b> " +
    (cruces.primerCruce ? cruces.primerCruce.toFixed(0) : "-") +
    " m<br>" +
    "<b>Segundo cero real:</b> " +
    (cruces.segundoCruce ? cruces.segundoCruce.toFixed(0) : "-") +
    " m<br>" +
    "<b>MPBR (±" +
    zona * 100 +
    " cm):</b> " +
    (cruces.mpbr ? cruces.mpbr.toFixed(0) : "-") +
    " m" +
    "<div class='mensaje-guia' style='margin-top:15px; padding:10px; background:#f5f8fc; border:1px solid #d6e2f3; border-radius:6px; font-size:13px;'>" +
    "▶ Haga clic en una fila de la tabla para mostrar la simulación de tiro." +
    "</div>";
}

function actualizarTituloTabla(nombre, bc, v0, factor) {
  document.getElementById("tituloCartucho").innerHTML =
    "Tabla balística – <b>" +
    nombre +
    "</b>" +
    "<br><span style='font-size:14px; color:#555;'>" +
    "BC (G1): " +
    bc +
    " | V0: " +
    v0 +
    " m/s | Factor: " +
    factor +
    "</span>";
}
