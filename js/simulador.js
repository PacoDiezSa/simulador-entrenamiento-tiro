// ==================================================
// DATOS DEL SIMULADOR
// ==================================================
let datosSimulador = null;

function cargarDatosSimulador() {
  const texto = sessionStorage.getItem("datosSimulador");

  if (!texto) {
    alert("No se han recibido datos del simulador.");
    return false;
  }

  datosSimulador = JSON.parse(texto);

  return true;
}

// ==================================================
// VARIABLES DEL SIMULADOR
// ==================================================
// ==================================================
// DATOS RECIBIDOS
// ==================================================

const datos = JSON.parse(sessionStorage.getItem("datosSimulador"));

const tiempoVuelo = datos.datosBalisticos.tiempoVuelo;
const caidaCm = datos.datosBalisticos.caidaCm;
const adelantoCm = datos.datosBalisticos.adelantoTotalCm;

const configuracion = datos.configuracion;
// ===============================
// Rellenar panel de datos
// ===============================

document.getElementById("txtDistancia").textContent = Math.round(
  datos.datosBalisticos.distancia,
);

document.getElementById("txtAdelanto").textContent = Math.round(
  datos.datosBalisticos.adelantoTotalCm,
);

document.getElementById("txtCorreccion").textContent = Math.round(
  -datos.datosBalisticos.caidaCm,
);
const zonaVitalCm = datos.configuracion.zonaVitalCm;
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
canvas.width = 1350;
canvas.height = 700;
let anchoPantallaPX = canvas.width;
let anchoPantallaCm = 0;
const TAMANO_VISOR = 40;
const MODO_CALIBRACION = false;
const DESPLAZAMIENTO_FONDO_Y = -20;
// Ajuste visual para alinear el centro de la cruz con la punta del cursor.
// Puede variar ligeramente según el navegador o la escala del canvas.const AJUSTE_CURSOR_X = -40;
const AJUSTE_CURSOR_Y = 18;
const AJUSTE_CURSOR_X = -10;
const AJUSTE_ZONA_VITAL_X = 0;
const AJUSTE_ZONA_VITAL_Y = 100;
// ===== Calibración tiempo de reacción =====
let modoReaccion = false;
let factorVelocidadAnterior = 1;
let instanteIdeal = 0;
let referenciaTomada = false;
let esperandoDisparo = false;
let retardoDisparo = 0;
let numeroPrueba = 0;
let retardosDisparo = [];
let balaX = null;
let balaY = null;
let niveles = [1, 0.5, 0.25, 0.1, 0.05];
let indiceNivel = 0;

// ==================================================
// GEOMETRÍA DEL JABALÍ
// ==================================================
const ESCALA = 0.5;
const LONGITUD_JABALI_CM = 120;
const LONGITUD_JABALI_PX = 110;

const PIXELES_POR_CM = LONGITUD_JABALI_PX / LONGITUD_JABALI_CM;
const caidaPx = caidaCm * PIXELES_POR_CM;

const RADIO_BALA = 4;
const ANCHO_JABALI_PX = LONGITUD_JABALI_PX;
const PROPORCION_JABALI = 220 / 300;
const ALTO_JABALI_PX = Math.round(ANCHO_JABALI_PX * PROPORCION_JABALI);

const OFFSET_IMAGEN_X = 54;
const OFFSET_IMAGEN_Y = 55;

const AJUSTE_SUELO = 18;
const DISTANCIA_ZONA_VITAL_SUELO = 20; // ejemplo
// ==================================================
// IMÁGENES
// ==================================================

const jabali = new Image();
jabali.src = "jabali_alargado.png";
jabali.onload = () => {
  console.log("Jabalí:", jabali.naturalWidth, "x", jabali.naturalHeight);
};
const fondo = new Image();
fondo.src = "fondo_2.png";

jabali.onerror = () => {
  alert("No se ha podido cargar la imagen del jabalí.");
};

