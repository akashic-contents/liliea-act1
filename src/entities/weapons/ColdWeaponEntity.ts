import { Timeline, Tween, Easing } from "@akashic-extension/akashic-timeline";
import { getEntityAreaByCenterPosition } from "../../util/calculate";
import { CharacterEntity } from "../CharacterEntity";
import { WeaponEntity, WeaponEntityParameterObject } from "./WeaponEntity";

const ATTACKS = [1, 1, 1, 1, 1, 1, 1];
const RIGIDITIES = [6000, 6000, 6000, 6000, 6000, 6000, 6000];
const SHOT_COUNTS = [1, 2, 3, 4, 5, 6, 7];
const SHOT_LAP = [2, 2, 3, 3, 4, 4, 5];
const SHOT_ALIVE_FRAME = 200;
const SHOT_RADIUS = [48, 52, 56, 62, 68, 74, 80];
const SHOT_KNOCKBACK = 1;

interface SnowBarrier {
	sprite: g.Sprite;
	tween: Tween;
	beginFrame: number;
	nowAnimationFrame: number;
}

export class ColdWeaponEntity extends WeaponEntity {
	private _shots: SnowBarrier[] = [];
	private _shotCount: number;
	private _shotScale: number;
	private _shotRadius: number;
	private _shotLap: number;
	private _shotAsset: g.ImageAsset;
	private _timeline: Timeline;
	private _currentWaitingTime: number = 0;
	private _isRotate: boolean;

	constructor(param: WeaponEntityParameterObject) {
		super(param);
		this._timeline = new Timeline(this.scene);
		this._shotAsset = this.scene.asset.getImageById(param.data.frameSpriteAssetId ?? "effect_snow");
		this._isRotate = param.data.isRotate ?? true;
		this._setPropaties();
	}

	isHit(area: g.CommonArea): boolean {
		const hitShots = this._shots.filter(s => {
			const shotArea = getEntityAreaByCenterPosition(s.sprite);
			if (g.Collision.intersectAreas(shotArea, area)) {
				return true;
			}
			// this.append(new g.FilledRect({ scene: this.scene, cssColor: "green", ...shotArea }));
			return false;
		});
		return hitShots.length > 0;
	}

	effect(target: CharacterEntity): void {
		// スロウ:
		if (target.animationStatus === "move") {
			target.updateSpeedMultiplier(0.2);
			this.scene.setTimeout(() => target.updateSpeedMultiplier(1), 2000);
		}
	}

	protected _powerUp(): void {
		this._setPropaties();
	}

	protected _animation(): void {
		for (let i = 0; i < this._shots.length; ++i) {
			const shot = this._shots[i];

			// 状態更新:
			shot.nowAnimationFrame++;
			const frame = (shot.nowAnimationFrame + shot.beginFrame) % SHOT_ALIVE_FRAME;
			const offset = this.moveAround(this._shotLap, this._shotRadius, this._shotRadius, frame, SHOT_ALIVE_FRAME);
			shot.sprite.moveTo(offset.x, offset.y);
			if (this._isRotate) {
				shot.sprite.angle += 10 % 360;
			}
			shot.sprite.modified();

			if (shot.nowAnimationFrame > SHOT_ALIVE_FRAME) {
				// 生存期間終了後に削除:
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
			const beginFrame = (SHOT_ALIVE_FRAME / this._shotLap) * ((i + 1) / this._shotCount);
			const offset = this.moveAround(this._shotLap, this._shotRadius, this._shotRadius, beginFrame, SHOT_ALIVE_FRAME);
			this.createShot(offset, beginFrame);
		}
	}

	createShot(offset: g.CommonOffset, beginFrame: number): void {
		const sprite = new g.Sprite({
			scene: this.scene,
			src: this._shotAsset,
			x: this.offset.x + offset.x,
			y: this.offset.y + offset.y,
			anchorX: 0.5,
			anchorY: 0.5
		});
		const interval = 1000 / g.game.fps;
		const spriteAnimationInterval = interval * SHOT_ALIVE_FRAME;
		const tween = this._timeline.create(sprite);
		tween
			.scaleTo(0.75, 0.75, spriteAnimationInterval / 4, Easing.easeOutQubic)
			.scaleTo(1, 1, spriteAnimationInterval / 4, Easing.easeInQubic)
			.scaleTo(0.75, 0.75, spriteAnimationInterval / 4, Easing.easeOutQubic)
			.scaleTo(1, 1, spriteAnimationInterval / 4, Easing.easeInQubic)
			.con()
			.fadeOut(spriteAnimationInterval / 4);

		this.append(sprite);
		this._shots.push({ sprite, tween, nowAnimationFrame: 0, beginFrame });
	}

	moveAround(lap: number, radiusX: number, radiusY: number, nowAnimationFrame: number, animationFrame: number): g.CommonOffset {
		const radian = Math.PI * 2 * (nowAnimationFrame / animationFrame) * lap;
		return {
			x: this.offset.x + Math.cos(radian) * radiusX,
			y: this.offset.y + Math.sin(radian) * radiusY
		};
	}

	private _setPropaties(): void {
		this._currentWaitingTime = 0;
		this._attack = ATTACKS[this.lv - 1];
		this._knockback = SHOT_KNOCKBACK;
		this._rigidity = RIGIDITIES[this.lv - 1];
		this._shotCount = SHOT_COUNTS[this.lv - 1];
		this._shotRadius = SHOT_RADIUS[this.lv - 1];
		this._shotLap = SHOT_LAP[this.lv - 1];
	}
}
