export class LocalSoundMeter {
  public inputInstant: number = 0.0;

  private _audioContext: any;
  private script: any;
  private _audioSource: any;

  constructor(context: any) {
    this._audioContext = context;
    this.script = context.createScriptProcessor(2048, 1, 1);
    this.script.onaudioprocess = (event: any) => {
      const input = event.inputBuffer.getChannelData(0);
      let inputSum = 0.0;
      for (let i = 0; i < input.length; ++i) {
        inputSum += input[i] * input[i];
      }
      this.inputInstant = Math.sqrt(inputSum / input.length) * 500;
      this.inputInstant = this.inputInstant > 100 ? 100 : this.inputInstant;
    };
  }

  connectToSource(stream: any, callback: any): void {
    try {
      this._audioSource = this._audioContext.createMediaStreamSource(stream);
      this._audioSource.connect(this.script);
      this.script.connect(this._audioContext.destination);
      if (callback !== undefined) {
        callback(null);
      }
    } catch (e) {
      console.error(e);
      if (callback !== undefined) {
        callback(e);
      }
    }
  }

  stop(): void {
    this._audioSource.disconnect();
    this.script.disconnect();
  }
}

export class RemoteSoundMeter {
  private _audioContext: any;
  private _audioLevels = [0];
  private _audioAnalyser = [];
  private _freqs = [];
  private _audioSource: any;
  private _audioGain: any;
  private _audioChannelSplitter: any;
  
  constructor(context: any) {
    this._audioContext = context;
  }

  connectToSource(stream: any, callback: any): void {
    try {
      this._audioSource = this._audioContext.createMediaStreamSource(stream);
      this._audioGain = this._audioContext.createGain();
      this._audioChannelSplitter = this._audioContext.createChannelSplitter(this._audioSource.channelCount);
      this._audioSource.connect(this._audioGain);
      this._audioGain.connect(this._audioChannelSplitter);

      for (let i = 0; i < this._audioSource.channelCount; i++) {
        this._audioAnalyser[i] = this._audioContext.createAnalyser();
        this._audioAnalyser[i].minDecibels = -100;
        this._audioAnalyser[i].maxDecibels = 0;
        this._audioAnalyser[i].smoothingTimeConstant = 0.8;
        this._audioAnalyser[i].fftSize = 32;
        this._freqs[i] = new Uint8Array(this._audioAnalyser[i].frequencyBinCount);    
        this._audioChannelSplitter.connect(this._audioAnalyser[i], i, 0);
      }

      if (callback !== undefined) {
        callback(null);
      }
    } catch (e) {
      console.error(e);
      if (callback !== undefined) {
        callback(e);
      }
    }
  }

  calculateAudioLevels(): number  {
    let outputSum = 0.0;
    for (let channelI = 0; channelI < this._audioAnalyser.length; channelI++) {
      this._audioAnalyser[channelI].getByteFrequencyData(this._freqs[channelI]);
      let value = 0;
      for (let freqBinI = 0; freqBinI < this._audioAnalyser[channelI].frequencyBinCount; freqBinI++) {
        value = Math.max(value, this._freqs[channelI][freqBinI]);
      }
      this._audioLevels[channelI] = value / 256;
      outputSum += this._audioLevels[channelI] * this._audioLevels[channelI];
    }
    let outputInstant = Math.sqrt(outputSum / this._audioAnalyser.length) * 100; 
    outputInstant = outputInstant > 100 ? 100 : outputInstant;
    return outputInstant;
  }

  stop(): void {
    this._audioGain.disconnect();
    this._audioSource.disconnect();
  }
}