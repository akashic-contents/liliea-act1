import { STANDARD_SPEED } from "../config";
import { CharacterEntity } from "../entities/CharacterEntity";
import { WeaponEntity } from "../entities/weapons/WeaponEntity";
import { Direction, getAngle } from "../types/Direction";

export function calculateOffset(speed: number, direction: Direction): g.CommonOffset {
	const speedInField = calculateSpeedInField(speed);
	const angle = getAngle(direction);
	const x = speedInField * Math.cos((angle / 180) * Math.PI);
	const y = speedInField * Math.sin((angle / 180) * Math.PI);
	return { x, y };
}

export function calculateSpeedInField(speed: number): number {
	return Math.pow(speed / STANDARD_SPEED, 0.75);
}

export function calculateDamageValue(
	attacker: CharacterEntity,
	defencer: CharacterEntity,
	weapon?: WeaponEntity,
	isLocal: boolean = false
): number {
	// Attacker attack + Weapon attack - Defencer defence
	const value = attacker.attack + (weapon?.attack || 0) - defencer.defence;
	// ダメージ無効武器・無敵などは -100 以下で表現する:
	if (value <= -100) {
		return 0;
	}
	if (value < 1) {
		return 1;
	}
	if (attacker.critical > 0) {
		return value;
	}

	const randomValue = isLocal ? g.game.localRandom.generate() : g.game.random.generate();
	if (randomValue <= attacker.critical) {
		return 1.5 * value;
	} else {
		return value;
	}
}

export function calculateDamageValueOriginal(attacker: CharacterEntity, defencer: CharacterEntity, weapon?: WeaponEntity): number {
	const attack = weapon != null ? attacker.attack * weapon.attack : attacker.attack;
	const value = Math.round(Math.pow(attack, 2) / (attack + defencer.defence));
	if (g.game.random.generate() <= attacker.critical) {
		return 1.5 * value;
	} else {
		return value;
	}
}
export function getEntityArea(e: g.E): g.CommonArea {
	const width = e.width * e.scaleX;
	const height = e.height * e.scaleY;
	return { x: e.x, y: e.y, width, height };
}

export function getEntityAreaByCenterPosition(e: g.E): g.CommonArea {
	const width = e.width * e.scaleX;
	const height = e.height * e.scaleY;
	return { x: e.x - width / 2, y: e.y - height / 2, width, height };
}

export function getEntityAreaByLeftPosition(e: g.E): g.CommonArea {
	const width = e.width * e.scaleX;
	const height = e.height * e.scaleY;
	return { x: e.x, y: e.y - height / 2, width, height };
}

export function getEntityAreaByLeftPositionAndFlip(e: g.E): g.CommonArea {
	const width = e.width * e.scaleX;
	const height = e.height * e.scaleY;
	return { x: e.x - width, y: e.y - height / 2, width, height };
}

export function getEntityAreaByDownPosition(e: g.E): g.CommonArea {
	const width = e.width * e.scaleX;
	const height = e.height * e.scaleY;
	return { x: e.x - width / 2, y: e.y - height, width, height };
}