fondo.onerror = () => {
  alert("No se ha podido cargar la imagen de fondo.");
};

// ==================================================
// VARIABLES DE LA ANIMACIÓN
// ==================================================
let velocidadAnimalPx = 0;
let animalX = 0;
let inicioTiempo = 0;
let animando = false;
let estadoImpacto = null;
let lineaSuelo = 0;
let factorVelocidad = 1;
let desplazamientoFondo = 0;
let pausado = false;
let instantePausa = 0;

// ==================================================
// MIRA
// ==================================================

let crossX = 50;
let crossY = 0;
let esTouch = false;
let mostrarCoords = false;
let ayudaSeguimiento = false;
let anguloCaida = 0;
let cayendo = false;
let jabaliAbatido = false;
// ==================================================
// ESTADÍSTICAS
// ==================================================
let disparos = 0;
let aciertos = 0;
let adelantos = 0;
let atrasos = 0;
let precision = 0;

// ==================================================
// CÁLCULO DE LA VELOCIDAD REAL DEL SIMULADOR
// ==================================================

function calculoVelocidadRealSimulador() {
  const pxPorMetro = LONGITUD_JABALI_PX / (LONGITUD_JABALI_CM / 100);

  anchoPantallaCm = canvas.width / pxPorMetro;

  velocidadAnimalPx = configuracion.velocidadAnimal * pxPorMetro;
}

// window.onload = function () {
//   calculoVelocidadRealSimulador();
//   actualizarEtiquetaVelocidad();
//   actualizarPanel();

//   crossY = canvas.height / 2;
//   requestAnimationFrame(animarDisparo);
// };

window.onload = function () {
  calculoVelocidadRealSimulador();
  actualizarEtiquetaVelocidad();
  actualizarPanel();

  crossY = canvas.height / 2;

  requestAnimationFrame(animarDisparo);
};

// ==================================================
// CÁLCULO DE LA VELOCIDAD REAL DEL SIMULADOR
// ==================================================

function calculoVelocidadRealSimulador() {
  const pxPorMetro = LONGITUD_JABALI_PX / (LONGITUD_JABALI_CM / 100);

  anchoPantallaCm = canvas.width / pxPorMetro;

  velocidadAnimalPx = configuracion.velocidadAnimal * pxPorMetro;
}
// ==================================================
// ACTUALIZAR ETIQUETA DE VELOCIDAD
// ==================================================

function actualizarEtiquetaVelocidad() {
  const velReal = configuracion.velocidadAnimal;
  const velSimulada = velReal * factorVelocidad;

  const div = document.getElementById("infoVelocidad");

  if (!div) return;

  div.innerHTML =
    "Velocidad real: " +
    velReal.toFixed(2) +
    " m/s &nbsp; | &nbsp; " +
    "Velocidad simulada: " +
    velSimulada.toFixed(2) +
    " m/s";
}
function actualizarPanel() {
  precision = disparos === 0 ? 0 : Math.round((aciertos * 100) / disparos);

  document.getElementById("txtDisparos").textContent = disparos;
  document.getElementById("txtAciertos").textContent = aciertos;
  document.getElementById("txtAdelantos").textContent = adelantos;
  document.getElementById("txtAtrasos").textContent = atrasos;
  document.getElementById("txtPrecision").textContent = precision + "%";
}
function dibujarFondo() {
  ctx.drawImage(
    fondo,
    desplazamientoFondo, // X dentro del PNG
    0, // Y dentro del PNG
    1536, // ancho visible
    1024, // alto visible
    0, // destino X
    -20, // destino Y
    canvas.width, // ancho del canvas
    canvas.height, // alto del canvas
  );
  return canvas.height * 0.65;
}

// ==================================================
// CENTRO DE LA ZONA VITAL
// ==================================================

function obtenerCentroZonaVital() {
  return {
    x: animalX,
    y: lineaSuelo - DISTANCIA_ZONA_VITAL_SUELO - 60,
  };
}

