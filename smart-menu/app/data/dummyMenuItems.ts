// src/data/dummyMenuItems.ts
import type { MealKind } from "./dummyMenuCategories";

export type MenuItem = {
  id: string;
  title: string;
  imageUrl: string;
  price: number;
};

export type DummyMenuItem = MenuItem & {
  kind: MealKind;
  categoryId: string;
  subcategoryId?: string;
  isPopular?: boolean;
};

export const DUMMY_ITEMS: DummyMenuItem[] = [
  // ================= FOOD =================
  {
    id: "f1",
    title: "Bakal Burger",
    imageUrl: "/images/hamburger.png",
    price: 370,
    kind: "food",
    categoryId: "c_main",
    subcategoryId: "beef",
    isPopular: true,
  },
  {
    id: "f2",
    title: "Spaghetti al Pomodoro",
    imageUrl: "/images/spaghetti.png",
    price: 320,
    kind: "food",
    categoryId: "c_main",
    subcategoryId: "chicken",
  },
  {
    id: "f3",
    title: "Shopska Salad",
    imageUrl: "https://images.unsplash.com/photo-1551892374-ecf8754cf8b0?w=600&q=80",
    price: 250,
    kind: "food",
    categoryId: "c_salad",
    subcategoryId: "summer",
    isPopular: true,
  },
    {
    id: "f4",
    title: "Shopska Salad",
    imageUrl: "https://images.unsplash.com/photo-1551892374-ecf8754cf8b0?w=600&q=80",
    price: 250,
    kind: "food",
    categoryId: "c_main",
    subcategoryId: "summer",
    isPopular: true,
  },

  // ================= DRINK =================
  {
    id: "d1",
    title: "Coca-Cola",
    imageUrl: "/images/coke.png",
    price: 120,
    kind: "drink",
    categoryId: "c_soft",
    subcategoryId: "soda",
    isPopular: true,
  },
  {
    id: "d2",
    title: "Orange Juice",
    imageUrl: "/images/juice.png",
    price: 140,
    kind: "drink",
    categoryId: "c_soft",
    subcategoryId: "juice",
  },
  {
    id: "d3",
    title: "Espresso",
    imageUrl: "/images/coffee.png",
    price: 100,
    kind: "drink",
    categoryId: "c_hot",
    subcategoryId: "coffee",
  },
  {
    id: "d4",
    title: "Red Wine",
    imageUrl: "/images/wine.png",
    price: 220,
    kind: "drink",
    categoryId: "c_alcohol",
    subcategoryId: "wine",
    isPopular: true,
  },
];
