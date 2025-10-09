export const successResponse = async (req, res, datas) => {
  res.send({
    status: datas.status,
    code: datas.code || 200,
    message: datas.message || "Success Response!",
    data: datas.data || null,
  });
};

export const errorResponse = async (req, res, errors) => {
  res.send({
    status: false,
    code: errors.code || 500,
    message: errors.message || "Internal Server Error!",
    data: errors.data || null,
  });
};

export const renderResponse = async (req, res, data) => {
  res.render(data.pageName, { title: data.title, data: data.data, req });
};