import { z } from "zod";

export const LoginSchema = z.object({
  email: z.string().email("Email không đúng định dạng.").max(254),
  password: z.string().min(6, "Mật khẩu tối thiểu 6 ký tự."),
});

export const HeadingBlockSchema = z.object({
  id: z.string().min(1),
  type: z.literal("heading"),
  level: z.union([z.literal(2), z.literal(3)]),
  text: z.string().min(1, "Tiêu đề không được để trống."),
});

export const ParagraphBlockSchema = z.object({
  id: z.string().min(1),
  type: z.literal("paragraph"),
  text: z.string(),
});

export const ListBlockSchema = z.object({
  id: z.string().min(1),
  type: z.literal("list"),
  ordered: z.boolean(),
  items: z.array(z.string()),
});

export const ImageBlockSchema = z.object({
  id: z.string().min(1),
  type: z.literal("image"),
  imageId: z.string().optional(),
  url: z.string().optional(),
  caption: z.string().optional(),
  altText: z.string().optional(),
});

export const CalloutBlockSchema = z.object({
  id: z.string().min(1),
  type: z.literal("callout"),
  variant: z.enum(["info", "warning", "success", "quote"]).optional(),
  title: z.string().optional(),
  text: z.string().min(1, "Nội dung hộp lưu ý không được để trống."),
});

export const ContentBlockSchema = z.discriminatedUnion("type", [
  HeadingBlockSchema,
  ParagraphBlockSchema,
  ListBlockSchema,
  ImageBlockSchema,
  CalloutBlockSchema,
]);

export const LessonContentJsonSchema = z.object({
  version: z.number().int().default(1),
  blocks: z.array(ContentBlockSchema),
});

export const SaveLessonContentSchema = z.object({
  version: z.number().int().min(1, "Phiên bản sửa đổi (version) là bắt buộc."),
  summary: z.string().nullable().optional(),
  contentJson: LessonContentJsonSchema,
});
