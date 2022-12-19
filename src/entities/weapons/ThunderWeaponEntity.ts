import { WeaponEntity, WeaponEntityParameterObject } from "./WeaponEntity";

const ATTACKS = [2, 2, 2.5, 2.5, 3, 3, 4];
const RIGIDITIES = [3000, 3000, 3000, 3000, 3000, 3000, 3000];
const SHOT_COUNTS = [2, 3, 3, 4, 4, 5, 5];
const SHOT_SCALE = [0.75, 0.75, 1, 1, 1.2, 1.2, 1.2];
const SHOT_SPEED = 50;
const SHOT_ALIVE_FRAME = 15;
const SHOT_RANGE = [100, 100, 200, 200, 300, 300, 400];
const SHOT_KNOCKBACK = 200;

interface Thunder {
	sprite: g.Sprite;
	nowAnimationFrame: number;
}

export class ThunderWeaponEntity extends WeaponEntity {
	private _shots: Thunder[] = [];
	private _shotCount: number;
	private _shotScale: number;
	private _shotRange: number;
	private _shotAsset: g.ImageAsset;
	private _currentWaitingTime: number = 0;
	private _speed: number;

	constructor(param: WeaponEntityParameterObject) {
		super(param);
		this._shotAsset = this.scene.asset.getImageById(param.data.frameSpriteAssetId ?? "effect_thunder");
		this._speed = param.data.speed ?? SHOT_SPEED;
		this._setPropaties();
	}

	isHit(area: g.CommonArea): boolean {
		const hitShots = this._shots.filter(s => {
			// 落雷の接地エリアを判定対象とする:
			const width = (s.sprite.width * s.sprite.scaleX) / 2;
			const height = (s.sprite.height * s.sprite.scaleY) / 4;
			const shotArea = {
				x: s.sprite.x - width / 2,
				y: s.sprite.y - height,
				width,
				height
			};
			if (g.Collision.intersectAreas(shotArea, area)) {
				// this.append(new g.FilledRect({ scene: this.scene, cssColor: "yellow", ...shotArea }));
				return true;
			}
			return false;
		});
		return hitShots.length > 0;
	}

	protected _powerUp(): void {
		this._setPropaties();
	}

	protected _animation(): void {
		// 生存期間終了後に削除:
		for (let i = 0; i < this._shots.length; ++i) {
			const shot = this._shots[i];
			shot.nowAnimationFrame++;
			if (shot.nowAnimationFrame > SHOT_ALIVE_FRAME) {
				shot.sprite.destroy();
				this._shots.splice(i, 1);
			}
		}

		const interval = 1000 / g.game.fps;
		this._currentWaitingTime += interval;
		if (this._currentWaitingTime < this.rigidity) {
			return;
		}
		this._currentWaitingTime = 0;

		// shot生成:
		for (let i = 0; i < this._shotCount; ++i) {
			if (i === 0) {
				this.createShot();
			} else {
				this.scene.setTimeout(() => this.createShot(), interval * SHOT_ALIVE_FRAME * 0.2);
			}
		}
	}

	createShot(): void {
		const x = Math.floor(g.game.random.generate() * this._shotRange - this._shotRange / 2);
		const y = Math.floor(g.game.random.generate() * this._shotRange - this._shotRange / 2);
		const spriteWidth = 128;
		const spriteHeight = 412;
		const sprite = new g.FrameSprite({
			scene: this.scene,
			src: this._shotAsset,
			width: spriteWidth,
			height: spriteHeight,
			srcWidth: spriteWidth,
			srcHeight: spriteHeight,
			x: this.offset.x + x,
			y: this.offset.y + y,
			scaleX: this._shotScale,
			scaleY: this._shotScale,
			opacity: 0.8,
			anchorX: 0.5,
			anchorY: 1.0, // 対象座標の上空から落とす
			frames: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14],
			loop: false
		});
		sprite.start();
		this.append(sprite);
		this._shots.push({ sprite, nowAnimationFrame: 0 });
	}

	private _setPropaties(): void {
		this._currentWaitingTime = 0;
		this._attack = ATTACKS[this.lv - 1];
		this._knockback = SHOT_KNOCKBACK;
		this._rigidity = RIGIDITIES[this.lv - 1];
		this._shotCount = SHOT_COUNTS[this.lv - 1];
		this._shotRange = SHOT_RANGE[this.lv - 1];
		this._shotScale = SHOT_SCALE[this.lv - 1];
	}
}
