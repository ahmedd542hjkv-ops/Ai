import { GoogleGenAI, GenerateContentResponse, Content, Part, Modality } from "@google/genai";
import { Message, Settings, UploadedFile, SendMode } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable is not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const textModel = 'gemini-2.5-flash';
const imageModel = 'imagen-4.0-generate-001';
const imageEditModel = 'gemini-2.5-flash-image-preview';


/**
 * Generates an image based on a text prompt using the Imagen model.
 * @param prompt The text description for the image to be generated.
 * @returns A promise that resolves to an UploadedFile object containing the generated image data.
 */
export const generateImage = async (prompt: string): Promise<UploadedFile> => {
    const response = await ai.models.generateImages({
        model: imageModel,
        prompt: prompt,
        config: {
            numberOfImages: 1,
            outputMimeType: 'image/png',
        },
    });

    const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
    const dataUri = `data:image/png;base64,${base64ImageBytes}`;

    return {
        id: `img-${Date.now()}`,
        name: `${prompt.substring(0, 30).trim().replace(/\s/g, '_')}.png`,
        type: 'image/png',
        size: base64ImageBytes.length, // This is an approximation of size
        data: dataUri,
        description: `Generated image for prompt: "${prompt}"`,
    };
};

/**
 * Edits an existing image based on a text prompt.
 * @param prompt The text instruction for how to edit the image.
 * @param imageFile The original image to be edited.
 * @returns A promise that resolves to an object containing the model's text response and the new edited image file.
 */
export const editImage = async (prompt: string, imageFile: UploadedFile): Promise<{ text: string, file: UploadedFile }> => {
    const [meta, base64Data] = imageFile.data.split(',');
    const mimeType = meta.split(':')[1].split(';')[0];

    const imagePart = {
      inlineData: {
        mimeType: mimeType,
        data: base64Data,
      },
    };
    const textPart = { text: prompt };
    
    const response = await ai.models.generateContent({
        model: imageEditModel,
        contents: { parts: [imagePart, textPart] },
        config: {
            // Fix: Use Modality enum as per the coding guidelines for responseModalities config.
            responseModalities: [Modality.IMAGE, Modality.TEXT],
        },
    });

    let responseText = '';
    let newImageFile: UploadedFile | null = null;

    for (const part of response.candidates[0].content.parts) {
        if (part.text) {
            responseText += part.text;
        } else if (part.inlineData) {
            const newBase64 = part.inlineData.data;
            const newMimeType = part.inlineData.mimeType;
            const dataUri = `data:${newMimeType};base64,${newBase64}`;
            newImageFile = {
                id: `img-edit-${Date.now()}`,
                name: `edited_${imageFile.name}`,
                type: newMimeType,
                size: newBase64.length, // Approximation
                data: dataUri,
                description: `Edited image for prompt: "${prompt}"`,
            };
        }
    }
    
    if (!newImageFile) {
        throw new Error("Image editing failed: API did not return an image.");
    }

    return { text: responseText, file: newImageFile };
}


function mapHistoryToGenAI(history: Message[]): Content[] {
    return history.map(msg => {
        const parts: Part[] = [];

        // For user messages with files, interleave descriptions and file data.
        if (msg.role === 'user' && msg.files && msg.files.length > 0) {
            msg.files.forEach(file => {
                // Add descriptive text before the file data
                if (file.description) {
                    parts.push({ text: `This file, which I've named "${file.description}", has the original filename "${file.name}".` });
                } else {
                    parts.push({ text: `This is the file with the original filename "${file.name}".` });
                }

                // Add the file data part
                const [meta, base64Data] = file.data.split(',');
                const mimeType = meta.split(':')[1].split(';')[0];
                parts.push({
                    inlineData: {
                        mimeType,
                        data: base64Data,
                    },
                });
            });

            // Add the main text prompt at the end of all files for this message
            if (msg.text) {
                parts.push({ text: msg.text });
            }
        } else {
            // For model messages or text-only user messages
            if (msg.text) {
                parts.push({ text: msg.text });
            }
        }
        
        return { role: msg.role, parts };
    });
}

export const streamResponse = async (
    history: Message[],
    newMessage: { text: string; files: UploadedFile[] },
    settings: Settings,
    sendMode: SendMode
): Promise<AsyncGenerator<GenerateContentResponse>> => {

    const finalHistory = mapHistoryToGenAI(history);

    const newParts: Part[] = [];
    
    // Interleave new files and their descriptions
    newMessage.files.forEach(file => {
        // Add descriptive text before the file data
        if (file.description) {
            newParts.push({ text: `This file, which I've named "${file.description}", has the original filename "${file.name}".` });
        } else {
            newParts.push({ text: `This is the file with the original filename "${file.name}".` });
        }

        // Add the file data part
        const [meta, base64Data] = file.data.split(',');
        const mimeType = meta.split(':')[1].split(';')[0];
        newParts.push({
            inlineData: {
                mimeType,
                data: base64Data,
            },
        });
    });

    // Add the main text prompt at the end
    if (newMessage.text) {
        newParts.push({ text: newMessage.text });
    }
    
    const newContent: Content = { role: 'user', parts: newParts };

    // Determine config overrides based on sendMode
    const useSearch = (sendMode === 'search') || (settings.useSearch && sendMode === 'default');
    const useNoThinking = sendMode === 'no-thinking';

    const config: any = { // Use 'any' for flexibility
        systemInstruction: settings.systemPrompt || undefined,
    };

    // Cannot use search with files
    if (useSearch && newMessage.files.length === 0) {
        config.tools = [{ googleSearch: {} }];
    }

    if (useNoThinking) {
        config.thinkingConfig = { thinkingBudget: 0 };
    }


    const responseStream = await ai.models.generateContentStream({
        model: textModel,
        contents: [...finalHistory, newContent],
        config: config,
    });
    
    return responseStream;
};
