function generarTablaBalistica(
  datos,
  trayFinal,
  beta,
  v0,
  vientoTransversal,
  masa,
  sistema,
  valorClick,
) {
  const tbody = document.querySelector("#tabla tbody");
  tbody.innerHTML = "";

  const velAnimal = datos.velAnimal;
  const rad = datos.rad;
  for (const d of DISTANCIAS_TABLA) {
    let punto;

    if (d === 0) {
      punto = trayFinal[0];
    } else {
      let idx = trayFinal.findIndex((p) => p.x >= d);
      if (idx <= 0 || idx >= trayFinal.length) {
        continue;
      }

      let p1 = trayFinal[idx - 1];
      let p2 = trayFinal[idx];

      if (!p1) {
        console.error("p1 es undefined", { d, idx });
        continue;
      }

      if (!p2) {
        console.error("p2 es undefined", { d, idx });
        continue;
      }

      if (p1.t === undefined) {
        console.error("p1 no tiene t", p1);
        continue;
      }

      if (p2.t === undefined) {
        console.error("p2 no tiene t", p2);
        continue;
      }

      let f = (d - p1.x) / (p2.x - p1.x);

      punto = {
        x: d,
        y: p1.y + f * (p2.y - p1.y),
        v: p1.v + f * (p2.v - p1.v),
        t: p1.t + f * (p2.t - p1.t),
      };
    }

    let distanciaGeometrica =
      Math.abs(Math.cos(beta)) < 0.0001 ? "-" : d / Math.cos(beta);

    // Deriva por viento.
    // Se utiliza el "lag time" (tiempo real - tiempo en vacío),
    // ya que reproduce razonablemente las tablas publicadas por
    // los fabricantes sin recurrir a un modelo aerodinámico completo.
    let tiempoVacio = d / v0;
    let lagTime = punto.t - tiempoVacio;
    let deriva_cm = vientoTransversal * lagTime * 100;
    let caida_cm = punto.y * 100;
    let energia = 0.5 * masa * punto.v * punto.v;
    let tReal = tiempoHastaIntercepcion(d, velAnimal, rad, trayFinal);
    if (tReal === null) continue;
    let distanciaEfectiva = d + velAnimal * Math.sin(rad) * tReal;
    let adelanto_cm = velAnimal * tReal * Math.cos(rad) * 100;
    let adelantoCorregido_cm = adelanto_cm - deriva_cm;
    const retardo_s = window.retardoPersonalDisparo / 1000;

    let adelantoTotal_cm = adelantoCorregido_cm;

    if (usarRetardoPersonal) {
      adelantoTotal_cm += velAnimal * retardo_s * 100;
    }

    let alturaTerreno = d * Math.tan(beta);
    let deltaLongitudinal = velAnimal * Math.sin(rad) * tReal;
    let deltaAltura = deltaLongitudinal * Math.tan(beta);
    let alturaAnimal = alturaTerreno + deltaAltura;
    let clicksVertical = "-";
    let clicksHorizontal = "-";

    if (d !== 0) {
      let anguloVertical, anguloHorizontal;

      if (sistema === "mrad") {
        anguloVertical = -caida_cm / (d * 0.1);
        anguloHorizontal = deriva_cm / (d * 0.1);
      } else {
        // MOA
        anguloVertical = -caida_cm / (d * 0.0291);
        anguloHorizontal = deriva_cm / (d * 0.0291);
      }

      clicksVertical = (anguloVertical / valorClick).toFixed(1);
      clicksHorizontal = (anguloHorizontal / valorClick).toFixed(1);
    }

    // Texto que se mostrará en la primera columna
    let etiquetaDistancia;

    switch (d) {
      case 91.44:
        etiquetaDistancia = "91.44 m (100 yd)";
        break;

      case 182.88:
        etiquetaDistancia = "182.88 m (200 yd)";
        break;

      case 274.32:
        etiquetaDistancia = "274.32 m (300 yd)";
        break;

      default:
        etiquetaDistancia = Number.isInteger(d) ? d.toString() : d.toFixed(2);
    }

    tbody.innerHTML += `
    <tr onclick="simularDistancia(this, ${d})" style="cursor:pointer;">  

    <td>${etiquetaDistancia}</td>
    <td>${distanciaGeometrica.toFixed(2)}</td>
    <td>${punto.v.toFixed(0)}</td>
    <td>${energia.toFixed(0)}</td>

    <td style="background:#e8f8e8;font-weight:bold;">
        ${Math.round(caida_cm)}
    </td>

    <td>${Math.round(deriva_cm)}</td>

    <td style="background:#eef6ff;font-weight:bold;">
        ${Math.round(adelantoCorregido_cm)}
    </td>


    <td style="background:#fff8dc;font-weight:bold;">
    ${Math.round(adelantoTotal_cm)}
    </td>

    <td>${tReal.toFixed(3)}</td>
    <td>${clicksVertical}</td>
    <td>${clicksHorizontal}</td>

    </tr>
    `;
  }
}

