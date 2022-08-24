import { user1, user2, user3 } from 'src/users/users.stubs';
import type { Category } from './category.entity';
import type { DefaultCategory } from './default-categories.entity';
import type { CreateCategoryDto } from './dto/create-category.dto';
import type { UpdateCategoryDto } from './dto/update-category.dto';
import type { UpdateDefaultCategoriesDto } from './dto/update-default-categories';

export const category1: Category = Object.freeze(
  Object.create({
    id: 1,
    label: 'testcategory1',
    user: user1,
  }),
);
export const category2: Category = Object.freeze(
  Object.create({
    id: 2,
    label: 'testcategory2',
    user: user2,
  }),
);
export const category3: Category = Object.freeze(
  Object.create({
    id: 3,
    label: 'testcategory3',
    user: user3,
  }),
);

export const categories = [category1, category2, category3];

export const createCategoryDto1: CreateCategoryDto = Object.freeze({
  label: 'categorylabel1',
});

export const updateCategoryDto1: UpdateCategoryDto = Object.freeze({
  label: 'categoryupdatedlabel1',
});

export const defaultCategory1: DefaultCategory = Object.freeze({
  id: 1,
  label: 'defaultcategorylabel1',
});

export const defaultCategory2: DefaultCategory = Object.freeze({
  id: 2,
  label: 'defaultcategorylabel2',
});

export const defaultCategory3: DefaultCategory = Object.freeze({
  id: 3,
  label: 'defaultcategorylabel3',
});

export const defaultCategories = [
  defaultCategory1,
  defaultCategory2,
  defaultCategory3,
];

export const updateDefaultCategoriesDto1: UpdateDefaultCategoriesDto =
  Object.freeze({
    categories: [
      'updatedefaulcategorylabel1',
      'updatedefaulcategorylabel2',
      'updatedefaulcategorylabel3',
      'Other',
    ],
  });
