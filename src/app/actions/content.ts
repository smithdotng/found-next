"use server";

import slugify from "slugify";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { connectDB } from "@/lib/db";
import { Blog, FeaturedProperty, Project, User } from "@/lib/models";
import { requireUser } from "@/lib/session";
import { filesFrom, removeUpload, saveImage, saveImages, UploadError } from "@/lib/uploads";

type Result = { ok: boolean; message: string; errors?: Record<string, string> } | null;
const s = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();
const num = (fd: FormData, k: string) => {
  const v = parseFloat(s(fd, k).replace(/[^\d.]/g, ""));
  return Number.isFinite(v) ? v : undefined;
};
const lines = (fd: FormData, k: string) =>
  s(fd, k)
    .split(/\r?\n|,(?![^|]*\|)/)
    .map((x) => x.trim())
    .filter(Boolean);
const rows = (fd: FormData, k: string) =>
  s(fd, k)
    .split(/\r?\n/)
    .map((l) => l.split("|").map((c) => c.trim()))
    .filter((c) => c.some(Boolean));

async function uniqueSlug(model: typeof Project | typeof Blog, base: string, excludeId?: string) {
  let slug = base || "item";
  let i = 1;
  while (await model.exists(excludeId ? { slug, _id: { $ne: excludeId } } : { slug })) slug = `${base}-${i++}`;
  return slug;
}

function fileOf(fd: FormData, k: string) {
  const f = fd.get(k);
  return f && typeof f === "object" && (f as File).size > 0 ? (f as File) : null;
}

/* ---------------- Projects ---------------- */

export async function saveProject(_prev: Result, fd: FormData): Promise<Result> {
  await requireUser(["admin"]);
  const id = s(fd, "id");
  const name = s(fd, "name");
  const errors: Record<string, string> = {};
  if (!name) errors.name = "Project name is required";
  if (!s(fd, "developerName")) errors.developerName = "Developer name is required";
  if (!s(fd, "short")) errors.short = "Short description is required";
  if (s(fd, "short").length > 300) errors.short = "Keep the short description under 300 characters";
  if (!s(fd, "long")) errors.long = "Full description is required";
  await connectDB();
  const project = id ? await Project.findById(id) : new Project();
  if (!project) return { ok: false, message: "Project not found" };
  const cover = fileOf(fd, "featuredImage");
  if (!cover && !project.media?.featuredImage) errors.featuredImage = "Add a featured image";
  if (Object.keys(errors).length) return { ok: false, message: "Please fix the highlighted fields.", errors };

  try {
    const media = project.media?.toObject?.() ?? project.media ?? {};
    if (cover) {
      if (media.featuredImage) await removeUpload(media.featuredImage);
      media.featuredImage = await saveImage(cover, "project");
    }
    const keep = new Set(fd.getAll("keepGallery").map(String));
    const oldGallery: { url: string; caption?: string }[] = media.gallery ?? [];
    for (const g of oldGallery) if (!keep.has(g.url)) await removeUpload(g.url);
    const added = await saveImages(filesFrom(fd, "gallery"), "project");
    media.gallery = [...oldGallery.filter((g) => keep.has(g.url)), ...added.map((url) => ({ url, caption: "" }))];
    media.videoTour = s(fd, "videoTour") || undefined;
    media.virtualTour = s(fd, "virtualTour") || undefined;
    media.brochure = s(fd, "brochure") || undefined;

    const slugBase = slugify(name, { lower: true, strict: true });
    project.set({
      name,
      slug: project.name === name && project.slug ? project.slug : await uniqueSlug(Project, slugBase, id || undefined),
      developer: { name: s(fd, "developerName"), website: s(fd, "developerWebsite"), contactEmail: s(fd, "developerEmail"), contactPhone: s(fd, "developerPhone") },
      location: { address: s(fd, "address"), city: s(fd, "city"), state: s(fd, "state"), lga: s(fd, "lga"), googleEarthUrl: s(fd, "googleEarthUrl") },
      description: { short: s(fd, "short"), long: s(fd, "long") },
      amenities: lines(fd, "amenities"),
      features: rows(fd, "features").map(([title, description]) => ({ title, description })),
      specifications: {
        totalUnits: num(fd, "totalUnits"),
        landArea: s(fd, "landArea"),
        completionDate: s(fd, "completionDate") ? new Date(s(fd, "completionDate")) : undefined,
        status: s(fd, "projectStatus") || "upcoming",
        unitSizes: rows(fd, "unitSizes").map(([type, size, price, available]) => ({
          type,
          size,
          price: price ? Number(price.replace(/[^\d.]/g, "")) || undefined : undefined,
          available: available ? Number(available) || 0 : undefined,
        })),
      },
      media,
      pricing: {
        startingPrice: num(fd, "startingPrice"),
        priceRange: { min: num(fd, "priceMin"), max: num(fd, "priceMax") },
        paymentPlan: rows(fd, "paymentPlan").map(([title, percentage, description]) => ({ title, percentage: Number(percentage) || undefined, description })),
        includes: lines(fd, "includes"),
        excludes: lines(fd, "excludes"),
      },
      investment: { roi: s(fd, "roi"), rentalYield: s(fd, "rentalYield"), capitalAppreciation: s(fd, "capitalAppreciation"), highlights: lines(fd, "highlights") },
      seo: { metaTitle: s(fd, "metaTitle"), metaDescription: s(fd, "metaDescription"), metaKeywords: s(fd, "metaKeywords") },
      status: s(fd, "status") || "draft",
      featured: fd.get("featured") === "on",
      order: num(fd, "order") ?? 0,
    });
    // The schema's pre-save hook regenerates the slug from the name without a uniqueness check.
    const slug = project.slug;
    await project.save();
    if (project.slug !== slug) await Project.updateOne({ _id: project._id }, { $set: { slug } });
  } catch (e) {
    console.error("Save project error:", e);
    return { ok: false, message: e instanceof UploadError ? e.message : `Couldn't save project: ${(e as Error).message}` };
  }
  revalidatePath("/projects");
  redirect(`/dashboard/projects?notice=${encodeURIComponent(id ? "Project updated" : "Project created")}`);
}

