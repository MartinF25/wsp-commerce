/**
 * Catalog Service Index
 * Unified interface for all catalog services.
 * Consumers (API, Worker, etc.) only need one import.
 */

export { ProductService } from "./productService";
export { CategoryService } from "./categoryService";

export * from "../types";
export * from "../utils/productUtils";
