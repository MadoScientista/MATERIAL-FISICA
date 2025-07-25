import { Container } from "react-bootstrap";
import { useState } from "react";
import { appConfig } from "./const";
import FilterBar from "./components/FilterBar";
import ResultsList from "./components/ResultsList";
import DarkModeToggle from "./components/DarkModeToggle";

function App() {
  // Cambiar de [] a null para indicar que no se ha realizado búsqueda
  const [results, setResults] = useState(null);

  const handleResults = (newResults) => {
    setResults(newResults);
  };

  return (
    <>
      {/* Toggle de modo oscuro (opcional) */}
      <DarkModeToggle />

      <Container fluid className="d-flex flex-column align-items-center mt-5">
        <header className="text-center mb-4">
          <h1>{appConfig.title}</h1>
          <h2>{appConfig.subtitle}</h2>
        </header>

        <FilterBar onResults={handleResults} />

        <ResultsList results={results} />
      </Container>
    </>
  );
}

export default App;
