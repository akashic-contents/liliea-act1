import { Timeline, Tween, Easing } from "@akashic-extension/akashic-timeline";
import { WeaponEntity, WeaponEntityParameterObject } from "./WeaponEntity";

const ATTACKS = [1, 1, 1.2, 1.2, 1.3, 1.3, 1.4];
const RIGIDITIES = [2000, 2500, 2300, 2100, 1900, 1700, 1400];
const SHOT_COUNTS = [1, 2, 2, 2, 2, 2, 2];
const SHOT_SCALE = [0.4, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1];
const SHOT_KNOCKBACK = [400, 400, 500, 500, 600, 600, 700];
const SHOT_ALIVE_FRAME = 15;

// 他武器より成長遅め:
const EXP_TABLE = [5, 30, 80, 160, 320, 640, Number.MAX_VALUE];

const DIRECTION_TO_SCALE = {
	RIGHT: -1,
	RIGHT_DOWN: -1,
	DOWN: -1,
	LEFT_DOWN: 1,
	LEFT: 1,
	LEFT_UP: 1,
	UP: 1,
	RIGHT_UP: -1
};

interface Sword {
	sprite: g.Sprite;
	tween: Tween;
	nowAnimationFrame: number;
}

export class SwordWeaponEntity extends WeaponEntity {
	private _shots: Sword[] = [];
	private _shotCount: number;
	private _shotScale: number;
	private _timeline: Timeline;
	private _shotAsset: g.ImageAsset;
	private _currentWaitingTime: number = 0;

	constructor(param: WeaponEntityParameterObject) {
		super(param);
		this._timeline = new Timeline(this.scene);
		this._shotAsset = this.scene.asset.getImageById(param.data.frameSpriteAssetId ?? "effect_sword");
		this._setPropaties();
	}

	isHit(area: g.CommonArea): boolean {
		const hitShots = this._shots.filter(s => {
			const lengthX = s.sprite.width * 0.7 * Math.abs(s.sprite.scaleX);
			const lengthY = s.sprite.height * 0.8 * Math.abs(s.sprite.scaleY);
			const shotArea = {
				x: this.offset.x - lengthX + (s.sprite.scaleX < 0 ? lengthX : 0),
				y: this.offset.y - lengthY * 0.6,
				width: lengthX,
				height: lengthY
			};
			if (g.Collision.intersectAreas(shotArea, area)) {
				return true;
			}
			// this.append(new g.FilledRect({ scene: this.scene, cssColor: "red", ...shotArea }));
			return false;
		});
		return hitShots.length > 0;
	}

	getExpTable(): number[] {
		return EXP_TABLE;
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
				this._timeline.remove(shot.tween);
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
			const scaleFactorX = DIRECTION_TO_SCALE[this.direction];
			if (i === 0) {
				this.createShot(scaleFactorX);
			} else {
				this.scene.setTimeout(() => this.createShot(scaleFactorX * -1), interval * SHOT_ALIVE_FRAME * 0.5);
			}
		}
	}

	createShot(scaleFactorX: number): void {
		const interval = 1000 / g.game.fps;
		const spriteWidth = 192;
		const spriteHeight = 256;
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
			scaleX: this._shotScale * scaleFactorX,
			scaleY: this._shotScale,
			anchorX: 0.8,
			anchorY: 0.65,
			frames: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
			loop: false
		});
		sprite.start();

		const easing = Easing.easeInOutBack;
		const tween = this._timeline.create(sprite);
		tween.wait(10 * interval).fadeOut(5 * interval, easing);

		this.append(sprite);
		this._shots.push({ sprite, tween, nowAnimationFrame: 0 });
	}

	private _setPropaties(): void {
		this._currentWaitingTime = 0;
		this._attack = ATTACKS[this.lv - 1];
		this._knockback = SHOT_KNOCKBACK[this.lv - 1];
		this._rigidity = RIGIDITIES[this.lv - 1];
		this._shotCount = SHOT_COUNTS[this.lv - 1];
		this._shotScale = SHOT_SCALE[this.lv - 1];
	}
}
