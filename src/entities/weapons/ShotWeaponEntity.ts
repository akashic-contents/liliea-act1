import { GAME_HEIGHT, GAME_WIDTH } from "../../config";
import { Direction, DIRECTIONS } from "../../types/Direction";
import { calculateOffset, getEntityAreaByCenterPosition } from "../../util/calculate";
import { WeaponEntity, WeaponEntityParameterObject } from "./WeaponEntity";

const ATTACKS = [1, 1.3, 1.3, 1.75, 1.75, 2.5, 2.5];
const RIGIDITIES = [1500, 1500, 1000, 1000, 750, 750, 500];
const SHOT_COUNTS = [1, 2, 3, 4, 5, 6, 7];
const SHOT_RANGES = [1, 2, 3, 4, 5, 6, 7];
const SHOT_SPEED = [80, 85, 90, 95, 100, 110, 120];
const SHOT_KNOCKBACK = [60, 70, 80, 90, 100, 110, 120];
const SHOT_SCALES = [1, 1.1, 1.2, 1.3, 1.5, 1.7, 2];

// 他武器より成長遅め:
const EXP_TABLE = [5, 20, 50, 160, 280, 500, Number.MAX_VALUE];

interface Shot {
	sprite: g.Sprite;
	direction: Direction;
	isHit: boolean;
	movableArea: g.CommonArea;
	nowAnimationFrame: number;
}

// shotが移動可能な領域
const SHOT_MOVABLE_AREA: g.CommonArea = {
	x: -GAME_WIDTH / 2,
	y: -GAME_HEIGHT / 2,
	width: GAME_WIDTH,
	height: GAME_HEIGHT
};

export class ShotWeaponEntity extends WeaponEntity {
	private _shots: Shot[] = [];
	private _shotCount: number;
	private _shotRange: number;
	private _shotSpeed: number;
	private _shotScale: number;
	private _shotAsset: g.ImageAsset;
	private _currentWaitingTime: number = 0;
	private _isRotate: boolean;

	constructor(param: WeaponEntityParameterObject) {
		super(param);
		this._shotAsset = this.scene.asset.getImageById(param.data.frameSpriteAssetId ?? "shot");
		this._isRotate = param.data.isRotate ?? true;
		this._setPropaties();
	}

	isHit(area: g.CommonArea): boolean {
		const hitShots = this._shots.filter(s => {
			const shotArea = getEntityAreaByCenterPosition(s.sprite);
			if (g.Collision.intersectAreas(shotArea, area)) {
				s.isHit = true;
				return true;
			}
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
		// shot削除
		const existHitShots = this._shots.filter(s => {
			if (s.isHit || !g.Collision.intersectAreas(getEntityAreaByCenterPosition(s.sprite), s.movableArea)) {
				s.sprite.destroy();
				return false;
			}
			return true;
		});
		this._shots = existHitShots;

		// shot移動
		this._shots.forEach(s => {
			const offset = calculateOffset(this._shotSpeed, s.direction);
			s.sprite.moveBy(offset.x, offset.y);
			if (this._isRotate) s.sprite.angle += 10 % 360;
			const scale = this._shotScale + Math.sin((s.nowAnimationFrame / 100) * 2 * Math.PI);
			s.sprite.scaleX = scale;
			s.sprite.scaleY = scale;
			s.sprite.modified();
		});

		// shot生成
		this._currentWaitingTime += 1000 / g.game.fps;
		if (this._currentWaitingTime < this.rigidity) {
			return;
		}
		this._currentWaitingTime = 0;

		const startRangeIndex = -1 * Math.floor(this._shotRange / 2);
		const endRangeIndex = Math.ceil(this._shotRange / 2);
		for (let i = startRangeIndex; i < endRangeIndex; i++) {
			const direction = DIRECTIONS[(DIRECTIONS.indexOf(this.direction) + i) % DIRECTIONS.length];
			for (let j = 0; j < this._shotCount; j++) {
				const offset = calculateOffset(1.2 * j * this._shotAsset.width, direction);
				const sprite = new g.Sprite({
					scene: this.scene,
					src: this._shotAsset,
					x: this.offset.x + offset.x,
					y: this.offset.y + offset.y,
					anchorX: 0.5,
					anchorY: 0.5
				});
				const movableArea = {
					x: sprite.x + SHOT_MOVABLE_AREA.x,
					y: sprite.y + SHOT_MOVABLE_AREA.y,
					width: SHOT_MOVABLE_AREA.width,
					height: SHOT_MOVABLE_AREA.height
				};
				this.append(sprite);
				this._shots.push({ sprite, direction, isHit: false, movableArea, nowAnimationFrame: 0 });
			}
		}
	}

	private _setPropaties(): void {
		this._currentWaitingTime = 0;
		this._attack = ATTACKS[this.lv - 1];
		this._knockback = SHOT_KNOCKBACK[this.lv - 1];
		this._rigidity = RIGIDITIES[this.lv - 1];
		this._shotSpeed = SHOT_SPEED[this.lv - 1];
		this._shotCount = SHOT_COUNTS[this.lv - 1];
		this._shotRange = SHOT_RANGES[this.lv - 1];
		this._shotScale = SHOT_SCALES[this.lv - 1];
	}
}
