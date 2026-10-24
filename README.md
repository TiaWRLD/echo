# Echo, a quiet place to think

A small, private chatbot that helps you put your thoughts in order.
It runs **entirely in your browser** with Gemma 3 1B: what you write never leaves your device.

Live: https://tiawrld.github.io/echo/

Built for Hacktoberfest 2026, week 3 ("build your own chatbot").

> **Echo is not therapy, medical advice, or a crisis service.** It is a tool for reflection.
> It does not diagnose anything, and its suggestions are hypotheses, never verdicts.
> If you are in crisis or thinking about harming yourself, please contact a local helpline: https://findahelpline.com

## What it does

Echo has four modes. In each one, the app's code drives the flow (fixed texts, questions and safeguards); the model only writes a short piece of text.

| Mode | What happens |
| --- | --- |
| **Vent** | You write, Echo listens and rephrases what it heard. No advice. |
| **Reflect** | Echo asks four fixed questions, then offers a hypothesis about an impulse versus an underlying emotion. Never a verdict. |
| **Unblock** | You describe a task and what is in the way. Echo suggests ONE tiny step of 2 to 5 minutes. You can ask "make it even smaller" up to 3 times. |
| **Unsent Letter** | You vent (max 1200 characters) and Echo rewrites it as a calm letter. It never suggests sending it. You can Copy it or Discard it. Nothing is saved. |

## Privacy: what "nothing leaves your device" means

- The text you write is processed by a model running in your browser. It is not sent to any server.
- Network requests you will see:
    - the app's own files, from GitHub Pages (about 27 MB on the first visit, cached by a service worker);
    - the model files, from `huggingface.co`, **once** (about 859 MB, stored in your browser's Cache API).
- Hosting providers can see the usual request metadata (for example your IP address) when you load the app or download the model. That is separate from anything you write.
- **You can check this yourself:** open your browser's DevTools, go to the Network tab, and chat. After the model is cached you can also switch the browser to offline mode and Echo keeps working.
- What is stored: conversations live only in memory (a reload clears them). The only thing saved in `localStorage` is a flag that remembers you saw the introduction (`echo:onboarding-seen`).
- **Delete all data** (two-step confirmation) clears the four chat sessions and that flag. It does **not** delete the downloaded model or the app cache. To remove those, clear the site's data in your browser settings.

## Safety

A keyword check (English only) runs before **every** call to the model, in every mode. If it matches, Echo shows a fixed message with a link to https://findahelpline.com instead of generating anything.

This is a simple safeguard, not a detector you should rely on. See the limitations below.

## Requirements

- A browser with **WebGPU**. Without it, Echo shows an explanatory screen instead of the chat.
- About 900 MB of free storage for the first visit.

Tested by the author on Chrome, Firefox and Safari, on a MacBook and on a desktop PC with an RTX 3060. Other GPUs and browsers have not been tested. Third-party reports mention crashes of the q4 build of Gemma 3 1B in transformers.js on some GPUs.

## Run it locally

```bash
npm ci
echo "VITE_ENGINE=transformers" > .env
npm run dev
```

Restart `npm run dev` every time you change `.env`.

`VITE_ENGINE=transformers` selects the Transformers.js engine (the one used in production). A MediaPipe engine exists as a plan B but has never been tested.

## Build and deploy

The site is a static single-page app (`ssr: false`) generated with `nuxt generate` and published to GitHub Pages by `.github/workflows/deploy.yml`.

```bash
NUXT_APP_BASE_URL=/echo/ VITE_ENGINE=transformers npm run generate
```

The output is in `.output/public`. `NUXT_APP_BASE_URL` must end with `/`. GitHub Pages cannot set custom headers, and Echo does not depend on any.

## Stack

Nuxt 4 (Vue, TypeScript), Pinia, VueUse, Tailwind CSS v4, `@vite-pwa/nuxt`, and Transformers.js v4 running `onnx-community/gemma-3-1b-it-ONNX` (q4, WebGPU) inside a Web Worker.

## Known limitations

- Gemma 3 1B is a very small model. Its answers can be generic, off-target or wrong. Read them critically.
- The crisis keyword list is in English only and covers self-harm and suicide language. It does not cover threats of violence toward others (the Unsent Letter mode handles that only through its prompt).
- The list is deliberately broad, so false alarms can happen (for example "I'd rather die than present").
- In Reflect and Unblock, if you press Stop before a full sentence or an error happens, your answer stays visible but is not recorded, so you have to write it again. Unsent Letter has Try again.
- Reflect and Unblock do not carry over the context of Vent.
- The sentence trimming counts "e.g." and ellipses as the end of a sentence.
- The first visit downloads about 27 MB of app files on top of the 859 MB model.
- Delete all data does not clear the model cache or the app cache.

## Ideas for the future

- A private journal stored on the device (the storage layer with `idb-keyval` was built and tested, then cut for time).
- An end-of-session summary.
- A short pause with breathing guidance.
- An emotion wheel.

## License

Echo's source code is licensed under the **GNU Affero General Public License v3.0**. See the [LICENSE](LICENSE) file.

### The Gemma model is a separate component

The AGPL covers Echo's code only. The model is **not** part of this repository and is **not** covered by the AGPL: your browser downloads it from Hugging Face ([`onnx-community/gemma-3-1b-it-ONNX`](https://huggingface.co/onnx-community/gemma-3-1b-it-ONNX), an ONNX conversion of Google's [`gemma-3-1b-it`](https://huggingface.co/google/gemma-3-1b-it), listed on Hugging Face with the license "gemma").

**Gemma is provided under and subject to the Gemma Terms of Use found at https://ai.google.dev/gemma/terms.**
Use of Gemma is also subject to the Gemma Prohibited Use Policy: https://ai.google.dev/gemma/prohibited_use_policy.
Anyone who runs, hosts or redistributes Gemma, including through a fork of Echo, must follow those documents. Outputs are your responsibility.

Echo is an independent project and is not affiliated with or endorsed by Google.

## Credits

Gemma by Google; the ONNX conversion by the `onnx-community` organization on Hugging Face; Transformers.js by Hugging Face; Nuxt, Vue, Pinia, VueUse, Tailwind CSS and `vite-pwa`; crisis resources via findahelpline.com.