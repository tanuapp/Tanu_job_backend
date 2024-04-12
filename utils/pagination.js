const paginate = async function (page, limit, model, query) {
  query = query || {}; // Ensure query is initialized if not provided
  const total = await model.countDocuments(query);
  const pageCount = Math.ceil(total / limit);
  const start = (page - 1) * limit + 1;
  let end = start + limit - 1;
  if (end > total) end = total;

  const pagination = { total, pageCount, start, end, limit };

  if (page < pageCount) pagination.nextPage = page + 1;
  if (page > 1) pagination.prevPage = page - 1;

  return pagination;
};

module.exports = paginate;
