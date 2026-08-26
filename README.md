# Simulador de Uso de Suelo - PokTaPok 🌴

[![Estado de despliegue](https://github.com/paakto/poktapok-app/actions/workflows/pages/build/badge.svg)](https://github.com/paakto/poktapok-app/actions)

![Estado del sitio web](https://img.shields.io/website?url=https%3A%2F%2Fpaakto.github.io%2Fpoktapok-app)


---

## 📌 ¿Qué es esta herramienta?

Este **Simulador de Uso de Suelo** es una aplicación web interactiva diseñada para la asociación de vecinos de PokTaPok en Cancún. Su propósito principal es facilitar el diálogo participativo sobre el futuro del antiguo campo de golf del barrio, permitiendo a cualquier persona, sin necesidad de conocimientos técnicos previos, visualizar y comprender los impactos ambientales y urbanos que tendría un cambio en el uso del suelo.

A través de una interfaz sencilla tipo "juego de simulación", los usuarios pueden modelar escenarios de desarrollo urbano y observar en tiempo real cómo estas decisiones afectan la calidad de vida y el entorno natural.

## 🎯 Objetivo Comunitario

El barrio se encuentra en un punto de decisión importante entre los intereses de desarrollo, la conservación comunitaria y la planeación gubernamental. Esta herramienta busca democratizar la información técnica para:
- Evitar que los datos complejos abrumen a los ciudadanos.
- Mostrar de forma transparente los *trade-offs* (pros y contras) de urbanizar áreas verdes.
- Servir como punto de partida para mesas de trabajo, consultas comunitarias y estudios urbanos más profundos.

## 🛠️ ¿Cómo usar el simulador?

La aplicación divide el área de estudio en una cuadrícula de hexágonos. Cada hexágono representa una porción de territorio que actualmente puede ser zona urbana, área verde general, manglar protegido o zona inundable.

Para crear una simulación, sigue estos 3 sencillos pasos:

1. **Selecciona el territorio a urbanizar:**
   - Usa la herramienta de **Selección Individual** (👆) para hacer clic en hexágonos específicos y cambiar su uso de suelo de "Área Verde" a "Urbano".
   - Usa la **Selección por Brocha** (🖌️) para "pintar" arrastrando el ratón y transformar grandes áreas rápidamente.
   *Nota: Los hexágonos se teñirán de color magenta para alertar visualmente sobre la transformación del área natural.*

2. **Ajusta la densidad de vivienda:**
   - En el panel lateral, utiliza el control deslizable (*slider*) para definir cuántas viviendas por hectárea se construirían en las nuevas zonas seleccionadas (desde una densidad baja de 10 viv/ha hasta una alta de 70 viv/ha).

3. **Observa el impacto en tiempo real:**
   A medida que modificas el mapa y la densidad, los indicadores de la pantalla se actualizarán automáticamente para mostrarte:
   - **Área verde por habitante (m²/hab):** Qué tanta área libre queda disponible para cada persona en el barrio.
   - **Construcción en zona inundable (m²):** Cuántos metros cuadrados se están planeando sobre zonas con riesgo de inundación estacional.
   - **Pérdida de Manglar (m²):** Cuánta área verde protegida se está sacrificando en la simulación.

Si deseas comenzar de nuevo, simplemente presiona el botón **"↺ Reiniciar Simulación"** para devolver el mapa a su estado original.

## 💻 Información Técnica

Este proyecto está construido de manera minimalista para garantizar su accesibilidad y rápida ejecución en cualquier dispositivo:
- **Tecnologías:** HTML5, CSS3, JavaScript (Vainilla).
- **Mapas:** Leaflet.js con mapa base de CartoDB Positron.
- **Datos Espaciales:** GeoJSON en proyección EPSG:4326.
- **Alojamiento:** GitHub Pages (No requiere servidor backend).
