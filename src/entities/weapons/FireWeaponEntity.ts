import { getEntityAreaByLeftPosition, getEntityAreaByLeftPositionAndFlip } from "../../util/calculate";
import { WeaponEntity, WeaponEntityParameterObject } from "./WeaponEntity";

const ATTACKS = [1, 1, 1.2, 1.2, 1.3, 1.3, 1.4];
const RIGIDITIES = [2000, 3000, 2800, 2600, 2400, 2200, 2000];
const SHOT_COUNTS = [1, 2, 2, 2, 2, 2, 2];
const SHOT_SCALE = [1, 1, 1.2, 1.3, 1.4, 1.5, 1.8];
const SHOT_SPEED = 50;
const SHOT_KNOCKBACK = 60;
const SHOT_ALIVE_FRAME = 40;
const DIRECTION_TO_ANGLE = {
	RIGHT: 0,
	RIGHT_DOWN: 0,
	DOWN: 0,
	LEFT_DOWN: 180,
	LEFT: 180,
	LEFT_UP: 180,
	UP: 180,
	RIGHT_UP: 0
};

interface Fire {
	sprite: g.Sprite;
	nowAnimationFrame: number;
	isHit: boolean;
}

export class FireWeaponEntity extends WeaponEntity {
	private _shots: Fire[] = [];
	private _shotCount: number;
	private _shotScale: number;
	private _shotAsset: g.ImageAsset;
	private _currentWaitingTime: number = 0;
	private _isRotate: boolean;
	private _speed: number;

	constructor(param: WeaponEntityParameterObject) {
		super(param);
		this._shotAsset = this.scene.asset.getImageById(param.data.frameSpriteAssetId ?? "effect_fire");
		this._isRotate = param.data.isRotate ?? true;
		this._speed = param.data.speed ?? SHOT_SPEED;
		this._setPropaties();
	}

	isHit(area: g.CommonArea): boolean {
		const hitShots = this._shots.filter(s => {
			const shotArea = s.sprite.angle < 1 ? getEntityAreaByLeftPosition(s.sprite) : getEntityAreaByLeftPositionAndFlip(s.sprite);
			if (g.Collision.intersectAreas(shotArea, area)) {
				s.isHit = true;
				// this.append(new g.FilledRect({ scene: this.scene, cssColor: "red", ...shotArea }));
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
			shot.sprite.moveTo(this.offset.x, this.offset.y);
			shot.sprite.modified();
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
			const angle = (DIRECTION_TO_ANGLE[this.direction] + i * 180) % 360;
			if (i === 0) {
				this.createShot(angle);
			} else {
				this.scene.setTimeout(() => this.createShot(angle), interval * SHOT_ALIVE_FRAME * 0.5);
			}
		}
	}

	createShot(angle: number): void {
		const spriteWidth = 112;
		const spriteHeight = 48;
		const sprite = new g.FrameSprite({
			scene: this.scene,
			src: this._shotAsset,
			width: spriteWidth,
			height: spriteHeight,
			srcWidth: spriteWidth,
			srcHeight: spriteHeight,
			x: this.offset.x,
			y: this.offset.y,
			opacity: 0.9,
			angle,
			scaleX: this._shotScale,
			scaleY: this._shotScale,
			anchorX: 0.0, // 左右反転のため左端を原点
			anchorY: 0.5,
			frames: [0, 1, 2, 3, 4, 5, 6, 7, 8, 2, 1, 4, 3, 6, 5, 8, 7, 2, 1, 0],
			interval: (1000 / g.game.fps) * 2,
			loop: false
		});
		sprite.start();
		this.append(sprite);
		this._shots.push({ sprite, nowAnimationFrame: 0, isHit: false });
	}

	private _setPropaties(): void {
		this._currentWaitingTime = 0;
		this._attack = ATTACKS[this.lv - 1];
		this._knockback = SHOT_KNOCKBACK;
		this._rigidity = RIGIDITIES[this.lv - 1];
		this._shotCount = SHOT_COUNTS[this.lv - 1];
		this._shotScale = SHOT_SCALE[this.lv - 1];
	}
}
