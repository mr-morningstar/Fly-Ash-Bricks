'use strict';

/**
 * APIFeatures — Fluent helper for database-level search/filter/sort/paginate.
 *
 * Usage in controller:
 *   const features = new APIFeatures(Labour.find(), req.query)
 *     .search(['name', 'phone', 'address'])
 *     .filter()
 *     .sort()
 *     .limitFields()
 *     .paginate();
 *   const data = await features.query;
 */
class APIFeatures {
  /**
   * @param {mongoose.Query} query   — Mongoose query object (e.g. Model.find())
   * @param {object} queryString     — req.query
   */
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }

  /**
   * search — Applies a regex search across specified text fields.
   * Triggered by ?q=<searchTerm>
   * @param {string[]} fields — model fields to search across
   */
  search(fields = []) {
    const { q } = this.queryString;
    if (q && fields.length > 0) {
      const regex = { $regex: q, $options: 'i' };
      this.query = this.query.find({
        $or: fields.map((f) => ({ [f]: regex })),
      });
    }
    return this;
  }

  /**
   * dateRange — Applies a date range filter on a specified field (default: date or createdAt)
   * Triggered by ?startDate=... & ?endDate=...
   */
  dateRange(field = 'createdAt') {
    const { startDate, endDate } = this.queryString;
    if (startDate || endDate) {
      const dateFilter = {};
      if (startDate) dateFilter.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setUTCHours(23, 59, 59, 999);
        dateFilter.$lte = end;
      }
      this.query = this.query.find({ [field]: dateFilter });
    }
    return this;
  }

  /**
   * filter — Strips reserved query params and applies the rest as exact-match filters.
   * Supports MongoDB operators: [gt], [gte], [lt], [lte], [in]
   * Reserved params: q, sort, fields, page, limit, startDate, endDate
   */
  filter() {
    const reserved = ['q', 'sort', 'fields', 'page', 'limit', 'startDate', 'endDate'];
    const queryObj = { ...this.queryString };
    reserved.forEach((k) => delete queryObj[k]);

    // Convert operator syntax: { price: { gt: '100' } } → { price: { $gt: '100' } }
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, (match) => `$${match}`);

    this.query = this.query.find(JSON.parse(queryStr));
    return this;
  }

  /**
   * sort — Applies sort order.
   * ?sort=-createdAt  → descending by createdAt
   * ?sort=name,-date  → multi-sort
   * Default: newest first (-createdAt)
   */
  sort() {
    if (this.queryString.sort) {
      const sortBy = this.queryString.sort.split(',').join(' ');
      this.query = this.query.sort(sortBy);
    } else {
      this.query = this.query.sort('-createdAt');
    }
    return this;
  }

  /**
   * limitFields — Selects only requested fields.
   * ?fields=name,phone → only return those fields
   */
  limitFields() {
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(',').join(' ');
      this.query = this.query.select(fields);
    } else {
      this.query = this.query.select('-__v');
    }
    return this;
  }

  /**
   * paginate — Skips and limits results.
   * ?page=2&limit=20
   * Default: page=1, limit=20
   */
  paginate() {
    const page = Math.max(parseInt(this.queryString.page, 10) || 1, 1);
    const limit = Math.min(parseInt(this.queryString.limit, 10) || 20, 100);
    const skip = (page - 1) * limit;

    this.query = this.query.skip(skip).limit(limit);
    this._page = page;
    this._limit = limit;
    return this;
  }

  /** Helpers to expose pagination meta */
  get page() { return this._page || 1; }
  get limit() { return this._limit || 20; }
}

module.exports = { APIFeatures };
