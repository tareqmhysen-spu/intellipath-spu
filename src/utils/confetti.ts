import confetti from 'canvas-confetti';

interface ConfettiOptions {
  particleCount?: number;
  spread?: number;
  origin?: { x: number; y: number };
  colors?: string[];
}

// Basic celebration confetti
export const celebrateSuccess = (options?: ConfettiOptions) => {
  const defaults: ConfettiOptions = {
    particleCount: 100,
    spread: 70,
    origin: { x: 0.5, y: 0.6 },
    colors: ['#1E3A8A', '#14B8A6', '#F59E0B', '#22C55E', '#8B5CF6']
  };

  confetti({
    ...defaults,
    ...options
  });
};

// Achievement unlocked celebration
export const celebrateAchievement = () => {
  const duration = 3000;
  const animationEnd = Date.now() + duration;
  const colors = ['#1E3A8A', '#14B8A6', '#F59E0B', '#22C55E'];

  const randomInRange = (min: number, max: number) => {
    return Math.random() * (max - min) + min;
  };

  const interval: ReturnType<typeof setInterval> = setInterval(() => {
    const timeLeft = animationEnd - Date.now();

    if (timeLeft <= 0) {
      return clearInterval(interval);
    }

    const particleCount = 50 * (timeLeft / duration);

    // Left side
    confetti({
      particleCount: Math.floor(particleCount / 2),
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.8 },
      colors
    });

    // Right side
    confetti({
      particleCount: Math.floor(particleCount / 2),
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.8 },
      colors
    });
  }, 250);
};

// Stars celebration for special achievements
export const celebrateStars = () => {
  const defaults = {
    spread: 360,
    ticks: 100,
    gravity: 0,
    decay: 0.94,
    startVelocity: 30,
    shapes: ['star'] as const,
    colors: ['#FFD700', '#FFA500', '#FF6347']
  };

  const shoot = () => {
    confetti({
      ...defaults,
      particleCount: 40,
      scalar: 1.2,
      shapes: ['star']
    });

    confetti({
      ...defaults,
      particleCount: 10,
      scalar: 0.75,
      shapes: ['circle']
    });
  };

  setTimeout(shoot, 0);
  setTimeout(shoot, 100);
  setTimeout(shoot, 200);
};

// Fireworks for major milestones
export const celebrateFireworks = () => {
  const duration = 5000;
  const animationEnd = Date.now() + duration;
  const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

  const randomInRange = (min: number, max: number) => {
    return Math.random() * (max - min) + min;
  };

  const interval = setInterval(() => {
    const timeLeft = animationEnd - Date.now();

    if (timeLeft <= 0) {
      return clearInterval(interval);
    }

    const particleCount = 50 * (timeLeft / duration);

    confetti({
      ...defaults,
      particleCount,
      origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
      colors: ['#1E3A8A', '#14B8A6', '#8B5CF6']
    });
    confetti({
      ...defaults,
      particleCount,
      origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
      colors: ['#F59E0B', '#22C55E', '#EC4899']
    });
  }, 250);
};

// Level up celebration
export const celebrateLevelUp = () => {
  const count = 200;
  const defaults = {
    origin: { y: 0.7 }
  };

  const fire = (particleRatio: number, opts: confetti.Options) => {
    confetti({
      ...defaults,
      ...opts,
      particleCount: Math.floor(count * particleRatio)
    });
  };

  fire(0.25, {
    spread: 26,
    startVelocity: 55,
    colors: ['#1E3A8A']
  });
  fire(0.2, {
    spread: 60,
    colors: ['#14B8A6']
  });
  fire(0.35, {
    spread: 100,
    decay: 0.91,
    scalar: 0.8,
    colors: ['#F59E0B', '#22C55E']
  });
  fire(0.1, {
    spread: 120,
    startVelocity: 25,
    decay: 0.92,
    scalar: 1.2,
    colors: ['#8B5CF6', '#EC4899']
  });
  fire(0.1, {
    spread: 120,
    startVelocity: 45,
    colors: ['#1E3A8A', '#14B8A6']
  });
};
