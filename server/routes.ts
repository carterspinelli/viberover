import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import path from "path";
import fs from "fs";

export async function registerRoutes(app: Express): Promise<Server> {
  // put application routes here
  // prefix all routes with /api

  // use storage to perform CRUD operations on the storage interface
  // e.g. storage.insertUser(user) or storage.getUserByUsername(username)

  // Special route for Twitter/X card validation
  app.get("/twitter-card", (req: Request, res: Response) => {
    const filePath = path.resolve(process.cwd(), './client/public/twitter-card.html');
    
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Set headers that help Twitter's crawler
      res.setHeader('Content-Type', 'text/html');
      res.setHeader('Cache-Control', 'public, max-age=86400');
      res.send(content);
    } catch (error) {
      console.error('Error serving Twitter card:', error);
      res.status(404).send('Not found');
    }
  });

  // Twitter/X image serving with proper content type
  app.get("/viberover-thumbnail", (req: Request, res: Response) => {
    const filePath = path.resolve(process.cwd(), './client/public/viberover-thumbnail.png');
    
    try {
      const image = fs.readFileSync(filePath);
      
      // Set proper image headers
      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Cache-Control', 'public, max-age=86400');
      res.send(image);
    } catch (error) {
      console.error('Error serving Twitter image:', error);
      res.status(404).send('Not found');
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
