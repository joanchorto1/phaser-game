import Phaser from 'phaser';

// Dimensiones y configuración de la ventana de juego
const gameConfig = {
    width: 800,
    height: 600
};

// Escena de carga de recursos
class PreloadScene extends Phaser.Scene {
    constructor() {
        super('PreloadScene');
    }

    preload() {
        // Mostrar texto para iniciar la carga
        this.loadingText = this.add.text(gameConfig.width / 2, gameConfig.height / 2 - 50, 'Presiona espacio para iniciar la carga...', { fontSize: '24px', fill: '#fff' })
            .setOrigin(0.5);

        // Mostrar texto de carga en progreso
        this.loadProgressText = this.add.text(gameConfig.width / 2, gameConfig.height / 2 + 50, '', { fontSize: '18px', fill: '#fff' })
            .setOrigin(0.5);

        // Cargar imágenes, sprites, audio, etc.
        this.load.image('background', 'assets/background.png');
        this.load.image('cowboy', 'assets/cowboy.png');
        this.load.image('bullet', 'assets/bullet.png'); // Imagen del disparo
        this.load.image('button', 'assets/button.png'); // Imagen del botón

        // Eventos de carga
        this.load.on('progress', this.updateLoadProgress, this);
        this.load.on('complete', this.onLoadComplete, this);

        // Configurar la tecla espaciadora para iniciar la carga
        this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    }

    updateLoadProgress(value) {
        // Actualizar texto de carga en progreso
        this.loadProgressText.setText('Cargando... ' + Math.round(value * 100) + '%');
    }

    onLoadComplete() {
        // Ocultar texto de carga
        this.loadingText.setVisible(false);
        this.loadProgressText.setVisible(false);

        // Mostrar texto de listo para jugar
        this.readyText = this.add.text(gameConfig.width / 2, gameConfig.height / 2, '¡Listo para jugar! Click para comenzar', { fontSize: '24px', fill: '#fff' })
            .setOrigin(0.5);

        // Configurar clic para iniciar el juego
        this.input.on('pointerdown', this.startGame, this);
    }

    startGame() {
        // Transición a la escena principal del juego
        this.scene.start('GameScene');
    }
}

