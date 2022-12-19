import { FieldEntity } from "../FieldEntity";

export interface EventEntityParameterObject extends g.EParameterObject {
	field: FieldEntity;
	onFinished: (entity: EventEntity) => void;
}

export type EventStatus = "started" | "stopped";

export class EventEntity extends g.E {
	private _status: EventStatus = "started";
	private _field: FieldEntity;
	private _onFinished: (entity: EventEntity) => void;

	constructor(param: EventEntityParameterObject) {
		super(param);
		this._field = param.field;
		this._onFinished = param.onFinished;
	}

	get status(): EventStatus {
		return this._status;
	}

	get field(): FieldEntity {
		return this._field;
	}

	start(): void {
		this._status = "started";
	}

	stop(): void {
		this._status = "stopped";
	}

	// イベント中にゲーム進行を止めることを推奨しているか:
	shouldGameStopped(): boolean {
		return false;
	}

	onFinished(): void {
		if (this._status === "started") {
			this._onFinished(this);
			this.stop();
		}
	}
}
