import * as faceapi from "face-api.js";
import { Canvas, Image, ImageData } from "canvas";
import path from "path";
import fs from "fs";

// Patch face-api.js environment
faceapi.env.monkeyPatch({ Canvas, Image, ImageData });

// Load facial detection models
const modelPath = path.join(process.cwd(), "models");

export const loadModels = async () => {
  try {
    await faceapi.nets.ssdMobilenetv1.loadFromDisk(modelPath);
    await faceapi.nets.faceRecognitionNet.loadFromDisk(modelPath);
    await faceapi.nets.faceLandmark68Net.loadFromDisk(modelPath);
    console.log("✔ Face API Models Loaded Successfully");
  } catch (error) {
    console.error("❌ Error loading face models:", error);
    throw error;
  }
};

// Convert uploaded image to embedding vector
export const getFaceEmbedding = async (imagePath) => {
  try {
    // Load image using Canvas API
    const imageBuffer = await fs.promises.readFile(imagePath);
    const img = new Image();

    // Create a promise to handle async image loading
    return new Promise((resolve, reject) => {
      img.onload = async () => {
        try {
          const canvas = new Canvas(img.width, img.height);
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0);

          const detections = await faceapi
            .detectSingleFace(canvas)
            .withFaceLandmarks()
            .withFaceDescriptor();

          if (!detections) {
            resolve(null);
          } else {
            // Convert Float32Array to regular array for storage
            resolve(Array.from(detections.descriptor));
          }
        } catch (error) {
          reject(error);
        }
      };

      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = imageBuffer;
    });
  } catch (error) {
    console.error("Error extracting face embedding:", error);
    return null;
  }
};

// Compare two embeddings (Euclidean distance)
export const compareFaces = (
  storedEmbedding,
  currentEmbedding,
  threshold = 0.45
) => {
  if (!storedEmbedding || !currentEmbedding) {
    return false;
  }

  try {
    // Convert to Float32Array if necessary
    const stored = new Float32Array(storedEmbedding);
    const current = new Float32Array(currentEmbedding);

    // Calculate Euclidean distance
    let sumSquaredDiff = 0;
    for (let i = 0; i < stored.length; i++) {
      const diff = stored[i] - current[i];
      sumSquaredDiff += diff * diff;
    }
    const distance = Math.sqrt(sumSquaredDiff);

    console.log(
      `Face similarity distance: ${distance.toFixed(
        4
      )} (threshold: ${threshold})`
    );
    return distance < threshold; // Lower distance = better match
  } catch (error) {
    console.error("Error comparing faces:", error);
    return false;
  }
};

// Calculate face similarity score (0-100)
export const getFaceSimilarityScore = (storedEmbedding, currentEmbedding) => {
  if (!storedEmbedding || !currentEmbedding) {
    return 0;
  }

  try {
    const stored = new Float32Array(storedEmbedding);
    const current = new Float32Array(currentEmbedding);

    let sumSquaredDiff = 0;
    for (let i = 0; i < stored.length; i++) {
      const diff = stored[i] - current[i];
      sumSquaredDiff += diff * diff;
    }
    const distance = Math.sqrt(sumSquaredDiff);

    // Convert distance to similarity score (0-100)
    const similarity = Math.max(0, 100 - distance * 100);
    return similarity;
  } catch (error) {
    console.error("Error calculating similarity score:", error);
    return 0;
  }
};