// ==================================================
// DIBUJAR JABALÍ
// ==================================================

function dibujarAnimal(centroZonaX, centroZonaY) {
  const imagenX = centroZonaX - OFFSET_IMAGEN_X;

  let imagenY = centroZonaY - OFFSET_IMAGEN_Y + AJUSTE_SUELO - 10;

  if (cayendo || jabaliAbatido) {
    imagenY += 28; // prueba entre 25 y 35 píxeles
  }
  ctx.drawImage(jabali, imagenX, imagenY, ANCHO_JABALI_PX, ALTO_JABALI_PX);

  if (modoReaccion) {
    ctx.strokeStyle = "lime";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(centroZonaX, centroZonaY - 15);
    ctx.lineTo(centroZonaX, centroZonaY + 15);
    ctx.stroke();
  }

  if (modoReaccion && !referenciaTomada) {
    if (centroZonaX >= canvas.width / 2) {
      instanteIdeal = performance.now();
      referenciaTomada = true;
      esperandoDisparo = true;
    }
  }

  if (MODO_CALIBRACION) {
    ctx.strokeStyle = "red";
    ctx.lineWidth = 1;

    ctx.beginPath();
    ctx.moveTo(centroZonaX - 12, centroZonaY);
    ctx.lineTo(centroZonaX + 12, centroZonaY);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(centroZonaX, centroZonaY - 12);
    ctx.lineTo(centroZonaX, centroZonaY + 12);
    ctx.stroke();
  }
}

function dibujarEscalaTerreno(centroZonY) {
  ctx.save();

  // ==================================================
  // LÍNEA DEL TERRENO
  // ==================================================

  ctx.strokeStyle = "rgba(255,0,0,1)";
  ctx.lineWidth = 1;

  ctx.beginPath();
  ctx.moveTo(0, centroZonY);
  ctx.lineTo(canvas.width, centroZonY);
  ctx.stroke();

  // ==================================================
  // LÍNEAS PRINCIPALES (1 longitud de jabalí)
  // ==================================================

  ctx.strokeStyle = "rgba(255,255,180,1)";
  ctx.lineWidth = 2;

  for (let x = 0; x <= canvas.width; x += LONGITUD_JABALI_PX) {
    ctx.beginPath();
    ctx.moveTo(x, centroZonY - 100);
    ctx.lineTo(x, centroZonY + 10);
    ctx.stroke();
  }

  // ==================================================
  // LÍNEAS INTERMEDIAS (media longitud)
  // ==================================================

  ctx.lineWidth = 1;

  for (let x = 0; x <= canvas.width; x += LONGITUD_JABALI_PX / 2) {
    ctx.beginPath();
    ctx.moveTo(x, centroZonY - 10);
    ctx.lineTo(x, centroZonY + 10);
    ctx.stroke();
  }

  // ==================================================
  // COTA DEL TERRENO
  // ==================================================

  const yCota = centroZonY + 24;

  ctx.strokeStyle = "black";
  ctx.fillStyle = "black";
  ctx.lineWidth = 1;

  ctx.beginPath();

  // Extremo izquierdo
  ctx.moveTo(0, centroZonY);
  ctx.lineTo(0, yCota);

  // Extremo derecho
  ctx.moveTo(canvas.width, centroZonY);
  ctx.lineTo(canvas.width, yCota);

  // Línea de cota
  ctx.moveTo(0, yCota);
  ctx.lineTo(canvas.width, yCota);

  ctx.stroke();

  // Flecha izquierda
  ctx.beginPath();
  ctx.moveTo(0, yCota);
  ctx.lineTo(10, yCota - 5);
  ctx.lineTo(10, yCota + 5);
  ctx.closePath();
  ctx.fill();

  // Flecha derecha
  ctx.beginPath();
  ctx.moveTo(canvas.width, yCota);
  ctx.lineTo(canvas.width - 10, yCota - 5);
  ctx.lineTo(canvas.width - 10, yCota + 5);
  ctx.closePath();
  ctx.fill();

  // ==================================================
  // TEXTO
  // ==================================================

  ctx.font = "16px Arial";
  ctx.fillStyle = "black";
  ctx.textAlign = "center";
  ctx.textBaseline = "bottom";

  ctx.fillText(
    "Tamaño del terreno: " + anchoPantallaCm.toFixed(2) + " m",
    canvas.width / 2,
    yCota - 4,
  );

  ctx.restore();
}
// Desplazamiento de la cruz en móviles (para que el dedo no la tape)
const offsetMovil = 120;

