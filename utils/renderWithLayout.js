module.exports = function renderWithLayout(res, viewPath, data = {}) {
  res.render('layouts/main', { ...data, page: viewPath });
};