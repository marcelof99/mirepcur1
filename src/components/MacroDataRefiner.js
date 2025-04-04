import React, { useState, useEffect, useRef, useCallback } from 'react';
import './MacroDataRefiner.css';

const MacroDataRefiner = ({ onClose }) => {
  const [numbers, setNumbers] = useState([]);
  const [hoveredCell, setHoveredCell] = useState(null);
  const [draggingNumbers, setDraggingNumbers] = useState([]);
  const [activeBin, setActiveBin] = useState(null);
  const [progress, setProgress] = useState(87);
  const [binProgress, setBinProgress] = useState([35, 26, 33, 34, 18]);
  const [name, setName] = useState('Siena');
  const gridRef = useRef(null);
  const lensRadius = 50;
  const audioContext = useRef(null);
  const gainNode = useRef(null);

  const getRandomName = useCallback(() => {
    const names = [
      'Mark', 'Helly', 'Dylan', 'Irving', 'Burt', 'Cobel', 'Milchick',
      'Ricken', 'Casey', 'Reghabi', 'Petey', 'Rickon', 'Jame', 'Owen',
      'Carol', 'Peg', 'Doug', 'June', 'Pat', 'Larry', 'Moe', 'Curly'
    ];
    const randomIndex = Math.floor(Math.random() * names.length);
    return names[randomIndex];
  }, []);

  const playTrumpetSound = useCallback(() => {
    if (!audioContext.current) return new Promise((resolve) => resolve());

    const frequencies = [440, 523.25, 659.25, 783.99];
    const duration = 3.0;
    const noteDuration = duration / frequencies.length;

    return new Promise((resolve) => {
      try {
        frequencies.forEach((freq, index) => {
          const oscillator = audioContext.current.createOscillator();
          const gain = audioContext.current.createGain();

          oscillator.type = 'sawtooth';
          oscillator.frequency.setValueAtTime(freq, audioContext.current.currentTime + (index * noteDuration));
          
          gain.gain.setValueAtTime(0.3, audioContext.current.currentTime + (index * noteDuration));
          gain.gain.exponentialRampToValueAtTime(0.01, audioContext.current.currentTime + ((index + 1) * noteDuration));

          oscillator.connect(gain);
          gain.connect(audioContext.current.destination);
          oscillator.start(audioContext.current.currentTime + (index * noteDuration));
          oscillator.stop(audioContext.current.currentTime + ((index + 1) * noteDuration));
        });

        // Resolver la promesa después de que termine el sonido
        setTimeout(resolve, duration * 1000);
      } catch (error) {
        console.error('Error playing trumpet sound:', error);
        resolve();
      }
    });
  }, []);

  useEffect(() => {
    try {
      // Inicializar el contexto de audio
      audioContext.current = new (window.AudioContext || window.webkitAudioContext)();
      gainNode.current = audioContext.current.createGain();
      gainNode.current.gain.value = 0.3;
      gainNode.current.connect(audioContext.current.destination);

      // Limpiar al desmontar
      return () => {
        if (audioContext.current) {
          audioContext.current.close();
        }
      };
    } catch (error) {
      console.error('Error initializing audio context:', error);
    }
  }, []);

  const playSound = useCallback((frequency, duration, type = 'sine') => {
    if (!audioContext.current) return;

    try {
      const oscillator = audioContext.current.createOscillator();
      const gain = audioContext.current.createGain();

      oscillator.type = type;
      oscillator.frequency.setValueAtTime(frequency, audioContext.current.currentTime);
      
      gain.gain.setValueAtTime(0.2, audioContext.current.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioContext.current.currentTime + duration);

      oscillator.connect(gain);
      gain.connect(audioContext.current.destination);
      oscillator.start(audioContext.current.currentTime);
      oscillator.stop(audioContext.current.currentTime + duration);
    } catch (error) {
      console.error('Error playing sound:', error);
    }
  }, []);

  const playSelectSound = () => {
    playSound(800, 0.1);
  };

  const playDropSound = () => {
    playSound(400, 0.2, 'square');
  };

  const playHoverSound = () => {
    playSound(600, 0.05);
  };

  const playErrorSound = () => {
    playSound(200, 0.3, 'sawtooth');
  };

  useEffect(() => {
    const generateNumbers = () => {
      const nums = [];
      for (let i = 0; i < 140; i++) {
        nums.push({
          id: i,
          value: Math.floor(Math.random() * 10),
          isSelected: false,
          bin: null,
          row: Math.floor(i / 20),
          col: i % 20,
          isAnimating: false
        });
      }
      setNumbers(nums);
    };
    generateNumbers();
  }, []);

  const get3x3Grid = (centerId) => {
    const centerNumber = numbers.find(n => n.id === centerId);
    if (!centerNumber) return [];

    const { row, col } = centerNumber;
    return numbers.filter(n => {
      const rowDiff = Math.abs(n.row - row);
      const colDiff = Math.abs(n.col - col);
      return rowDiff <= 1 && colDiff <= 1 && !n.isAnimating;
    });
  };

  const handleMouseMove = (e) => {
    if (!gridRef.current) return;
    
    const rect = gridRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const cellWidth = rect.width / 20;
    const cellHeight = rect.height / 10;
    
    const cellX = Math.floor(x / cellWidth);
    const cellY = Math.floor(y / cellHeight);
    
    if (cellX >= 0 && cellX < 20 && cellY >= 0 && cellY < 10) {
      if (!hoveredCell || hoveredCell.x !== cellX || hoveredCell.y !== cellY) {
        playHoverSound();
      }
      setHoveredCell({
        x: cellX,
        y: cellY,
        mouseX: x,
        mouseY: y
      });
    } else {
      setHoveredCell(null);
    }
  };

  const handleDragStart = (e, number) => {
    if (number.isAnimating) {
      playErrorSound();
      return;
    }

    const selectedNumbers = get3x3Grid(number.id);
    if (selectedNumbers.length === 0) {
      playErrorSound();
      return;
    }

    playSelectSound();
    setDraggingNumbers(selectedNumbers);
    
    const updatedNumbers = numbers.map(n => 
      selectedNumbers.some(sn => sn.id === n.id) ? { ...n, isSelected: true } : n
    );
    setNumbers(updatedNumbers);
    
    // Create a minimal ghost image for dragging
    const dragImage = document.createElement('div');
    dragImage.style.width = '40px';
    dragImage.style.height = '40px';
    dragImage.style.background = '#000';
    dragImage.style.color = '#00b4d8';
    dragImage.style.display = 'flex';
    dragImage.style.alignItems = 'center';
    dragImage.style.justifyContent = 'center';
    dragImage.style.fontSize = '1.5rem';
    dragImage.style.fontFamily = 'Courier New, monospace';
    dragImage.textContent = number.value;
    dragImage.style.position = 'absolute';
    dragImage.style.top = '-1000px';
    dragImage.style.left = '-1000px';
    document.body.appendChild(dragImage);
    
    e.dataTransfer.setDragImage(dragImage, 20, 20);
    setTimeout(() => document.body.removeChild(dragImage), 0);
  };

  const handleDragEnd = () => {
    if (!activeBin) {
      const updatedNumbers = numbers.map(n => 
        draggingNumbers.some(dn => dn.id === n.id) ? { ...n, isSelected: false } : n
      );
      setNumbers(updatedNumbers);
    }
    setDraggingNumbers([]);
  };

  const handleDragOver = (e, bin) => {
    e.preventDefault();
    setActiveBin(bin);
  };

  const handleDragLeave = () => {
    setActiveBin(null);
  };

  const handleDrop = (e, bin) => {
    e.preventDefault();
    if (draggingNumbers.length === 0) {
      playErrorSound();
      return;
    }

    playDropSound();
    
    // Marcar números como animando temporalmente
    const updatedNumbers = numbers.map(n =>
      draggingNumbers.some(dn => dn.id === n.id) 
        ? { ...n, bin, isSelected: false, isAnimating: true } 
        : n
    );
    setNumbers(updatedNumbers);
    
    // Actualizar el progreso
    const newProgress = Math.min(progress + 2, 100);
    setProgress(newProgress);
    
    setDraggingNumbers([]);
    setActiveBin(bin);

    // Después de la animación, resetear los números para que sean seleccionables de nuevo
    setTimeout(() => {
      setNumbers(prev => prev.map(n =>
        draggingNumbers.some(dn => dn.id === n.id)
          ? { ...n, bin: null, isAnimating: false }
          : n
      ));
      setActiveBin(null);
    }, 1500);
  };

  const getNumberStyle = (number) => {
    if (number.isAnimating && number.bin !== null && number.bin !== undefined) {
      const binPositions = [
        { x: -50, y: -50 },
        { x: 150, y: -50 },
        { x: -50, y: 150 },
        { x: 150, y: 150 },
        { x: 0, y: 150 }
      ];
      
      const position = binPositions[number.bin] || binPositions[0];
      
      // Solo calcular las posiciones relativas si tenemos un número central
      if (draggingNumbers && draggingNumbers.length > 0 && draggingNumbers[4]) {
        const centerNumber = draggingNumbers[4];
        const rowDiff = number.row - centerNumber.row;
        const colDiff = number.col - centerNumber.col;
        const finalX = position.x + (colDiff * 20);
        const finalY = position.y + (rowDiff * 20);
        
        return {
          transform: `translate(${finalX}px, ${finalY}px)`,
          transition: 'all 1.5s cubic-bezier(0.4, 0, 0.2, 1)',
          position: 'absolute',
          opacity: 0.8
        };
      }
      
      // Si no hay número central, usar la posición base
      return {
        transform: `translate(${position.x}px, ${position.y}px)`,
        transition: 'all 1.5s cubic-bezier(0.4, 0, 0.2, 1)',
        position: 'absolute',
        opacity: 0.8
      };
    }

    if (number.isSelected) {
      // Si es el número central (seleccionado), agrandarlo al 200%
      if (draggingNumbers && draggingNumbers.length > 0 && number.id === draggingNumbers[4]?.id) {
        return {
          transform: 'scale(2)',
          zIndex: 2,
          transition: 'transform 0.2s ease'
        };
      } else {
        // Si es uno de los números circundantes, reducirlo al 20%
        return {
          transform: 'scale(0.2)',
          zIndex: 1,
          transition: 'transform 0.2s ease'
        };
      }
    }

    if (hoveredCell && !number.isSelected) {
      const cellX = number.col * (gridRef.current?.clientWidth / 20) + (gridRef.current?.clientWidth / 40);
      const cellY = number.row * (gridRef.current?.clientHeight / 10) + (gridRef.current?.clientHeight / 20);
      
      const dx = hoveredCell.mouseX - cellX;
      const dy = hoveredCell.mouseY - cellY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < lensRadius) {
        // Generar un número aleatorio entre 0.01 y 5.0 para el escalado (1% a 500%)
        const randomScale = (Math.random() * 4.99) + 0.01;
        return {
          transform: `scale(${randomScale})`,
          zIndex: 2,
          transition: 'transform 0.2s ease'
        };
      }
    }

    return {
      transform: 'scale(1)',
      transition: 'transform 0.2s ease'
    };
  };

  const handleBinHover = useCallback((binIndex) => {
    setActiveBin(binIndex);
    if (draggingNumbers.length > 0) {
      setBinProgress(prev => {
        const newProgress = [...prev];
        newProgress[binIndex] = Math.min(100, newProgress[binIndex] + 5);
        return newProgress;
      });
      playSound(440 + binIndex * 50, 0.2, 'sine');
    }
  }, [draggingNumbers.length, playSound]);

  useEffect(() => {
    if (progress === 100) {
      try {
        console.log('Progress reached 100%, playing sound');
        
        // Primero tocar el sonido y esperar a que termine
        playTrumpetSound().then(() => {
          console.log('Sound finished, changing name');
          setName(getRandomName());
          
          // Resetear el contador a un valor aleatorio entre 89% y 97%
          const newProgress = Math.floor(Math.random() * (97 - 89 + 1)) + 89;
          setProgress(newProgress);
        });
      } catch (error) {
        console.error('Error in progress effect:', error);
      }
    }
  }, [progress, getRandomName, playTrumpetSound]);

  return (
    <div className="mdr-container">
      <div className="mdr-header">
        <h2>{name}</h2>
        <div className="completion">{progress}% Complete</div>
        <div className="logo">
          <div className="logo-planet"></div>
          <div className="logo-planet-medium"></div>
          <div className="logo-planet-small"></div>
          <div className="logo-planet-flat"></div>
          <div className="logo-text">
            LUM<span className="logo-o"><div className="drop"></div></span>N
          </div>
        </div>
      </div>
      
      <div 
        className="number-grid" 
        ref={gridRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoveredCell(null)}
      >
        {numbers.map((number) => (
          <div
            key={number.id}
            className={`number-cell ${number.isSelected ? 'selected' : ''}`}
            style={getNumberStyle(number)}
            draggable={!number.isAnimating}
            onDragStart={(e) => handleDragStart(e, number)}
            onDragEnd={handleDragEnd}
          >
            {number.value}
          </div>
        ))}
      </div>

      <div className="bins-container">
        {[0, 1, 2, 3, 4].map(bin => (
          <div 
            key={bin} 
            className={`bin ${activeBin === bin ? 'active' : ''}`}
            onDragOver={(e) => handleDragOver(e, bin)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, bin)}
          >
            <div className="bin-label">
              {String(bin + 1).padStart(2, '0')}
            </div>
            <div className="bin-progress">
              <div 
                className="bin-progress-fill"
                style={{ '--progress': `${binProgress[bin]}%` }}
              />
              <div className="bin-progress-text">
                {binProgress[bin]}%
              </div>
            </div>
            <div className="bin-doors">
              <div className="door left"></div>
              <div className="door right"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MacroDataRefiner; 