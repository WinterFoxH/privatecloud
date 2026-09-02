import { GitBranch } from 'lucide-react';

export function UseCaseDiagram() {
  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2>Diagram przypadków użycia</h2>
          <p className="subtitle">
            Model UML na poziomie systemu — zgodny z Tabelą 4 w pracy dyplomowej. Aktor systemowy
            „Klient mobilny” inicjuje synchronizację w tle (UC-SYNC).
          </p>
        </div>
      </div>

      <div className="card diagram-card">
        <img
          src="/diagrams/use-case-diagram.png"
          alt="Diagram przypadków użycia — system chmury prywatnej"
          className="diagram-image"
        />
      </div>

      <div className="card info-card">
        <h3>
          <GitBranch size={18} style={{ verticalAlign: 'middle', marginRight: '0.35rem' }} />
          Źródło diagramu
        </h3>
        <p>
          Plik źródłowy: <code>diagrams/use-case.puml</code> (PlantUML) w katalogu głównym projektu
          pracy.
        </p>
      </div>
    </div>
  );
}
