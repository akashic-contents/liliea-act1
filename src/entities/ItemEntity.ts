import { Timeline, Tween, Easing } from "@akashic-extension/akashic-timeline";
import { DEFAULT_ANIMATION_INTERVAL } from "../config";
import { WeaponType } from "../global/weapon";
import { ExpItem, Item, ItemType, PowerUpItem, RecoveryItem, ScoreItem, WeaponItem, FollowerItem } from "../types/Item";
import { calculateSpeedInField, getEntityArea } from "../util/calculate";

type ItemStatus = "stopped" | "started";

export interface ItemEntityParmeterObject extends g.SpriteParameterObject {
	data: Item;
}

export interface RecoveryItemEntityParmeterObject extends ItemEntityParmeterObject {
	data: RecoveryItem;
}

export interface PowerUpItemEntityParmeterObject extends ItemEntityParmeterObject {
	data: PowerUpItem;
}

export interface ExpItemEntityParmeterObject extends ItemEntityParmeterObject {
	data: ExpItem;
}

export interface ScoreItemEntityParmeterObject extends ItemEntityParmeterObject {
	data: ScoreItem;
}

export interface WeaponItemEntityParmeterObject extends ItemEntityParmeterObject {
	data: WeaponItem;
}

export interface FollowerItemEntityParmeterObject extends ItemEntityParmeterObject {
	data: FollowerItem;
}

export abstract class ItemEntity extends g.E {
	abstract type: ItemType;
	protected _data: Item;
	protected _sprite: g.Sprite;
	private _status: ItemStatus = "started";
	private _speed: number = 20;

	constructor(param: ItemEntityParmeterObject) {
		super(param);
		this._data = param.data;
		this._sprite = this.createSprite(param);
		this.append(this._sprite);
	}

	get sprite(): g.Sprite {
		return this._sprite;
	}

	get name(): string {
		return this._data.name;
	}

	get describe(): string {
		return this._data.describe;
	}

	get inhaleSpeed(): number {
		return this._speed;
	}

	set inhaleSpeed(speed: number) {
		this._speed = speed;
	}

	get area(): g.CommonArea {
		return getEntityArea(this._sprite);
	}

	start(): void {
		this._status = "started";
	}

	stop(): void {
		this._status = "stopped";
	}

	moveToTarget(target: g.CommonOffset, range: g.CommonArea | null, speedOffset: number = 0): g.CommonOffset {
		if (this._status !== "started") {
			return { x: 0, y: 0 };
		}

		const currentX = this._sprite.x + this._sprite.width / 2;
		const currentY = this._sprite.y + this._sprite.height / 2;
		const radian = Math.atan2(target.y - currentY, target.x - currentX);
		const speed = calculateSpeedInField(this.inhaleSpeed + speedOffset);
		const dx = Math.round(speed * Math.cos(radian));
		const dy = Math.round(speed * Math.sin(radian));

		if (!range) {
			this.move(dx, dy);
			return { x: dx, y: dy };
		}

		if (
			range.x <= this._sprite.x + dx &&
			this._sprite.x + this._sprite.width + dx <= range.x + range.width &&
			range.y <= this._sprite.y + dy &&
			this._sprite.y + this._sprite.height + dy <= range.y + range.height
		) {
			this.move(dx, dy);
			return { x: dx, y: dy };
		} else {
			return { x: 0, y: 0 };
		}
	}

	// speed関係なく指定された分移動するだけのメソッド
	move(dx: number, dy: number): void {
		if (this._status !== "started") {
			return;
		}

		this._sprite.moveBy(dx, dy);
		this._sprite.modified();
	}

	putIn(offset: g.CommonOffset): void {
		this._sprite.moveTo(offset);
		this._sprite.modified();
	}

	createSprite(param: ItemEntityParmeterObject): g.Sprite {
		if (param.data.spriteType === "frameSprite") {
			// 横並べ正方形のみとする:
			const spriteWidth = param.src.height;
			const spriteHeight = param.src.height;
			const numFrames = param.src.width / param.src.height;
			const sprite = new g.FrameSprite({
				scene: param.scene,
				src: param.src,
				width: spriteWidth,
				height: spriteHeight,
				srcWidth: spriteWidth,
				srcHeight: spriteHeight,
				anchorX: 0.5,
				anchorY: 0.5,
				frames: Array.from(Array(numFrames).keys()),
				interval: DEFAULT_ANIMATION_INTERVAL
			});
			sprite.start();
			return sprite;
		} else {
			return new g.Sprite({
				scene: param.scene,
				src: param.src,
				anchorX: 0.5,
				anchorY: 0.5,
				width: param.width,
				height: param.height
			});
		}
	}
}