function simular(theta, factor, datos) {
  const v0 = datos.v0;
  const visorAltura = datos.visorAltura;
  const rho = datos.rho;
  const bc = datos.bc;
  const g = datos.g;
  const dt = datos.dt;

  let x = 0;
  let y = -visorAltura;

  let vx = v0 * Math.cos(theta);
  let vy = v0 * Math.sin(theta);

  let tiempo = 0;
  let trayectoria = [];
  while (x <= 500 && y > -2) {
    let v = Math.sqrt(vx * vx + vy * vy);
    let drag = (rho * v * v) / (bc * factor);

    let ax = -drag * (vx / v);
    let ay = -g - drag * (vy / v);

    vx += ax * dt;
    vy += ay * dt;

    x += vx * dt;
    y += vy * dt;

    tiempo += dt;

    if (
      isNaN(x) ||
      isNaN(y) ||
      isNaN(vx) ||
      isNaN(vy) ||
      isNaN(v) ||
      isNaN(drag)
    ) {
      break;
    }

    trayectoria.push({ x, y, v, t: tiempo });
  }

  return trayectoria;
}

function velocidadesCalculadas(factor, theta, datos) {
  const tray = simular(theta, factor, datos);

  let v100 = null;
  let v200 = null;
  let v300 = null;

  for (const p of tray) {
    if (v100 === null && p.x >= 100) v100 = p.v;
    if (v200 === null && p.x >= 200) v200 = p.v;
    if (v300 === null && p.x >= 300) {
      v300 = p.v;
      break;
    }
  }

  return { v100, v200, v300 };
}
function comprobarFactor(factor, theta, datos, objetivo) {
  const vel = velocidadesCalculadas(factor, theta, datos);
}

function errorVelocidades(factor, theta, datos, objetivo) {
  const vel = velocidadesCalculadas(factor, theta, datos);

  let error = 0;

  if (objetivo.v100 != null) error += Math.abs(vel.v100 - objetivo.v100);

  if (objetivo.v200 != null) error += Math.abs(vel.v200 - objetivo.v200);

  if (objetivo.v300 != null) error += Math.abs(vel.v300 - objetivo.v300);

  return error;
}

function buscarMejorFactor(theta, datos, objetivo) {
  let mejorFactor = 3000;
  let mejorError = Infinity;

  for (let factor = 1500; factor <= 5000; factor += 5) {
    const error = errorVelocidades(factor, theta, datos, objetivo);
    if (error < mejorError) {
      mejorError = error;
      mejorFactor = factor;
    }
  }

  console.log("Mejor factor:", mejorFactor, " Error:", mejorError);

  return mejorFactor;
}

function calibrarFactorCartucho(cartucho) {
  if (cartucho.factorDrag != null) {
    return cartucho.factorDrag;
  }

  // Como mínimo necesitamos v100 y v200
  if (cartucho.v100 == null || cartucho.v200 == null) {
    return null;
  }
  // Preparar datos de simulación
  const datos = prepararCalculo();

  datos.bc = cartucho.bc;
  datos.v0 = cartucho.v0;

  const objetivo = {
    v100: cartucho.v100,
    v200: cartucho.v200,
    v300: cartucho.v300, // puede ser null
  };
  // Ángulo para el cero
  const theta = calcularTheta(datos);

  const factor = buscarMejorFactor(theta, datos, objetivo);

  if (Number.isFinite(factor)) {
    cartucho.factorDrag = Math.round(factor);
  }
  return cartucho.factorDrag;
}

function calcularTheta(datos) {
  let thetaMin = 0.0;
  let thetaMax = 0.05;
  let theta;

  const ceroDeseado = datos.ceroDeseado;
  for (let i = 0; i < 40; i++) {
    theta = (thetaMin + thetaMax) / 2;

    let tray = simular(theta, datos.factorDrag, datos);

    let idx = tray.findIndex((p) => p.x >= ceroDeseado);

    if (idx <= 0) continue;

    let p1 = tray[idx - 1];
    let p2 = tray[idx];

    let f = (ceroDeseado - p1.x) / (p2.x - p1.x);
    let yInterp = p1.y + f * (p2.y - p1.y);

    if (yInterp > 0) thetaMax = theta;
    else thetaMin = theta;
  }
  return theta;
}

