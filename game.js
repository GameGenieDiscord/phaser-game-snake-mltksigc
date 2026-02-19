// Snake Game - Phaser.js

class MainScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MainScene' });
    }

    preload() {
        // Create simple textures programmatically
        const graphics = this.make.graphics({ x: 0, y: 0, add: false });
        
        // Snake segment
        graphics.fillStyle(0x00ff00);
        graphics.fillRect(0, 0, 20, 20);
        graphics.generateTexture('snake', 20, 20);
        
        // Food
        graphics.clear();
        graphics.fillStyle(0xff0000);
        graphics.fillCircle(10, 10, 10);
        graphics.generateTexture('food', 20, 20);
        
        // Powerup (star shape)
        graphics.clear();
        graphics.fillStyle(0xffff00);
        // Draw a star using polygon
        const star = new Phaser.Geom.Polygon([
            10, 0,
            12, 6,
            18, 6,
            13, 10,
            15, 16,
            10, 12,
            5, 16,
            7, 10,
            2, 6,
            8, 6
        ]);
        graphics.fillPoints(star.points);
        graphics.generateTexture('powerup', 20, 20);
        
        // Obstacle
        graphics.clear();
        graphics.fillStyle(0x666666);
        graphics.fillRect(0, 0, 40, 40);
        graphics.generateTexture('obstacle', 40, 40);
    }

    create() {
        // World bounds as obstacles
        this.physics.world.setBounds(0, 0, 800, 600, true, true, true, true);
        
        // Game variables
        this.gridSize = 20;
        this.snake = [];
        this.direction = { x: 1, y: 0 };
        this.nextDirection = { x: 1, y: 0 };
        this.speed = 150; // ms per move
        this.lastMove = 0;
        this.score = 0;
        this.powerupActive = false;
        this.powerupTimer = 0;
        
        // Create initial snake
        for (let i = 0; i < 3; i++) {
            const segment = this.physics.add.sprite(300 - i * this.gridSize, 300, 'snake');
            segment.setCollideWorldBounds(true);
            segment.body.onWorldBounds = true;
            this.snake.push(segment);
        }
        
        // Food
        this.food = this.physics.add.sprite(0, 0, 'food');
        this.placeFood();
        
        // Powerup
        this.powerup = this.physics.add.sprite(0, 0, 'powerup');
        this.placePowerup();
        
        // Obstacles
        this.obstacles = this.physics.add.group();
        this.createObstacles();
        
        // Collisions
        this.physics.add.overlap(this.snake[0], this.food, this.eatFood, null, this);
        this.physics.add.overlap(this.snake[0], this.powerup, this.collectPowerup, null, this);
        this.physics.add.overlap(this.snake[0], this.obstacles, this.hitObstacle, null, this);
        
        // World bounds collision
        this.physics.world.on('worldbounds', (body) => {
            if (body.gameObject === this.snake[0]) {
                this.gameOver();
            }
        });
        
        // Controls
        this.cursors = this.input.keyboard.createCursorKeys();
        
        // Score text
        this.scoreText = this.add.text(16, 16, 'Score: 0', {
            fontSize: '24px',
            fill: '#ffffff',
            fontFamily: 'Arial'
        });
        
        // Powerup text
        this.powerupText = this.add.text(16, 50, '', {
            fontSize: '18px',
            fill: '#ffff00',
            fontFamily: 'Arial'
        });
    }

    update(time) {
        // Handle input
        if (this.cursors.left.isDown && this.direction.x === 0) {
            this.nextDirection = { x: -1, y: 0 };
        } else if (this.cursors.right.isDown && this.direction.x === 0) {
            this.nextDirection = { x: 1, y: 0 };
        } else if (this.cursors.up.isDown && this.direction.y === 0) {
            this.nextDirection = { x: 0, y: -1 };
        } else if (this.cursors.down.isDown && this.direction.y === 0) {
            this.nextDirection = { x: 0, y: 1 };
        }
        
        // Move snake based on speed
        if (time - this.lastMove > this.speed) {
            this.moveSnake();
            this.lastMove = time;
        }
        
        // Update powerup timer
        if (this.powerupActive) {
            this.powerupTimer -= 16;
            this.powerupText.setText(`Powerup: ${Math.ceil(this.powerupTimer / 1000)}s`);
            if (this.powerupTimer <= 0) {
                this.powerupActive = false;
                this.speed = 150;
                this.powerupText.setText('');
            }
        }
    }

    moveSnake() {
        this.direction = { ...this.nextDirection };
        
        const head = this.snake[0];
        const newX = head.x + this.direction.x * this.gridSize;
        const newY = head.y + this.direction.y * this.gridSize;
        
        // Check self collision
        for (let segment of this.snake) {
            if (newX === segment.x && newY === segment.y) {
                this.gameOver();
                return;
            }
        }
        
        // Move body
        for (let i = this.snake.length - 1; i > 0; i--) {
            this.snake[i].x = this.snake[i - 1].x;
            this.snake[i].y = this.snake[i - 1].y;
        }
        
        // Move head
        head.x = newX;
        head.y = newY;
    }

    placeFood() {
        let valid = false;
        let x, y;
        
        while (!valid) {
            x = Phaser.Math.Between(1, 39) * this.gridSize;
            y = Phaser.Math.Between(1, 29) * this.gridSize;
            
            valid = true;
            // Check collision with snake
            for (let segment of this.snake) {
                if (x === segment.x && y === segment.y) {
                    valid = false;
                    break;
                }
            }
            // Check collision with obstacles
            if (valid && this.obstacles.children && this.obstacles.children.entries) {
                for (let obstacle of this.obstacles.children.entries) {
                    if (x < obstacle.x + obstacle.width &&
                        x + this.gridSize > obstacle.x &&
                        y < obstacle.y + obstacle.height &&
                        y + this.gridSize > obstacle.y) {
                        valid = false;
                        break;
                    }
                }
            }
        }
        
        this.food.setPosition(x, y);
    }

    placePowerup() {
        let valid = false;
        let x, y;
        
        while (!valid) {
            x = Phaser.Math.Between(1, 39) * this.gridSize;
            y = Phaser.Math.Between(1, 29) * this.gridSize;
            
            valid = true;
            // Check collision with snake
            for (let segment of this.snake) {
                if (x === segment.x && y === segment.y) {
                    valid = false;
                    break;
                }
            }
            // Check collision with food
            if (valid && x === this.food.x && y === this.food.y) {
                valid = false;
            }
            // Check collision with obstacles
            if (valid && this.obstacles.children && this.obstacles.children.entries) {
                for (let obstacle of this.obstacles.children.entries) {
                    if (x < obstacle.x + obstacle.width &&
                        x + this.gridSize > obstacle.x &&
                        y < obstacle.y + obstacle.height &&
                        y + this.gridSize > obstacle.y) {
                        valid = false;
                        break;
                    }
                }
            }
        }
        
        this.powerup.setPosition(x, y);
    }

    createObstacles() {
        // Create some static obstacles
        const obstaclePositions = [
            { x: 200, y: 150 },
            { x: 600, y: 150 },
            { x: 400, y: 450 },
            { x: 100, y: 350 },
            { x: 700, y: 350 }
        ];
        
        for (let pos of obstaclePositions) {
            this.obstacles.create(pos.x, pos.y, 'obstacle');
        }
    }

    eatFood() {
        this.score += 10;
        this.scoreText.setText('Score: ' + this.score);
        
        // Grow snake
        const tail = this.snake[this.snake.length - 1];
        const newSegment = this.physics.add.sprite(tail.x, tail.y, 'snake');
        newSegment.setCollideWorldBounds(true);
        newSegment.body.onWorldBounds = true;
        this.snake.push(newSegment);
        
        // Place new food
        this.placeFood();
        
        // Speed up slightly
        this.speed = Math.max(50, this.speed - 2);
    }

    collectPowerup() {
        this.score += 50;
        this.scoreText.setText('Score: ' + this.score);
        
        // Activate speed boost
        this.powerupActive = true;
        this.powerupTimer = 5000; // 5 seconds
        this.speed = 75;
        
        // Place new powerup
        this.placePowerup();
    }

    hitObstacle() {
        this.gameOver();
    }

    gameOver() {
        this.scene.pause();
        this.add.text(400, 300, 'GAME OVER\nScore: ' + this.score + '\nPress R to restart', {
            fontSize: '32px',
            fill: '#ff0000',
            fontFamily: 'Arial',
            align: 'center'
        }).setOrigin(0.5);
        
        // Restart key
        this.input.keyboard.once('keydown-R', () => {
            this.scene.restart();
        });
    }
}

// Game configuration
const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'game-container',
    backgroundColor: '#1a1a2e',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scene: MainScene
};

// Initialize game
const game = new Phaser.Game(config);