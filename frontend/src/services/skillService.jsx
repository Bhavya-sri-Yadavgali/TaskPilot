import API from "./api";

export const getSkills = async () => {
  const res = await API.get("/skills");
  return res.data;
};

export const addSkill = async (skill) => {
  const res = await API.post("/skills", skill);
  return res.data;
};
