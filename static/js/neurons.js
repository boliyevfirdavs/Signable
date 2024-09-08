async function fetchSentence() {
    const response = await fetch('/get_sentence');
    const data = await response.json();
    document.getElementById('sentence').innerText = data.join(' ');
}

setInterval(fetchSentence, 1000);

const canvas = document.getElementById('neuronCanvas');
const ctx = canvas.getContext('2d');
const particles = [];

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});

class Particle {
    constructor(x, y, radius) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.dx = (Math.random() - 0.5) * 2;
        this.dy = (Math.random() - 0.5) * 2;
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        ctx.fillStyle = '#ffd700';
        ctx.fill();
    }

    update() {
        if (this.x + this.radius > canvas.width || this.x - this.radius < 0) {
            this.dx = -this.dx;
        }
        if (this.y + this.radius > canvas.height || this.y - this.radius < 0) {
            this.dy = -this.dy;
        }
        this.x += this.dx;
        this.y += this.dy;
        this.draw();
    }
}

function initParticles() {
    particles.length = 0;
    for (let i = 0; i < 100; i++) {
        const radius = 2;
        const x = Math.random() * (canvas.width - radius * 2) + radius;
        const y = Math.random() * (canvas.height - radius * 2) + radius;
        particles.push(new Particle(x, y, radius));
    }
}

function connectParticles() {
    for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
            const distance = Math.hypot(particles[i].x - particles[j].x, particles[i].y - particles[j].y);
            if (distance < 100) {
                ctx.strokeStyle = '#ffd700';
                ctx.lineWidth = 0.5;
                ctx.beginPath();
                ctx.moveTo(particles[i].x, particles[i].y);
                ctx.lineTo(particles[j].x, particles[j].y);
                ctx.stroke();
                ctx.closePath();
            }
        }
    }
}

function animateParticles() {
    requestAnimationFrame(animateParticles);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(particle => particle.update());
    connectParticles();
}

initParticles();
animateParticles();

async function resetVariables() {
    await fetch('/reset_variables', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    });
}

window.onload = async () => {
    await resetVariables();
};
