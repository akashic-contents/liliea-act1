export type EventType = "opening" | "fallingFollower" | "majyo";

export interface Event {
	type: EventType;
	description: string;
}

export interface Opening extends Event {
	type: "opening";
}

export interface FallingFollower extends Event {
	type: "fallingFollower";
	range: number;
}

export interface Majyo extends Event {
	type: "majyo";
}
