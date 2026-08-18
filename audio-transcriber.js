(() => {
  "use strict";

  const MAX_FILE_BYTES = 30 * 1024 * 1024;
  const MAX_DURATION_SECONDS = 90;
  const ANALYSIS_RATE = 8000;
  const FRAME_SIZE = 1024;
  const HOP_SIZE = 256;
  const MIN_MIDI = 36;
  const MAX_MIDI = 84;

  const waitForPaint = () => new Promise(resolve => setTimeout(resolve, 0));
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

  function report(callback, value, message) {
    callback?.({ progress: clamp(value, 0, 1), message });
  }

  function mixAndResample(buffer) {
    const sourceRate = buffer.sampleRate;
    const outputLength = Math.ceil(buffer.duration * ANALYSIS_RATE);
    const output = new Float32Array(outputLength);
    const channels = Array.from({ length: buffer.numberOfChannels }, (_, index) => buffer.getChannelData(index));
    const ratio = sourceRate / ANALYSIS_RATE;

    for (let index = 0; index < outputLength; index += 1) {
      const position = index * ratio;
      const left = Math.floor(position);
      const right = Math.min(left + 1, buffer.length - 1);
      const fraction = position - left;
      let sample = 0;
      for (const channel of channels) sample += channel[left] + (channel[right] - channel[left]) * fraction;
      output[index] = sample / channels.length;
    }

    let mean = 0;
    for (let index = 0; index < output.length; index += 1) mean += output[index];
    mean /= Math.max(1, output.length);
    let peak = 0;
    for (let index = 0; index < output.length; index += 1) {
      output[index] -= mean;
      peak = Math.max(peak, Math.abs(output[index]));
    }
    if (peak > 0.0001) {
      const gain = Math.min(1 / peak, 8);
      for (let index = 0; index < output.length; index += 1) output[index] *= gain;
    }
    return output;
  }

  function detectPitch(samples, offset) {
    let energy = 0;
    for (let index = 0; index < FRAME_SIZE; index += 2) {
      const sample = samples[offset + index] || 0;
      energy += sample * sample;
    }
    const rms = Math.sqrt(energy / (FRAME_SIZE / 2));
    if (rms < 0.018) return null;

    const minLag = Math.floor(ANALYSIS_RATE / 1050);
    const maxLag = Math.ceil(ANALYSIS_RATE / 60);
    const scores = new Float32Array(maxLag + 1);
    let bestLag = 0;
    let bestScore = -1;

    for (let lag = minLag; lag <= maxLag; lag += 1) {
      let correlation = 0;
      let firstEnergy = 0;
      let secondEnergy = 0;
      for (let index = 0; index < FRAME_SIZE - lag; index += 2) {
        const first = samples[offset + index] || 0;
        const second = samples[offset + index + lag] || 0;
        correlation += first * second;
        firstEnergy += first * first;
        secondEnergy += second * second;
      }
      const score = correlation / Math.sqrt(firstEnergy * secondEnergy + 1e-12);
      scores[lag] = score;
      if (score > bestScore) {
        bestScore = score;
        bestLag = lag;
      }
    }

    for (let lag = minLag + 1; lag < bestLag; lag += 1) {
      if (scores[lag] > 0.82 && scores[lag] >= scores[lag - 1] && scores[lag] >= scores[lag + 1]) {
        bestLag = lag;
        bestScore = scores[lag];
        break;
      }
    }
    if (bestScore < 0.56) return null;

    const before = scores[bestLag - 1] || bestScore;
    const after = scores[bestLag + 1] || bestScore;
    const denominator = before - 2 * bestScore + after;
    const adjustment = Math.abs(denominator) > 1e-6 ? 0.5 * (before - after) / denominator : 0;
    const frequency = ANALYSIS_RATE / (bestLag + clamp(adjustment, -0.5, 0.5));
    const midi = 69 + 12 * Math.log2(frequency / 440);
    if (!Number.isFinite(midi) || midi < MIN_MIDI || midi > MAX_MIDI) return null;
    return { midi, confidence: bestScore };
  }

  function median(values) {
    if (!values.length) return null;
    const sorted = [...values].sort((a, b) => a - b);
    return sorted[Math.floor(sorted.length / 2)];
  }

  function framesToUnits(frames, duration, bpm) {
    const unitSeconds = 60 / bpm / 4;
    const unitCount = Math.max(1, Math.ceil(duration / unitSeconds));
    const buckets = Array.from({ length: unitCount }, () => []);
    for (const frame of frames) {
      if (frame.midi == null) continue;
      const unit = clamp(Math.floor((frame.time + HOP_SIZE / ANALYSIS_RATE / 2) / unitSeconds), 0, unitCount - 1);
      buckets[unit].push(frame.midi);
    }

    const units = buckets.map(bucket => {
      if (!bucket.length) return null;
      const pitch = median(bucket);
      return Math.round(pitch);
    });

    for (let index = 1; index < units.length - 1; index += 1) {
      if (units[index - 1] != null && units[index + 1] === units[index - 1]) units[index] = units[index - 1];
    }
    while (units.length && units[units.length - 1] == null) units.pop();
    return units;
  }

  function midiToAbc(midi) {
    const pitchClasses = ["C", "^C", "D", "^D", "E", "F", "^F", "G", "^G", "A", "^A", "B"];
    const octave = Math.floor(midi / 12) - 1;
    let note = pitchClasses[((midi % 12) + 12) % 12];
    if (octave >= 5) {
      note = note.replace(/[A-G]/, letter => letter.toLowerCase());
      note += "'".repeat(octave - 5);
    } else if (octave < 4) {
      note += ",".repeat(4 - octave);
    }
    return note;
  }

  function unitsToBody(units) {
    if (!units.length) return "z16 |";
    const tokens = [];
    let index = 0;
    let barPosition = 0;
    while (index < units.length) {
      const value = units[index];
      let run = 1;
      while (index + run < units.length && units[index + run] === value) run += 1;
      let remaining = run;
      while (remaining > 0) {
        const available = 16 - barPosition;
        const length = Math.min(remaining, available);
        const symbol = value == null ? "z" : midiToAbc(value);
        tokens.push(`${symbol}${length === 1 ? "" : length}`);
        remaining -= length;
        barPosition += length;
        if (barPosition === 16) {
          tokens.push("|");
          barPosition = 0;
        }
      }
      index += run;
    }
    if (barPosition) tokens.push("|");
    return tokens.join(" ");
  }

  function safeTitle(title) {
    return String(title || "本机音频主旋律").replace(/[\r\n:]+/g, " ").trim().slice(0, 80) || "本机音频主旋律";
  }

  async function decode(blob) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) throw new Error("UNSUPPORTED");
    const context = new AudioContextClass();
    try {
      return await context.decodeAudioData((await blob.arrayBuffer()).slice(0));
    } catch {
      throw new Error("DECODE_FAILED");
    } finally {
      await context.close().catch(() => {});
    }
  }

  async function transcribe(blob, options = {}) {
    if (!(blob instanceof Blob)) throw new Error("NO_FILE");
    if (blob.size > MAX_FILE_BYTES) throw new Error("FILE_TOO_LARGE");
    report(options.onProgress, 0.03, "正在本机解码音频…");
    const buffer = await decode(blob);
    if (!buffer.duration || buffer.duration < 0.6) throw new Error("TOO_SHORT");
    if (buffer.duration > MAX_DURATION_SECONDS) throw new Error("TOO_LONG");

    report(options.onProgress, 0.12, "正在分析声音频段…");
    const samples = mixAndResample(buffer);
    const frameCount = Math.max(0, Math.floor((samples.length - FRAME_SIZE) / HOP_SIZE) + 1);
    const frames = [];
    for (let frameIndex = 0; frameIndex < frameCount; frameIndex += 1) {
      const offset = frameIndex * HOP_SIZE;
      const detected = detectPitch(samples, offset);
      frames.push({
        time: offset / ANALYSIS_RATE,
        midi: detected?.midi ?? null,
        confidence: detected?.confidence ?? 0
      });
      if (frameIndex % 40 === 0) {
        report(options.onProgress, 0.15 + 0.68 * (frameIndex / Math.max(1, frameCount)), `正在识别主旋律… ${Math.round(frameIndex / Math.max(1, frameCount) * 100)}%`);
        await waitForPaint();
      }
    }

    const voicedFrames = frames.filter(frame => frame.midi != null);
    if (voicedFrames.length < Math.max(5, frameCount * 0.025)) throw new Error("NO_PITCH");

    const bpm = clamp(Number(options.bpm) || 100, 40, 220);
    report(options.onProgress, 0.88, "正在量化节拍并生成 ABC…");
    const units = framesToUnits(frames, buffer.duration, bpm);
    const noteUnits = units.filter(value => value != null).length;
    if (noteUnits < 2) throw new Error("NO_PITCH");
    const title = safeTitle(options.title);
    const body = unitsToBody(units);
    const abc = [
      "X:1",
      `T:${title}`,
      "C:本机音频转录（自动草稿）",
      "M:4/4",
      "L:1/16",
      `Q:1/4=${Math.round(bpm)}`,
      "K:C",
      body
    ].join("\n");
    report(options.onProgress, 1, "转录完成");
    return {
      abc,
      title,
      duration: buffer.duration,
      bpm,
      voicedRatio: voicedFrames.length / Math.max(1, frameCount),
      noteUnits
    };
  }

  window.ScoreAtlasAudioTranscriber = {
    transcribe,
    limits: { maxFileBytes: MAX_FILE_BYTES, maxDurationSeconds: MAX_DURATION_SECONDS }
  };
})();