// ==================================================
// MOVIMIENTO DEL CURSOR EN PC
// ==================================================
// ==================================================
// MOVIMIENTO DEL CURSOR EN PC
// ==================================================
function moverCursorPC(e) {
  const rect = canvas.getBoundingClientRect();

  const escalaX = canvas.width / rect.width;
  const escalaY = canvas.height / rect.height;

  crossX = (e.clientX - rect.left) * escalaX + AJUSTE_CURSOR_X;

  if (!ayudaSeguimiento) {
    crossY = (e.clientY - rect.top) * escalaY + AJUSTE_CURSOR_Y;
  }
}

// ==================================================
// MOVIMIENTO DEL CURSOR EN MÓVIL
// ==================================================

const AJUSTE_MOVIL_X = 0;
const AJUSTE_MOVIL_Y = -80;

function moverCursorMovil(e) {
  const rect = canvas.getBoundingClientRect();

  const escalaX = canvas.width / rect.width;
  const escalaY = canvas.height / rect.height;

  crossX = (e.clientX - rect.left) * escalaX + AJUSTE_MOVIL_X;

  if (!ayudaSeguimiento) {
    crossY = (e.clientY - rect.top) * escalaY + AJUSTE_MOVIL_Y;
  }
  console.log("MOVIL", crossX, crossY);
}

// ===== MOVIMIENTO (ratón + dedo) =====
// canvas.addEventListener("pointermove", function (e) {
//   const rect = canvas.getBoundingClientRect();
//   if (e.pointerType === "touch") {
//     console.log(
//       "clientY =",
//       e.clientY,
//       " rect.top =",
//       rect.top,
//       " y =",
//       e.clientY - rect.top,
//     );
//   }

//   esTouch = e.pointerType === "touch";

//   // Conversión de coordenadas de pantalla a coordenadas reales del canvas
//   const escalaX = canvas.width / rect.width;
//   const escalaY = canvas.height / rect.height;

//   if (e.pointerType === "touch") {
//     crossX = (e.clientX - rect.left) * escalaX + AJUSTE_CURSOR_X;

//     if (!ayudaSeguimiento) {
//       crossY = Math.max(
//         0,
//         (e.clientY - rect.top) * escalaY - offsetMovil + AJUSTE_CURSOR_Y,
//       );
//     }
//   } else {
//     crossX = (e.clientX - rect.left) * escalaX + AJUSTE_CURSOR_X;

//     if (!ayudaSeguimiento) {
//       crossY = (e.clientY - rect.top) * escalaY + AJUSTE_CURSOR_Y;
//     }
//   }
// });

// ===== MOVIMIENTO (ratón + dedo) =====
canvas.addEventListener("pointermove", function (e) {
  esTouch = e.pointerType === "touch";

  if (esTouch) {
    moverCursorMovil(e);
  } else {
    moverCursorPC(e);
  }
});

// ===== CONTROL DE DISPARO =====

let punterosActivos = new Set();

// ===== POINTER DOWN =====
// canvas.addEventListener("pointerdown", function (e) {
//   const rect = canvas.getBoundingClientRect();

//   esTouch = e.pointerType === "touch";

//   const escalaX = canvas.width / rect.width;
//   const escalaY = canvas.height / rect.height;

