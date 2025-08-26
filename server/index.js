import express from 'express'
import cors from "cors";
import path from "path";
import { promises as fs } from "fs";
import { fileURLToPath } from "url";

// אלה שני שורות קסם:
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = 5050;
const DATA_PATH = path.join(__dirname, "compliments.json");
console.log('__dirname', __dirname);

console.log('DATA_PATH', DATA_PATH);
console.log('running');

const app = express()

app.get("/", (req, res) => {
    res.send("Server is running!");
  });

app.listen(PORT, () => {
    console.log(`Compliments server running on http://localhost:${PORT}`);
  });


app.get("/health", (req, res) => res.send("ok"));
app.use(cors());
app.use(express.json());
// app.options("*", cors());

async function readCompliments() {
    try {
      const raw_compliments = await fs.readFile(DATA_PATH, "utf8");
      console.log( JSON.parse(raw_compliments));
      
      return JSON.parse(raw_compliments)
    } catch (e) {
      if (e.code === "ENOENT") {
        await fs.writeFile(DATA_PATH, "[]", "utf8");
        return [];
      }
      throw e;
    }
  }
  
  async function writeCompliments(list) {
    await fs.writeFile(DATA_PATH, JSON.stringify(list, null, 2), "utf8");
  }
  
  app.get("/compliments", async (req, res) => {
    const list = await readCompliments();
    res.json(list);
  });
  
  app.get("/compliments/random", async (req, res) => {
    const list = await readCompliments();
    console.log('list', list);
    
    if (!list.length) return res.status(404).json({ error: "No compliments yet" });
    const random = list[Math.floor(Math.random() * list.length)];
    res.json(random);
  });

  app.post("/compliments", async (req, res) => {
    const { text } = req.body || {};
    if (!text || typeof text !== "string" || !text.trim()) {
      return res.status(400).json({ error: "Invalid 'text'" });
    }
    const list = await readCompliments();
    const nextId = (list.at(-1)?.id || 0) + 1;
    const item = { id: nextId, text: text.trim() };
    list.push(item);
    await writeCompliments(list);
    res.status(201).json(item);
  });

  app.put("/compliments/:id", async (req, res) => {
    const id = Number(req.params.id);
    const { text } = req.body || {};
    if (!Number.isInteger(id)) return res.status(400).json({ error: "Invalid id" });
    if (!text || typeof text !== "string" || !text.trim()) {
      return res.status(400).json({ error: "Invalid 'text'" });
    }
  
    const list = await readCompliments();
    const idx = list.findIndex(c => c.id === id);
    if (idx === -1) return res.status(404).json({ error: "Not found" });
  
    list[idx].text = text.trim();
    await writeCompliments(list);
    res.json(list[idx]);
  });
  
  // DELETE /compliments/:id - מחיקה
  app.delete("/compliments/:id", async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ error: "Invalid id" });
  
    const list = await readCompliments();
    const idx = list.findIndex(c => c.id === id);
    if (idx === -1) return res.status(404).json({ error: "Not found" });
  
    const [deleted] = list.splice(idx, 1);
    await writeCompliments(list);
    res.json({ deleted });
  });
  