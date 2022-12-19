import { GAME_HEIGHT, GAME_WIDTH } from "../config";
import { makeScoreDefault, addExp, addNumFollowers, addDamage, Score } from "../types/Score";
import { calculateDamageValue } from "../util/calculate";
import { CharacterEntity } from "./CharacterEntity";
import { FollowerEntity } from "./FollowerEntity";
import { ItemEntity, PowerUpItemEntity, RecoveryItemEntity, WeaponItemEntity } from "./ItemEntity";
import { PlayableCharacterEntity } from "./PlayableCharacterEntity";

interface FieldEntityParameterObject extends g.EParameterObject {
	playerEntity: PlayableCharacterEntity;
	onFollowerAdded: (follower: FollowerEntity) => void;
}

type FieldStatus = "stopped" | "started";

export class FieldEntity extends g.E {
	private _status: FieldStatus = "started";
	private _score: Score = makeScoreDefault();

	private _tile: g.Sprite;
	private _tileArea: g.CommonArea;
	private _viewOffset: g.CommonOffset;

	private _followerLayer: g.E;
	private _enemyLayer: g.E;
	private _itemLayer: g.E;
	private _topLayer: g.E;

	private _playerEntity: PlayableCharacterEntity;
	private _followerEntities: FollowerEntity[] = [];
	private _enemyEntites: CharacterEntity[] = [];
	private _itemEntities: ItemEntity[] = [];

	private _onFollowerAdded: g.Trigger<FollowerEntity> = new g.Trigger<FollowerEntity>();

	constructor(param: FieldEntityParameterObject) {
		super(param);
		const scene = param.scene;

		this._tile = new g.Sprite({
			scene,
			src: scene.asset.getImageById("field1a"),
			touchable: true
		});
		this._tileArea = {
			x: 0,
			y: 0,
			width: this._tile.width,
			height: this._tile.height
		};
		this._viewOffset = { x: -param.x, y: -param.y };
		this._onFollowerAdded.add(param.onFollowerAdded);

		this._playerEntity = param.playerEntity;
		this._followerLayer = new g.E({ scene });
		this._enemyLayer = new g.E({ scene });
		this._itemLayer = new g.E({ scene });
		this._topLayer = new g.E({ scene });

		// 描画順設定:
		this.append(this._tile);

		this._tile.append(new g.Sprite({ scene, src: scene.asset.getImageById("field1b") }));

		this._tile.append(this._itemLayer);
		this._tile.append(this._enemyLayer);
		this._tile.append(this._followerLayer);
		this._tile.append(this._playerEntity);

		this._tile.append(new g.Sprite({ scene, src: scene.asset.getImageById("field1c"), opacity: 0.75 }));

		this._tile.append(this._topLayer);
	}

	get score(): Score {
		return this._score;
	}

	get viewOffset(): g.CommonOffset {
		return this._viewOffset;
	}

	get area(): g.CommonArea {
		return this._tileArea;
	}

	get tilePosition(): g.CommonOffset {
		return { x: this._tile.x, y: this._tile.y };
	}

	get playerEntity(): PlayableCharacterEntity {
		return this._playerEntity;
	}

	get followerEntities(): FollowerEntity[] {
		return this._followerEntities;
	}

	start(): void {
		this._status = "started";
		this._playerEntity.start();
		this._itemEntities.forEach(e => e.start());
		this._followerEntities.forEach(e => e.start());
		this._enemyEntites.forEach(e => e.start());
	}

	stop(): void {
		this._status = "stopped";
		this._playerEntity.stop();
		this._itemEntities.forEach(e => e.stop());
		this._followerEntities.forEach(e => e.stop());
		this._enemyEntites.forEach(e => e.stop());
	}

	appendTopLayer(e: g.E): void {
		this._topLayer.append(e);
	}

	registerFollower(follower: FollowerEntity): void {
		this._followerLayer.append(follower);
		this._followerEntities.push(follower);

		this._score = addNumFollowers(this._score, follower.name, 1);

		if (this._onFollowerAdded) {
			this._onFollowerAdded.fire(follower);
		}
	}

