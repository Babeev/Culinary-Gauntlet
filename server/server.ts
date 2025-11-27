import express, { Request, Response } from 'express';
import axios from 'axios';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors()); // Allows your React app to talk to this server
app.use(express.json());

// --- ROUTES ---

// Health check (To verify server is running)
app.get('/', (req: Request, res: Response) => {
  res.send('Iron Chef Server is Online 👨‍🍳');
});

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
