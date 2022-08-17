export let defaultCategories: string[] = ['Salary', 'Gifts', 'Food', 'Travel'];

export function setDefaultCategories(categories: string[]): string[] {
  defaultCategories = categories;
  return defaultCategories;
}