//   if (e.pointerType === "touch") {
//     crossX = (e.clientX - rect.left) * escalaX + AJUSTE_CURSOR_X;

//     if (!ayudaSeguimiento) {
//       crossY = Math.max(
//         0,
//         (e.clientY - rect.top) * escalaY - offsetMovil + AJUSTE_CURSOR_Y,
//       );
//     }
//   } else {
//     crossX = (e.clientX - rect.left) * escalaX + AJUSTE_CURSOR_X;

//     if (!ayudaSeguimiento) {
//       crossY = (e.clientY - rect.top) * escalaY + AJUSTE_CURSOR_Y;
//     }
//   }

//   punterosActivos.add(e.pointerId);

//   // PC
//   if (e.pointerType === "mouse") {
//     if (e.button === 0) disparar();
//     if (e.button === 2) corregirDisparo();
//   }

//   // Móvil
//   if (e.pointerType === "touch") {
//     e.preventDefault();
//   }
// });

// ===== POINTER DOWN =====
canvas.addEventListener("pointerdown", function (e) {
  esTouch = e.pointerType === "touch";

  if (esTouch) {
    moverCursorMovil(e);
  } else {
    moverCursorPC(e);
  }

  punterosActivos.add(e.pointerId);

  // ===== PC =====
  if (e.pointerType === "mouse") {
    if (e.button === 0) disparar();

    if (e.button === 2) corregirDisparo();
  }

  // ===== MÓVIL =====
  if (e.pointerType === "touch") {
    e.preventDefault();
  }
});

// ===== DISPARAR AL SOLTAR EN MÓVIL =====
canvas.addEventListener("pointerup", function (e) {
  punterosActivos.delete(e.pointerId);

  if (e.pointerType === "touch") {
    disparar();
    e.preventDefault();
  }
});
// ===== DOBLE CLICK PC =====
canvas.addEventListener("dblclick", function () {
  corregirDisparo();
});

// ===== EVITAR MENÚ DERECHO =====
canvas.addEventListener("contextmenu", function (e) {
  e.preventDefault();
});

// Ocultar ayuda si no es pantalla táctil
if (!("ontouchstart" in window)) {
  const ayuda = document.getElementById("ayudaMovil");
  if (ayuda) ayuda.style.display = "none";
}

// ==================================================
// MOTOR DE ANIMACIÓN (VERSIÓN INICIAL)
// ==================================================

