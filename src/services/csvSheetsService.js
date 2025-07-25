import axios from "axios";

// Configuración URL
const CSV_URL =
  process.env.NODE_ENV === "production"
    ? "/.netlify/functions/sheets" // Usar la función serverless en producción
    : import.meta.env.VITE_SHEET_URL; // Usar variable de entorno en desarrollo

class CSVSheetsService {
  constructor() {
    this.cache = null;
    this.cacheTime = null;
    this.cacheDuration = 5 * 60 * 1000; // 5 minutos en milisegundos
  }

  // Función mejorada para parsear CSV con manejo robusto de comas y comillas
  parseCSV(csvText) {
    const lines = csvText.split("\n");
    const result = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const row = [];
      let current = "";
      let inQuotes = false;
      let j = 0;

      while (j < line.length) {
        const char = line[j];

        if (char === '"') {
          if (!inQuotes) {
            inQuotes = true;
          } else if (j + 1 < line.length && line[j + 1] === '"') {
            current += '"';
            j++;
          } else {
            inQuotes = false;
          }
        } else if (char === "," && !inQuotes) {
          row.push(current.trim());
          current = "";
        } else {
          current += char;
        }

        j++;
      }

      row.push(current.trim());
      result.push(row);
    }

    return result;
  }

  // Obtener datos con cache mejorado
  async getData() {
    const now = Date.now();
    if (
      this.cache &&
      this.cacheTime &&
      now - this.cacheTime < this.cacheDuration
    ) {
      return this.cache;
    }

    try {
      const response = await axios.get(CSV_URL, {
        headers: {
          Accept: "text/csv, text/plain, */*",
        },
        timeout: 10000,
        responseType: "text",
      });

      const csvData = this.parseCSV(response.data);

      const formattedData = this.formatData(csvData);

      this.cache = formattedData;
      this.cacheTime = now;

      return formattedData;
    } catch (error) {
      console.error("Error fetching CSV data:", error);

      const errorMessage =
        process.env.NODE_ENV === "production"
          ? "Error al obtener datos"
          : `No se pudieron obtener los datos: ${error.message}`;

      if (error.code === "ECONNABORTED" || error.message.includes("timeout")) {
        console.warn("Timeout detectado, reintentando...");
        return this.retryGetData();
      }

      if (this.cache) {
        console.warn("Usando datos en cache debido al error");
        return this.cache;
      }

      throw new Error(errorMessage);
    }
  }

  // Método de reintento con configuración diferente
  async retryGetData() {
    try {
      const response = await axios.get(CSV_URL, {
        headers: {
          Accept: "*/*",
          "User-Agent": "Mozilla/5.0 (compatible; ReactApp/1.0)",
        },
        timeout: 15000,
        responseType: "text",
      });

      const csvData = this.parseCSV(response.data);
      const formattedData = this.formatData(csvData);

      this.cache = formattedData;
      this.cacheTime = Date.now();

      return formattedData;
    } catch (retryError) {
      console.error("Error en reintento:", retryError);

      if (this.cache) {
        console.warn("Usando cache como último recurso");
        return this.cache;
      }

      throw retryError;
    }
  }

  // Formatear datos para uso en la aplicación - mejorado para campos dinámicos
  formatData(rawData) {
    if (!rawData || rawData.length === 0) return [];

    const headers = rawData[0];
    const rows = rawData.slice(1);

    return rows
      .filter((row) => row.some((cell) => cell && cell.trim())) // Filtrar filas vacías
      .map((row) => {
        const item = {};
        headers.forEach((header, index) => {
          if (!header) return; // Saltar headers vacíos

          // Normalizar nombres de columnas de forma más robusta
          const normalizedHeader = this.normalizeFieldName(header);
          const value = (row[index] || "").toString().trim();

          item[normalizedHeader] = value;
        });
        return item;
      });
  }

  // Función mejorada para normalizar nombres de campos
  normalizeFieldName(fieldName) {
    return fieldName
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "") // Remover espacios
      .replace(/_/g, "") // Remover guiones bajos
      .replace(/-/g, "") // Remover guiones
      .replace(/[áàäâ]/g, "a")
      .replace(/[éèëê]/g, "e")
      .replace(/[íìïî]/g, "i")
      .replace(/[óòöô]/g, "o")
      .replace(/[úùüû]/g, "u")
      .replace(/ñ/g, "n")
      .replace(/[^\w]/g, ""); // Remover cualquier carácter especial restante
  }

  // Función auxiliar para limpiar y normalizar texto
  normalizeText(text) {
    return text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // Remover acentos
      .replace(/[^\w\s]/g, " ") // Reemplazar caracteres especiales con espacios
      .replace(/\s+/g, " ") // Normalizar espacios múltiples
      .trim();
  }

  // Función para buscar palabras clave de forma inteligente
  searchInText(searchText, targetText) {
    if (!searchText || !targetText) return false;

    const normalizedSearch = this.normalizeText(searchText);
    const normalizedTarget = this.normalizeText(targetText);

    if (normalizedTarget.includes(normalizedSearch)) {
      return true;
    }

    const searchWords = normalizedSearch
      .split(" ")
      .filter((word) => word.length > 2);
    const targetWords = normalizedTarget.split(" ");

    let foundWords = 0;
    searchWords.forEach((searchWord) => {
      const found = targetWords.some(
        (targetWord) =>
          targetWord.includes(searchWord) || searchWord.includes(targetWord)
      );
      if (found) foundWords++;
    });

    return searchWords.length > 0 && foundWords / searchWords.length >= 0.7;
  }

  // NUEVA FUNCIÓN: Separar valores múltiples de un campo
  separateMultipleValues(value) {
    if (!value || typeof value !== "string") return [value];

    // Separadores comunes: coma, punto y coma, y/Y, guión, pipe
    const separators = [",", ";", " y ", " Y ", " - ", "|"];
    let values = [value];

    separators.forEach((separator) => {
      const newValues = [];
      values.forEach((v) => {
        if (v && v.includes(separator)) {
          newValues.push(
            ...v
              .split(separator)
              .map((item) => item.trim())
              .filter((item) => item)
          );
        } else {
          newValues.push(v);
        }
      });
      values = newValues;
    });

    return values.filter((v) => v && v.trim()); // Filtrar valores vacíos
  }

  // NUEVA FUNCIÓN: Verificar si un elemento coincide con un valor de filtro múltiple
  matchesMultipleValueFilter(itemValue, filterValue) {
    if (!itemValue || !filterValue) return false;

    const itemValues = this.separateMultipleValues(itemValue);

    // Normalizar tanto los valores del item como el filtro para comparación
    const normalizedItemValues = itemValues.map((v) => this.normalizeText(v));
    const normalizedFilterValue = this.normalizeText(filterValue);

    return normalizedItemValues.some((v) => v === normalizedFilterValue);
  }

  // Método de búsqueda mejorado para campos dinámicos y valores múltiples
  async searchMaterials(filters, filterConfig = null) {
    // Sanitizar y validar filtros de entrada
    const sanitizedFilters = this.sanitizeFilters(filters);

    const data = await this.getData();

    return data.filter((item) => {
      // Filtro por palabras clave
      if (filters.keywords) {
        const keywords = filters.keywords.toLowerCase();
        const searchableFields = [
          "titulo",
          "descripcion",
          "palabrasclave",
          "palabrasclaves",
        ];

        const searchableText = searchableFields
          .map((field) => item[field] || "")
          .join(" ")
          .toLowerCase();

        if (!this.searchInText(keywords, searchableText)) return false;
      }

      // Filtros dinámicos basados en los campos del formulario
      for (const [filterKey, filterValue] of Object.entries(filters)) {
        if (filterKey === "keywords" || !filterValue) continue;

        // Usar la configuración dinámica para mapear el campo
        const normalizedFilterField = this.getFieldNameForFilter(
          filterKey,
          filterConfig
        );
        const itemValue = item[normalizedFilterField];

        if (!itemValue) return false;

        // CAMBIO PRINCIPAL: Usar la nueva función para valores múltiples
        if (!this.matchesMultipleValueFilter(itemValue, filterValue)) {
          return false;
        }
      }

      return true;
    });
  }

  // Sanitizar filtros
  sanitizeFilters(filters) {
    const sanitized = {};

    for (const [key, value] of Object.entries(filters)) {
      if (typeof value === "string") {
        // Limitar longitud y remover caracteres potencialmente peligrosos
        const cleanValue = value
          .slice(0, 100) // Máximo 100 caracteres
          .replace(/[<>]/g, "") // Remover < y >
          .trim();

        if (cleanValue.length > 0) {
          sanitized[key] = cleanValue;
        }
      }
    }

    return sanitized;
  }

  // Mapear nombres de filtros a nombres de campos usando la configuración dinámica
  getFieldNameForFilter(filterLabel, filterConfig = null) {
    // Si se proporciona la configuración, usarla para el mapeo
    if (filterConfig) {
      const configItem = filterConfig.find(
        (config) => config.label === filterLabel
      );
      if (configItem) {
        return configItem.field;
      }
    }

    // Fallback: normalizar el nombre del label
    return this.normalizeFieldName(filterLabel);
  }

  // Obtener opciones únicas para los filtros - completamente dinámico con separación de valores múltiples
  async getFilterOptions(filterConfig = null) {
    const data = await this.getData();

    const getUniqueValues = (field) => {
      const allValues = new Set();

      data.forEach((item) => {
        const fieldValue = item[field];
        if (fieldValue && fieldValue.toString().trim()) {
          // CAMBIO PRINCIPAL: Separar valores múltiples
          const separatedValues = this.separateMultipleValues(
            fieldValue.toString().trim()
          );
          separatedValues.forEach((value) => {
            if (value) allValues.add(value);
          });
        }
      });

      return Array.from(allValues).sort();
    };

    const options = {};

    // Si se proporciona la configuración, usar solo esos campos
    if (filterConfig) {
      filterConfig.forEach((config) => {
        if (config.enabled) {
          const fieldKey = config.field;
          options[fieldKey] = getUniqueValues(fieldKey);
        }
      });
    } else {
      // Fallback: obtener todas las opciones posibles detectadas automáticamente
      // Detectar campos numéricos o categóricos automáticamente
      if (data.length > 0) {
        const sampleItem = data[0];
        Object.keys(sampleItem).forEach((field) => {
          const uniqueValues = getUniqueValues(field);
          // Solo incluir campos que parecen categóricos (menos de 50 valores únicos)
          if (uniqueValues.length > 0 && uniqueValues.length < 50) {
            options[field] = uniqueValues;
          }
        });
      }
    }

    return options;
  }

  // Limpiar cache manualmente
  clearCache() {
    this.cache = null;
    this.cacheTime = null;
  }

  // Obtener estadísticas de cache
  getCacheInfo() {
    return {
      hasCache: !!this.cache,
      cacheTime: this.cacheTime,
      itemsInCache: this.cache ? this.cache.length : 0,
      cacheAge: this.cacheTime ? Date.now() - this.cacheTime : null,
    };
  }
}

export default new CSVSheetsService();
