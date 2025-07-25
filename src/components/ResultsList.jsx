import {
  Card,
  Row,
  Col,
  Badge,
  Button,
  Pagination,
  Table,
  ButtonGroup,
} from "react-bootstrap";
import { useState, useEffect, useCallback } from "react";
import { appConfig } from "../const";

function ResultsList({ results }) {
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState("cards"); // 'cards' o 'list'
  const itemsPerPage = appConfig.itemsPerPage || 12;

  // Resetear página cuando cambien los resultados
  useEffect(() => {
    setCurrentPage(1);
  }, [results]);

  // Navegación con teclado
  const handleKeyPress = useCallback(
    (event) => {
      if (!results || results.length === 0) return;

      const totalPages = Math.ceil(results.length / itemsPerPage);

      if (event.key === "ArrowLeft" && currentPage > 1) {
        setCurrentPage((prev) => prev - 1);
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else if (event.key === "ArrowRight" && currentPage < totalPages) {
        setCurrentPage((prev) => prev + 1);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    },
    [currentPage, results, itemsPerPage]
  );

  useEffect(() => {
    if (!results || results.length === 0) return;

    const totalPages = Math.ceil(results.length / itemsPerPage);
    if (totalPages > 1) {
      document.addEventListener("keydown", handleKeyPress);
      return () => document.removeEventListener("keydown", handleKeyPress);
    }
  }, [handleKeyPress, results, itemsPerPage]);

  // Si results es null, no mostrar nada (estado inicial)
  if (results === null) {
    return null;
  }

  // Si results es un array vacío, mostrar mensaje de no encontrados
  if (results.length === 0) {
    return (
      <div className="text-center mt-4">
        <div className="results-header">
          <p className="text-muted m-0">{appConfig.noResultsText}</p>
        </div>
      </div>
    );
  }

  // Calcular paginación
  const totalPages = Math.ceil(results.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentResults = results.slice(startIndex, endIndex);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Generar elementos de paginación
  const renderPaginationItems = () => {
    const items = [];
    const maxVisiblePages = appConfig.maxVisiblePages || 5;

    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    if (currentPage > 1) {
      items.push(
        <Pagination.Prev
          key="prev"
          onClick={() => handlePageChange(currentPage - 1)}
        />
      );
    }

    if (startPage > 1) {
      items.push(
        <Pagination.Item key={1} onClick={() => handlePageChange(1)}>
          1
        </Pagination.Item>
      );
      if (startPage > 2) {
        items.push(<Pagination.Ellipsis key="ellipsis1" />);
      }
    }

    for (let page = startPage; page <= endPage; page++) {
      items.push(
        <Pagination.Item
          key={page}
          active={page === currentPage}
          onClick={() => handlePageChange(page)}
        >
          {page}
        </Pagination.Item>
      );
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        items.push(<Pagination.Ellipsis key="ellipsis2" />);
      }
      items.push(
        <Pagination.Item
          key={totalPages}
          onClick={() => handlePageChange(totalPages)}
        >
          {totalPages}
        </Pagination.Item>
      );
    }

    if (currentPage < totalPages) {
      items.push(
        <Pagination.Next
          key="next"
          onClick={() => handlePageChange(currentPage + 1)}
        />
      );
    }

    return items;
  };

  const getColumnSize = () => {
    const count = currentResults.length;
    if (count === 1) return { xs: 12, sm: 10, md: 8, lg: 6, xl: 10 };
    if (count === 2) return { xs: 12, sm: 6, md: 6, lg: 6, xl: 6 };
    return { xs: 12, md: 6, lg: 4, xl: 3 };
  };

  const colSize = getColumnSize();

  // Renderizar badges como texto plano para la vista de lista
  const renderBadgesAsText = (material) => {
    const badges = [];
    if (material.tipo) badges.push(material.tipo);
    if (material.nivel) badges.push(material.nivel);
    if (material.dificultad) badges.push(material.dificultad);
    if (material.tipoejercicio) badges.push(material.tipoejercicio);
    return badges.join(" • ");
  };

  // Vista de lista
  const renderListView = () => (
    <div className="table-responsive">
      <Table hover className="results-table">
        <thead>
          <tr>
            <th style={{ width: "35%" }}>Título</th>
            <th style={{ width: "30%" }}>Descripción</th>
            <th style={{ width: "10%" }}>Fecha</th>
            <th style={{ width: "10%" }}>Acción</th>
          </tr>
        </thead>
        <tbody>
          {currentResults.map((material, index) => (
            <tr key={startIndex + index} className="result-row">
              <td>
                <div className="list-title">
                  {material.titulo || "Sin título"}
                </div>
                {(material.tema || material.unidad) && (
                  <div className="list-meta">
                    {material.tema && <small>📚 {material.tema}</small>}
                    {material.tema && material.unidad && <small> • </small>}
                    {material.unidad && <small>📖 {material.unidad}</small>}
                  </div>
                )}
              </td>
              <td>
                <div className="list-description">
                  {material.descripcion || "Sin descripción disponible"}
                </div>
                {material.palabrasclave && (
                  <div className="list-keywords">
                    <small>🔍 {material.palabrasclave}</small>
                  </div>
                )}
              </td>

              <td>
                {material.fechasubida && (
                  <small className="text-muted">24/7/2025</small>
                )}
              </td>
              <td>
                {material.urldrive ? (
                  <Button
                    variant="primary"
                    size="sm"
                    href={material.urldrive}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-custom"
                  >
                    📄 Ver
                  </Button>
                ) : (
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    disabled
                    className="btn-custom"
                  >
                    ❌ N/D
                  </Button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );

  // Vista de tarjetas (original)
  const renderCardsView = () => (
    <Row
      className={currentResults.length === 1 ? "justify-content-center" : ""}
    >
      {currentResults.map((material, index) => (
        <Col {...colSize} className="mb-4" key={startIndex + index}>
          <Card className="h-100 result-card">
            <Card.Body>
              {/* TÍTULO - Máxima prioridad visual */}
              <Card.Title>{material.titulo || "Sin título"}</Card.Title>

              {/* DESCRIPCIÓN - Segunda prioridad */}
              <Card.Text>
                {material.descripcion || "Sin descripción disponible"}
              </Card.Text>

              {/* INFORMACIÓN ADICIONAL - Tercera prioridad */}
              {(material.palabrasclave || material.tema || material.unidad) && (
                <div className="info-section">
                  {material.tema && (
                    <div className="info-item">
                      <span className="info-label">📚 Tema:</span>
                      <span className="info-value">{material.tema}</span>
                    </div>
                  )}

                  {material.unidad && (
                    <div className="info-item">
                      <span className="info-label">📖 Unidad:</span>
                      <span className="info-value">{material.unidad}</span>
                    </div>
                  )}

                  {material.palabrasclave && (
                    <div className="info-item">
                      <span className="info-label">🔍 Palabras clave:</span>
                      <span className="info-value">
                        {material.palabrasclave}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* BADGES - Mínima prioridad visual */}
              {(material.tipo ||
                material.nivel ||
                material.dificultad ||
                material.tipoejercicio) && (
                <div className="badge-container">
                  <div className="d-flex flex-wrap">
                    {material.tipo && (
                      <Badge className="badge-custom">{material.tipo}</Badge>
                    )}
                    {material.nivel && (
                      <Badge className="badge-custom">{material.nivel}</Badge>
                    )}
                    {material.dificultad && (
                      <Badge className="badge-custom">
                        {material.dificultad}
                      </Badge>
                    )}
                    {material.tipoejercicio && (
                      <Badge className="badge-custom">
                        {material.tipoejercicio}
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              {/* FOOTER - Botón y fecha */}
              <div className="card-footer-custom">
                <div>
                  {material.urldrive ? (
                    <Button
                      variant="primary"
                      href={material.urldrive}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-custom"
                    >
                      📄 Ver Material
                    </Button>
                  ) : (
                    <Button
                      variant="outline-secondary"
                      disabled
                      className="btn-custom"
                    >
                      ❌ Material no disponible
                    </Button>
                  )}
                </div>

                {material.fechasubida && (
                  <div className="date-text">
                    📅{" "}
                    {new Date(material.fechasubida).toLocaleDateString("es-ES")}
                  </div>
                )}
              </div>
            </Card.Body>
          </Card>
        </Col>
      ))}
    </Row>
  );

  return (
    <div className="mt-4">
      {/* Header con información de resultados y toggle de vista */}
      <div className="results-header">
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center">
          <div className="mb-2 mb-md-0">
            <h5 className="mb-2 mb-md-0">
              📋 {results.length}{" "}
              {results.length === 1
                ? "material encontrado"
                : "materiales encontrados"}
              {totalPages > 1 && (
                <small className="text-muted ms-2">
                  (Página {currentPage} de {totalPages})
                </small>
              )}
            </h5>

            {totalPages > 1 && (
              <div className="text-muted small">
                Mostrando {startIndex + 1}-{Math.min(endIndex, results.length)}{" "}
                de {results.length}
              </div>
            )}
          </div>

          {/* Toggle de vista */}
          <div className="view-toggle">
            <ButtonGroup size="sm">
              <Button
                variant={viewMode === "cards" ? "primary" : "outline-secondary"}
                onClick={() => setViewMode("cards")}
                className="d-flex align-items-center gap-1"
              >
                📊 Tarjetas
              </Button>
              <Button
                variant={viewMode === "list" ? "primary" : "outline-secondary"}
                onClick={() => setViewMode("list")}
                className="d-flex align-items-center gap-1"
              >
                📋 Lista
              </Button>
            </ButtonGroup>
          </div>
        </div>
      </div>

      {/* Renderizar vista según el modo seleccionado */}
      {viewMode === "list" ? renderListView() : renderCardsView()}

      {/* Paginación */}
      {totalPages > 1 && (
        <>
          <div className="d-flex justify-content-center mt-4">
            <Pagination>{renderPaginationItems()}</Pagination>
          </div>

          <div className="text-center mt-3">
            <small className="text-muted">
              💡 Usa las flechas del teclado ← → para navegar entre páginas
            </small>
          </div>

          {currentPage > 3 && (
            <div className="text-center mt-2">
              <Button
                variant="link"
                size="sm"
                onClick={() => handlePageChange(1)}
                className="text-muted"
              >
                ⬆️ Volver al inicio
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default ResultsList;