function animarDisparo(timestamp) {
  if (!inicioTiempo) inicioTiempo = timestamp;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (animando && !pausado) {
    const tiempo = ((timestamp - inicioTiempo) / 1000) * factorVelocidad;

    animalX = tiempo * velocidadAnimalPx;
  }

  lineaSuelo = dibujarFondo();
  const centroZonY = lineaSuelo + 92;

  const centro = obtenerCentroZonaVital();

  centro.x += -10;
  // ==========================
  // AYUDA AL SEGUIMIENTO
  // ==========================
  if (ayudaSeguimiento) {
    crossY = centro.y + caidaPx;
  }

  // =====================
  // ANIMACIÓN DE CAÍDA
  // =====================

  if (cayendo && anguloCaida < Math.PI) {
    anguloCaida += 0.05;
  }

  ctx.save();

  const pivoteX = centro.x - 12;
  const pivoteY = centro.y + 22;

  ctx.translate(pivoteX, pivoteY);
  ctx.rotate(anguloCaida);
  ctx.translate(-pivoteX, -pivoteY);
  dibujarAnimal(centro.x, centro.y);

  ctx.restore(); // ← MUY IMPORTANTE: justo aquí

  dibujarEscalaTerreno(centroZonY);

  // ==========================
  // AYUDA AL SEGUIMIENTO
  // ==========================
  if (ayudaSeguimiento) {
    crossY = centro.y + caidaPx;

    ctx.strokeStyle = "lime";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, centro.y);
    ctx.lineTo(canvas.width, centro.y);
    ctx.stroke();
  }
  if (modoReaccion) {
    // Línea roja fija en el centro de la pantalla
    ctx.strokeStyle = "red";
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, 0);
    ctx.lineTo(canvas.width / 2, canvas.height);
    ctx.stroke();

    // // Línea verde sobre el centro de la zona vital
    // ctx.strokeStyle = "lime";

    // ctx.beginPath();
    // ctx.moveTo(centro.x, 0);
    // ctx.lineTo(centro.x, canvas.height);
    // ctx.stroke();
  }
  // -----------------------------------------
  // Detectar el paso por la línea roja
  // -----------------------------------------
  if (modoReaccion && !referenciaTomada) {
    if (centro.x >= canvas.width / 2) {
      instanteIdeal = performance.now();
      referenciaTomada = true;
      esperandoDisparo = true;
    }
  }

  dibujarVisor();
  dibujarCoordenadas();
  dibujarImpacto();
  dibujarMensajesImpacto();
  // ctx.restore();
  requestAnimationFrame(animarDisparo);
}
function dibujarVisor() {
  const TAM = 40;
  // ctx.fillStyle = "red";
  // ctx.font = "20px Arial";
  // ctx.fillText(Math.round(crossY), 20, 30);

  // Contorno negro
  ctx.strokeStyle = "black";
  ctx.lineWidth = 4;

  ctx.beginPath();
  ctx.moveTo(crossX - TAM, crossY);
  ctx.lineTo(crossX + TAM, crossY);
  ctx.moveTo(crossX, crossY - TAM);
  ctx.lineTo(crossX, crossY + TAM);
  ctx.stroke();

  // Cruz blanca
  ctx.strokeStyle = ayudaSeguimiento ? "#00FFFF" : "white";
  ctx.lineWidth = 2;

  ctx.beginPath();
  ctx.moveTo(crossX - TAM, crossY);
  ctx.lineTo(crossX + TAM, crossY);
  ctx.moveTo(crossX, crossY - TAM);
  ctx.lineTo(crossX, crossY + TAM);
  ctx.stroke();

  // Línea de referencia para calibración
  if (modoReaccion) {
    ctx.strokeStyle = "red";
    ctx.lineWidth = 3;

    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, 0);
    ctx.lineTo(canvas.width / 2, canvas.height);
    ctx.stroke();
  }
}

function dibujarCoordenadas() {
  if (!mostrarCoords) return;

  // Centro de la zona vital (origen del simulador)
  const centro = obtenerCentroZonaVital();

  const centroX = centro.x;
  const centroY = centro.y;

  // Punto de referencia (solo para calibración)
  // ctx.fillStyle = "yellow";
  // ctx.beginPath();
  // ctx.arc(centroX, centroY, 4, 0, Math.PI * 2);
  // ctx.fill();

  // Distancias respecto al centro de la zona vital
  const adelantoPx = crossX - centroX;
  const adelantoCm = adelantoPx / PIXELES_POR_CM;
  const adelantoCuerpos = adelantoCm / LONGITUD_JABALI_CM;

  const alturaCm = (-caidaCm).toFixed(1);

  // // Texto
  ctx.font = "14px Arial";
  ctx.fillStyle = "white";
  ctx.strokeStyle = "black";
  ctx.lineWidth = 3;

  ctx.strokeText(
    "Adelanto del disparo: " + adelantoCuerpos.toFixed(2),
    crossX + 105,
    crossY - 10,
  );
  ctx.fillText(
    "Adelanto del disparo: " + adelantoCuerpos.toFixed(2),
    crossX + 105,
    crossY - 10,
  );

  ctx.strokeText("Altura: " + alturaCm, crossX + 105, crossY + 15);

  ctx.fillText("Altura: " + alturaCm, crossX + 105, crossY + 15);
}
function toggleCoords() {
  mostrarCoords = !mostrarCoords;
}
function dibujarImpacto() {
  if (balaX !== null && !jabaliAbatido) {
    //ctx.fillStyle = "yellow";
    ctx.fillStyle = "blue";
    ctx.beginPath();
    ctx.arc(balaX, balaY, 4, 0, Math.PI * 2);
    ctx.fill();
  }
}