// Escena principal del juego
class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
    }

    create() {
        // Fondo del juego
        this.add.image(gameConfig.width / 2, gameConfig.height / 2, 'background').setOrigin(0.5);

        // Cowboy jugador
        this.player = this.physics.add.sprite(100, 450, 'cowboy');
        if (!this.playerLives) {
            this.playerLives = 3; // Vidas del jugador, solo si no están inicializadas
        }

        // Cowboy enemigo
        this.enemy = this.physics.add.sprite(700, 450, 'cowboy');
        if (!this.enemyLives) {
            this.enemyLives = 3; // Vidas del enemigo, solo si no están inicializadas
        }

        // Colisiones y físicas
        this.player.setCollideWorldBounds(true);
        this.enemy.setCollideWorldBounds(true);

        // Botón para disparar (inicialmente oculto)
        this.shootButton = this.add.image(gameConfig.width / 2, gameConfig.height - 50, 'button')
            .setInteractive()
            .setVisible(false);

        this.shootButton.on('pointerdown', this.playerShoot, this);

        // Contador de ronda
        this.round = 1;

        // Texto para mostrar el ganador de la ronda
        this.roundWinnerText = this.add.text(gameConfig.width / 2, gameConfig.height / 2, '', { fontSize: '24px', fill: '#ff0000' })
            .setOrigin(0.5)
            .setVisible(false);

        // Actualizar texto de vidas
        this.updateLivesText();

        // Iniciar la cuenta atrás para el disparo del enemigo
        this.startEnemyCountdown();
    }

    updateLivesText() {
        // Actualizar texto de vidas del jugador y enemigo
        if (this.playerLivesText) {
            this.playerLivesText.destroy();
        }
        if (this.enemyLivesText) {
            this.enemyLivesText.destroy();
        }
        this.playerLivesText = this.add.text(16, gameConfig.height - 30, 'Vidas Jugador: ' + this.playerLives, { fontSize: '18px', fill: '#fff' });
        this.enemyLivesText = this.add.text(gameConfig.width - 16, gameConfig.height - 30, 'Vidas Enemigo: ' + this.enemyLives, { fontSize: '18px', fill: '#fff' })
            .setOrigin(1, 0);
    }

    startEnemyCountdown() {
        // Contador para la cuenta atrás del enemigo
        this.enemyCountdown = 3;
        this.enemyCountdownText = this.add.text(gameConfig.width / 2, 50, 'Cuenta atrás: ' + this.enemyCountdown, { fontSize: '24px', fill: '#fff' })
            .setOrigin(0.5);

        this.enemyCountdownTimer = this.time.addEvent({
            delay: 1000,
            callback: this.updateEnemyCountdown,
            callbackScope: this,
            loop: true
        });
    }

    updateEnemyCountdown() {
        this.enemyCountdown--;

        // Actualizar texto de la cuenta atrás del enemigo
        this.enemyCountdownText.setText('Cuenta atrás: ' + this.enemyCountdown);

        if (this.enemyCountdown === 0) {
            // Detener la cuenta atrás del enemigo
            this.enemyCountdownTimer.remove(false);

            // Ocultar el texto de la cuenta atrás
            this.enemyCountdownText.setVisible(false);

            // Mostrar el botón de disparo
            this.shootButton.setVisible(true);

            // Lógica de disparo del enemigo si el jugador no ha interactuado
            if (!this.hasPlayerInteracted) {
                this.enemyShootTimer = this.time.delayedCall(Phaser.Math.Between(500, 1500), () => {
                    if (!this.hasPlayerInteracted) {
                        this.enemyShoot();
                    }
                }, [], this);
            }
        }
    }

    playerShoot() {
        // Indicar que el jugador ha interactuado
        this.hasPlayerInteracted = true;

        // Ocultar el botón de disparar
        this.shootButton.setVisible(false);

        // Cancelar el disparo del enemigo si está programado
        if (this.enemyShootTimer) {
            this.enemyShootTimer.remove(false);
        }

        // Reducir vida del enemigo
        this.enemyLives--;

        // Actualizar texto de vidas del enemigo
        this.enemyLivesText.setText('Vidas Enemigo: ' + this.enemyLives);

        // Comprobar si el enemigo ha perdido una vida
        if (this.enemyLives > 0) {
            this.endRound('Jugador');
        } else {
            this.endGame('Jugador');
        }
    }

    enemyShoot() {
        // Lógica de disparo del enemigo
        const bullet = this.physics.add.sprite(this.enemy.x - 50, this.enemy.y, 'bullet');
        bullet.setVelocityX(-500); // Velocidad de la bala hacia la izquierda

        // Colisión de la bala del enemigo con el jugador
        this.physics.add.collider(bullet, this.player, () => {
            // Reducir vida del jugador
            this.playerLives--;

            // Actualizar texto de vidas del jugador
            this.playerLivesText.setText('Vidas Jugador: ' + this.playerLives);

            // Comprobar si el jugador ha perdido todas las vidas
            if (this.playerLives > 0) {
                this.endRound('Enemigo');
            } else {
                this.endGame('Enemigo');
            }
        });
    }

    endRound(winner) {
        // Mostrar el ganador de la ronda
        this.roundWinnerText.setText('Ganador de la ronda ' + this.round + ': ' + winner)
            .setVisible(true);

        // Detener la lógica de juego
        this.input.off('pointerdown', this.playerShoot, this);
        if (this.enemyCountdownTimer) {
            this.enemyCountdownTimer.remove(false);
        }

        // Mostrar texto de vidas final
        this.updateLivesText();

        // Reiniciar la cuenta atrás para la siguiente ronda
        this.time.delayedCall(2000, () => {
            this.round++;
            this.roundWinnerText.setVisible(false);

            // Reiniciar lógica de disparo del enemigo
            this.hasPlayerInteracted = false;

            // Reiniciar la cuenta atrás para el siguiente disparo del enemigo
            this.startEnemyCountdown();

            // Reactivar la entrada del jugador
            this.input.on('pointerdown', this.playerShoot, this);
        }, [], this);
    }

    endGame(winner) {
        // Mostrar el ganador del juego completo
        this.roundWinnerText.setText('¡' + winner + ' ha ganado el juego!')
            .setVisible(true);

        // Reiniciar el juego después de un tiempo
        this.time.delayedCall(3000, () => {
            this.scene.start('PreloadScene');
        }, [], this);
    }
}

// Configuración del juego
const config = {
    type: Phaser.AUTO,
    width: gameConfig.width,
    height: gameConfig.height,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 200 },
            debug: false
        }
    },
    scene: [PreloadScene, GameScene]
};

// Inicializar el juego
const game = new Phaser.Game(config);