export async function deleteProject(id: string) {
  await requireUser(["admin"]);
  await connectDB();
  const p = await Project.findById(id);
  if (!p) return { ok: false, message: "Not found" };
  await removeUpload(p.media?.featuredImage);
  for (const g of p.media?.gallery ?? []) await removeUpload(g.url);
  await Project.deleteOne({ _id: id });
  revalidatePath("/dashboard/projects");
  return { ok: true, message: "Project deleted" };
}

/* ---------------- Blog ---------------- */

export async function saveBlog(_prev: Result, fd: FormData): Promise<Result> {
  const session = await requireUser(["admin"]);
  const id = s(fd, "id");
  const title = s(fd, "title");
  const excerpt = s(fd, "excerpt");
  const content = s(fd, "content");
  const errors: Record<string, string> = {};
  if (!title) errors.title = "Title is required";
  if (!excerpt) errors.excerpt = "Excerpt is required";
  if (excerpt.length > 300) errors.excerpt = "Keep the excerpt under 300 characters";
  if (content.length < 50) errors.content = "Write the post body (at least 50 characters)";
  await connectDB();
  const blog = id ? await Blog.findById(id) : new Blog();
  if (!blog) return { ok: false, message: "Post not found" };
  const cover = fileOf(fd, "featuredImage");
  if (!cover && !blog.featuredImage) errors.featuredImage = "Add a featured image";
  if (Object.keys(errors).length) return { ok: false, message: "Please fix the highlighted fields.", errors };

  try {
    if (cover) {
      const old = blog.featuredImage;
      blog.featuredImage = await saveImage(cover, "blog");
      if (!blog.ogImage || blog.ogImage === old) blog.ogImage = blog.featuredImage;
      if (old && old !== blog.ogImage) await removeUpload(old);
    }
    const status = s(fd, "status") || "draft";
    if (!id) {
      const me = await User.findById(session.userId).select("name");
      blog.author = session.userId;
      blog.authorName = s(fd, "authorName") || me?.name || session.userName;
    } else if (s(fd, "authorName")) {
      blog.authorName = s(fd, "authorName");
    }
    if (blog.title !== title) {
      blog.slug = await uniqueSlug(Blog, slugify(title, { lower: true, strict: true }), id || undefined);
    }
    blog.title = title;
    blog.excerpt = excerpt;
    blog.content = content;
    blog.categories = fd.getAll("categories").map(String);
    blog.tags = lines(fd, "tags");
    blog.featured = fd.get("featured") === "on";
    blog.metaTitle = s(fd, "metaTitle");
    blog.metaDescription = s(fd, "metaDescription");
    blog.metaKeywords = s(fd, "metaKeywords");
    if (status === "published" && !blog.publishedAt) blog.publishedAt = new Date();
    blog.status = status;
    // The schema's pre-save hook rewrites the slug when the title changes; keep ours stable.
    const slug = blog.slug;
    await blog.save();
    if (blog.slug !== slug) await Blog.updateOne({ _id: blog._id }, { $set: { slug } });
  } catch (e) {
    console.error("Save blog error:", e);
    return { ok: false, message: e instanceof UploadError ? e.message : `Couldn't save post: ${(e as Error).message}` };
  }
  revalidatePath("/blog");
  redirect(`/dashboard/blog?notice=${encodeURIComponent(id ? "Post updated" : "Post created")}`);
}