	registerEnemy(enemy: CharacterEntity, relativeOffset: g.CommonOffset): void {
		const offset = this._getSpawnOffset(relativeOffset, enemy.frameSprite.width, enemy.frameSprite.height, 100);
		enemy.putIn(offset);
		enemy.onUpdate.add(() => {
			if (enemy.animationStatus !== "move") {
				return;
			}

			const area = this._playerEntity.area;
			const x = area.x + 1.5 * g.game.random.generate() * area.width;
			const y = area.y + 1.5 * g.game.random.generate() * area.height;
			enemy.moveToTarget({ x, y }, this._tileArea);

			this._playerEntity.getHitWeapons(enemy.area).forEach(w => {
				const damage = calculateDamageValue(this._playerEntity, enemy, w);
				enemy.reduceHp(damage);
				w.effect(enemy);
			});

			this._followerEntities.forEach(e =>
				e.getHitWeapons(enemy.area).forEach(w => {
					const damage = calculateDamageValue(e, enemy, w);
					enemy.reduceHp(damage);
					w.effect(enemy);
				})
			);

			if (
				g.Collision.intersectAreas(enemy.area, area) &&
				!this._playerEntity.isDamaged &&
				!this._playerEntity.isRecoverd &&
				!enemy.isDied()
			) {
				this.scene.asset.getAudioById("se_damage").play();
				const damage = this._playerEntity.damage(enemy);
				this._score = addDamage(this._score, damage);
			}
			if (enemy.isDied()) {
				enemy.bomb(() => {
					// アイテムドロップ:
					const dropItem = enemy.dropItem();
					this.registerItem(dropItem, enemy.offset, () => {
						if (dropItem.type === "powerup") {
							const powerupItem = dropItem as PowerUpItemEntity;
							this.powerUpPlayerEntity(powerupItem);
							addExp(this._score, powerupItem.expType, powerupItem.expValue);
						}
					});
					// 消去:
					this._enemyEntites = this._enemyEntites.filter(e => e !== enemy);
					enemy.destroy();
				});
			}
		});
		this._enemyLayer.append(enemy);
		this._enemyEntites.push(enemy);
	}

	registerItem(item: ItemEntity, offset: g.CommonOffset, func: () => void): void {
		item.putIn(offset);
		item.onUpdate.add(() => {
			if (item.inhaleSpeed <= this._playerEntity.speed * 2) {
				item.inhaleSpeed += 0.5;
			}
			item.moveToTarget(this._playerEntity.offset, null);
			if (g.Collision.intersectAreas(item.area, this._playerEntity.area)) {
				const sePlayer = this.scene.asset.getAudioById("se_item").play();
				sePlayer.changeVolume(0.5);
				func();
				this._itemEntities = this._itemEntities.filter(i => i !== item);
				item.destroy();
			}
		});
		this._itemLayer.append(item);
		this._itemEntities.push(item);
	}

	movePlayerEntity(targetOffset: g.CommonOffset): g.CommonOffset {
		const prev = this._playerEntity.moveToTarget(targetOffset, this._tileArea);
		return this.moveViewOffset(prev.x, prev.y);
	}

	powerUpPlayerEntity(item: PowerUpItemEntity): void {
		this._playerEntity.powerUp(item);
		this._followerEntities.forEach(e => e.powerUp(item));
	}

	addPlayerWeapon(item: WeaponItemEntity): void {
		this._playerEntity.addWeapon(item.weaponId);
		this._followerEntities.forEach(e => e.addWeapon(item.weaponId));
	}

	addRecoveryItem(item: RecoveryItemEntity): void {
		this._playerEntity.recover(item);
	}

	isPlayerDied(): boolean {
		return this._playerEntity.isDied();
	}

	updateViewOffset(offset: g.CommonOffset, tilePosition: g.CommonOffset): void {
		this._viewOffset = offset;
		this._tile.x = tilePosition.x;
		this._tile.y = tilePosition.y;
		this._tile.modified();
	}

	updatePlayerEntity(player: PlayableCharacterEntity): void {
		const offset = this._playerEntity.offset;
		this._tile.insertBefore(player, this._playerEntity);
		this._playerEntity.frameSprite.destroy();
		this._playerEntity = player;
		this._playerEntity.putIn(offset);
	}

	moveViewOffset(dx: number, dy: number): g.CommonOffset {
		const diff = { x: 0, y: 0 };
		const afterX = this._viewOffset.x + dx;
		const afterY = this._viewOffset.y + dy;
		const xThreshold = 0.4 * GAME_WIDTH;
		const yThreshold = 0.4 * GAME_HEIGHT;
		if (
			0 <= afterX &&
			afterX + g.game.width <= this._tile.width &&
			xThreshold <= this._playerEntity.offset.x &&
			this._playerEntity.offset.x <= this._tileArea.width - xThreshold
		) {
			this._tile.x -= dx;
			this._viewOffset.x = afterX;
			diff.x = dx;
		}
		if (
			0 <= afterY &&
			afterY + g.game.height <= this._tile.height &&
			yThreshold <= this._playerEntity.offset.y &&
			this._playerEntity.offset.y <= this._tileArea.height - yThreshold
		) {
			this._tile.y -= dy;
			this._viewOffset.y = afterY;
			diff.y = dy;
		}
		this._tile.invalidate();
		return diff;
	}

	private _getSpawnOffset(relativeOffset: g.CommonOffset, width: number, height: number, randomRange: number): g.CommonOffset {
		let x = this._playerEntity.offset.x + relativeOffset.x + 2 * randomRange * g.game.random.generate() - randomRange;
		if (x < this._tileArea.x) {
			x = this._tileArea.x;
		} else if (x > this._tileArea.x + this._tileArea.width - width) {
			x = this._tileArea.x + this._tileArea.width - width;
		}
		let y = this._playerEntity.offset.y + relativeOffset.y + 2 * randomRange * g.game.random.generate() - randomRange;
		if (y < this._tileArea.y) {
			y = this._tileArea.y;
		} else if (y > this._tileArea.y + this._tileArea.height - height) {
			y = this._tileArea.y + this._tileArea.height - height;
		}
		return { x, y };
	}
}
