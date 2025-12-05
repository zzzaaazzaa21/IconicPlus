import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";
import { createPcmBlob, base64ToUint8Array, decodeAudioData } from "../utils/audio-utils";

// Helper to get a fresh instance (important for paid key selection)
const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- Chat Service ---
export const generateChatResponse = async (
  history: { role: string; parts: { text: string }[] }[],
  newMessage: string,
  images: string[] = [],
  modelType: 'pro' | 'flash' | 'thinking' = 'flash',
  useSearch = false,
  useMaps = false,
  userLocation?: { latitude: number; longitude: number }
) => {
  const ai = getAI();
  let modelName = 'gemini-2.5-flash';
  let config: any = {
    systemInstruction: "You are IconicPlus, a luxury AI assistant. You speak multiple languages including Banglish. Your responses should be formatted with emojis, and you must **bold** the main lines and key topics. Maintain a sophisticated, helpful tone.",
  };

  if (modelType === 'thinking') {
    modelName = 'gemini-3-pro-preview';
    config.thinkingConfig = { thinkingBudget: 32768 };
  } else if (modelType === 'pro') {
    modelName = 'gemini-3-pro-preview';
  } else {
    // Flash
    modelName = 'gemini-2.5-flash';
  }

  // Grounding
  if (useSearch) {
    config.tools = [{ googleSearch: {} }];
  } else if (useMaps) {
    config.tools = [{ googleMaps: {} }];
    if (userLocation) {
        config.toolConfig = {
            retrievalConfig: {
                latLng: userLocation
            }
        }
    }
  }

  const chat = ai.chats.create({
    model: modelName,
    config,
    history: history.map(h => ({
      role: h.role,
      parts: h.parts,
    })),
  });

  // Prepare contents
  let parts: any[] = [{ text: newMessage }];
  if (images.length > 0) {
     parts = [
        { text: newMessage },
        ...images.map(img => ({ inlineData: { mimeType: 'image/png', data: img.split(',')[1] } }))
     ];
  }

  // Use sendMessageStream for typing animation
  // Fixed: Passed as object with message property to satisfy ContentUnion requirement
  const result = await chat.sendMessageStream({ message: parts });
  return result;
};

// --- TTS Service ---
export const speakMessage = async (text: string) => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-preview-tts',
    contents: { parts: [{ text }] },
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: 'Kore' }, // Voices: Puck, Charon, Kore, Fenrir, Zephyr
        },
      },
    },
  });

  const audioData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

  if (audioData) {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 24000 });
    const audioBuffer = await decodeAudioData(
      base64ToUint8Array(audioData),
      audioContext,
      24000,
      1
    );

    const source = audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioContext.destination);
    source.start();
    
    // Return a function to stop audio if needed, though mostly fire-and-forget for this UI
    return { stop: () => source.stop() };
  }
  
  throw new Error("No audio generated");
};


// --- Live API (Voice) ---
export const connectLiveSession = async (
  onAudioData: (buffer: AudioBuffer) => void,
  onClose: () => void
) => {
  const ai = getAI();
  const inputAudioContext = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 16000 });
  const outputAudioContext = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 24000 });
  
  let nextStartTime = 0;
  const sources = new Set<AudioBufferSourceNode>();

  // Get User Media
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

  const sessionPromise = ai.live.connect({
    model: 'gemini-2.5-flash-native-audio-preview-09-2025',
    config: {
      responseModalities: [Modality.AUDIO],
      systemInstruction: "You are IconicPlus. You are currently in Voice Mode. Respond conversationally, succinctly, and with personality. Use Banglish or local languages if spoken to in them.",
      speechConfig: {
        voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } }
      }
    },
    callbacks: {
      onopen: () => {
        // Stream audio from the microphone to the model.
        const source = inputAudioContext.createMediaStreamSource(stream);
        const scriptProcessor = inputAudioContext.createScriptProcessor(4096, 1, 1);
        
        scriptProcessor.onaudioprocess = (e) => {
          const inputData = e.inputBuffer.getChannelData(0);
          const pcmBlob = createPcmBlob(inputData);
          sessionPromise.then(session => session.sendRealtimeInput({ media: pcmBlob }));
        };
        
        source.connect(scriptProcessor);
        scriptProcessor.connect(inputAudioContext.destination);
      },
      onmessage: async (msg: LiveServerMessage) => {
        const audioData = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
        if (audioData) {
            nextStartTime = Math.max(nextStartTime, outputAudioContext.currentTime);
            const audioBuffer = await decodeAudioData(
                base64ToUint8Array(audioData),
                outputAudioContext,
                24000,
                1
            );
            
            // Pass buffer to UI visualizer if needed, or just play it
            onAudioData(audioBuffer);

            const source = outputAudioContext.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(outputAudioContext.destination);
            source.addEventListener('ended', () => sources.delete(source));
            source.start(nextStartTime);
            nextStartTime += audioBuffer.duration;
            sources.add(source);
        }
      },
      onclose: () => {
        onClose();
        inputAudioContext.close();
        outputAudioContext.close();
        stream.getTracks().forEach(t => t.stop());
      },
      onerror: (err) => {
        console.error("Live API Error", err);
      }
    }
  });

  return {
    disconnect: async () => {
      const session = await sessionPromise;
      session.close();
    }
  };
};

// --- Studio (Veo, Imagen, Editing) ---

export const generateVideo = async (prompt: string, aspectRatio: '16:9' | '9:16' = '16:9', imageBytes?: string) => {
  const ai = getAI();
  let operation;
  
  const config: any = {
    numberOfVideos: 1,
    resolution: '720p',
    aspectRatio: aspectRatio,
  };

  if (imageBytes) {
      // Image to Video
      operation = await ai.models.generateVideos({
          model: 'veo-3.1-fast-generate-preview',
          prompt, // optional usually but helpful
          image: {
              imageBytes: imageBytes.split(',')[1],
              mimeType: 'image/png' // Assuming png for this demo
          },
          config
      });
  } else {
      // Text to Video
      operation = await ai.models.generateVideos({
          model: 'veo-3.1-fast-generate-preview',
          prompt,
          config
      });
  }

  // Polling
  while (!operation.done) {
    await new Promise(r => setTimeout(r, 10000));
    operation = await ai.operations.getVideosOperation({ operation });
  }

  const uri = operation.response?.generatedVideos?.[0]?.video?.uri;
  if (!uri) throw new Error("No video generated");
  
  // Fetch with key
  const vidRes = await fetch(`${uri}&key=${process.env.API_KEY}`);
  const blob = await vidRes.blob();
  return URL.createObjectURL(blob);
};

export const generateImage = async (prompt: string, aspectRatio: string = "1:1", size: string = "1K") => {
    const ai = getAI();
    // Using generateContent for nano banana pro (gemini-3-pro-image-preview)
    const response = await ai.models.generateContent({
        model: 'gemini-3-pro-image-preview',
        contents: { parts: [{ text: prompt }] },
        config: {
            imageConfig: {
                aspectRatio: aspectRatio,
                imageSize: size,
            }
        }
    });

    // Extract image
    for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
            return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
    }
    throw new Error("No image generated");
};

export const editImage = async (base64Image: string, prompt: string) => {
    const ai = getAI();
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image', // Nano banana for editing
        contents: {
            parts: [
                { inlineData: { mimeType: 'image/png', data: base64Image.split(',')[1] } },
                { text: prompt }
            ]
        }
    });
     for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
            return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
    }
    throw new Error("No edited image returned");
};