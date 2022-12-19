import { getEntityAreaByCenterPosition } from "../../util/calculate";
import { CharacterEntity } from "../CharacterEntity";
import { WeaponEntity, WeaponEntityParameterObject } from "./WeaponEntity";

// ダメージなし:
const ATTACKS = -200;
const RIGIDITIES = [15000, 15000, 15000, 15000, 15000, 15000, 15000];
const SHOT_COUNTS = [1, 1, 1, 1, 1, 1, 1];
const SHOT_SCALE = [1, 1.05, 1.1, 1.15, 1.2, 1.25, 1.3];
const SHOT_RANGE = [3, 3.2, 3.4, 3.6, 4, 4.5, 5];
const SHOT_SPEED = [30, 35, 40, 45, 50, 55, 60];
const SHOT_ALIVE_FRAME = 300;
const SHOT_KNOCKBACK = 1;

interface InhaleEntity {
	entity: g.E;
	nowAnimationFrame: number;
}

// 現状 SpaceWeponEntity とセットで使われることを想定しており可搬性はないことに注意:
export class InhaleWeaponEntity extends WeaponEntity {
	private _entities: InhaleEntity[] = [];
	private _shotCount: number;
	private _shotScale: number;
	private _shotRange: number;
	private _shotSpeed: number;
	private _currentWaitingTime: number = 0;

	constructor(param: WeaponEntityParameterObject) {
		super(param);
		this._setPropaties();
		this.onUpdate.add(this._animation, this);
	}

	isHit(area: g.CommonArea): boolean {
		const hitShots = this._entities.filter(s => {
			const shotArea = getEntityAreaByCenterPosition(s.entity);
			if (g.Collision.intersectAreas(shotArea, area)) {
				return true;
			}
			// this.append(new g.FilledRect({ scene: this.scene, cssColor: "red", ...shotArea }));
			return false;
		});
		return hitShots.length > 0;
	}

	effect(target: CharacterEntity): void {
		// 引き寄せ判定:
		this._entities.forEach(e => target.moveToTarget(e.entity, null, this._shotSpeed));
	}

	protected _powerUp(): void {
		this._setPropaties();
	}

	protected _animation(): void {
		// 生存期間終了後に削除:
		for (let i = 0; i < this._entities.length; ++i) {
			const shot = this._entities[i];
			shot.nowAnimationFrame++;
			if (shot.nowAnimationFrame > SHOT_ALIVE_FRAME) {
				this._entities.splice(i, 1);
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
		const width = 96;
		const length = width * this._shotRange;
		const entity = new g.E({
			scene: this.scene,
			x: this.offset.x,
			y: this.offset.y,
			width: length,
			height: length,
			anchorX: 0.5,
			anchorY: 0.5,
			scaleX: this._shotScale,
			scaleY: this._shotScale
		});
		this._entities.push({ entity, nowAnimationFrame: 0 });
	}

	private _setPropaties(): void {
		this._currentWaitingTime = 0;
		this._attack = ATTACKS;
		this._knockback = SHOT_KNOCKBACK;
		this._rigidity = RIGIDITIES[this.lv - 1];
		this._shotCount = SHOT_COUNTS[this.lv - 1];
		this._shotScale = SHOT_SCALE[this.lv - 1];
		this._shotRange = SHOT_RANGE[this.lv - 1];
		this._shotSpeed = SHOT_SPEED[this.lv - 1];
	}
}
