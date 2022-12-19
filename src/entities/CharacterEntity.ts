import { Timeline, Easing } from "@akashic-extension/akashic-timeline";
import { DEFAULT_ANIMATION_INTERVAL, GAME_HEIGHT, GAME_WIDTH } from "../config";
import { itemDataTable, dropItemDataTable } from "../global/dataTable";
import { WeaponType } from "../global/weapon";
import { Character, CharacterStatus } from "../types/Character";
import { Direction, DIRECTIONS } from "../types/Direction";
import { calculateOffset, calculateSpeedInField } from "../util/calculate";
import { createItemEntity, ItemEntity, PowerUpItemEntity } from "./ItemEntity";

export interface CharacterEntityParameterObject extends g.FrameSpriteParameterObject {
	data: Character;
}

export const RIGHT_MOVING = [7, 8, 7, 6];
export const LEFT_MOVING = [4, 5, 4, 3];
export const UP_MOVING = [10, 11, 10, 9];
export const DOWN_MOVING = [1, 2, 1, 0];

export type AnimationStatus = "move" | "stop" | "die";

export class CharacterEntity extends g.E {
	private _data: Character;
	private _currentHp: number;
	private _speedMultiplier: number = 1;
	private _frameSprite: g.FrameSprite;
	private _direction: Direction = "RIGHT";
	private _timeline: Timeline;
	private _animationStatus: AnimationStatus = "move";

	constructor(param: CharacterEntityParameterObject) {
		super(param);
		this._data = param.data;
		if (!this._data.status.expWeaponTable) {
			(this._data.status.expWeaponTable as any) = {};
		}
		this._currentHp = param.data.status.hp;
		this._frameSprite = this.createFrameSprite(param);
		this._frameSprite.start();
		this._timeline = new Timeline(this.scene);
		this.append(this._frameSprite);
	}

	get name(): string {
		return this._data.name;
	}

	get maxHP(): number {
		return this._data.status.hp;
	}

	get currentHP(): number {
		return this._currentHp;
	}

	get status(): CharacterStatus {
		return this._data.status;
	}

	get attack(): number {
		return this._data.status.attack;
	}

	get defence(): number {
		return this._data.status.defence;
	}

	get speed(): number {
		return this._data.status.speed * this._speedMultiplier;
	}

	get critical(): number {
		return this._data.status.critical;
	}

	get direction(): Direction {
		return this._direction;
	}

	get offset(): g.CommonOffset {
		return {
			x: this._frameSprite.x,
			y: this._frameSprite.y
		};
	}

	get area(): g.CommonArea {
		return {
			x: this._frameSprite.x - this._frameSprite.width * 0.4,
			y: this._frameSprite.y - this._frameSprite.height * 0.4,
			width: this._frameSprite.width * 0.8,
			height: this._frameSprite.height * 0.8
		};
	}

	get frameSprite(): g.FrameSprite {
		return this._frameSprite;
	}

	get animationStatus(): AnimationStatus {
		return this._animationStatus;
	}

	getExpWeapon(weaponType: WeaponType): number {
		return this._data.status?.expWeaponTable[weaponType] ?? 0;
	}

	addExpWeapon(weaponType: WeaponType, exp: number): void {
		const nowValue = this.getExpWeapon(weaponType);
		if (!nowValue) {
			this._data.status.expWeaponTable[weaponType] = 0;
		}
		this._data.status.expWeaponTable[weaponType] += exp;
	}

	start(): void {
		this._animationStatus = "move";
	}

	stop(): void {
		this._animationStatus = "stop";
	}

	updateSpeedMultiplier(speedMlutiplier: number): void {
		this._speedMultiplier = speedMlutiplier;
	}

