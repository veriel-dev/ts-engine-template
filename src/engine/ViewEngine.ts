import * as fs from "fs";
import path from "path";
import { TypeData } from "../interfaces";

class ViewEngine {
  private templates: Map<string, string>;
  private customFunctions: Map<string, Function>;
  private viewsDir: string;

  constructor(viewsDir: string) {
    this.templates = new Map();
    this.customFunctions = new Map();
    this.viewsDir = viewsDir;
  }
  // Load Template
  private loadTemplate(name: string): string {
    const filePath = path.join(this.viewsDir, `${name}.vd`);
    if (!fs.existsSync(filePath))
      throw Error(`Template file "${filePath}" not found`);

    return fs.readFileSync(filePath, "utf-8");
  }

  // Add Function
  addFunction(name: string, func: Function): void {
    this.customFunctions.set(name, func);
  }

  // Redner Template
  render(name: string, data: TypeData): string {
    let template = this.templates.get(name);
    if (!template) {
      template = this.loadTemplate(name) as string;
      this.templates.set(name, template);
    }
    return this.parseTemplate(template, data);
  }

  private parseTemplate(template: string, data: TypeData): string {
    template = this.interpolate(template, data);
    template = this.processConditionals(template, data);
    template = this.processLoops(template, data);
    template = this.processFunctions(template, data);
    return template;
  }

  // Interpolate Variables
  private interpolate(template: string, data: TypeData): string {
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return data.hasOwnProperty(key) ? String(data[key]) : match;
    });
  }
  // Process Conditionals
  private processConditionals(
    template: string,
    data: Record<string, any>
  ): string {
    const conditionalRegex =
      /\{% if (.*?) %\}([\s\S]*?)(?:\{% else %\}([\s\S]*?))?\{% endif %\}/g;
    return template.replace(
      conditionalRegex,
      (match, condition, ifTrue, ifFalse = "") => {
        const result = this.evaluateCondition(condition, data);
        return result
          ? this.parseTemplate(ifTrue, data)
          : this.parseTemplate(ifFalse, data);
      }
    );
  }
  private evaluateCondition(condition: string, data: TypeData) {
    condition = condition.replace(/\b(\w+)\b/g, (match) => {
      return data.hasOwnProperty(match) ? JSON.stringify(data[match]) : match;
    });

    try {
      // eslint-disable-next-line no-new-func
      return new Function(`return ${condition}`)();
    } catch (error) {
      console.error(`Error evaluating condition: ${condition}`, error);
      return false;
    }
  }
  // Process Lopps
  private processLoops(template: string, data: Record<string, any>): string {
    const loopRegex = /\{% for (\w+) in (\w+) %\}([\s\S]*?)\{% endfor %\}/g;
    return template.replace(loopRegex, (match, itemName, listName, content) => {
      if (!Array.isArray(data[listName])) {
        return match;
      }
      return data[listName]
        .map((item: any) => {
          const itemData = { ...data, [itemName]: item };
          return this.parseTemplate(content, itemData);
        })
        .join("");
    });
  }
  // Process Funcctions
  private processFunctions(
    template: string,
    data: Record<string, any>
  ): string {
    const functionRegex = /\{% (\w+)\(([\s\S]*?)\) %\}/g;
    return template.replace(functionRegex, (match, funcName, args) => {
      const func = this.customFunctions.get(funcName);
      if (!func) {
        return match;
      }
      const evaluatedArgs = args.split(",").map((arg: string) => {
        const trimmedArg = arg.trim();
        return data.hasOwnProperty(trimmedArg) ? data[trimmedArg] : trimmedArg;
      });
      return String(func(...evaluatedArgs));
    });
  }
}
export default ViewEngine;
