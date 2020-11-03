import * as PIXI from 'pixi.js'
import random from 'yy-random'

import { view } from './view'
import { moon } from './moon'

const fireTime = 200
const fadeTime = 200

class Laser extends PIXI.Container {
    constructor() {
        super()
        this.state = ''
        this.firing = []
        this.angleOfLine = Infinity
    }

    box(x, y, tint, alpha=1) {
        const point = this.addChild(new PIXI.Sprite(PIXI.Texture.WHITE))
        point.tint = tint
        point.alpha = alpha
        point.anchor.set(0.5)
        point.width = point.height = 1
        point.position.set(x, y)
    }

    line(x0, y0, x1, y1, tint, alpha) {
        const points = {}
        points[`${x0}-${y0}`] = true
        let dx = x1 - x0;
        let dy = y1 - y0;
        let adx = Math.abs(dx);
        let ady = Math.abs(dy);
        let eps = 0;
        let sx = dx > 0 ? 1 : -1;
        let sy = dy > 0 ? 1 : -1;
        if (adx > ady) {
            for (let x = x0, y = y0; sx < 0 ? x >= x1 : x <= x1; x += sx) {
                points[`${x}-${y}`] = true
                eps += ady;
                if ((eps << 1) >= adx) {
                    y += sy;
                    eps -= adx;
                }
            }
        } else {
            for (let x = x0, y = y0; sy < 0 ? y >= y1 : y <= y1; y += sy) {
                points[`${x}-${y}`] = true
                eps += adx;
                if ((eps << 1) >= ady) {
                    x += sx;
                    eps -= ady;
                }
            }
        }
        for (const key in points) {
            this.box(...key.split('-'), tint, alpha)
        }
    }

    fireNext() {
        if (this.firing.length) {
            const center = view.size / 2
            this.target = moon.closestOnLine(
                center + Math.cos(this.angleOfLine) * view.max,
                center + Math.sin(this.angleOfLine) * view.max,
                center, center,
            )
            if (!this.target) {
                this.state = ''
            } else {
                this.state = 'fire'
                this.time = Date.now()
                this.aim = [this.target.x, this.target.y]
                this.angleOfLine = this.firing.shift()
                moon.target(this.target)
            }
        }
    }

    update() {
        if (this.state === 'fire') {
            if (Date.now() >= this.time + fireTime) {
                this.state = 'fade'
                this.time = Date.now()
            }
        } else if (this.state === 'fade') {
            if (Date.now() >= this.time + fadeTime) {
                this.state = ''
                this.removeChildren()
                this.fireNext()
            }
        }
        if (this.state !== '' && this.angleOfLine !== this.last) {
            this.removeChildren()
            const center = view.size / 2
            if (this.state === 'aim') {
                const p2 = moon.closestOnLine(
                    center + Math.cos(this.angleOfLine) * view.max,
                    center + Math.sin(this.angleOfLine) * view.max,
                    center, center,
                )
                if (!p2) {
                    this.state = ''
                } else {
                    this.target = p2
                    this.aim = [p2.x, p2.y]
                }
            }
            let tint, alpha
            if (this.state === 'aim') {
                tint = 0xffffff
                alpha = 0.4
            } else if (this.state === 'fire') {
                tint = 0xff0000
                alpha = random.range(0.75, 1, true)
            } else if (this.state === 'fade') {
                tint = 0xff0000
                alpha = 1 - (Date.now() - this.time) / fadeTime
            }
            this.line(
                Math.round(center + Math.cos(this.angleOfLine) * view.max),
                Math.round(center + Math.sin(this.angleOfLine) * view.max),
                ...this.aim,
                tint, alpha,
            )
        }
    }

    down(point) {
        const angle = Math.atan2(point.y - window.innerHeight / 2, point.x - window.innerWidth / 2)
        if (this.state === '') {
            this.state = 'aim'
            this.angleOfLine = angle
        } else {
            // this.firing.push(angle)
        }
    }

    move(point) {
        if (this.state === 'aim') {
            this.angleOfLine = Math.atan2(point.y - window.innerHeight / 2, point.x - window.innerWidth / 2)
        }
    }

    up() {
        if (this.state === 'aim') {
            this.state = 'fire'
            this.time = Date.now()
            moon.target(this.target)
        }
    }
}

export const laser = new Laser()