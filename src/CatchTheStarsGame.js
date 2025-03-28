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
  const [currentCredit, setCurrentCredit] = useState(0);

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
// Auto advance carousel when game ends
useEffect(() => {
  if (gameState !== 'end') return;
  
  const interval = setInterval(() => {
    setCurrentCredit((prev) => (prev === 12 ? 0 : prev + 1)); // 10 זה מספר הקרדיטים פחות 1
  }, 3000); // Change every 3 seconds
  
  return () => clearInterval(interval);
}, [gameState]);

  // Star generation
  useEffect(() => {
    if (gameState !== 'playing') return;

    const createStar = () => {
      const id = Date.now().toString() + Math.random().toString();
      const size = 50; // Consistent star size
      const posX = Math.random() * (gameDimensions.width - size);
      const posY = 50 + Math.random() * (gameDimensions.height * 0.7 -50 ); // Keep stars in upper 70% of screen

      const newStar = { id, posX, posY, size, createdAt: Date.now(), exploding: false };
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

  // alien generation (starts after 5 seconds)
  // חייזרים במקום מטאורים (שינוי לוגיקת היצירה והופעה)
useEffect(() => {
  if (gameState !== 'playing') return;

  let alienTimer;
  
  // התחל ליצור חייזרים אחרי 5 שניות
  const initialDelay = setTimeout(() => {
    const createAlien = () => {
      if (gameState !== 'playing') return;
      
      const id = 'a' + Date.now().toString() + Math.random().toString();
      const size = 50; // אותו גודל כמו כוכבים
      const posX = Math.random() * (gameDimensions.width - size);
      const posY = 50 + Math.random() * (gameDimensions.height * 0.7 - 50); // 10px מתחת לבר העליון
      const newAlien = { id, posX, posY, size, createdAt: Date.now() };
      setMeteors(prev => [...prev, newAlien]);
      
      // השמע צליל של מטאור/חייזר
      if (meteorSoundRef.current) {
        const sound = meteorSoundRef.current.cloneNode();
        sound.volume = 0.3;
        sound.play().catch(() => {});
      }
      
      // הסר את החייזר אחרי 1.5-3 שניות אם לא לחצו עליו
      const lifespan = 1500 + Math.random() * 1500;
      setTimeout(() => {
        setMeteors(prev => prev.filter(alien => alien.id !== id));
      }, lifespan);
    };

    // צור חייזרים במרווחי זמן קבועים
    alienTimer = setInterval(createAlien, 2000);
  }, 4000);

  return () => {
    clearTimeout(initialDelay);
    clearInterval(alienTimer);
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
    setTimeLeft(25);
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
// Handle share button click
  const handleShare = () => {
  if (navigator.share) {
    // Web Share API - עובד בדפדפנים מודרניים ובמובייל
    navigator.share({
      title: 'תוצאה במשחק לתפוס כוכב',
      text: `הצלחתי לתפוס ${score} כוכבים במשחק!`,
      url: window.location.href
    })
    .catch(error => console.log('Error sharing:', error));
  } else {
    // פתרון חלופי למקרה שה-API לא נתמך
    alert(`הניקוד שלך: ${score}! שתף זאת עם חברים!`);
  }
};
  // Handle star catch
// החלף את הפונקציה עם הגרסה הזו
const handleStarClick = (starId) => {
  // Play star sound
  if (starSoundRef.current) {
    const sound = starSoundRef.current.cloneNode();
    sound.volume = 0.5;
    sound.play().catch(() => {});
  }
  
  // סימון הכוכב כ"מתפוצץ" במקום למחוק אותו מיד
  setStars(prev => prev.map(star => 
    star.id === starId ? {...star, exploding: true} : star
  ));
  
  // מחיקת הכוכב אחרי אנימציית הפיצוץ
  setTimeout(() => {
    setStars(prev => prev.filter(star => star.id !== starId));
    setScore(prev => prev + 10);
  }, 300); // משך זמן האנימציה במילישניות
};

  // Handle meteor click
  // טיפול בלחיצה על חייזר
const handleAlienClick = (alienId) => {
  // הסר חיים ואת החייזר
  setLives(prev => {
    const newLives = prev - 1;
    if (newLives <= 0) {
      setTimeout(endGame, 500); // השהייה קצרה כדי להראות את אובדן החיים
    }
    return newLives;
  });
  
  setMeteors(prev => prev.filter(alien => alien.id !== alienId));
  
  // משוב ויזואלי לפגיעה בחייזר
  document.body.classList.add('shake');
  setTimeout(() => {
    document.body.classList.remove('shake');
  }, 300);
};
  
  // Opening screen
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
    
    {/* הוספת הלוגו כאן */}
    <div className="mb-6">
      <img 
        src="/images/logo.png" 
        alt="Logo" 
        className="w-48 h-auto" 
      />
    </div>
    
    <div className="text-4xl md:text-6xl font-bold mb-8 text-white text-center">
      לתפוס כוכב
    </div>
    
    <button 
      className="bg-transparent border-none focus:outline-none transition duration-300 transform hover:scale-110 mb-8 group"
      onClick={startGame}
    >
      <div className="relative">
        <img 
          src="/images/star.png" 
          alt="Star" 
          width="120" 
          height="120" 
          className="animate-pulse group-hover:animate-none"
        />
        <div className="absolute inset-0 flex items-center justify-center text-blue-900 font-bold text-xl">
          שחק
        </div>
      </div>
    </button>

    <div className="text-white text-xl text-center max-w-md mb-10">
      יש לכם 30 שניות לתפוס כמה שיותר כוכבים.
      <br />
      היזהרו מהחייזרים!
    </div>
  </div>
);

  // Game screen
  const renderGameScreen = () => (
  <div className="h-full w-full relative" ref={gameAreaRef}>
      {/* Top bar */}
      {/* Top bar */}
<div className="flex justify-between items-center p-2" style={{ backgroundColor: '#58b2b0' }}>
  {/* Lives */}
  <div className="flex">
    {[...Array(lives)].map((_, i) => (
      <svg key={i} width="24" height="24" viewBox="0 0 24 24" className="mx-1" style={{ color: "#c2185b" }}>
        <path 
          fill="currentColor" 
          d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" 
        />
      </svg>
    ))}
  </div>
  
  {/* Score */}
  <div className="text-gray-800 font-bold text-lg">
    ניקוד: {score}
  </div>
  
  {/* Timer */}
  <div className={`text-lg font-bold px-2 py-1 rounded ${timeLeft <= 10 ? 'text-red-500 animate-flash bg-white bg-opacity-20' : 'text-gray-800'}`}>
    {timeLeft}s
  </div>
</div>
      {/* Game area */}
      <div className="absolute inset-0 pt-10 overflow-hidden">
        {/* Stars */}
       {/* Stars */}
{/* Stars */}
{stars.map(star => (
  <div
    key={star.id}
    className={`absolute cursor-pointer transition-all duration-300 ${star.exploding ? 'scale-150 opacity-0' : 'transform hover:scale-110'}`}
    style={{
      left: star.posX + 'px',
      top: star.posY + 'px',
      width: star.size + 'px',
      height: star.size + 'px',
    }}
    onClick={() => !star.exploding && handleStarClick(star.id)}
  >
    <img 
      src="/images/star.png" 
      alt="Star" 
      className={`w-full h-full ${star.exploding ? "animate-ping" : ""}`}
      style={{
        filter: star.exploding ? "brightness(1.5)" : "none"
      }}
    />
  </div>
))}
        
        {/* Meteors */}
        {/* חייזרים (במקום מטאורים) */}
{meteors.map(alien => (
  <div
    key={alien.id}
    className="absolute cursor-pointer transform hover:scale-110 transition-transform"
    style={{
      left: alien.posX + 'px',
      top: alien.posY + 'px',
      width: alien.size + 'px',
      height: alien.size + 'px',
    }}
    onClick={() => handleAlienClick(alien.id)}
  >
    <img 
      src="/images/alien.png" 
      alt="Alien" 
      className="w-full h-full"
    />
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
 // End screen
const renderEndScreen = () => {
  const credits = [
    { name: "ליאור בראשי", desc: "הכוכב שבאה להאיר את הדרך" },
    { name: "אלון שורץ", desc: "כוכב הצפון" },
    { name: "אורי צ'יבוטרו", desc: "הכוכב שתמיד אפשר למצוא בשמיים" },
    { name: "אלעד בזילובסקי", desc: "הכוכב שתמיד מעניק תקווה" },
    { name: "רווית, תמר ולאל", desc: "הכוכבות שעוזרות לנו לנווט בסופה הקוסמית" },
    { name: "טליה עזרן", desc: "כוכב הבוקר המעניקה בהירות ואופטימיות" },
    { name: "עינת בר-עם שנבל", desc: "סופר נובה של יצירתיות" },
    { name: "יאיר גולדברג", desc: "הכוכב שזוהר גם בשמי היום וגם בשמי הלילה" },
    { name: "שלי, הילה, טל, עדי, ענבל ומאדי", desc: "הסטודיו הנוצץ ביותר בגלקסיה"},
    { name: "יקיר אבוטבול", desc: "כוכב הערב המעניק סיכום מושלם לכל יום מאתגר" },
    { name: "עמית פשה", desc: "כוכב שביט המשאיר חותם בכל מקום" },
    { name: "ידידיה, אופיר ומיכל", desc: "אבק הכוכבים שכדאי לפזר בכל פרויקט" },
    { name: "טלי אינדה ואחינועם", desc: "הקונסטלציה של המזלות שיוצרות את החיבור בין הכוכבים"},
  ];

  // Handle carousel navigation
  const nextCredit = () => {
    setCurrentCredit((prev) => (prev === credits.length - 1 ? 0 : prev + 1));
  };

  const prevCredit = () => {
    setCurrentCredit((prev) => (prev === 0 ? credits.length - 1 : prev - 1));
  };

  return (
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
      
      {/* לוגו */}
      <div className="mb-4">
        <img 
          src="/images/logo.png" 
          alt="Logo" 
          className="w-48 h-auto" 
        />
      </div>
      
      {/* כותרת */}
      <div className="text-4xl md:text-5xl font-bold mb-6 text-white text-center">
        אתם קבוצת הכוכבים שלנו!
      </div>
      
      {/* קרוסלת קרדיטים */}
      <div className="w-full max-w-md relative mb-8">
        <div className="text-center p-6 rounded-lg min-h-48 flex flex-col items-center justify-center"
          style={{ 
            background: "radial-gradient(circle, rgba(25,113,255,0.3) 0%, rgba(10,20,90,0.1) 100%)",
          }}
        >
          <div className="credit-item">
            <div className="flex items-center justify-center mb-3">
              <img src="/images/star.png" alt="Star" className="w-8 h-8 ml-3 animate-pulse" />
              <span className="text-yellow-300 font-bold text-2xl">{credits[currentCredit].name}</span>
            </div>
            <p className="text-blue-200 italic text-lg">{credits[currentCredit].desc}</p>
          </div>
          
          {/* כפתורי ניווט */}
          <div className="flex justify-between w-full absolute top-1/2 transform -translate-y-1/2">
            <button 
              onClick={prevCredit} 
              className="bg-blue-900 bg-opacity-50 rounded-full p-2 text-white hover:bg-opacity-70 focus:outline-none transform -translate-x-4"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d= "M9 5l7 7-7 7" />
              </svg>
            </button>
            <button 
              onClick={nextCredit} 
              className="bg-blue-900 bg-opacity-50 rounded-full p-2 text-white hover:bg-opacity-70 focus:outline-none transform translate-x-4"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          </div>
          
          {/* אינדיקטור */}
          <div className="flex justify-center mt-4 space-x-1">
            {credits.map((_, index) => (
              <div 
                key={index} 
                className={`h-2 w-2 rounded-full ${index === currentCredit ? 'bg-yellow-300' : 'bg-blue-200 bg-opacity-40'}`}
              />
            ))}
          </div>
        </div>
      </div>
      
      {/* ניקוד וכפתורים */}
      <div className="text-2xl md:text-3xl font-bold mb-6 text-yellow-300">
        ניקוד סופי: {score}
      </div>
      
     <div className="flex space-x-12">
  <button 
    className="bg-yellow-400 hover:bg-yellow-300 text-blue-900 font-bold p-4 rounded-full transition duration-300 transform hover:scale-105 flex items-center justify-center mx-6"
    onClick={startGame}
    aria-label="לשחק שוב"
  >
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  </button>
  
  <button 
    className="bg-blue-500 hover:bg-blue-400 text-white font-bold p-4 rounded-full transition duration-300 transform hover:scale-105 flex items-center justify-center mx-6"
    onClick={handleShare}
    aria-label="Share"
  >
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
    </svg>
  </button>
</div>
    </div>
  );
};
  // Main render based on game state
  return (
  <div 
  className="h-screen w-full overflow-hidden font-rubik" 
  style={{ 
    fontFamily: "'Rubik', sans-serif",
    background: "linear-gradient(180deg, rgba(50,7,82,1) 0%, rgba(81,28,134,1) 75%, rgba(91,33,151,1) 100%)" 
  }}
>
      <div className="h-full w-full relative">
        {gameState === 'opening' && renderOpeningScreen()}
        {gameState === 'playing' && renderGameScreen()}
        {gameState === 'end' && renderEndScreen()}
      </div>
    </div>
  );
};

export default CatchTheStarsGame;
