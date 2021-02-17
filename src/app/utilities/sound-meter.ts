export class SoundMeter {
  public context: any;
  public inputInstant: number = 0.0;

  private script: any;
  private mic: any;

  private _audioLevels = [0];
  private _audioAnalyser = [];
  private _freqs = [];
  private _audioSource: any;
  private _audioGain: any;
  private _audioChannelSplitter: any;
  
  constructor(context: any) {
    this.context = context;

    this.script = context.createScriptProcessor(2048, 1, 1);
    const that = this;
    this.script.onaudioprocess = (event: any)  => {
      const input = event.inputBuffer.getChannelData(0);
      let inputSum = 0.0;
      for (let i=0; i < input.length; ++i) {
        inputSum += input[i] * input[i];
      }
      that.inputInstant = Math.sqrt(inputSum / input.length) * 500;
      that.inputInstant = that.inputInstant > 100 ? 100 : that.inputInstant;
    };
  }

  connectToSource(stream: any, callback: any): void {
    console.log(`++++++++++++++++++++++`, `SoundMeter connecting`);
    try {
      this._audioSource = this.context.createMediaStreamSource(stream);
      this._audioGain = this.context.createGain();
      this._audioChannelSplitter = this.context.createChannelSplitter(this._audioSource.channelCount);
      this._audioSource.connect(this._audioGain);
      this._audioGain.connect(this._audioChannelSplitter);
      // this._audioGain.connect(this.context.destiantion);

      for (let i = 0; i < this._audioSource.channelCount; i++) {
        this._audioAnalyser[i] = this.context.createAnalyser();
        this._audioAnalyser[i].minDecibels = -100;
        this._audioAnalyser[i].maxDecibels = 0;
        this._audioAnalyser[i].smoothingTimeConstant = 0.8;
        this._audioAnalyser[i].fftSize = 32;
        this._freqs[i] = new Uint8Array(this._audioAnalyser[i].frequencyBinCount);    
        this._audioChannelSplitter.connect(this._audioAnalyser[i], i, 0);
      }

      this.mic = this.context.createMediaStreamSource(stream);
      this.mic.connect(this.script);
      this.script.connect(this.context.destination);

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
      console.log(`+++++++++++++++++++++++++++ Analyser`, this._audioAnalyser);
      let value = 0;
      for (let freqBinI = 0; freqBinI < this._audioAnalyser[channelI].frequencyBinCount; freqBinI++) {
        value = Math.max(value, this._freqs[channelI][freqBinI]);
      }
      this._audioLevels[channelI] = value / 256
      outputSum += this._audioLevels[channelI] * this._audioLevels[channelI];
    }

    console.log(`+++++++++++++++++++ sum`, outputSum);

    let outputInstant = Math.sqrt(outputSum / this._audioAnalyser.length) * 500; 
    outputInstant = outputInstant > 100 ? 100 : outputInstant;

    return outputInstant;
  }

  stop(): void {
    console.log(`++++++++++++++++++++++++`, `SoundMeter stopping`);
    this.mic.disconnect();
    this._audioSource.disconnect();
    this.script.disconnect();
  }
}