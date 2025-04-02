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
    // Use our simplified Twitter card HTML template
    const filePath = path.resolve(process.cwd(), './client/public/images/twitter-fallback.html');
    
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Set headers that help Twitter's crawler
      res.setHeader('Content-Type', 'text/html');
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.send(content);
    } catch (error) {
      console.error('Error serving Twitter card:', error);
      
      // Fallback chain with multiple options
      try {
        // Try the more complex card
        const backupPath = path.resolve(process.cwd(), './client/public/images/viberover-card.html');
        const backupContent = fs.readFileSync(backupPath, 'utf8');
        res.setHeader('Content-Type', 'text/html');
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        res.send(backupContent);
      } catch (backupError) {
        try {
          // Original Twitter card as last fallback
          const originalPath = path.resolve(process.cwd(), './client/public/twitter-card.html');
          const originalContent = fs.readFileSync(originalPath, 'utf8');
          res.setHeader('Content-Type', 'text/html');
          res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
          res.setHeader('Pragma', 'no-cache');
          res.setHeader('Expires', '0');
          res.send(originalContent);
        } catch (originalError) {
          res.status(404).send('Not found');
        }
      }
    }
  });

  // Twitter/X image serving with proper content type (supports both SVG and PNG)
  app.get("/viberover-thumbnail", (req: Request, res: Response) => {
    // Use SVG as our primary format since it's already created
    const filePath = path.resolve(process.cwd(), './client/public/viberover-thumbnail.svg');
    
    try {
      const image = fs.readFileSync(filePath);
      
      // Set proper image headers for SVG
      res.setHeader('Content-Type', 'image/svg+xml');
      res.setHeader('Cache-Control', 'public, max-age=86400');
      res.send(image);
    } catch (error) {
      console.error('Error serving Twitter image:', error);
      res.status(404).send('Not found');
    }
  });
  
  // Add a route specifically for SVG extension
  app.get("/viberover-thumbnail.svg", (req: Request, res: Response) => {
    const filePath = path.resolve(process.cwd(), './client/public/viberover-thumbnail.svg');
    
    try {
      const image = fs.readFileSync(filePath);
      
      // Set proper image headers for SVG
      res.setHeader('Content-Type', 'image/svg+xml');
      res.setHeader('Cache-Control', 'public, max-age=86400');
      res.send(image);
    } catch (error) {
      console.error('Error serving Twitter SVG image:', error);
      res.status(404).send('Not found');
    }
  });
  
  // Add a route specifically for PNG if needed (fallback to SVG)
  app.get("/viberover-thumbnail.png", (req: Request, res: Response) => {
    // Fallback to SVG since we don't have a PNG
    const filePath = path.resolve(process.cwd(), './client/public/viberover-thumbnail.svg');
    
    try {
      const image = fs.readFileSync(filePath);
      
      // Set proper image headers
      res.setHeader('Content-Type', 'image/svg+xml');
      res.setHeader('Cache-Control', 'public, max-age=86400');
      res.send(image);
    } catch (error) {
      console.error('Error serving Twitter PNG image:', error);
      res.status(404).send('Not found');
    }
  });
  
  // Create a special route for Twitter card image (JPG format)
  app.get("/twitter-card.jpg", (req: Request, res: Response) => {
    // Instead of redirecting, serve the HTML content with proper image headers
    try {
      // Try using our primary Twitter card file
      const filePath = path.resolve(process.cwd(), './client/public/images/twitter-fallback.html');
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Set headers to help Twitter's crawler interpret this as an image
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Cache-Control', 'public, max-age=3600');
      res.setHeader('X-Twitter-Card', 'image'); // Custom header to help with debugging
      res.send(content);
    } catch (error) {
      console.error('Error serving Twitter card JPG:', error);
      // Fallback to redirect if we can't serve the file
      res.redirect(302, '/twitter-card');
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
