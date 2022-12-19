import { DeadEventEntity } from "../entities/events/DeadEventEntity";
import { DebugEventEntity } from "../entities/events/DebugEventEntity";
import { EventEntity } from "../entities/events/EventEntity";
import { FollowerFallingEventEntity } from "../entities/events/FollowerFallingEventEntity";
import { MajyoEventEntity } from "../entities/events/MajyoEventEntity";
import { OpeningEventEntity } from "../entities/events/OpeningEventEntity";
import { SimplifyFollowerFallingEventEntity } from "../entities/events/SimplifyFollowerFallingEventEntity";
import { FieldEntity } from "../entities/FieldEntity";

export function createEventEntity(scene: g.Scene, id: string, field: FieldEntity, onFinished: (e: EventEntity) => void): EventEntity {
	switch (id) {
		case "opening":
			return new OpeningEventEntity({ scene, field, onFinished });
		case "fallingFollower":
			return new FollowerFallingEventEntity({ scene, field, onFinished });
		case "simplifyFallingFollower":
			return new SimplifyFollowerFallingEventEntity({ scene, field, onFinished });
		case "majyo":
			return new MajyoEventEntity({ scene, field, onFinished });
		case "dead":
			return new DeadEventEntity({ scene, field, onFinished });
		case "debug":
			return new DebugEventEntity({ scene, field, onFinished });
		default:
			throw new Error(`${id} is not found.`);
	}
}
