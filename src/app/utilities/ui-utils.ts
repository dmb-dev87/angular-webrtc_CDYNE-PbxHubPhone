export function getDiv(id: string): HTMLDivElement {
  const el = document.getElementById(id);
  if (!(el instanceof HTMLDivElement)) {
    throw new Error(`Element "${id}" not a div element.`);
  }
  return el;
}

export function getSpan(id: string): HTMLSpanElement {
  const el = document.getElementById(id);
  if (!(el instanceof HTMLSpanElement)) {
    throw new Error(`Element "${id}" not a span element.`);
  }
  return el;
}

export function getButtons(id: string): Array<HTMLButtonElement> {
  const els = document.getElementsByClassName(id);
  if (!els.length) {
    throw new Error(`Elements "${id}" not found.`);
  }
  const buttons: Array<HTMLButtonElement> = [];
  for (let i = 0; i < els.length; i++) {
    const el = els[i];
    if (!(el instanceof HTMLButtonElement)) {
      throw new Error(`Element ${i} of "${id}" not a button element.`);
    }
    buttons.push(el);
  }
  return buttons;
}

export function setInputValue(id: string, val: string): void {
  const el = document.getElementById(id);
  if (!(el instanceof HTMLInputElement)) {
    throw new Error(`Element "${id}" not a input element.`);
  }
  el.value = val;
}

export function addInputValue(id: string, val: string): void {
  const el = document.getElementById(id);
  if (!(el instanceof HTMLInputElement)) {
    throw new Error(`Element "${id}" not a input element.`);
  }
  const curVal = el.value;
  el.value = curVal + val;
}

export function delInputValue(id: string): void {
  const el = document.getElementById(id);
  if (!(el instanceof HTMLInputElement)) {
    throw new Error(`Element "${id}" not a input element.`);
  }

  const curVal = el.value;
  el.value = curVal.substr(0, curVal.length-1);
}

export function getInputValue(id: string): string {
  const el = document.getElementById(id);
  if (!(el instanceof HTMLInputElement)) {
    throw new Error(`Element "${id}" not a input element`);
  }
  return el.value;
}

export function setButtonText(id: string, val: string): void {
  const el = document.getElementById(id);
  if (!(el instanceof HTMLButtonElement)) {
    throw new Error(`Element "${id}" not a button element.`);
  }

  el.innerHTML = val;
}

export function getButtonText(id: string): string {
  const el = document.getElementById(id);
  if (!(el instanceof HTMLButtonElement)) {
    throw new Error(`Element "${id}" not a button element.`);
  }

  return el.innerHTML;
}

export function getAudio(id: string): HTMLAudioElement {
  const el = document.getElementById(id);
  if (!(el instanceof HTMLAudioElement)) {
    throw new Error(`Element "${id}" not found or not an audio element.`);
  }
  return el;
}

export function getVideo(id: string): HTMLVideoElement {
  const el = document.getElementById(id);
  if (!(el instanceof HTMLVideoElement)) {
    throw new Error(`Element "${id}" not found or not a video element.`);
  }
  return el;
}

export function getButton(id: string): HTMLButtonElement {
  const el = document.getElementById(id);
  if (!(el instanceof HTMLButtonElement)) {
    throw new Error(`Element "${id}" not found or not a button element`);
  }
  return el;
}