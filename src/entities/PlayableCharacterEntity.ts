import { weaponDataTable } from "../global/dataTable";
import { createWeaponEntity } from "../global/weapon";
import { calculateDamageValue } from "../util/calculate";
import { AnimationStatus, CharacterEntity, CharacterEntityParameterObject } from "./CharacterEntity";
import { PowerUpItemEntity, RecoveryItemEntity } from "./ItemEntity";
import { WeaponEntity } from "./weapons/WeaponEntity";

interface PlayableCharacterEntityParameterObject extends CharacterEntityParameterObject {
	playerId: string;
	weaponIds: string[];
}

const DAMAGE_TIME = 500; // ダメージを受けている時間。この時間は無敵状態となる。
const RECOVER_TIME = 1000; // 回復時間。この時間は無敵状態となる。
const DAMAGE_OPACITIES = [0.9, 0.75, 0.6, 0.45, 0.3]; // ダメージを受けている時の自キャラの透明度の遷移。
const HP_BAR_COLOR_SAFETY = "green"; // 通常時のHPバーの色
const HP_BAR_COLOR_DANGER = "red"; // 残りHPが少なった時のHPバーの色
const POSITION_HISTORY_LENGTH = 1000; // 位置履歴の十分な数. Follower などがこれでルートを追跡する

export class PlayableCharacterEntity extends CharacterEntity {
	private _playerId: string;
	private _hpBar: g.FilledRect;
	private _damageValue: number | undefined = undefined;
	private _recoverValue: number | undefined = undefined;
	private _weaponEntities: WeaponEntity[];
	private _positionHistory: g.CommonOffset[] = new Array(POSITION_HISTORY_LENGTH);
	private _positionHistoryIndex: number = 0;
	private _lastAnimationStatus: AnimationStatus;
	private _initialWeaponIds: string[];

	constructor(param: PlayableCharacterEntityParameterObject) {
		super(param);
		this._playerId = param.playerId;
		this._initialWeaponIds = param.weaponIds;
		this._weaponEntities = param.weaponIds.map(id => {
			const entity = createWeaponEntity(param.scene, id);
			this.append(entity);
			return entity;
		});
		this._lastAnimationStatus = this.animationStatus;
		this._hpBar = new g.FilledRect({
			scene: param.scene,
			cssColor: HP_BAR_COLOR_SAFETY,
			width: param.width,
			height: 0.125 * param.height,
			x: this.frameSprite.x - 0.5 * param.width,
			y: this.frameSprite.y - (0.5 + 0.125) * param.height
		});
		this.append(this._hpBar);

		this.onUpdate.add(() => {
			const shouldChangeWeaponStatus = this.animationStatus !== this._lastAnimationStatus;
			this._weaponEntities.forEach(e => {
				e.offset = this.offset;
				e.direction = this.direction;
				if (shouldChangeWeaponStatus) {
					if (this.animationStatus === "move") {
						e.start();
					} else {
						e.stop();
					}
				}
			});
			this._lastAnimationStatus = this.animationStatus;

			if (this.isDamaged) {
				const reduceRate = this._damageValue / (g.game.fps * (DAMAGE_TIME / 1000)) / this.maxHP;
				this._damageAnimation(reduceRate);
			}
			if (this.isRecoverd) {
				const reduceRate = this._recoverValue / (g.game.fps * (RECOVER_TIME / 1000)) / this.maxHP;
				this._recoveryAnimation(reduceRate);
			}
		});
	}

	get isDamaged(): boolean {
		return this._damageValue != null;
	}

	get isRecoverd(): boolean {
		return this._recoverValue != null;
	}

	getPositionHistory(index: number): g.CommonOffset {
		return this._positionHistory[index % this._positionHistory.length];
	}

	get positionHistoryIndex(): number {
		return this._positionHistoryIndex;
	}

	get positionHistoryLength(): number {
		return this._positionHistory.length;
	}

	powerUp(item: PowerUpItemEntity): void {
		super.powerUp(item);
		this._weaponEntities.forEach(w => {
			// 種類に関わらずデフォルト武器にも経験値を追加:
			if (this._initialWeaponIds.some(id => id === w.type)) {
				if (w.expUp(item.expValue)) {
					this.showLevelUp();
				}
				this.addExpWeapon(w.type, item.expValue);
			} else if (w.type === item.expType) {
				if (w.expUp(item.expValue)) {
					this.showLevelUp();
				}
			}
		});
	}

	move(dx: number, dy: number): void {
		super.move(dx, dy);
		this._hpBar.moveBy(dx, dy);
		this._hpBar.modified();

		this._positionHistoryIndex = (this._positionHistoryIndex + 1) % this._positionHistory.length;
		this._positionHistory[this._positionHistoryIndex] = {
			x: this.frameSprite.x,
			y: this.frameSprite.y
		};
	}

	damage(enemy: CharacterEntity): number {
		this._damageValue = calculateDamageValue(enemy, this);
		this.reduceHp(this._damageValue);
		this.scene.setTimeout(() => {
			this._damageValue = undefined;
			this.frameSprite.opacity = 1;
			this.frameSprite.modified();
		}, DAMAGE_TIME);
		return this._damageValue;
	}

	recover(item: RecoveryItemEntity): void {
		const recoverHp = item.recover(this.maxHP);
		this._recoverValue = recoverHp;
		this.recoverHp(recoverHp);
	}

	recoverHp(value: number): void {
		super.recoverHp(value);
		this._recoverValue = value;
		this.scene.setTimeout(() => {
			this._recoverValue = undefined;
			this.frameSprite.opacity = 1;
			this.frameSprite.modified();
		}, RECOVER_TIME);
	}

	putIn(offset: g.CommonOffset): void {
		super.putIn(offset);
		this._hpBar.moveTo(offset.x - 0.5 * this.frameSprite.width, offset.y - (0.5 + 0.125) * this.frameSprite.height);
		this._hpBar.modified();
	}

	getHitWeapons(area: g.CommonArea): WeaponEntity[] {
		return this._weaponEntities.filter(w => w.isHit(area));
	}

	addWeapon(id: string): void {
		const weapon = weaponDataTable.get(id);
		const target = this._weaponEntities.find(w => w.assetId === weapon.assetId);
		if (target) {
			target.lvUp();
		}
	}

	updateHpBar(deltaHpBarWidth: number): void {
		this._hpBar.width += deltaHpBarWidth;

		if (this._hpBar.width < 0) {
			this._hpBar.width = 0;
		} else if (this._hpBar.width > this.frameSprite.width) {
			this._hpBar.width = this.frameSprite.width;
		}

		if (this._hpBar.width < 0.3 * this.frameSprite.width) {
			this._hpBar.cssColor = HP_BAR_COLOR_DANGER;
		} else {
			this._hpBar.cssColor = HP_BAR_COLOR_SAFETY;
		}

		this._hpBar.modified();
	}

	private _damageAnimation(reduceRate: number): void {
		this.frameSprite.opacity = DAMAGE_OPACITIES[g.game.age % DAMAGE_OPACITIES.length];
		this.frameSprite.modified();
		this.updateHpBar(-reduceRate * this.frameSprite.width);
	}

	private _recoveryAnimation(reduceRate: number): void {
		this.updateHpBar(reduceRate * this.frameSprite.width);
	}
}