function calcular() {
  const datos = prepararCalculo();
  const nombreCartucho = datos.nombreCartucho;
  const bc = datos.bc;
  const v0 = datos.v0;
  const alt = datos.alt;
  const zona = datos.zona;
  const viento = datos.viento;
  const anguloViento = datos.anguloViento;
  const radViento = datos.radViento;
  const vientoTransversal = datos.vientoTransversal;

  const sistema = datos.sistema;
  const valorClick = datos.valorClick;

  const pendiente = datos.pendiente;
  const beta = datos.beta;

  const masa = datos.masa;

  const rho = datos.rho;
  const g = datos.g;
  const visorAltura = datos.visorAltura;
  const dt = datos.dt;

  const factorUsado = datos.factorDrag;
  // --- Ajuste del segundo cero ---
  let ceroDeseado = parseFloat(document.getElementById("ceroDeseado").value);

  let thetaMin = 0.0;
  let thetaMax = 0.05;
  let theta;

  for (let i = 0; i < 40; i++) {
    theta = (thetaMin + thetaMax) / 2;
    let tray = simular(theta, factorUsado, datos);
    document.getElementById("tituloCartucho").innerHTML =
      "Tabla balística – <b>" +
      nombreCartucho +
      "</b>" +
      "<br><span style='font-size:14px; color:#555;'>" +
      "BC (G1): " +
      bc +
      " | V0: " +
      v0 +
      " m/s | Factor: " +
      document.getElementById("factorDrag").value +
      "</span>";

    let idx = tray.findIndex((p) => p.x >= ceroDeseado);
    if (idx <= 0) continue;

    let p1 = tray[idx - 1];
    let p2 = tray[idx];

    let factor = (ceroDeseado - p1.x) / (p2.x - p1.x);
    let yInterp = p1.y + factor * (p2.y - p1.y);

    if (yInterp > 0) thetaMax = theta;
    else thetaMin = theta;
  }

  let thetaCero;

  try {
    thetaCero = calcularTheta(datos);
  } catch (e) {
    console.error("ERROR EN calcularTheta:", e);
    throw e;
  }
  actualizarTituloTabla(nombreCartucho, bc, v0, factorUsado);
  let trayFinal = simular(thetaCero, factorUsado, datos);
  const cruces = calcularCruces(trayFinal, zona);
  mostrarResultado(ceroDeseado, zona, cruces);
  generarTablaBalistica(
    datos,
    trayFinal,
    beta,
    v0,
    vientoTransversal,
    masa,
    sistema,
    valorClick,
  );
  guardarDatosSimulador(
    trayFinal,
    datos,
    beta,
    v0,
    vientoTransversal,
    masa,
    sistema,
    valorClick,
  );
}

function simularDistancia(fila, distancia) {
  if (!fila) return;

  document.querySelectorAll("table tr").forEach((tr) => {
    tr.classList.remove("seleccionada");
  });

  fila.classList.add("seleccionada");
  datosSimulador.ultimaFila = fila;
  datosSimulador.distancia = distancia;

  // Sincronizar la distancia del simulador
  document.getElementById("distanciaEntrenamiento").value = distancia;

  actualizarResumen();
}

function obtenerDatosSimulador(distancia) {
  const v0 = datosSimulador.v0;
  const vientoTransversal = datosSimulador.vientoTransversal;
  const masa = datosSimulador.masa;
  return calcularFila(
    distancia,
    datosSimulador.trayectoria,
    datosSimulador.beta,
    datosSimulador.v0,
    datosSimulador.vientoTransversal,
    datosSimulador.masa,
    datosSimulador.velocidadAnimal,
    datosSimulador.rad,
    datosSimulador.sistema,
    datosSimulador.valorClick,
  );
}

function actualizarPanel(datos) {
  const panel = document.getElementById("datosImpacto");

  if (!datos) {
    panel.innerHTML = "Sin disparo";
    return;
  }

  panel.innerHTML = `
    Distancia: ${datos.distancia.toFixed(0)} m<br>
    Tiempo de vuelo: ${datos.tiempoVuelo.toFixed(3)} s<br>
    Caída vertical: ${datos.alturaCm.toFixed(2)} cm<br>
    Adelanto necesario: ${datos.adelantoCm.toFixed(2)} cm<br>
    Velocidad restante: ${datos.velocidad.toFixed(1)} m/s
`;
}
function abrirSimulador() {
  const distanciaEntrenamiento = parseFloat(
    document.getElementById("distanciaEntrenamiento").value,
  );

  const datosBalisticos = obtenerDatosSimulador(distanciaEntrenamiento);
  window.configuracionEntrenamiento = {
    velocidadAnimal: datosSimulador.velocidadAnimal,
    radio: datosSimulador.radGlobal,
    trayectoria: datosSimulador.trayGlobal,
    zonaVitalCm: zonaVitalCm,
    retardoPersonal: window.retardoPersonalDisparo,
    usarRetardo: usarRetardoPersonal,
  };
  const datos = {
    datosBalisticos: datosBalisticos,
    configuracion: window.configuracionEntrenamiento,
  };
  sessionStorage.setItem("datosSimulador", JSON.stringify(datos));

  window.location.href = "simulador.html";
}
