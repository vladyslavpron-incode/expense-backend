import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TransactionsService } from 'src/transactions/transactions.service';
import type { User } from 'src/users/user.entity';
import { admin1, admin2, user1 } from 'src/users/users.stubs';
import { DeleteResult, Repository } from 'typeorm';
import { CategoriesService } from './categories.service';
import {
  categories,
  category1,
  category2,
  createCategoryDto1,
  defaultCategories,
  updateCategoryDto1,
  updateDefaultCategoriesDto1,
} from './categories.stubs';
import { Category, otherCategory } from './category.entity';
import { DefaultCategory } from './default-categories.entity';

describe('CategoriesService', () => {
  let categoriesService: CategoriesService;
  let categoriesRepositoryMock: Repository<Category>;
  let defaultCategoriesRepositoryMock: Repository<DefaultCategory>;

  const transactionsServiceMock = {
    getUserOtherCategoryTransactions: jest.fn(),
  };

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      providers: [
        CategoriesService,
        { provide: getRepositoryToken(Category), useClass: Repository },
        { provide: getRepositoryToken(DefaultCategory), useClass: Repository },
        { provide: TransactionsService, useValue: transactionsServiceMock },
      ],
    }).compile();

    categoriesService = app.get<CategoriesService>(CategoriesService);
    categoriesRepositoryMock = app.get<Repository<Category>>(
      getRepositoryToken(Category),
    );
    defaultCategoriesRepositoryMock = app.get<Repository<DefaultCategory>>(
      getRepositoryToken(DefaultCategory),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllCategories method', () => {
    const categoriesArray = categories;
    it('should return array of categories', async () => {
      const spyRepositoryFind = jest
        .spyOn(categoriesRepositoryMock, 'find')
        .mockResolvedValue(categoriesArray);

      const result = await categoriesService.getAllCategories();

      expect(spyRepositoryFind).toHaveBeenCalled();
      expect(result).toEqual(categoriesArray);
    });
  });

  describe('getCategory method', () => {
    const category = category1;
    const user = user1;
    const admin = admin1;
    it('should return category of user by id', async () => {
      const spyServiceGetUserCategoryById = jest
        .spyOn(categoriesService, 'getUserCategoryById')
        .mockResolvedValue(category);

      const result = await categoriesService.getCategory(category.id, user);

      expect(spyServiceGetUserCategoryById).toBeCalled();
      expect(result).toEqual(category);
    });

    it('should return any category by id, when asked by admin', async () => {
      const spyServiceGetCategoryById = jest
        .spyOn(categoriesService, 'getCategoryById')
        .mockResolvedValue(category);

      const result = await categoriesService.getCategory(category.id, admin);

      expect(spyServiceGetCategoryById).toBeCalled();
      expect(result).toEqual(category);
    });
  });

  describe('getCategoryById method', () => {
    const category = category1;
    const user = user1;
    it('should return category by id', async () => {
      const spyRepositoryFindOne = jest
        .spyOn(categoriesRepositoryMock, 'findOne')
        .mockResolvedValue(category);

      const result = await categoriesService.getCategoryById(category.id, user);

      expect(spyRepositoryFindOne).toBeCalledWith(
        expect.objectContaining({
          where: { id: category.id },
          relations: expect.objectContaining({ transactions: true }),
        }),
      );
      expect(result).toEqual(category);
    });

    it('should return user other category when its id met', async () => {
      const spyGetUserOtherCategory = jest
        .spyOn(categoriesService, 'getUserOtherCategory')
        .mockResolvedValue(category);

      const result = await categoriesService.getCategoryById(
        otherCategory.id,
        user,
      );

      expect(spyGetUserOtherCategory).toBeCalled();
      expect(result).toEqual(category);
    });
  });

  describe('getCategoryByLabel method', () => {
    const category = category1;
    const user = user1;
    const admin = admin1;
    it('should return category by label', async () => {
      const spyRepositoryFindOne = jest
        .spyOn(categoriesRepositoryMock, 'findOne')
        .mockResolvedValue(category);

      const result = await categoriesService.getCategoryByLabel(
        category.label,
        admin,
      );

      expect(spyRepositoryFindOne).toBeCalledWith(
        expect.objectContaining({
          where: { label: category.label },
          relations: expect.objectContaining({ transactions: true }),
        }),
      );
      expect(result).toEqual(category);
    });

    it('should return user other category when its label met', async () => {
      const spyGetUserOtherCategory = jest
        .spyOn(categoriesService, 'getUserOtherCategory')
        .mockResolvedValue(category);

      const result = await categoriesService.getCategoryByLabel(
        otherCategory.label,
        user,
      );

      expect(spyGetUserOtherCategory).toBeCalled();
      expect(result).toEqual(category);
    });
  });

  describe('getUserCategories method', () => {
    const category = category1;
    const categoriesArray = categories;
    const user = user1;
    it('should return user categories including otherCategory', async () => {
      const spyRepositoryFind = jest
        .spyOn(categoriesRepositoryMock, 'find')
        .mockResolvedValue(categoriesArray);

      const spyGetUserOtherCategory = jest
        .spyOn(categoriesService, 'getUserOtherCategory')
        .mockResolvedValue(category);

      const result = await categoriesService.getUserCategories(user);

      expect(spyRepositoryFind).toBeCalledWith(
        expect.objectContaining({
          where: { user },
          relations: expect.objectContaining({ transactions: true }),
        }),
      );
      expect(spyGetUserOtherCategory).toBeCalled();
      expect(result).toHaveLength(categoriesArray.length + 1);
    });
  });

  describe('getUserCategoryById method', () => {
    const category = category1;
    const user = user1;
    it('should return user category by id', async () => {
      const spyRepositoryFindOne = jest
        .spyOn(categoriesRepositoryMock, 'findOne')
        .mockResolvedValue(category);

      const result = await categoriesService.getUserCategoryById(
        user,
        category.id,
      );

      expect(spyRepositoryFindOne).toBeCalledWith(
        expect.objectContaining({
          where: { id: category.id, user },
          relations: expect.objectContaining({ transactions: true }),
        }),
      );
      expect(result).toEqual(category);
    });
  });

  describe('getUserCategoryByLabel method', () => {
    const category = category1;
    const user = user1;
    it('should return user category by label', async () => {
      const spyRepositoryFindOne = jest
        .spyOn(categoriesRepositoryMock, 'findOne')
        .mockResolvedValue(category);

      const result = await categoriesService.getUserCategoryByLabel(
        user,
        category.label,
      );

      expect(spyRepositoryFindOne).toBeCalledWith(
        expect.objectContaining({
          where: { label: category.label, user },
          relations: expect.objectContaining({ transactions: true }),
        }),
      );
      expect(result).toEqual(category);
    });

    it('should return user other category when its label met', async () => {
      const userOtherCategory = { ...otherCategory, user } as Category;

      const spyGetUserOtherCategory = jest
        .spyOn(categoriesService, 'getUserOtherCategory')
        .mockResolvedValue(userOtherCategory);

      const result = await categoriesService.getUserCategoryByLabel(
        user,
        otherCategory.label,
      );

      expect(spyGetUserOtherCategory).toBeCalled();
      expect(result).toEqual(userOtherCategory);
    });
  });

  describe('getUserOtherCategory method', () => {
    const user = user1;
    it('should return user other category with fetched transactions', async () => {
      const spyTransactionsGetOtherCategoryTransactions = jest
        .spyOn(transactionsServiceMock, 'getUserOtherCategoryTransactions')
        .mockResolvedValue(null);

      const result = await categoriesService.getUserOtherCategory(user);

      expect(spyTransactionsGetOtherCategoryTransactions).toBeCalled();

      expect(result).toEqual({ ...otherCategory, transactions: null });
    });
  });

  describe('createCategory method', () => {
    const category = category1;
    const createCategoryDto = createCategoryDto1;
    const user = user1;
    it('should create category, assign user to it and save', async () => {
      const categoryWithoutUser = { ...category, user: {} as User };

      jest
        .spyOn(categoriesService, 'getUserCategoryByLabel')
        .mockResolvedValue(null);

      const spyRepositoryCreate = jest
        .spyOn(categoriesRepositoryMock, 'create')
        .mockReturnValue(categoryWithoutUser);

      const spyRepositorySave = jest
        .spyOn(categoriesRepositoryMock, 'save')
        .mockResolvedValue(category);

      const result = await categoriesService.createCategory(
        user,
        createCategoryDto,
      );

      expect(spyRepositoryCreate).toBeCalled();
      expect(spyRepositorySave).toBeCalled();
      expect(result).toEqual(category);
    });

    it('should throw ConflictException when user already have category with same label', async () => {
      const createCategoryDtoWithExistingLabel = {
        ...createCategoryDto1,
        label: category.label,
      };
      const spyGetUserCategoryByLabel = jest
        .spyOn(categoriesService, 'getUserCategoryByLabel')
        .mockResolvedValue(category);

      expect(
        categoriesService.createCategory(
          user,
          createCategoryDtoWithExistingLabel,
        ),
      ).rejects.toThrowError(ConflictException);

      expect(spyGetUserCategoryByLabel).toBeCalled();
    });
  });

  describe('createDefaultCategories method', () => {
    const defaultCategoriesArray = defaultCategories;
    const user = user1;
    it('should create and save defaultCategories for user', async () => {
      jest
        .spyOn(defaultCategoriesRepositoryMock, 'find')
        .mockImplementation(() => Promise.resolve(defaultCategoriesArray));

      // directly overriden methods because jest does not infer array overload
      categoriesRepositoryMock.create = jest
        .fn()
        .mockReturnValue(defaultCategoriesArray);

      const spyRepositoryCreate = jest.spyOn(
        categoriesRepositoryMock,
        'create',
      );

      categoriesRepositoryMock.save = jest
        .fn()
        .mockResolvedValue(defaultCategoriesArray);

      const spyRepositorySave = jest.spyOn(categoriesRepositoryMock, 'save');

      const result = await categoriesService.createDefaultCategories(user);

      expect(spyRepositoryCreate).toBeCalled();
      expect(spyRepositorySave).toBeCalled();
      expect(result).toEqual(defaultCategoriesArray);
    });
  });

  describe('updateCategory method', () => {
    const user = user1;
    const admin = admin1;
    const anotherAdmin = admin2;
    const category = category1;
    const anotherCategory = category2;
    const updateCategoryDto = updateCategoryDto1;
    const updatedCategory = { ...category, updateCategoryDto };
    it('should update and return user category when updated by user', async () => {
      const spyGetUserCategryById = jest
        .spyOn(categoriesService, 'getUserCategoryById')
        .mockResolvedValue(category);

      // this method will not be called if dto has no label
      jest
        .spyOn(categoriesService, 'getUserCategoryByLabel')
        .mockResolvedValue(null);

      const spyRepositorySave = jest
        .spyOn(categoriesRepositoryMock, 'save')
        .mockResolvedValue(updatedCategory);

      const result = await categoriesService.updateCategory(
        category.id,
        updateCategoryDto,
        user,
      );

      expect(spyGetUserCategryById).toBeCalled();
      expect(spyRepositorySave).toBeCalled();

      expect(result).toEqual(updatedCategory);
    });

    it('should update and return any non-admin category when updated by admin', async () => {
      const spyGetCategryById = jest
        .spyOn(categoriesService, 'getCategoryById')
        .mockResolvedValue(category);

      // this method will not be called if dto has no label
      jest
        .spyOn(categoriesService, 'getUserCategoryByLabel')
        .mockResolvedValue(null);

      const spyRepositorySave = jest
        .spyOn(categoriesRepositoryMock, 'save')
        .mockResolvedValue(updatedCategory);

      const result = await categoriesService.updateCategory(
        category.id,
        updateCategoryDto,
        admin,
      );

      expect(spyGetCategryById).toBeCalled();
      expect(spyRepositorySave).toBeCalled();

      expect(result).toEqual(updatedCategory);
    });

    it('should throw NotFoundException on update of category that does not exists', async () => {
      const spyGetUserCategoryById = jest
        .spyOn(categoriesService, 'getUserCategoryById')
        .mockResolvedValue(null);

      expect(
        categoriesService.updateCategory(category.id, updateCategoryDto, user),
      ).rejects.toThrowError(NotFoundException);

      expect(spyGetUserCategoryById).toBeCalled();
    });

    it('should throw BadRequestException on updating otherCategory', async () => {
      const userOtherCategory = { ...otherCategory, user } as Category;
      const spyGetUserCategoryById = jest
        .spyOn(categoriesService, 'getUserCategoryById')
        .mockResolvedValue(userOtherCategory);

      expect(
        categoriesService.updateCategory(
          otherCategory.id,
          updateCategoryDto,
          user,
        ),
      ).rejects.toThrowError(BadRequestException);

      expect(spyGetUserCategoryById).toBeCalled();
    });

    it('should throw ForbiddenException on updating admin category by another admin', async () => {
      const adminCategory = { ...category, user: admin };
      const spyGetCategoryById = jest
        .spyOn(categoriesService, 'getCategoryById')
        .mockResolvedValue(adminCategory);

      expect(
        categoriesService.updateCategory(
          adminCategory.id,
          updateCategoryDto,
          anotherAdmin,
        ),
      ).rejects.toThrowError(ForbiddenException);

      expect(spyGetCategoryById).toBeCalled();
    });

    it('should throw ConflictException on updating label of category to already existing one for same user', async () => {
      const updateCategoryDtoWithSameLabel = {
        ...updateCategoryDto,
        label: anotherCategory.label,
      };
      const spyGetUserCategoryById = jest
        .spyOn(categoriesService, 'getUserCategoryById')
        .mockResolvedValue(category);

      const spyGetUserCategoryByLabel = jest
        .spyOn(categoriesService, 'getUserCategoryByLabel')
        .mockResolvedValue(anotherCategory);

      await expect(() =>
        categoriesService.updateCategory(
          category.id,
          updateCategoryDtoWithSameLabel,
          user,
        ),
      ).rejects.toThrowError(ConflictException);

      expect(spyGetUserCategoryById).toBeCalled();
      expect(spyGetUserCategoryByLabel).toBeCalled();
    });
  });

  describe('deleteCategory method', () => {
    const category = category1;
    const user = user1;
    const admin = admin1;
    const anotherAdmin = admin2;
    it('should delete category owned by user when asked by himself', async () => {
      const spyServiceGetUserCategoryById = jest
        .spyOn(categoriesService, 'getUserCategoryById')
        .mockResolvedValue(category);

      const spyRepositoryDelete = jest
        .spyOn(categoriesRepositoryMock, 'delete')
        .mockResolvedValue(new DeleteResult());

      await categoriesService.deleteCategory(category.id, user);

      expect(spyServiceGetUserCategoryById).toBeCalled();
      expect(spyRepositoryDelete).toBeCalled();
    });

    it('should delete any existsing non-admin category when asked by admin', async () => {
      const spyServiceGetCategoryById = jest
        .spyOn(categoriesService, 'getCategoryById')
        .mockResolvedValue(category);
      const spyRepositoryDelete = jest
        .spyOn(categoriesRepositoryMock, 'delete')
        .mockResolvedValue(new DeleteResult());

      await categoriesService.deleteCategory(category.id, admin);

      expect(spyServiceGetCategoryById).toBeCalled();
      expect(spyRepositoryDelete).toBeCalled();
    });

    it('should throw NotFoundException on deleting category that does not exists', async () => {
      const spyServiceGetUserCategoryById = jest
        .spyOn(categoriesService, 'getUserCategoryById')
        .mockResolvedValue(null);

      expect(
        categoriesService.deleteCategory(category.id, user),
      ).rejects.toThrowError(NotFoundException);

      expect(spyServiceGetUserCategoryById).toBeCalled();
    });

    it('should throw BadRequestException on deleting otherCategory', async () => {
      const userOtherCategory = { ...otherCategory, user } as Category;
      const spyServiceGetUserCategoryById = jest
        .spyOn(categoriesService, 'getUserCategoryById')
        .mockResolvedValue(userOtherCategory);

      expect(
        categoriesService.deleteCategory(otherCategory.id, user),
      ).rejects.toThrowError(BadRequestException);

      expect(spyServiceGetUserCategoryById).toBeCalled();
    });

    it('should throw ForbiddenException on deleting category of admin by another admin', async () => {
      const adminCategory = { ...category, user: admin as User };

      const spyServiceGetCategoryById = jest
        .spyOn(categoriesService, 'getCategoryById')
        .mockResolvedValue(adminCategory);

      expect(
        categoriesService.deleteCategory(adminCategory.id, anotherAdmin),
      ).rejects.toThrowError(ForbiddenException);

      expect(spyServiceGetCategoryById).toBeCalled();
    });
  });

  describe('getDefaultCategories method', () => {
    it('should return array', () => {
      const result = categoriesService.getDefaultCategories();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('updateDefaultCategories method', () => {
    const updateDefaultCategoriesDto = updateDefaultCategoriesDto1;
    const defaultCategoriesArray = defaultCategories;
    it('should delete old defaultCategories, create and save defaultCategories without otherCategory label and return array of labels', async () => {
      const expectedResult = defaultCategoriesArray.map(
        (category) => category.label,
      );

      const spyRepositoryDelete = jest
        .spyOn(defaultCategoriesRepositoryMock, 'delete')
        .mockResolvedValue(new DeleteResult());

      // directly overriden methods because jest does not infer array overload
      defaultCategoriesRepositoryMock.create = jest
        .fn()
        .mockReturnValue(defaultCategoriesArray);

      const spyRepositoryCreate = jest.spyOn(
        defaultCategoriesRepositoryMock,
        'create',
      );

      defaultCategoriesRepositoryMock.save = jest
        .fn()
        .mockResolvedValue(defaultCategoriesArray);

      const spyRepositorySave = jest.spyOn(
        defaultCategoriesRepositoryMock,
        'save',
      );

      const result = await categoriesService.updateDefaultCategories(
        updateDefaultCategoriesDto,
      );
      expect(result).toEqual(expectedResult);
      expect(spyRepositoryDelete).toBeCalled();
      expect(spyRepositoryCreate).toBeCalled();
      expect(spyRepositorySave).toBeCalled();
    });
  });
});
