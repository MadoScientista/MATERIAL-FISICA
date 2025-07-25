// const.js - Configuración de los filtros que se mostrarán
// Solo define QUÉ filtros mostrar y sus etiquetas, las opciones se cargan dinámicamente

export const filterConfig = [
  {
    label: "Tipo",
    field: "tipo", // Campo correspondiente en Google Sheets
    enabled: true, // Si está habilitado o no
  },
  {
    label: "Nivel",
    field: "nivel",
    enabled: true,
  },
  {
    label: "Tipo Ejercicio",
    field: "tipoejercicio", // Nota: sin espacios para el campo interno
    enabled: true,
  },
  {
    label: "Dificultad",
    field: "dificultad",
    enabled: true,
  },
  {
    label: "Tema",
    field: "tema",
    enabled: true,
  },
  {
    label: "Unidad",
    field: "unidad",
    enabled: true,
  },
  // Puedes agregar más campos simplemente añadiendo objetos aquí
  // {
  //   label: "Habilidades Científicas",
  //   field: "habilidadescientificas",
  //   enabled: false, // Deshabilitado por ahora
  // },
];

// Configuración adicional
export const appConfig = {
  title: "Material de Física",
  subtitle: "Buscador de material",
  keywordsPlaceholder: "Buscar por palabras clave",
  searchButtonText: "Buscar",
  loadingText: "Buscando...",
  noResultsText:
    "No se encontraron materiales con los criterios seleccionados.",
  errorText:
    "Error al buscar materiales. Verifica tu conexión e inténtalo nuevamente.",

  // Nueva configuración para paginación
  itemsPerPage: 12, // Número de elementos por página
  maxVisiblePages: 5, // Número máximo de páginas visibles en la paginación
};
