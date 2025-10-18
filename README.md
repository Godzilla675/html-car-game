# 3D Racing Game

A fully-featured 3D racing game built with HTML, CSS, JavaScript, and Three.js.

## Features

### ✅ Player Car Controls
- **Acceleration**: W or Arrow Up
- **Deceleration/Reverse**: S or Arrow Down
- **Turn Left**: A or Arrow Left
- **Turn Right**: D or Arrow Right

### ✅ Racing Track
- Oval looping course with realistic physics
- Visible track boundaries with color-coded walls:
  - Red outer walls
  - Blue inner walls
- Collision detection keeps cars on track

### ✅ AI Opponents
- 4 AI-controlled cars racing autonomously
- Different colored cars (Blue, Green, Yellow, Magenta)
- Varying speeds for competitive gameplay
- Independent lap tracking for each AI car

### ✅ Gameplay Features
- **Countdown Start**: "3, 2, 1, Go!" countdown before race begins
- **Collision Detection**: 
  - Car-to-wall collisions (reduces speed and pushes car back)
  - Car-to-car collisions (reduces both cars' speeds)
- **Lap System**: Complete 3 laps to win
- **Race Finish**: First to complete 3 laps wins (Player or AI)

### ✅ UI Elements
- **Speed Indicator**: Real-time display of current speed in km/h
- **Lap Counter**: Shows current lap out of 3 total laps
- **Race Result**: Displays winner when race completes

## How to Play

1. Open `index.html` in a modern web browser
2. Wait for the countdown to complete (3, 2, 1, Go!)
3. Use WASD or Arrow Keys to control your red car
4. Complete 3 laps before the AI opponents to win!

## Technical Details

- **Graphics Engine**: Three.js (WebGL-based 3D rendering)
- **Physics**: Custom collision detection and movement system
- **Track Design**: Procedurally generated oval with variable radius
- **Camera**: Dynamic third-person camera that follows the player

## Installation

### Option 1: Direct Play
Simply open `index.html` in a web browser that supports WebGL.

### Option 2: Local Server (Recommended)
```bash
# Install dependencies
npm install

# Start a local server (Python example)
python3 -m http.server 8000

# Open browser to http://localhost:8000
```

## Requirements

- Modern web browser with WebGL support
- JavaScript enabled
- Three.js library (included via npm package)

## Controls Reference

| Key | Action |
|-----|--------|
| W / ↑ | Accelerate |
| S / ↓ | Brake/Reverse |
| A / ← | Turn Left |
| D / → | Turn Right |

## Game Mechanics

- **Maximum Speed**: 200 km/h
- **Natural Deceleration**: Cars slow down when not accelerating
- **Collision Penalty**: Hitting walls or other cars reduces speed by 30-50%
- **Win Condition**: First to complete 3 laps

## Screenshots

See the game in action in the pull request description!

## License

ISC