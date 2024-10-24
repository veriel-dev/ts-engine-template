import express, { Express, Request, Response } from "express";
import path from "path";
import ViewEngine from "../engine/ViewEngine";

class Server {
  private app: Express;
  private port: number;
  private viewsDir: string;

  constructor() {
    this.app = express();
    this.port = 3000;
    this.viewsDir = path.join(__dirname, "../", "views");
    this.middleware();
    this.routes();
  }

  private middleware(): void {
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
    this.app.use(this.templateMiddeleWare());
  }

  private routes(): void {
    this.app.get("/", (req: Request, res: Response) => {
      res.render("home", {
        title: "Página de Inicio",
        message: "Bienvenido a nuestra aplicación",
      });
    });

    this.app.get("/perfil", (req: Request, res: Response) => {
      res.render("userProfile", {
        name: "Ana García",
        age: 28,
        isAdmin: true,
        skills: ["JavaScript", "TypeScript", "React", "Node.js", "Express"],
        startYear: 2015,
        projects: [
          { name: "Proyecto A", role: "Desarrollador líder" },
          { name: "Proyecto B", role: "Arquitecto de software" },
          { name: "Proyecto C", role: "Full-stack developer" },
        ],
      });
    });
    this.app.get("/perfil-junior", (req: Request, res: Response) => {
      const juniorUserData = {
        name: "Carlos Pérez",
        age: 17,
        isAdmin: false,
        skills: ["HTML", "CSS", "JavaScript"],
        startYear: 2022,
        projects: [],
      };

      res.render("userProfile", juniorUserData);
    });
    this.app.get("/perfil-senior", (req: Request, res: Response) => {
      const seniorUserData = {
        name: "María Rodríguez",
        age: 68,
        isAdmin: true,
        skills: ["Java", "C++", "Python", "SQL", "Project Management"],
        startYear: 1990,
        projects: [
          { name: "Sistema Bancario", role: "Arquitecto principal" },
          { name: "Plataforma E-commerce", role: "Gerente de proyecto" },
          { name: "App de Salud", role: "Asesor técnico" },
        ],
      };

      res.render("userProfile", seniorUserData);
    });
  }
  private templateMiddeleWare() {
    const engine = new ViewEngine(this.viewsDir);

    engine.addFunction("yearsExperience", (startYear: number) => {
      return new Date().getFullYear() - startYear;
    });
    engine.addFunction("currentDate", () => {
      return new Date().getFullYear();
    });

    return (
      req: express.Request,
      res: express.Response,
      next: express.NextFunction
    ) => {
      res.render = (view: string, data: Record<string, any> = {}) => {
        try {
          const html = engine.render(view, data);
          res.send(html);
        } catch (error) {
          next(error);
        }
      };
      next();
    };
  }

  public listen(): void {
    this.app.listen(this.port, () => {
      console.log(`Servidor corriendo en http://localhost:${this.port}`);
    });
  }
}

export default new Server();
