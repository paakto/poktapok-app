// ==========================================
// 1. CONFIGURACIÓN Y CONSTANTES
// ==========================================
// cellsize = 40m en R produce hexágonos regulares con área = (sqrt(3)/2) * 40^2 ≈ 1385.64 m² (0.1385 ha)
const AREA_HEX_M2 = 1385.64;
const HAB_POR_VIVIENDA = 3.2;
const POBLACION_ACTUAL_URBANA = 8500; // Población base actual de PokTaPok

// Paleta de colores institucionales
const COLORES = {
    urbano_existente: '#999999',
    verde_base: '#36b4a1',       // Para área verde general
    verde_manglar: '#145c50',    // Un verde mucho más oscuro para el manglar protegido
    verde_inundable: '#8dd3c7',  // Un verde/celeste muy pálido para zonas inundables
    impacto_nuevo: '#e3057f'
};

// Estado global de la simulación
let estadoSimulacion = {
    densidad: 30,
    modoBrocha: false,
    mousePresionado: false,
    pincelEstadoObjetivo: 'urbanizado'
};

// ==========================================
// 2. INICIALIZACIÓN DEL MAPA (LEAFLET)
// ==========================================
// Coordenadas aproximadas de PokTaPok, Cancún
const map = L.map('map', {
    zoomControl: true,
    doubleClickZoom: false // Desactivamos esto para no interferir con los clics rápidos
}).setView([21.135, -86.774], 15);

// Mapa Base: CartoDB Positron (Escala de grises, minimalista)
L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
    subdomains: 'abcd',
    maxZoom: 20
}).addTo(map);

let capaHexagonos; // Guardará nuestra capa GeoJSON

// ==========================================
// 3. ESTILOS Y RENDERIZADO VISUAL
// ==========================================
function obtenerEstiloHexagono(feature) {
    let colorFondo = COLORES.verde_base;
    let opacidad = 0.5;

    // Si ya era urbano originalmente
    if (feature.properties.tipo_actual === 'urbano') {
        colorFondo = COLORES.urbano_existente;
        opacidad = 0.45;
    }
    // Si era verde pero el usuario lo ha "urbanizado" en la simulación
    else if (feature.properties.estado_simulacion === 'urbanizado') {
        colorFondo = COLORES.impacto_nuevo;
        opacidad = 0.75; // Resaltar el impacto de desarrollo
    }
    // Variaciones visuales para los tipos de verde originales
    else if (feature.properties.tipo_actual === 'verde_manglar') {
        opacidad = 0.70;
    } else if (feature.properties.tipo_actual === 'verde_inundable') {
        opacidad = 0.40;
    }

    return {
        fillColor: colorFondo,
        weight: 1,
        color: '#ffffff', // Borde blanco sutil
        fillOpacity: opacidad
    };
}

// ==========================================
// 4. LÓGICA DE CÁLCULO E INDICADORES
// ==========================================
function recalcularImpacto() {
    if (!capaHexagonos) return;

    let areaVerdeRestante = 0;
    let nuevosHabitantesTotales = 0;
    let perdidaManglar = 0;
    let areaInundableConstruida = 0;

    capaHexagonos.eachLayer((layer) => {
        const props = layer.feature.properties;

        if (props.tipo_actual !== 'urbano') {
            if (props.estado_simulacion === 'urbanizado') {
                // Calcular nuevos habitantes en este hexágono
                const areaHectareas = AREA_HEX_M2 / 10000;
                const nuevasViviendas = areaHectareas * estadoSimulacion.densidad;
                nuevosHabitantesTotales += (nuevasViviendas * HAB_POR_VIVIENDA);

                // Acumular impactos negativos específicos
                if (props.tipo_actual === 'verde_manglar') perdidaManglar += AREA_HEX_M2;
                if (props.tipo_actual === 'verde_inundable') areaInundableConstruida += AREA_HEX_M2;
            } else {
                // Si sigue siendo verde, suma al área verde total disponible
                areaVerdeRestante += AREA_HEX_M2;
            }
        }
    });

    const poblacionTotalProyectada = POBLACION_ACTUAL_URBANA + nuevosHabitantesTotales;
    const m2VerdePorHabitante = poblacionTotalProyectada > 0 ? (areaVerdeRestante / poblacionTotalProyectada) : 0;

    // Actualizar la Interfaz (DOM)
    const greenEl = document.getElementById('kpi-green-area');
    const floodEl = document.getElementById('kpi-flood-area');
    const mangroveEl = document.getElementById('kpi-mangrove-lost');

    if (greenEl) greenEl.innerText = m2VerdePorHabitante.toFixed(1);
    if (floodEl) floodEl.innerText = Math.round(areaInundableConstruida).toLocaleString();
    if (mangroveEl) mangroveEl.innerText = Math.round(perdidaManglar).toLocaleString();
}

// ==========================================
// 5. INTERACCIONES (CLIC Y BROCHA)
// ==========================================
function aplicarEstadoHexagono(layer, nuevoEstado) {
    const props = layer.feature.properties;
    if (props.tipo_actual === 'urbano') return; // Inmutable si ya es urbano base

    props.estado_simulacion = nuevoEstado;
    layer.setStyle(obtenerEstiloHexagono(layer.feature));
    recalcularImpacto();
}

