import { HttpError } from "../utils/apiResponse.js";
import { getPublicStoreBySlug, getStoreForOwner } from "../services/store.service.js";

export async function requireStore(req, res, next) {
  try {
    if (!req.user?.id) {
      throw new HttpError(401, "Authentication required");
    }

    const store = await getStoreForOwner(req.user.id);

    if (!store) {
      throw new HttpError(404, "Store not found");
    }

    req.store = store;
    next();
  } catch (error) {
    next(error);
  }
}

export async function requirePublicStore(req, res, next) {
  try {
    const slug = req.params.slug || req.validatedQuery?.slug || req.query.slug;

    if (!slug) {
      throw new HttpError(400, "Store slug is required");
    }

    req.store = await getPublicStoreBySlug(slug);
    next();
  } catch (error) {
    next(error);
  }
}
