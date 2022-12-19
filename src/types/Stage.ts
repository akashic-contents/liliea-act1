// フィールドに関する情報
export interface Stage {
	scriptAssetId: string; // 適用するスクリプト
	timeLimit: number; // タイムリミット
	startPosition: g.CommonOffset; // マップ左上を (0, 0) としたときの初期位置
	emenies: SpawnTiming[]; // フィールド上での敵の出現情報一覧。timeの値が若い順にデータを定義する必要がある。
	items: SpawnTiming[]; // フィールド上でのアイテムの出現情報一覧。timeの値が若い順にデータを定義する必要がある。
	events: SpawnTiming[]; // フィールド上でのイベント一覧。timeの値が若い順にデータを定義する必要がある。
}

// 敵やアイテムのフィールド上への出現情報
export interface SpawnTiming {
	id: string; // jsonファイルに記載されているID(キー)。
	time: number; // 出現する時間。単位はフレーム数であることに注意。
	relativeOffset?: g.CommonOffset; // 自キャラの座標を(0, 0)とした時の出現座標。
	count?: number; // 出現数。
}
