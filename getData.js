exports.todaysIncidents = async function () {
  let server_n = 0;
  try {
    const incident = await Incident.find({Animal: { $regex: /^cOW/i }});
    server_n = 12345
  } catch (err) {
    console.log(err);
  }
  return server_n;
};
