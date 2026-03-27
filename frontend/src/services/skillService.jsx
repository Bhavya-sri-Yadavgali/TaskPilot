import axios from "axios";

const API = "http://localhost:5000/api/skills";

export const getSkills = async () => {
  const res = await axios.get(API);
  return res.data;
};

export const addSkill = async (skill) => {
  const res = await axios.post(API, skill);
  return res.data;
};