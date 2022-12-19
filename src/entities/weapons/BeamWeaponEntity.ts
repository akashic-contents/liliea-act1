import { Timeline, Tween, Easing } from "@akashic-extension/akashic-timeline";
import { WeaponEntity, WeaponEntityParameterObject } from "./WeaponEntity";

const ATTACKS = [1, 1, 1, 1, 1, 2, 2, 2];
const RIGIDITIES = [8000, 8000, 8000, 8000, 8000, 8000, 8000];
const SHOT_COUNTS = [1, 1, 1, 1, 1, 1, 1];
const SHOT_SCALE = [1, 1, 1, 1, 1, 1, 1];
const SHOT_ALIVE_FRAME = 120;
const SHOT_KNOCKBACK = 1;
const SHOT_FRAMES = [
	[0, 1, 2, 3, 4, 5, 6, 7, 10, 11],
	[10, 7, 6, 5, 4, 3, 4, 5, 6, 7, 10],
	[10, 7, 6, 5, 4, 3, 4, 5, 6, 7, 10],
	[10, 7, 6, 5, 4, 3, 4, 5, 6, 7, 10],
	[11, 10, 7, 8, 0, 1, 2, 0, 1, 2],
	[0, 1, 2, 1, 2, 0, 1, 2, 0, 2],
	[1, 2, 0, 1, 0, 2, 1, 2, 0, 2],
	[0, 1, 2, 1, 2, 0, 1, 2, 0, 2],
	[1, 2, 0, 1, 0, 2, 1, 2, 0, 2],
	[0, 1, 2, 1, 2, 0, 1, 2, 0, 2],
	[1, 2, 0, 1, 0, 2, 1, 2, 0, 2],
	[0, 1, 2, 1, 2, 0, 1, 2, 1, 0]
].reduce((acc, val) => acc.concat(val), []);

interface Thunder {
	sprite: g.Sprite;
	tween: Tween;
	nowAnimationFrame: number;
}

export class BeamWeaponEntity extends WeaponEntity {
	private _shots: Thunder[] = [];
	private _shotCount: number;
	private _shotScale: number;
	private _shotAsset: g.ImageAsset;
	private _timeline: Timeline;
	private _currentWaitingTime: number = 0;

	constructor(param: WeaponEntityParameterObject) {
		super(param);
		this._timeline = new Timeline(this.scene);
		this._shotAsset = this.scene.asset.getImageById(param.data.frameSpriteAssetId ?? "effect_beam");
		this._setPropaties();
	}

	isHit(area: g.CommonArea): boolean {
		const hitShots = this._shots.filter(s => {
			// 接地エリアを判定対象とする:
			const length = s.sprite.height * 0.8;
			const shotArea = {
				x: s.sprite.x - length * 0.25,
				y: s.sprite.y - length,
				width: length * 0.5,
				height: length * 0.5
			};
			if (g.Collision.intersectAreas(shotArea, area)) {
				return true;
			}
			// this.append(new g.FilledRect({ scene: this.scene, cssColor: "blue", ...shotArea }));
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
			if (i === 0) {
				this.createShot();
			} else {
				this.scene.setTimeout(() => this.createShot(), interval * 3);
			}
		}
	}

	createShot(): void {
		const interval = 1000 / g.game.fps;
		const spriteWidth = 512;
		const spriteHeight = 128;
		const sprite = new g.FrameSprite({
			scene: this.scene,
			src: this._shotAsset,
			width: spriteWidth,
			height: spriteHeight,
			srcWidth: spriteWidth,
			srcHeight: spriteHeight,
			x: this.offset.x,
			y: this.offset.y,
			scaleX: this._shotScale,
			scaleY: this._shotScale,
			angle: 90,
			opacity: 0.9,
			anchorX: 1.0, // 右端原点
			anchorY: 0.5,
			frames: SHOT_FRAMES,
			loop: false
		});
		sprite.start();

		const spriteAnimationInterval = interval * SHOT_ALIVE_FRAME;
		const easing = Easing.easeInOutBack;
		const tween = this._timeline.create(sprite);
		tween.scaleBy(1, 2, spriteAnimationInterval, easing).con().to({ opacity: 0.5 }, spriteAnimationInterval, easing);

		this.append(sprite);
		this._shots.push({ sprite, tween, nowAnimationFrame: 0 });
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
