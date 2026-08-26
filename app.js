// ==========================================
// 1. CONFIGURACIÓN Y CONSTANTES
// ==========================================
const AREA_HEX_M2 = 2500; // Ejemplo: ajusta esto al área real de tus hexágonos
const HAB_POR_VIVIENDA = 3.2;
const POBLACION_ACTUAL_URBANA = 8500; // Ajusta a la población actual de PokTaPok

// Paleta de colores institucionales
const COLORES = {
    urbano_existente: '#999999',
    verde_base: '#36b4a1',
    impacto_nuevo: '#e3057f'
};

// Estado global de la simulación
let estadoSimulacion = {
    densidad: 30,
    modoBrocha: false,
    mousePresionado: false
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
        opacidad = 0.4;
    }
    // Si era verde pero el usuario lo ha "urbanizado" en la simulación
    else if (feature.properties.estado_simulacion === 'urbanizado') {
        colorFondo = COLORES.impacto_nuevo;
        opacidad = 0.7; // Un poco más opaco para resaltar el impacto
    }
    // Variaciones sutiles para los tipos de verde (opcional)
    else if (feature.properties.tipo_actual === 'verde_manglar') {
        opacidad = 0.65;
    } else if (feature.properties.tipo_actual === 'verde_inundable') {
        opacidad = 0.4;
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

                // Acumular impactos negativos
                if (props.tipo_actual === 'verde_manglar') perdidaManglar += AREA_HEX_M2;
                if (props.tipo_actual === 'verde_inundable') areaInundableConstruida += AREA_HEX_M2;
            } else {
                // Si sigue siendo verde, suma al área verde total
                areaVerdeRestante += AREA_HEX_M2;
            }
        }
    });

    const poblacionTotalProyectada = POBLACION_ACTUAL_URBANA + nuevosHabitantesTotales;
    const m2VerdePorHabitante = poblacionTotalProyectada > 0 ? (areaVerdeRestante / poblacionTotalProyectada) : 0;

    // Actualizar la Interfaz (DOM)
    document.getElementById('kpi-green-area').innerText = m2VerdePorHabitante.toFixed(1);
    document.getElementById('kpi-flood-area').innerText = areaInundableConstruida.toLocaleString();
    document.getElementById('kpi-mangrove-lost').innerText = perdidaManglar.toLocaleString();
}

// ==========================================
// 5. INTERACCIONES (CLIC Y BROCHA)
// ==========================================
function alternarEstadoHexagono(layer) {
    const props = layer.feature.properties;
    // Evitar alterar lo que ya era urbano desde el inicio
    if (props.tipo_actual === 'urbano') return;

    // Alternar estado
    props.estado_simulacion = (props.estado_simulacion === 'original') ? 'urbanizado' : 'original';

    // Actualizar color y recalcular
    layer.setStyle(obtenerEstiloHexagono(layer.feature));
    recalcularImpacto();
}

function onEachFeature(feature, layer) {
    // Inicializar estado de simulación
    feature.properties.estado_simulacion = 'original';

    // Evento de Clic estándar
    layer.on('mousedown', () => {
        alternarEstadoHexagono(layer);
    });

    // Lógica para la "Brocha" (pasar el ratón mientras se hace clic)
    layer.on('mouseover', () => {
        if (estadoSimulacion.modoBrocha && estadoSimulacion.mousePresionado) {
            alternarEstadoHexagono(layer);
        }
    });
}

// Control del estado del ratón para la brocha
map.on('mousedown', () => estadoSimulacion.mousePresionado = true);
map.on('mouseup', () => estadoSimulacion.mousePresionado = false);

// ==========================================
// 6. EVENTOS DE LA INTERFAZ (UI)
// ==========================================
// Slider de Densidad
document.getElementById('density-slider').addEventListener('input', (e) => {
    estadoSimulacion.densidad = parseInt(e.target.value);
    document.getElementById('density-value').innerText = estadoSimulacion.densidad;
    if (capaHexagonos) recalcularImpacto(); // Recalcular en tiempo real al mover el slider
});

// Botones de Herramientas
document.getElementById('btn-click').addEventListener('click', (e) => {
    estadoSimulacion.modoBrocha = false;
    e.target.classList.add('active');
    document.getElementById('btn-brush').classList.remove('active');
    map.dragging.enable(); // Permitir arrastrar el mapa
});

document.getElementById('btn-brush').addEventListener('click', (e) => {
    estadoSimulacion.modoBrocha = true;
    e.target.classList.add('active');
    document.getElementById('btn-click').classList.remove('active');
    map.dragging.disable(); // Desactivar arrastre del mapa para pintar cómodamente
});

// Botón Reiniciar
document.getElementById('btn-reset').addEventListener('click', () => {
    capaHexagonos.eachLayer((layer) => {
        layer.feature.properties.estado_simulacion = 'original';
        layer.setStyle(obtenerEstiloHexagono(layer.feature));
    });
    recalcularImpacto();
});

// ==========================================
// 7. CARGA DE DATOS (GEOJSON)
// ==========================================
// Reemplaza 'datos.geojson' con la ruta de tu archivo exportado
fetch('datos.geojson')
    .then(response => response.json())
    .then(data => {
        capaHexagonos = L.geoJSON(data, {
            style: obtenerEstiloHexagono,
            onEachFeature: onEachFeature
        }).addTo(map);

        // Ajustar el mapa para que encuadre todos los hexágonos
        map.fitBounds(capaHexagonos.getBounds());

        // Cálculo inicial
        recalcularImpacto();
    })
    .catch(error => console.error('Error al cargar el GeoJSON:', error));