const API = "https://pw-d20261017a29.plainwork-apps.workers.dev/v3.1";
const CAMPOS = "name,capital,region,population,flags,languages,currencies,translations";
const form = document.getElementById("formBuscar");
const mensaje = document.getElementById("mensaje");
const resultados = document.getElementById("resultados");
const txtPais = document.getElementById("txtPais");
const region = document.getElementById("region");
const orden = document.getElementById("orden");
let paisesActuales = [];
let solicitudActual = 0;

async function consultar(ruta) {
  const respuesta = await fetch(`${API}${ruta}${ruta.includes("?") ? "&" : "?"}fields=${CAMPOS}`);
  if (!respuesta.ok) {
    if (respuesta.status === 404) throw new Error("No se encontraron países con ese criterio.");
    throw new Error(`Error del servidor (código ${respuesta.status}).`);
  }
  const datos = await respuesta.json();
  if (!Array.isArray(datos)) throw new Error("La API no devolvió una lista de países.");
  return datos;
}

async function buscarPais(nombre) {
  return consultar(`/name/${encodeURIComponent(nombre)}`);
}

async function buscarRegion(nombreRegion) {
  return consultar(`/region/${encodeURIComponent(nombreRegion)}`);
}

function nombrePais(pais) {
  return pais.translations?.spa?.common || pais.name?.common || "Sin nombre";
}

function mostrarPaises(paises) {
  resultados.replaceChildren();
  const lista = [...paises].sort((a, b) => orden.value === "asc"
    ? (a.population || 0) - (b.population || 0)
    : (b.population || 0) - (a.population || 0));
  lista.forEach(pais => {
    const tarjeta = document.createElement("article");
    tarjeta.className = "tarjeta";
    tarjeta.tabIndex = 0;
    tarjeta.setAttribute("role", "button");
    tarjeta.setAttribute("aria-expanded", "false");
    const img = document.createElement("img");
    img.src = pais.flags?.png || pais.flags?.svg || "";
    img.alt = `Bandera de ${nombrePais(pais)}`;
    img.loading = "lazy";
    tarjeta.appendChild(img);
    const titulo = document.createElement("h3");
    titulo.textContent = nombrePais(pais);
    tarjeta.appendChild(titulo);
    const agregarDato = (etiqueta, valor) => {
      const p = document.createElement("p");
      const b = document.createElement("b");
      b.textContent = `${etiqueta}: `;
      p.append(b, document.createTextNode(String(valor)));
      tarjeta.appendChild(p);
    };
    agregarDato("Capital", pais.capital?.join(", ") || "Sin capital");
    agregarDato("Región", pais.region || "Sin región");
    agregarDato("Población", (pais.population || 0).toLocaleString("es-MX"));
    const ayuda = document.createElement("p");
    ayuda.className = "ayuda";
    ayuda.textContent = "Haz clic para ver idiomas y monedas";
    tarjeta.appendChild(ayuda);
    const detalles = document.createElement("div");
    detalles.className = "detalles";
    detalles.hidden = true;
    const idiomas = Object.values(pais.languages || {}).join(", ") || "No disponibles";
    const monedas = Object.entries(pais.currencies || {}).map(([codigo, info]) =>
      `${info.name || codigo} (${info.symbol || codigo})`).join(", ") || "No disponibles";
    const pIdiomas = document.createElement("p");
    pIdiomas.textContent = `Idiomas: ${idiomas}`;
    const pMonedas = document.createElement("p");
    pMonedas.textContent = `Monedas: ${monedas}`;
    detalles.append(pIdiomas, pMonedas);
    tarjeta.appendChild(detalles);
    const alternar = () => {
      detalles.hidden = !detalles.hidden;
      tarjeta.setAttribute("aria-expanded", String(!detalles.hidden));
      ayuda.textContent = detalles.hidden ? "Haz clic para ver idiomas y monedas" : "Haz clic para ocultar detalles";
    };
    tarjeta.addEventListener("click", alternar);
    tarjeta.addEventListener("keydown", e => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); alternar(); }
    });
    resultados.appendChild(tarjeta);
  });
}

async function cargar(peticion) {
  const id = ++solicitudActual;
  mensaje.textContent = "Cargando...";
  resultados.replaceChildren();
  try {
    const paises = await peticion;
    if (id !== solicitudActual) return;
    paisesActuales = paises;
    mostrarPaises(paisesActuales);
    mensaje.textContent = `${paises.length} resultado(s)`;
  } catch (error) {
    if (id !== solicitudActual) return;
    paisesActuales = [];
    mensaje.textContent = error instanceof TypeError ? "No se pudo conectar con el servicio de países. Revisa tu conexión a Internet e intenta nuevamente." : `No se pudieron cargar los datos. ${error.message}`;
  }
}

form.addEventListener("submit", e => {
  e.preventDefault();
  const nombre = txtPais.value.trim();
  if (!nombre) return;
  region.value = "";
  cargar(buscarPais(nombre));
});
region.addEventListener("change", () => {
  txtPais.value = "";
  if (region.value) cargar(buscarRegion(region.value));
  else { ++solicitudActual; paisesActuales = []; resultados.replaceChildren(); mensaje.textContent = "Selecciona una región o busca un país."; }
});
orden.addEventListener("change", () => mostrarPaises(paisesActuales));
document.getElementById("btnLimpiar").addEventListener("click", () => {
  ++solicitudActual;
  txtPais.value = "";
  region.value = "";
  orden.value = "desc";
  paisesActuales = [];
  resultados.replaceChildren();
  mensaje.textContent = "Escribe un país o selecciona una región.";
});
