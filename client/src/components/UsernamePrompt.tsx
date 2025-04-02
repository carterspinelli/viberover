
import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from './ui/card';

interface UsernamePromptProps {
  onSubmit: (username: string) => void;
}

export default function UsernamePrompt({ onSubmit }: UsernamePromptProps) {
  const [username, setUsername] = useState('');
  const [animate, setAnimate] = useState(false);
  
  // Add animation effect on load
  useEffect(() => {
    setAnimate(true);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim()) {
      onSubmit(username.trim());
    }
  };

  // Pre-calculate dust particles to avoid runtime randomization
  const dustParticles = Array.from({ length: 50 }).map((_, i) => ({
    width: Math.random() * 4 + 1,
    height: Math.random() * 4 + 1,
    left: Math.random() * 100,
    top: Math.random() * 100,
    animationDuration: Math.random() * 20 + 10,
    opacity: Math.random() * 0.5,
  }));

  return (
    <div 
      className="fixed inset-0 flex items-center justify-center overflow-hidden"
      style={{
        background: 'linear-gradient(to bottom, #110000, #330000, #660000)',
        backgroundImage: `radial-gradient(circle at center, rgba(120, 30, 0, 0.6), rgba(30, 0, 0, 0.9))`,
        backgroundBlendMode: 'overlay',
      }}
    >
      {/* Dust particles */}
      <div className="absolute inset-0 pointer-events-none">
        {dustParticles.map((particle, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-amber-500/30"
            style={{
              width: particle.width + 'px',
              height: particle.height + 'px',
              left: particle.left + '%',
              top: particle.top + '%',
              animation: `float ${particle.animationDuration}s linear infinite`,
              opacity: particle.opacity,
            }}
          />
        ))}
      </div>
      
      {/* Mars in background */}
      <div 
        className="absolute opacity-40 rounded-full bg-gradient-to-br from-red-900 to-red-600"
        style={{ 
          width: '20vw',
          height: '20vw',
          right: '8vw',
          top: '15vh',
          boxShadow: '0 0 100px rgba(255, 50, 0, 0.5)',
          backgroundImage: `url('/textures/sand.jpg')`,
          backgroundSize: 'cover',
          backgroundBlendMode: 'soft-light',
        }}
      />
      
      <Card 
        className={`w-full max-w-md mx-4 bg-opacity-80 backdrop-blur-md bg-black border-red-800 text-white transform transition-all duration-1000 ease-out ${animate ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'}`}
        style={{
          boxShadow: '0 0 30px rgba(200, 30, 0, 0.3)',
          background: 'rgba(20, 0, 0, 0.7)',
        }}
      >
        <CardHeader className="border-b border-red-900/30 pb-6">
          <CardTitle className="text-amber-500 flex items-center justify-center text-2xl">
            <svg 
              className="w-8 h-8 mr-2 text-orange-500" 
              fill="currentColor" 
              viewBox="0 0 24 24" 
              stroke="none"
            >
              <circle cx="12" cy="12" r="10" />
              <path 
                fill="rgba(0,0,0,0.3)" 
                d="M8,6 Q12,14 10,18 Q18,10 8,6"
              />
            </svg>
            VIBEROVER
          </CardTitle>
          <CardDescription className="text-center text-amber-200/70 mt-2">
            Enter your pilot name to begin your Vibeverse journey
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="relative">
              <Input
                type="text"
                placeholder="Pilot name"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoFocus
                className="bg-red-950/50 border-red-900/50 text-amber-100 placeholder:text-amber-200/30 h-12 pl-4"
              />
              <div className="absolute left-2 top-3 text-amber-500 opacity-70">
                {/* Astronaut icon */}
                {username.length === 0 && (
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2a8 8 0 0 0-8 8v1h16v-1a8 8 0 0 0-8-8z" />
                    <path d="M12 8a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" />
                    <path d="M12 9v5" />
                    <path d="M9 17v-1a3 3 0 0 1 6 0v1" />
                  </svg>
                )}
              </div>
            </div>
            <Button 
              type="submit" 
              className="w-full h-12 font-bold tracking-wider transition-all bg-gradient-to-r from-red-700 to-amber-600 hover:from-red-600 hover:to-amber-500 border-none" 
              disabled={!username.trim()}
            >
              BEGIN VIBEVERSE JOURNEY
            </Button>
          </form>
        </CardContent>
        <CardFooter className="text-xs text-center justify-center text-amber-200/50 pt-0 pb-4">
          VIBEROVER Mission Control · Established 2025
        </CardFooter>
      </Card>
      
      {/* Animation styles moved to global CSS */}
    </div>
  );
}