function alternarEstadoHexagono(layer) {
    const props = layer.feature.properties;
    if (props.tipo_actual === 'urbano') return;

    const siguienteEstado = (props.estado_simulacion === 'urbanizado') ? 'original' : 'urbanizado';
    aplicarEstadoHexagono(layer, siguienteEstado);
    return siguienteEstado;
}

function onEachFeature(feature, layer) {
    // Inicializar estado de simulación si no existe
    if (!feature.properties.estado_simulacion) {
        feature.properties.estado_simulacion = 'original';
    }

    // Evento de Clic o inicio de brocha
    layer.on('mousedown', (e) => {
        if (feature.properties.tipo_actual === 'urbano') return;

        if (estadoSimulacion.modoBrocha) {
            // Establece el estado objetivo según el hexágono inicial
            estadoSimulacion.mousePresionado = true;
            estadoSimulacion.pincelEstadoObjetivo = (feature.properties.estado_simulacion === 'urbanizado') ? 'original' : 'urbanizado';
            aplicarEstadoHexagono(layer, estadoSimulacion.pincelEstadoObjetivo);
        } else {
            alternarEstadoHexagono(layer);
        }
        L.DomEvent.stopPropagation(e);
    });

    // Lógica para la brocha al pasar el ratón
    layer.on('mouseover', () => {
        if (estadoSimulacion.modoBrocha && estadoSimulacion.mousePresionado) {
            if (feature.properties.tipo_actual !== 'urbano' && feature.properties.estado_simulacion !== estadoSimulacion.pincelEstadoObjetivo) {
                aplicarEstadoHexagono(layer, estadoSimulacion.pincelEstadoObjetivo);
            }
        }
    });
}

// Control del estado global del ratón para la brocha
map.on('mousedown', () => {
    estadoSimulacion.mousePresionado = true;
});

// Listener en ventana para capturar mouseup incluso si sale del contenedor del mapa
window.addEventListener('mouseup', () => {
    estadoSimulacion.mousePresionado = false;
});

// ==========================================
// 6. EVENTOS DE LA INTERFAZ (UI)
// ==========================================
// Slider de Densidad
const densitySlider = document.getElementById('density-slider');
const densityValue = document.getElementById('density-value');

if (densitySlider) {
    densitySlider.addEventListener('input', (e) => {
        estadoSimulacion.densidad = parseInt(e.target.value, 10);
        if (densityValue) densityValue.innerText = estadoSimulacion.densidad;
        recalcularImpacto();
    });
}

// Botones de Herramientas
const btnClick = document.getElementById('btn-click');
const btnBrush = document.getElementById('btn-brush');
const btnReset = document.getElementById('btn-reset');

if (btnClick && btnBrush) {
    btnClick.addEventListener('click', () => {
        estadoSimulacion.modoBrocha = false;
        btnClick.classList.add('active');
        btnBrush.classList.remove('active');
        map.dragging.enable();
    });

    btnBrush.addEventListener('click', () => {
        estadoSimulacion.modoBrocha = true;
        btnBrush.classList.add('active');
        btnClick.classList.remove('active');
        map.dragging.disable();
    });
}

// Botón Reiniciar Simulación
if (btnReset) {
    btnReset.addEventListener('click', () => {
        if (capaHexagonos) {
            capaHexagonos.eachLayer((layer) => {
                layer.feature.properties.estado_simulacion = 'original';
                layer.setStyle(obtenerEstiloHexagono(layer.feature));
            });
        }

        // Restablecer slider
        estadoSimulacion.densidad = 30;
        if (densitySlider) densitySlider.value = 30;
        if (densityValue) densityValue.innerText = '30';

        recalcularImpacto();
    });
}

// ==========================================
// 7. CARGA DE DATOS (GEOJSON)
// ==========================================
const statusOverlay = document.getElementById('map-status');

fetch('hexagonos_app.geojson')
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP ${response.status} - No se pudo encontrar hexagonos_app.geojson`);
        }
        return response.json();
    })
    .then(data => {
        capaHexagonos = L.geoJSON(data, {
            style: obtenerEstiloHexagono,
            onEachFeature: onEachFeature
        }).addTo(map);

        // Ajustar el mapa para que encuadre todos los hexágonos con margen
        map.fitBounds(capaHexagonos.getBounds(), { padding: [20, 20] });

        // Ocultar indicador de carga
        if (statusOverlay) {
            statusOverlay.style.display = 'none';
        }

        // Cálculo inicial
        recalcularImpacto();
    })
    .catch(error => {
        console.error('Error al cargar el GeoJSON:', error);
        if (statusOverlay) {
            statusOverlay.innerHTML = `<div class="status-error">
                <p>⚠️ <strong>Error al cargar los datos espaciales</strong></p>
                <p style="font-size: 12px; margin-top: 6px;">${error.message}</p>
            </div>`;
        }
    });
