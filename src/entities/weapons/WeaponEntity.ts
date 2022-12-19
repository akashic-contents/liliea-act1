import { Direction } from "../../types/Direction";
import { WeaponType, Weapon } from "../../types/Weapon";
import { CharacterEntity } from "../CharacterEntity";

export interface WeaponEntityParameterObject extends g.EParameterObject {
	data: Weapon;
}

export const WEAPON_MIN_LEVEL = 1;
export const WEAPON_MAX_LEVEL = 7;

export const DEFAULT_EXP_TABLE = [5, 20, 40, 70, 130, 180, Number.MAX_VALUE];

type WeponStatus = "stopped" | "started";

export abstract class WeaponEntity extends g.E {
	protected _lv: number = WEAPON_MIN_LEVEL;
	protected _exp: number = 0;
	protected _attack: number = 0;
	protected _knockback: number = 0;
	protected _rigidity: number = 0;
	private _status: WeponStatus = "started";
	private _offset: g.CommonOffset = { x: 0, y: 0 };
	private _direction: Direction = "RIGHT";
	private _assetId: string;
	private _name: string;
	private _type: WeaponType;

	constructor(param: WeaponEntityParameterObject) {
		super(param);
		this._assetId = param.data.assetId;
		this._name = param.data.name;
		this._type = param.data.type;
		this.onUpdate.add(() => {
			if (this._status === "started") {
				this._animation();
			}
		}, this);
	}

	get type(): WeaponType {
		return this._type;
	}

	get assetId(): string {
		return this._assetId;
	}

	get name(): string {
		return this._name;
	}

	get offset(): g.CommonOffset {
		return this._offset;
	}

	set offset(o: g.CommonOffset) {
		this._offset = o;
	}

	get direction(): Direction {
		return this._direction;
	}

	set direction(d: Direction) {
		this._direction = d;
	}

	get lv(): number {
		return this._lv;
	}

	get exp(): number {
		return this._exp;
	}

	get attack(): number {
		return this._attack;
	}

	get knockback(): number {
		return this._knockback;
	}

	get rigidity(): number {
		return this._rigidity;
	}

	start(): void {
		this._status = "started";
	}

	stop(): void {
		this._status = "stopped";
	}

	getExpTable(): number[] {
		return DEFAULT_EXP_TABLE;
	}

	expUp(exp: number = 1): boolean {
		let isLevelup = false;
		this._exp += exp;
		while (this._exp >= this.getExpTable()[this._lv - 1]) {
			this.lvUp();
			isLevelup = true;
		}
		return isLevelup;
	}

	lvUp(level: number = 1): void {
		this._lv += level;
		if (this._lv > WEAPON_MAX_LEVEL) {
			this._lv = WEAPON_MAX_LEVEL;
		}
		this._powerUp();
	}

	effect(target: CharacterEntity): void {
		target.shake(this.knockback);
	}

	abstract isHit(area: g.CommonArea): boolean;

	protected abstract _powerUp(): void;

	protected abstract _animation(): void;
}