	createFrameSprite(param: CharacterEntityParameterObject): g.FrameSprite {
		const character = new g.FrameSprite({
			scene: param.scene,
			src: param.src,
			width: param.width,
			height: param.height,
			x: param.x ?? GAME_WIDTH / 2,
			y: param.y ?? GAME_HEIGHT / 2,
			anchorX: 0.5,
			anchorY: 0.5,
			frames: param.frames ?? RIGHT_MOVING,
			interval: param.interval ?? DEFAULT_ANIMATION_INTERVAL,
			touchable: param.touchable ?? false
		});
		const shadow = new g.Sprite({
			scene: param.scene,
			src: param.scene.asset.getImageById("shadow_character"),
			x: param.width / 2,
			y: param.height / 2,
			anchorX: 0.5,
			anchorY: 0.5,
			opacity: 0.4,
			touchable: param.touchable ?? false
		});
		// 本来は下に表示したいがとりあえず子にする:
		character.append(shadow);
		return character;
	}

	reduceHp(value: number): void {
		this._currentHp -= value;
		if (this._currentHp < 0) {
			this._currentHp = 0;
		}
	}

	recoverHp(value: number): void {
		this._currentHp += value;
		if (this._currentHp > this.maxHP) {
			this._currentHp = this.maxHP;
		}
	}

	isDied(): boolean {
		return this._currentHp <= 0;
	}

	// speed関係なく指定された分移動するだけのメソッド
	move(dx: number, dy: number): void {
		if (this._animationStatus !== "move") {
			return;
		}

		this._frameSprite.moveBy(dx, dy);
		this.updateDirectionAfterMoved(dx, dy);
		this._frameSprite.modified();
	}

	updateDirectionAfterMoved(dx: number, dy: number): void {
		if (dx > 0) {
			this._frameSprite.frames = RIGHT_MOVING;
			if (dy > 0) {
				this._direction = "RIGHT_DOWN";
			} else if (dy < 0) {
				this._direction = "RIGHT_UP";
			} else {
				this._direction = "RIGHT";
			}
		} else if (dx < 0) {
			this._frameSprite.frames = LEFT_MOVING;
			if (dy > 0) {
				this._direction = "LEFT_DOWN";
			} else if (dy < 0) {
				this._direction = "LEFT_UP";
			} else {
				this._direction = "LEFT";
			}
		} else {
			if (dy > 0) {
				this._direction = "DOWN";
				this._frameSprite.frames = DOWN_MOVING;
			} else {
				this._direction = "UP";
				this._frameSprite.frames = UP_MOVING;
			}
		}
	}

	moveToTarget(target: g.CommonOffset, range: g.CommonArea | null, speedOffset: number = 0): g.CommonOffset {
		if (this._animationStatus !== "move") {
			return { x: 0, y: 0 };
		}

		const currentX: number = this._frameSprite.x + this._frameSprite.width / 2;
		const currentY: number = this._frameSprite.y + this._frameSprite.height / 2;
		const radian = Math.atan2(target.y - currentY, target.x - currentX);
		const speed = calculateSpeedInField(this.speed + speedOffset);
		const dx = Math.round(speed * Math.cos(radian));
		const dy = Math.round(speed * Math.sin(radian));

		if (!range) {
			this.move(dx, dy);
			return { x: dx, y: dy };
		}

		if (
			range.x <= this._frameSprite.x + dx &&
			this._frameSprite.x + this._frameSprite.width + dx <= range.x + range.width &&
			range.y <= this._frameSprite.y + dy &&
			this._frameSprite.y + this._frameSprite.height + dy <= range.y + range.height
		) {
			this.move(dx, dy);
			return { x: dx, y: dy };
		} else {
			return { x: 0, y: 0 };
		}
	}

	putIn(offset: g.CommonOffset): void {
		this._frameSprite.moveTo(offset);
		this._frameSprite.modified();
	}

	powerUp(item: PowerUpItemEntity): void {
		this._data.status = {
			hp: this._data.status.hp,
			attack: this._data.status.attack + item.attack,
			defence: this._data.status.defence + item.defence,
			speed: this._data.status.speed + item.speed,
			critical: this._data.status.critical + item.critical,
			expWeaponTable: this._data.status.expWeaponTable
		};
		this.addExpWeapon(item.expType, item.expValue);
	}

