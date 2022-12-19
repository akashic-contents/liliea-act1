import { CharacterName } from "./Character";
import { WeaponType } from "./Weapon";

// 現状はフォロワー種別・武器種が固定
// global/dataTable と関係なくここで静的に定義しており、データと連動していないため注意:
export interface Score {
	typeToExp: { [key in WeaponType]: number };
	nameToNumFollowers: { [key in CharacterName]: number };
	damage: number;
}

export function makeScoreDefault(): Score {
	const typeToExp = {
		shot: 0,
		beam: 0,
		sword: 0,
		fire: 0,
		cold: 0,
		thunder: 0,
		space: 0
	};
	const nameToNumFollowers = {
		Liliea: 0,
		Moelu: 0,
		SumSum: 0,
		Billy: 0,
		Spaciea: 0,
		Hime: 0
	};
	return { typeToExp, nameToNumFollowers, damage: 0 };
}

// gameState.score に副作用あり:
export function addExp(score: Score, key: string, value: number): Score {
	let newScore = score;
	// FIXME: validation:
	let weaponType = key as WeaponType;
	if (newScore.typeToExp[weaponType] != null) {
		newScore.typeToExp[weaponType] += Math.floor(value);
	} else {
		newScore.typeToExp[weaponType] = Math.floor(value);
	}
	g.game.vars.gameState.score = getTotalScore(newScore);
	return newScore;
}

// gameState.score に副作用あり:
export function addNumFollowers(score: Score, key: string, value: number): Score {
	let newScore = score;
	// FIXME: validation:
	let name = key as CharacterName;
	if (newScore.nameToNumFollowers[name] != null) {
		newScore.nameToNumFollowers[name] += value;
	} else {
		newScore.nameToNumFollowers[name] = value;
	}
	g.game.vars.gameState.score = getTotalScore(newScore);
	return newScore;
}

// gameState.score に副作用あり:
export function addDamage(score: Score, value: number): Score {
	let newScore = score;
	newScore.damage += Math.floor(value);
	g.game.vars.gameState.score = getTotalScore(newScore);
	return newScore;
}

export function getTotalScore(score: Score): number {
	// Exp:
	let totalScore = Object.keys(score.typeToExp).reduce((prev: number, current: WeaponType) => prev + score.typeToExp[current], 0);

	// Follower bonus:
	totalScore += score.nameToNumFollowers.Moelu * score.typeToExp.fire;
	totalScore += score.nameToNumFollowers.SumSum * score.typeToExp.cold;
	totalScore += score.nameToNumFollowers.Billy * score.typeToExp.thunder;
	totalScore += score.nameToNumFollowers.Spaciea * score.typeToExp.space;

	// No damage bonus:
	if (score.damage < 100) {
		totalScore += (100 - score.damage) * 10;
	}

	return Math.floor(totalScore);
}