export class RecoveryItemEntity extends ItemEntity {
	type: ItemType = "recovery";
	protected _data: RecoveryItem;

	constructor(param: RecoveryItemEntityParmeterObject) {
		super(param);
	}

	recover(hp: number): number {
		switch (this._data.recoveryType) {
			case "fixed":
				return this._data.recoveryValue;
			case "ratio":
				return this._data.recoveryValue * hp;
		}
	}
}

export class PowerUpItemEntity extends ItemEntity {
	type: ItemType = "powerup";
	protected _data: PowerUpItem;

	constructor(param: PowerUpItemEntityParmeterObject) {
		super(param);
	}

	get expType(): WeaponType {
		return this._data.expType;
	}

	get expValue(): number {
		return this._data.expValue;
	}

	get attack(): number {
		return this._data.attack;
	}

	get defence(): number {
		return this._data.defence;
	}

	get speed(): number {
		return this._data.speed;
	}

	get critical(): number {
		return this._data.critical;
	}
}

export class ExpItemEntity extends ItemEntity {
	type: ItemType = "exp";
	protected _data: ExpItem;

	constructor(param: ExpItemEntityParmeterObject) {
		super(param);
	}

	get exp(): number {
		return this._data.value;
	}
}

export class ScoreItemEntity extends ItemEntity {
	type: ItemType = "score";
	protected _data: ScoreItem;

	constructor(param: ScoreItemEntityParmeterObject) {
		super(param);
	}

	get score(): number {
		return this._data.score;
	}
}

export class WeaponItemEntity extends ItemEntity {
	type: ItemType = "weapon";
	protected _data: WeaponItem;

	constructor(param: WeaponItemEntityParmeterObject) {
		super(param);
	}

	get weaponId(): string {
		return this._data.weaponId;
	}
}

export class FollowerItemEntity extends ItemEntity {
	type: ItemType = "follower";
	protected _data: FollowerItem;
	private _timeline: Timeline;
	private _tween: Tween;

	constructor(param: FollowerItemEntityParmeterObject) {
		super(param);
		this._timeline = new Timeline(param.scene);
		this._tween = this._timeline.create(this.sprite, { loop: true });
		this.scene.setTimeout(() => {
			this._tween
				.wait(2000)
				.rotateBy(180, 200, Easing.easeOutCubic)
				.con()
				.moveBy(0, -16, 200, Easing.easeOutCubic)
				.rotateBy(180, 200, Easing.easeOutCubic)
				.con()
				.moveBy(0, 16, 200, Easing.easeInCubic)
				.wait(500)
				.rotateBy(180, 200, Easing.easeOutCubic)
				.con()
				.moveBy(0, -16, 200, Easing.easeOutCubic)
				.rotateBy(180, 200, Easing.easeOutCubic)
				.con()
				.moveBy(0, 16, 200, Easing.easeInCubic)
				.wait(2000);
		}, 2000);
	}

	get inhaleSpeed(): number {
		// 吸い込みなし:
		return 0;
	}

	set inhaleSpeed(_speed: number) {
		// do nothing
	}

	get characterId(): string {
		return this._data.characterId;
	}
}

export function createItemEntity(param: ItemEntityParmeterObject): ItemEntity {
	switch (param.data.type) {
		case "exp":
			return new ExpItemEntity(param as ExpItemEntityParmeterObject);
		case "powerup":
			return new PowerUpItemEntity(param as PowerUpItemEntityParmeterObject);
		case "recovery":
			return new RecoveryItemEntity(param as RecoveryItemEntityParmeterObject);
		case "score":
			return new ScoreItemEntity(param as ScoreItemEntityParmeterObject);
		case "weapon":
			return new WeaponItemEntity(param as WeaponItemEntityParmeterObject);
		case "follower":
			return new FollowerItemEntity(param as FollowerItemEntityParmeterObject);
		default:
			throw new Error("Invalid item type:" + param.data.type);
	}
}