	dropItem(): ItemEntity | null {
		// TODO: マルチプレイ化
		const isLocal = false;
		const itemTable = dropItemDataTable.get("character");
		const index = Math.floor(isLocal ? g.game.localRandom.generate() : g.game.random.generate() * itemTable.length);
		const item = itemDataTable.get(itemTable[index]);
		const entity = createItemEntity({
			scene: this.scene,
			src: this.scene.asset.getImageById(item.assetId),
			data: item
		});
		return entity;
	}

	shake(strength: number = 20): void {
		// TODO: ノックバック耐性が上回る場合はスキップ:
		this._animationStatus = "stop";

		const interval = 1000 / g.game.fps;
		const back = DIRECTIONS[(DIRECTIONS.indexOf(this.direction) + 4) % DIRECTIONS.length];
		const delta = calculateOffset(strength, back);
		const delta2 = { x: delta.x * 2, y: delta.y * 2 };
		const reverseDelta = { x: delta.x * -1, y: delta.y * -1 };
		const reverseDelta2 = { x: delta.x * -2, y: delta.y * -2 };

		this._timeline.cancelAll();
		const tween = this._timeline.create(this._frameSprite);
		tween
			.by(delta, 0)
			.by(reverseDelta2, interval)
			.by(delta2, interval)
			.by(reverseDelta, interval)
			.by(delta, interval)
			.by(reverseDelta, interval)
			.call(() => {
				this._animationStatus = "move";
				this._timeline.remove(tween);
			});
	}

	bomb(callback: () => void, strength: number = 100): void {
		if (this._animationStatus === "die") {
			return;
		}

		this._animationStatus = "die";

		// ノックバック:
		const back = DIRECTIONS[(DIRECTIONS.indexOf(this.direction) + 4) % DIRECTIONS.length];
		const delta = calculateOffset(strength, back);
		const delta2 = { x: delta.x * 2, y: delta.y * 2 };
		const reverseDelta = { x: delta.x * -1, y: delta.y * -1 };
		const reverseDelta2 = { x: delta.x * -2, y: delta.y * -2 };

		const spriteWidth = 32;
		const spriteHeight = 32;
		const scaleX = this.frameSprite.width / spriteWidth;
		const scaleY = this.frameSprite.height / spriteHeight;
		const interval = 1000 / g.game.fps;

		const effect = new g.FrameSprite({
			src: this.scene.asset.getImageById("bomb2"),
			scene: this.scene,
			x: (spriteWidth / 2) * scaleX,
			y: (spriteHeight / 2) * scaleY,
			width: spriteWidth,
			height: spriteWidth,
			srcWidth: spriteWidth,
			srcHeight: spriteHeight,
			scaleX,
			scaleY,
			anchorX: 0.5,
			anchorY: 0.5,
			opacity: 0.5,
			frames: [0, 1, 2, 3, 4]
		});

		this._timeline.cancelAll();
		this._timeline
			.create(this._frameSprite)
			.scaleTo(1.6, 1.6, interval * 2)
			.scaleTo(1.0, 1.0, interval * 3)
			.call(() => {
				effect.start();
				this._frameSprite.append(effect);
				this._frameSprite.modified();
			})
			.con()
			.by(delta, interval * 2)
			.by(reverseDelta2, interval * 2)
			.by(delta2, interval * 2)
			.by(reverseDelta, interval * 2)
			.by(delta, interval)
			.by(reverseDelta, interval)
			.call(() => {
				effect.destroy();
				callback();
			});
	}

	showLevelUp(): void {
		const effect = new g.Sprite({
			src: this.scene.asset.getImageById("levelup"),
			scene: this.scene,
			anchorX: 0.5,
			anchorY: 0.5,
			x: 0,
			y: 0
		});
		this._frameSprite.append(effect);
		const tween = this._timeline.create(effect);
		tween
			.moveBy(0, -16, 200, Easing.easeOutCubic)
			.con()
			.scaleTo(1.2, 1.2, 200, Easing.easeOutCubic)
			.moveBy(0, -16, 200, Easing.easeInCubic)
			.con()
			.scaleTo(1.0, 1.0, 200, Easing.easeInCubic)
			.call(() => {
				effect.destroy();
				this._timeline.remove(tween);
			});
	}
}
