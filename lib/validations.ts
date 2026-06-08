import { z } from "zod";

export const SignupSchema = z
  .object({
    name: z.string().min(2, "Name is too short").max(80),
    email: z.string().email(),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, "Password is required"),
});

export const CreateTenantSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email(),
  password: z.string().min(8),
});

export const OnboardingSchema = z.object({
  shopName: z.string().min(2).max(60),
  slug: z
    .string()
    .regex(/^[a-z0-9-]{3,30}$/, "3-30 chars: lowercase letters, numbers, hyphens"),
  whatsappNumber: z.string().min(8).max(20),
  currency: z.enum(["AED", "USD", "INR", "SAR", "QAR"]).default("AED"),
  locale: z.enum(["EN", "AR"]).default("EN"),
});

export const CreateShopSchema = OnboardingSchema;

export const UpdateShopSchema = z
  .object({
    name: z.string().min(2).max(60).optional(),
    tagline: z.string().max(120).optional(),
    logoUrl: z.string().url().optional(),
    coverUrl: z.string().url().optional(),
    whatsappNumber: z.string().min(8).max(20).optional(),
    currency: z.enum(["AED", "USD", "INR", "SAR", "QAR"]).optional(),
    locale: z.enum(["EN", "AR"]).optional(),
    themeColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
    isPublished: z.boolean().optional(),
    telrStoreId: z.string().optional(),
    telrAuthKey: z.string().optional(),
    stripeSecretKey: z.string().optional(),
    upiId: z.string().optional(),
    upiQrUrl: z.string().url().optional(),
    codEnabled: z.boolean().optional(),
    notifyNewOrder: z.boolean().optional(),
    notifyAbandonedCart: z.boolean().optional(),
    notifyLowStock: z.boolean().optional(),
    lowStockThreshold: z.number().int().min(0).max(1000).optional(),
    freeShippingThreshold: z.number().nonnegative().nullable().optional(),
    shippingFlatRate: z.number().nonnegative().optional(),
    region: z.enum(["UAE", "INDIA", "SAUDI", "KUWAIT", "INTERNATIONAL"]).optional(),
    taxType: z.enum(["NONE", "VAT", "GST"]).optional(),
    taxRate: z.number().nonnegative().max(100).optional(),
    taxNumber: z.string().max(40).optional(),
    razorpayKeyId: z.string().optional(),
    razorpaySecret: z.string().optional(),
    shiprocketToken: z.string().optional(),
  })
  .strict();

const VariantSchema = z.object({
  name: z.string().min(1),
  values: z.array(z.string().min(1)).min(1),
});

export const CreateProductSchema = z.object({
  name: z.string().min(1).max(120),
  nameAr: z.string().max(120).optional(),
  description: z.string().max(4000).optional(),
  descriptionAr: z.string().max(4000).optional(),
  price: z.number().nonnegative(),
  comparePrice: z.number().nonnegative().optional(),
  images: z.array(z.string().url()).max(5).default([]),
  stock: z.number().int().nonnegative().default(0),
  trackStock: z.boolean().default(true),
  lowStockThreshold: z.number().int().nonnegative().default(5),
  categoryId: z.string().optional(),
  isFeatured: z.boolean().default(false),
  isPublished: z.boolean().default(false),
  isPreOrder: z.boolean().default(false),
  preOrderDeposit: z.number().nonnegative().optional(),
  allowSubscription: z.boolean().default(false),
  variants: z.array(VariantSchema).default([]),
});

export const UpdateProductSchema = CreateProductSchema.partial();

export const CreateCategorySchema = z.object({
  name: z.string().min(1).max(60),
  nameAr: z.string().max(60).optional(),
  imageUrl: z.string().url().optional(),
  sortOrder: z.number().int().default(0),
});

const CartItemSchema = z.object({
  productId: z.string(),
  name: z.string(),
  variant: z.string().optional(),
  price: z.number().nonnegative(),
  qty: z.number().int().positive(),
  image: z.string().optional(),
});

export const CreateOrderSchema = z.object({
  shopId: z.string(),
  customerName: z.string().min(1).max(80),
  customerPhone: z.string().min(6).max(20),
  customerAddress: z.string().max(300).optional(),
  notes: z.string().max(500).optional(),
  items: z.array(CartItemSchema).min(1),
  discountCode: z.string().optional(),
  paymentMethod: z.enum(["TELR", "STRIPE", "UPI", "COD", "WHATSAPP", "RAZORPAY"]).default("WHATSAPP"),
});

export const CreateBroadcastSchema = z.object({
  name: z.string().min(1).max(80),
  message: z.string().min(1).max(1000),
  mediaUrl: z.string().url().optional(),
  targetTags: z.array(z.string()).default([]),
  scheduledAt: z.coerce.date().optional(),
});

export const CreateDiscountSchema = z.object({
  code: z.string().min(2).max(30),
  type: z.enum(["PERCENT", "FIXED", "BOGO"]).default("PERCENT"),
  value: z.number().positive(),
  minOrder: z.number().nonnegative().default(0),
  maxUses: z.number().int().positive().optional(),
  expiresAt: z.coerce.date().optional(),
});

export const ValidateDiscountSchema = z.object({
  code: z.string().min(1),
  shopId: z.string(),
  orderTotal: z.number().nonnegative(),
  items: z.array(z.object({ price: z.number().nonnegative(), qty: z.number().int().positive() })).optional(),
});

export type CartItem = z.infer<typeof CartItemSchema>;
