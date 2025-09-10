import "server-only";
import { promises as fs } from "fs";
import path from "path";
import { slugify } from "@/lib/slugify";

export type Article = {
  title: string;
  link: string;
  image?: string;
  details?: {
    title?: string;
    content?: string;
    date?: string;
    author?: string;
  };
  fullDetails?: {
    title?: string;
    content?: string;
    date?: string;
    author?: string;
  };
  slug?: string; // Added for internal linking if needed
};

export type SectionData = {
  sectionName: string;
  articles: Article[];
};

const DATA_DIR = path.join(process.cwd(), "..", "..", "data_khuyennong", "split_data");
const FALLBACK_IMAGE = "/placeholder.svg"; // A generic placeholder

// A map of section IDs to their file names
const SECTION_FILES: Record<string, string> = {
  featured: "section_1_Tin nổi bật.json",
  latest: "section_2_Tin mới cập nhật.json",
  agriNews: "section_3_Tin ngành nông nghiệp và môi trường.json",
  provinceNews: "section_4_Tin khuyến nông và DVNN các tỉnh, thành.json",
  cityNews: "section_5_Tin khuyến nông và dvnn địa bàn TP.CT.json",
  models: "section_6_Mô hình khuyến nông, nông nghiệp hiệu quả.json",
  science: "section_7_Khoa học kỹ thuật mới và khuyến cáo.json",
  policies: "section_8_Phổ biến chính sách và kêu gọi đầu tư.json",
  services: "section_9_Sản phẩm dịch vụ khuyến nông, nông nghiệp.json",
  prices: "section_10_Bản tin giá nông sản địa phương.json",
  ocop: "section_11_Sản phẩm chủ lực, OCOP địa phương.json",
  culture: "section_12_Trang văn nghệ khuyến nông.json",
  events: "section_13_Thông báo và sự kiện.json",
  newTechDocs: "section_14_Tài liệu kỹ thuật mới.json",
};

/**
 * Reads and parses a JSON file from the data directory.
 * @param filePath - The path to the JSON file relative to the data directory.
 * @returns A promise that resolves with the parsed JSON data.
 */
async function readJSON<T>(filePath: string): Promise<T> {
  const fullPath = path.join(DATA_DIR, filePath);
  try {
    const fileContent = await fs.readFile(fullPath, "utf-8");
    return JSON.parse(fileContent) as T;
  } catch (error) {
    console.error(`Error reading or parsing JSON file at ${fullPath}:`, error);
    throw new Error(`Could not load data from ${filePath}`);
  }
}

/**
 * Normalizes an array of articles, ensuring essential fields are present.
 * @param articles - The array of articles to normalize.
 * @param limit - The maximum number of articles to return.
 * @returns A normalized array of articles.
 */
function normalizeArticles(articles: Article[], limit: number = 6): Article[] {
  return articles.slice(0, limit).map((article) => ({
    ...article,
    slug: slugify(article.title),
    image: article.image || FALLBACK_IMAGE,
  }));
}

/**
 * Loads and processes a specific section's data.
 * @param sectionFile - The file name of the section to load.
 * @param limit - The maximum number of articles to return.
 * @returns A promise that resolves with the section data.
 */
async function loadSection(
  sectionFile: string,
  limit: number = 6,
): Promise<SectionData> {
  const data = await readJSON<SectionData>(sectionFile);
  return {
    ...data,
    articles: normalizeArticles(data.articles, limit),
  };
}

// --- Public Helper Functions ---

export const getFeatured = (limit: number = 8) =>
  loadSection(SECTION_FILES.featured, limit);
export const getLatest = (limit: number = 6) =>
  loadSection(SECTION_FILES.latest, limit);
export const getAgriNews = (limit: number = 6) =>
  loadSection(SECTION_FILES.agriNews, limit);
export const getProvinceNews = (limit: number = 6) =>
  loadSection(SECTION_FILES.provinceNews, limit);
export const getCityNews = (limit: number = 6) =>
  loadSection(SECTION_FILES.cityNews, limit);
export const getModels = (limit: number = 6) =>
  loadSection(SECTION_FILES.models, limit);
export const getScience = (limit: number = 6) =>
  loadSection(SECTION_FILES.science, limit);
export const getPolicies = (limit: number = 6) =>
  loadSection(SECTION_FILES.policies, limit);
export const getServices = (limit: number = 6) =>
  loadSection(SECTION_FILES.services, limit);
export const getPrices = (limit: number = 5) =>
  loadSection(SECTION_FILES.prices, limit);
export const getOCOP = (limit: number = 8) =>
  loadSection(SECTION_FILES.ocop, limit);
export const getCulture = (limit: number = 8) =>
  loadSection(SECTION_FILES.culture, limit);
export const getEvents = (limit: number = 5) =>
  loadSection(SECTION_FILES.events, limit);
export const getNewTechDocs = (limit: number = 8) =>
  loadSection(SECTION_FILES.newTechDocs, limit);

export async function getAllArticlesForSearch(): Promise<Article[]> {
  const allFiles = Object.values(SECTION_FILES);
  const allSections = await Promise.all(
    allFiles.map((file) => readJSON<SectionData>(file)),
  );

  const allArticles = allSections.flatMap((section) => section.articles);

  // Remove duplicates based on link
  const uniqueArticles = Array.from(
    new Map(allArticles.map((article) => [article.link, article])).values(),
  );

  return normalizeArticles(uniqueArticles, 200); // Limit to 200 for client-side search
}
