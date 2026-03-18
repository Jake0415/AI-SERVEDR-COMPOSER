// ============================================================
// Drizzle ORM 관계 정의
// ============================================================

import { relations } from "drizzle-orm";
import {
  tenants,
  users,
  customers,
  customerContacts,
  partCategories,
  parts,
  partPrices,
  partPriceHistory,
  rfpDocuments,
  quotations,
  quotationItems,
  bidResults,
  notifications,
} from "./schema";

// --- 테넌트 관계 ---
export const tenantsRelations = relations(tenants, ({ many }) => ({
  users: many(users),
  customers: many(customers),
  partCategories: many(partCategories),
  parts: many(parts),
}));

// --- 사용자 관계 ---
export const usersRelations = relations(users, ({ one }) => ({
  tenant: one(tenants, { fields: [users.tenantId], references: [tenants.id] }),
}));

// --- 거래처 관계 ---
export const customersRelations = relations(customers, ({ one, many }) => ({
  tenant: one(tenants, { fields: [customers.tenantId], references: [tenants.id] }),
  contacts: many(customerContacts),
}));

export const customerContactsRelations = relations(customerContacts, ({ one }) => ({
  customer: one(customers, { fields: [customerContacts.customerId], references: [customers.id] }),
}));

// --- 부품 카테고리 관계 ---
export const partCategoriesRelations = relations(partCategories, ({ one, many }) => ({
  tenant: one(tenants, { fields: [partCategories.tenantId], references: [tenants.id] }),
  parts: many(parts),
}));

// --- 부품 관계 ---
export const partsRelations = relations(parts, ({ one }) => ({
  tenant: one(tenants, { fields: [parts.tenantId], references: [tenants.id] }),
  category: one(partCategories, { fields: [parts.categoryId], references: [partCategories.id] }),
  price: one(partPrices, { fields: [parts.id], references: [partPrices.partId] }),
}));

// --- 부품 가격 관계 ---
export const partPricesRelations = relations(partPrices, ({ one }) => ({
  part: one(parts, { fields: [partPrices.partId], references: [parts.id] }),
}));

// --- 가격 이력 관계 ---
export const partPriceHistoryRelations = relations(partPriceHistory, ({ one }) => ({
  part: one(parts, { fields: [partPriceHistory.partId], references: [parts.id] }),
  tenant: one(tenants, { fields: [partPriceHistory.tenantId], references: [tenants.id] }),
  changedByUser: one(users, { fields: [partPriceHistory.changedBy], references: [users.id] }),
}));

// --- RFP 관계 ---
export const rfpDocumentsRelations = relations(rfpDocuments, ({ one, many }) => ({
  tenant: one(tenants, { fields: [rfpDocuments.tenantId], references: [tenants.id] }),
  uploadedByUser: one(users, { fields: [rfpDocuments.uploadedBy], references: [users.id] }),
  quotations: many(quotations),
}));

// --- 견적 관계 ---
export const quotationsRelations = relations(quotations, ({ one, many }) => ({
  tenant: one(tenants, { fields: [quotations.tenantId], references: [tenants.id] }),
  rfp: one(rfpDocuments, { fields: [quotations.rfpId], references: [rfpDocuments.id] }),
  customer: one(customers, { fields: [quotations.customerId], references: [customers.id] }),
  createdByUser: one(users, { fields: [quotations.createdBy], references: [users.id] }),
  items: many(quotationItems),
  bidResults: many(bidResults),
}));

export const quotationItemsRelations = relations(quotationItems, ({ one }) => ({
  quotation: one(quotations, { fields: [quotationItems.quotationId], references: [quotations.id] }),
  part: one(parts, { fields: [quotationItems.partId], references: [parts.id] }),
}));

// --- 낙찰 관계 ---
export const bidResultsRelations = relations(bidResults, ({ one }) => ({
  quotation: one(quotations, { fields: [bidResults.quotationId], references: [quotations.id] }),
  recordedByUser: one(users, { fields: [bidResults.recordedBy], references: [users.id] }),
}));

// --- 알림 관계 ---
export const notificationsRelations = relations(notifications, ({ one }) => ({
  tenant: one(tenants, { fields: [notifications.tenantId], references: [tenants.id] }),
  user: one(users, { fields: [notifications.userId], references: [users.id] }),
}));
