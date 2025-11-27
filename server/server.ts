import express, { Request, Response } from 'express';
import axios from 'axios';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import { GoogleGenerativeAI } from '@google/generative-ai';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors()); // Allows your React app to talk to this server
app.use(express.json());

// Request Logging Middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Multer for handling file uploads (in memory)
const upload = multer({ storage: multer.memoryStorage() });

// Gemini Client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// --- ROUTES ---

// Health check
app.get('/', (req: Request, res: Response) => {
  res.send('Iron Chef Server is Online 👨‍🍳');
});

// Image to Ingredients
app.post(
  '/api/ingredients/image',
  upload.single('image'),
  async (req: Request, res: Response): Promise<void> => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const file = (req as any).file;

    if (!file) {
      res.status(400).json({ error: 'No image file provided' });
      return;
    }

    if (!process.env.GEMINI_API_KEY) {
      res.status(500).json({ error: 'Gemini API Key not configured' });
      return;
    }

    try {
      // Initialize model
      // Using specific version from user's available model list
      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-001' });

      const prompt =
        'Identify the food ingredients in this image. Return ONLY a comma-separated list of ingredients in English (e.g. "chicken, tomato, onion"). Do not include quantities or explanations.';

      const result = await model.generateContent([
        prompt,
        {
          inlineData: {
            data: file.buffer.toString('base64'),
            mimeType: file.mimetype,
          },
        },
      ]);

      const response = await result.response;
      const text = response.text();

      // Clean up the text (remove newlines, extra spaces)
      const ingredients = text
        .replace(/\n/g, '')
        .split(',')
        .map((i) => i.trim())
        .filter((i) => i.length > 0);

      res.json({ ingredients });
    } catch (error) {
      console.error('Gemini API Error Details:', JSON.stringify(error, null, 2));
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const status = (error as any).status || 500;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const message = (error as any).message || 'Failed to analyze image';
      
      res.status(status).json({ 
        error: 'Failed to analyze image', 
        details: message,
        googleStatus: status 
      });
    }
  }
);

// The Main Event: Search by Ingredients
app.get('/api/recipes', async (req: Request, res: Response) => {
  const { ingredients } = req.query;

  if (!ingredients) {
    // return explicitly to satisfy void return type of handler vs response
    res.status(400).json({ error: 'Ingredients are required' });
    return;
  }

  try {
    // Spoonacular Endpoint: Find By Ingredients
    const response = await axios.get(
      'https://api.spoonacular.com/recipes/findByIngredients',
      {
        params: {
          apiKey: process.env.SPOONACULAR_API_KEY,
          ingredients: ingredients, // e.g., "apples,flour,sugar"
          number: 9, // Limit results for grid view
          ranking: 1, // 1 = Minimize missing ingredients
          ignorePantry: true, // Don't assume I have salt/water, etc.
        },
      }
    );

    res.json(response.data);
  } catch (error) {
    console.error('API Error:', (error as Error).message);

    // --- HACKATHON SAFETY NET ---
    // If the API fails (or you run out of credits), send this dummy data
    // so you can keep working on the Frontend design without stopping.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((error as any).response && (error as any).response.status === 402) {
      console.log('Quota exceeded, serving fallback data');
      res.json(FALLBACK_DATA);
      return;
    }

    res.status(500).json({ error: 'Failed to fetch recipes' });
  }
});

// Get Recipe Details
app.get('/api/recipes/:id', async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const response = await axios.get(
      `https://api.spoonacular.com/recipes/${id}/information`,
      {
        params: {
          apiKey: process.env.SPOONACULAR_API_KEY,
        },
      }
    );
    res.json(response.data);
  } catch (error) {
    console.error('API Error (Details):', (error as Error).message);
    // Fallback for details could be added here if needed, but for now error out
    res.status(500).json({ error: 'Failed to fetch recipe details' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

// --- DUMMY DATA FOR TESTING/FALLBACK ---
interface Ingredient {
  name: string;
}

interface Recipe {
  id: number;
  title: string;
  image: string;
  missedIngredientCount: number;
  missedIngredients: Ingredient[];
}

const FALLBACK_DATA: Recipe[] = [
  {
    id: 73420,
    title: 'Apple Or Peach Strudel',
    image: 'https://img.spoonacular.com/recipes/73420-312x231.jpg',
    missedIngredientCount: 2,
    missedIngredients: [{ name: 'baking powder' }, { name: 'cinnamon' }],
  },
  {
    id: 632660,
    title: 'Apricot Glazed Apple Tart',
    image: 'https://img.spoonacular.com/recipes/632660-312x231.jpg',
    missedIngredientCount: 1,
    missedIngredients: [{ name: 'apricot preserves' }],
  },
];
