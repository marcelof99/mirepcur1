import React, { useState } from 'react';
import './App.css';
import MacroDataRefiner from './components/MacroDataRefiner';

function App() {
  const [selectedOption, setSelectedOption] = useState(null);
  const [showMessage, setShowMessage] = useState(false);
  const [showMDR, setShowMDR] = useState(false);

  const options = [
    { id: 1, name: 'MDR', description: 'Macrodata Refinement' },
    { id: 2, name: 'O&D', description: 'Optics & Design' },
    { id: 3, name: 'W&A', description: 'Wellness & Assistance' },
  ];

  const handleSelect = (option) => {
    setSelectedOption(option);
    setShowMessage(true);
    setTimeout(() => {
      setShowMessage(false);
      if (option.name === 'MDR') {
        setShowMDR(true);
      }
    }, 3000);
  };

  const handleCloseMDR = () => {
    setShowMDR(false);
    setSelectedOption(null);
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Bienvenido al Programa de Severance</h1>
        <p className="subtitle">Seleccione su departamento</p>
        
        <div className="options-container">
          {options.map(option => (
            <div 
              key={option.id}
              className={`option-card ${selectedOption?.id === option.id ? 'selected' : ''}`}
              onClick={() => handleSelect(option)}
            >
              <div className="option-code">{option.name}</div>
              <div className="option-description">{option.description}</div>
            </div>
          ))}
        </div>

        {showMessage && selectedOption && (
          <div className="message">
            <p>Acceso concedido a {selectedOption.name}</p>
            <p className="message-sub">Iniciando protocolo de severance...</p>
          </div>
        )}

        <div className="status-bar">
          <div className="status-indicator"></div>
          <div className="status-text">Sistema Operativo</div>
        </div>
      </header>

      {showMDR && <MacroDataRefiner onClose={handleCloseMDR} />}
    </div>
  );
}

export default App;
