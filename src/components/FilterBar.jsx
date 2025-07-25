import { useState, useEffect } from "react";
import { Form, Button, Col, Row, Spinner, Alert } from "react-bootstrap";
import csvSheetsService from "../services/csvSheetsService";
import { filterConfig, appConfig } from "../const";

function FilterBar({ onResults }) {
  // Estado para las opciones dinámicas cargadas desde Google Sheets
  const [filterOptions, setFilterOptions] = useState({});
  const [isLoadingOptions, setIsLoadingOptions] = useState(true);

  // Estado para el formulario - se inicializa dinámicamente
  const [formData, setFormData] = useState({
    keywords: "",
  });

  // Estados para loading y errores
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Cargar las opciones al montar el componente
  useEffect(() => {
    loadFilterOptions();
  }, []);

  const loadFilterOptions = async () => {
    try {
      setIsLoadingOptions(true);

      // Pasar la configuración al servicio para que sea completamente dinámico
      const options = await csvSheetsService.getFilterOptions(filterConfig);

      // Mapear las opciones usando la configuración dinámica
      const mappedOptions = {};
      const initialFormData = { keywords: "" };

      filterConfig.forEach((config) => {
        if (config.enabled) {
          // Usar el campo definido en la configuración
          mappedOptions[config.label] = options[config.field] || [];

          // Inicializar el campo del formulario
          initialFormData[config.label] = "";
        }
      });

      setFilterOptions(mappedOptions);
      setFormData(initialFormData);
    } catch (err) {
      console.error("Error cargando opciones de filtro:", err);
      setError("Error cargando los filtros. Inténtalo nuevamente.");
    } finally {
      setIsLoadingOptions(false);
    }
  };

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const results = await csvSheetsService.searchMaterials(
        formData,
        filterConfig
      );
      onResults(results);
    } catch (err) {
      setError(appConfig.errorText);
      console.error("Error:", err);
      onResults([]); // Limpiar resultados en caso de error
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = () => {
    setError(null);
    loadFilterOptions();
  };

  // Mostrar spinner mientras cargan las opciones
  if (isLoadingOptions) {
    return (
      <div className="text-center">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Cargando filtros...</span>
        </Spinner>
        <p className="mt-2 text-muted">Cargando filtros...</p>
      </div>
    );
  }

  return (
    <>
      {error && (
        <Alert variant="danger" className="mb-3">
          {error}
          <div className="mt-2">
            <Button
              variant="outline-danger"
              size="sm"
              onClick={handleRetry}
              className="me-2"
            >
              Reintentar
            </Button>
            <Button
              variant="link"
              size="sm"
              onClick={() => setError(null)}
              className="p-0"
            >
              ×
            </Button>
          </div>
        </Alert>
      )}

      <Form onSubmit={handleSubmit}>
        <Row className="justify-content-center align-items-center g-3">
          {/* Campo de palabras clave */}
          <Col xs="auto">
            <div
              className={`keywords-input-wrapper ${
                formData.keywords ? "has-value" : ""
              }`}
            >
              <Form.Control
                type="text"
                name="keywords"
                placeholder={appConfig.keywordsPlaceholder}
                value={formData.keywords}
                onChange={handleChange}
                className={formData.keywords ? "has-value" : ""}
                style={{ minWidth: "200px" }}
              />
            </div>
          </Col>

          {/* Filtros desplegables dinámicos */}
          {filterConfig
            .filter((config) => config.enabled)
            .map((config) => (
              <Col xs="auto" key={config.label}>
                <Form.Select
                  name={config.label}
                  value={formData[config.label] || ""}
                  onChange={handleChange}
                  className={formData[config.label] ? "has-value" : ""}
                  disabled={
                    !filterOptions[config.label] ||
                    filterOptions[config.label].length === 0
                  }
                >
                  <option value="">{config.label}</option>
                  {(filterOptions[config.label] || []).map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </Form.Select>
              </Col>
            ))}

          <Col xs="auto">
            <Button type="submit" variant="primary" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Spinner size="sm" className="me-2" />
                  {appConfig.loadingText}
                </>
              ) : (
                appConfig.searchButtonText
              )}
            </Button>
          </Col>

          {/* Botón para limpiar cache (solo en desarrollo) */}
          {process.env.NODE_ENV === "development" && (
            <Col xs="auto">
              <Button
                variant="outline-secondary"
                size="sm"
                onClick={loadFilterOptions}
                //title="Limpiar cache y recargar filtros"
              >
                🗑️
              </Button>
            </Col>
          )}
        </Row>
      </Form>
    </>
  );
}

export default FilterBar;