function dibujarMensajesImpacto() {
  if (!estadoImpacto) return;

  const x = canvas.width / 2;
  const y = canvas.height - 65;
  ctx.font = "bold 26px Arial";
  ctx.textAlign = "center";
  switch (estadoImpacto) {
    case "delante":
      ctx.fillStyle = "black";
      ctx.fillText("DISPARO ADELANTADO", x, y);
      break;

    case "detras":
      ctx.fillStyle = "red";
      ctx.fillText("DISPARO RETRASADO", x, y);
      break;

    case "arriba":
      ctx.fillStyle = "orange";
      ctx.fillText("DISPARO ALTO", x, y);
      break;

    case "abajo":
      ctx.fillStyle = "blue";
      ctx.fillText("DISPARO BAJO", x, y);
      break;

    case "rozando":
      ctx.fillStyle = "purple";
      (canvas.width / 2, 60);
      ctx.fillText("DISPARO MARGINAL", x, y);
      break;
  }
}
function iniciarSimulacion() {
  estadoImpacto = null;
  // Si ya estaba corriendo, no hacer nada
  if (animando) return;

  animalX = 0;
  inicioTiempo = performance.now();

  animando = true;

  document.getElementById("btnInicio").textContent = "▶ CORRIENDO";
  document.getElementById("btnInicio").disabled = true;
}
function togglePausa() {
  if (!pausado) {
    // Entramos en pausa
    pausado = true;
    instantePausa = performance.now();

    document.getElementById("btnPausa").textContent = "▶ Continuar";
  } else {
    // Reanudamos
    pausado = false;

    // Compensar el tiempo que hemos estado parados
    inicioTiempo += performance.now() - instantePausa;

    document.getElementById("btnPausa").textContent = "⏸ Pausa";
  }
}
function toggleSlow() {
  indiceNivel++;
  if (indiceNivel >= niveles.length) {
    indiceNivel = 0;
  }

  factorVelocidad = niveles[indiceNivel];

  document.querySelector("button").textContent =
    "Velocidad x" + factorVelocidad;

  actualizarEtiquetaVelocidad(); // 🔥 AQUÍ
}
function toggleSeguimiento() {
  ayudaSeguimiento = !ayudaSeguimiento;

  document.getElementById("btnSeguimiento").textContent = ayudaSeguimiento
    ? "🎯 Ayuda seguimiento: ON"
    : "🎯 Ayuda seguimiento: OFF";
}

