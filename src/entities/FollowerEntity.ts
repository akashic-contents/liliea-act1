import { weaponDataTable } from "../global/dataTable";
import { createWeaponEntity } from "../global/weapon";
import { AnimationStatus, CharacterEntity, CharacterEntityParameterObject } from "./CharacterEntity";
import { PowerUpItemEntity } from "./ItemEntity";
import { PlayableCharacterEntity } from "./PlayableCharacterEntity";
import { WeaponEntity } from "./weapons/WeaponEntity";

export interface FollowerEntityParameterObject extends CharacterEntityParameterObject {
	followee: PlayableCharacterEntity;
	numOrdinal: number; // 並び順: プレイヤーを追尾する順序
	weaponIds: string[];
	offsetFormation?: g.CommonOffset; // 隊列オフセット: 省略時はプレイヤーの位置に追従
}

export class FollowerEntity extends CharacterEntity {
	private _followee: PlayableCharacterEntity;
	private _relativePositionHistoryIndex: number;
	private _lastPositionHistoryIndex: number;
	private _weaponEntities: WeaponEntity[];
	private _offsetFormation: g.CommonOffset;
	private _lastAnimationStatus: AnimationStatus;

	constructor(param: FollowerEntityParameterObject) {
		super(param);
		this._followee = param.followee;

		// 追従のためフォロイーの行動履歴を OFFSET 込みで参照し自身の位置とする
		// 身体一つ分ほどあけて追従:
		const relativeIndex = -(param.numOrdinal + 1) * 16;
		this._relativePositionHistoryIndex = Math.min(
			param.followee.positionHistoryLength + relativeIndex,
			param.followee.positionHistoryLength
		);
		this._lastPositionHistoryIndex = this.positionHistoryIndex;

		this._offsetFormation = param.offsetFormation || {
			x: this.frameSprite.width / 2,
			y: this.frameSprite.height / 2
		};

		this._weaponEntities = param.weaponIds.map(id => {
			const entity = createWeaponEntity(param.scene, id);
			this.append(entity);
			return entity;
		});

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
			this.chaseFollower();
		});
	}

	get positionHistoryIndex(): number {
		return (this._followee.positionHistoryIndex + this._relativePositionHistoryIndex) % this._followee.positionHistoryLength;
	}

	powerUp(item: PowerUpItemEntity): void {
		super.powerUp(item);
		this._weaponEntities.forEach(w => {
			if (w.type === item.expType) {
				if (w.expUp(item.expValue)) {
					this.showLevelUp();
				}
			}
		});
	}

	addWeapon(id: string): void {
		const weapon = weaponDataTable.get(id);
		const target = this._weaponEntities.find(w => w.assetId === weapon.type);
		if (target) {
			target.lvUp();
		}
	}

	getHitWeapons(area: g.CommonArea): WeaponEntity[] {
		return this._weaponEntities.filter(w => w.isHit(area));
	}

	chaseFollower(): void {
		const newIndex = this.positionHistoryIndex;
		if (newIndex === this._lastPositionHistoryIndex) {
			return;
		}

		const newPosition = this._followee.getPositionHistory(newIndex);
		if (newPosition) {
			this.moveToTarget(
				{
					x: newPosition.x + this._offsetFormation.x,
					y: newPosition.y + this._offsetFormation.y
				},
				null
			);
			this._lastPositionHistoryIndex = newIndex;
		}
	}
}
