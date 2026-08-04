export type KeyToAudioAsset = { [key: string]: g.AudioAsset };
export type KeyToAudioPlayer = { [key: string]: g.AudioPlayer };

export class MusicPlayer {
	private _keyToAudioAssets: KeyToAudioAsset = {};
	private _keyToAudioPlayer: KeyToAudioPlayer = {};
	private _scene: g.Scene;

	constructor(scene: g.Scene) {
		this._scene = scene;
	}

	play(assetId: string): g.AudioPlayer {
		if (this._keyToAudioAssets[assetId] == null) {
			this._keyToAudioAssets[assetId] = this._scene.asset.getAudioById(assetId);
		}
		this._keyToAudioPlayer[assetId] = this._keyToAudioAssets[assetId].play();
		return this._keyToAudioPlayer[assetId];
	}

	stop(assetId: string): void {
		if (this._keyToAudioPlayer[assetId] != null) {
			this._keyToAudioPlayer[assetId].stop();
		}
	}

	stopAll(): void {
		Object.keys(this._keyToAudioAssets).forEach((id: string) => this.stop(id));
	}

	changeVolume(assetId: string, volume: number): void {
		if (this._keyToAudioPlayer[assetId] != null) {
			this._keyToAudioPlayer[assetId].changeVolume(volume);
		}
	}
}
