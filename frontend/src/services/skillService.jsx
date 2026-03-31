import axios from "axios";

const API = "https://learnmate-o40t.onrender.com/api/skills";

export const getSkills = async () => {
  const res = await axios.get(API);
  return res.data;
};

export const addSkill = async (skill) => {
  const res = await axios.post(API, skill);
  return res.data;
};