export async function deleteBlog(id: string) {
  await requireUser(["admin"]);
  await connectDB();
  const b = await Blog.findById(id);
  if (!b) return { ok: false, message: "Not found" };
  await removeUpload(b.featuredImage);
  await Blog.deleteOne({ _id: id });
  revalidatePath("/dashboard/blog");
  return { ok: true, message: "Post deleted" };
}

/* ---------------- Featured deals ---------------- */

export async function saveFeatured(_prev: Result, fd: FormData): Promise<Result> {
  await requireUser(["admin"]);
  const id = s(fd, "id");
  const errors: Record<string, string> = {};
  if (!s(fd, "property")) errors.property = "Choose a property";
  if (!s(fd, "title")) errors.title = "Add a headline";
  if (!s(fd, "startDate")) errors.startDate = "Choose a start date";
  if (Object.keys(errors).length) return { ok: false, message: "Please fix the highlighted fields.", errors };
  await connectDB();
  const doc = id ? await FeaturedProperty.findById(id) : new FeaturedProperty();
  if (!doc) return { ok: false, message: "Not found" };
  try {
    const img = fileOf(fd, "image");
    if (img) {
      await removeUpload(doc.image);
      doc.image = await saveImage(img, "project");
    }
    doc.set({
      property: s(fd, "property"),
      title: s(fd, "title"),
      description: s(fd, "description"),
      badge: { text: s(fd, "badgeText"), color: s(fd, "badgeColor") || "#cb4850" },
      arrangementType: s(fd, "arrangementType") || "special_deal",
      partnerDetails: { name: s(fd, "partnerName"), contact: s(fd, "partnerContact") },
      startDate: new Date(s(fd, "startDate")),
      endDate: s(fd, "endDate") ? new Date(s(fd, "endDate")) : undefined,
      isActive: fd.get("isActive") === "on",
      displayOrder: num(fd, "displayOrder") ?? 0,
    });
    await doc.save();
  } catch (e) {
    return { ok: false, message: e instanceof UploadError ? e.message : `Couldn't save: ${(e as Error).message}` };
  }
  revalidatePath("/");
  redirect(`/dashboard/featured?notice=${encodeURIComponent(id ? "Featured deal updated" : "Featured deal added")}`);
}

export async function deleteFeatured(id: string) {
  await requireUser(["admin"]);
  await connectDB();
  const d = await FeaturedProperty.findById(id);
  if (d?.image) await removeUpload(d.image);
  await FeaturedProperty.deleteOne({ _id: id });
  revalidatePath("/dashboard/featured");
  return { ok: true, message: "Featured deal removed" };
}

export async function toggleFeaturedActive(id: string) {
  await requireUser(["admin"]);
  await connectDB();
  const d = await FeaturedProperty.findById(id);
  if (!d) return { ok: false, message: "Not found" };
  d.isActive = !d.isActive;
  await d.save();
  revalidatePath("/dashboard/featured");
  return { ok: true, message: d.isActive ? "Now showing on the home page" : "Hidden from the home page" };
}