// ==================================================
// DISPARO
// ==================================================
function disparar() {
  if (modoReaccion && esperandoDisparo) {
    retardoDisparo = performance.now() - instanteIdeal;

    if (retardoDisparo >= 70 && retardoDisparo <= 500) {
      numeroPrueba++;
      retardosDisparo.push(retardoDisparo);
      document.getElementById("rPrueba").textContent = numeroPrueba + " / 10";

      document.getElementById("rUltima").textContent =
        retardoDisparo.toFixed(0) + " ms";

      // <<< AQUÍ VA EL CALCULO DE LA MEDIA >>>

      const suma = retardosDisparo.reduce((a, b) => a + b, 0);
      const media = suma / retardosDisparo.length;

      document.getElementById("rMedia").textContent = media.toFixed(0) + " ms";

      if (numeroPrueba >= 10) {
        retardoPersonalDisparo = media;

        localStorage.setItem("retardoPersonalDisparo", retardoPersonalDisparo);

        if (window.opener) {
          window.opener.retardoPersonalDisparo = retardoPersonalDisparo;
        }

        modoReaccion = false;
        esperandoDisparo = false;

        document.getElementById("rEstado").textContent =
          "✔ CALIBRACIÓN FINALIZADA";
        modoReaccion = false;
        esperandoDisparo = false;
        referenciaTomada = false;
      }
    } else {
      console.log("Disparo anticipado o inválido");
    }

    esperandoDisparo = false;
  }

  if (!animando) return;

  animando = false;

  disparos++;
  actualizarPanel();
  estadoImpacto = null; // reset

  balaX = crossX - adelantoCm;
  balaY = crossY - caidaCm;

  // =========================
  // CALCULAR ZONA VITAL
  // =========================
  //const ESCALA = 0.5;
  const relPxCm = LONGITUD_JABALI_PX / LONGITUD_JABALI_CM;
  // zona vital física REAL
  const vitalAncho = zonaVitalCm * relPxCm * 2;
  const vitalAlto = zonaVitalCm * relPxCm;

  // centro visual
  const centro = obtenerCentroZonaVital();
  centro.x += -10;
  //centro.y += -10;

  const vitalX = centro.x;
  const vitalY = centro.y;
  const a = vitalAncho;
  const b = a / 2;

  const dx = balaX - vitalX;
  const dy = balaY - vitalY;

  const radioBala = 4;

  const dentro =
    (dx * dx) / ((a + radioBala) * (a + radioBala)) +
      (dy * dy) / ((b + radioBala) * (b + radioBala)) <=
    1;

  if (dentro) {
    estadoImpacto = "vital";
    aciertos++;
    actualizarPanel();
    cayendo = true;
    jabaliAbatido = true;
  } else if (balaY < vitalY - b) {
    estadoImpacto = "arriba";
  } else if (balaY > vitalY + b) {
    estadoImpacto = "abajo";
  } else if (balaX < vitalX - a) {
    estadoImpacto = "detras";
    atrasos++;
    actualizarPanel();
  } else if (balaX > vitalX + a) {
    estadoImpacto = "delante";
    adelantos++;
    actualizarPanel();
  } else {
    // Está fuera de la elipse, pero dentro del rectángulo que la contiene
    // (una de las cuatro esquinas)
    estadoImpacto = "rozando";
  }
}
function corregirDisparo() {
  anguloCaida = 0;
  cayendo = false;
  jabaliAbatido = false;

  estadoImpacto = null;

  balaX = null;
  balaY = null;

  document.getElementById("resultado").textContent = "";

  animando = true;
  inicioTiempo = performance.now();

  // Preparar una nueva medición
  if (modoReaccion) {
    referenciaTomada = false;
    esperandoDisparo = false;
  }
}
function dibujarZonaVital() {
  const relPxCm = LONGITUD_JABALI_PX / LONGITUD_JABALI_CM;

  const ancho = zonaVitalCm * relPxCm * 2;
  const alto = zonaVitalCm * relPxCm;

  const centro = obtenerCentroZonaVital();
  ctx.save();

  ctx.strokeStyle = "rgba(255,0,0,0.9)";
  ctx.lineWidth = 2;

  ctx.beginPath();
  ctx.ellipse(centro.x, centro.y, ancho, alto, 0, 0, Math.PI * 2);

  ctx.stroke();

  // Centro de la zona vital
  ctx.fillStyle = "yellow";
  ctx.beginPath();
  ctx.arc(centro.x, centro.y, 3, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}
function calibrarTiempoReaccion() {
  modoReaccion = !modoReaccion;

  if (modoReaccion) {
    // Reiniciar la calibración
    numeroPrueba = 0;
    retardosDisparo = [];
    retardoDisparo = 0;

    referenciaTomada = false;
    esperandoDisparo = false;

    document.getElementById("rPrueba").textContent = "0 / 10";
    document.getElementById("rUltima").textContent = "---";
    document.getElementById("rMedia").textContent = "---";
    document.getElementById("rEstado").textContent = "";

    document.getElementById("panelRetardo").style.display = "block";
  } else {
    document.getElementById("panelRetardo").style.display = "none";
  }
}
