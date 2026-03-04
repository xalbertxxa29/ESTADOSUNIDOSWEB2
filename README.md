# LiderControl EU 🇺🇸

Sistema de Reportes e Incidencias Liderman — Operaciones Estados Unidos

![Vite](https://img.shields.io/badge/Vite-5.x-646CFF?logo=vite)
![Firebase](https://img.shields.io/badge/Firebase-v9-FFCA28?logo=firebase)
![Chart.js](https://img.shields.io/badge/Chart.js-4.x-FF6384?logo=chartdotjs)

---

## 🚀 Stack Tecnológico

| Tecnología | Uso |
|---|---|
| **Vite** | Bundler + Dev Server |
| **Firebase SDK v9** | Auth + Firestore (modular) |
| **Chart.js** | Gráficos (línea, barra, doughnut) |
| **Leaflet** | Mapa interactivo con heatmap |
| **XLSX** | Exportación Excel |
| **jsPDF + autoTable** | Exportación PDF |

## 📦 Instalación

```bash
# 1. Clonar el repositorio
git clone https://github.com/TU_USUARIO/TU_REPOSITORIO.git
cd TU_REPOSITORIO

# 2. Instalar dependencias
npm install

# 3. Iniciar servidor de desarrollo
npm run dev
```

La app estará disponible en **http://localhost:5173**

## 🏗️ Build para producción

```bash
npm run build
```

Los archivos del build quedan en la carpeta `dist/`.

## 📁 Estructura del Proyecto

```
ESTADOSUNIDOSWEB2/
├── public/
│   └── logo.png
├── src/
│   ├── main.js         # Entry point
│   ├── style.css       # Design system premium
│   ├── firebase.js     # Config Firebase SDK v9
│   ├── languages.js    # i18n (ES / EN)
│   ├── auth.js         # Autenticación Firebase
│   ├── app.js          # Navegación & sidebar
│   ├── dashboard.js    # Gráficos + Mapa
│   ├── table.js        # Tabla + Exportar
│   └── utils.js        # Utilidades compartidas
├── index.html
├── vite.config.js
└── package.json
```

## ✨ Funcionalidades

- 🔐 Login con Firebase Authentication
- 📊 Dashboard con gráficos interactivos (Facility & Security)
- 🗺️ Mapa de ubicaciones con heatmap (Leaflet)
- 📋 Tabla de datos con paginación inteligente
- 🔍 Filtros por rango de fechas (con timezone correcto)
- 📥 Exportación a **Excel** y **PDF** en inglés
- 🌐 Soporte multiidioma (Español / English)
- 📱 Diseño responsive (mobile-friendly)

---

> Proyecto desarrollado con Vite + Firebase Modular SDK v9
