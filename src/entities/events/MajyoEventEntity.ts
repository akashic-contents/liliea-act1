import { EventEntity, EventEntityParameterObject } from "./EventEntity";

type Cut = "feedin" | "demo" | "feedout";

export class MajyoEventEntity extends EventEntity {
	private currentCut: Cut = "feedin";

	constructor(param: EventEntityParameterObject) {
		super(param);
		this.onUpdate.add(this.onUpdateForEvent, this);
	}

	onUpdateForEvent(): void {
		if (this.currentCut === "feedout") {
			return;
		}

		// 画面暗くしてボスをフィールドに追加
		this.currentCut = "feedout";
		this.scene.setTimeout(() => this.onFinished(), 5000);
	}
}
