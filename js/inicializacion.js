window.addEventListener("load", function () {
  actualizarTarjetaCartucho(
    "Winchester Extreme Point 30-06 180gr",
    0.422,
    838,
    180,
  );

  calcular();

  document.getElementById("panelConfiguracion").style.display = "none";
  document.getElementById("btnConfiguracion").textContent =
    "▼ ⚙ Parámetros de la simulación";

  document.getElementById("panelTabla").style.display = "none";
  document.getElementById("btnTabla").textContent =
    "📋 Mostrar tabla balística";

  document
    .getElementById("distanciaEntrenamiento")
    .addEventListener("input", actualizarResumen);
});
