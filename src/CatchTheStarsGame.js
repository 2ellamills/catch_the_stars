import React, { useState, useEffect, useRef } from 'react';

const CatchTheStarsGame = () => {
  // Game states
  const [gameState, setGameState] = useState('opening'); // opening, playing, end
  const [lives, setLives] = useState(3);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [stars, setStars] = useState([]);
  const [meteors, setMeteors] = useState([]);
  const [starInterval, setStarInterval] = useState(1000); // Initial interval for star appearance (ms)
  
  // Audio elements
  const starSoundRef = useRef(null);
  const meteorSoundRef = useRef(null);
  const tickingSoundRef = useRef(null);
  const transitionSoundRef = useRef(null);
  const backgroundMusicRef = useRef(null);
  
  // Game area dimensions
  const gameAreaRef = useRef(null);
  const [gameDimensions, setGameDimensions] = useState({ width: 0, height: 0 });

  // Load audio files
  useEffect(() => {
    starSoundRef.current = new Audio('/sounds/star.mp3');
    meteorSoundRef.current = new Audio('/sounds/meteor.mp3');
    tickingSoundRef.current = new Audio('/sounds/ticking.mp3');
    transitionSoundRef.current = new Audio('/sounds/transition.mp3');
    backgroundMusicRef.current = new Audio('/sounds/background.mp3');
    
    if (backgroundMusicRef.current) {
      backgroundMusicRef.current.loop = true;
      backgroundMusicRef.current.volume = 0.3;
    }
    
    return () => {
      // Cleanup audio when component unmounts
      if (backgroundMusicRef.current) backgroundMusicRef.current.pause();
    };
  }, []);

  // Update game dimensions on window resize
// Update game dimensions on window resize
useEffect(() => {
  const updateDimensions = () => {
    if (gameAreaRef.current) {
      const width = gameAreaRef.current.offsetWidth || window.innerWidth;
      const height = gameAreaRef.current.offsetHeight || window.innerHeight - 50; // חסר גובה סרגל העליון
      
      console.log("Game dimensions:", width, height); // לדיבוג
      
      setGameDimensions({
        width: width,
        height: height
      });
    }
  };
  
  // קריאה מיידית וגם הקשבה לשינויי גודל
  updateDimensions();
  window.addEventListener('resize', updateDimensions);
  
  // delay נוסף לעדכון מימדים אחרי רינדור מלא של הקומפוננטה
  const timeoutId = setTimeout(updateDimensions, 500);
  
  return () => {
    window.removeEventListener('resize', updateDimensions);
    clearTimeout(timeoutId);
  };
}, [gameState]); // תלות ב-gameState כדי לעדכן בכל מעבר למצב משחק

  // Game timer
  useEffect(() => {
    if (gameState !== 'playing') return;

    // Start background music
    if (backgroundMusicRef.current) {
      backgroundMusicRef.current.play().catch(() => {
        console.log('Background music autoplay prevented by browser');
      });
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          endGame();
          return 0;
        }
        
        // Play ticking sound in the last 10 seconds
        if (prev <= 11 && tickingSoundRef.current) {
          tickingSoundRef.current.play().catch(() => {});
        }
        
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(timer);
      // Stop background music when game ends
      if (backgroundMusicRef.current) backgroundMusicRef.current.pause();
    };
  }, [gameState]);

  // Star generation
  useEffect(() => {
    if (gameState !== 'playing') return;

    const createStar = () => {
      const id = Date.now().toString() + Math.random().toString();
      const size = 40; // Consistent star size
      const posX = Math.random() * (gameDimensions.width - size);
      const posY = Math.random() * (gameDimensions.height * 0.7); // Keep stars in upper 70% of screen

      const newStar = { id, posX, posY, size, createdAt: Date.now() };
      setStars(prev => [...prev, newStar]);

      // Remove star after 2-3 seconds if not caught
      const lifespan = 2000 + Math.random() * 1000;
      setTimeout(() => {
        setStars(prev => prev.filter(star => star.id !== id));
      }, lifespan);
    };

    // Create stars at a steadily increasing rate
    const interval = setInterval(() => {
      createStar();
      
      // Gradually decrease interval (increase frequency)
      setStarInterval(prev => Math.max(prev * 0.995, 500)); // Don't go below 500ms
    }, starInterval);

    return () => clearInterval(interval);
  }, [gameState, gameDimensions, starInterval]);

  // Meteor generation (starts after 5 seconds)
  useEffect(() => {
    if (gameState !== 'playing') return;

    let meteorTimer;
    
    // Start creating meteors after 5 seconds
    const initialDelay = setTimeout(() => {
      const createMeteor = () => {
        if (gameState !== 'playing') return;
        
        const id = 'm' + Date.now().toString() + Math.random().toString();
        const size = 50; // Consistent meteor size
        const posX = Math.random() * (gameDimensions.width - size);
        const posY = -size; // Start from top of screen
        const speed = 3 + Math.random() * 2; // Faster than stars
        
        const newMeteor = { id, posX, posY, size, speed };
        setMeteors(prev => [...prev, newMeteor]);
        
        // Play meteor sound
        if (meteorSoundRef.current) {
          const sound = meteorSoundRef.current.cloneNode();
          sound.volume = 0.3;
          sound.play().catch(() => {});
        }
      };

      // Create meteors at regular intervals
      meteorTimer = setInterval(createMeteor, 2000);
    }, 5000);

    // Move meteors
    const animationFrame = setInterval(() => {
      setMeteors(prev => 
        prev.map(meteor => {
          const newPosY = meteor.posY + meteor.speed;
          
          // Remove meteor if it goes off screen
          if (newPosY > gameDimensions.height) {
            return null;
          }
          
          return { ...meteor, posY: newPosY };
        }).filter(Boolean)
      );
    }, 16); // ~60fps

    return () => {
      clearTimeout(initialDelay);
      clearInterval(meteorTimer);
      clearInterval(animationFrame);
    };
  }, [gameState, gameDimensions]);

  // Start the game
  const startGame = () => {
    if (transitionSoundRef.current) {
      transitionSoundRef.current.play().catch(() => {});
    }
    
    setGameState('playing');
    setLives(3);
    setScore(0);
    setTimeLeft(30);
    setStars([]);
    setMeteors([]);
    setStarInterval(1000);
  };

  // End the game
  const endGame = () => {
    if (transitionSoundRef.current) {
      transitionSoundRef.current.play().catch(() => {});
    }
    
    // Stop background music
    if (backgroundMusicRef.current) {
      backgroundMusicRef.current.pause();
      backgroundMusicRef.current.currentTime = 0;
    }
    
    setGameState('end');
  };

  // Handle star catch
  const handleStarClick = (starId) => {
    // Play star sound
    if (starSoundRef.current) {
      const sound = starSoundRef.current.cloneNode();
      sound.volume = 0.5;
      sound.play().catch(() => {});
    }
    
    // Update score and remove the star
    setScore(prev => prev + 10);
    setStars(prev => prev.filter(star => star.id !== starId));
  };

  // Handle meteor click
  const handleMeteorClick = (meteorId) => {
    // Remove life and the meteor
    setLives(prev => {
      const newLives = prev - 1;
      if (newLives <= 0) {
        setTimeout(endGame, 500); // Short delay to show the life lost
      }
      return newLives;
    });
    
    setMeteors(prev => prev.filter(meteor => meteor.id !== meteorId));
    
    // Visual feedback for hitting a meteor
    // Screen shake is handled via CSS class
    document.body.classList.add('shake');
    setTimeout(() => {
      document.body.classList.remove('shake');
    }, 300);
  };
  
  // Opening screen
  const renderOpeningScreen = () => (
    <div className="flex flex-col items-center justify-center h-full p-4 relative">
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <div 
            key={i}
            className="absolute bg-white rounded-full animate-twinkle"
            style={{
              width: 2 + Math.random() * 4 + 'px',
              height: 2 + Math.random() * 4 + 'px',
              top: Math.random() * 100 + '%',
              left: Math.random() * 100 + '%',
              animationDelay: Math.random() * 5 + 's',
              animationDuration: 3 + Math.random() * 7 + 's'
            }}
          />
        ))}
      </div>
      
      <div className="text-4xl md:text-6xl font-bold mb-8 text-white text-center">
        לתפוס כוכב
      </div>
      
      <button 
  className="bg-transparent border-none focus:outline-none transition duration-300 transform hover:scale-110 mb-8"
  onClick={startGame}
