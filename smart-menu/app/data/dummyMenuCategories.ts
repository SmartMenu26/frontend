// src/data/dummyMenuCategories.ts
export type MealKind = "food" | "drink";

export type Category = {
  id: string;
  label: string;
  subcategories: { id: string; label: string }[];
};

export const DUMMY_CATEGORIES: Record<MealKind, Category[]> = {
  food: [
    {
      id: "c_main",
      label: "Главни јадења",
      subcategories: [
        { id: "beef", label: "Телешко" },
        { id: "pork", label: "Свинско" },
        { id: "chicken", label: "Пилешко" },
        { id: "lamb", label: "Јагнешко" },
      ],
    },
    {
      id: "c_app",
      label: "Предјадења",
      subcategories: [
        { id: "cold", label: "Ладни" },
        { id: "hot", label: "Топли" },
      ],
    },
    {
      id: "c_salad",
      label: "Салати",
      subcategories: [
        { id: "summer", label: "Летни" },
        { id: "winter", label: "Зимски" },
      ],
    },
  ],

  drink: [
    {
      id: "c_soft",
      label: "Безалкохолни",
      subcategories: [
        { id: "soda", label: "Газирани" },
        { id: "juice", label: "Сокови" },
        { id: "water", label: "Вода" },
      ],
    },
    {
      id: "c_hot",
      label: "Топли пијалоци",
      subcategories: [
        { id: "coffee", label: "Кафе" },
        { id: "tea", label: "Чај" },
      ],
    },
    {
      id: "c_alcohol",
      label: "Алкохол",
      subcategories: [
        { id: "beer", label: "Пиво" },
        { id: "wine", label: "Вино" },
        { id: "spirit", label: "Жестоко" },
      ],
    },
  ],
};
