import { Test } from "@nestjs/testing";
import { PrismaSchemaParserService } from "./prismaSchemaParser.service";
import { ExistingEntitySelect } from "./types";
import { MockedAmplicationLoggerProvider } from "@amplication/util/nestjs/logging/test-utils";
import { CreateBulkEntitiesInput } from "../entity/entity.service";
import { EnumDataType } from "../../enums/EnumDataType";
import { EnumActionLogLevel } from "../action/dto";
import { ActionContext } from "../userAction/types";
import * as validators from "./validators";

describe("prismaSchemaParser", () => {
  let service: PrismaSchemaParserService;
  let actionContext: ActionContext;

  beforeEach(async () => {
    jest.clearAllMocks();
    jest.spyOn(validators, "isValidSchema").mockReset();

    const moduleRef = await Test.createTestingModule({
      controllers: [],
      providers: [PrismaSchemaParserService, MockedAmplicationLoggerProvider],
    }).compile();

    service = moduleRef.get<PrismaSchemaParserService>(
      PrismaSchemaParserService
    );

    actionContext = {
      onEmitUserActionLog: jest.fn(),
    };
  });

  describe("convertPrismaSchemaForImportObjects", () => {
    describe("when the schema is invalid", () => {
      beforeEach(() => {
        jest.spyOn(validators, "isValidSchema").mockImplementation(() => ({
          isValid: false,
          errorMessage: "Prisma Schema Validation Failed",
        }));
      });
      it("should return a validation error if the schema is empty", async () => {
        const prismaSchema = "";
        const existingEntities: ExistingEntitySelect[] = [];

        await expect(
          service.convertPrismaSchemaForImportObjects(
            prismaSchema,
            existingEntities,
            actionContext
          )
        ).rejects.toThrowError("Prisma Schema Validation Failed");
      });

      it("should return a validation error if the schema is not a valid Prisma schema", async () => {
        const prismaSchema = `datasource db {
          provider = "postgresql"
          url      = env("DB_URL")
        }
        
        generator client {
          provider = "prisma-client-js"
        }
        
        model Admin-1 {
          id         Int   @id @default(autoincrement())
          createdAt  DateTime @default(now())
          username   String   @unique @db.VarChar(256)
          roles      Json?
        }`;

        const existingEntities: ExistingEntitySelect[] = [];

        await expect(
          service.convertPrismaSchemaForImportObjects(
            prismaSchema,
            existingEntities,
            actionContext
          )
        ).rejects.toThrowError("Prisma Schema Validation Failed");
      });
    });

    describe("when the schema is valid", () => {
      beforeEach(() => {
        jest.spyOn(validators, "isValidSchema").mockImplementation(() => ({
          isValid: true,
        }));
      });
      it("should return an object with entities and fields and an empty log", async () => {
        // arrange
        const prismaSchema = `datasource db {
          provider = "postgresql"
          url      = env("DB_URL")
        }
        
        generator client {
          provider = "prisma-client-js"
        }
        
        model Admin {
          id         Int   @id @default(autoincrement())
          createdAt  DateTime @default(now())
          username   String   @unique @db.VarChar(256)
          roles      Json?
        }`;
        const existingEntities: ExistingEntitySelect[] = [];
        // act
        const result = await service.convertPrismaSchemaForImportObjects(
          prismaSchema,
          existingEntities,
          actionContext
        );
        // assert
        const expectedEntitiesWithFields: CreateBulkEntitiesInput[] = [
          {
            id: expect.any(String),
            name: "Admin",
            displayName: "Admin",
            pluralDisplayName: "Admins",
            description: "",
            customAttributes: "",
            fields: [
              {
                permanentId: expect.any(String),
                name: "id",
                displayName: "Id",
                dataType: EnumDataType.Id,
                required: true,
                unique: false,
                searchable: false,
                description: "",
                properties: {
                  idType: "AUTO_INCREMENT",
                },
                customAttributes: "",
              },
              {
                permanentId: expect.any(String),
                name: "createdAt",
                displayName: "Created At",
                dataType: EnumDataType.CreatedAt,
                required: true,
                unique: false,
                searchable: false,
                description: "",
                properties: {},
                customAttributes: "",
              },
              {
                permanentId: expect.any(String),
                name: "username",
                displayName: "Username",
                dataType: EnumDataType.SingleLineText,
                required: true,
                unique: true,
                searchable: false,
                description: "",
                properties: {
                  maxLength: 256,
                },
                customAttributes: "@db.VarChar(256)",
              },
              {
                permanentId: expect.any(String),
                name: "roles",
                displayName: "Roles",
                dataType: EnumDataType.Json,
                required: false,
                unique: false,
                searchable: false,
                description: "",
                properties: {},
                customAttributes: "",
              },
            ],
          },
        ];
        expect(result).toEqual(expectedEntitiesWithFields);
      });

      it("should rename models starting in lower case to upper case, add a `@@map` attribute to the model with the original model name and a log informing what happened", async () => {
        // arrange
        const prismaSchema = `datasource db {
          provider = "postgresql"
          url      = env("DB_URL")
        }
        
        generator client {
          provider = "prisma-client-js"
        }
        
        model admin {
          id         Int   @id @default(autoincrement())
          createdAt  DateTime @default(now())
          username   String   @unique @db.VarChar(256)
          roles      Json?
        }`;
        const existingEntities: ExistingEntitySelect[] = [];
        // act
        const result = await service.convertPrismaSchemaForImportObjects(
          prismaSchema,
          existingEntities,
          actionContext
        );
        // assert
        const expectedEntitiesWithFields: CreateBulkEntitiesInput[] = [
          {
            id: expect.any(String),
            name: "Admin",
            displayName: "Admin",
            pluralDisplayName: "Admins",
            description: "",
            customAttributes: '@@map("admin")',
            fields: [
              {
                permanentId: expect.any(String),
                name: "id",
                displayName: "Id",
                dataType: EnumDataType.Id,
                required: true,
                unique: false,
                searchable: false,
                description: "",
                properties: {
                  idType: "AUTO_INCREMENT",
                },
                customAttributes: "",
              },
              {
                permanentId: expect.any(String),
                name: "createdAt",
                displayName: "Created At",
                dataType: EnumDataType.CreatedAt,
                required: true,
                unique: false,
                searchable: false,
                description: "",
                properties: {},
                customAttributes: "",
              },
              {
                permanentId: expect.any(String),
                name: "username",
                displayName: "Username",
                dataType: EnumDataType.SingleLineText,
                required: true,
                unique: true,
                searchable: false,
                description: "",
                properties: {
                  maxLength: 256,
                },
                customAttributes: "@db.VarChar(256)",
              },
              {
                permanentId: expect.any(String),
                name: "roles",
                displayName: "Roles",
                dataType: EnumDataType.Json,
                required: false,
                unique: false,
                searchable: false,
                description: "",
                properties: {},
                customAttributes: "",
              },
            ],
          },
        ];
        expect(result).toEqual(expectedEntitiesWithFields);
        expect(actionContext.onEmitUserActionLog).toBeCalledTimes(7);
        expect(actionContext.onEmitUserActionLog).toHaveBeenNthCalledWith(
          1,
          "Starting Prisma Schema Validation",
          EnumActionLogLevel.Info
        );
        expect(actionContext.onEmitUserActionLog).toHaveBeenNthCalledWith(
          2,
          `Prisma Schema Validation completed successfully`,
          EnumActionLogLevel.Info
        );
        expect(actionContext.onEmitUserActionLog).toHaveBeenNthCalledWith(
          3,
          `Prepare Prisma Schema for import`,
          EnumActionLogLevel.Info
        );
        expect(actionContext.onEmitUserActionLog).toHaveBeenNthCalledWith(
          4,
          `Model name "admin" was changed to "Admin"`,
          EnumActionLogLevel.Info
        );
        expect(actionContext.onEmitUserActionLog).toHaveBeenNthCalledWith(
          5,
          `Prepare Prisma Schema for import completed`,
          EnumActionLogLevel.Info
        );
        expect(actionContext.onEmitUserActionLog).toHaveBeenNthCalledWith(
          6,
          `Create import objects from Prisma Schema`,
          EnumActionLogLevel.Info
        );
        expect(actionContext.onEmitUserActionLog).toHaveBeenNthCalledWith(
          7,
          `Create import objects from Prisma Schema completed`,
          EnumActionLogLevel.Info
        );
      });

      describe("when we handle a relation field", () => {
        it("should return object with entities and fields with the right relations and a log", async () => {
          const prismaSchema = `datasource db {
            provider = "postgresql"
            url      = env("DB_URL")
          }
          
          generator client {
            provider = "prisma-client-js"
          }
          
          model Order {
            id         String    @id @default(cuid())
            customer   Customer? @relation(fields: [customerId], references: [id])
            customerId String?
          }
          
          model Customer {
            id          String     @id @default(cuid())
            orders      Order[]
          }`;
          const existingEntities: ExistingEntitySelect[] = [];
          const customerFieldPermanentId = expect.any(String);
          const result = await service.convertPrismaSchemaForImportObjects(
            prismaSchema,
            existingEntities,
            actionContext
          );

          const expectedEntitiesWithFields: CreateBulkEntitiesInput[] = [
            {
              id: expect.any(String),
              name: "Order",
              displayName: "Order",
              pluralDisplayName: "Orders",
              description: "",
              customAttributes: "",
              fields: [
                {
                  permanentId: expect.any(String),
                  name: "id",
                  displayName: "Id",
                  dataType: EnumDataType.Id,
                  required: true,
                  unique: false,
                  searchable: false,
                  description: "",
                  properties: {
                    idType: "CUID",
                  },
                  customAttributes: "",
                },
                {
                  permanentId: customerFieldPermanentId,
                  name: "customer",
                  displayName: "Customer",
                  dataType: EnumDataType.Lookup,
                  required: false,
                  unique: false,
                  searchable: true,
                  description: "",
                  properties: {
                    relatedEntityId: expect.any(String),
                    allowMultipleSelection: false,
                    fkHolder: customerFieldPermanentId,
                    fkFieldName: "customerId",
                  },
                  customAttributes: "",
                  relatedFieldAllowMultipleSelection: true,
                  relatedFieldDisplayName: "Orders",
                  relatedFieldName: "orders",
                },
              ],
            },
            {
              id: expect.any(String),
              name: "Customer",
              displayName: "Customer",
              pluralDisplayName: "Customers",
              description: "",
              customAttributes: "",
              fields: [
                {
                  permanentId: expect.any(String),
                  name: "id",
                  displayName: "Id",
                  dataType: EnumDataType.Id,
                  required: true,
                  unique: false,
                  searchable: false,
                  description: "",
                  properties: {
                    idType: "CUID",
                  },
                  customAttributes: "",
                },
              ],
            },
          ];
          expect(result).toEqual(expectedEntitiesWithFields);
          expect(actionContext.onEmitUserActionLog).toBeCalledTimes(6);
          expect(actionContext.onEmitUserActionLog).toHaveBeenNthCalledWith(
            1,
            "Starting Prisma Schema Validation",
            EnumActionLogLevel.Info
          );
          expect(actionContext.onEmitUserActionLog).toHaveBeenNthCalledWith(
            2,
            `Prisma Schema Validation completed successfully`,
            EnumActionLogLevel.Info
          );
          expect(actionContext.onEmitUserActionLog).toHaveBeenNthCalledWith(
            3,
            `Prepare Prisma Schema for import`,
            EnumActionLogLevel.Info
          );
          expect(actionContext.onEmitUserActionLog).toHaveBeenNthCalledWith(
            4,
            `Prepare Prisma Schema for import completed`,
            EnumActionLogLevel.Info
          );
          expect(actionContext.onEmitUserActionLog).toHaveBeenNthCalledWith(
            5,
            `Create import objects from Prisma Schema`,
            EnumActionLogLevel.Info
          );
          expect(actionContext.onEmitUserActionLog).toHaveBeenNthCalledWith(
            6,
            `Create import objects from Prisma Schema completed`,
            EnumActionLogLevel.Info
          );
        });

        it("should not rename the field and therefore, should not add the @map attribute if it is a relation field", async () => {
          const prismaSchema = `datasource db {
            provider = "postgresql"
            url      = env("DB_URL")
          }
          
          generator client {
            provider = "prisma-client-js"
          }
          
          model Order {
            id         String    @id @default(cuid())
            the_customer   Customer? @relation(fields: [customerId], references: [id])
            customerId String?
          }
          
          model Customer {
            id          String     @id @default(cuid())
            orders      Order[]
          }`;
          const existingEntities: ExistingEntitySelect[] = [];
          const customerFieldPermanentId = expect.any(String);
          const result = await service.convertPrismaSchemaForImportObjects(
            prismaSchema,
            existingEntities,
            actionContext
          );
          // assert
          const expectedEntitiesWithFields: CreateBulkEntitiesInput[] = [
            {
              id: expect.any(String),
              name: "Order",
              displayName: "Order",
              pluralDisplayName: "Orders",
              description: "",
              customAttributes: "",
              fields: [
                {
                  permanentId: expect.any(String),
                  name: "id",
                  displayName: "Id",
                  dataType: EnumDataType.Id,
                  required: true,
                  unique: false,
                  searchable: false,
                  description: "",
                  properties: {
                    idType: "CUID",
                  },
                  customAttributes: "",
                },
                {
                  permanentId: customerFieldPermanentId,
                  name: "the_customer", // should not be formatted to theCustomer because it is a relation field
                  displayName: "The Customer",
                  dataType: EnumDataType.Lookup,
                  required: false,
                  unique: false,
                  searchable: true,
                  description: "",
                  properties: {
                    relatedEntityId: expect.any(String),
                    allowMultipleSelection: false,
                    fkHolder: customerFieldPermanentId,
                    fkFieldName: "customerId",
                  },
                  customAttributes: "",
                  relatedFieldAllowMultipleSelection: true,
                  relatedFieldDisplayName: "Orders",
                  relatedFieldName: "orders",
                },
              ],
            },
            {
              id: expect.any(String),
              name: "Customer",
              displayName: "Customer",
              pluralDisplayName: "Customers",
              description: "",
              customAttributes: "",
              fields: [
                {
                  permanentId: expect.any(String),
                  name: "id",
                  displayName: "Id",
                  dataType: EnumDataType.Id,
                  required: true,
                  unique: false,
                  searchable: false,
                  description: "",
                  properties: {
                    idType: "CUID",
                  },
                  customAttributes: "",
                },
              ],
            },
          ];
          expect(result).toEqual(expectedEntitiesWithFields);
        });

        it("should create one side of the relation (the first side that it encounters in the schema) when the relation is many to many", async () => {
          // arrange
          const prismaSchema = `datasource db {
            provider = "postgresql"
            url      = env("DB_URL")
          }
          
          generator client {
            provider = "prisma-client-js"
          }
          
          model Doctor {
            id          String     @id @default(cuid())
            patients    Patient[]  
          }
          
          model Patient {
            id             String          @id @default(cuid())
            doctors        Doctor[]       
          }`;
          const existingEntities: ExistingEntitySelect[] = [];
          // act
          const result = await service.convertPrismaSchemaForImportObjects(
            prismaSchema,
            existingEntities,
            actionContext
          );
          // assert
          const expectedEntitiesWithFields: CreateBulkEntitiesInput[] = [
            {
              id: expect.any(String),
              name: "Doctor",
              displayName: "Doctor",
              pluralDisplayName: "Doctors",
              description: "",
              customAttributes: "",
              fields: [
                {
                  permanentId: expect.any(String),
                  name: "id",
                  displayName: "Id",
                  dataType: EnumDataType.Id,
                  required: true,
                  unique: false,
                  searchable: false,
                  description: "",
                  properties: {
                    idType: "CUID",
                  },
                  customAttributes: "",
                },
                {
                  permanentId: expect.any(String),
                  name: "patients",
                  displayName: "Patients",
                  dataType: EnumDataType.Lookup,
                  required: true,
                  unique: false,
                  searchable: true,
                  description: "",
                  properties: {
                    relatedEntityId: expect.any(String),
                    allowMultipleSelection: true,
                    fkHolder: null,
                    fkFieldName: "",
                  },
                  customAttributes: "",
                  relatedFieldAllowMultipleSelection: true,
                  relatedFieldDisplayName: "Doctors",
                  relatedFieldName: "doctors",
                },
              ],
            },
            {
              id: expect.any(String),
              name: "Patient",
              displayName: "Patient",
              pluralDisplayName: "Patients",
              description: "",
              customAttributes: "",
              fields: [
                {
                  permanentId: expect.any(String),
                  name: "id",
                  displayName: "Id",
                  dataType: EnumDataType.Id,
                  required: true,
                  unique: false,
                  searchable: false,
                  description: "",
                  properties: {
                    idType: "CUID",
                  },
                  customAttributes: "",
                },
              ],
            },
          ];
          expect(result).toEqual(expectedEntitiesWithFields);
        });
      });
    });
  });
});