>
  <div className="relative">
    <svg width="120" height="120" viewBox="0 0 120 120" className="transform-origin-center">
      <polygon
        points="60,10 74,45 112,45 82,69 94,105 60,85 26,105 38,69 8,45 46,45"
        fill="#FFD700"
        stroke="#FFF"
        strokeWidth="1"
        className="animate-pulse"
      />
    </svg>
    <div className="absolute inset-0 flex items-center justify-center text-blue-900 font-bold text-xl">
      שחק
    </div>
  </div>
</button>
    </div>
  );

  // Game screen
  const renderGameScreen = () => (
  <div className="h-full w-full relative" ref={gameAreaRef}>
      {/* Top bar */}
      <div className="flex justify-between items-center p-2 bg-blue-900 bg-opacity-60">
        {/* Lives */}
        <div className="flex">
          {[...Array(lives)].map((_, i) => (
            <svg key={i} width="24" height="24" viewBox="0 0 24 24" className="text-red-500 mx-1">
              <path 
                fill="currentColor" 
                d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" 
              />
            </svg>
          ))}
        </div>
        
        {/* Score */}
        <div className="text-white font-bold text-lg">
          Score: {score}
        </div>
        
        {/* Timer */}
        <div className={`text-lg font-bold px-2 py-1 rounded ${timeLeft <= 10 ? 'text-red-500 animate-flash bg-white bg-opacity-20' : 'text-white'}`}>
          {timeLeft}s
        </div>
      </div>
      {/* Game area */}
      <div className="absolute inset-0 pt-10 overflow-hidden">
        {/* Stars */}
        {stars.map(star => (
          <div
            key={star.id}
            className="absolute cursor-pointer transform hover:scale-110 transition-transform"
            style={{
              left: star.posX + 'px',
              top: star.posY + 'px',
              width: star.size + 'px',
              height: star.size + 'px',
            }}
            onClick={() => handleStarClick(star.id)}
          >
            <svg viewBox="0 0 100 100">
              <polygon
                points="50,5 63,38 98,38 70,60 80,95 50,75 20,95 30,60 2,38 37,38"
                fill="#FFD700"
                stroke="#FFF"
                strokeWidth="1"
              />
            </svg>
          </div>
        ))}
        
        {/* Meteors */}
        {meteors.map(meteor => (
          <div
            key={meteor.id}
            className="absolute cursor-pointer"
            style={{
              left: meteor.posX + 'px',
              top: meteor.posY + 'px',
              width: meteor.size + 'px',
              height: meteor.size + 'px',
            }}
            onClick={() => handleMeteorClick(meteor.id)}
          >
            <svg viewBox="0 0 100 100">
              <defs>
                <radialGradient id="meteorGradient" cx="30%" cy="30%" r="70%" fx="30%" fy="30%">
                  <stop offset="0%" stopColor="#ff6b35" />
                  <stop offset="100%" stopColor="#6e4555" />
                </radialGradient>
              </defs>
              <path
                d="M50,10 Q70,20 80,40 Q90,65 75,80 Q55,95 40,90 Q20,80 15,60 Q15,35 30,20 Q40,10 50,10 Z"
                fill="url(#meteorGradient)"
                stroke="#333"
                strokeWidth="2"
              />
              <path
                d="M30,90 Q20,100 10,105 L10,115 Q25,110 35,95 Z"
                fill="#ff6b35"
                opacity="0.7"
              />
            </svg>
          </div>
        ))}
        
{/* Clouds at bottom */}
<div className="absolute bottom-0 left-0 right-0 h-24 overflow-visible">
<svg width="100%" height="100%" viewBox="0 0 1000 100" preserveAspectRatio="xMidYMax slice">
  <path 
    d="M0,25 Q40,5 80,20 T160,15 T240,25 T320,10 T400,20 T480,5 T560,15 T640,20 T720,10 T800,25 T880,15 T960,5 L1000,100 L0,100 Z" 
    fill="#8A92B2" 
    fillOpacity="0.3" 
  />
  <path 
    d="M0,40 Q60,25 120,35 T240,30 T360,40 T480,25 T600,35 T720,30 T840,40 T960,25 L1000,100 L0,100 Z" 
    fill="#8A92B2" 
    fillOpacity="0.4" 
  />
</svg>
</div>
      </div>
    </div>
  );

  // End screen
  const renderEndScreen = () => (
    <div className="flex flex-col items-center justify-center h-full p-4 relative">
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(30)].map((_, i) => (
          <div 
            key={i}
            className="absolute bg-white rounded-full animate-twinkle"
            style={{
              width: 2 + Math.random() * 4 + 'px',
              height: 2 + Math.random() * 4 + 'px',
              top: Math.random() * 100 + '%',
              left: Math.random() * 100 + '%',
              animationDelay: Math.random() * 5 + 's',
              animationDuration: 3 + Math.random() * 7 + 's'
            }}
          />
        ))}
      </div>
      
      <div className="text-4xl md:text-5xl font-bold mb-6 text-white text-center">
        אתם הכוכבים שלנו!
      </div>
      
      <div className="text-2xl md:text-3xl font-bold mb-8 text-yellow-300">
        ניקוד סופי: {score}
      </div>
      
      <div className="flex space-x-4 mb-8">
        <button 
          className="bg-yellow-400 hover:bg-yellow-300 text-blue-900 font-bold py-3 px-6 rounded-full transition duration-300 transform hover:scale-105"
          onClick={startGame}
        >
          לשחק שוב
        </button>
        
        <button 
          className="bg-blue-500 hover:bg-blue-400 text-white font-bold py-3 px-6 rounded-full transition duration-300 transform hover:scale-105"
          onClick={() => {
            // Share functionality would go here
            alert('Sharing score: ' + score);
          }}
        >
          Share
        </button>
      </div>
      
      <div className="text-white text-center mt-8 opacity-70 text-sm">
        <h3 className="text-lg mb-2">Credits</h3>
        <p>Game Design: Your Team</p>
        <p>Development: Your Developers</p>
        <p>Artwork: Your Artists</p>
      </div>
    </div>
  );
  
  // Main render based on game state
  return (
    <div className="h-screen w-full bg-gradient-to-b from-indigo-900 to-purple-900 overflow-hidden font-sans">
      <div className="h-full w-full relative">
        {gameState === 'opening' && renderOpeningScreen()}
        {gameState === 'playing' && renderGameScreen()}
        {gameState === 'end' && renderEndScreen()}
      </div>
    </div>
  );
};

export default CatchTheStarsGame;