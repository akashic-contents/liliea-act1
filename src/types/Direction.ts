// キャラクターの現在の向きを表す型
// TODO: DIRECTIONSの各値をビット演算で表現できるようにしたい
export const DIRECTIONS = ["RIGHT", "RIGHT_DOWN", "DOWN", "LEFT_DOWN", "LEFT", "LEFT_UP", "UP", "RIGHT_UP"] as const;
export type Direction = typeof DIRECTIONS[number];
export function getAngle(d: Direction): number {
	return 45 * DIRECTIONS.indexOf(d);
}
